

# Add Red Logout Button to Profile Page

## Changes

**File: `src/pages/Profile.tsx`**

1. Add `LogOut` to the lucide-react import on line 22
2. Insert a red logout button just before `<BottomNav />` (before line 1709):

```tsx
<div className="px-4 pb-4">
  <Button
    variant="destructive"
    className="w-full h-12 rounded-xl"
    onClick={async () => {
      await supabase.auth.signOut();
    }}
  >
    <LogOut className="mr-2" size={18} />
    Log Out
  </Button>
</div>
```

The `onAuthStateChange` listener in `App.tsx` already handles session removal — it will set session to `null` and switch the screen back to `"landing"`.

No other files need changes.

