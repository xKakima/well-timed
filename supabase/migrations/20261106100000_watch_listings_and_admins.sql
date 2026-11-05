create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table public.watch_listings (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 2 and 120),
  brand text not null check (char_length(btrim(brand)) between 2 and 80),
  model text not null check (char_length(btrim(model)) between 1 and 100),
  reference_number text check (
    reference_number is null or char_length(btrim(reference_number)) <= 80
  ),
  year smallint check (year is null or year between 1800 and 2200),
  condition text not null check (char_length(btrim(condition)) between 2 and 100),
  description text not null check (char_length(btrim(description)) between 1 and 5000),
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index watch_listings_published_created_at_idx
  on public.watch_listings (created_at desc)
  where status = 'published';

create index watch_listings_admin_updated_at_idx
  on public.watch_listings (updated_at desc);

create or replace function public.set_watch_listing_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_watch_listings_updated_at
before update on public.watch_listings
for each row
execute function public.set_watch_listing_updated_at();

alter table public.watch_listings enable row level security;
revoke all on public.watch_listings from anon, authenticated;
grant select on public.watch_listings to anon, authenticated;
grant insert, update, delete on public.watch_listings to authenticated;

create policy "Anyone can view published watch listings"
  on public.watch_listings
  for select
  to anon, authenticated
  using (status = 'published');

create policy "Admins can view all watch listings"
  on public.watch_listings
  for select
  to authenticated
  using ((select public.is_admin()));

create policy "Admins can create watch listings"
  on public.watch_listings
  for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "Admins can update watch listings"
  on public.watch_listings
  for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can delete watch listings"
  on public.watch_listings
  for delete
  to authenticated
  using ((select public.is_admin()));
