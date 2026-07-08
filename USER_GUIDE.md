# Dig-Sign Operator Guide

Short guide for the current signage workflow.

## Login

Open:

```txt
https://digsign.diegodella.ar/admin/login
```

Use the configured admin bootstrap token or a named operator handle/token.

## Navigation

The console uses four modes:

| Mode        | Route             | Purpose                              |
| ----------- | ----------------- | ------------------------------------ |
| **Operate** | `/admin/operate`  | Screen monitor, health, capture URLs |
| **Prepare** | `/admin/prepare`  | Plates, media, public URLs, music    |
| **Signage** | `/admin/screens`  | Screens, playlists, day assignments  |
| **Admin**   | `/admin/settings` | Settings, health, audit              |

Start at **Operate** during playback hours. Use the capture URL from Operate on the OBS/vMix machine only.

Legacy bookmarks still work via redirects (`/admin/program` → screens, `/admin/output` → operate).

## Daily Workflow

### 1. Prepare content

Start at `/admin/prepare`.

- **Plates** (`/admin/slides`) — weather cities, YouTube embeds, template graphics.
- **Media** (`/admin/assets`) — upload files or add YouTube, Vimeo, direct video and public image URLs.
- **Music** (`/admin/music`) — background music playlists for visual items in output.

Only mark assets **ready** after playback is verified. Draft or failed assets should not go into playlists.

### 2. Configure signage

**Screens** (`/admin/screens`)

- One row per physical display (slug used in the player URL, e.g. `main`, `lobby`).
- Set timezone (default: `America/Argentina/Buenos_Aires`).
- Assign a **fallback playlist** — plays when no day assignment matches or the assignment is empty.

**Playlists** (`/admin/playlists`)

- Create a content playlist per loop (morning board, promos, weather rotation, etc.).
- Open the playlist editor: drag plates and media, set seconds per item, save.
- Items rotate in order; total loop duration is the sum of item durations.

**Assignments** (on each screen page)

- Link a playlist to a screen with optional start/end dates.
- For a single-day loop, set start and end to the same date.
- For an open-ended loop, leave end date empty.

### 3. Check readiness

Open `/admin/health` and fix any failing checks:

- Environment variables configured
- D1 database reachable
- R2 storage reachable
- Output capture token set (production)
- At least one screen configured

Confirm each screen's fallback playlist has at least one playable item.

### 4. Go live

1. Open `/admin/operate`.
2. Review the monitor tile for each screen (active playlist, current item, health).
3. Copy the capture URL for the target screen (`/output/live/[slug]?token=...`).
4. Open that URL on the capture machine.
5. Click **Start Output** once to unlock browser audio.
6. Add the browser window as a source in OBS or vMix.

Repeat for each physical display (different screen slug per machine).

### 5. During playback

- Watch Operate for fallback states, missing assets, or health degradation.
- If a playlist item references deleted media, output falls back to the screen's fallback playlist or a safe empty state.
- Use `/admin/audit` to review recent operator actions if something changed unexpectedly.

### 6. Change content mid-day

- Edit the playlist in `/admin/playlists/[id]` and save — output picks up changes on the next poll cycle.
- To switch loops, update the screen assignment or fallback playlist; no "activate day" step is required.

## Output Behavior

`/output/live/[screenSlug]` renders the resolved playlist for that screen and date.

Supported item types:

- **Slides/plates** — weather, YouTube, HTML templates
- **Video** — YouTube/Vimeo URLs, HLS, MP4 via media library
- **Images** — static images with configurable duration
- **Background music** — optional bed on visual items when music output is configured

State API:

```txt
GET /api/output/channel/state?screen=main&token=YOUR_OUTPUT_CAPTURE_TOKEN
```

The player polls this endpoint every ~2 seconds. Without a valid token, the API returns 401 in production.

Browser audio requires one operator click (**Start Output**) after load or reload because autoplay with sound is blocked by browser policy.

## Go Live Drill

Run before trusting a capture machine:

1. Open `/admin/health` — all checks green or acceptable degraded.
2. Open `/admin/operate` — every screen shows a playlist or fallback.
3. Open `/output/live/main?token=...` on the capture machine.
4. Click **Start Output**.
5. Confirm video/slides advance through the playlist loop.
6. Reload the page — playback should resume on the current carousel position.
7. Confirm OBS/vMix receives video and audio.

Public `/api/health` shows pass/degraded/fail summaries only. Full detail is on `/admin/health` when logged in.

## Operator Notes

- Workflow: **Prepare → Signage → Operate**. That is the primary path.
- There is **no hour-based rundown**. Timing comes from item durations inside each playlist.
- Each screen needs a **fallback playlist** for off-hours and failure recovery.
- Weather plates use OpenWeather when configured; otherwise Open-Meteo.
- Secrets belong in environment variables or encrypted settings — not docs or chat.
- Default screen slug is `main`; `/output/live` redirects there automatically.

## Useful Pages

| Page                 | URL                 |
| -------------------- | ------------------- |
| Public manual        | `/manual`           |
| Backlog              | `/pending`          |
| Prepare hub          | `/admin/prepare`    |
| Plates               | `/admin/slides`     |
| Media library        | `/admin/assets`     |
| Music                | `/admin/music`      |
| Screens              | `/admin/screens`    |
| Playlists            | `/admin/playlists`  |
| Operate / monitor    | `/admin/operate`    |
| Health               | `/admin/health`     |
| Audit                | `/admin/audit`      |
| Player (main screen) | `/output/live/main` |
| Health API           | `/api/health`       |

## Troubleshooting

| Symptom                     | Likely cause                                               | Fix                                                     |
| --------------------------- | ---------------------------------------------------------- | ------------------------------------------------------- |
| Fallback slate / empty loop | No assignment for today, empty playlist, or missing assets | Check screen assignment and fallback playlist items     |
| 401 on output URL           | Missing or wrong `OUTPUT_CAPTURE_TOKEN`                    | Set token in env; append `?token=` to URL               |
| Audio silent                | Browser autoplay policy                                    | Click **Start Output** on the player page               |
| Screen not in monitor       | Screen status not `active`                                 | Edit screen on `/admin/screens/[slug]`                  |
| Health migration fail       | D1 not migrated through `0004`                             | Run `wrangler d1 migrations apply dig-sign-db --remote` |
