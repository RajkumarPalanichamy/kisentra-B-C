-- Create a table for Orders
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  address_id uuid references public.addresses(id) not null,
  total_amount decimal(10, 2) not null,
  status text check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')) default 'pending',
  payment_method text default 'cod',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for orders
alter table public.orders enable row level security;

-- Policy: Users can view their own orders
create policy "Users can view own orders" 
on public.orders for select 
to authenticated 
using (auth.uid() = user_id);

-- Policy: Users can insert their own orders
create policy "Users can create orders" 
on public.orders for insert 
to authenticated 
with check (auth.uid() = user_id);

-- Create a table for Order Items
create table public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid not null, -- Assuming we might reference a products table, or just keep ID
  product_title text not null,
  quantity integer not null,
  price decimal(10, 2) not null,
  image_url text
);

-- Enable RLS for order_items
alter table public.order_items enable row level security;

-- Policy: Users can view their own order items (via order ownership)
create policy "Users can view own order items" 
on public.order_items for select 
to authenticated 
using (
  exists (
    select 1 from public.orders
    where public.orders.id = public.order_items.order_id
    and public.orders.user_id = auth.uid()
  )
);

-- Policy: Users can insert their own order items
create policy "Users can insert own order items" 
on public.order_items for insert 
to authenticated 
with check (
  exists (
    select 1 from public.orders
    where public.orders.id = public.order_items.order_id
    and public.orders.user_id = auth.uid()
  )
);
