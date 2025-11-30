# Signup Implementation Plan - Corrected

## 🔴 CRITICAL SCHEMA CHANGES NEEDED

### 1. Update User Model
```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  firstName     String
  lastName      String
  shevet        String
  role          String   // "Maddie" | "Channie"
  isAdmin       Boolean  @default(false) // NEW: For admin privileges
  emailVerified DateTime?

  teams        Team[]
  leaguesOwned League[]       @relation("LeagueOwner")
  memberships  LeagueMember[]
}
```

### 2. Update League Model (make ownerId optional for system leagues)
```prisma
model League {
  id         String @id @default(cuid())
  name       String
  inviteCode String? @unique // Make optional for system leagues
  type       String? // "OVERALL" | "TRIBE" | "ROLE" | "CUSTOM" (NEW)
  shevet     String? // For TRIBE leagues
  role       String? // For ROLE leagues

  ownerId String? // Make optional
  owner   User?   @relation("LeagueOwner", fields: [ownerId], references: [id])

  teams   Team[]
  members LeagueMember[]
}
```

### 3. Update LeagueMember (keep userId, but add teamId for convenience)
```prisma
model LeagueMember {
  id String @id @default(cuid())

  userId   String
  leagueId String
  role     String // "admin" | "member"

  user   User   @relation(fields: [userId], references: [id])
  league League @relation(fields: [leagueId], references: [id])

  @@unique([leagueId, userId])
}
```

### 4. Team Model (keep as-is, but create one team per league)
- Teams are per-league, so create 3 teams (one for each league)

---

## 📋 IMPLEMENTATION STEPS

### Step 1: Schema Migration
```bash
npx prisma migrate dev --name add_signup_fields
```

### Step 2: Update Seed
- Create system leagues (Overall, 7 Tribe, 2 Role)
- Create a system admin user (or use first user as admin)
- Set `isAdmin: true` for admin emails

### Step 3: Auth System
**Option A: NextAuth.js (Recommended)**
```bash
npm install next-auth @auth/prisma-adapter
```

**Option B: Custom Session (Simpler)**
- Use cookies with JWT or session tokens
- Implement `signIn()` and `getCurrentUser()` helpers

### Step 4: Signup Flow
1. Validate all fields
2. Check email uniqueness
3. Hash password
4. Create User
5. Create 3 Teams (one per league)
6. Create 3 LeagueMemberships
7. Create SquadSlots for each team (5 slots each)
8. Auto-login user
9. Redirect to `/home`

### Step 5: Admin Assignment
- Add admin emails to env: `ADMIN_EMAILS=admin@example.com,other@example.com`
- Or create admin page to toggle `isAdmin` flag
- Update `isAdmin()` helper to check `User.isAdmin`

---

## 🎯 CORRECTED SIGNUP ACTION

```ts
export async function signupAction(form: any) {
  // ... validation ...

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create User
    const user = await tx.user.create({
      data: {
        email,
        passwordHash: await hash(password, 10),
        firstName,
        lastName,
        shevet,
        role,
        isAdmin: process.env.ADMIN_EMAILS?.split(',').includes(email) ?? false,
      },
    });

    // 2. Find leagues
    const overall = await tx.league.findFirst({ where: { type: "OVERALL" } });
    const tribe = await tx.league.findFirst({ where: { type: "TRIBE", shevet } });
    const roleLeague = await tx.league.findFirst({ where: { type: "ROLE", role } });

    // 3. Create 3 teams (one per league)
    const teams = await Promise.all([
      tx.team.create({
        data: {
          name: generateTeamName(firstName, lastName),
          userId: user.id,
          leagueId: overall.id,
          budget: 34,
        },
      }),
      tx.team.create({
        data: {
          name: generateTeamName(firstName, lastName),
          userId: user.id,
          leagueId: tribe.id,
          budget: 34,
        },
      }),
      tx.team.create({
        data: {
          name: generateTeamName(firstName, lastName),
          userId: user.id,
          leagueId: roleLeague.id,
          budget: 34,
        },
      }),
    ]);

    // 4. Create squad slots for each team
    for (const team of teams) {
      await Promise.all(
        ["GK1", "OUT1", "OUT2", "OUT3", "OUT4"].map((slotLabel) =>
          tx.squadSlot.create({
            data: { teamId: team.id, slotLabel },
          })
        )
      );
    }

    // 5. Create league memberships
    await tx.leagueMember.createMany({
      data: [
        { userId: user.id, leagueId: overall.id, role: "member" },
        { userId: user.id, leagueId: tribe.id, role: "member" },
        { userId: user.id, leagueId: roleLeague.id, role: "member" },
      ],
    });

    return user;
  });

  // 6. Auto-login
  await signIn("credentials", { email, password, redirect: false });
  return { ok: true };
}
```

---

## ⚠️ ADDITIONAL CONSIDERATIONS

1. **Email Verification**: Add flow later if needed
2. **Password Reset**: Add `/forgot-password` page
3. **Login Page**: Create `/login` page
4. **Session Management**: Implement proper session handling
5. **Error Handling**: Add field-level validation errors
6. **TypeScript Types**: Create proper types for form data
7. **Team Name Uniqueness**: Ensure team names are unique per league (they already are via userId+leagueId)

---

## 🔐 ADMIN PRIVILEGES

**Option 1: Environment Variable (Recommended for initial setup)**
```env
ADMIN_EMAILS=admin@example.com,superadmin@example.com
```

**Option 2: Admin Toggle Page**
- Create `/admin/users` page
- List all users
- Toggle `isAdmin` flag
- Only accessible to existing admins

**Option 3: Database Seed**
- Seed admin users with `isAdmin: true`
- Update via Prisma Studio or admin page later

---

## ✅ CHECKLIST

- [ ] Update Prisma schema with new fields
- [ ] Run migration
- [ ] Update seed to create system leagues
- [ ] Implement auth system (NextAuth or custom)
- [ ] Create signup page and form
- [ ] Create signup action with transaction
- [ ] Create squad slots on team creation
- [ ] Add admin assignment logic
- [ ] Update `isAdmin()` helper
- [ ] Create login page
- [ ] Test full signup flow
- [ ] Test admin privileges

