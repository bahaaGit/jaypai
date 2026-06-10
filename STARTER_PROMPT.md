# Reusable Starter Prompt — Production-Ready Next.js PWA Foundation

Paste this into a fresh, empty project directory. Replace the `{{PLACEHOLDERS}}`
in the "Project Config" block, then let the agent work phase by phase.

This is derived from a real build and bakes in every gotcha that cost time the
first round (Prisma 7, Next 16, Turbopack + PWA, CI ordering, Vercel + Prisma,
runner pinning, Supabase key naming).

---

## Project Config (fill these in)

- **App name (code/npm):** `{{lowercase-name}}` (no capitals, npm-safe)
- **App name (UI/brand):** `{{Brand Name}}`
- **One-line description:** `{{what the app does}}`
- **Primary color:** `{{#HEX}}`  · **Accent:** `{{#HEX}}` · **Background:** `{{#HEX}}`
- **Auth provider:** Supabase Auth (email + phone)
- **Target:** mobile-first installable PWA, must work on poor connectivity
- **GitHub repo:** `{{owner/repo}}` (public is simplest for free Actions)

---

## Master Prompt

> Build the foundation for a production-grade, mobile-first **Progressive Web App**
> using the stack and rules below. **Do not build product features yet** — only the
> deployable foundation ("Phase 0") plus PWA support. Work in small commits, run the
> checks after each step, and stop with a summary when the CI pipeline is green and
> the app is live.

### Stack (use latest stable; READ the installed docs before coding)

- Next.js (App Router, TypeScript, `src/` dir) — **it may differ from your training
  data; read `node_modules/next/dist/docs/` before writing Next-specific code.**
- Tailwind CSS + ShadCN UI (Button, Input, Card, Badge, Label, Select, Textarea)
- Prisma ORM + PostgreSQL
- Supabase Auth (`@supabase/ssr`) — email + phone sign-in
- Zod, React Hook Form, TanStack Query, Zustand, lucide-react
- Testing: Vitest + React Testing Library (unit), Playwright (E2E)
- Deploy: Vercel · CI: GitHub Actions

### Design system

Wire the brand colors as CSS variables / Tailwind tokens in `globals.css`. Build
reusable layout components: `MobileShell`, `PageHeader`, `BottomNav`. Style:
white cards, rounded corners, minimal shadows, large primary CTA buttons,
bottom tab nav, mobile-first.

### Architecture

- Route groups: `(auth)` for login/splash, `(app)` for the bottom-nav shell.
- Auth route guard via middleware. Protected routes redirect to `/login`;
  authed users on auth routes redirect to home; `/` redirects based on session.
- `src/lib/`: `prisma.ts` (singleton), `supabase/client.ts`, `supabase/server.ts`,
  `utils.ts` (cn + currency/number formatters with unit tests).
- `/api/health` returns `{ status: "ok" }`.

### PWA (do this in the foundation, not later)

- `app/manifest.ts` (dynamic manifest, `display: standalone`, brand theme).
- **Hand-roll the service worker** in `public/sw.js`. Do NOT use Serwist or
  next-pwa — they require webpack, and modern Next builds with Turbopack.
- Caching tuned for poor connectivity:
  - static assets → cache-first
  - page navigations → network-first → cache → `public/offline.html`
  - API GET → network-first with cache fallback (last-known data offline)
  - versioned caches, cleaned up on `activate`; skip non-GET requests.
- `public/offline.html`: standalone fallback (no framework hydration).
- Generate PNG icons (192, 512, maskable-512, apple-touch-180) from an SVG via a
  `scripts/generate-icons.mjs` using `sharp`; commit the PNGs.
- `ServiceWorkerRegistration` component: register `/sw.js` **only in production**;
  auto-activate updates. `InstallPrompt` component: Android `beforeinstallprompt`
  + iOS "Add to Home Screen" instructions, with dismiss-for-N-days.
- Security headers in `next.config.ts` (X-Frame-Options DENY, nosniff,
  Referrer-Policy) + `sw.js` served `no-cache` with JS content-type.
- Exclude PWA static files (`sw.js`, `manifest.webmanifest`, `icons/`,
  `offline.html`) from the auth middleware matcher.

### CI/CD (GitHub Actions → Vercel)

Pipeline, in order, with each stage gating the next:
1. **Quality Gate:** `npm ci` → `prisma generate` → lint → typecheck →
   `prisma validate` → unit tests → build.
2. **E2E Smoke:** install Playwright chromium → run smoke tests (health endpoint,
   `/` redirect, brand text, manifest, sw.js, offline page).
3. **Deploy to Vercel:** only after 1 & 2 pass. `main` → production,
   `develop`/PRs → preview.

Branches: `main` (prod), `develop` (staging). Add `.env.example`.

### Tests required before "done"

- Unit: formatter/util functions, manifest shape, a couple of UI components.
- E2E smoke: the 6 checks listed above.

### Acceptance — stop when ALL are true

- `npm run lint`, `typecheck`, `test`, `build` all pass locally.
- CI is green end-to-end and auto-deploys.
- Live URL: `/api/health` returns ok, `/` redirects to `/login`,
  `/manifest.webmanifest` + `/sw.js` + `/offline.html` all serve correctly.
- App is installable on mobile.

---

## ⚠️ Known Gotchas (give these to the agent — they WILL hit them)

1. **Prisma 7:** the DB `url` is NOT in `schema.prisma` anymore — it lives in
   `prisma.config.ts` (`datasource: { url: process.env.DATABASE_URL }`). The
   schema `datasource` block has only `provider`.
2. **Prisma client must be generated before tsc/build** — add
   `"postinstall": "prisma generate"` to package.json AND a `prisma generate`
   step in CI before typecheck. Without it, Vercel builds and CI typecheck fail
   with missing `@prisma/client`.
3. **Next.js (v15.4+/16):** `src/middleware.ts` is renamed to `src/proxy.ts`
   with `export async function proxy(...)` (not `middleware`). Check the docs
   for your version.
4. **PWA + Turbopack:** Serwist/next-pwa need webpack. Hand-roll the SW instead.
5. **Supabase keys:** the dashboard now labels it "publishable key", but
   `@supabase/ssr` still reads `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Set that exact
   var name.
6. **GitHub Actions runners:** if jobs die in seconds with `startup_failure` and
   no logs, it's account-level, not your YAML — usually a **billing lock**
   (check github.com/settings/billing) or pin `runs-on: ubuntu-24.04` if
   `ubuntu-latest` is flaky. Private repos on free plans have limited minutes;
   public repos get free unlimited.
7. **React 19 lint:** `react-hooks/set-state-in-effect` blocks synchronous
   `setState` in an effect. For mount-time browser detection, batch into one
   state object and defer via `queueMicrotask`.
8. **Secrets:** set them in BOTH GitHub (Actions) and Vercel (env). For Vercel
   preview env vars via CLI, pass an empty branch arg: `vercel env add NAME
   preview "" --value ... --yes`. Service worker only registers in production,
   so test PWA on the deployed URL or `build && start`, never `dev`.

---

## Suggested follow-on phases (after foundation)

1. Auth + onboarding + account types + profile
2. Core list/search + detail screens
3. Create/edit primary resource
4. The main transactional flow
5. Payments/escrow (Stripe) — server-calculated amounts, verified webhooks
6. Messaging · 7. History/earnings/reviews · 8. Admin · 9. Observability + hardening

Build one phase per PR. Each: code → migration → unit + integration tests →
E2E for critical flows → confirm acceptance → stop and summarize.
