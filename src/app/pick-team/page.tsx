export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import type { Position } from "@/types/fantasy";
import PickTeamClient from "./PickTeamClient";
import type { PickTeamSlot } from "./types";

const REQUIRED_SLOT_LABELS = ["GK1", "OUT1", "OUT2", "OUT3", "OUT4"] as const;

type SaveLineupResult = { ok: boolean; message: string };

type SubmittedSlot = {
  slotLabel: string;
  playerId: string;
};

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

  await ensureRequiredSlots(created.id);
  return created;
}

async function ensureRequiredSlots(teamId: string) {
  await Promise.all(
    REQUIRED_SLOT_LABELS.map((slotLabel) =>
      prisma.squadSlot.upsert({
        where: { teamId_slotLabel: { teamId, slotLabel } },
        update: {},
        create: { teamId, slotLabel },
      })
    )
  );
}

function expectedPositionForSlot(slotLabel: string): Position {
  return slotLabel.startsWith("GK") ? "GK" : "OUT";
}

export async function saveLineupAction(formData: FormData): Promise<SaveLineupResult> {
  "use server";

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

    submitted = parsed.map((entry) => {
      if (typeof entry !== "object" || entry === null) {
        throw new Error("Invalid slot entry.");
      }

      const record = entry as Record<string, unknown>;
      const slotLabel = record.slotLabel;
      const playerId = record.playerId;

      if (typeof slotLabel !== "string" || typeof playerId !== "string" || playerId.length === 0) {
        throw new Error("Invalid slot entry.");
      }

      return {
        slotLabel,
        playerId,
      };
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not parse squad payload.";
    return { ok: false, message };
  }

  const labels = new Set(submitted.map((slot) => slot.slotLabel));
  for (const required of REQUIRED_SLOT_LABELS) {
    if (!labels.has(required)) {
      return { ok: false, message: `Missing slot ${required}.` };
    }
  }

  if (labels.size !== submitted.length) {
    return { ok: false, message: "Duplicate slots provided." };
  }

  const playerIds = submitted.map((slot) => slot.playerId);
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

  for (const slot of submitted) {
    const player = players.find((p) => p.id === slot.playerId);
    if (!player) continue;
    if (player.position !== expectedPositionForSlot(slot.slotLabel)) {
      return {
        ok: false,
        message: `Player ${player.name} cannot occupy ${slot.slotLabel}.`,
      };
    }
  }

  const team = await getTeamForCurrentUser();
  await ensureRequiredSlots(team.id);

  try {
    await prisma.$transaction(
      submitted.map((slot) =>
        prisma.squadSlot.upsert({
          where: { teamId_slotLabel: { teamId: team.id, slotLabel: slot.slotLabel } },
          update: { playerId: slot.playerId },
          create: { teamId: team.id, slotLabel: slot.slotLabel, playerId: slot.playerId },
        })
      )
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save lineup.";
    return { ok: false, message };
  }

  return { ok: true, message: "Lineup saved." };
}

export default async function Page() {
  const team = await getTeamForCurrentUser();
  await ensureRequiredSlots(team.id);

  const slots = await prisma.squadSlot.findMany({
    where: { teamId: team.id },
    include: {
      player: {
        select: {
          id: true,
          name: true,
          position: true,
          price: true,
          totalPoints: true,
        },
      },
    },
    orderBy: { slotLabel: "asc" },
  });

  const squad: PickTeamSlot[] = slots.map((slot) => ({
    slotLabel: slot.slotLabel,
    player: slot.player
      ? {
          id: slot.player.id,
          name: slot.player.name,
          position: slot.player.position as Position,
          price: slot.player.price,
          totalPoints: slot.player.totalPoints ?? undefined,
        }
      : undefined,
  }));

  console.log(
    "[pick-team] fetched slots",
    squad.map((slot) => ({
      slotLabel: slot.slotLabel,
      playerId: slot.player?.id ?? null,
    }))
  );

  return (
    <main className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Pick Team</h1>
        <p className="mt-2 text-gray-600">
          Review your confirmed squad and save the lineup.
        </p>
      </header>

      <PickTeamClient slots={squad} onSave={saveLineupAction} />
    </main>
  );
}
