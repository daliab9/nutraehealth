

# Fix: Saved Meals Not Persisting After Logout/Login

## Root Cause

When you save a meal, the code generates an ID using `Date.now().toString()` (e.g., `"1774225788000"`). But the `saved_meals` database table expects the `id` column to be a **UUID** (e.g., `"a1b2c3d4-..."`). The insert silently fails because a numeric string is not a valid UUID, so the meal only exists in memory — it's lost on logout.

The same issue likely affects **saved exercises**, **default meals**, and **default meal overrides**, which all use `Date.now().toString()` for IDs but have UUID columns in the database.

## Fix

### 1. Replace `Date.now().toString()` with `crypto.randomUUID()`

Update all places where these IDs are generated:

- **`src/pages/Diary.tsx`** — meal save, exercise save, default meal creation, override creation
- **`src/pages/Profile.tsx`** — meal creation, default meal creation, exercise saving
- **`src/components/MealSection.tsx`** — if IDs are generated here
- **`src/components/SaveMealModal.tsx`** — if IDs are generated here

Search for `Date.now().toString()` across these files and replace with `crypto.randomUUID()` wherever the result is used as an `id` for a database-backed entity (saved meals, saved exercises, default meals, overrides).

### 2. No database changes needed

The tables and RLS policies are already correct. The only issue is the ID format mismatch.

## What This Fixes
- Saved meals persist across sessions
- Saved exercises persist across sessions
- Default meals and their overrides persist across sessions

