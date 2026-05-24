# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Next.js dev server on http://localhost:3000
npm run build    # Production build
npm start        # Start production server
npm run lint     # ESLint (eslint-config-next)
vercel env pull  # Pulls .env.local from Vercel — required for first-time setup
```

There is no test runner configured. The React Compiler is enabled (`reactCompiler: true` in `next.config.mjs`), so avoid manual `useMemo`/`useCallback` unless the compiler clearly cannot optimize the code.

This is a JavaScript project (not TypeScript) — files are `.js`/`.jsx`. The `@/*` path alias maps to `src/*` (see `jsconfig.json`).

## High-level architecture

This is an internal Madarth platform that bundles ~30 product areas (SEO suite, HR/HCM, device management, events, habits, CRM, Shopify, admin) into a single Next.js App Router app. Most product areas follow the same pattern: a route group page under `src/app/(dashboard)/<feature>/` calls one or more API routes under `src/app/api/<feature>/` which read/write Supabase or Neon.

### Routing layout

- `src/app/(auth)/` — signin / signup / forgot-password / reset-password (no sidebar)
- `src/app/auth/callback/route.js` — OAuth callback; **enforces @madarth.com email domain** and signs out users from other domains
- `src/app/(dashboard)/` — every authenticated product page; shares `layout.jsx` which mounts `<ProjectProvider>`, `<SidebarProvider>`, `<AppSidebar>`, `<CommandPalette>`, `<DashboardHeader>`, and wraps children in `<PageAccessGuard>`
- `src/app/api/` — REST endpoints, one folder per feature. Long-running ones (`analyze`, `crawl`, `broken-links`, `backlinks`, `monitor/check`, `pagespeed`, `speed-monitor`, `cron/udyam-sync`, `cron/msme-sync`) declare `maxDuration: 60` in `vercel.json`
- `src/app/api/cron/` — invoked by Vercel cron (see `vercel.json` `crons` array). Schedule is also defined there: monitoring every 6h, storage sync every 12h, udyam sync monthly on the 15th at 06:00

### Auth model (two layers)

1. **Domain restriction** — `src/app/auth/callback/route.js` checks that `user.email` ends with `@madarth.com` after OAuth, and signs out + redirects otherwise. Email/password signup uses Supabase's built-in confirmation flow.
2. **Page-level RBAC** — `src/components/page-access-guard.jsx` runs client-side on every dashboard route. Lookup chain: `employees.work_email` → `employee_roles.role_id` → `role_page_access.page_path`. **Fail-open semantics**: missing employee record, no roles assigned, no rules configured for the page, or any error all result in access granted. Admin/owner always bypass. The `getBasePath()` helper matches on the first URL segment, so `/devices/123/edit` is governed by the rule for `/devices`.

### Database split (Supabase + Neon)

- **Supabase (primary)** — almost everything: employees, candidates, leaves, holidays, devices, events, roles, contact_submissions, seo_analyses, qr_codes, etc. RLS is enforced via per-request JWT clients (see below).
- **Neon serverless** — `hard_disk_files`, `hard_disk_uploads`, MSME district data, and similar large datasets that were moved off Supabase to keep it under the 0.5 GB free tier. Accessed via `getDb()` in `src/lib/neon.js` using `DATABASE_URL`.

When adding a new feature, default to Supabase unless the table is expected to grow large (tens of thousands of rows or more) — recent commits show ongoing migrations from Supabase → Neon for size reasons.

### Auth-aware API pattern

API routes that touch user data must use `getUserFromRequest(req)` from `src/lib/auth-helper.js`. It pulls the `Authorization: Bearer <jwt>` header, validates the user, and returns a `supabase` client built via `getSupabaseWithAuth(token)` that carries the JWT so RLS `auth.uid()` works. The client should call APIs through `apiFetch()` in `src/lib/api.js`, which automatically attaches the token (with a `refreshSession()` fallback for the brief window before auth state is loaded from storage).

For server-side operations that need to bypass RLS (cron jobs, activity logging, admin actions), use a separate client built from `SUPABASE_SECRET_KEY` — see `src/lib/activity-log.js` for the pattern.

### SEO analyzer

`src/lib/seo-analyzer/index.js` is the largest single piece of business logic — a ~1100-line `analyzeUrl(url)` function. The big-picture structure is:

1. Fetch the page HTML, parse with cheerio, extract on-page signals (titles, headings, OG/Twitter, images, links, structured data).
2. Fan out parallel external checks via `Promise.allSettled` (`robots.txt`, `ads.txt`, `llms.txt`, DNS SPF lookup via Google DNS, custom-404 detection, directory-listing probes at `/images/`, `/css/`, `/assets/`, `/js/`, Google Safe Browsing transparency endpoint, www-vs-non-www redirect consistency).
3. Build a flat `checks[]` array — each check has `{name, status, weight, category, value, message}`.
4. `calculateScores(checks)` (in `scoring.js`) produces an overall 0–100 score and per-category scores.
5. Returns a flat object with both legacy fields (`title`, `meta_description`, …) and the new `checks`/`score` shape, so older consumers and the redesigned UI both work.

When adding a new check, follow the `check({...})` helper convention used throughout — the scoring engine derives weights from these objects.

### Cross-cutting modules

- `src/lib/project-context.js` — `<ProjectProvider>` + `useProject()`. Loads the user's projects from Supabase and persists `activeProjectId` in `localStorage`. Many SEO features read `activeProject` to scope queries (e.g., only show analyses for the current project).
- `src/lib/activity-log.js` — fire-and-forget audit log writing to `activity_logs` via the service-role key.
- `src/lib/logger.js` — `logError(scope, err)` used throughout for structured server logs.
- `src/lib/google.js` — Google OAuth + GA4/GSC API helpers.
- `src/lib/email.js` — Resend wrapper used for SEO monitoring alerts and candidate stage-change emails.
- `src/components/ui/` — shadcn/ui components (style `base-nova`, neutral base color, configured in `components.json`). The shadcn config points at `globals.scss` but the actual file is `globals.css` — update the config if you regenerate components.

### Page access guard caveat

The guard is **client-side only**. Server routes do their own auth via `getUserFromRequest()`, but the UI guard is purely a UX layer. Don't rely on it for security — always re-check on the API.

## Deployment

Vercel Pro plan; pushes to `main` auto-deploy. Three cron jobs are defined in `vercel.json` (monitoring, storage sync, MSME sync). Function timeout overrides for long-running routes are also in `vercel.json` — if you add a new long-running route, add it there too or it will time out at the default 10s.

## External docs

`doc/` has setup guides for `cloudflare-analytics`, `google-auth`, and `google-reviews` — read these before touching the corresponding integrations.
