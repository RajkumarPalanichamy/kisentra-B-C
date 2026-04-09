# 02 — Local Development Setup

## Prerequisites

| Tool | Minimum Version |
|---|---|
| Node.js | 18.x or later |
| npm | 9.x or later |
| Git | any recent version |
| Supabase account | free tier is sufficient |

---

## 1. Clone the Repository

```bash
git clone <repo-url>
cd kisentra-B-C
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Where to find these values

1. Go to [supabase.com](https://supabase.com) → your project → **Settings → API**
2. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> **Security note**: The `NEXT_PUBLIC_` prefix exposes these values to the browser.  
> The anon key is intentionally public — Supabase Row Level Security (RLS) is the actual guard.

---

## 4. Set Up Supabase

### Enable Authentication

1. Supabase Dashboard → **Authentication → Providers**
2. Enable **Email** provider (enable "Confirm email" if needed)
3. Enable **Google** provider → add OAuth client ID and secret from Google Cloud Console

### Create Database Tables

Run the SQL in [09-supabase-schema.md](09-supabase-schema.md) inside Supabase's **SQL Editor**.

---

## 5. Start the Dev Server

```bash
npm run dev
```

The app will be available at **http://localhost:3000**.

The dev server uses **Turbopack** for fast hot-module replacement.

---

## 6. Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Create an optimised production build |
| `npm run start` | Start the production server (after build) |
| `npm run lint` | Run ESLint checks |

---

## Common Issues

| Problem | Fix |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` is undefined | Ensure `.env.local` is in project root and restart dev server |
| Google OAuth redirect error | Set `http://localhost:3000/auth/callback` as an allowed redirect URI in Google Cloud Console |
| Email confirmation link not working | Check Supabase → Auth → URL Configuration → redirect URLs include `http://localhost:3000` |
| `npm install` fails on Windows | Run terminal as Administrator or use `npm install --legacy-peer-deps` |
