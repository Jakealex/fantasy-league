# Admin Guide - Bnei Fantasy League

## Overview

This guide covers all admin roles and actions available in the Bnei Fantasy League application. Admin access is granted to specific email addresses configured in the system.

---

## 🔐 Admin Access

### Who Can Be an Admin?

Admin access is determined by email address. The following emails have admin privileges:
- `jakeshapiro007@gmail.com`
- `jboner2111@gmail.com`

**Note:** Additional admin emails can be configured via the `ADMIN_EMAILS` environment variable (comma-separated list).

### How to Access Admin Pages

1. **Log in** with an admin email address
2. Navigate to admin pages via direct URLs (they are not shown in the main navigation for security)
3. Admin pages require authentication and will redirect non-admin users

---

## 📍 Admin Pages & Routes

### 1. Gameweek Management
**URL:** `/admin/gameweeks`

**Purpose:** Create, edit, and manage gameweeks (the time periods for fantasy competition).

**Actions Available:**

#### Create New Gameweek
- Click **"Create New Gameweek"** button
- Fill in the form:
  - **Gameweek Number:** Sequential number (e.g., 1, 2, 3...)
  - **Name:** Optional display name (e.g., "Gameweek 1")
  - **Starts At:** When the gameweek begins (date/time)
  - **Deadline At:** When transfers/team changes lock (date/time)
- Click **"Create"** to save

#### Edit Gameweek Deadline
- Click the **edit icon** (pencil) next to a gameweek's deadline
- Enter new deadline date/time
- Click **"Save"** to update

#### Set Current Gameweek
- Toggle the **"Is Current"** switch for the gameweek you want to make active
- **Important:** Only one gameweek can be current at a time
- Setting a new gameweek as current automatically unsets the previous one

#### Mark Gameweek as Finished
- Toggle the **"Is Finished"** switch
- Finished gameweeks:
  - Can no longer be edited by users
  - Are included in standings calculations
  - Lock all transfers and team changes

#### View/Edit Player Points
- Click **"View Points"** button next to any gameweek
- This opens the Player Points page for that gameweek

---

### 2. Player Points Management
**URL:** `/admin/gameweeks/[id]/points`

**Purpose:** Enter and manage player statistics for a specific gameweek.

**Actions Available:**

#### Enter Player Statistics
For each player, you can enter:
- **Goals:** Number of goals scored
- **Assists:** Number of assists
- **Own Goals:** Number of own goals (negative points)
- **Yellow Cards:** Number of yellow cards
- **Red Cards:** Number of red cards (overrides yellow cards)
- **Goals Conceded:** Number of goals conceded (for GK and defensive calculations)

#### Save Player Points
- Click **"Save All Player Points"** button
- This saves all statistics for all players
- The system automatically calculates individual player points based on the scoring rules

#### Run Scoring
- After entering all player statistics, click **"Run Scoring"** button
- This calculates and saves team scores for the gameweek
- Scoring applies:
  - Base stats (goals, assists, cards, etc.)
  - Goalkeeper formula (7 - goals conceded)
  - Outfield defensive bonus (if team conceded ≤ 3)
  - Captain doubling (2× points for captain)

**Important Workflow:**
1. Enter all player statistics
2. Save player points
3. Run scoring to calculate team totals
4. Mark gameweek as finished (in Gameweek Management) when ready

---

### 3. Player Management
**URL:** `/admin/players`

**Purpose:** View and edit player prices in the database.

**Actions Available:**

#### Edit Player Price
- Click **"Edit Price"** next to any player
- Enter the new price (must be between 0 and 100)
- Click **"Save"** to update
- Changes take effect immediately

#### Search and Filter
- Use the search box to find players by name or team
- Use the team filter dropdown to show only specific teams
- Table shows: Name, Team, Position, Status, and Current Price

**When to Use:**
- Adjust player prices based on performance
- Correct pricing errors
- Update prices for new players

**Note:** 
- Price changes affect all users immediately
- Users who already have the player in their squad keep them at the old price until they transfer
- Budget calculations use the current price when making transfers

---

### 4. Transfer Settings
**URL:** `/admin/transfers`

**Purpose:** Globally control whether transfers are allowed across the entire system.

**Actions Available:**

#### Toggle Transfers On/Off
- Use the **toggle switch** to open or close transfers
- **Transfers Open (ON):** Users can make transfers (if gameweek deadline hasn't passed)
- **Transfers Closed (OFF):** All transfers are blocked system-wide, regardless of gameweek deadlines

**When to Use:**
- **Close transfers** during maintenance or if you need to freeze all team changes
- **Open transfers** to allow normal operation
- This is a global override that affects all users

**Note:** Transfers are also blocked by:
- Gameweek deadline passing
- Gameweek marked as finished

---

## 🔄 Typical Admin Workflow

### Setting Up a New Gameweek

1. **Create the Gameweek**
   - Go to `/admin/gameweeks`
   - Click "Create New Gameweek"
   - Enter gameweek number, name, start time, and deadline
   - Save

2. **Set as Current**
   - Toggle "Is Current" ON for the new gameweek
   - This makes it the active gameweek users see

3. **Wait for Deadline**
   - Users can make transfers and pick teams until the deadline
   - Monitor the deadline time

4. **After Deadline (Enter Stats)**
   - Go to `/admin/gameweeks/[id]/points`
   - Enter all player statistics for the gameweek
   - Click "Save All Player Points"

5. **Calculate Scores**
   - Click "Run Scoring" to calculate all team scores
   - Verify scores look correct

6. **Mark as Finished**
   - Go back to `/admin/gameweeks`
   - Toggle "Is Finished" ON for the completed gameweek
   - This adds it to standings and locks all changes

7. **Set Next Gameweek**
   - Create the next gameweek
   - Set it as current
   - Repeat the process

---

## ⚠️ Important Notes & Best Practices

### Gameweek Management
- **Only one current gameweek:** The system enforces that only one gameweek can be "current" at a time
- **Deadline timing:** Set deadlines carefully - once passed, users cannot make changes
- **Finished gameweeks:** Once marked finished, they cannot be unfinished (be careful!)

### Player Points
- **Enter stats before scoring:** Always enter all player statistics before running scoring
- **Double-check stats:** Verify player statistics are correct before running scoring
- **Re-run scoring:** You can re-run scoring if you need to recalculate (e.g., after fixing stats)

### Transfer Settings
- **Global override:** The transfer toggle affects ALL users system-wide
- **Use sparingly:** Only close transfers globally if absolutely necessary
- **Normal operation:** Usually, transfers should be open and controlled by gameweek deadlines

### Scoring Rules (Automatic)
The system automatically applies these rules when running scoring:
- **Goals:** +5 points
- **Assists:** +3 points
- **Own Goals:** -2 points
- **Yellow Cards:** -1 point
- **Red Cards:** -3 points (overrides yellow)
- **Goalkeeper:** 7 - goals conceded
- **Outfield Defensive Bonus:** +1 if team conceded ≤ 3
- **Captain:** 2× total points

---

## 🚨 Troubleshooting

### Users Can't Make Transfers
1. Check if transfers are globally closed (`/admin/transfers`)
2. Check if gameweek deadline has passed
3. Check if gameweek is marked as finished

### Scores Not Showing
1. Verify player points have been entered
2. Verify "Run Scoring" has been executed
3. Verify gameweek is marked as finished (for standings)

### Wrong Scores Calculated
1. Check player statistics are correct
2. Re-run scoring after fixing stats
3. Verify captain selections are correct

### Can't Set Gameweek as Current
1. Check if another gameweek is already current
2. The system will automatically unset the previous current gameweek

---

## 📞 Support

If you encounter issues or need help:
1. Check this guide first
2. Review the error messages shown on admin pages
3. Contact the system administrator

---

## 🔒 Security Notes

- Admin pages are protected - only admin emails can access them
- All admin actions require authentication
- Non-admin users are automatically redirected if they try to access admin pages
- Admin actions are logged server-side for audit purposes

---

## 🗄️ Database Access (Prisma Studio)

### Viewing and Editing the Database

Your friend can access and edit the database directly using **Prisma Studio**, a visual database browser.

#### How to Open Prisma Studio

1. **Make sure you have the database connection:**
   - Ensure you have a `.env` file with `DATABASE_URL` set
   - The database URL should point to your PostgreSQL database

2. **Run Prisma Studio:**
   ```bash
   npm run studio
   ```
   Or directly:
   ```bash
   npx prisma studio
   ```

3. **Access the interface:**
   - Prisma Studio will open in your browser at `http://localhost:5555`
   - You'll see all your database tables (models) listed

#### What You Can Do in Prisma Studio

- **View all data** in any table (User, Team, League, Player, Gameweek, etc.)
- **Edit existing records** - click on any record to edit fields
- **Create new records** - use the "Add record" button
- **Delete records** - click the delete button on any record
- **Search and filter** - use the search bar to find specific records
- **View relationships** - see related data (e.g., a Team's User, League Members, etc.)

#### Common Use Cases

**Fix User Data:**
- Navigate to `User` table
- Find the user by email
- Edit fields like `firstName`, `lastName`, `shevet`, `role`
- Save changes

**Manually Adjust Player Points:**
- Navigate to `PlayerPoints` table
- Filter by `gameweekId`
- Edit stats (goals, assists, cards, etc.)
- Save and re-run scoring

**Create/Edit Gameweeks:**
- Navigate to `Gameweek` table
- Create new gameweek or edit existing ones
- Set `isCurrent`, `isFinished`, deadlines, etc.

**View Team Compositions:**
- Navigate to `SquadSlot` table
- See which players are in which teams
- Edit captain selections (`isCaptain` field)

**Check League Memberships:**
- Navigate to `LeagueMember` table
- See which teams are in which leagues
- Add/remove league memberships if needed

#### Important Notes

- **Be careful with deletions** - deleting records can break relationships
- **Backup first** - Consider backing up data before making bulk changes
- **Test changes** - Verify changes work correctly in the app after editing
- **Database connection required** - Prisma Studio needs `DATABASE_URL` in `.env`

#### Troubleshooting

**"Can't connect to database":**
- Check your `.env` file has `DATABASE_URL` set correctly
- Verify the database is running and accessible
- Check network/firewall settings

**"Prisma Client not generated":**
- Run `npx prisma generate` first
- Then try `npm run studio` again

---

**Last Updated:** Based on current codebase as of implementation date.

