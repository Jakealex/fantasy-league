"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * TODO: replace with real auth + selected league scoping.
 * For now we grab the first team with its slots.
 */
async function getActiveTeam() {
  const team = await prisma.team.findFirst({
    include: { slots: { include: { player: true } } },
  });
  if (!team) throw new Error("No team found. Create a Team first.");
  return team;
}

// If you truly only want 1 GK + 4 OUT, set GK_SLOTS to ["GK1"].
const GK_SLOTS = ["GK1", "GK2"] as const;
// explicit string[] (avoid const assertion warning on Vercel)
const OUT_SLOTS: string[] = Array.from({ length: 13 }, (_, i) => `OUT${i + 1}`);

function nextFreeSlotLabel(isGK: boolean, used: string[]): string | null {
  const pool = isGK ? GK_SLOTS : OUT_SLOTS;
  for (const label of pool) {
    if (!used.includes(label)) return label;
  }
  return null;
}

/* ------------------------ ADD TO SQUAD (core) ------------------------ */

async function _addToSquadCore(playerId: string): Promise<void> {
  if (!playerId) throw new Error("Missing playerId");

  const team = await getActiveTeam();

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) throw new Error("Player not found");

  // Prevent duplicates
  const alreadyInSquad = await prisma.squadSlot.findFirst({
    where: { teamId: team.id, playerId: player.id },
  });
  if (alreadyInSquad) throw new Error("Player already in your squad");

  // Budget check
  if (team.budget < player.price) throw new Error("Not enough budget");

  // Capacity check
  const usedLabels = team.slots.map((s: { slotLabel: string }) => s.slotLabel);

  const isGK = player.position === "GK";
  const slotLabel = nextFreeSlotLabel(isGK, usedLabels);
  if (!slotLabel) throw new Error(isGK ? "No GK slots free" : "No OUT slots free");

  // Create slot & decrement budget atomically
  await prisma.$transaction([
    prisma.squadSlot.create({
      data: { teamId: team.id, playerId: player.id, slotLabel },
    }),
    prisma.team.update({
      where: { id: team.id },
      data: { budget: { decrement: player.price } },
    }),
  ]);

  revalidatePath("/transfers");
}

/** ✅ Server Action for <form action={addToSquadAction}> */
export async function addToSquadAction(formData: FormData): Promise<void> {
  const playerId = formData.get("playerId");
  if (typeof playerId !== "string" || !playerId) {
    throw new Error("Invalid playerId");
  }
  await _addToSquadCore(playerId);
}

/* ----------------------- REMOVE FROM SQUAD ----------------------- */

/**
 * Removes a player from the active team and refunds the budget.
 * Accepts either:
 *  - playerId (preferred), or
 *  - slotLabel (fallback if you wire the left-side remove by slot)
 *
 * Usage from client:
 *   const fd = new FormData();
 *   fd.append("playerId", playerId); // or fd.append("slotLabel", "OUT3")
 *   await removeFromSquadAction(fd);
 */
export async function removeFromSquadAction(formData: FormData): Promise<void> {
  const team = await getActiveTeam();

  const playerId = formData.get("playerId");
  const slotLabel = formData.get("slotLabel");

  if (typeof playerId !== "string" && typeof slotLabel !== "string") {
    throw new Error("Provide playerId or slotLabel");
  }

  // Find the slot we’re removing (scoped to the active team)
  const slot = await prisma.squadSlot.findFirst({
    where: {
      teamId: team.id,
      ...(typeof playerId === "string" ? { playerId } : {}),
      ...(typeof slotLabel === "string" ? { slotLabel } : {}),
    },
    include: { player: true },
  });

  if (!slot) {
    // Nothing to do; treat as success for idempotency
    return;
  }
  if (!slot.player) {
    // If schema allows null playerId, just delete the empty slot
    await prisma.squadSlot.delete({ where: { id: slot.id } });
    revalidatePath("/transfers");
    return;
  }

  // Refund amount = that player's price
  const refund = slot.player.price;

  // Delete slot & increment budget atomically
  await prisma.$transaction([
    prisma.squadSlot.delete({ where: { id: slot.id } }),
    prisma.team.update({
      where: { id: team.id },
      data: { budget: { increment: refund } },
    }),
  ]);

  revalidatePath("/transfers");
}
