# AptiCrack

A colorful, self-contained aptitude-prep tracker for campus placement / SDE exam prep — quant, logical reasoning, and verbal aptitude only (no DSA/CS subjects). Generates a 12-week (3-month) study plan, tracks daily tasks, logs weekly exam scores, and charts your progress. Everything lives in your browser's `localStorage` — there's no backend, no login, and no data ever leaves your device (except when you export a backup).

Dashboard name: **Mission 15lpa**. Plan starts **Tuesday, 22 September 2026**, 2 hours/day, weekly exam every **Sunday**.

---

## 1. Setup & running it

Requirements: [Node.js](https://nodejs.org) 18+ and npm.

```bash
cd apticrack
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). That's it — no environment variables, no API keys, no database.

Other useful commands:

```bash
npm run build     # production build -> dist/
npm run preview   # serve the production build locally
npm test          # run the test suite (Vitest)
```

The first time you open the app with no saved data, it loads **sample data** — a demo plan that "started" three weeks ago with realistic progress, so you can see every feature working immediately. A banner at the top says so. Click **"Clear sample data"** whenever you're ready to start your real plan (your settings — name, theme, dates — carry over).

---

## 2. Changing the 12-week plan

The week-by-week curriculum (which topics/tests happen on which week, in what phase) lives in:

```
src/lib/topics.js  →  CURRICULUM array
```

Each entry is one week: `{ week, phase, title, focus, exam: {q, l, v, pct}, blocks: [...] }`. `blocks` lists the topics (by id) or special days (revision, sectional test, mixed practice) scheduled that week. Edit this array to reorder topics, change exam question counts, or restructure phases. After editing, go to **Settings → Regenerate plan** (or clear sample data) to rebuild the schedule from the new curriculum.

The plan's *timing* logic (how many weeks, how days are split into learn/practice/review/revise tasks, how questions-per-day are distributed) is in `src/lib/planGenerator.js`. `TOTAL_WEEKS` in `src/lib/constants.js` controls the plan length (default 12).

## 3. Changing daily study duration

Go to **Settings → Daily targets**:
- **Daily study time (minutes)** — total time per day (default 120 = 2 hours)
- **Questions per day** — target question volume
- **Time split** — how a study day divides between Learn / Practice / Review mistakes / Revise (percentages, default 30/42/17/11)

Changing these **rescales all your upcoming (not-yet-done) tasks** automatically; anything already completed stays untouched. You can also change the default for brand-new plans by editing `DEFAULT_SETTINGS` in `src/lib/constants.js`.

## 4. Adding/removing topics

Use the **Topics** page in the app — "Add topic" lets you add one to any section; opening a topic and clicking "Remove" deletes it (any of your completed history is kept; only untouched future tasks for that topic are removed).

To change the *starting* topic list (what a brand-new plan is seeded with), edit `DEFAULT_TOPICS` in `src/lib/topics.js`. Note: topics added from the UI aren't automatically scheduled into the week-by-week plan — add tasks for them manually from the Daily tracker, or fold them into `CURRICULUM` and regenerate the plan.

## 5. Deployment

AptiCrack is a fully static site — `npm run build` produces a `dist/` folder you can host anywhere (Netlify, Vercel, GitHub Pages, S3, etc.). `vite.config.js` sets `base: './'` so it also works fine hosted in a subfolder/subpath, not just at a domain root.

```bash
npm run build
# upload the contents of dist/ to your static host
```

Because everything is stored in `localStorage`, each browser/device has its own independent copy of the data — there's nothing to configure server-side, and no accounts to manage. Use **Settings → Export backup** to move your data between devices or browsers (download a `.json` file, then **Import backup** on the other one).

## 6. How progress is calculated

All of this logic lives in one file: `src/lib/stats.js`.

| Metric | Formula |
|---|---|
| **Overall progress** | completed tasks ÷ total planned tasks × 100 |
| **Topic progress** | completed tasks for that topic ÷ total tasks for that topic × 100 |
| **Daily progress** | completed tasks that day ÷ planned tasks that day × 100 |
| **Exam accuracy** | correct answers ÷ attempted questions × 100 (attempted = correct + wrong) |
| **Exam score** | correct × marks-per-correct − wrong × negative-marking (per your marking scheme in Settings) |

Notes:
- **Skipped tasks are never counted as completed** — they're tracked in their own bucket everywhere (dashboard donut, day stats, etc).
- **Streak** counts consecutive days with at least one completed task or a submitted exam; days with nothing scheduled (rest days) neither break nor extend it.
- **Topic revision scheduling** is spaced by confidence: each topic has a 1–5 confidence rating, mapped to a suggested revision gap (1★→2 days, 2★→4, 3★→7, 4★→14, 5★→21) from the last time you studied it. Low confidence, low recent accuracy, or an exam flagging a topic as weak all mark it "needs revision."

## 7. Project structure

```
src/
  lib/            — all data logic, no React (dates, plan generation, stats, storage, sample data)
  context/        — AppContext.jsx: global state, localStorage persistence, all mutations
  components/     — ui.jsx (shared primitives), charts.jsx, Layout.jsx, TaskCard.jsx
  pages/          — one file per page: Dashboard, Plan, Daily, Exams, Analytics, Topics, Settings
  test/           — Vitest + Testing Library smoke/interaction tests
```

## 8. Ideas for future features

- In-app question bank (currently scores are entered manually)
- Multi-device sync (would need a backend — currently intentionally local-only)
- Printable/PDF weekly summary
- Push/browser notifications for daily reminders
- Company-specific plan presets (different weighting per target company's exam pattern)
- Pomodoro-style focus timer built into the Daily tracker
- Shareable read-only progress link
