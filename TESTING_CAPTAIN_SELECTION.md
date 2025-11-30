# Testing Captain Selection - Pre-Push Checklist

## Quick Verification Steps

### 1. **TypeScript Compilation**
```bash
npx tsc --noEmit
```
✅ Should pass with no errors

### 2. **Linter Check**
```bash
# Check for linting errors in the pick-team directory
```
✅ No linter errors

### 3. **Start Dev Server**
```bash
npm run dev
```
✅ Server starts without errors

---

## Functional Testing

### 4. **Access Pick Team Page**
- Navigate to: `http://localhost:3000/pick-team`
- ✅ Page loads without errors
- ✅ Shows gameweek number and deadline
- ✅ Displays all 5 squad slots

### 5. **Check Captain UI (When Unlocked)**
- ✅ Each player card shows "Set Captain" button
- ✅ If a captain exists, shows yellow "Captain" badge
- ✅ Buttons are enabled (not grayed out)

### 6. **Test Captain Selection**
- Click "Set Captain" on any player
- ✅ Button changes to "Captain" (yellow background)
- ✅ Yellow "Captain" badge appears next to player name
- ✅ Previous captain (if any) loses captain status
- ✅ No errors in browser console
- ✅ Page refreshes smoothly (no full reload)

### 7. **Verify Database Update**
```bash
npx prisma studio
```
- Navigate to `SquadSlot` table
- ✅ Only ONE slot has `isCaptain = true` for your team
- ✅ The correct slot has `isCaptain = true`
- ✅ All other slots have `isCaptain = false`

### 8. **Test Locking Logic**

#### Test Case A: Deadline Passed
- Set gameweek deadline to past date in admin panel
- Go to `/pick-team`
- ✅ Red warning banner appears
- ✅ All "Set Captain" buttons are disabled
- ✅ Error message: "Captain selection is locked"

#### Test Case B: Transfers Closed
- Go to `/admin/transfers`
- Toggle "Transfers Open" to OFF
- Go to `/pick-team`
- ✅ Red warning banner appears
- ✅ All buttons disabled

#### Test Case C: Gameweek Finished
- Mark gameweek as finished in admin panel
- Go to `/pick-team`
- ✅ Red warning banner appears
- ✅ All buttons disabled

### 9. **Test Server Action Rejection**
- Lock the gameweek (deadline passed, finished, or transfers closed)
- Try to call the server action directly (if possible)
- ✅ Server action throws error: "Captain changes are locked for this gameweek."

### 10. **Test Edge Cases**
- ✅ Empty slot (no player) - no captain button shown
- ✅ Change captain multiple times - only one captain at a time
- ✅ No captain selected initially - all buttons work

### 11. **Verify Scoring Integration**
- Set a captain
- Enter player stats for that gameweek
- Run scoring (`/admin/gameweeks/[id]/points` → "Run Scoring")
- ✅ Captain's points are doubled in the calculation
- ✅ Check `GameweekScore` table - team total includes doubled captain points

---

## Code Review Checklist

### 12. **Verify Files Changed**
```bash
git status
```
Should show:
- ✅ `src/app/pick-team/actions.ts` (new file)
- ✅ `src/app/pick-team/page.tsx` (modified)
- ✅ `src/app/pick-team/types.ts` (modified)
- ✅ `src/app/pick-team/PickTeamClient.tsx` (modified)

### 13. **Check for Console Errors**
- Open browser DevTools (F12)
- Navigate through pick-team page
- ✅ No console errors
- ✅ No TypeScript errors in terminal

### 14. **Verify Default Values**
- Check that `transfersOpen` defaults to `true` (not `false`)
- ✅ In `actions.ts`: `?? true`
- ✅ In `page.tsx`: `?? true`

---

## Quick Test Script

Run this in your browser console on `/pick-team`:

```javascript
// Check if captain selection is working
const buttons = document.querySelectorAll('button');
const captainButtons = Array.from(buttons).filter(btn => 
  btn.textContent.includes('Captain')
);
console.log('Captain buttons found:', captainButtons.length);
console.log('Should be 5 (one per player slot)');
```

---

## Final Pre-Push Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] No linter errors
- [ ] Dev server runs without errors
- [ ] Can select captain when unlocked
- [ ] Captain badge appears correctly
- [ ] Only one captain per team
- [ ] Locking works (deadline, finished, transfers closed)
- [ ] Buttons disabled when locked
- [ ] Database updates correctly
- [ ] No console errors
- [ ] Scoring engine doubles captain points (if tested)

---

## If Something Fails

1. **TypeScript errors**: Check Prisma client is generated (`npx prisma generate`)
2. **UI not updating**: Check `router.refresh()` is called after captain selection
3. **Locking not working**: Verify `isLocked` calculation matches transfers logic
4. **Database not updating**: Check transaction in `setCaptainAction`
5. **Captain not doubling**: Verify scoring engine checks `slot.isCaptain`

