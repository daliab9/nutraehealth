

# Fix Logout Button + Spacing

## Issues

1. **Logout doesn't work**: `onAuthStateChange` in `App.tsx` sets `session` to null on sign-out, but never updates `screen` to `"landing"` — so the app stays on the main view.
2. **Spacing is off**: The logout button div uses `px-4 pb-4` without matching the section spacing above it.

## Changes

### 1. `src/App.tsx` — Fix sign-out redirect
In the `onAuthStateChange` callback (line 42-48), add a check: when `sess` becomes `null` (user signed out), set `screen` to `"landing"`.

```tsx
supabase.auth.onAuthStateChange((event, sess) => {
  setSession(sess);
  if (event === "PASSWORD_RECOVERY") {
    setScreen("reset-password");
  }
  if (!sess) {
    setScreen("landing");
  }
});
```

### 2. `src/pages/Profile.tsx` — Fix spacing
Change the logout button wrapper (line 1709) from `px-4 pb-4` to `px-4 py-6` to give it even spacing consistent with the rest of the page sections.

