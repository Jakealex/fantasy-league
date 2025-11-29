import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid gameweek ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { deadlineAt, isCurrent, isFinished } = body;

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

