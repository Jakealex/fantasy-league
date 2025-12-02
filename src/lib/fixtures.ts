import { prisma } from "@/lib/prisma";

/**
 * Get all fixtures with their relations (events, gameweek)
 */
export async function getFixturesWithRelations(gameweekId?: number) {
  return prisma.fixture.findMany({
    where: gameweekId ? { gameweekId } : undefined,
    include: {
      gameweek: true,
      events: {
        include: {
          player: true,
        },
        orderBy: {
          minute: "asc",
        },
      },
    },
    orderBy: {
      kickoffAt: "asc",
    },
  });
}

/**
 * Get a single fixture with all relations
 */
export async function getFixtureWithRelations(fixtureId: string) {
  return prisma.fixture.findUnique({
    where: { id: fixtureId },
    include: {
      gameweek: true,
      events: {
        include: {
          player: true,
        },
        orderBy: {
          minute: "asc",
        },
      },
    },
  });
}

/**
 * Get all players for a specific team name
 */
export async function getPlayersByTeamName(teamName: string) {
  return prisma.player.findMany({
    where: { teamName },
    orderBy: { name: "asc" },
  });
}

/**
 * Get players from both teams in a fixture
 */
export async function getPlayersForFixture(fixtureId: string) {
  const fixture = await prisma.fixture.findUnique({
    where: { id: fixtureId },
    select: {
      homeTeam: true,
      awayTeam: true,
    },
  });

  if (!fixture) {
    return { homePlayers: [], awayPlayers: [] };
  }

  const [homePlayers, awayPlayers] = await Promise.all([
    getPlayersByTeamName(fixture.homeTeam),
    getPlayersByTeamName(fixture.awayTeam),
  ]);

  return { homePlayers, awayPlayers, fixture };
}

/**
 * Get all unique team names from players
 * Useful for populating fixture team selection dropdowns
 */
export async function getAllTeamNames() {
  const players = await prisma.player.findMany({
    select: { teamName: true },
    distinct: ["teamName"],
    orderBy: { teamName: "asc" },
  });

  return players.map((p) => p.teamName);
}

/**
 * Validate fixture data before creation/update
 */
export function validateFixtureData(data: {
  homeTeam: string;
  awayTeam: string;
  gameweekId: number;
  kickoffAt: Date;
  homeGoals?: number | null;
  awayGoals?: number | null;
}) {
  const errors: string[] = [];

  if (!data.homeTeam || data.homeTeam.trim() === "") {
    errors.push("Home team is required");
  }

  if (!data.awayTeam || data.awayTeam.trim() === "") {
    errors.push("Away team is required");
  }

  if (data.homeTeam === data.awayTeam) {
    errors.push("Home team and away team cannot be the same");
  }

  if (!data.gameweekId || data.gameweekId < 1) {
    errors.push("Valid gameweek is required");
  }

  if (data.homeGoals !== null && data.homeGoals !== undefined && data.homeGoals < 0) {
    errors.push("Home goals cannot be negative");
  }

  if (data.awayGoals !== null && data.awayGoals !== undefined && data.awayGoals < 0) {
    errors.push("Away goals cannot be negative");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

