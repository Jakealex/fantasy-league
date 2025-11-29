# Testing Guide: PlayerPoints Admin Page

## Quick Verification Steps

### ✅ Step 1: Check the Database Model (30 seconds)

1. **Verify migration applied:**
   ```bash
   npx prisma studio
   ```
   - Navigate to `PlayerPoints` table
   - Should see an empty table (or existing data if any)

2. **Or check via SQL:**
   ```sql
   SELECT * FROM "PlayerPoints";
   ```

---

### ✅ Step 2: Access the Admin Page (1 minute)

1. **Start dev server** (if not running):
   ```bash
   npm run dev
   ```

2. **Navigate to gameweeks admin:**
   - Go to: `http://localhost:3000/admin/gameweeks`
   - Should see list of gameweeks

3. **Click "Edit Points" button:**
   - Should see a blue "Edit Points" button on each gameweek row
   - Click it for any gameweek

4. **Verify page loads:**
   - URL should be: `/admin/gameweeks/[id]/points`
   - Should see:
     - Header: "Gameweek X – Player Points"
     - "Back to Gameweeks" link
     - Table with players
     - "Save All" button

---

### ✅ Step 3: Test Point Entry (2 minutes)

1. **Enter some points:**
   - Find a player in the table
   - Change their points value (e.g., from 0 to 5)
   - Click "Save All"

2. **Verify success:**
   - Should see green message: "Points saved successfully!"
   - Page should remain on the same gameweek

3. **Refresh the page:**
   - Points should persist (still show the value you entered)
   - This confirms data was saved to database

---

### ✅ Step 4: Test Multiple Players (1 minute)

1. **Enter points for multiple players:**
   - Player 1: 5 points
   - Player 2: 10 points
   - Player 3: 0 points
   - Click "Save All"

2. **Verify all saved:**
   - Refresh page
   - All values should persist

---

### ✅ Step 5: Test Read-Only Mode (1 minute)

1. **Mark a gameweek as finished:**
   - Go to `/admin/gameweeks`
   - Toggle "Mark as Finished" ON for a gameweek
   - Click "Edit Points" for that gameweek

2. **Verify read-only:**
   - Should see yellow banner: "This gameweek is finished. Points are read-only."
   - All input fields should be disabled (grayed out)
   - "Save All" button should be disabled

---

### ✅ Step 6: Test Admin Protection (30 seconds)

1. **Try accessing without admin:**
   - If you have a way to test non-admin access
   - Should redirect to `/` (home page)

2. **Or check server action:**
   - Server action should throw "Unauthorized" if not admin

---

### ✅ Step 7: Verify Database Storage (1 minute)

1. **Check Prisma Studio:**
   ```bash
   npx prisma studio
   ```
   - Navigate to `PlayerPoints` table
   - Should see rows with:
     - `playerId` (matches a Player.id)
     - `gameweekId` (matches the gameweek you edited)
     - `points` (the value you entered)

2. **Verify unique constraint:**
   - Try entering points for the same player/gameweek twice
   - Should update existing row (not create duplicate)
   - Check in Prisma Studio - should only be one row per (playerId, gameweekId)

---

## Visual Checklist

When you visit `/admin/gameweeks/[id]/points`, you should see:

- [ ] Page title: "Gameweek X – Player Points"
- [ ] "Back to Gameweeks" link (top left)
- [ ] Table with columns: Player | Team | Position | Points
- [ ] All players listed in the table
- [ ] Number inputs for points (editable)
- [ ] "Save All" button (enabled)
- [ ] No errors in browser console

After saving:

- [ ] Green success message appears
- [ ] Page doesn't redirect
- [ ] Values persist after refresh

For finished gameweek:

- [ ] Yellow warning banner
- [ ] All inputs disabled
- [ ] "Save All" button disabled

---

## Quick Test Commands

```bash
# Check if PlayerPoints table exists
npx prisma studio
# Navigate to PlayerPoints table

# Or use SQL directly
# Connect to your database and run:
SELECT * FROM "PlayerPoints";

# Check specific gameweek points
SELECT p.name, pp.points, g.number as gameweek
FROM "PlayerPoints" pp
JOIN "Player" p ON pp."playerId" = p.id
JOIN "Gameweek" g ON pp."gameweekId" = g.id
WHERE g.id = 1;  -- Replace 1 with your gameweek ID
```

---

## Common Issues & Solutions

### Issue: "Edit Points" button not showing
**Solution:** Check that Link import was added to GameweeksAdminClient.tsx

### Issue: Page shows "Gameweek not found"
**Solution:** 
- Verify gameweek ID in URL matches an existing gameweek
- Check database has gameweeks: `SELECT * FROM "Gameweek";`

### Issue: Points not saving
**Check:**
1. Browser console for errors
2. Network tab for failed requests
3. Server logs for errors
4. Verify admin access (should redirect if not admin)

### Issue: Inputs not disabled for finished gameweek
**Check:**
1. Is `isFinished` actually `true` in database?
2. Refresh the page after marking as finished
3. Check browser console for errors

### Issue: TypeScript errors
**Solution:** Regenerate Prisma client:
```bash
npx prisma generate
```

---

## Expected Database State

After entering points for Gameweek 1:

```sql
-- Should see rows like:
PlayerPoints:
  id | playerId | gameweekId | points
  1  | "abc123" | 1          | 5
  2  | "def456" | 1          | 10
  3  | "ghi789" | 1          | 0
```

Each `(playerId, gameweekId)` combination should be unique.

---

## Full Test Scenario

1. **Setup:**
   - Ensure you have at least one gameweek
   - Ensure you have at least one player in database

2. **Test Flow:**
   - Go to `/admin/gameweeks`
   - Click "Edit Points" for Gameweek 1
   - Enter points: Player A = 5, Player B = 10
   - Click "Save All"
   - See success message
   - Refresh page → values persist ✅
   - Go back to gameweeks page
   - Mark gameweek as finished
   - Go back to points page
   - Verify read-only mode ✅

3. **Verify in Database:**
   - Open Prisma Studio
   - Check PlayerPoints table
   - See your saved values ✅

---

## Success Criteria

✅ Page loads without errors  
✅ Can enter points for players  
✅ "Save All" works  
✅ Points persist after refresh  
✅ Read-only mode works for finished gameweeks  
✅ Admin protection works  
✅ No duplicate rows in database  
✅ TypeScript compiles without errors  
✅ No console errors in browser

