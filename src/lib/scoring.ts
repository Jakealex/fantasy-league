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

  // map playerId -> stats
  const statsMap = Object.fromEntries(
    playerPointsRows.map((pp) => [
      pp.playerId,
      {
        goals: pp.goals ?? 0,
        assists: pp.assists ?? 0,
        ownGoals: pp.ownGoals ?? 0,
        yellowCards: pp.yellowCards ?? 0,
        redCards: pp.redCards ?? 0,
        goalsConceded: pp.goalsConceded ?? 0,
      },
    ])
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

    for (const slot of slots) {
      const player = slot.player;
      if (!player) {
        console.warn("Slot with no player:", slot.id);
        continue;
      }

      const stats = statsMap[player.id] || {
        goals: 0,
        assists: 0,
        ownGoals: 0,
        yellowCards: 0,
        redCards: 0,
        goalsConceded: 0,
      };

      let pts = 0;

      // Base scoring
      pts += stats.goals * 5;
      pts += stats.assists * 3;
      pts += stats.ownGoals * -2;

      // Cards
      if (stats.redCards > 0) {
        pts += -3;
      } else {
        pts += stats.yellowCards * -1;
      }

      // Goalkeeper rule
      if (player.position === "GK") {
        pts += 7 - stats.goalsConceded;
      }

      // Outfield rule
      if (player.position === "OUT") {
        if (stats.goalsConceded <= 3) {
          pts += 1;
        }
      }

      // Captain double points
      if (slot.isCaptain) {
        pts *= 2;
      }

      teamTotal += pts;
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

