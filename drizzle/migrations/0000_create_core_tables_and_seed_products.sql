create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role app_role not null,
    unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create policy "Users can view own roles"
  on public.user_roles
  for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  whatsapp text,
  username text,
  balance numeric not null default 0,
  total_spent numeric not null default 0,
  level integer not null default 1,
  xp integer not null default 0,
  created_at timestamptz not null default now()
);

grant select on public.profiles to authenticated;
grant update on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Admins can read all profiles"
  on public.profiles
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create table public.products (
  id text primary key,
  name text not null,
  price numeric not null check (price >= 0),
  category text not null,
  badge text not null default '',
  in_stock boolean not null default true,
  download_link text not null default '',
  image_url text,
  files jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

grant select on public.products to anon;
grant select on public.products to authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;

alter table public.products enable row level security;

create policy "Products are viewable by everyone"
  on public.products
  for select
  to anon, authenticated
  using (true);

create policy "Admins can manage products"
  on public.products
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

insert into public.products (id, name, price, category, badge, in_stock, download_link, image_url, files) values
  ('p1', 'SPIDER PC PANEL', 25, 'PC PANEL', 'HOT', true, '', '', '[]'),
  ('p2', 'HEX NON ROOT MOD', 15, 'NON ROOT', 'NEW', true, '', '', '[]'),
  ('p3', 'VENOM ROOT PANEL', 30, 'ROOT', 'PRO', true, '', '', '[]'),
  ('p4', 'IOS SPIDER TOOL', 40, 'IOS PANEL', 'ELITE', true, '', '', '[]'),
  ('p5', 'GIFT KEY BUNDLE', 10, 'OTHERS ITEM', 'SALE', true, '', '', '[]'),
  ('p6', 'WEB HEX PANEL', 20, 'PC PANEL', 'TOP', true, '', '', '[]');