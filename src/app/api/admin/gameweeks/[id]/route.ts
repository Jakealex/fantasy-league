import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import { updatePlayerSeasonStats, updatePlayerOwnershipPct } from "@/lib/player-stats";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid gameweek ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { deadlineAt, isCurrent, isFinished } = body;

    // Check current state to detect false → true transition for isFinished
    let wasFinished = false;
    if (isFinished !== undefined) {
      const currentGameweek = await prisma.gameweek.findUnique({
        where: { id },
        select: { isFinished: true },
      });
      wasFinished = currentGameweek?.isFinished ?? false;
    }

    const updateData: {
      deadlineAt?: Date;
      isCurrent?: boolean;
      isFinished?: boolean;
    } = {};

    if (deadlineAt !== undefined) {
      updateData.deadlineAt = new Date(deadlineAt);
    }

    if (isCurrent !== undefined) {
      // If setting as current, unset all others
      if (isCurrent) {
        await prisma.gameweek.updateMany({
          where: { isCurrent: true },
          data: { isCurrent: false },
        });
      }
      updateData.isCurrent = isCurrent;
    }

    if (isFinished !== undefined) {
      updateData.isFinished = isFinished;
    }

    const gameweek = await prisma.gameweek.update({
      where: { id },
      data: updateData,
    });

    // Only trigger updates on false → true transition for isFinished
    if (isFinished !== undefined && isFinished === true && wasFinished === false) {
      console.log(`[update-gameweek] Gameweek ${id} marked as finished. Updating player season stats...`);
      try {
        // Update season totals (totalPoints, goals, assists) from all finished gameweeks
        await updatePlayerSeasonStats();
        // Update ownership percentages
        await updatePlayerOwnershipPct();
        console.log(`[update-gameweek] Player stats updated successfully for gameweek ${id}.`);
      } catch (statsError) {
        // Log error but don't fail the request - gameweek is still updated
        console.error(`[update-gameweek] Error updating player stats:`, statsError);
      }
    }

    return NextResponse.json({
      success: true,
      gameweek,
    });
  } catch (error) {
    console.error("[update-gameweek] Error:", error);
    return NextResponse.json(
      { error: "Failed to update gameweek" },
      { status: 500 }
    );
  }
}

