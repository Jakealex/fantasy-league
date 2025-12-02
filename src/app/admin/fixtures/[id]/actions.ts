"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import { getFixtureWithRelations } from "@/lib/fixtures";
import { getPlayersForFixture } from "@/lib/fixtures";

export type ActionState = {
  ok: boolean;
  message?: string;
};

/**
 * Get fixture details with relations
 */
export async function getFixtureDetailsAction(fixtureId: string) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  return getFixtureWithRelations(fixtureId);
}

/**
 * Get players for a fixture (both teams)
 */
export async function getFixturePlayersAction(fixtureId: string) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  return getPlayersForFixture(fixtureId);
}

/**
 * Add a score event to a fixture
 */
export async function addScoreEventAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await isAdmin())) {
    return { ok: false, message: "Unauthorized" };
  }

  try {
    const fixtureId = String(formData.get("fixtureId") ?? "");
    const playerId = String(formData.get("playerId") ?? "");
    const eventType = String(formData.get("eventType") ?? "");

    if (!fixtureId || !playerId || !eventType) {
      return { ok: false, message: "Fixture, player, and event type are required" };
    }

    // Validate event type
    const validEventTypes = ["GOAL", "ASSIST", "YC", "RC", "OG"];
    if (!validEventTypes.includes(eventType)) {
      return { ok: false, message: "Invalid event type" };
    }

    // Validate fixture exists
    const fixture = await prisma.fixture.findUnique({
      where: { id: fixtureId },
    });
    if (!fixture) {
      return { ok: false, message: "Fixture not found" };
    }

    // Validate player exists
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });
    if (!player) {
      return { ok: false, message: "Player not found" };
    }

    // Validate player is from one of the fixture teams
    if (player.teamName !== fixture.homeTeam && player.teamName !== fixture.awayTeam) {
      return { ok: false, message: "Player is not from either team in this fixture" };
    }

    await prisma.scoreEvent.create({
      data: {
        fixtureId,
        playerId,
        type: eventType as "GOAL" | "ASSIST" | "YC" | "RC" | "OG",
      },
    });

    revalidatePath(`/admin/fixtures/${fixtureId}`);
    revalidatePath(`/admin/fixtures/${fixtureId}/events`);
    return { ok: true, message: "Score event added successfully" };
  } catch (error) {
    console.error("[addScoreEventAction] Error:", error);
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to add score event",
    };
  }
}

/**
 * Delete a score event
 */
export async function deleteScoreEventAction(eventId: string): Promise<ActionState> {
  if (!(await isAdmin())) {
    return { ok: false, message: "Unauthorized" };
  }

  try {
    // Get the event to find the fixture ID for revalidation
    const event = await prisma.scoreEvent.findUnique({
      where: { id: eventId },
      select: { fixtureId: true },
    });

    if (!event) {
      return { ok: false, message: "Event not found" };
    }

    await prisma.scoreEvent.delete({
      where: { id: eventId },
    });

    revalidatePath(`/admin/fixtures/${event.fixtureId}`);
    revalidatePath(`/admin/fixtures/${event.fixtureId}/events`);
    return { ok: true, message: "Score event deleted successfully" };
  } catch (error) {
    console.error("[deleteScoreEventAction] Error:", error);
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to delete score event",
    };
  }
}

/**
 * Get all events for a fixture
 */
export async function getFixtureEventsAction(fixtureId: string) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  return prisma.scoreEvent.findMany({
    where: { fixtureId },
    include: {
      player: true,
    },
    orderBy: {
      id: "asc",
    },
  });
}

