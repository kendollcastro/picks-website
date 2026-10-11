#!/usr/bin/env python3
"""
KCMPICKS Odds Scraper
=====================
Pulls odds + scores from ESPN's public JSON feeds (no API key required) and
upserts them into the Supabase `games` table consumed by kcmpicks /api/games.

Feed: https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/scoreboard?dates=YYYYMMDD

Covers pre-game lines (moneyline, spread, over/under — DraftKings as shown on
ESPN), live status/scores, and final results. One request per league per day;
polite delay between calls. Writes a local JSON snapshot per day for debugging.

Usage:
  python scraper.py --dry-run                      # fetch + print, no DB
  python scraper.py --sport nba                    # only NBA, window default
  python scraper.py --days-back 0 --days-ahead 1   # today + tomorrow
  python scraper.py --export-csv                   # also write CSV snapshot
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import os
import sys
import time
import urllib.error
import urllib.request
from dataclasses import asdict, dataclass
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

try:
    from supabase import create_client

    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False


# ============================================
# CONFIG
# ============================================
ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports"
REQUEST_DELAY_S = 0.5
REQUEST_TIMEOUT_S = 20
# ESPN occasionally 403s bare urllib requests; full browser-ish headers are reliable.
REQUEST_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.espn.com/",
}

# League key -> ESPN path + kcmpicks sport key (matches picks.sport CHECK values
# where possible; soccer sub-leagues collapse to "soccer" / "mls").
LEAGUES: Dict[str, Dict[str, str]] = {
    "nba": {"path": "basketball/nba", "sport": "nba"},
    "wnba": {"path": "basketball/wnba", "sport": "womens-basketball"},
    "nfl": {"path": "football/nfl", "sport": "nfl"},
    "college-football": {
        "path": "football/college-football",
        "sport": "college-football",
    },
    "mlb": {"path": "baseball/mlb", "sport": "mlb"},
    "nhl": {"path": "hockey/nhl", "sport": "nhl"},
    "college-basketball": {
        "path": "basketball/mens-college-basketball",
        "sport": "college-basketball",
    },
    "womens-college-basketball": {
        "path": "basketball/womens-college-basketball",
        "sport": "womens-basketball",
    },
    "epl": {"path": "soccer/eng.1", "sport": "soccer"},
    "la-liga": {"path": "soccer/esp.1", "sport": "soccer"},
    "serie-a": {"path": "soccer/ita.1", "sport": "soccer"},
    "bundesliga": {"path": "soccer/ger.1", "sport": "soccer"},
    "ligue-1": {"path": "soccer/fra.1", "sport": "soccer"},
    "mls": {"path": "soccer/usa.1", "sport": "soccer"},
    "liga-mx": {"path": "soccer/mex.1", "sport": "soccer"},
    "ucl": {"path": "soccer/uefa.champions", "sport": "soccer"},
}

# ESPN status.type.name -> our status column
STATUS_MAP = {
    "STATUS_SCHEDULED": "scheduled",
    "STATUS_DELAYED": "scheduled",
    "STATUS_IN_PROGRESS": "in",
    "STATUS_FIRST_HALF": "in",
    "STATUS_SECOND_HALF": "in",
    "STATUS_HALFTIME": "in",
    "STATUS_TIPOFF": "in",
    "STATUS_PITCHING": "in",
    "STATUS_BREAK": "in",
    "STATUS_FULL_TIME": "post",
    "STATUS_FINAL": "post",
    "STATUS_FINAL_OT": "post",
    "STATUS_POSTGAME": "post",
    "STATUS_END_PERIOD": "in",
    "STATUS_POSTPONED": "postponed",
    "STATUS_CANCELED": "cancelled",
    "STATUS_CANCELLED": "cancelled",
    "STATUS_ABANDONED": "cancelled",
}

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(PROJECT_DIR, "data", "odds")

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
)
log = logging.getLogger("odds-scraper")


# ============================================
# DATA MODEL
# ============================================
@dataclass
class GameRecord:
    """One game row, mirrors the Supabase `games` table."""

    id: str
    sport: str
    league: str
    home_team: str
    away_team: str
    home_abbr: Optional[str] = None
    away_abbr: Optional[str] = None
    home_id: Optional[str] = None
    away_id: Optional[str] = None
    home_logo: Optional[str] = None
    away_logo: Optional[str] = None
    commence_time: Optional[str] = None  # ISO8601
    status: str = "scheduled"
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    venue: Optional[str] = None
    provider: Optional[str] = None
    home_moneyline: Optional[int] = None
    away_moneyline: Optional[int] = None
    draw_moneyline: Optional[int] = None
    spread: Optional[float] = None
    home_spread_odds: Optional[int] = None
    away_spread_odds: Optional[int] = None
    total: Optional[float] = None
    over_odds: Optional[int] = None
    under_odds: Optional[int] = None
    odds_captured_at: Optional[str] = None


# ============================================
# ESPN FETCH + NORMALIZE
# ============================================
def american_odds(value: Any) -> Optional[int]:
    """Parse ESPN odds ('-185', '+154', -185) into an int."""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return int(value)
    text = str(value).strip().replace("+", "")
    try:
        return int(float(text))
    except ValueError:
        return None


def decimal_line(value: Any) -> Optional[float]:
    """Parse a spread/total line ('-4.5', '218.5') into a float."""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip()
    # total lines can look like 'o218.5' / 'u218.5'
    if text[:1] in ("o", "u", "O", "U") and text[1:].replace(".", "", 1).replace(
        "-", "", 1
    ).isdigit():
        text = text[1:]
    try:
        return float(text)
    except ValueError:
        return None


def map_status(espn_name: Optional[str]) -> str:
    if not espn_name:
        return "scheduled"
    return STATUS_MAP.get(espn_name, "scheduled")


def _competitor_info(competitors: List[Dict[str, Any]], side: str) -> Dict[str, Any]:
    for comp in competitors:
        if comp.get("homeAway") == side:
            team = comp.get("team") or {}
            score_raw = comp.get("score")
            try:
                score = int(score_raw) if score_raw not in (None, "") else None
            except (TypeError, ValueError):
                score = None
            return {
                "name": team.get("displayName") or team.get("name") or "",
                "abbr": team.get("abbreviation"),
                "id": str(team.get("id")) if team.get("id") else None,
                "logo": team.get("logo"),
                "score": score,
            }
    return {"name": "", "abbr": None, "id": None, "logo": None, "score": None}


def _market_close_odds(market: Optional[Dict[str, Any]], side: str) -> Optional[int]:
    """Read moneyline/pointSpread home|away close odds."""
    if not market:
        return None
    side_obj = market.get(side)
    if not isinstance(side_obj, dict):
        return None
    close = side_obj.get("close") or {}
    return american_odds(close.get("odds"))


def normalize_event(
    event: Dict[str, Any], sport: str, league_key: str
) -> Optional[GameRecord]:
    """Map one ESPN scoreboard event to a GameRecord. Returns None if unusable."""
    event_id = event.get("id")
    if not event_id:
        return None

    competitions = event.get("competitions") or []
    comp = competitions[0] if competitions else {}
    competitors = comp.get("competitors") or []

    home = _competitor_info(competitors, "home")
    away = _competitor_info(competitors, "away")
    if not home["name"] or not away["name"]:
        return None

    status_type = (event.get("status") or {}).get("type") or {}
    status = map_status(status_type.get("name"))

    commence = event.get("date")

    # Auto-finalize: ESPN's daily scoreboard occasionally still lists a game
    # from a previous day whose status never flipped to `post` (rained out of
    # the feed, delayed status sync, etc.). If the start time is already in
    # the past but we still read `scheduled`, force it to `post` with no
    # score so downstream consumers (the picks slate) never treat a stale
    # pre-game row as "upcoming".
    if status == "scheduled" and commence:
        try:
            commence_dt = datetime.fromisoformat(commence.replace("Z", "+00:00"))
            if commence_dt < datetime.now(timezone.utc):
                status = "post"
        except ValueError:
            pass

    # ESPN reports "0" for games that haven't started; keep scores null until live/post.
    if status == "scheduled":
        home["score"] = None
        away["score"] = None

    venue = (comp.get("venue") or {}).get("displayName")

    # Odds live on the competition; may be [null] once a game is final.
    odds_list = comp.get("odds") or []
    odds = next((o for o in odds_list if isinstance(o, dict)), None)

    record = GameRecord(
        id=str(event_id),
        sport=sport,
        league=league_key,
        home_team=home["name"],
        away_team=away["name"],
        home_abbr=home["abbr"],
        away_abbr=away["abbr"],
        home_id=home["id"],
        away_id=away["id"],
        home_logo=home["logo"],
        away_logo=away["logo"],
        commence_time=commence,
        status=status,
        home_score=home["score"],
        away_score=away["score"],
        venue=venue,
    )

    if odds:
        record.provider = (odds.get("provider") or {}).get("name")
        record.spread = decimal_line(odds.get("spread"))
        record.total = decimal_line(odds.get("overUnder"))

        moneyline = odds.get("moneyline") or {}
        record.home_moneyline = _market_close_odds(moneyline, "home")
        record.away_moneyline = _market_close_odds(moneyline, "away")
        # Soccer 1X2 sometimes exposes a draw side on the moneyline market.
        record.draw_moneyline = _market_close_odds(moneyline, "draw")

        point_spread = odds.get("pointSpread") or {}
        record.home_spread_odds = _market_close_odds(point_spread, "home")
        record.away_spread_odds = _market_close_odds(point_spread, "away")

        total = odds.get("total") or {}
        over = total.get("over") or {}
        under = total.get("under") or {}
        record.over_odds = american_odds((over.get("close") or {}).get("odds"))
        record.under_odds = american_odds((under.get("close") or {}).get("odds"))

        record.odds_captured_at = datetime.now(timezone.utc).isoformat()

    return record


def fetch_scoreboard(espn_path: str, day: date) -> List[Dict[str, Any]]:
    """GET one league's scoreboard for one day. Returns raw events list."""
    url = f"{ESPN_BASE}/{espn_path}/scoreboard?dates={day.strftime('%Y%m%d')}"
    req = urllib.request.Request(url, headers=REQUEST_HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT_S) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        log.warning("HTTP %s for %s", exc.code, url)
        return []
    except Exception as exc:  # noqa: BLE001 - network/parse errors, keep going
        log.warning("Fetch failed for %s: %s", url, exc)
        return []
    events = payload.get("events") or []
    return [e for e in events if isinstance(e, dict)]


# ============================================
# PERSIST: SNAPSHOT + SUPABASE
# ============================================
def ensure_output_dir() -> str:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    return OUTPUT_DIR


def save_json_snapshot(records: List[GameRecord], day: date) -> str:
    out_dir = ensure_output_dir()
    path = os.path.join(out_dir, f"{day.isoformat()}.json")
    with open(path, "w", encoding="utf-8") as fh:
        json.dump([asdict(r) for r in records], fh, indent=2, ensure_ascii=False)
    return path


def save_csv_snapshot(records: List[GameRecord], tag: str) -> Optional[str]:
    if not records:
        return None
    out_dir = ensure_output_dir()
    path = os.path.join(out_dir, f"games_{tag}.csv")
    fieldnames = list(asdict(records[0]).keys())
    with open(path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        for record in records:
            writer.writerow(asdict(record))
    return path


def get_supabase_client():
    """Service-role client for scraper writes (bypasses RLS)."""
    if not SUPABASE_AVAILABLE:
        raise RuntimeError("supabase package not installed. Run: pip install supabase")
    url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError(
            "Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) / SUPABASE_SERVICE_ROLE_KEY"
        )
    return create_client(url, key)


def upsert_games(records: List[GameRecord], batch_size: int = 100) -> int:
    """Upsert into Supabase `games` on primary key `id`. Returns rows written."""
    if not records:
        return 0
    client = get_supabase_client()
    written = 0
    for i in range(0, len(records), batch_size):
        chunk = records[i : i + batch_size]
        rows = [asdict(r) for r in chunk]
        client.table("games").upsert(rows, on_conflict="id").execute()
        written += len(rows)
        log.info("Upserted %d/%d rows", written, len(records))
    return written


# ============================================
# MAIN SCRAPER RUN
# ============================================
def date_window(days_back: int, days_ahead: int) -> List[date]:
    today = date.today()
    start = today - timedelta(days=days_back)
    end = today + timedelta(days=days_ahead)
    days: List[date] = []
    cursor = start
    while cursor <= end:
        days.append(cursor)
        cursor += timedelta(days=1)
    return days


def select_leagues(sport_filter: Optional[str], league_filter: Optional[str]) -> Dict[str, Dict[str, str]]:
    selected = LEAGUES
    if league_filter:
        if league_filter not in LEAGUES:
            raise SystemExit(
                f"Unknown league '{league_filter}'. Options: {', '.join(LEAGUES)}"
            )
        selected = {league_filter: LEAGUES[league_filter]}
    if sport_filter:
        selected = {
            key: cfg
            for key, cfg in selected.items()
            if cfg["sport"] == sport_filter or key == sport_filter
        }
        if not selected:
            raise SystemExit(
                f"No leagues match sport '{sport_filter}'. "
                f"Sport keys: {sorted({c['sport'] for c in LEAGUES.values()})}"
            )
    return selected


def scrape(
    days_back: int = 1,
    days_ahead: int = 2,
    sport: Optional[str] = None,
    league: Optional[str] = None,
    dry_run: bool = False,
    write_db: bool = True,
    export_csv: bool = False,
) -> List[GameRecord]:
    leagues = select_leagues(sport, league)
    days = date_window(days_back, days_ahead)
    log.info(
        "Scraping %d league(s) across %d day(s) (%s -> %s)",
        len(leagues),
        len(days),
        days[0],
        days[-1],
    )

    all_records: List[GameRecord] = []
    seen_ids = set()

    for day in days:
        day_records: List[GameRecord] = []
        for league_key, cfg in leagues.items():
            raw_events = fetch_scoreboard(cfg["path"], day)
            league_games = 0
            for event in raw_events:
                record = normalize_event(event, cfg["sport"], league_key)
                if not record or record.id in seen_ids:
                    continue
                seen_ids.add(record.id)
                day_records.append(record)
                league_games += 1
            log.info(
                "%s %s: %d event(s) -> %d game(s)",
                day,
                league_key,
                len(raw_events),
                league_games,
            )
            time.sleep(REQUEST_DELAY_S)

        if day_records:
            snapshot = save_json_snapshot(day_records, day)
            log.info("Snapshot %s (%d games)", snapshot, len(day_records))
        all_records.extend(day_records)

    log.info("Total unique games: %d", len(all_records))

    if dry_run:
        log.info("Dry run: skipping Supabase upsert")
        for record in all_records[:5]:
            log.info("  sample: %s", json.dumps(asdict(record), ensure_ascii=False))
        if len(all_records) > 5:
            log.info("  ... and %d more", len(all_records) - 5)
    elif write_db and all_records:
        written = upsert_games(all_records)
        log.info("Supabase upsert complete: %d rows", written)
    elif write_db:
        log.info("Nothing to upsert")

    if export_csv and all_records:
        tag = datetime.now().strftime("%Y%m%d_%H%M%S")
        csv_path = save_csv_snapshot(all_records, tag)
        if csv_path:
            log.info("CSV snapshot: %s", csv_path)

    return all_records


# ============================================
# CLI
# ============================================
def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Scrape ESPN public odds/scores into Supabase `games`"
    )
    parser.add_argument(
        "--sport",
        type=str,
        help="Filter by kcmpicks sport key (nba, nfl, soccer, ...)",
    )
    parser.add_argument(
        "--league",
        type=str,
        help=f"Filter by league key ({', '.join(LEAGUES)})",
    )
    parser.add_argument(
        "--days-back",
        type=int,
        default=1,
        help="How many days before today to include (default: 1)",
    )
    parser.add_argument(
        "--days-ahead",
        type=int,
        default=2,
        help="How many days after today to include (default: 2)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Fetch and print only; do not write to Supabase",
    )
    parser.add_argument(
        "--no-db",
        action="store_true",
        help="Skip Supabase even without --dry-run (snapshots only)",
    )
    parser.add_argument(
        "--export-csv",
        action="store_true",
        help="Also write a combined CSV snapshot",
    )
    parser.add_argument(
        "--list-leagues",
        action="store_true",
        help="Print configured leagues and exit",
    )

    args = parser.parse_args(argv)

    if args.list_leagues:
        for key, cfg in LEAGUES.items():
            print(f"{key:28s} {cfg['path']:45s} sport={cfg['sport']}")
        return 0

    scrape(
        days_back=args.days_back,
        days_ahead=args.days_ahead,
        sport=args.sport,
        league=args.league,
        dry_run=args.dry_run,
        write_db=not args.no_db,
        export_csv=args.export_csv,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
