# Database Structure Guide

This document describes all the tables you should see in Prisma Studio and what data they contain.

---

## 📊 **All Database Tables**

When you open Prisma Studio (`npm run studio`), you should see these **13 tables**:

### 1. **User**
**Purpose:** Stores user accounts (players/managers)

**Fields:**
- `id` - Unique identifier (cuid)
- `email` - User's email (unique, required)
- `passwordHash` - Hashed password
- `firstName` - First name (optional)
- `lastName` - Last name (optional)
- `shevet` - User's shevet/tribe (optional)
- `role` - "Maddie" or "Channie" (optional)
- `emailVerified` - Email verification timestamp (optional)
- `resetToken` - Password reset token (optional)
- `resetTokenExpires` - Reset token expiration (optional)

**After Seed:**
- 1 user: `admin@example.com` (password: `password123`)

**After Signups:**
- One row per registered user

---

### 2. **League**
**Purpose:** Stores all leagues (Overall, Shevet, Role-based, Custom)

**Fields:**
- `id` - Unique identifier (cuid)
- `name` - League name (unique, required)
- `inviteCode` - Optional invite code for custom leagues
- `type` - "OVERALL" | "TRIBE" | "ROLE" | "CUSTOM"
- `shevet` - Shevet name (for TRIBE leagues)
- `role` - "Maddie" or "Channie" (for ROLE leagues)
- `ownerId` - User ID who owns the league (optional, null for system leagues)

**After Seed:**
- **10 leagues total:**
  - 1 Overall League (`type: "OVERALL"`)
  - 7 Shevet Leagues (`type: "TRIBE"`):
    - Ktan tanim
    - Gurim
    - Roim
    - Moledet
    - Chaim
    - Reim
    - Kaveh
  - 2 Role Leagues (`type: "ROLE"`):
    - Maddies League (`role: "Maddie"`)
    - Channies League (`role: "Channie"`)
  - 1 Demo League (`type: "CUSTOM"`, owned by admin user)

---

### 3. **Team**
**Purpose:** Stores fantasy teams (one per user, but can have multiple per league)

**Fields:**
- `id` - Unique identifier (cuid)
- `name` - Team name (e.g., "Jake Shapiro 123")
- `userId` - Owner's user ID
- `leagueId` - Primary league (optional)
- `budget` - Remaining budget (default: 34.0)

**After Seed:**
- 1 team: "Admin XI" (owned by admin user)

**After Signups:**
- One team per user (auto-created on signup)

---

### 4. **LeagueMember**
**Purpose:** Links teams to leagues (many-to-many relationship)

**Fields:**
- `id` - Unique identifier (cuid)
- `leagueId` - League ID
- `teamId` - Team ID
- `role` - Optional custom role

**After Seed:**
- 1 membership: Admin team → Demo League

**After Signups:**
- Each user's team is automatically added to:
  - Overall League
  - Their Shevet League
  - Their Role League (Maddie/Channie)

---

### 5. **Player**
**Purpose:** Stores real-world players available for fantasy teams

**Fields:**
- `id` - Unique identifier (cuid)
- `name` - Player name
- `teamName` - Real team name (e.g., "Team A")
- `position` - "GK" or "OUT"
- `price` - Player price (Float)
- `status` - "A" (Active) or "I" (Inactive)
- `ownedPct` - Ownership percentage (optional)
- `nextFixture` - Next fixture info (optional)
- `totalPoints` - Total points across all gameweeks (optional)
- `roundPoints` - Points for current round (optional)
- `goals` - Total goals (optional)
- `assists` - Total assists (optional)
- `cleanSheets` - Total clean sheets (optional)

**After Seed:**
- Multiple players (depends on seed data)
- Each player has: name, teamName, position, price, status

---

### 6. **SquadSlot**
**Purpose:** Stores which players are in which team slots

**Fields:**
- `id` - Unique identifier (cuid)
- `teamId` - Team ID
- `playerId` - Player ID (optional - can be empty)
- `slotLabel` - "GK1", "OUT1", "OUT2", "OUT3", "OUT4"
- `isCaptain` - Boolean (default: false)
- `isVice` - Boolean (default: false, for future use)

**After Seed:**
- 5 slots per team (GK1, OUT1-4)
- Initially empty (no players assigned)

**After Team Selection:**
- Each slot can have a player assigned
- One slot can be marked as captain

---

### 7. **Gameweek**
**Purpose:** Stores gameweek information (time periods for competition)

**Fields:**
- `id` - Auto-increment integer (1, 2, 3...)
- `number` - Gameweek number (unique, 1, 2, 3...)
- `name` - Display name (optional, e.g., "Gameweek 1")
- `startsAt` - When gameweek starts (DateTime)
- `deadlineAt` - Transfer/team change deadline (DateTime)
- `isCurrent` - Boolean (only one can be true)
- `isFinished` - Boolean (finished gameweeks are locked)

**After Seed:**
- 1 gameweek: Gameweek 1 (if seeded)

**After Admin Creates:**
- One row per gameweek created

---

### 8. **Fixture**
**Purpose:** Stores real-world match fixtures

**Fields:**
- `id` - Unique identifier (cuid)
- `homeTeam` - Home team name
- `awayTeam` - Away team name
- `kickoffAt` - Match start time (DateTime)
- `gameweekId` - Which gameweek this fixture belongs to

**After Seed:**
- 1 fixture (if seeded)

**After Admin Creates:**
- Multiple fixtures per gameweek

---

### 9. **ScoreEvent**
**Purpose:** Stores individual scoring events (goals, assists, etc.)

**Fields:**
- `id` - Unique identifier (cuid)
- `fixtureId` - Fixture ID
- `playerId` - Player ID
- `type` - "goal" | "assist" | "appearance"
- `value` - Point value

**After Seed:**
- 1 score event (if seeded)

**After Admin Creates:**
- Multiple events per fixture

---

### 10. **GameweekScore**
**Purpose:** Stores calculated team scores for each gameweek

**Fields:**
- `id` - Unique identifier (cuid)
- `teamId` - Team ID
- `gameweekId` - Gameweek ID
- `total` - Total points for this team in this gameweek

**After Seed:**
- 1 score (if seeded)

**After Scoring Runs:**
- One row per team per gameweek
- Only created after admin runs scoring

---

### 11. **PlayerPoints**
**Purpose:** Stores player statistics for each gameweek (used for scoring)

**Fields:**
- `id` - Auto-increment integer
- `playerId` - Player ID
- `gameweekId` - Gameweek ID
- `points` - Calculated points (default: 0)
- `goals` - Goals scored (default: 0)
- `assists` - Assists (default: 0)
- `ownGoals` - Own goals (default: 0)
- `yellowCards` - Yellow cards (default: 0)
- `redCards` - Red cards (default: 0)
- `goalsConceded` - Goals conceded by player's team (default: 0)

**After Seed:**
- Empty (no player points until admin enters them)

**After Admin Enters Stats:**
- One row per player per gameweek
- Admin enters stats, then runs scoring

---

### 12. **GlobalSettings**
**Purpose:** Global application settings

**Fields:**
- `id` - Always 1 (single row)
- `transfersOpen` - Boolean (default: true)

**After Seed:**
- 1 row with `id: 1`, `transfersOpen: true`

**After Admin Changes:**
- Same row, `transfersOpen` can be toggled

---

### 13. **_prisma_migrations**
**Purpose:** Prisma internal table (tracks migration history)

**Fields:**
- Internal Prisma fields

**Note:** Don't edit this table manually!

---

## 🔗 **Key Relationships**

### User → Team
- One user can have multiple teams (one per league)
- Each team belongs to one user

### Team → LeagueMember → League
- Teams join leagues through `LeagueMember`
- One team can be in multiple leagues
- One league has many teams

### Team → SquadSlot → Player
- Each team has 5 squad slots (GK1, OUT1-4)
- Each slot can have one player
- One player can be in multiple teams' squads

### Gameweek → GameweekScore → Team
- Each gameweek has scores for multiple teams
- Each team has one score per gameweek

### Gameweek → PlayerPoints → Player
- Each gameweek has stats for multiple players
- Each player has stats for multiple gameweeks

---

## 📋 **Expected Data After Fresh Seed**

After running `npm run db:seed`, you should see:

1. **User:** 1 user (admin@example.com)
2. **League:** 10 leagues (1 Overall, 7 Shevet, 2 Role, 1 Demo)
3. **Team:** 1 team (Admin XI)
4. **LeagueMember:** 1 membership (Admin team → Demo League)
5. **Player:** Multiple players (depends on seed data)
6. **SquadSlot:** 5 slots (empty, for Admin team)
7. **Gameweek:** 1 gameweek (if seeded)
8. **Fixture:** 1 fixture (if seeded)
9. **ScoreEvent:** 1 event (if seeded)
10. **GameweekScore:** 1 score (if seeded)
11. **PlayerPoints:** Empty (admin must enter)
12. **GlobalSettings:** 1 row (transfersOpen: true)

---

## 🎯 **What to Check in Prisma Studio**

### ✅ **Healthy Database Should Have:**
- At least 10 leagues (system leagues)
- At least 1 user (admin or signed-up users)
- Teams matching number of users
- LeagueMembers linking teams to leagues
- GlobalSettings with id = 1

### ⚠️ **Common Issues:**
- **Missing leagues:** Run seed again or create manually
- **No users:** Sign up or create via Prisma Studio
- **Empty PlayerPoints:** Admin needs to enter stats
- **No GameweekScores:** Admin needs to run scoring

---

## 🔧 **Quick Database Checks**

**Check if leagues exist:**
```sql
SELECT COUNT(*) FROM "League";
-- Should be at least 10
```

**Check if users exist:**
```sql
SELECT email, "firstName" FROM "User";
```

**Check team memberships:**
```sql
SELECT t.name, l.name 
FROM "Team" t
JOIN "LeagueMember" lm ON t.id = lm."teamId"
JOIN "League" l ON lm."leagueId" = l.id;
```

---

**Last Updated:** Based on current schema and seed file.

