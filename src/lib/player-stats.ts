import { prisma } from "@/lib/prisma";

/**
 * Updates season totals (totalPoints, goals, assists) for all players
 * by aggregating PlayerPoints from all finished gameweeks.
 * This is idempotent - rerunning will recompute from all finished gameweeks.
 */
export async function updatePlayerSeasonStats(): Promise<void> {
  // 1. Get all finished gameweek IDs
  const finishedGameweeks = await prisma.gameweek.findMany({
    where: { isFinished: true },
    select: { id: true },
  });

  const finishedGameweekIds = finishedGameweeks.map((gw) => gw.id);

  // Edge case: No finished gameweeks yet
  if (finishedGameweekIds.length === 0) {
    // Reset all players to 0
    await prisma.player.updateMany({
      data: {
        totalPoints: 0,
        goals: 0,
        assists: 0,
      },
    });
    console.log("[updatePlayerSeasonStats] No finished gameweeks. Reset all players to 0.");
    return;
  }

  // 2. Aggregate PlayerPoints by playerId for finished gameweeks
  const totals = await prisma.playerPoints.groupBy({
    by: ["playerId"],
    where: {
      gameweekId: { in: finishedGameweekIds },
    },
    _sum: {
      points: true,
      goals: true,
      assists: true,
    },
  });

  // 3. Build a map of playerId -> aggregated stats
  const statsMap = new Map<
    string,
    {
      totalPoints: number;
      goals: number;
      assists: number;
    }
  >();

  for (const total of totals) {
    statsMap.set(total.playerId, {
      totalPoints: total._sum.points ?? 0,
      goals: total._sum.goals ?? 0,
      assists: total._sum.assists ?? 0,
    });
  }

  // 4. Get all players to ensure we update everyone (including those with 0 stats)
  const allPlayers = await prisma.player.findMany({
    select: { id: true },
  });

  // 5. Update all players (set to 0 if no PlayerPoints found)
  const updatePromises = allPlayers.map((player) => {
    const stats = statsMap.get(player.id) ?? {
      totalPoints: 0,
      goals: 0,
      assists: 0,
    };

    return prisma.player.update({
      where: { id: player.id },
      data: {
        totalPoints: stats.totalPoints,
        goals: stats.goals,
        assists: stats.assists,
      },
    });
  });

  await Promise.all(updatePromises);

  console.log(
    `[updatePlayerSeasonStats] Updated ${allPlayers.length} players from ${finishedGameweekIds.length} finished gameweeks.`
  );
}

/**
 * Calculates and updates ownership percentage (ownedPct) for all players.
 * ownedPct = (number of teams with this player in squad) / (total teams) * 100
 * This is idempotent - rerunning will recalculate from current squad slots.
 */
export async function updatePlayerOwnershipPct(): Promise<void> {
  // 1. Get total number of teams
  const totalTeams = await prisma.team.count();

  // Edge case: No teams exist
  if (totalTeams === 0) {
    // Set all players to 0% owned
    await prisma.player.updateMany({
      data: { ownedPct: 0 },
    });
    console.log("[updatePlayerOwnershipPct] No teams exist. Set all players to 0% owned.");
    return;
  }

  // 2. Count how many teams have each player in their squad
  // Group by playerId and count distinct teamIds
  const ownershipCounts = await prisma.squadSlot.groupBy({
    by: ["playerId"],
    where: {
      playerId: { not: null },
    },
    _count: {
      teamId: true,
    },
  });

  // 3. Build a map of playerId -> ownership count
  const ownershipMap = new Map<string, number>();

  for (const count of ownershipCounts) {
    if (count.playerId) {
      ownershipMap.set(count.playerId, count._count.teamId);
    }
  }

  // 4. Get all players to ensure we update everyone
  const allPlayers = await prisma.player.findMany({
    select: { id: true },
  });

  // 5. Calculate percentage and update all players
  const updatePromises = allPlayers.map((player) => {
    const ownedByTeams = ownershipMap.get(player.id) ?? 0;
    const ownedPct = totalTeams > 0 ? (ownedByTeams / totalTeams) * 100 : 0;

    return prisma.player.update({
      where: { id: player.id },
      data: { ownedPct },
    });
  });

  await Promise.all(updatePromises);

  console.log(
    `[updatePlayerOwnershipPct] Updated ownership for ${allPlayers.length} players across ${totalTeams} teams.`
  );
}

