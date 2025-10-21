// prisma/backfillSlots.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const REQUIRED: string[] = ["GK1", "OUT1", "OUT2", "OUT3", "OUT4"];

async function main(): Promise<void> {
  const teams = await prisma.team.findMany({ select: { id: true, name: true } });

  for (const t of teams) {
    const existing = await prisma.squadSlot.findMany({
      where: { teamId: t.id },
      select: { slotLabel: true },
    });
    const have = new Set(existing.map((s: { slotLabel: string }) => s.slotLabel));
    const missing = REQUIRED.filter((lbl) => !have.has(lbl));

    if (missing.length === 0) {
      console.log(`✓ ${t.name}: all slots present`);
      continue;
    }

    await prisma.$transaction(
      missing.map((slotLabel) =>
        prisma.squadSlot.upsert({
          where: { teamId_slotLabel: { teamId: t.id, slotLabel } },
          update: {},
          create: { teamId: t.id, slotLabel },
        })
      )
    );

    console.log(`+ ${t.name}: created ${missing.join(", ")}`);
  }
}

main()
  .catch((e) => {
    console.error("Backfill error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
