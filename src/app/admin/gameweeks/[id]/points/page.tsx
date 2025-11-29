import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import GameweekPointsClient from "./GameweekPointsClient";

export default async function GameweekPointsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) redirect("/");

  const { id } = await params;
  const gameweekId = Number(id);
  if (isNaN(gameweekId)) {
    throw new Error("Invalid gameweek ID");
  }

  const gameweek = await prisma.gameweek.findUnique({
    where: { id: gameweekId },
  });

  if (!gameweek) {
    throw new Error("Gameweek not found");
  }

  const players = await prisma.player.findMany({
    orderBy: { name: "asc" },
  });

  const existingPoints = await prisma.playerPoints.findMany({
    where: { gameweekId },
  });

  // Build a map: playerId -> all stats
  const statsByPlayerId = Object.fromEntries(
    existingPoints.map((pp) => [
      pp.playerId,
      {
        points: pp.points,
        goals: pp.goals,
        assists: pp.assists,
        ownGoals: pp.ownGoals,
        yellowCards: pp.yellowCards,
        redCards: pp.redCards,
        goalsConceded: pp.goalsConceded,
      },
    ])
  );

  const playersWithPoints = players.map((p) => {
    const stats = statsByPlayerId[p.id] ?? {
      points: 0,
      goals: 0,
      assists: 0,
      ownGoals: 0,
      yellowCards: 0,
      redCards: 0,
      goalsConceded: 0,
    };
    return {
      id: p.id,
      name: p.name,
      teamName: p.teamName,
      position: p.position,
      ...stats,
    };
  });

  return (
    <GameweekPointsClient
      gameweek={{
        id: gameweek.id,
        number: gameweek.number,
        name: gameweek.name,
      }}
      players={playersWithPoints}
      isFinished={gameweek.isFinished}
    />
  );
}

