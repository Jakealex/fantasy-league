"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentGameweek } from "@/lib/gameweek";

async function getTeamForCurrentUser() {
  const user = await prisma.user.findFirstOrThrow();
  const league = await prisma.league.findFirstOrThrow({ where: { ownerId: user.id } });
  const team = await prisma.team.findFirst({
    where: { userId: user.id, leagueId: league.id },
  });

  if (team) {
    return team;
  }

  const created = await prisma.team.create({
    data: { name: "Admin XI", userId: user.id, leagueId: league.id, budget: 34 },
  });

  // Ensure slots exist
  const REQUIRED_SLOT_LABELS = ["GK1", "OUT1", "OUT2", "OUT3", "OUT4"] as const;
  await Promise.all(
    REQUIRED_SLOT_LABELS.map((slotLabel) =>
      prisma.squadSlot.upsert({
        where: { teamId_slotLabel: { teamId: created.id, slotLabel } },
        update: {},
        create: { teamId: created.id, slotLabel },
      })
    )
  );
  return created;
}

export async function setCaptainAction(slotId: string) {
  const currentGameweek = await getCurrentGameweek();
  if (!currentGameweek) {
    throw new Error("No current gameweek configured");
  }

  const now = new Date();

  // Lock conditions – must match transfers logic
  const isLocked =
    currentGameweek.isFinished ||
    currentGameweek.deadlineAt < now;

  // Optionally also block if transfers are closed
  const settings = await prisma.globalSettings.findUnique({ where: { id: 1 } });
  const transfersOpen = settings?.transfersOpen ?? true;

  if (isLocked || !transfersOpen) {
    throw new Error("Captain changes are locked for this gameweek.");
  }

  // Find the user's team
  const team = await getTeamForCurrentUser();

  // Ensure the slot belongs to this team
  const targetSlot = await prisma.squadSlot.findUnique({
    where: { id: slotId },
  });

  if (!targetSlot || targetSlot.teamId !== team.id) {
    throw new Error("Invalid squad slot.");
  }

  // Ensure slot has a player
  if (!targetSlot.playerId) {
    throw new Error("Cannot set captain on empty slot.");
  }

  // Transaction:
  // - clear all captains for this team
  // - set captain on the chosen slot
  await prisma.$transaction([
    prisma.squadSlot.updateMany({
      where: { teamId: team.id, isCaptain: true },
      data: { isCaptain: false },
    }),
    prisma.squadSlot.update({
      where: { id: slotId },
      data: { isCaptain: true },
    }),
  ]);
}

