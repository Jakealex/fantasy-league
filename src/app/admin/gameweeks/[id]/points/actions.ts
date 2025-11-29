"use server";

import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";

export async function savePlayerPointsAction(formData: FormData) {
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    throw new Error("Unauthorized");
  }

  const gameweekId = Number(formData.get("gameweekId"));
  if (isNaN(gameweekId)) {
    throw new Error("Invalid gameweek ID");
  }

  const raw = formData.get("statsJson") as string | null;
  if (!raw) throw new Error("Missing stats data");

  let parsed: Array<{
    playerId: string;
    points: number;
    goals: number;
    assists: number;
    ownGoals: number;
    yellowCards: number;
    redCards: number;
    goalsConceded: number;
  }>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid stats data format");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Stats data must be an array");
  }

  // Validate all entries
  for (const row of parsed) {
    if (
      typeof row.playerId !== "string" ||
      typeof row.points !== "number" ||
      typeof row.goals !== "number" ||
      typeof row.assists !== "number" ||
      typeof row.ownGoals !== "number" ||
      typeof row.yellowCards !== "number" ||
      typeof row.redCards !== "number" ||
      typeof row.goalsConceded !== "number"
    ) {
      throw new Error("Invalid stats entry format");
    }
    if (
      row.points < 0 ||
      row.goals < 0 ||
      row.assists < 0 ||
      row.ownGoals < 0 ||
      row.yellowCards < 0 ||
      row.redCards < 0 ||
      row.goalsConceded < 0
    ) {
      throw new Error("Stats cannot be negative");
    }
  }

  // Upsert all stats in a transaction
  await prisma.$transaction(
    parsed.map((row) =>
      prisma.playerPoints.upsert({
        where: {
          playerId_gameweekId: {
            playerId: row.playerId,
            gameweekId,
          },
        },
        update: {
          points: row.points,
          goals: row.goals,
          assists: row.assists,
          ownGoals: row.ownGoals,
          yellowCards: row.yellowCards,
          redCards: row.redCards,
          goalsConceded: row.goalsConceded,
        },
        create: {
          playerId: row.playerId,
          gameweekId,
          points: row.points,
          goals: row.goals,
          assists: row.assists,
          ownGoals: row.ownGoals,
          yellowCards: row.yellowCards,
          redCards: row.redCards,
          goalsConceded: row.goalsConceded,
        },
      })
    )
  );
}

