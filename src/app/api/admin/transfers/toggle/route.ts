import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";

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
    const { open } = body;

    if (typeof open !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request body. 'open' must be a boolean." },
        { status: 400 }
      );
    }

    const settings = await prisma.globalSettings.upsert({
      where: { id: 1 },
      update: { transfersOpen: open },
      create: { id: 1, transfersOpen: open },
    });

    return NextResponse.json({ 
      success: true, 
      transfersOpen: settings.transfersOpen 
    });
  } catch (error) {
    console.error("[toggle-transfers] Error:", error);
    return NextResponse.json(
      { error: "Failed to update transfers setting" },
      { status: 500 }
    );
  }
}

