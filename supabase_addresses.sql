-- Create the addresses table
create table addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  pincode text,
  country text default 'India',
  is_default boolean default false,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table addresses enable row level security;

-- Create Policy
create policy "Users can manage their addresses"
on addresses
for all
using (auth.uid() = user_id);
