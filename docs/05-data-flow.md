# 05 — Data Flow

## Overview

The app uses a **hybrid data strategy**: Supabase when authenticated, `localStorage` as a fallback for guests.

```
Component / Page
      │
      ▼
React Context (CartContext / UserContext)
      │
      ├── User authenticated?
      │         │
      │        YES → api/products-supabase.ts  →  Supabase DB
      │         │    api/cart-supabase.ts       →  Supabase DB
      │         │
      │        NO  → api/products.tsx (mock data)
      │              localStorage               (cart)
      │
      └── Error / timeout → fallback to mock data or cached localStorage
```

---

## Product Data Flow

### Fetching Products

```
page/component calls fetchProducts()
        │
        ▼
api/products-supabase.ts
        │
        ├── supabase.from('products').select('*')
        │         │
        │         ├── OK  → returns Supabase rows
        │         └── ERR → falls back to api/products.tsx (mock array)
        │
        ▼
Component renders product list
```

### Product Object Shape

```ts
{
  id: string
  title: string
  slug: string
  price: number
  compareAtPrice?: number
  images: string[]
  category: string
  stock: number
  description: string
  rating?: number
  reviewCount?: number
}
```

---

## Cart Data Flow

### Guest User (not authenticated)

```
addToCart(product, qty)
        │
        ▼
CartContext updates in-memory state
        │
        ▼
Persisted to localStorage as JSON array
```

### Authenticated User

```
addToCart(product, qty)
        │
        ▼
CartContext updates in-memory state
        │
        ▼
api/cart-supabase.ts → upsert into cart_items table
  { user_id, product_id, quantity }
```

### Login Merge (local cart → Supabase)

When a user logs in, local cart items are merged into their Supabase cart:

```
User logs in
        │
        ▼
onAuthStateChange fires in UserContext
        │
        ▼
CartContext.mergeLocalCart(userId)
        │
        ├── Read localStorage cart items
        ├── For each item: upsert into cart_items (add quantities)
        └── Clear localStorage cart
```

---

## Order Flow

```
User clicks "Place Order" on checkout page
        │
        ▼
CartContext.createOrder()
        │
        ▼
Inserts record into orders table:
  {
    id: auto-generated,
    user_id,
    items: JSON[],
    subtotal,
    tax (8%),
    shipping ($10, free if subtotal > $100),
    total,
    status: 'pending',
    created_at
  }
        │
        ▼
cart_items cleared for this user
        │
        ▼
Redirect to /order-confirmation with order ID
```

---

## Pricing Calculation

These calculations live in `CartContext`:

```
subtotal  = sum(item.price × item.quantity)
tax       = subtotal × 0.08            (8%)
shipping  = subtotal >= 100 ? 0 : 10  (free over $100)
total     = subtotal + tax + shipping
```

---

## Static / Mock Data

Files in `/api` that do **not** hit Supabase:

| File | Content |
|---|---|
| `api/blogs.tsx` | Array of blog post objects |
| `api/team.tsx` | Array of team member objects |
| `api/service.tsx` | Array of service descriptions |
| `api/case.tsx` | Array of case study objects |
| `api/project.tsx` | Array of portfolio items |
| `api/categories.ts` | Product category list |
| `api/banners.ts` | Promotional banner data |

These are imported directly into page components and rendered statically.

---

## Supabase Client Singleton

All Supabase calls go through a single client instance:

```ts
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)
```

If `NEXT_PUBLIC_SUPABASE_URL` is missing, the client logs a warning and the app falls back to mock data.
