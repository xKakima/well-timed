create table public.watch_listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.watch_listings (id) on delete cascade,
  object_path text not null unique,
  position smallint not null check (position between 1 and 6),
  alt_text text not null check (char_length(btrim(alt_text)) between 1 and 200),
  created_at timestamptz not null default now(),
  unique (listing_id, position)
);

create index watch_listing_images_listing_position_idx
  on public.watch_listing_images (listing_id, position);

alter table public.watch_listing_images enable row level security;
revoke all on public.watch_listing_images from anon, authenticated;
grant select on public.watch_listing_images to anon, authenticated;
grant insert, update, delete on public.watch_listing_images to authenticated;

create policy "Anyone can view images of published listings"
  on public.watch_listing_images
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.watch_listings
      where watch_listings.id = watch_listing_images.listing_id
        and watch_listings.status = 'published'
    )
  );

create policy "Admins can view all listing images"
  on public.watch_listing_images
  for select
  to authenticated
  using ((select public.is_admin()));

create policy "Admins can add listing images"
  on public.watch_listing_images
  for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "Admins can update listing images"
  on public.watch_listing_images
  for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can delete listing images"
  on public.watch_listing_images
  for delete
  to authenticated
  using ((select public.is_admin()));

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'watch-listing-photos',
  'watch-listing-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Public can access published listing photos"
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id = 'watch-listing-photos'
    and exists (
      select 1
      from public.watch_listing_images
      join public.watch_listings
        on watch_listings.id = watch_listing_images.listing_id
      where watch_listing_images.object_path = storage.objects.name
        and watch_listings.status = 'published'
    )
  );

create policy "Admins can access all listing photos"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'watch-listing-photos'
    and (select public.is_admin())
  );

create policy "Admins can upload listing photos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'watch-listing-photos'
    and (select public.is_admin())
  );

create policy "Admins can update listing photos"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'watch-listing-photos'
    and (select public.is_admin())
  )
  with check (
    bucket_id = 'watch-listing-photos'
    and (select public.is_admin())
  );

create policy "Admins can delete listing photos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'watch-listing-photos'
    and (select public.is_admin())
  );
