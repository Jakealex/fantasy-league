import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";

export async function GET() {
  try {
    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const gameweeks = await prisma.gameweek.findMany({
      orderBy: { number: "desc" },
    });

    return NextResponse.json({ gameweeks });
  } catch (error) {
    console.error("[get-gameweeks] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch gameweeks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { number, name, startsAt, deadlineAt, isCurrent } = body;

    if (!number || !startsAt || !deadlineAt) {
      return NextResponse.json(
        { error: "Missing required fields: number, startsAt, deadlineAt" },
        { status: 400 }
      );
    }

    // If setting as current, unset all others
    if (isCurrent) {
      await prisma.gameweek.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      });
    }

    const gameweek = await prisma.gameweek.create({
      data: {
        number: parseInt(number),
        name: name || null,
        startsAt: new Date(startsAt),
        deadlineAt: new Date(deadlineAt),
        isCurrent: isCurrent || false,
        isFinished: false,
      },
    });

    return NextResponse.json({
      success: true,
      gameweek,
    });
  } catch (error) {
    console.error("[create-gameweek] Error:", error);
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Gameweek number already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create gameweek" },
      { status: 500 }
    );
  }
}

