# Watch Auction & Consignment Platform — Implementation Plan

This is a working plan for building the platform in small, verifiable phases. An AI or developer should update the checkboxes, decisions, and acceptance criteria as the project evolves. Do not treat the original technical specification as immutable: resolve the security and product gaps below before implementing the affected features.

## Project status

- Repository: Next.js landing page, public watch catalog, and first admin listing CMS slice.
- Current phase: Phase 1 Supabase integration and Phase 2 catalog are in progress; migration must still be applied to the hosted project.
- Initial target: responsive web MVP.
- Deployment direction: Vercel for the Next.js app; Supabase for database, authentication, storage, and realtime.
- Custom domain: deferred. Use the free Vercel-provided deployment URL until a domain is purchased.
- Mobile: out of scope for the initial MVP; revisit after validating the web product.

## Working rules for contributors

1. Inspect the current repository and existing changes before editing; preserve unrelated work.
2. Implement one phase at a time. Do not start a dependent phase until its prerequisites and acceptance criteria are met.
3. Keep database changes in versioned Supabase migrations. Do not make undocumented production-only schema edits.
4. Never expose service-role keys, Stripe secrets, or other private credentials in browser code, source control, logs, or generated artifacts.
5. Treat database transactions and authorization policies as authoritative. Client validation and realtime messages are not security boundaries.
6. Add or update tests for behavior changed in each phase. Run the narrowest relevant checks and report commands and outcomes.
7. Update this plan when scope, decisions, or acceptance criteria change. Do not mark work complete without verifying its exit criteria.

## Proposed initial architecture

- **Monorepo:** begin with a single Next.js app unless a concrete shared package or second app justifies Turborepo. Avoid adding workspace complexity before there is code to share.
- **Web:** current stable Next.js App Router, TypeScript, and Tailwind CSS; server-render public marketplace pages and use client components only for interactive behavior.
- **Backend:** Supabase Postgres, Auth, Storage, and Realtime. Use migrations as the schema source of truth.
- **Data access:** use Supabase clients appropriate to server and browser contexts. Keep privileged operations on the server.
- **Validation:** validate all untrusted inputs on the server and at database boundaries where applicable.
- **Hosting:** Vercel for web and serverless routes; Supabase hosted project for backend services.
- **Mobile:** defer Expo and shared cross-platform UI until a mobile product is approved.

## Brand and visual direction

The user-provided logo image is the visual reference for the site. Its intended feel is **minimalist, modern horology**: a clean, high-trust technology brand connecting classic timepieces with contemporary commerce. The clock-inspired mark incorporates a C/W concept, with the W also reading as a checkmark to suggest verification, speed, and reliability.

Apply that direction consistently across the web experience:

- Start with a restrained monochrome palette, strong contrast, generous whitespace, and clear typographic hierarchy.
- Use precise, subtle horology-inspired details; let watch photography and product information carry the visual interest rather than decorative effects.
- Keep layouts calm, legible, and confidence-building. Avoid flashy treatments that compete with the watches or make marketplace actions feel unclear.
- Preserve the logo's clock/C/W/checkmark concept if reproducing or adapting the mark. Do not invent a materially different logo.
- Make color, type, spacing, and interactive states accessible, including visible keyboard focus and sufficient contrast.
- The reference image was shared in conversation and is not yet a repository asset. Before implementation that needs the actual logo, add an approved production asset to the project; do not depend on an attachment path from a chat session.

## Draft web MVP scope

This is the working product brief for planning and estimates, not approval to launch or process transactions. The current deployed-preview target remains only a static landing page.

**Proposed first useful web release:**

- Public visitors can browse published watches and view server-rendered watch/auction details.
- Account holders can participate in auctions after the auction rules and market are approved.
- A consignor can submit watch details and images privately for staff review.
- Authorized staff can review a submission and decide whether to publish it as a listing.
- Payments, seller payouts, shipping, taxes, returns, and disputes are not part of the first implementation slice; validate and scope them before taking real bids or money.
- Native mobile apps, self-service seller listing publication, and broad multi-currency/multi-region support are out of scope unless explicitly added.

**Planning constraint:** currency, bid increments, auction close/extension behavior, reserve policy, and jurisdiction are unresolved. Do not implement or accept real bids until the relevant decisions are approved and reflected in the database transaction.

## Draft roles and permissions

| Role | Proposed permissions | Boundaries |
|---|---|---|
| Visitor | Browse public, published listings and send contact-based buy/sell inquiries | Cannot access private submissions, bid, or use staff tools |
| Authenticated buyer | Visitor access plus account actions and bidding once enabled | May only bid as the authenticated account; auction rules are enforced server-side |
| Consignor | Submit and view own consignment submissions | Submission and uploaded images remain private; cannot approve or publish |
| Reviewer / administrator | Manage watch listings; review submissions in a later phase | Invite-only email/password account, explicitly allowlisted in the database; no public admin sign-up |

Buyer and consignor are capabilities of an account, not mutually exclusive account types. Staff privilege must be granted through a trusted administrative process and must never be self-selected through profile editing.

## Draft user journeys and acceptance criteria

These describe expected product behavior for planning; they do not imply that backend functionality exists yet.

1. **Discover a watch:** visitor opens the marketplace, can browse published listings, and opens a watch detail page with accurate listing information and crawlable title/description metadata. Unpublished or private records and images are not revealed.
2. **Create an account:** visitor uses the selected Supabase Auth flow, sees clear validation and recoverable error states, and can sign out. Session state is not treated as proof of permission for privileged actions.
3. **Submit a consignment:** authenticated consignor provides required contact and watch information, uploads permitted image files to private storage, receives a submission confirmation, and can see the status of only their own submission.
4. **Review a consignment:** authorized reviewer can inspect a submission and accept or decline it. A submission remains private until the intended publication action; the submitting user cannot approve it.
5. **Participate in an auction (after rule approval):** eligible authenticated buyer sees authoritative auction state and rules, receives a clear accepted/rejected result when bidding, and sees subsequent updates. Concurrent and invalid bids are resolved by the database transaction, not client-side state or WebSocket timing.
6. **Complete a purchase (separately scoped):** no checkout or payout is promised until payment, shipping, tax, return, and dispute policies are approved and implemented.
7. **Manage the catalog:** an allowlisted administrator signs in, creates a draft watch listing, edits it, and publishes or archives it. Visitors can read only published listings; database row-level security is authoritative.

## Decisions to resolve

Record each decision here before implementing its dependent feature. Proposed defaults are suggestions, not silently approved requirements. “Needs owner approval” is intentionally unresolved; do not interpret a proposal as a confirmed business decision.

| Topic | Proposed default / recommendation | Status / dependency |
|---|---|---|
| MVP scope and target market | Use the draft web scope above; choose initial geography and operational owner | Needs owner approval before launch scope is finalized |
| MVP access | Public browsing; account required to bid or submit a consignment | Proposed; confirm before auth/bidding implementation |
| Initial customer access | Visitors browse public listings and may submit contact-based buy/sell inquiries; no customer accounts, bidding, or checkout | Accepted for the initial experience; inquiry implementation and abuse controls remain pending |
| Administrator access | Invite-only Supabase email/password account; staff UUID is allowlisted in `public.admin_users`; public sign-up disabled | Accepted 2026-11-06; migration and initial admin provisioning still required |
| Auction currency | One explicitly selected launch currency; store amounts as integer minor units with currency code | Needs owner decision; blocks bidding |
| Bid increment | Fixed per-auction increment for initial release unless a price-band policy is required | Proposed; blocks bidding |
| Opening bid | First bid must meet starting price; later bids must meet current bid plus increment | Proposed; blocks bidding |
| Seller self-bidding | Prohibited | Proposed; confirm before bidding |
| Auction extension | Choose whether near-close bids extend an auction and define the exact window and extension | Needs owner decision; blocks bidding |
| Reserve handling | Decide whether reserve exists, whether it is public, and what happens when it is unmet | Needs owner decision; blocks auction completion |
| Auction scheduling | Use server/database time for bid correctness; choose a reliable operational method for starts and finalization | Architecture principle accepted; operational method TBD |
| Consignment review | Keep submissions private until a reviewer approves and publishes | Proposed; confirm before storage/publication policies |
| Payments and payouts | Validate the exact Stripe Connect funds flow, geography, fees, refunds, disputes, and payout timing | Deferred; blocks taking real payments |
| Shipping, tax, returns | Define supported regions and responsibilities | Deferred; blocks commerce launch |
| Domain | Use Vercel URL initially; buy/connect a custom domain later | Accepted for preview |

## Phases

### Phase 0 — Product and repository foundation

**Goal:** turn the concept into a scoped, testable web MVP and establish project conventions.

- [x] Draft and record the proposed MVP scope, roles, user journeys, and acceptance criteria; business approval remains pending for items explicitly marked above.
- [x] Record product decisions that block later features without silently assuming approval.
- [x] Translate the recorded brand direction into a small, accessible set of design tokens and select typography; the logo is an inline concept mark pending the approved production asset.
- [x] Initialize the web app and select the package manager, scripts, linting, formatting, and test approach.
- [x] Document the environment-variable policy; no environment variables are needed for this static landing-page preview.
- [x] Document local setup and how to run checks.
- [x] Create a responsive, server-rendered landing page suitable for a Vercel preview.

**Exit criteria**

- A clean dependency install, local app start, and configured checks are documented and verified.
- MVP scope, roles, and journeys are recorded; unresolved launch decisions are visible and gated before dependent work.
- No secrets are required in source control.

### Phase 1 — Supabase schema, access control, and local development

**Goal:** establish a secure, reproducible backend foundation before building features on top of it.

- [ ] Create Supabase configuration and versioned migrations for profiles, watches, auctions, bids, and consignment submissions as required by the approved MVP.
- [x] Add a versioned watch-listing schema and administrator allowlist migration for the initial catalog/CMS slice.
- [x] Add private listing photo storage with admin-only uploads and published-listing-only reads.
- [x] Enforce listing photo count, format, and size limits and maintain photo metadata in the database.
- [ ] Define foreign keys, deletion behavior, not-null constraints, check constraints, and indexes from actual query patterns.
- [x] Add Row Level Security (RLS) to watch listings: public users can read published listings; only allowlisted administrators can read drafts or write.
- [ ] Add RLS to every other table as those tables are introduced.
- [ ] Ensure profile identity and ownership are tied to the authenticated user, not caller-supplied user IDs.
- [x] Configure a private listing-photo bucket with published-only public access through short-lived signed URLs; configure private consignment storage when intake is implemented.
- [ ] Configure local development and seed only non-sensitive sample data.
- [ ] Generate and commit TypeScript database types from the migration-backed schema.
- [ ] Add tests or repeatable checks for migration application and important authorization rules.

**Exit criteria**

- A new local Supabase environment can be brought up from checked-in configuration and migrations.
- Unauthorized users cannot read or mutate protected records or private images.
- Generated types match the migrated schema.

### Phase 2 — Public marketplace and SEO

**Goal:** let visitors discover approved watches through fast, indexable pages.

- [x] Build the responsive public watch catalog with empty and error states.
- [x] Build an invite-only admin sign-in and listing CMS to create drafts, edit, publish, unpublish, and archive.
- [x] Let admins upload and remove up to six private photos per watch; show photos only for published listings.
- [x] Populate public brand filters from published watch listings and allow admins to add brands through listings.
- [ ] Build server-rendered watch detail pages with canonical metadata and dynamic Open Graph data from approved, public listing content.
- [ ] Ensure private, pending, and rejected consignment content is never exposed through pages, metadata, APIs, or image URLs.
- [ ] Add appropriate pagination/filtering based on the approved MVP scope.
- [ ] Add tests for public visibility and metadata where practical.

**Exit criteria**

- Public pages render useful content without requiring client-side JavaScript for their primary content.
- Search/social metadata reflects the correct public watch and does not reveal private submission data.
- RLS and server-side access prevent unpublished listings from being retrieved by unauthorized users.

### Phase 3 — Authentication and consignment intake

**Goal:** allow users to securely submit a watch for review.

- [ ] Implement Supabase Auth flows selected for launch, including session handling and sign-out.
- [ ] Build a validated, accessible consignment form with clear progress, success, and recoverable error states.
- [ ] Upload images directly to the private Supabase Storage bucket using scoped authorization; enforce file type, size, and count limits.
- [ ] If client-side image compression is used, preserve validation and handle unsupported formats and compression failures explicitly.
- [ ] Store submission metadata and image object paths, not public image URLs.
- [ ] Build a minimal authorized review workflow to accept or decline submissions and capture status changes.
- [ ] Notify users of submission and review outcomes only if an approved notification method is in scope.

**Exit criteria**

- Users can submit valid requests and receive actionable validation errors for invalid input.
- A user cannot view or alter another user's private submission or upload objects.
- Reviewers can process submissions; accepted content does not become public until the intended approval/listing steps are complete.

### Phase 4 — Auction lifecycle and race-safe bidding

**Prerequisites:** product decisions for bid rules, seller self-bidding, reserve, extension policy, currency, and lifecycle are recorded.

**Goal:** accept correct bids under concurrency and keep auction state consistent.

- [ ] Define database constraints for valid amounts, auction times, bid ownership, and status transitions.
- [ ] Implement a transaction/RPC that locks the auction row and validates auction existence, start/end time, status, bidder identity, seller restrictions, currency, reserve-related rules, and minimum acceptable bid.
- [ ] Derive bidder identity from the authenticated database context (for example, `auth.uid()`); do not trust a caller-provided bidder ID.
- [ ] For privileged functions, set a safe `search_path`, restrict execute permissions, and ensure the function enforces authorization itself.
- [ ] Return explicit, typed outcomes for expected bid rejection cases; surface unexpected database errors rather than converting them into success-shaped responses.
- [ ] Define reliable handling for scheduled starts, endings, reserve-not-met outcomes, and finalization. Do not rely on browser clocks or a single best-effort scheduled job for bid correctness.
- [ ] Add concurrency tests proving that simultaneous bids cannot both win from the same prior auction state.
- [ ] Build the client bid panel with authoritative server responses, accessible status updates, and appropriate pending/rejected states.
- [ ] Subscribe to realtime bid changes for timely display updates, and refetch authoritative state after reconnects or subscription errors.

**Exit criteria**

- Invalid or late bids are rejected by the database transaction, regardless of client behavior.
- Concurrent bids produce one valid ordered auction state with matching bid history.
- Realtime improves display freshness but is not needed to preserve correctness.

### Phase 5 — Payments, winner flow, and marketplace operations

**Prerequisites:** payment, payout, shipping, tax, returns, and dispute decisions are validated for intended markets.

**Goal:** support a complete, auditable post-auction transaction.

- [ ] Confirm the Stripe Connect product and funds flow against current Stripe requirements; do not describe or implement it as escrow unless the actual supported arrangement is confirmed.
- [ ] Define idempotent payment and webhook state transitions, including retries and out-of-order events.
- [ ] Verify webhook signatures and keep webhook secrets server-only.
- [ ] Implement winner checkout, payment failure handling, cancellation/refund paths, and seller payout eligibility according to approved policy.
- [ ] Store auditable payment references and state without storing raw card data.
- [ ] Add reconciliation and administrator support procedures for stuck or disputed transactions.

**Exit criteria**

- Replayed webhook events do not duplicate state transitions or payouts.
- Payment, refund, and payout states can be reconciled against the payment provider.
- No user can mark their own auction paid or trigger a payout by directly modifying client data.

### Phase 6 — Production readiness and launch

**Goal:** launch safely and make operations observable and recoverable.

- [ ] Create separate Supabase development/staging and production projects.
- [ ] Configure Vercel preview, staging, and production environments with environment-specific credentials and least privilege.
- [ ] Apply production schema changes through reviewed migrations and document backup/restore procedures.
- [ ] Add appropriate rate limiting and abuse controls for authentication, uploads, and bid requests.
- [ ] Add structured error reporting and operational monitoring without logging secrets or unnecessary personal data.
- [ ] Review accessibility, responsive behavior, privacy disclosures, retention, marketplace terms, and applicable legal requirements.
- [ ] Verify search indexing controls, metadata, redirects, and production URL configuration.
- [ ] Run security, authorization, concurrency, and end-to-end smoke tests against staging.
- [ ] Document deployment, rollback, incident response, and administrator access.
- [ ] Purchase and connect a custom domain only when ready; configure the DNS records and HTTPS using the host's current instructions.

**Exit criteria**

- A staging release passes the agreed launch checklist.
- Production secrets are isolated from previews and local development.
- Backup, rollback, support, and incident procedures have named owners.

### Phase 7 — Mobile expansion (deferred)

**Goal:** add mobile only after web workflows and shared backend contracts are stable.

- [ ] Reassess product demand and mobile-specific requirements.
- [ ] Decide whether Expo is justified and define authentication, deep-link, upload, and realtime behavior on mobile.
- [ ] Extract shared packages only for logic that is genuinely platform-independent; keep web UI and native UI appropriately separate.
- [ ] Add mobile-specific release, testing, and store compliance plans.

**Exit criteria**

- A separately approved mobile scope exists; mobile work does not delay web MVP security or launch readiness.

## Deployment guide

### Initial / low-cost path

1. Push the repository to GitHub.
2. Deploy the Next.js app to Vercel using its free deployment URL.
3. Create a Supabase project and configure Vercel environment variables separately for preview/staging and production.
4. Keep Supabase migrations in the repository and apply them through a controlled deployment workflow.
5. Use Vercel preview deployments for code review, but connect them only to non-production backend credentials by default.
6. When desired, buy a domain from a registrar and connect it to Vercel by applying the DNS records Vercel specifies. The domain purchase is independent of hosting and can happen later.

### Why not GitHub Pages?

GitHub Pages is designed for static sites. This app needs server-rendered/SEO pages, authenticated data access, and server-side integrations such as payment webhooks. A static export would require moving those responsibilities elsewhere and is not the simplest fit.

### When to revisit hosting

Reconsider hosting if measured needs require persistent workers, long-running processes, specialized networking, data residency, or cost/control characteristics that the current Vercel + Supabase setup cannot meet. Reassess based on actual workload and provider limits rather than anticipated scale alone.

## Change log

- Initial plan created.
- Added a Next.js landing-page foundation for deployment preview; marketplace, Supabase, auction, and consignment functionality remain unimplemented.
- Verified lint, typecheck, production build, runtime dependency audit, and responsive rendering locally. Cloud deployment remains pending.
- Completed the Phase 0 product brief, draft role/permission matrix, user journeys, acceptance criteria, and explicit decision gates.
- Added the initial public watch catalog, allowlisted administrator sign-in/CMS, Supabase configuration example, and RLS-backed migration. Apply the migration and provision an administrator in Supabase before using the feature; image uploads and guest inquiries remain out of scope.
