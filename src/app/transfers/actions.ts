"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- CONFIG / TODO: replace with real auth + selected league ---
async function getActiveTeam() {
  const team = await prisma.team.findFirst({
    include: { slots: { include: { player: true } } },
  });
  if (!team) {
    throw new Error("No team found. Create a Team first.");
  }
  return team;
}

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

/** Internal core (NOT exported) */
async function _addToSquadCore(playerId: string): Promise<void> {
  if (!playerId) throw new Error("Missing playerId");

  const team = await getActiveTeam();

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) throw new Error("Player not found");

  const alreadyInSquad = await prisma.squadSlot.findFirst({
    where: { teamId: team.id, playerId: player.id },
  });
  if (alreadyInSquad) throw new Error("Player already in your squad");

  if (team.budget < player.price) throw new Error("Not enough budget");

  const usedLabels = team.slots.map((s: { slotLabel: string }) => s.slotLabel);

  const isGK = player.position === "GK";
  const slotLabel = nextFreeSlotLabel(isGK, usedLabels);
  if (!slotLabel) throw new Error(isGK ? "No GK slots free" : "No OUT slots free");

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

/** ✅ Server Action for `<form action={...}>` */
export async function addToSquadAction(formData: FormData): Promise<void> {
  const playerId = formData.get("playerId");
  if (typeof playerId !== "string" || !playerId) {
    throw new Error("Invalid playerId");
  }
  await _addToSquadCore(playerId);
}
