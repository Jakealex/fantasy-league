// prisma/cleanup.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Starting cleanup...");

  // Delete children first (order matters for FK constraints)
  await prisma.squadSlot.deleteMany({});
  await prisma.gameweekScore.deleteMany({});
  await prisma.scoreEvent.deleteMany({});
  await prisma.leagueMember.deleteMany({});

  // Keep ONLY your active team; delete the rest
  await prisma.team.deleteMany({
    where: {
      id: { notIn: ["cmgkndsmf0006ldys0zwrxrg2"] }, // <-- keep this ID
    },
  });

  console.log("✅ Cleanup complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
