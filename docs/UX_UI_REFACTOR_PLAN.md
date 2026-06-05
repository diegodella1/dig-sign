# UX/UI Refactor Plan — RTV TL Manager

**Status:** Implemented (Phases 1–5 complete as of 2026-06-05)  
**Date:** 2026-06-05 (rev. 2 — OpenNext + control-room focus)  
**Audience:** Operators, producers, engineering  
**Related:** `DESIGN.md`, `PLAN.md`, `open-next.config.ts`, `wrangler.jsonc`, `README.md`

---

## 0. Goal

Refactor UX/UI so RTV TL Manager feels **less like a generic admin dashboard** and **more like a broadcast control room** for operating a live/linear TV channel.

**Hard constraint:** All changes must remain compatible with **OpenNext → Cloudflare Workers** (`npm run cf:build`). No new Node-only runtime assumptions.

**Core product principle — the operator must understand in under 5 seconds:**

1. What is **ON AIR** now  
2. What is **NEXT**  
3. What is **broken or risky**  
4. What **action** they can take immediately  

Do not redesign for aesthetics alone. Prioritize **operational clarity, speed, confidence, fewer clicks, and deployment safety**.

---

## 1. Technical audit (pre-refactor baseline)

### 1.1 Stack & routing

| Item | Finding |
|------|---------|
| **Next.js** | `package.json` declares `next@^9.3.3` (lockfile resolves 9.3.3); README/PLAN.md reference **Next.js 15**. Reconcile before production deploy — eslint-config-next is 15.x. |
| **Router** | **App Router only** — all pages under `app/`. No `pages/` directory. |
| **React** | 19.x |
| **TypeScript** | 5.8.x, `strict: true` |
| **Styling** | Tailwind 3.4, dark broadcast tokens in `DESIGN.md` |
| **i18n** | `next-intl` (`i18n.ts`, `messages/en.json`) |
| **OpenNext** | `@opennextjs/cloudflare` — `open-next.config.ts`, scripts `cf:build`, `cf:deploy` |
| **Cloudflare bindings** | D1 (`DB`), R2 (`MEDIA_BUCKET`), KV (`SLIDE_DATA_KV`), `nodejs_compat` flag |

### 1.2 Route structure (28 app pages)

**Public / docs**

- `/` — legacy link board  
- `/manual`, `/notion`, `/pending`  

**Auth**

- `/admin/login`  

**Primary work modes (hubs today)**

- `/admin` — cockpit dashboard  
- `/admin/prepare`, `/admin/program`, `/admin/operate`  

**Prepare detail**

- `/admin/assets`, `/admin/vimeo`, `/admin/music`, `/admin/guests`, `/admin/slides`  

**Program detail**

- `/admin/calendar`, `/admin/schedule/[date]`, `/admin/schedule/[date]/blocks/[id]`  

**Operate detail (should move under ADMIN nav group)**

- `/admin/output`, `/admin/health`, `/admin/runbook`, `/admin/runbook/[date]`, `/admin/audit`  

**Admin (orphan — not in sidebar today)**

- `/admin/settings`  

**Playout / capture (must stay clean, no admin chrome)**

- `/output/live`, `/output/preview/[blockId]`, `/output/slide/[slideId]`, `/output/[timelineId]`  
- `/live` — alternate `LiveConsole` (overlap with `/output/live`; consolidate docs, not routes yet)  

### 1.3 Server vs client boundaries

| Pattern | Usage |
|---------|--------|
| **Server Components (default)** | All `app/**/page.tsx` pages fetch via `getDb()`, `getLiveSchedule()`, etc. |
| **`'use client'`** | ~45 files — nav, schedule workspace, DnD, output monitor polling, slides, forms |
| **Server Actions** | Inline `'use server'` in page files + `app/admin/output/actions.ts`, `admin-shell` logout |
| **Route handlers** | 36 routes under `app/api/**/route.ts` — health, output monitor, uploads, slide-data, Vimeo, Reuters |
| **Middleware** | `middleware.ts` — HTTPS redirect, CSRF, admin cookie gate, security headers. **Edge-compatible** (no Node imports) |

**Rule for refactor:** New Operate interactivity uses **existing HTTP APIs** (`/api/output/monitor`, `/api/active-block`) + **existing Server Actions**. Poll via client components; do not add WebSockets or in-memory session state.

### 1.4 Data & storage (OpenNext-native)

| Layer | Implementation | Refactor impact |
|-------|----------------|-----------------|
| Database | D1 via `lib/db/client.ts` + Drizzle | Safe — already uses `getCloudflareContext()` |
| Media | R2 via `lib/storage/r2.ts` | Safe — no local disk |
| Slide cache | KV via `lib/helpers/kv-cache.ts` | Safe |
| Uploads | `app/api/assets/upload/route.ts` → R2 | Safe — stream to binding, not `fs` |
| Smoke status | `lib/health/smoke-status.ts` — KV primary, **file fallback** (`node:fs`) | ⚠️ Do not extend file path; KV/env only on Workers |

### 1.5 Node-specific / risky patterns (do not extend)

| Location | Pattern | OpenNext note |
|----------|---------|---------------|
| `lib/health/smoke-status.ts` | `node:fs` read/write fallback | Acceptable if KV/env used on Workers; **no new fs usage** |
| `scripts/*` | CLI only (`child_process`, fs) | Dev/deploy scripts — not bundled in Worker |
| `next.config.mjs` | `output: 'standalone'` | OpenNext ignores for CF; Docker path unchanged |
| `middleware.ts` | Cookie auth, CSRF | Keep edge-safe |
| In-memory state | None required for scheduling | **Do not add** global caches, WS rooms, or cron in-process |

### 1.6 Environment variables (representative)

Operational: `ADMIN_BOOTSTRAP_TOKEN`, `OUTPUT_CAPTURE_TOKEN`, `APP_ENCRYPTION_KEY`, `APP_BASE_URL`, `NEXT_PUBLIC_APP_BASE_URL`  
Integrations: `VIMEO_ACCESS_TOKEN`, Reuters vars, market data URLs  
Smoke: `RTV_LAST_SMOKE_*` or KV-backed smoke status  
Bindings (Workers): `DB`, `MEDIA_BUCKET`, `SLIDE_DATA_KV` — not env vars

**Refactor rule:** No new secrets required for UI-only phase. Quick actions reuse existing mutations.

### 1.7 Build & verify commands

```bash
npm run typecheck
npm run lint
npm run build          # standard Next.js
npm run cf:build       # OpenNext Cloudflare bundle — required gate
npm run test           # Vitest
```

Every UI PR must pass **typecheck, lint, build, cf:build**.

### 1.8 Existing broadcast UI (reuse, don't rewrite)

| Component | Path | Reuse for |
|-----------|------|-----------|
| `OutputMonitorPanel` | `components/output/output-monitor-panel.tsx` | Operate — polls `/api/output/monitor` |
| `OperationsPanelOnAir` | `components/operations-panel/on-air.tsx` | OnAirPanel basis |
| `BroadcastStatusStrip` | `components/admin/admin-shell.tsx` | Global status chrome |
| `StatusPill` / `ClearStateBadge` | `components/ui/` | StatusBadge wrappers |
| `StopBroadcastButton` | `components/output/stop-broadcast-button.tsx` | QuickActionsBar |
| `useActiveBlock` | `app/hooks/use-active-block.ts` | Client poll `/api/active-block` |
| `FlowCard` / hub grids | `components/admin/admin-flow.tsx` | Replace on Operate — **fewer cards** |

### 1.9 Current navigation problems

`components/admin/admin-nav.tsx`:

- **Flow:** Cockpit, Prepare, Program, Operate  
- **Direct (duplicate):** Output, Music, Library, Health  
- **Missing:** Admin/Settings  
- **`OperatorPath`** — unused legacy strip  

---

## 2. OpenNext compatibility checklist

Use this checklist for **every** refactor PR.

### 2.1 Allowed patterns

- [ ] Server Components fetching D1/R2/KV via `getDb()` / `getMediaBucket()` / `getCloudflareContext()`  
- [ ] Server Actions calling existing `lib/mutations/*` (D1 + audit)  
- [ ] Route handlers returning JSON (`dynamic = 'force-dynamic'`, `Cache-Control: no-store`)  
- [ ] Client components polling HTTP (`fetch('/api/output/monitor')`) on an interval  
- [ ] `revalidatePath()` after mutations  
- [ ] Middleware: cookies, redirects, headers only — no Node APIs  
- [ ] Static assets + Tailwind — no build-time fs in app code  
- [ ] External HTTP (Vimeo, Reuters, market APIs) from route handlers / server code  

### 2.2 Forbidden / avoid

- [ ] New `fs`, `path`, `child_process`, or local disk persistence in `app/`, `components/`, `lib/` used at runtime  
- [ ] WebSocket servers or SSE that assume sticky sessions  
- [ ] In-memory Maps/Sets that must persist across requests (Worker instances are ephemeral)  
- [ ] Background cron or long-running loops in the Worker  
- [ ] Packages with native Node binaries (sharp without Workers adapter, etc.)  
- [ ] New dependencies without confirming OpenNext bundle compatibility  
- [ ] `"use client"` on pages that could stay Server Components  
- [ ] Node-only APIs in middleware  
- [ ] Assuming traditional long-lived Node server (`next start`) as the only deploy target  

### 2.3 Quick-action implementation safety

| Action | Safe approach |
|--------|---------------|
| Reload output | Client: `window.open(liveOutputHref)` or instruct capture machine — **no server state** |
| Emergency loop / force fallback | Existing `setReutersOutputOverride` or fallback carousel — Server Action + D1 |
| Stop / pause automation | Existing `updateProgramDayStatus`, `clearOutputOverride`, `StopBroadcastButton` |
| Skip / go to next block | **Phase 1b** if missing: new Server Action writing D1 override or block skip flag — no in-memory queue |
| Replace asset | Link to `/admin/schedule/[date]/blocks/[id]` — no new API |

---

## 3. Target information architecture

### 3.1 Four modes (main navigation)

| Mode | Question | Top-level nav | Routes |
|------|----------|---------------|--------|
| **PREPARE** | Is content ready? | Yes | Hub + assets, vimeo, music, guests, slides |
| **PROGRAM** | What airs when? | Yes | Hub + calendar, schedule/* |
| **OPERATE** | What is on air? | **Yes — dominant** | `/admin/operate` (control room) |
| **ADMIN** | Config & audit? | Gear icon | settings, health, runbook, audit |

**Cockpit (`/admin`)** — day-start summary only; **not** a fifth nav item. When day is `active`, login/default redirect → **Operate**.

### 3.2 Secondary pages (ADMIN group — not top-level)

Move out of primary mental model; reachable via Admin menu or Operate overflow:

| Page | Label in Admin |
|------|----------------|
| `/admin/settings` | Integrations & operators |
| `/admin/health` | System health (full checklist) |
| `/admin/runbook/[date]` | Runbook |
| `/admin/audit` | Audit trail |
| `/admin/output` | Capture launcher (bookmark for OBS machine) |

### 3.3 Navigation target (56px icon rail)

| Icon | Mode | Href |
|------|------|------|
| Signal | Operate | `/admin/operate` |
| Package | Prepare | `/admin/prepare` |
| Calendar | Program | `/admin/program` |
| Gear | Admin | `/admin/settings` |

**Remove:** Direct group (Output, Music, Library, Health), duplicate Cockpit nav item (dashboard via logo click).

**Order:** Operate first — it is the default during broadcast hours.

Sub-nav tabs (horizontal, in-mode only):

- Prepare: Media · Import · Music · Guests · Plates  
- Program: Today · Calendar  
- Admin: Settings · Health · Runbook · Audit  

---

## 4. OPERATE screen specification (priority #1)

**Route:** `/admin/operate` — transform from card hub into **the control room**.

### 4.1 Layout — `BroadcastLayout`

```
┌────────────────────────────────────────────────────────────────────────────┐
│ TOPBAR: ON AIR pill · playout clock · Now · Next · Health summary         │
├──────────────────────────────────────────────┬─────────────────────────────┤
│ MAIN COLUMN                                  │ QUICK ACTIONS RAIL (240px)  │
│                                              │                             │
│  ┌────────────────────────────────────────┐  │  QuickActionsBar            │
│  │ OnAirPanel (large)                     │  │  · Reload output            │
│  │  ON AIR / IDLE                         │  │  · Emergency loop           │
│  │  Block title · source · category       │  │  · Go to next block         │
│  │  Elapsed / remaining (large type)      │  │  · Skip (if supported)      │
│  │  Progress bar + countdown              │  │  · Replace asset → block    │
│  └────────────────────────────────────────┘  │  · Pause automation         │
│                                              │  · Stop broadcast           │
│  ┌──────────────────┬─────────────────────┐  │                             │
│  │ UpNextQueue      │ HealthSummary       │  │  Output preview link        │
│  │ 3–5 blocks       │ exceptions only     │  │  Open live browser          │
│  └──────────────────┴─────────────────────┘  │                             │
│                                              │                             │
│  ┌────────────────────────────────────────┐  │  Runbook progress (compact) │
│  │ Alerts & risks (drift, media, fallback)│  │  Recent audit (5)           │
│  │ OutputMonitorPanel (embedded)          │  │                             │
│  └────────────────────────────────────────┘  │                             │
└──────────────────────────────────────────────┴─────────────────────────────┘
```

### 4.2 Zone requirements

| Zone | Component | Data source | 5-second rule |
|------|-----------|-------------|---------------|
| **OnAirPanel** | New (wrap `OperationsPanelOnAir` + server props) | `getLiveSchedule` + `findActiveSchedule` | Answers **#1** — large type, high contrast |
| **Countdown / remaining** | Inside OnAirPanel | `durationSeconds - elapsedInBlock` | Visible at a glance |
| **UpNextQueue** | New | Ready/active blocks after `nowSeconds` | Answers **#2** |
| **HealthSummary** | New | `collectOperatorHealth` — **fail/degraded only** | Answers **#3** |
| **Alerts & risks** | Extend monitor | `/api/output/monitor` + schedule health | Answers **#3** |
| **QuickActionsBar** | New | Server Actions + links | Answers **#4** |
| **Output preview/status** | Embed `OutputMonitorPanel` | Poll 2s — existing | Confidence, not decoration |

### 4.3 Quick actions — capability map

| Action | Phase 1 (first pass) | Backend today |
|--------|----------------------|---------------|
| **Reload output** | Link/button → `liveOutputHref(true)` + copy: "Click Start Output after reload" | Client only ✅ |
| **Emergency loop** | Button → force fallback carousel / clear override path | Partial — override + fallback exist |
| **Go to next block** | Button if API exists; else link to schedule + label "manual" | ⚠️ May need new Server Action (D1 override) |
| **Skip** | Same as advance — defer if no mutation | ⚠️ Not found in `lib/mutations` |
| **Replace asset** | Deep link to active block editor | ✅ Route exists |
| **Pause / resume automation** | Map to `updateProgramDayStatus` (active ↔ ready) | ✅ Exists on output page |
| **Stop broadcast** | `StopBroadcastButton` | ✅ Exists |

**First pass:** Ship actions that already work. Stub disabled buttons with tooltip for Skip/Go-next until Server Action lands in **Phase 1b** (still D1-only, OpenNext-safe).

### 4.4 Operate vs `/admin/output`

| Surface | Role |
|---------|------|
| **`/admin/operate`** | Full control room — monitor, queue, health, actions |
| **`/admin/output`** | Slim **capture launcher** for OBS/vMix PC — URLs, Start Output reminder, stop |

Do not duplicate full monitor on both; Operate embeds monitor, Output stays minimal.

### 4.5 Empty / pre-show states

| State | UI |
|-------|-----|
| No program day | Single CTA → Program |
| Day draft | Banner + link Admin → Runbook |
| Day active, gap | Show fallback + next countdown |
| Health fail | Blocking `HealthSummary` — no clutter |

---

## 5. UI principles (control room, not SaaS admin)

- **Dark mode first** — `surface-elevated-*`, `accent-live` for ON AIR  
- **High contrast** — operational text large (18–24px for ON AIR block title)  
- **Clear status colors** — green ok, amber warn, red danger/live  
- **Strong hierarchy** — one dominant panel (OnAir), not six equal cards  
- **Fewer cards** — remove FlowCard grid on Operate  
- **Fewer equal-weight buttons** — one primary action per rail section  
- **State awareness** — global broadcast strip on all admin pages  
- **Confidence, less clutter** — hide passing health checks during live  
- **Desktop priority** — 1280px+ control room; mobile gets condensed Operate, not feature parity  

**Explicit non-goals for this refactor:** On-air plate visual redesign, new chart libraries, light theme, mobile-first parity.

---

## 6. Reusable broadcast UI components

Extract under `components/broadcast/` (new folder):

| Component | Purpose | Basis | Server/Client |
|-----------|---------|-------|---------------|
| **`BroadcastLayout`** | Operate page shell: main + 240px rail + topbar slots | New layout wrapper | Server shell + client slots |
| **`OnAirPanel`** | Large ON AIR / IDLE, title, elapsed, remaining, progress | Extend `OperationsPanelOnAir` | Client (poll) + server initial |
| **`UpNextQueue`** | Next 3–5 blocks, time, title, status | New | Server |
| **`HealthSummary`** | Failing/degraded checks only, link to full health | `collectOperatorHealth` | Server |
| **`QuickActionsBar`** | Operational buttons with pending states | Wire existing Server Actions | Client + forms |
| **`StatusBadge`** | Unified broadcast status chip | Wrap `StatusPill` / `ClearStateBadge` | Either |

**Migration rule:** Wrap existing components first; do not duplicate monitor polling logic.

---

## 7. PREPARE / PROGRAM / ADMIN (after Operate)

### 7.1 PREPARE

Routes unchanged; chrome simplified around three operator verbs:

| Verb | Route | Purpose |
|------|-------|---------|
| Plates | `/admin/slides` | Create/list weather, data, guest lineup, YouTube, custom |
| Gap fill | `/admin/prepare/gap-fill` | Silent video + rotating carousel (single place) |
| Media | `/admin/assets` | Playable files only — no slides, no fallback editor |
| People | `/admin/guests` | Guest directory (lineup plates live under Plates) |
| Import | `/admin/vimeo` | Vimeo sync into Media |

- Hub: **Plates · Gap fill · Media · Import** cards + ready / needs-fix rail  
- Sub-nav on all Prepare detail pages (`prepareSubNav`)  
- Shared `LoopEditor` for gap-fill carousel and schedule timed loops  
- **Later:** Media upload drawer only (Phase 3 polish)  

### 7.2 PROGRAM

- Hub: today health gate + activate CTA  
- Schedule page keeps `ScheduleWorkspace` — visual rundown rework is Phase 4  
- Loop builder stays on schedule — not top nav  

### 7.3 ADMIN

Group under gear icon:

- Settings (Vimeo, operators, timezone)  
- Health (full checklist + Go Live Drill)  
- Runbook (per-day)  
- Audit  

---

## 8. Implementation phases

### Phase 0 — Sign-off (0.5 day)

- [ ] Confirm nav order (Operate first)  
- [ ] Confirm quick-action scope for first pass (existing-only vs new Skip mutation)  
- [ ] Confirm `cf:build` gate on CI  

---

### Phase 1 — First pass (implement next) ⭐

**Scope:** Navigation simplification + Operate hierarchy + broadcast components + OpenNext-safe patterns.

| # | Task | OpenNext |
|---|------|----------|
| 1.1 | Remove Direct nav group; add Admin gear → `/admin/settings` | ✅ static |
| 1.2 | Reorder nav: Operate · Prepare · Program · Admin; logo → `/admin` | ✅ |
| 1.3 | Extend `BroadcastStatusStrip` to all `/admin/*` (except login) | ✅ server fetch |
| 1.4 | Create `components/broadcast/*` (six components) | ✅ |
| 1.5 | Rebuild `/admin/operate` with `BroadcastLayout` | ✅ RSC + client islands |
| 1.6 | Embed `OutputMonitorPanel` + server-driven `UpNextQueue`, `HealthSummary` | ✅ poll via fetch |
| 1.7 | `QuickActionsBar` — wire Reload, Stop, Pause, Emergency loop, Replace asset | ✅ existing actions |
| 1.8 | Delete or archive unused `OperatorPath` | ✅ |
| 1.9 | Slim `/admin/output` to capture launcher | ✅ |
| 1.10 | Run `typecheck`, `lint`, `build`, `cf:build` | ✅ gate |

**Exit criteria:** Operator opens Operate and sees ON AIR, NEXT, HEALTH exceptions, ACTIONS without visiting other tabs.

---

### Phase 1b — Quick-action gaps (1 day)

- [ ] Server Action: skip / advance to next block (D1 override or block metadata — design before code)  
- [ ] Enable Skip / Go next in `QuickActionsBar`  
- [ ] Audit events for manual advances  

**Constraint:** D1 mutation + `revalidatePath('/admin/operate')` only.

---

### Phase 2 — Shell alignment (1–2 days)

- [ ] 56px icon sidebar + tooltips (`DESIGN.md`)  
- [ ] 48px topbar with ON AIR pill + playout clock  
- [ ] Login redirect: active day → Operate  
- [ ] Token sweep on admin panels  

---

### Phase 3 — Prepare / Program simplification (2–3 days)

- [x] Prepare sub-nav on all Prepare routes  
- [x] Hub: Plates, Gap fill, Media, Import  
- [x] Unified gap fill at `/admin/prepare/gap-fill`  
- [x] Plates workspace (tabs + list + create) at `/admin/slides`  
- [x] Media slim — no inline Vimeo import, no fallback loop checkbox  
- [x] Program fallback card → Gap fill; schedule loop uses shared `LoopEditor`  
- [x] Program hub activate CTA  
- [x] Dashboard (`/admin`) demoted — logo → Program; no dashboard in mobile nav  

---

### Phase 4 — Schedule rundown UX (2–4 days)

- [x] Vertical rundown rows + right rail on schedule page  
- [x] Loop builder modal  
- [x] Skip / Go next in QuickActionsBar  
- [x] Block drawer vs advanced page split (timing in drawer; overlays on block page)  

---

### Phase 5 — Alerts & polish (2+ days)

- [x] Merged alerts on Operate (`LiveAlertsPanel` + shared monitor hook)  
- [x] Pause clears override only; Stop ends broadcast  
- [x] Pre-show banners on Operate (draft/ready)  
- [ ] Drift, stall, silence banners on Operate (from `/pending` backlog)  
- [ ] E2E: login → Operate → monitor visible  
- [x] Update `USER_GUIDE.md`, README nav section  

---

## 9. Acceptance criteria

| Criterion | Target |
|-----------|--------|
| New user understands app structure | < 5 minutes (3 modes + Admin) |
| Operator understands channel state | < 5 seconds on Operate |
| Operate shows ON AIR, NEXT, HEALTH, ACTIONS | All four visible above fold on 1440×900 |
| Main nav top-level items | ≤ 4 (Operate, Prepare, Program, Admin) |
| Feels like broadcast ops tool | No equal-weight card grid on Operate |
| Existing pages reachable | All current routes work; no removals |
| Typecheck / lint / build | Zero errors |
| OpenNext build | `npm run cf:build` passes |
| No new Node-only runtime assumptions | Checklist §2 satisfied |
| Mobile | Usable for monitoring; desktop is primary |

---

## 10. What we are not doing

- Visual redesign of on-air plates / output graphics  
- WebSocket live sync  
- Local file storage or new `fs` usage  
- Removing `/output/live` or breaking OBS capture flow  
- Schema changes unless required for Skip/Advance (Phase 1b)  
- New npm packages without OpenNext verification  

---

## 11. Decision log

| # | Question | Decision | Date |
|---|----------|----------|------|
| 1 | Default nav order | Operate first | 2026-06-05 |
| 2 | Operate vs Output split | Operate = control room; Output = capture launcher | 2026-06-05 |
| 3 | Quick actions Phase 1 | Existing actions only; Skip/Go-next in 1b | 2026-06-05 |
| 4 | OpenNext gate | `cf:build` required per PR | 2026-06-05 |
| 5 | Skip/advance mutation design | D1 output override + block resize | 2026-06-05 |
| 6 | `/live` vs `/output/live` canonical | `/output/live` for capture | 2026-06-05 |

---

## 12. Appendix — route → mode map

| Route | Mode |
|-------|------|
| `/admin/prepare`, `/admin/assets`, `/admin/vimeo`, `/admin/music`, `/admin/guests`, `/admin/slides` | PREPARE |
| `/admin/program`, `/admin/calendar`, `/admin/schedule/**` | PROGRAM |
| `/admin/operate` | OPERATE |
| `/admin/settings`, `/admin/health`, `/admin/runbook/**`, `/admin/audit`, `/admin/output` | ADMIN (output = capture sub-page) |
| `/admin` | Dashboard (logo target) |
| `/output/**`, `/live` | Playout (no admin chrome) |

---

*End of plan — ready for Phase 1 implementation.*
