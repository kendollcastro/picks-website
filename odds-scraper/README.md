# odds-scraper

Scrapes **ESPN public JSON feeds** (no API key) for odds, scores and live status, then upserts into the Supabase `games` table that kcmpicks reads via `GET /api/games`.

Source: `https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/scoreboard?dates=YYYYMMDD`

Runs automatically via GitHub Actions (`.github/workflows/scrape-odds.yml`) every 30 minutes during the day. Can also run locally.

## Setup (local)

```bash
cd odds-scraper
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` in this folder (or export in your shell):

```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

Also run the migration once in the kcmpicks Supabase SQL editor:

```
supabase/migrations/games.sql
```

## Usage

```bash
python3 scraper.py --dry-run                 # fetch + print, no DB write
python3 scraper.py                           # default window: yesterday → +2 days
python3 scraper.py --sport nba               # one sport
python3 scraper.py --days-back 0 --days-ahead 1
python3 scraper.py --export-csv              # also CSV snapshot in data/odds/
python3 scraper.py --list-leagues
```

npm scripts: `npm run scrape`, `scrape:today`, `scrape:dry`, `scrape:nba`, `scrape:nfl`, `scrape:soccer`, ...

Local JSON snapshots land in `data/odds/YYYY-MM-DD.json` on every run.

## GitHub Actions (automatic)

The workflow at `.github/workflows/scrape-odds.yml`:

- Schedule: every 30 min during roughly 8am–1am ET
- Manual trigger: Actions tab → "Scrape odds" → Run workflow
- Secrets required (repo Settings → Secrets and variables → Actions):
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Notes

- Odds come from the sportsbook ESPN displays (usually DraftKings) — one line, not multi-book.
- Finished games keep scores but ESPN drops the betting line (`odds: [null]`); those rows still upsert with scores + null odds.
- Free, no key. Be polite: default delay is 0.5s between league requests.
- ESPN's feed is unofficial and may change; failures are logged per league/day and the run continues.
