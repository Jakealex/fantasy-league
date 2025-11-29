# Testing Guide: Scoring Engine

## Prerequisites
1. Database is seeded (run `npx prisma migrate reset` if needed)
2. Dev server is running (`npm run dev`)
3. You have admin access (first user in database is admin by default)

## Step-by-Step Testing

### 1. Start the Dev Server
```bash
npm run dev
```

### 2. Access Admin Gameweeks Page
Navigate to: `http://localhost:3000/admin/gameweeks`

You should see:
- List of gameweeks (or create one if none exist)
- Each gameweek should have a link to "Enter Points"

### 3. Create/Select a Gameweek
- If no gameweek exists, click "Create Gameweek"
- Fill in:
  - Number: 1
  - Name: "Gameweek 1" (optional)
  - Start Date: Any future date
  - Deadline: Any future date
  - Mark as Current: Yes
- Click "Create Gameweek"

### 4. Enter Player Stats
- Click "Enter Points" for your gameweek
- You should see a table with all players and columns:
  - Player, Team, Position
  - Goals, Assists, Own Goals, Yellow Cards, Red Cards, Goals Conceded
  - Points

**Test Data Example:**
For a goalkeeper (e.g., "John Keeper"):
- Goals: 0
- Assists: 0
- Own Goals: 0
- Yellow Cards: 0
- Red Cards: 0
- Goals Conceded: 2
- Points: 0 (will be calculated)

For an outfield player (e.g., "Josh Berson"):
- Goals: 2
- Assists: 1
- Own Goals: 0
- Yellow Cards: 1
- Red Cards: 0
- Goals Conceded: 2 (team conceded 2 goals)
- Points: 0

### 5. Set a Captain
You need to set a captain for at least one team. You can do this via:
- Database directly, OR
- Update the pick-team page to allow captain selection

**Quick DB Test:**
```sql
-- Find a team and slot
UPDATE "SquadSlot" 
SET "isCaptain" = true 
WHERE "slotLabel" = 'OUT1' 
AND "teamId" = (SELECT id FROM "Team" LIMIT 1);
```

Or use Prisma Studio:
```bash
npx prisma studio
```
- Navigate to SquadSlot table
- Find a slot with a player
- Set `isCaptain` to `true`

### 6. Save Stats
- Click "Save All" button
- You should see: "Stats saved successfully!"

### 7. Run Scoring
- Click the "Run Scoring" button (blue button above the table)
- Wait for the message: "Scoring completed successfully!"

### 8. Verify Scores Were Calculated

**Option A: Check Database**
```bash
npx prisma studio
```
- Navigate to `GameweekScore` table
- You should see rows with calculated `total` values

**Option B: Query via Terminal**
```bash
npx prisma db execute --stdin
```
Then paste:
```sql
SELECT 
  t.name as team_name,
  gs.total as score,
  g.number as gameweek
FROM "GameweekScore" gs
JOIN "Team" t ON t.id = gs."teamId"
JOIN "Gameweek" g ON g.id = gs."gameweekId"
ORDER BY gs.total DESC;
```

### 9. Manual Calculation Verification

**Example Calculation (Goalkeeper with 2 goals conceded, NOT captain):**
- Goals: 0 × 5 = 0
- Assists: 0 × 3 = 0
- Own Goals: 0 × -2 = 0
- Yellow Cards: 0 × -1 = 0
- Red Cards: 0 (no red card)
- Goalkeeper bonus: 7 - 2 = 5
- **Total: 5 points**

**Example Calculation (Outfield with 2 goals, 1 assist, 1 yellow, 2 conceded, NOT captain):**
- Goals: 2 × 5 = 10
- Assists: 1 × 3 = 3
- Own Goals: 0 × -2 = 0
- Yellow Cards: 1 × -1 = -1
- Red Cards: 0
- Outfield bonus: +1 (goalsConceded ≤ 3)
- **Total: 13 points**

**Example Calculation (Same player, but IS captain):**
- Base total: 13
- Captain multiplier: 13 × 2 = **26 points**

### 10. Test Edge Cases

**Test Red Card Override:**
- Set Yellow Cards: 2
- Set Red Cards: 1
- Expected: Only -3 for red card (yellow cards ignored)

**Test Goalkeeper Negative Points:**
- Goals Conceded: 10
- Expected: 7 - 10 = -3 points

**Test Outfield No Bonus:**
- Goals Conceded: 4
- Expected: No +1 bonus (only if ≤ 3)

## Expected Results

✅ **Success Indicators:**
- Stats save without errors
- "Run Scoring" button completes without errors
- `GameweekScore` table has entries with calculated totals
- Scores match manual calculations
- Captain doubling works correctly
- Red card overrides yellow card penalty

❌ **Failure Indicators:**
- Error messages when saving/running scoring
- No entries in `GameweekScore` table
- Scores don't match expected calculations
- Console errors in browser/dev server

## Troubleshooting

**"Unauthorized" error:**
- Check that you're logged in as admin
- Verify `isAdmin()` returns true (check first user owns a league)

**No teams found:**
- Run seed: `npx prisma migrate reset` (this will seed test data)

**Scores are 0:**
- Verify players have stats entered
- Check that teams have 5 squad slots filled
- Ensure players are assigned to slots

**Captain not working:**
- Verify `isCaptain` is set to `true` in database
- Check that the slot has a player assigned
