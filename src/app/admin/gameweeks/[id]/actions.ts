"use server";

import { calculateGameweekScores } from "@/lib/scoring";
import { isAdmin } from "@/lib/admin";

export async function runScoringAction(gameweekId: number) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  await calculateGameweekScores(gameweekId);
}

