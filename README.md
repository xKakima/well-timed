# Well Timed Collective

A web-first foundation for the Well Timed Collective watch auction and consignment marketplace.
The current release includes a public watch catalog and an invite-only
administrator area for managing listings. Bidding, customer accounts, inquiry
submissions, and consignment workflows are not connected yet.

## Requirements

- Node.js 20.9 or later
- npm

The landing page works without environment variables. The watch catalog and
administrator area require the Supabase project URL and a publishable key.
Copy `.env.example` to `.env.local` for local development; never commit populated
environment files or privileged keys.

## Run locally

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase setup

1. In Vercel, set `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for the environments you deploy. The
   legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` name is also supported.
2. Apply the migrations in order in your Supabase project (or run
   `npx supabase db push` after linking the project):
   - [`20261106100000_watch_listings_and_admins.sql`](./supabase/migrations/20261106100000_watch_listings_and_admins.sql)
   - [`20261106110000_watch_listing_photos.sql`](./supabase/migrations/20261106110000_watch_listing_photos.sql)
3. The photo migration creates a private Storage bucket with admin-only uploads
   and access to published listing photos. Each listing supports up to six
   JPEG, PNG, or WebP images, up to 5 MB each. Public photo links are signed and
   expire after five minutes.
4. Redeploy the app after the migrations are applied.
5. In Supabase Authentication, create an administrator user with an email and
   password. Do not enable public sign-ups.
6. In the Supabase SQL Editor, find that user’s UUID with:

   ```sql
   select id from auth.users where email = 'your-admin@example.com';
   ```

7. Add the UUID to the administrator allowlist:

   ```sql
   insert into public.admin_users (user_id)
   values ('paste-the-user-uuid-here');
   ```

8. Sign in at `/admin/login`. Only allowlisted accounts can manage listings;
   PostgreSQL row-level security also prevents non-admins from reading drafts
   or changing listings. Add a new brand by entering it in the listing form;
   the public brand filter updates automatically when that listing is published.

The migration intentionally does not create an administrator account. Never put
the Supabase `service_role` key in a `NEXT_PUBLIC_` variable or in the browser.

## Checks

```powershell
npm run lint
npm run typecheck
npm run build
```

## Deploy a preview

1. Push this repository to GitHub.
2. Import it into Vercel and set the framework preset to **Next.js**.
3. Use the repository root as the root directory and `npm run build` as the build command.
4. Leave **Output Directory** on its Next.js default (disable the override; do not set it to `public`).
5. Configure the Supabase variables and apply the migration if you want the
   catalog and administrator area enabled; the landing page works without them.
6. Deploy and use the free `vercel.app` URL to preview the site.
7. Connect a custom domain later through Vercel project settings when one is purchased.

GitHub Pages is not configured: the planned application needs Next.js server
features and will later need secure server-side integrations. Vercel previews
are the intended deployment path.

## Validation approach

Run `npm run lint`, `npm run typecheck`, and `npm run build` before opening a
deployment preview. Smoke-check the catalog and admin sign-in at desktop and
mobile widths after applying the migration. Test authorization and auction
concurrency against a non-production Supabase project before those workflows
are launched.
