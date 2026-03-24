

# Fix 5 UI/UX Issues

## 1. Password visibility toggle not working (LoginPage + SignupPage)

The eye icon buttons have `type="button"` and toggle `showPassword` state correctly in the code. The issue is likely that the button click is being swallowed by form event handling or the button's tap target is too small. I'll add `z-10` to ensure the button is above the input and add `e.preventDefault(); e.stopPropagation()` to the click handlers.

**Files:** `src/components/LoginPage.tsx`, `src/components/SignupPage.tsx`

## 2. Logout button styling — remove red, make subtle

Change the logout button from `variant="destructive"` to `variant="ghost"` with black text and no background color.

**File:** `src/pages/Profile.tsx` (line ~1710)

## 3. Remove default meal dialog button colors

- "Remove just for today" → light pink background (`bg-pink-50 text-foreground border-pink-200`)
- "Remove permanently" → black outline, black text, no color (`variant="outline"` with explicit black text)

**File:** `src/components/RemoveDefaultMealDialog.tsx`

## 4. Default meal duplication on first save

**Root cause:** When a user adds items to a meal section manually, then saves those items as a default meal, the items exist in both:
- The diary's logged items (already added manually)
- The default meal system (via `getDefaultMealsForDate`)

`getMealItems()` merges both, showing duplicates.

**Fix:** In `handleSaveAsDefault` in `Diary.tsx`, after creating the default meal, remove the original manually-logged items from the diary for that day (since the default meal system will now show them). This prevents double-counting.

**File:** `src/pages/Diary.tsx`

## 5. Add quantity multiplier to full grouped meals (not just ingredients)

Add a `QuickMultiplierPopover` to the grouped meal header row in `MealSection.tsx`. When a multiplier is selected, apply it to ALL items in the group (scale calories, protein, carbs, fat, and update quantity strings).

**File:** `src/components/MealSection.tsx` — add multiplier button next to the group's calorie display in the header bar (near the existing star/plus/x buttons).

## Files to modify

| File | Changes |
|------|---------|
| `src/components/LoginPage.tsx` | Fix password toggle |
| `src/components/SignupPage.tsx` | Fix password toggle (2 fields) |
| `src/pages/Profile.tsx` | Subtle logout button |
| `src/components/RemoveDefaultMealDialog.tsx` | Button color changes |
| `src/pages/Diary.tsx` | Remove manual items when saving as default |
| `src/components/MealSection.tsx` | Add group-level multiplier |

