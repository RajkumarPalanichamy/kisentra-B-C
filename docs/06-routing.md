# 06 — Routing

Innomax uses the **Next.js 15 App Router**. Every folder under `app/` with a `page.tsx` becomes a route.

---

## Route Map

### Public Routes

| URL | File | Description |
|---|---|---|
| `/` | `app/page.tsx` | Default homepage |
| `/home` | `app/home/page.tsx` | Home variant 1 |
| `/home-2` … `/home-6` | `app/home-2/page.tsx` … | Home variants 2–6 |
| `/about` | `app/about/page.tsx` | About us |
| `/service` | `app/service/page.tsx` | Services listing |
| `/service-single` | `app/service-single/page.tsx` | Service detail |
| `/blog` | `app/blog/page.tsx` | Blog listing |
| `/blog-single` | `app/blog-single/page.tsx` | Blog post detail |
| `/contact` | `app/contact/page.tsx` | Contact page |
| `/team` | `app/team/page.tsx` | Team page |
| `/pricing` | `app/pricing/page.tsx` | Pricing tiers |
| `/career` | `app/career/page.tsx` | Job listings |
| `/career-details` | `app/career-details/page.tsx` | Job detail |
| `/casestudy` | `app/casestudy/page.tsx` | Case studies |
| `/casestudy-details` | `app/casestudy-details/page.tsx` | Case study detail |
| `/privacy-policy` | `app/privacy-policy/page.tsx` | Privacy policy |
| `/terms-conditions` | `app/terms-conditions/page.tsx` | Terms of service |
| `/404` | `app/404/page.tsx` | Custom 404 |

### E-Commerce Routes

| URL | File | Description |
|---|---|---|
| `/products` | `app/products/page.tsx` | Product catalogue |
| `/cart` | `app/cart/page.tsx` | Shopping cart |
| `/checkout` | `app/checkout/page.tsx` | Checkout |
| `/order-confirmation` | `app/order-confirmation/page.tsx` | Order success |

### Auth Routes

| URL | File | Description |
|---|---|---|
| `/auth` | `app/auth/page.tsx` | Login / sign-up |
| `/auth/callback` | `app/auth/callback/route.ts` | OAuth redirect handler |

### Protected Routes

| URL | File | Description |
|---|---|---|
| `/profile` | `app/profile/page.tsx` | User profile (requires login) |
| `/admin` | `app/admin/page.tsx` | Admin dashboard (requires admin) |

---

## Layouts

### Root Layout — [app/layout.tsx](../app/layout.tsx)

Wraps every page. Provides:
- `UserProvider` (authentication context)
- `CartProvider` (shopping cart context)
- Global CSS imports
- Persistent UI: `WhatsAppFloatingButton`, `MailFloatingButton`, `MobileBottomNav`

### Admin Layout — [app/admin/layout.tsx](../app/admin/layout.tsx)

Wraps admin pages. Provides `AdminContext`.

---

## API Routes

| URL | File | Method | Description |
|---|---|---|---|
| `/api/hello` | `app/api/hello.js` | GET | Example route, returns `{"name":"John Doe"}` |
| `/auth/callback` | `app/auth/callback/route.ts` | GET | Supabase OAuth code exchange |

---

## Navigation Components

| Component | Used on | Notes |
|---|---|---|
| `Header` | All pages (default) | Desktop + mobile menu |
| `Header2` … `Header6` | `home-2` … `home-6` variants | Themed header variants |
| `MobileMenu` | All pages | Slide-in menu for mobile |
| `MobileBottomNav` | All pages | Sticky bottom bar on mobile |
| `Footer` | All pages | Site-wide footer |

---

## 404 Handling

- `app/not-found.tsx` — automatically rendered by Next.js for unmatched routes
- `app/404/page.tsx` — custom page accessible at `/404`
