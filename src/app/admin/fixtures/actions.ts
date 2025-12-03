"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import { validateFixtureData } from "@/lib/fixtures";
import { getFixturesWithRelations } from "@/lib/fixtures";
import type { Prisma } from "@prisma/client";

export type ActionState = {
  ok: boolean;
  message?: string;
};

/**
 * Create a new fixture
 */
export async function createFixtureAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await isAdmin())) {
    return { ok: false, message: "Unauthorized" };
  }

  try {
    const homeTeam = String(formData.get("homeTeam") ?? "").trim();
    const awayTeam = String(formData.get("awayTeam") ?? "").trim();
    const gameweekId = Number(formData.get("gameweekId"));
    const kickoffAtStr = String(formData.get("kickoffAt") ?? "").trim();

    if (!homeTeam || !awayTeam || !gameweekId) {
      return { ok: false, message: "Home team, away team, and gameweek are required" };
    }

    // Validate gameweek exists
    const gameweek = await prisma.gameweek.findUnique({
      where: { id: gameweekId },
    });
    if (!gameweek) {
      return { ok: false, message: "Gameweek not found" };
    }

    // Use kickoffAt if provided, otherwise use gameweek start date
    let kickoffAt: Date;
    if (kickoffAtStr) {
      kickoffAt = new Date(kickoffAtStr);
      if (isNaN(kickoffAt.getTime())) {
        return { ok: false, message: "Invalid kickoff date" };
      }
    } else {
      // Default to gameweek start date if not provided
      kickoffAt = gameweek.startsAt;
    }

    // Validate fixture data
    const validation = validateFixtureData({
      homeTeam,
      awayTeam,
      gameweekId,
      kickoffAt,
    });

    if (!validation.isValid) {
      return { ok: false, message: validation.errors.join(", ") };
    }

    await prisma.fixture.create({
      data: {
        homeTeam,
        awayTeam,
        gameweekId,
        kickoffAt,
      },
    });

    revalidatePath("/admin/fixtures");
    return { ok: true, message: "Fixture created successfully" };
  } catch (error) {
    console.error("[createFixtureAction] Error:", error);
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to create fixture",
    };
  }
}

/**
 * Update fixture score
 */
export async function updateFixtureScoreAction(
  fixtureId: string,
  homeGoals: number | null,
  awayGoals: number | null
): Promise<ActionState> {
  if (!(await isAdmin())) {
    return { ok: false, message: "Unauthorized" };
  }

  try {
    // Validate goals are non-negative if provided
    if (homeGoals !== null && homeGoals < 0) {
      return { ok: false, message: "Home goals cannot be negative" };
    }
    if (awayGoals !== null && awayGoals < 0) {
      return { ok: false, message: "Away goals cannot be negative" };
    }

    const updateData: Prisma.FixtureUpdateInput = {
      homeGoals: homeGoals ?? null,
      awayGoals: awayGoals ?? null,
    };

    await prisma.fixture.update({
      where: { id: fixtureId },
      data: updateData,
    });

    revalidatePath(`/admin/fixtures/${fixtureId}`);
    revalidatePath("/admin/fixtures");
    return { ok: true, message: "Score updated successfully" };
  } catch (error) {
    console.error("[updateFixtureScoreAction] Error:", error);
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to update score",
    };
  }
}

/**
 * Get all fixtures (optionally filtered by gameweek)
 */
export async function getFixturesAction(gameweekId?: number) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  return getFixturesWithRelations(gameweekId);
}

