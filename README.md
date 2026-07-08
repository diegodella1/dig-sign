# Dig-Sign

Dig-Sign is the control room for multi-screen digital signage. Operators prepare media and plates, build content playlists, assign them to screens by day, monitor playback, and capture protected browser output in OBS or vMix.

It is not a public video site. It is an internal operator console for keeping display loops organized, auditable, and recoverable.

## Current Status

Production is live at `digsign.diegodella.ar` using standalone Next.js behind a Cloudflare tunnel. The signage workflow is ready for controlled operation with an operator present.

What is working today:

- **Prepare** — media library, Vimeo import, music playlists, weather/YouTube plates
- **Signage** — screens, content playlists (visual loop editor), day-based playlist assignments, per-screen fallback playlists
- **Operate** — per-screen monitor, health summary, audit trail, capture URLs
- **Output** — `/output/live/[screenSlug]` with state from `/api/output/channel/state?screen=`
- **Backend** — Cloudflare D1 (database) and R2 (media storage)
- **Playback** — Vimeo, HLS, MP4, images, slides, playlist carousel rotation, background music on visual items
- **Uploaded media** — served through `/api/media/assets/[assetId]`
- **Security** — named operators, sessions, CSRF protection, audit logging, output capture token
- **Health** — admin health checks, persisted smoke status from deploy scripts
- **Legacy redirects** — old schedule/program URLs redirect to screens, playlists, or operate

Main product gate: remodel on-air plate visuals for a stronger broadcast look, then tighten operator alerts for stalled playback, silence, and missing assets.

Deployment note: the active production path is local standalone Next.js behind a Cloudflare tunnel. OpenNext/Cloudflare Workers support is configured (`wrangler.jsonc`) as an alternate deploy path.

## Product Promise

Dig-Sign replaces scattered signage prep with one operational flow:

1. Load or sync content.
2. Configure screens and playlists.
3. Assign playlists by date range.
4. Confirm health and fallback playlists.
5. Launch browser output per screen.
6. Monitor playback from Operate.
7. Recover with audit trail and fallback loops.

## Main Routes

### Operator console

| Route | Purpose |
|-------|---------|
| `/admin/login` | Operator login |
| `/admin` | Dashboard |
| `/admin/prepare` | Content hub (links to plates, media, music, import) |
| `/admin/screens` | Screen list and configuration |
| `/admin/screens/[slug]` | Single screen: timezone, fallback playlist, assignments |
| `/admin/playlists` | Content playlist list |
| `/admin/playlists/[id]` | Visual loop editor (plates + media, drag-and-drop) |
| `/admin/operate` | Screen monitor and capture URLs |
| `/admin/assets` | Media library |
| `/admin/vimeo` | Vimeo sync/import |
| `/admin/slides` | Plate library (weather, YouTube, templates) |
| `/admin/music` | Background music playlists |
| `/admin/settings` | Integration settings |
| `/admin/health` | Production readiness |
| `/admin/audit` | Operational audit trail |

### Public / capture

| Route | Purpose |
|-------|---------|
| `/output/live` | Redirects to `/output/live/main` |
| `/output/live/[screenSlug]` | Fullscreen browser player for OBS/vMix capture |
| `/output/slide/[slideId]` | Single-slide preview |
| `/manual` | Public operator manual |
| `/notion` | Status and operating guide |
| `/pending` | Roadmap and backlog |
| `/api/health` | Machine health summary |
| `/api/output/channel/state` | Player state (`?screen=` + optional `?token=`) |
| `/api/media/assets/[assetId]` | Public media proxy for R2-stored uploads |

### Legacy redirects (bookmarks)

Old TV-schedule URLs redirect automatically:

- `/admin/program` → `/admin/screens`
- `/admin/calendar`, `/admin/schedule/*` → `/admin/playlists` or `/admin/screens`
- `/admin/runbook/*`, `/admin/output` → `/admin/operate`
- `/live`, `/output/preview/*` → `/output/live/main`

## Daily Workflow

1. Open **Prepare** and add content: upload media, sync Vimeo, create weather/YouTube plates, configure music playlists.
2. Open **Signage → Screens** and confirm each physical display has a screen row (default: `main`).
3. Create **content playlists** with the visual loop editor (plates and ready media, duration per item).
4. **Assign playlists** to screens by date range; set a **fallback playlist** on each screen for off-hours or empty days.
5. Open **Health** and fix any failing checks (env, D1, R2, Vimeo, output token, screens configured).
6. Open **Operate**, copy the capture URL for each screen (`/output/live/[slug]?token=...`).
7. Open the URL on the capture machine, click **Start Output** once to unlock audio, capture in OBS/vMix.
8. During playback, watch the screen monitor on Operate for missing assets or fallback states.

Default timezone for screens and day resolution: `America/Argentina/Buenos_Aires`.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- Cloudflare D1 + R2 (via Drizzle ORM)
- Vimeo API
- `hls.js`
- Vitest
- Playwright

## Local Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Default local URL:

```txt
http://localhost:3450
```

Required `.env` values:

```bash
APP_ENCRYPTION_KEY=
ADMIN_BOOTSTRAP_TOKEN=
OUTPUT_CAPTURE_TOKEN=          # required in production
APP_BASE_URL=
NEXT_PUBLIC_APP_BASE_URL=
```

Optional:

```bash
VIMEO_ACCESS_TOKEN=
OPENWEATHER_API_KEY=           # weather falls back to Open-Meteo when unset
ALERT_WEBHOOK_URL=
ALERT_WEBHOOK_COOLDOWN_MS=600000
DIGSIGN_BASE_URL=              # smoke scripts
ALLOW_DEMO_DATA=true           # local dev only; never in production HTTPS
```

Generate an encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Useful Commands

```bash
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
npm run smoke:http
bash scripts/deploy_local_tunnel.sh
npm run cf:build
npm run cf:deploy
```

Active production deploy for `digsign.diegodella.ar`:

```bash
bash scripts/deploy_local_tunnel.sh
```

Alternate Cloudflare Workers path:

```bash
npm run cf:build
npm run cf:deploy
```

Cloudflare deploys must keep dashboard vars/secrets configured: `APP_ENCRYPTION_KEY`, `ADMIN_BOOTSTRAP_TOKEN`, `OUTPUT_CAPTURE_TOKEN`, app base URLs, and Vimeo token. Deploy scripts use `--keep-vars` to preserve dashboard variables.

## Database

D1 migrations live in:

```txt
drizzle/
```

Apply to remote D1 (production):

```bash
wrangler d1 migrations apply dig-sign-db --remote
# or with named env:
wrangler d1 migrations apply dig-sign-db --remote --env prod
```

Migration order:

| File | Purpose |
|------|---------|
| `0000_closed_christian_walker.sql` | Base schema |
| `0001_music_playlists.sql` | Music playlists |
| `0002_screen_playlists.sql` | Screens, playlists, assignments |
| `0003_drop_guests.sql` | Remove guest tables |
| `0004_drop_schedule.sql` | Remove hour-based schedule tables |

After `0004`, these tables are **gone**: `program_days`, `program_blocks`, `scheduled_layers`, `output_overrides`, `operator_runbook_checks`, `events`.

## Production Gates

Before trusting a screen in production:

- `/api/health` has no failing checks.
- D1 migrations through `0004` are applied.
- At least one **active screen** exists (`/admin/screens`).
- Each screen has a **fallback playlist** with playable items.
- Today's date has a playlist assignment (or fallback covers the gap).
- `/output/live/main?token=...` plays on the capture browser after **Start Output**.
- OBS/vMix browser capture validated for video and audio.
- Uploaded media URLs use the public app proxy, not `127.0.0.1`.

## Roadmap

Near-term priorities:

- remodel on-air plate visuals
- improve operator alerts for stalled playback, silence, and missing assets
- expand recurring playlist templates and multi-screen layouts

See also:

- `/pending`
- `/notion`
- `docs/production-readiness.md`
