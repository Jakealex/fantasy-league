"use server";

import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export async function updatePlayerPriceAction(
  playerId: string,
  newPrice: number
): Promise<{ ok: boolean; message: string }> {
  try {
    // Check admin access
    if (!(await isAdmin())) {
      return { ok: false, message: "Unauthorized" };
    }

    // Validate price
    if (newPrice < 0 || newPrice > 100) {
      return { ok: false, message: "Price must be between 0 and 100" };
    }

    // Update player price
    await prisma.player.update({
      where: { id: playerId },
      data: { price: newPrice },
    });

    revalidatePath("/admin/players");
    revalidatePath("/transfers");
    revalidatePath("/pick-team");

    return { ok: true, message: "Player price updated successfully" };
  } catch (error) {
    console.error("[updatePlayerPriceAction] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update player price";
    return { ok: false, message };
  }
}

export async function createPlayerAction(
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  try {
    // Check admin access
    if (!(await isAdmin())) {
      return { ok: false, message: "Unauthorized" };
    }

    // Extract and validate form data
    const name = formData.get("name")?.toString().trim();
    const teamName = formData.get("teamName")?.toString().trim();
    const position = formData.get("position")?.toString();
    const priceStr = formData.get("price")?.toString();
    const status = formData.get("status")?.toString();

    // Validate required fields
    if (!name || name.length === 0) {
      return { ok: false, message: "Player name is required" };
    }

    if (!teamName || teamName.length === 0) {
      return { ok: false, message: "Team name is required" };
    }

    if (!position || (position !== "GK" && position !== "OUT")) {
      return { ok: false, message: "Position must be GK or OUT" };
    }

    if (!priceStr) {
      return { ok: false, message: "Price is required" };
    }

    const price = parseFloat(priceStr);
    if (isNaN(price) || price < 0 || price > 100) {
      return { ok: false, message: "Price must be a number between 0 and 100" };
    }

    if (!status || (status !== "A" && status !== "I")) {
      return { ok: false, message: "Status must be A (Active) or I (Injured)" };
    }

    // Create player
    await prisma.player.create({
      data: {
        name,
        teamName,
        position: position as "GK" | "OUT",
        price,
        status: status as "A" | "I",
      },
    });

    // Revalidate paths
    revalidatePath("/admin/players");
    revalidatePath("/transfers");
    revalidatePath("/pick-team");
    revalidatePath("/players"); // If you have a public players page

    return { ok: true, message: "Player created successfully" };
  } catch (error) {
    console.error("[createPlayerAction] Error:", error);

    // Handle Prisma unique constraint violation
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        message: "A player with this name and team already exists",
      };
    }

    const message =
      error instanceof Error ? error.message : "Failed to create player";
    return { ok: false, message };
  }
}

export async function updatePlayerAction(
  playerId: string,
  name: string,
  teamName: string
): Promise<{ ok: boolean; message: string }> {
  try {
    // Check admin access
    if (!(await isAdmin())) {
      return { ok: false, message: "Unauthorized" };
    }

    // Validate inputs
    if (!name || name.trim().length === 0) {
      return { ok: false, message: "Player name is required" };
    }

    if (!teamName || teamName.trim().length === 0) {
      return { ok: false, message: "Team name is required" };
    }

    // Update player
    await prisma.player.update({
      where: { id: playerId },
      data: {
        name: name.trim(),
        teamName: teamName.trim(),
      },
    });

    // Revalidate paths
    revalidatePath("/admin/players");
    revalidatePath("/transfers");
    revalidatePath("/pick-team");
    revalidatePath("/players");

    return { ok: true, message: "Player updated successfully" };
  } catch (error) {
    console.error("[updatePlayerAction] Error:", error);

    // Handle Prisma unique constraint violation
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        message: "A player with this name and team already exists",
      };
    }

    const message =
      error instanceof Error ? error.message : "Failed to update player";
    return { ok: false, message };
  }
}

export async function deletePlayerAction(
  playerId: string
): Promise<{ ok: boolean; message: string }> {
  try {
    // Check admin access
    if (!(await isAdmin())) {
      return { ok: false, message: "Unauthorized" };
    }

    // Check if player exists
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      return { ok: false, message: "Player not found" };
    }

    // Get affected gameweeks BEFORE deletion (so we can recalculate after)
    const affectedGameweeks = await prisma.playerPoints.findMany({
      where: { playerId },
      select: { gameweekId: true },
      distinct: ["gameweekId"],
    });

    const gameweekIds = affectedGameweeks.map((pp) => pp.gameweekId);

    // Delete in order to respect foreign key constraints
    // 1. Delete PlayerPoints first
    await prisma.playerPoints.deleteMany({
      where: { playerId },
    });

    // 2. Delete ScoreEvents (has RESTRICT constraint, must delete first)
    await prisma.scoreEvent.deleteMany({
      where: { playerId },
    });

    // 3. SquadSlots will auto-set playerId to null (SET NULL constraint)
    // But we can explicitly clear them for cleanliness
    await prisma.squadSlot.updateMany({
      where: { playerId },
      data: { playerId: null },
    });

    // 4. Delete the player
    await prisma.player.delete({
      where: { id: playerId },
    });

    // Recalculate scores for affected gameweeks
    const { calculateGameweekScores } = await import("@/lib/scoring");
    for (const gameweekId of gameweekIds) {
      try {
        await calculateGameweekScores(gameweekId);
      } catch (error) {
        console.error(`[deletePlayerAction] Error recalculating gameweek ${gameweekId}:`, error);
      }
    }

    // Revalidate paths
    revalidatePath("/admin/players");
    revalidatePath("/transfers");
    revalidatePath("/pick-team");
    revalidatePath("/players");

    return { ok: true, message: "Player deleted successfully" };
  } catch (error) {
    console.error("[deletePlayerAction] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete player";
    return { ok: false, message };
  }
}

