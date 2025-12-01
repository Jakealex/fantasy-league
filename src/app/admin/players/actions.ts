"use server";

import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import { revalidatePath } from "next/cache";

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

