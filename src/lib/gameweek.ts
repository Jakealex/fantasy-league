import { prisma } from "@/lib/prisma";

export async function getCurrentGameweek() {
  return prisma.gameweek.findFirst({
    where: { isCurrent: true },
  });
}

