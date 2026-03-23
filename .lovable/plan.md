# Fix disappearing meals after tab changes

## What I found

This does not look like a database schema or RLS problem.

I checked the backend and there is already at least one `diary_entries` row being written, which means meal logging can reach the database. The bigger issue is in the frontend state architecture:

- `useUserStore.ts` is named like a shared store, but it is actually just a custom hook using `useState`
- `App.tsx` calls `useUserStore()` and loads data from the backend into that instance
- `Diary.tsx`, `Profile.tsx`, `Tracker.tsx` also each call `useUserStore()` again, creating separate isolated instances

So the app currently has multiple independent copies of the “store”.

## Why meals disappear

When you add a meal in Diary:

- it updates the Diary page’s private hook state
- when you switch tabs, that page can unmount/remount
- on remount, a fresh empty hook instance is created
- the data that was loaded in `App.tsx` is in a different store instance, so Diary does not see it

That matches your symptom exactly: the meal appears briefly, then disappears when you navigate away and back.

## Implementation plan

### 1. Make the user store truly shared

Refactor `src/stores/useUserStore.ts` so the app uses one shared store instance instead of creating a new one in every component.

Preferred approach:

- create a `UserStoreProvider`
- keep the existing store logic inside that provider
- expose `useUserStore()` as a context hook so all pages read the same state

### 2. Wrap the app with the shared provider

Update `src/App.tsx` so `AppContent`, `Diary`, `Profile`, `Tracker`, and `HealthDiary` all consume the same user-store instance.

This ensures:

- backend-loaded data is visible everywhere
- diary changes survive route switches
- saved meals/default meals/exercises stay in sync across pages

### 3. Keep backend hydration on the shared instance

Leave the current backend loading flow in `App.tsx`, but make sure it writes into the shared store instance.

Also add a simple hydration guard so pages do not render “empty” state before the initial backend load finishes.

### 4. Clear shared state properly on logout

When signing out, reset the shared store to defaults so the next user does not briefly see stale data.

## Files to update

- `src/stores/useUserStore.ts`
- `src/App.tsx`
- any page/component currently calling `useUserStore()` directly:
  - `src/pages/Diary.tsx`
  - `src/pages/Profile.tsx`
  - `src/pages/Tracker.tsx`
  - `src/pages/HealthDiary.tsx`

## Expected result

After this change:

- adding a meal should remain visible when switching tabs
- meals already saved in the backend should reappear consistently
- the app will use one source of truth instead of multiple disconnected local copies

## Technical note

There may still be secondary improvements worth adding after this:

- explicit error logging in `dbPersistence.ts`
- optimistic-save indicators / loading state
- converting `useAppointmentStore` to the same shared pattern, since it currently has the same architectural issue