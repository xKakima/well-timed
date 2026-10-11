# Well Timed Collective

A web-first foundation for the Well Timed Collective watch auction and consignment marketplace.
The current release is a static, responsive brand landing page; authentication,
listings, auctions, and consignment workflows are not connected yet.

## Requirements

- Node.js 20.9 or later
- npm

## Run locally

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Checks

```powershell
npm run lint
npm run typecheck
npm run build
```

## Deploy a preview

1. Push this repository to GitHub.
2. Import it into Vercel and keep the framework preset set to Next.js.
3. No environment variables are required for the current landing page.
4. Deploy and use the free `vercel.app` URL to preview the site.
5. Connect a custom domain later through Vercel project settings when one is purchased.

GitHub Pages is not configured: the planned application needs Next.js server
features and will later need secure server-side integrations. Vercel previews
are the intended deployment path.
