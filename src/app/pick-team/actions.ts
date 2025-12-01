"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentGameweek } from "@/lib/gameweek";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function getTeamForCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  
  // Find user's team - check all leagues they're a member of
  const userTeam = await prisma.team.findFirst({
    where: { userId: user.id },
  });
  
  if (!userTeam) {
    throw new Error("User has no team");
  }
  
  return userTeam;
}

export async function setCaptainAction(slotId: string) {
  try {
    const currentGameweek = await getCurrentGameweek();
    if (!currentGameweek) {
      return { ok: false, message: "No current gameweek configured" };
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
      return { ok: false, message: "Captain changes are locked for this gameweek." };
    }

    // Find the user's team
    let team;
    try {
      team = await getTeamForCurrentUser();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not find your team.";
      console.error("[setCaptainAction] getTeamForCurrentUser error:", error);
      return { ok: false, message };
    }

    // Ensure the slot belongs to this team
    const targetSlot = await prisma.squadSlot.findUnique({
      where: { id: slotId },
    });

    if (!targetSlot || targetSlot.teamId !== team.id) {
      return { ok: false, message: "Invalid squad slot." };
    }

    // Ensure slot has a player
    if (!targetSlot.playerId) {
      return { ok: false, message: "Cannot set captain on empty slot." };
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

    console.log("[setCaptainAction] Captain set successfully for slot:", slotId, "team:", team.id);

    revalidatePath("/pick-team");

    return { ok: true, message: "Captain set successfully." };
  } catch (error) {
    console.error("[setCaptainAction] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to set captain.";
    return { ok: false, message };
  }
}

