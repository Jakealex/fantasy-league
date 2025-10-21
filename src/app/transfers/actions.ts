// src/app/transfers/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import type { Player, SquadSlot } from "@/types/fantasy";

export type ActionState = { ok: boolean; message: string };

const BASE_BUDGET = 34; // keep in sync with page.tsx

// --- helpers (not exported) ---
async function getTeamForCurrentUser() {
  // TODO: swap to real auth (session userId). For now use first user/league.
  const user = await prisma.user.findFirstOrThrow();
  const league = await prisma.league.findFirstOrThrow({ where: { ownerId: user.id } });
  const team = await prisma.team.findFirstOrThrow({
    where: { userId: user.id, leagueId: league.id },
  });
  return team;
}

function slotPrefixForPosition(pos: Player["position"]): "GK" | "OUT" {
  return pos === "GK" ? "GK" : "OUT";
}

// --- exported async server actions ---
export async function addToSquadAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const playerId = String(formData.get("playerId") ?? "");
  const playerName = String(formData.get("playerName") ?? "");
  const slotLabel = String(formData.get("slotLabel") ?? "");

  if (!playerId || !playerName || !slotLabel) {
    return { ok: false, message: "Missing fields" };
  }

  const team = await getTeamForCurrentUser();

  // Get player (for price/pos) and current slots
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) return { ok: false, message: "Player not found" };

  const slots = await prisma.squadSlot.findMany({
    where: { teamId: team.id },
    include: { player: true },
  });

  // Club cap (example: 1 per club; tweak as needed)
  const fromSameClub = slots.filter((s: typeof slots[number]) => s.player?.teamName === player.teamName).length;
  if (fromSameClub >= 1) return { ok: false, message: "Too many players from this team." };

  // Slot availability must match position
  const prefix = slotPrefixForPosition(player.position as Player["position"]);
 const target = slots.find((s: typeof slots[number]) => s.slotLabel === slotLabel);
  if (!target || !target.slotLabel.startsWith(prefix)) {
    return { ok: false, message: "No matching free slot." };
  }
  if (target.playerId) return { ok: false, message: "Slot already taken." };

  // Budget check from server truth
  const spent = slots.reduce((sum: number, s: typeof slots[number]) => sum + (s.player?.price ?? 0), 0);
  const remaining = BASE_BUDGET - spent;
  if (remaining < player.price) return { ok: false, message: "Insufficient funds." };

  await prisma.squadSlot.update({
    where: { teamId_slotLabel: { teamId: team.id, slotLabel } },
    data: { playerId: player.id },
  });

  return { ok: true, message: "Squad updated" };
}

export async function removeFromSquadAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const slotLabel = String(formData.get("slotLabel") ?? "");
  if (!slotLabel) return { ok: false, message: "Missing slotLabel" };

  const team = await getTeamForCurrentUser();

  await prisma.squadSlot.update({
    where: { teamId_slotLabel: { teamId: team.id, slotLabel } },
    data: { player: { disconnect: true } },

  });

  return { ok: true, message: "Removed from squad" };
}

// Optional one-arg wrappers if your client imports these:
export async function addToSquadDirect(formData: FormData): Promise<ActionState> {
  return addToSquadAction({ ok: false, message: "" }, formData);
}
export async function removeFromSquadDirect(formData: FormData): Promise<ActionState> {
  return removeFromSquadAction({ ok: false, message: "" }, formData);
}
