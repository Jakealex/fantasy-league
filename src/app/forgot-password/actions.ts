"use server";

import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function forgotPasswordAction(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if email exists (security best practice)
    if (!user) {
      return { ok: true, token: "" }; // Return success even if user doesn't exist
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 24); // 24 hours

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires,
      },
    });

    // TODO: Send email with reset link
    // For now, return token to display on page
    return { ok: true, token: resetToken };
  } catch (error) {
    console.error("[forgotPasswordAction] Error:", error);
    return { ok: false, error: "Failed to process request" };
  }
}

