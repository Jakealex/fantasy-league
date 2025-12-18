export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentGameweek } from "@/lib/gameweek";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
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
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Find user's first league (or create one if needed)
  let league = await prisma.league.findFirst({ where: { ownerId: user.id } });
  if (!league) {
    // If user has no owned league, find any league they're a member of
    // First find a team for this user
    const userTeam = await prisma.team.findFirst({
      where: { userId: user.id },
    });
    if (userTeam) {
      // Find a league membership for this team
      const membership = await prisma.leagueMember.findFirst({
        where: { teamId: userTeam.id },
        include: { league: true },
      });
      if (membership) {
        league = membership.league;
      }
    }
    if (!league) {
      throw new Error("User has no league");
    }
  }

  const team = await prisma.team.findFirst({
    where: { userId: user.id, leagueId: league.id },
  });

  if (team) {
    return team;
  }

  const created = await prisma.team.create({
    data: { name: "Admin XI", userId: user.id, leagueId: league.id, budget: 46 },
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
    const player = players.find((p: { id: string }) => p.id === slot.playerId);
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

  // Fetch current gameweek first (needed for PlayerPoints lookup)
  const currentGameweek = await getCurrentGameweek();
  if (!currentGameweek) {
    throw new Error("No current gameweek configured");
  }

  const slots = await prisma.squadSlot.findMany({
    where: { teamId: team.id },
    include: {
      player: {
        select: {
          id: true,
          name: true,
          position: true,
          price: true,
        },
      },
    },
    orderBy: { slotLabel: "asc" },
  });

  // Fetch PlayerPoints for current gameweek
  const playerPoints = await prisma.playerPoints.findMany({
    where: { gameweekId: currentGameweek.id },
  });

  // Create map: playerId -> points for this gameweek
  const pointsByPlayerId = Object.fromEntries(
    playerPoints.map((pp: { playerId: string; points: number }) => [
      pp.playerId,
      pp.points,
    ])
  );

  const settings = await prisma.globalSettings.findUnique({ where: { id: 1 } });
  const transfersOpen = settings?.transfersOpen ?? true;

  const now = new Date();
  const isLocked =
    currentGameweek.isFinished ||
    currentGameweek.deadlineAt < now ||
    !transfersOpen;

  // Fetch team's total score for current gameweek
  const teamScore = await prisma.gameweekScore.findFirst({
    where: {
      teamId: team.id,
      gameweekId: currentGameweek.id,
    },
  });

  const squad: PickTeamSlot[] = slots.map((slot: typeof slots[0]) => {
    // Type assertion needed because Prisma include types don't always include all fields
    const slotWithCaptain = slot as typeof slot & { isCaptain: boolean };
    return {
      id: slot.id,
      slotLabel: slot.slotLabel,
      isCaptain: slotWithCaptain.isCaptain ?? false,
      player: slot.player
        ? {
            id: slot.player.id,
            name: slot.player.name,
            position: slot.player.position as Position,
            price: slot.player.price,
            gameweekPoints: pointsByPlayerId[slot.player.id] ?? undefined,
          }
        : undefined,
    };
  });

  console.log(
    "[pick-team] fetched slots",
    squad.map((slot) => ({
      slotLabel: slot.slotLabel,
      playerId: slot.player?.id ?? null,
      isCaptain: slot.isCaptain,
    }))
  );

  return (
    <main className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">
          Pick Team – Gameweek {currentGameweek.number}
        </h1>
        <p className="mt-2 text-gray-600">
          Review your confirmed squad and save the lineup.
        </p>
        <p className="mt-1 text-sm text-gray-500">
          <span className="font-bold">Deadline:</span> {new Date(currentGameweek.deadlineAt).toLocaleString()}
        </p>
      </header>

      <PickTeamClient
        slots={squad}
        onSave={saveLineupAction}
        currentGameweek={{
          number: currentGameweek.number,
          deadlineAt: currentGameweek.deadlineAt,
          isFinished: currentGameweek.isFinished,
        }}
        isLocked={isLocked}
        teamScore={teamScore?.total ?? null}
      />
    </main>
  );
}
