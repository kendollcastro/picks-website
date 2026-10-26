# KCMPICKS Implementation Roadmap

Derived from `docs/market-research-report.md` and the current codebase audit.

---

## Phase 1: Trust & Transparency (High Impact, Low Effort) ✅ Done

1. **Confidence grades on every pick** ✅
   - Added `getPickGrade()` / `getValueRatingGrade()` utilities.
   - Grade badges shown on Dashboard cards, Jev top picks, and Enhanced AI cards.

2. **No-vig true odds & +EV grade** ✅
   - Cards now display true odds (American format) and +EV %.
   - Jev picks show model probability, true odds, edge, and expected value.

3. **Transparent pick-history page** ✅
   - Created `/api/model-history` route and `/history` page.
   - Shows every AI pick, filters by sport/market/status, plus per-sport and per-market stats.
   - Added Model Performance section to Dashboard with link to `/history`.

4. **Line-movement alerts** ✅
   - Added `opening_*` columns to `games` table and `preserve_opening_lines` trigger.
   - Updated scraper (`odds-scraper/scraper.py`) and `/api/games` to expose opening lines.
   - `usePredictions` now wires opening lines through to pick cards.
   - New `calculateLineMovement()` utility + `LineMovementAlert` component.
   - Jev picks and Enhanced AI cards show live line-movement alerts (e.g. "▲ Line moved +4.2%").

5. **Surface Elo/rating deltas** ✅
   - `usePredictions` now fetches Massey ratings for both teams.
   - Enhanced AI cards show each team's rank and the rating delta between teams.

---

## Phase 2: Engagement & Premium Features (High Impact, Medium Effort)

6. **Per-sport accuracy dashboards** ✅
   - Enhanced `/history` page with per-sport cards, sample-size badges, and ROI bar chart.
   - Added per-market (bet type) breakdown table.
   - Added model calibration table comparing predicted probability buckets to actual win rate.

6b. **Public betting splits / sharp money tracker** ✅
   - Added `betting_splits` table and `/api/betting-splits` route.
   - New scraper `odds-scraper/betting_splits.py` with Action Network → OddsTrader → TeamRankings fallback.
   - Public-money badges shown on Enhanced AI cards and Jev picks.
   - GitHub Action workflow runs odds + splits scrapers every 15 min.

7. **Parlay builder**

---

## Hotfixes / Improvements applied out-of-order

- **All-market pick selection** ✅
  - Refactored `selectBestPick()` in `prediction-service.ts` to evaluate ML, spread, and total simultaneously.
  - Now picks the highest +EV option across all markets instead of defaulting to moneyline.
  - Added spread-cover and total-projection heuristics using team stats.
  - UI cards now show a market badge (ML / Spread / Total).

---

7. **Parlay builder**
   - Let users multi-select legs from the top picks list.
   - Rank combinations by combined edge; warn about correlation.

8. **Social leaderboards**
   - Add a `public_profiles` view and allow users to share their pick record.
   - Tail/fade consensus based on model picks.

9. **xG integration for soccer**
   - Add FBref/API-Football xG data source.
   - Replace simple recent-form heuristic with xG-based form for soccer predictions.

10. **Injury/lineup impact model** ✅
    - Added ESPN injuries proxy (`/api/espn/injuries`) and `game-conditions` service.
    - Tracks injuries, rest days, back-to-backs, and outdoor/weather flags.
    - Adjusts ensemble win probabilities based on high-impact injuries and short rest.
    - Feeds conditions into the Jev research prompt so Jev sees real injury data.
    - Shows injury/rest badges on Enhanced AI cards and Jev picks via `GameConditionsAlert`.

---

## Phase 3: Advanced AI & Personalization (High Impact, High Effort)

11. **"Ask KCMPicks" AI agent**
    - Chat interface that explains why a pick has value using existing rationale data.

12. **Real-time/in-play probabilities**
    - Consume live play-by-play feeds for NBA/NFL.
    - Update win probability model during games.

13. **Monte Carlo simulation engine**
    - 10k sims per game across all sports; blend with Jev probabilities.

14. **Personalized recommendation engine**
    - Track favorite teams, bet types, risk profile.
    - Customize homepage and pick feed.

---

## Compliance Checklist

- [ ] Remove any "lock/guaranteed" copy; use probability language.
- [ ] Add 21+ age-gate and geo-check on entry.
- [ ] Add responsible gaming footer (1-800-GAMBLER + state helplines).
- [ ] Add affiliate disclosures.
- [ ] Add self-exclusion/limit links in settings.

---

## Suggested Premium Tier

**$9.99–$29.99/mo**
- Unlimited AI rationale / chatbot.
- +EV board and sharp line-movement alerts.
- Advanced bankroll analytics and CLV tracking.
- Private Discord / community.
- Sport-specific model files (Elo, xG, player props).
