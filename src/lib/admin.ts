import { prisma } from "./prisma";

/**
 * Check if the current user (first user for now) is an admin.
 * TODO: Replace with real session-based auth when authentication is implemented.
 */
export async function isAdmin(): Promise<boolean> {
  try {
    // For now, check if the first user is a league owner or has admin role
    const user = await prisma.user.findFirst();
    if (!user) return false;

    // Check if user owns any leagues
    const ownedLeague = await prisma.league.findFirst({
      where: { ownerId: user.id },
    });
    if (ownedLeague) return true;

    // Check if user has admin role in any league
    const adminMembership = await prisma.leagueMember.findFirst({
      where: {
        userId: user.id,
        role: "admin",
      },
    });

    return !!adminMembership;
  } catch (error) {
    console.error("[isAdmin] Error:", error);
    return false;
  }
}

