

# Migrate All Data to Cloud Database (Fresh Start)

## What Changes

Currently, diary entries (meals, exercises), health logs, saved meals, default meals, saved exercises, weight history, and other profile settings are stored in **localStorage** — meaning data is lost if the user clears their browser or switches devices. This plan moves everything to the cloud database so data persists with the user's account.

## Database Changes (New Tables + Profile Columns)

### 1. New table: `diary_entries`
Stores daily meal and exercise logs, one row per user per date.
- `id`, `user_id`, `date` (unique per user+date)
- `meals` (JSONB — array of MealEntry objects)
- `exercises` (JSONB — array of Exercise objects)

### 2. New table: `health_entries`
Stores daily health/mental logs, one row per user per date.
- `id`, `user_id`, `date` (unique per user+date)
- `data` (JSONB — the full HealthEntry object: sleep, stress, mood, emotions, poop, diary text)

### 3. New table: `saved_meals`
- `id`, `user_id`, `name`, `items` (JSONB)

### 4. New table: `saved_exercises`
- `id`, `user_id`, `name`, `duration`, `calories_burned`, `secondary_metric`, `secondary_unit`

### 5. New table: `default_meals`
- `id`, `user_id`, `name`, `meal_type`, `items` (JSONB), `frequency`, `specific_days` (int[]), `created_at_date` (text)

### 6. New table: `default_meal_overrides`
- `id`, `user_id`, `default_meal_id`, `date`, `removed` (boolean)

### 7. Add columns to `profiles` table
- `weight_history` (JSONB), `cycle_start_date` (text), `cycle_duration` (int), `tracked_nutrients` (text[]), `nutrient_target_overrides` (JSONB), `cholesterol_level` (text), `subscription` (text), `ai_scans_used` (int)

All tables get RLS policies scoped to `auth.uid() = user_id`.

## Code Changes

### 1. Rewrite `useUserStore` data loading/saving
- Remove `localStorage` reads/writes for `nuria_diary`, `nuria_health`, `nuria_profile`
- On mount (when user is authenticated), load diary, health, saved meals, default meals, exercises from their respective tables
- Each mutation (add food, remove exercise, update health, etc.) writes to the cloud database instead of localStorage
- Use debounced upserts for diary/health entries (JSONB columns update on each change)

### 2. Update `App.tsx` profile loading
- `loadProfileFromDB` already loads from the database — extend it to also load the new columns (weight_history, cycle info, tracked nutrients, etc.)
- Profile saves (`persistToDB` in Profile.tsx) already write to the database — extend to include new columns

### 3. Update Profile.tsx persistence
- Saved meals, default meals, saved exercises CRUD operations call the new tables instead of updating localStorage via `setProfile`

## What Users Experience
- Fresh start: no historical localStorage data carries over
- All data syncs across devices and survives browser clearing
- No UI changes — everything works the same, just backed by the cloud

## Estimated Scope
~8–10 credits across migrations and code changes.

