# 01 — Project Overview

## What is Innomax?

Innomax is a **multi-purpose SaaS & e-commerce marketing site** built with Next.js 16. It combines:

- A flexible landing-page system (6 homepage variants)
- A full e-commerce flow (products → cart → checkout → order confirmation)
- A company site (blog, team, case studies, services, careers)
- Supabase-backed user authentication and data persistence

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.1.2 |
| Language | TypeScript | 5.x |
| UI | React | 19.2.3 |
| Styling | Bootstrap 5, MUI v7, custom CSS/SCSS | — |
| Backend / DB | Supabase (PostgreSQL + Auth) | JS SDK v2.90.1 |
| Animations | Framer Motion, AOS, react-awesome-reveal | — |
| Carousels | React Slick, Swiper, react-fast-marquee | — |
| Package manager | npm | — |
| Dev server | Turbopack (`next dev --turbo`) | — |

---

## Architecture at a Glance

```
Browser
  │
  ▼
Next.js App Router (app/)
  ├── Page Components  ──►  React Context (UserContext, CartContext)
  │                              │
  │                              ▼
  └── API Routes (minimal)   Supabase SDK (lib/supabase.ts)
                                 │
                                 ▼
                          Supabase Cloud
                          ├── PostgreSQL (products, cart_items, orders)
                          └── Auth (email/password, Google OAuth)
```

**Key architectural decisions:**

1. **No custom API layer** — components call Supabase directly via the browser SDK.
2. **Hybrid persistence** — authenticated users get Supabase storage; guests use `localStorage`.
3. **Context-first state** — global state (cart, user) lives in React Context, not a state library.
4. **Multi-template pages** — each `home-N/` variant is a self-contained page composition.

---

## Key Features

- **Authentication**: Email/password + Google OAuth via Supabase Auth
- **E-commerce**: Product catalog, cart sync, order creation
- **Content**: Blog, case studies, team bios, services, careers, FAQs
- **Responsive**: Mobile bottom nav, floating WhatsApp/Mail buttons
- **SEO-ready**: Next.js server rendering, metadata support
- **Shopify-ready**: Shopify Buy SDK wired up in `lib/shopifyBuy.js`
