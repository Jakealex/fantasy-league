"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { signIn } from "@/lib/auth";

const SHEVATIM = [
  "Ktan tanim",
  "Gurim",
  "Roim",
  "Moledet",
  "Chaim",
  "Reim",
  "Kaveh",
];

export async function signupAction(form: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  shevet: string;
  role: string;
}) {
  const { email, password, firstName, lastName, shevet, role } = form;

  // Validation
  if (!email || !password || !firstName || !lastName || !shevet || !role) {
    return { ok: false, error: "All fields are required." };
  }

  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }

  if (!SHEVATIM.includes(shevet)) {
    return { ok: false, error: "Invalid shevet." };
  }

  if (role !== "Maddie" && role !== "Channie") {
    return { ok: false, error: "Invalid role." };
  }

  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "Email is already registered." };
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Find or create leagues (idempotent - safe to run multiple times)
  // Use upsert to handle race conditions where multiple signups happen simultaneously
  let overall = await prisma.league.findFirst({ where: { type: "OVERALL" } });
  if (!overall) {
    try {
      overall = await prisma.league.findFirst({
        where: { name: "Overall League" },
      });
      if (!overall) {
        overall = await prisma.league.create({
          data: {
            name: "Overall League",
            type: "OVERALL",
            inviteCode: null,
            ownerId: null,
          },
        });
      }
    } catch (error) {
      // If upsert fails, try to find it again (another process might have created it)
      overall = await prisma.league.findFirst({ where: { type: "OVERALL" } });
      if (!overall) {
        console.error("[signup] Failed to create Overall League:", error);
        return { ok: false, error: "Failed to initialize leagues. Please try again." };
      }
    }
  }

  let tribe = await prisma.league.findFirst({ where: { type: "TRIBE", shevet } });
  if (!tribe) {
    try {
      tribe = await prisma.league.findFirst({
        where: { name: shevet },
      });
      if (!tribe) {
        tribe = await prisma.league.create({
          data: {
            name: shevet,
            type: "TRIBE",
            shevet: shevet,
            inviteCode: null,
            ownerId: null,
          },
        });
      }
    } catch (error) {
      // If upsert fails, try to find it again
      tribe = await prisma.league.findFirst({ where: { type: "TRIBE", shevet } });
      if (!tribe) {
        console.error(`[signup] Failed to create Tribe League (${shevet}):`, error);
        return { ok: false, error: `Failed to initialize ${shevet} league. Please try again.` };
      }
    }
  }

  let roleLeague = await prisma.league.findFirst({ where: { type: "ROLE", role } });
  if (!roleLeague) {
    const roleLeagueName = role === "Maddie" ? "Maddies League" : "Channies League";
    try {
      roleLeague = await prisma.league.findFirst({
        where: { name: roleLeagueName },
      });
      if (!roleLeague) {
        roleLeague = await prisma.league.create({
          data: {
            name: roleLeagueName,
            type: "ROLE",
            role: role,
            inviteCode: null,
            ownerId: null,
          },
        });
      }
    } catch (error) {
      // If upsert fails, try to find it again
      roleLeague = await prisma.league.findFirst({ where: { type: "ROLE", role } });
      if (!roleLeague) {
        console.error(`[signup] Failed to create Role League (${role}):`, error);
        return { ok: false, error: `Failed to initialize ${role} league. Please try again.` };
      }
    }
  }

  // Generate unique team name
  function generateTeamName(first: string, last: string): string {
    const suffix = Math.floor(100 + Math.random() * 900);
    return `${first} ${last} ${suffix}`;
  }

  // Create user, team, and league memberships in a transaction
  await prisma.$transaction(async (tx) => {
    // Create user
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        shevet,
        role,
      },
    });

    // Generate unique team name
    let teamName: string;
    let teamExists = true;
    let attempts = 0;
    do {
      teamName = generateTeamName(firstName, lastName);
      teamExists = !!(await tx.team.findFirst({ where: { name: teamName } }));
      attempts++;
      if (attempts > 10) {
        // Fallback if we can't find a unique name
        teamName = `${firstName} ${lastName} ${Date.now()}`;
        break;
      }
    } while (teamExists);

    // Create team (without leagueId initially, we'll add it to leagues via LeagueMember)
    const team = await tx.team.create({
      data: {
        name: teamName,
        userId: user.id,
        leagueId: overall.id, // Use overall league as primary league
        budget: 34,
      },
    });

    // Create squad slots
    await Promise.all(
      ["GK1", "OUT1", "OUT2", "OUT3", "OUT4"].map((slotLabel) =>
        tx.squadSlot.create({
          data: { teamId: team.id, slotLabel },
        })
      )
    );

    // Create league memberships
    await tx.leagueMember.createMany({
      data: [
        { leagueId: overall.id, teamId: team.id },
        { leagueId: tribe.id, teamId: team.id },
        { leagueId: roleLeague.id, teamId: team.id },
      ],
    });

    return { user, team };
  });

  // Auto-login user
  const signInResult = await signIn(email, password);
  if (!signInResult.ok) {
    return { ok: false, error: "Account created but login failed. Please try logging in." };
  }

  return { ok: true };
}

