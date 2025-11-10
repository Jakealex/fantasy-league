// src/app/transfers/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import type { Player } from "@/types/fantasy";

export type ActionState = { ok: boolean; message: string };
export type ConfirmActionState = { ok: boolean; message: string };

const BASE_BUDGET = 34; // keep in sync with page.tsx
const MAX_FROM_CLUB = 3;
const REQUIRED_SLOT_LABELS = ["GK1", "OUT1", "OUT2", "OUT3", "OUT4"] as const;

type SubmittedSlot = {
  slotLabel: string;
  playerId?: string | null;
};

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
  if (fromSameClub >= MAX_FROM_CLUB) {
    return { ok: false, message: `Too many players from this team (max ${MAX_FROM_CLUB}).` };
  }

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

export async function confirmTransfersAction(
  _prev: ConfirmActionState,
  formData: FormData
): Promise<ConfirmActionState> {
  const rawSlots = formData.get("slots");
  if (typeof rawSlots !== "string") {
    return { ok: false, message: "Missing squad payload." };
  }

  let submitted: SubmittedSlot[];
  try {
    const parsed = JSON.parse(rawSlots) as unknown;
    if (!Array.isArray(parsed)) {
      return { ok: false, message: "Invalid squad payload." };
    }
    submitted = parsed.map((item: unknown): SubmittedSlot => {
      if (typeof item !== "object" || item === null) {
        throw new Error("Invalid slot entry.");
      }

      const entry = item as Record<string, unknown>;
      const slotLabelValue = entry.slotLabel;
      const playerIdValue = entry.playerId;

      if (typeof slotLabelValue !== "string") {
        throw new Error("Invalid slot entry.");
      }

      const playerId =
        typeof playerIdValue === "string" && playerIdValue.length > 0
          ? playerIdValue
          : undefined;
      return {
        slotLabel: slotLabelValue,
        playerId,
      };
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not parse squad payload.";
    return { ok: false, message };
  }

  const slotLabels = new Set(submitted.map((s) => s.slotLabel));
  for (const required of REQUIRED_SLOT_LABELS) {
    if (!slotLabels.has(required)) {
      return { ok: false, message: `Missing slot ${required}.` };
    }
  }
  if (slotLabels.size !== submitted.length) {
    return { ok: false, message: "Duplicate slot labels provided." };
  }
  if (submitted.length !== REQUIRED_SLOT_LABELS.length) {
    return { ok: false, message: "Unexpected squad slots provided." };
  }

  const playerIds = submitted
    .map((s) => s.playerId)
    .filter((id): id is string => !!id);

  const uniqueIds = new Set(playerIds);
  if (uniqueIds.size !== playerIds.length) {
    return { ok: false, message: "Duplicate players detected." };
  }

  const players = await prisma.player.findMany({
    where: { id: { in: playerIds } },
  });
  if (players.length !== playerIds.length) {
    return { ok: false, message: "One or more players could not be found." };
  }
  const playersById = new Map(players.map((p) => [p.id, p]));

  for (const slot of submitted) {
    if (!REQUIRED_SLOT_LABELS.includes(slot.slotLabel as (typeof REQUIRED_SLOT_LABELS)[number])) {
      return { ok: false, message: `Invalid slot label: ${slot.slotLabel}.` };
    }
    if (!slot.playerId) continue;
    const player = playersById.get(slot.playerId);
    if (!player) {
      return { ok: false, message: `Player ${slot.playerId} not recognised.` };
    }
    const expectedPrefix = slot.slotLabel.startsWith("GK") ? "GK" : "OUT";
    if (player.position !== expectedPrefix) {
      return {
        ok: false,
        message: `Player ${player.name} cannot occupy slot ${slot.slotLabel}.`,
      };
    }
  }

  const perClubCounts = new Map<string, number>();
  for (const playerId of playerIds) {
    const player = playersById.get(playerId);
    if (!player) continue;
    const current = perClubCounts.get(player.teamName) ?? 0;
    const nextCount = current + 1;
    if (nextCount > MAX_FROM_CLUB) {
      return {
        ok: false,
        message: `Team limit exceeded for ${player.teamName} (max ${MAX_FROM_CLUB}).`,
      };
    }
    perClubCounts.set(player.teamName, nextCount);
  }

  const totalSpent = playerIds.reduce((sum, id) => {
    const player = playersById.get(id);
    return sum + (player?.price ?? 0);
  }, 0);

  if (totalSpent > BASE_BUDGET) {
    return { ok: false, message: "Budget exceeded." };
  }

  const team = await getTeamForCurrentUser();

  try {
    await prisma.$transaction([
      ...REQUIRED_SLOT_LABELS.map((slotLabel) => {
        const slot = submitted.find((s) => s.slotLabel === slotLabel);
        const playerId = slot?.playerId ?? null;
        return prisma.squadSlot.upsert({
          where: { teamId_slotLabel: { teamId: team.id, slotLabel } },
          update: { playerId },
          create: { teamId: team.id, slotLabel, playerId },
        });
      }),
      prisma.team.update({
        where: { id: team.id },
        data: { budget: BASE_BUDGET - totalSpent },
      }),
    ]);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not confirm transfers.";
    return { ok: false, message };
  }

  return { ok: true, message: "Transfers confirmed." };
}

// Optional one-arg wrappers if your client imports these:
export async function addToSquadDirect(formData: FormData): Promise<ActionState> {
  return addToSquadAction({ ok: false, message: "" }, formData);
}
export async function removeFromSquadDirect(formData: FormData): Promise<ActionState> {
  return removeFromSquadAction({ ok: false, message: "" }, formData);
}
export const confirmTransfersDirect = async (formData: FormData): Promise<ConfirmActionState> =>
  confirmTransfersAction({ ok: false, message: "" }, formData);
