// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
const prisma = new PrismaClient();

// simple literal types to match your enums
type Position = 'GK' | 'OUT';
type PlayerStatus = 'A' | 'I';
type EventType = 'goal' | 'assist' | 'appearance';

function randomCode(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function main() {
  // 0) Create system leagues (10 leagues total)
  const overallLeague = await prisma.league.upsert({
    where: { name: "Overall League" },
    update: {},
    create: {
      name: "Overall League",
      type: "OVERALL",
      inviteCode: null,
      ownerId: null,
    },
  });

  const shevatim = ["Ktan tanim", "Gurim", "Roim", "Moledet", "Chaim", "Reim", "Kaveh"];
  const tribeLeagues = await Promise.all(
    shevatim.map((shevet) =>
      prisma.league.upsert({
        where: { name: shevet },
        update: {},
        create: {
          name: shevet,
          type: "TRIBE",
          shevet: shevet,
          inviteCode: null,
          ownerId: null,
        },
      })
    )
  );

  const maddiesLeague = await prisma.league.upsert({
    where: { name: "Maddies League" },
    update: {},
    create: {
      name: "Maddies League",
      type: "ROLE",
      role: "Maddie",
      inviteCode: null,
      ownerId: null,
    },
  });

  const channiesLeague = await prisma.league.upsert({
    where: { name: "Channies League" },
    update: {},
    create: {
      name: "Channies League",
      type: "ROLE",
      role: "Channie",
      inviteCode: null,
      ownerId: null,
    },
  });

  // 1) User
  // Generate real password hash for 'password123'
  const passwordHash = await hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      passwordHash: passwordHash, // Update password hash if user exists
    },
    create: {
      email: 'admin@example.com',
      passwordHash: passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      shevet: 'Ktan tanim',
      role: 'Maddie',
    }
  });

  // 2) Create a demo league for the admin user
  const invite = 'DEMO' + randomCode(4);
  const league = await prisma.league.upsert({
    where: { inviteCode: invite },
    update: {},
    create: {
      name: 'Demo League',
      inviteCode: invite,
      type: 'CUSTOM',
      ownerId: user.id
    }
  });

  // 3) Team (for demo league)
  const team = await prisma.team.upsert({
    where: { userId_leagueId: { userId: user.id, leagueId: league.id } },
    update: {},
    create: {
      name: 'Admin XI',
      userId: user.id,
      leagueId: league.id,
      budget: 100
    }
  });

  // 4) Membership (for demo league)
  await prisma.leagueMember.upsert({
    where: { leagueId_teamId: { leagueId: league.id, teamId: team.id } },
    update: {},
    create: { leagueId: league.id, teamId: team.id, role: 'admin' }
  });

  // 5) Players with names
  const squadTeamName = 'Soccer Team FC';

  // helper upsert by composite unique [name, teamName]
  async function upsertPlayerByNameAndTeam(p: {
    name: string;
    teamName: string;
    position: Position;      // GK | OUT
    price: number;
    status: PlayerStatus;    // A | I
  }) {
    return prisma.player.upsert({
      where: { name_teamName: { name: p.name, teamName: p.teamName } },
      update: { price: p.price, status: p.status, position: p.position },
      create: p
    });
  }

  const gk = await upsertPlayerByNameAndTeam({
    name: 'John Keeper',
    teamName: squadTeamName,
    position: 'GK',
    price: 10,
    status: 'A'
  });

  const out = await upsertPlayerByNameAndTeam({
    name: 'Josh Berson',
    teamName: squadTeamName,
    position: 'OUT',
    price: 10,
    status: 'A'
  });

  // 6) Squad slots
  await prisma.squadSlot.upsert({
    where: { teamId_slotLabel: { teamId: team.id, slotLabel: 'GK1' } },
    update: { playerId: gk.id },
    create: { teamId: team.id, playerId: gk.id, slotLabel: 'GK1' }
  });

  await prisma.squadSlot.upsert({
    where: { teamId_slotLabel: { teamId: team.id, slotLabel: 'OUT1' } },
    update: { playerId: out.id },
    create: { teamId: team.id, playerId: out.id, slotLabel: 'OUT1' }
  });

  // 7) Gameweek
  const gw1 = await prisma.gameweek.upsert({
    where: { number: 1 },
    update: {},
    create: {
      number: 1,
      name: 'Gameweek 1',
      startsAt: new Date('2025-01-01T00:00:00Z'),
      deadlineAt: new Date('2025-01-03T16:00:00Z'),
      isCurrent: true,
      isFinished: false,
    },
  });

  // 8) Sample fixture / event / score
  const fixture = await prisma.fixture.upsert({
    where: { id: 'demo-fixture-1' },
    update: {},
    create: {
      id: 'demo-fixture-1',
      homeTeam: squadTeamName,
      awayTeam: 'Rivals FC',
      kickoffAt: new Date(Date.now() + 24 * 3600 * 1000),
      gameweekId: gw1.id,
    },
  });

  await prisma.scoreEvent.upsert({
    where: { id: 'demo-event-1' },
    update: {},
    create: {
      id: 'demo-event-1',
      fixtureId: fixture.id,
      playerId: out.id,
      type: 'goal' as EventType,
      value: 5,
    },
  });

  await prisma.gameweekScore.upsert({
    where: { teamId_gameweekId: { teamId: team.id, gameweekId: gw1.id } },
    update: { total: 5 },
    create: { teamId: team.id, gameweekId: gw1.id, total: 5 },
  });

  // 9) GlobalSettings
  await prisma.globalSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      transfersOpen: true
    }
  });

  console.log('Seed complete ✅', { user: user.email, inviteCode: league.inviteCode });
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
