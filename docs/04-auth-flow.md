# 04 — Authentication Flow

Innomax uses **Supabase Auth** for all authentication. Two strategies are supported:

1. Email / Password (with email confirmation)
2. Google OAuth

---

## Sign-Up Flow

```
User fills sign-up form
        │
        ▼
supabase.auth.signUp({ email, password })
        │
        ├── Success → "Check your email" message shown
        │                   │
        │                   ▼
        │           User clicks confirmation link
        │                   │
        │                   ▼
        │           Supabase redirects to /auth/callback
        │                   │
        │                   ▼
        │           Session created → user redirected to /
        │
        └── Error → inline error message displayed
```

### Key file: [app/auth/page.tsx](../app/auth/page.tsx)

```tsx
// Simplified sign-up call
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
})
```

---

## Login Flow

```
User fills login form
        │
        ▼
supabase.auth.signInWithPassword({ email, password })
        │
        ├── Success → session set in UserContext → redirect to /
        │
        ├── "Email not confirmed" → resend link offered
        │
        └── Error → inline error message displayed
```

---

## Google OAuth Flow

```
User clicks "Continue with Google"
        │
        ▼
supabase.auth.signInWithOAuth({ provider: 'google',
  redirectTo: `${origin}/auth/callback` })
        │
        ▼
Browser redirected to Google consent screen
        │
        ▼
Google redirects back to /auth/callback with code
        │
        ▼
app/auth/callback/route.ts exchanges code for session
        │
        ▼
User redirected to / (logged in)
```

### Key file: [app/auth/callback/route.ts](../app/auth/callback/route.ts)

---

## Session Persistence

`UserContext` initialises the session on mount and listens for changes:

```tsx
// contexts/UserContext.tsx (simplified)
useEffect(() => {
  supabase.auth.getSession().then(({ data }) => setSession(data.session))

  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session)
    setUser(session?.user ?? null)
  })

  return () => listener.subscription.unsubscribe()
}, [])
```

The session is stored automatically in a browser cookie by `@supabase/ssr`.

---

## Sign-Out Flow

```
User clicks Sign Out
        │
        ▼
supabase.auth.signOut()   (called via UserContext.signOut())
        │
        ▼
onAuthStateChange fires → session = null → user = null
        │
        ▼
CartContext clears remote cart reference → falls back to localStorage
        │
        ▼
User redirected to /auth
```

---

## Auth State Available Everywhere

`UserContext` exports:

| Value | Type | Description |
|---|---|---|
| `user` | `User \| null` | Supabase user object |
| `session` | `Session \| null` | Full session (includes access token) |
| `isLoading` | `boolean` | True during initial session check |
| `signOut` | `() => void` | Signs out and clears state |

Import via:

```tsx
import { useUser } from '@/contexts/UserContext'

const { user, signOut } = useUser()
```

---

## Protected Routes

There is no built-in middleware guard yet. Individual pages check `user` from `UserContext` and redirect manually:

```tsx
useEffect(() => {
  if (!isLoading && !user) router.push('/auth')
}, [user, isLoading])
```

For admin routes, `app/admin/layout.tsx` wraps with `AdminContext`.
