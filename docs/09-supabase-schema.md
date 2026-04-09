# 09 — Supabase Schema

Run the SQL below inside the Supabase **SQL Editor** (Dashboard → SQL Editor → New query).

---

## Tables

### `products`

```sql
create table public.products (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  slug         text not null unique,
  description  text,
  price        numeric(10, 2) not null,
  compare_at_price numeric(10, 2),
  images       text[],          -- array of image URLs
  category     text,
  stock        integer default 0,
  rating       numeric(3, 1),
  review_count integer default 0,
  created_at   timestamptz default now()
);

-- Allow anyone to read products
alter table public.products enable row level security;
create policy "Public products are viewable by everyone"
  on public.products for select using (true);
```

---

### `cart_items`

```sql
create table public.cart_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity   integer not null default 1,
  created_at timestamptz default now(),
  unique(user_id, product_id)   -- one row per product per user
);

-- Users can only see/modify their own cart
alter table public.cart_items enable row level security;

create policy "Users can view own cart"
  on public.cart_items for select
  using (auth.uid() = user_id);

create policy "Users can insert own cart items"
  on public.cart_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update own cart items"
  on public.cart_items for update
  using (auth.uid() = user_id);

create policy "Users can delete own cart items"
  on public.cart_items for delete
  using (auth.uid() = user_id);
```

---

### `orders`

```sql
create table public.orders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null,
  items      jsonb not null,       -- snapshot of CartItem[]
  subtotal   numeric(10, 2) not null,
  tax        numeric(10, 2) not null,
  shipping   numeric(10, 2) not null,
  total      numeric(10, 2) not null,
  status     text default 'pending',  -- pending | paid | shipped | delivered | cancelled
  created_at timestamptz default now()
);

-- Users can only see their own orders
alter table public.orders enable row level security;

create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can insert own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);
```

---

### `banners` (optional, see supabase_banners.sql)

```sql
create table public.banners (
  id         uuid primary key default gen_random_uuid(),
  title      text,
  subtitle   text,
  image_url  text,
  link       text,
  active     boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);

alter table public.banners enable row level security;
create policy "Banners are publicly viewable"
  on public.banners for select using (true);
```

---

## Auth Configuration

In the Supabase Dashboard → **Authentication → Settings**:

| Setting | Value |
|---|---|
| Site URL | `http://localhost:3000` (dev) / your production URL |
| Redirect URLs | `http://localhost:3000/auth/callback`, `https://yourdomain.com/auth/callback` |
| Enable email confirmations | Recommended for production |

### Google OAuth Setup

1. Dashboard → Authentication → Providers → Google → Enable
2. Add **Client ID** and **Client Secret** from Google Cloud Console
3. In Google Cloud Console → OAuth 2.0 → Authorized redirect URIs, add:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```

---

## Row Level Security Summary

| Table | Anon read | Auth read | Auth write |
|---|---|---|---|
| `products` | All rows | All rows | No (admin only via service role) |
| `cart_items` | None | Own rows only | Own rows only |
| `orders` | None | Own rows only | Own rows only |
| `banners` | All rows | All rows | No |
