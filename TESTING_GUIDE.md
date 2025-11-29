# Testing Guide: Gameweek Integration with Transfers

## Quick Verification Checklist

### ✅ 1. Visual Checks on `/transfers` Page

**What to look for:**
- [ ] Page displays: "Transfers for Gameweek 1" (or current gameweek number)
- [ ] Deadline is shown: "Deadline: Jan 3, 2025, 4:00 PM" (formatted date)
- [ ] If deadline passed: Red banner "Transfers are closed for this gameweek."
- [ ] If deadline not passed: No red banner, transfers should be enabled

---

### ✅ 2. Test Transfer Functionality

#### Test Case A: Transfers Open (Before Deadline)
1. **Setup:**
   - Ensure current gameweek has `deadlineAt` in the future
   - Ensure `GlobalSettings.transfersOpen = true`
   - Ensure `isFinished = false`

2. **Expected Behavior:**
   - ✅ Can click "Add to Squad" buttons
   - ✅ Can click "Remove" buttons
   - ✅ "Confirm Transfers" button is enabled
   - ✅ No red warning banners
   - ✅ Transfers submit successfully

#### Test Case B: Deadline Passed (Client-Side)
1. **Setup:**
   - Update gameweek `deadlineAt` to a past date:
   ```sql
   UPDATE "Gameweek" SET "deadlineAt" = '2024-01-01T00:00:00Z' WHERE "number" = 1;
   ```

2. **Expected Behavior:**
   - ✅ Red banner: "Transfers are closed for this gameweek."
   - ✅ All "Add to Squad" buttons are disabled
   - ✅ "Remove" buttons are disabled
   - ✅ "Confirm Transfers" button is disabled
   - ✅ Tooltips show "Transfers are closed"

#### Test Case C: Deadline Passed (Server-Side)
1. **Setup:** Same as Test Case B

2. **Test:**
   - Try to submit a transfer via API/action (even if client is disabled)
   - Use browser dev tools to manually call the action

3. **Expected Behavior:**
   - ✅ Server returns: `{ ok: false, message: "Deadline has passed. Transfers are locked." }`
   - ✅ Transfer is NOT saved to database

#### Test Case D: Gameweek Finished
1. **Setup:**
   ```sql
   UPDATE "Gameweek" SET "isFinished" = true WHERE "number" = 1;
   ```

2. **Expected Behavior:**
   - ✅ Server returns: `{ ok: false, message: "Gameweek is finished. Transfers are locked." }`
   - ✅ Transfer is NOT saved

#### Test Case E: No Current Gameweek
1. **Setup:**
   ```sql
   UPDATE "Gameweek" SET "isCurrent" = false WHERE "number" = 1;
   ```

2. **Expected Behavior:**
   - ✅ Page shows error: "No Active Gameweek"
   - ✅ Message: "There is no current gameweek configured. Please contact an administrator."

#### Test Case F: Global Settings + Deadline (Both Must Pass)
1. **Setup:**
   - Set `GlobalSettings.transfersOpen = false`
   - Keep deadline in future

2. **Expected Behavior:**
   - ✅ Transfers blocked (even if deadline hasn't passed)
   - ✅ Shows: "Transfers are currently closed."

---

## Step-by-Step Testing Instructions

### Step 1: Start Your Dev Server

```bash
npm run dev
```

### Step 2: Check Current Gameweek Status

Open your database or use Prisma Studio:

```bash
npx prisma studio
```

Navigate to `Gameweek` table and verify:
- There's a gameweek with `isCurrent = true`
- Note the `deadlineAt` value
- Note the `isFinished` value

### Step 3: Test Normal Flow (Before Deadline)

1. Navigate to: `http://localhost:3000/transfers`
2. **Verify UI shows:**
   - Gameweek number (e.g., "Transfers for Gameweek 1")
   - Deadline date/time
   - No red warning banners
3. **Try to make a transfer:**
   - Add a player to squad
   - Click "Confirm Transfers"
   - Should succeed and redirect to `/pick-team`

### Step 4: Test Deadline Lock (Client-Side)

1. **Update deadline to past:**
   ```sql
   -- In Prisma Studio or SQL client
   UPDATE "Gameweek" 
   SET "deadlineAt" = '2024-01-01T00:00:00Z' 
   WHERE "isCurrent" = true;
   ```

2. **Refresh `/transfers` page**
3. **Verify:**
   - Red banner appears
   - All buttons disabled
   - Cannot interact with transfers

### Step 5: Test Deadline Lock (Server-Side)

1. **Keep deadline in past** (from Step 4)
2. **Open browser DevTools** (F12)
3. **Try to bypass client-side lock:**
   - In Console, manually call the transfer action
   - Or use Network tab to intercept and modify request
4. **Verify:**
   - Server still rejects the transfer
   - Error message: "Deadline has passed. Transfers are locked."

### Step 6: Test Gameweek Finished Lock

1. **Update gameweek:**
   ```sql
   UPDATE "Gameweek" 
   SET "isFinished" = true 
   WHERE "isCurrent" = true;
   ```

2. **Try to submit transfer**
3. **Verify:**
   - Server returns: "Gameweek is finished. Transfers are locked."

### Step 7: Test No Current Gameweek

1. **Remove current gameweek:**
   ```sql
   UPDATE "Gameweek" 
   SET "isCurrent" = false 
   WHERE "isCurrent" = true;
   ```

2. **Refresh `/transfers` page**
3. **Verify:**
   - Error page shown
   - Message: "No Active Gameweek"

### Step 8: Reset for Normal Operation

```sql
-- Reset gameweek to normal state
UPDATE "Gameweek" 
SET 
  "isCurrent" = true,
  "isFinished" = false,
  "deadlineAt" = '2025-12-31T23:59:59Z'
WHERE "number" = 1;
```

---

## Automated Testing (Optional)

### Test Script

Create `test-gameweek.ts`:

```typescript
import { prisma } from "./src/lib/prisma";
import { getCurrentGameweek } from "./src/lib/gameweek";

async function test() {
  const gw = await getCurrentGameweek();
  console.log("Current gameweek:", gw);
  
  if (!gw) {
    console.error("❌ No current gameweek found");
    return;
  }
  
  const now = new Date();
  const deadlinePassed = now > gw.deadlineAt;
  
  console.log("Deadline:", gw.deadlineAt);
  console.log("Now:", now);
  console.log("Deadline passed:", deadlinePassed);
  console.log("Is finished:", gw.isFinished);
  
  if (deadlinePassed) {
    console.log("⚠️  Deadline has passed - transfers should be locked");
  } else {
    console.log("✅ Deadline not passed - transfers should be open");
  }
}

test();
```

Run with:
```bash
npx ts-node test-gameweek.ts
```

---

## Common Issues & Solutions

### Issue: "No Active Gameweek" error
**Solution:** Ensure at least one gameweek has `isCurrent = true`:
```sql
UPDATE "Gameweek" SET "isCurrent" = true WHERE "number" = 1;
```

### Issue: Transfers still work after deadline
**Check:**
1. Is `deadlineAt` actually in the past? (check timezone)
2. Did you refresh the page after updating deadline?
3. Is server-side check working? (check browser Network tab)

### Issue: TypeScript errors
**Solution:** Regenerate Prisma client:
```bash
npx prisma generate
```

### Issue: Buttons not disabling
**Check:**
1. Is `currentGameweek` prop being passed correctly?
2. Check browser console for errors
3. Verify date comparison logic in client component

---

## Verification Checklist Summary

- [ ] Page loads without errors
- [ ] Gameweek number displays correctly
- [ ] Deadline displays correctly (formatted)
- [ ] Before deadline: transfers work
- [ ] After deadline: client-side lock works
- [ ] After deadline: server-side lock works
- [ ] Finished gameweek: server rejects transfers
- [ ] No current gameweek: error page shows
- [ ] Global settings + deadline: both checks work
- [ ] TypeScript compiles without errors
- [ ] No console errors in browser

---

## Quick Test Commands

```bash
# Check current gameweek in database
npx prisma studio
# Navigate to Gameweek table

# Or use SQL directly
# Connect to your database and run:
SELECT * FROM "Gameweek" WHERE "isCurrent" = true;

# Update deadline to past (for testing)
UPDATE "Gameweek" 
SET "deadlineAt" = NOW() - INTERVAL '1 day'
WHERE "isCurrent" = true;

# Reset to future (for normal use)
UPDATE "Gameweek" 
SET "deadlineAt" = NOW() + INTERVAL '7 days'
WHERE "isCurrent" = true;
```

