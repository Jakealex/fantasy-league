"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { signIn } from "@/lib/auth";

export async function resetPasswordAction(token: string, newPassword: string) {
  try {
    if (!token || token.length === 0) {
      return { ok: false, error: "Invalid reset token" };
    }

    if (newPassword.length < 6) {
      return { ok: false, error: "Password must be at least 6 characters" };
    }

    // Find user with this token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: {
          gt: new Date(), // Token not expired
        },
      },
    });

    if (!user) {
      return { ok: false, error: "Invalid or expired reset token" };
    }

    // Update password and clear reset token
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    // Auto-login user (password is already updated, so use new password)
    const signInResult = await signIn(user.email, newPassword);
    if (!signInResult.ok) {
      // Password was updated but login failed - user can login manually
      return { ok: true };
    }

    return { ok: true };
  } catch (error) {
    console.error("[resetPasswordAction] Error:", error);
    return { ok: false, error: "Failed to reset password" };
  }
}

