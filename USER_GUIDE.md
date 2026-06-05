# RTV TL Manager Operator Guide

Short guide for running the current production workflow.

## Login

Open:

```txt
https://rtvtime.diegodella.ar/admin/login
```

Use the configured admin token or named operator handle/token.

## Navigation

The console uses four modes:

| Mode | Route | Purpose |
|------|-------|---------|
| **Operate** | `/admin/operate` | Control room — on-air, next, health, recovery |
| **Prepare** | `/admin/prepare` | Plates, gap fill, media, people, import |
| **Program** | `/admin/program` | Calendar, rundown, timed loops, activate |
| **Admin** | `/admin/settings` | Settings, health, runbook, audit, capture |

During live hours, start at **Operate**. Use **Capture** (`/admin/output`) on the OBS/vMix machine only. Operate is the monitor; Output is capture-only.

## Daily Workflow

1. **Prepare content**
    - Start at `/admin/prepare`.
    - **Plates** (`/admin/slides`): weather, markets, guest lineups, YouTube, custom graphics.
    - **Gap fill** (`/admin/prepare/gap-fill`): silent fallback video + rotating carousel when nothing is on air.
    - **Media** (`/admin/assets`): upload and verify playable files only.
    - **People** (`/admin/guests`): guest directory for lineup plates.
    - **Music** (`/admin/music`): background playlist for visual blocks.
    - **Import** (`/admin/vimeo`): sync Vimeo shows into Media.

2. **Program the day**
    - Start at `/admin/program`.
    - Create or open the day from Calendar.
    - Add blocks in `/admin/schedule/[date]`.
    - Use Loop Builder for **timed slide loops** only (not global gap fill).
    - Assign ready media, slides, overlays, and fallback assets.
    - For normal video programs that need disclosure, enable `Previously Recorded bug` and choose
      one of the four screen corners. This does not apply to ads, promos, slides, images, fallback,
      Reuters, or manual overrides.

3. **Check readiness**
    - Fix schedule health errors.
    - Confirm gap fill in Prepare → Gap fill (silent video optional, then carousel).
    - Open `/admin/runbook/[date]`.
    - Complete critical preflight checks.

4. **Go live**
    - Activate the day from **Program** hub or today's **Schedule** (Draft → Ready → Active).
    - Open `/admin/operate` for the control room (on-air, next, health, recovery).
    - Open `/admin/output` on the capture machine only.
    - Launch Live Browser Output.
    - Click `Start Output` once to unlock audio.
    - Capture that browser window in OBS/vMix.

5. **During live**
    - Watch alerts and diagnostics on **Operate** (merged monitor panel).
    - Check active block, next block, fallback reason, clock skew, and drift.
    - Use the runbook for incidents and handoff notes.

6. **Stop**
    - Use `/admin/output` -> Stop broadcast.
    - Complete shutdown checks.

## Output Behavior

`/output/live` renders the active schedule for browser capture. It supports Vimeo, direct HLS, MP4, images, slides, fallback states, background music for visual blocks, and the optional `PREVIOUSLY RECORDED` bug for normal video programs.

After reload, output resolves the active block again and seeks video to the correct scheduled offset. Browser audio still requires one operator click because autoplay with sound is blocked by browser policy.

Use `/output/preview/[blockId]` to test one block before air.

## Go Live Drill

Run this before trusting a machine for broadcast:

1. Open `/admin/health`.
2. Confirm environment, Supabase, storage, Vimeo, output token, and static assets are OK.
   Public `/api/health` only shows pass/degraded/fail summaries; admin health shows the full detail.
3. Open `/admin/output`.
4. Launch Live Browser Output.
5. Click `Start Output`.
6. Reload the output page mid-video.
7. Confirm video resumes at the current show time.
8. Confirm OBS/vMix receives both video and audio.

## Operator Notes

- Use Prepare -> Program -> Operate. That is the primary path.
- Do not schedule draft/failed media.
- Every active day should have a fallback asset.
- Slide loops and visual fallback blocks use the background playlist; video, ad, promo and live
  blocks pause it.
- Guest plates can be different per segment because each Guest Lineup plate stores its own selected
  guests and order.
- Weather plates can be created per city; use lat/lon only as advanced correction data.
- Reuters URLs are dynamic. Refresh the block or live override if the endpoint expires.
- Metals plates use Roxom metals data when available and fallback market data when unavailable.
- Weather plates use OpenWeather when configured and Open-Meteo when no key is present.
- Calendar/event plates use the Supabase `events` table.
- Secrets belong in `.env` or encrypted settings, not docs or chat.

## Useful Pages

- `/manual` - public manual
- `/pending` - backlog
- `/admin/prepare` - hub: Plates, Gap fill, Media, People, Music, Import
- `/admin/prepare/gap-fill` - silent video + carousel when off-air
- `/admin/slides` - plates (graphics)
- `/admin/assets` - media library (operator label: Media)
- `/admin/guests` - guest directory (People)
- `/admin/vimeo` - Vimeo import
- `/admin/program` - schedule, timed loops, activate
- `/admin/operate` - live control-room hub
- `/admin/health` - readiness checks
- `/api/health` - machine-readable health
