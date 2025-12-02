// prisma/reset-to-production.ts
// Clears all data except Users and Leagues for production launch
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Starting database reset (keeping Users and Leagues only)...");
  console.log("⚠️  This will delete ALL game data, teams, players, fixtures, and scores!");
  
  // Delete in order to respect foreign key constraints
  
  // 1. Delete score events (references Fixture and Player)
  const scoreEventsCount = await prisma.scoreEvent.deleteMany({});
  console.log(`   ✓ Deleted ${scoreEventsCount.count} score events`);
  
  // 2. Delete fixtures (references Gameweek)
  const fixturesCount = await prisma.fixture.deleteMany({});
  console.log(`   ✓ Deleted ${fixturesCount.count} fixtures`);
  
  // 3. Delete player points (references Player and Gameweek)
  const playerPointsCount = await prisma.playerPoints.deleteMany({});
  console.log(`   ✓ Deleted ${playerPointsCount.count} player points records`);
  
  // 4. Delete gameweek scores (references Team and Gameweek)
  const gameweekScoresCount = await prisma.gameweekScore.deleteMany({});
  console.log(`   ✓ Deleted ${gameweekScoresCount.count} gameweek scores`);
  
  // 5. Delete squad slots (references Team and Player)
  const squadSlotsCount = await prisma.squadSlot.deleteMany({});
  console.log(`   ✓ Deleted ${squadSlotsCount.count} squad slots`);
  
  // 6. Delete league members (references Team and League)
  // Note: This breaks the connection between Leagues and Teams, but Teams will be deleted anyway
  const leagueMembersCount = await prisma.leagueMember.deleteMany({});
  console.log(`   ✓ Deleted ${leagueMembersCount.count} league members`);
  
  // 7. Delete teams (references User and League)
  // Note: This keeps the User and League records, just removes the teams
  const teamsCount = await prisma.team.deleteMany({});
  console.log(`   ✓ Deleted ${teamsCount.count} teams`);
  
  // 8. Delete players
  const playersCount = await prisma.player.deleteMany({});
  console.log(`   ✓ Deleted ${playersCount.count} players`);
  
  // 9. Delete gameweeks
  const gameweeksCount = await prisma.gameweek.deleteMany({});
  console.log(`   ✓ Deleted ${gameweeksCount.count} gameweeks`);
  
  // 10. Reset GlobalSettings to defaults
  await prisma.globalSettings.upsert({
    where: { id: 1 },
    update: {
      transfersOpen: true,
    },
    create: {
      id: 1,
      transfersOpen: true,
    },
  });
  console.log(`   ✓ Reset GlobalSettings to defaults`);
  
  // Summary
  const userCount = await prisma.user.count();
  const leagueCount = await prisma.league.count();
  
  console.log("\n✅ Reset complete!");
  console.log(`\n📊 Remaining data:`);
  console.log(`   • ${userCount} users`);
  console.log(`   • ${leagueCount} leagues`);
  console.log(`\n🎯 Database is ready for production launch!`);
}

main()
  .catch((e) => {
    console.error("❌ Reset error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

