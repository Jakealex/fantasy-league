import { prisma } from "@/lib/prisma";

/**
 * Calculates all team scores for a gameweek.
 */
export async function calculateGameweekScores(gameweekId: number) {
  // 1. Fetch gameweek
  const gameweek = await prisma.gameweek.findUnique({
    where: { id: gameweekId },
  });
  if (!gameweek) {
    throw new Error("Gameweek not found");
  }

  // 2. Fetch all teams
  const teams = await prisma.team.findMany();

  // 3. Fetch all PlayerPoints for this gameweek
  const playerPointsRows = await prisma.playerPoints.findMany({
    where: { gameweekId },
  });

  // map playerId -> points (use the calculated points field directly)
  const pointsMap = Object.fromEntries(
    playerPointsRows.map((pp) => [pp.playerId, pp.points ?? 0])
  );

  // 4. Process each team
  for (const team of teams) {
    const slots = await prisma.squadSlot.findMany({
      where: { teamId: team.id },
      include: { player: true },
    });

    if (slots.length !== 5) {
      console.warn(
        `Team "${team.name}" (${team.id}) has ${slots.length} slots instead of 5. Skipping scoring for this team.`
      );
      continue;
    }

    let teamTotal = 0;
    let captainPoints = 0;

    for (const slot of slots) {
      const player = slot.player;
      if (!player) {
        console.warn("Slot with no player:", slot.id);
        continue;
      }

      // Get player points from PlayerPoints table (already calculated)
      const playerPointsRow = playerPointsRows.find((pp) => pp.playerId === player.id);
      const basePoints = playerPointsRow?.points ?? 0;

      // Add base points to team total
      teamTotal += basePoints;

      // If captain, track for doubling (we'll subtract base and add double)
      if (slot.isCaptain) {
        captainPoints = basePoints; // Store captain's base points
      }
    }

    // Apply captain double: subtract captain's base points, add double
    if (captainPoints > 0) {
      teamTotal = teamTotal - captainPoints + (captainPoints * 2);
    }

    // Store score in GameweekScore table
    await prisma.gameweekScore.upsert({
      where: {
        teamId_gameweekId: {
          teamId: team.id,
          gameweekId,
        },
      },
      update: { total: teamTotal },
      create: { teamId: team.id, gameweekId, total: teamTotal },
    });
  }
}

/**
 * Scoring rules constants
 */
export const SCORING_RULES = {
  GOAL: 5,
  ASSIST: 3,
  OWN_GOAL: -2,
  YELLOW_CARD: -1,
  RED_CARD: -3,
  GK_BASE: 7, // 7 - goalsConceded (can be negative)
  OUTFIELD_CLEAN_SHEET: 1, // +1 if goalsConceded == 0
} as const;

/**
 * Calculates PlayerPoints for all players in a gameweek based on fixtures and score events.
 * This is idempotent - rerunning will update existing PlayerPoints records.
 */
export async function calculatePlayerPoints(gameweekId: number) {
  // 1. Fetch gameweek
  const gameweek = await prisma.gameweek.findUnique({
    where: { id: gameweekId },
  });
  if (!gameweek) {
    throw new Error("Gameweek not found");
  }

  // 2. Fetch all fixtures for this gameweek with events
  const fixtures = await prisma.fixture.findMany({
    where: { gameweekId },
    include: {
      events: {
        include: {
          player: true,
        },
      },
    },
  });

  // 3. Build a map of playerId -> aggregated stats for this gameweek
  const playerStatsMap = new Map<
    string,
    {
      goals: number;
      assists: number;
      ownGoals: number;
      yellowCards: number;
      redCards: number;
      goalsConceded: number;
      teamName: string;
      position: "GK" | "OUT";
    }
  >();

  // 4. Process each fixture
  for (const fixture of fixtures) {
    // Skip if fixture doesn't have final score
    if (fixture.homeGoals === null || fixture.awayGoals === null) {
      continue;
    }

    const homeGoals = fixture.homeGoals;
    const awayGoals = fixture.awayGoals;

    // Get all players from both teams to initialize goalsConceded
    const homePlayers = await prisma.player.findMany({
      where: { teamName: fixture.homeTeam },
      select: { id: true, teamName: true, position: true },
    });

    const awayPlayers = await prisma.player.findMany({
      where: { teamName: fixture.awayTeam },
      select: { id: true, teamName: true, position: true },
    });

    // Initialize goalsConceded for all players in this fixture
    for (const player of homePlayers) {
      if (!playerStatsMap.has(player.id)) {
        playerStatsMap.set(player.id, {
          goals: 0,
          assists: 0,
          ownGoals: 0,
          yellowCards: 0,
          redCards: 0,
          goalsConceded: awayGoals, // Home team concedes away goals
          teamName: player.teamName,
          position: player.position,
        });
      } else {
        const stats = playerStatsMap.get(player.id)!;
        stats.goalsConceded += awayGoals;
      }
    }

    for (const player of awayPlayers) {
      if (!playerStatsMap.has(player.id)) {
        playerStatsMap.set(player.id, {
          goals: 0,
          assists: 0,
          ownGoals: 0,
          yellowCards: 0,
          redCards: 0,
          goalsConceded: homeGoals, // Away team concedes home goals
          teamName: player.teamName,
          position: player.position,
        });
      } else {
        const stats = playerStatsMap.get(player.id)!;
        stats.goalsConceded += homeGoals;
      }
    }

    // Process score events
    for (const event of fixture.events) {
      const playerId = event.playerId;
      let stats = playerStatsMap.get(playerId);

      // Initialize if player not in map yet (shouldn't happen, but safety check)
      if (!stats) {
        const player = await prisma.player.findUnique({
          where: { id: playerId },
          select: { teamName: true, position: true },
        });
        if (!player) continue;

        // Determine goalsConceded based on which team the player is on
        const goalsConceded =
          player.teamName === fixture.homeTeam ? awayGoals : homeGoals;

        stats = {
          goals: 0,
          assists: 0,
          ownGoals: 0,
          yellowCards: 0,
          redCards: 0,
          goalsConceded,
          teamName: player.teamName,
          position: player.position,
        };
        playerStatsMap.set(playerId, stats);
      }

      // Aggregate events
      switch (event.type) {
        case "GOAL":
          stats.goals++;
          break;
        case "ASSIST":
          stats.assists++;
          break;
        case "OG":
          stats.ownGoals++;
          break;
        case "YC":
          stats.yellowCards++;
          break;
        case "RC":
          stats.redCards++;
          break;
      }
    }
  }

  // 5. Calculate points for each player and upsert PlayerPoints
  for (const [playerId, stats] of playerStatsMap.entries()) {
    let points = 0;

    // Base scoring from events
    points += stats.goals * SCORING_RULES.GOAL;
    points += stats.assists * SCORING_RULES.ASSIST;
    points += stats.ownGoals * SCORING_RULES.OWN_GOAL;

    // Cards (red card overrides yellow)
    if (stats.redCards > 0) {
      points += SCORING_RULES.RED_CARD;
    } else {
      points += stats.yellowCards * SCORING_RULES.YELLOW_CARD;
    }

    // Goalkeeper rule: 7 - goalsConceded (can be negative)
    if (stats.position === "GK") {
      points += SCORING_RULES.GK_BASE - stats.goalsConceded;
    }

    // Outfield clean sheet: +1 if goalsConceded == 0
    if (stats.position === "OUT" && stats.goalsConceded === 0) {
      points += SCORING_RULES.OUTFIELD_CLEAN_SHEET;
    }

    // Upsert PlayerPoints
    await prisma.playerPoints.upsert({
      where: {
        playerId_gameweekId: {
          playerId,
          gameweekId,
        },
      },
      update: {
        points,
        goals: stats.goals,
        assists: stats.assists,
        ownGoals: stats.ownGoals,
        yellowCards: stats.yellowCards,
        redCards: stats.redCards,
        goalsConceded: stats.goalsConceded,
      },
      create: {
        playerId,
        gameweekId,
        points,
        goals: stats.goals,
        assists: stats.assists,
        ownGoals: stats.ownGoals,
        yellowCards: stats.yellowCards,
        redCards: stats.redCards,
        goalsConceded: stats.goalsConceded,
      },
    });
  }
}

