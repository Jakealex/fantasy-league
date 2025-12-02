"use server";

import { revalidatePath } from "next/cache";
import { calculateGameweekScores, calculatePlayerPoints } from "@/lib/scoring";
import { isAdmin } from "@/lib/admin";

export type ActionState = {
  ok: boolean;
  message?: string;
};

/**
 * Run scoring for a gameweek (calculates PlayerPoints, then team scores)
 */
export async function runGameweekScoringAction(
  gameweekId: number
): Promise<ActionState> {
  if (!(await isAdmin())) {
    return { ok: false, message: "Unauthorized" };
  }

  try {
    // Step 1: Calculate PlayerPoints from fixtures and events
    await calculatePlayerPoints(gameweekId);

    // Step 2: Calculate team scores from PlayerPoints
    await calculateGameweekScores(gameweekId);

    revalidatePath(`/admin/gameweeks/${gameweekId}`);
    revalidatePath(`/admin/gameweeks/${gameweekId}/points`);
    return { ok: true, message: "Scoring completed successfully" };
  } catch (error) {
    console.error("[runGameweekScoringAction] Error:", error);
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to run scoring",
    };
  }
}

/**
 * Legacy function for backward compatibility
 */
export async function runScoringAction(gameweekId: number) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  await calculateGameweekScores(gameweekId);
}

