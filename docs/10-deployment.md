# 10 — Deployment

## Build

```bash
npm run build
```

This outputs a production-optimised build to `.next/`. Check for any TypeScript or lint errors before deploying.

---

## Vercel (Recommended)

Vercel is the zero-config hosting platform made by the Next.js team.

### Steps

1. Push your code to GitHub (or GitLab / Bitbucket)
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repository
3. In **Environment Variables**, add:
   ```
   NEXT_PUBLIC_SUPABASE_URL        = https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY   = your_anon_key
   ```
4. Click **Deploy**

Vercel auto-detects Next.js and sets the build command to `next build`.

### After Deploying

- Copy the production URL (e.g. `https://innomax.vercel.app`)
- Update Supabase → Authentication → Settings:
  - **Site URL**: your production URL
  - **Redirect URLs**: add `https://innomax.vercel.app/auth/callback`
- Update Google Cloud Console OAuth redirect URIs if using Google OAuth

---

## Self-Hosted (Node.js)

```bash
npm run build
npm run start       # starts on port 3000
```

Use a reverse proxy (nginx / Caddy) to serve HTTPS and forward to port 3000.

### Example nginx config

```nginx
server {
  listen 443 ssl;
  server_name yourdomain.com;

  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key |

Variables prefixed `NEXT_PUBLIC_` are embedded into the browser bundle at build time. Rotate the anon key in Supabase if it is ever compromised.

---

## Checklist Before Going Live

- [ ] Set production `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Update Supabase Site URL and redirect URLs to production domain
- [ ] Update Google OAuth redirect URI to production domain
- [ ] Enable email confirmation in Supabase Auth settings
- [ ] Run `npm run build` locally — zero errors
- [ ] Run `npm run lint` — zero warnings
- [ ] Test sign-up, login, Google OAuth end-to-end on production URL
- [ ] Test add-to-cart → checkout → order confirmation flow
- [ ] Confirm Supabase RLS policies are enabled on all tables
- [ ] Remove or secure `app/api/hello.js` example route
