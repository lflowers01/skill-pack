---
name: design-hillclimb
description: Run a measured UI/UX hillclimb on any app or website (Android, iOS, web, desktop). Screenshots fixed screens, grades them with an Opus LLM judge on industry-grade criteria (Nielsen heuristics, Material/HIG/WCAG, impeccable's AI-slop list), then improves the design in rounds and keeps only real gains. Use when the user says "run a hillclimb on the design", "hillclimb the UI/UX", "grade and improve the design", or asks to make an app look clean and not AI-made with measurable scores.
---

# Design hillclimb

The loop: **fixed screens → judge scores → fix the worst, most common problems → re-shoot → re-score → keep or revert**, until the held-back screens stop improving. Every number comes from the same screens with the same fake data, so a change in score means a change in the design.

Helpers live next to this file: `grade.mjs` (the judge), `rubric.md` (its system prompt), `compare.mjs` (round tables and noise), `sheet.mjs` (a contact sheet of the screens). Run them with `node <this-folder>/<script>`.

## Requires impeccable

This skill depends on the **impeccable** skill (pbakaus/impeccable). It's the design knowledge used to make every fix; this skill only measures.
- Check for it in the project's `.claude/skills/impeccable`, `~/.claude/skills/impeccable`, or `~/.codex/skills/impeccable`. If it's missing, install it (`npx skills add pbakaus/impeccable`, or clone github.com/pbakaus/impeccable and copy its skill folder) before doing anything else. Write `.impeccable/config.json` with `{"telemetry": false}` in the project root.
- During set-up, run impeccable's context step (its `PRODUCT.md`/`DESIGN.md` context) so its commands know the brand. Reuse what the codebase already says; ask the user only for what's missing.
- Each round, map the most common failed checks to impeccable commands and follow that reference file:
  - c_no_slop, c_platform → `polish` (plus the platform reference: `android.md`, `ios.md`, web)
  - c_spacing, c_alignment, c_hierarchy, c_density → `layout`
  - c_type → `typeset`
  - c_copy → `clarify`
  - c_states, c_one_primary → `harden`
  - c_contrast → `colorize` / `audit`
  - Re-read `reference/craft-floor.md` before editing.
- After the last round, run impeccable's `critique` (or `audit`) on the final screens and include its top notes in the report.

Works in Claude Code and Codex. `grade.mjs --judge auto` uses `claude` if it's on PATH, else `codex`; force one with `--judge codex` or `--judge claude`.

## 0. Set up (once per project)

1. **Find the app and how to run it**: web dev server, Android emulator (`adb -e`; never a real phone unless the user says so), iOS simulator, Electron. Ask only if it truly can't be found.
2. **Make a flow folder**: `.claude/hillclimb/<flow>/` in the project. It holds:
   - `context.txt`: 2–4 sentences: what the product is, who uses it, and the **deliberate brand choices** the judge must not penalize (theme, colors, mascot, fonts). Read the codebase/README/AGENTS.md for these; don't invent them.
   - `cases.json`: `[{ "id", "split": "train"|"test", "purpose" }]`. 12–20 screens covering the main flows, empty/error/edge states, dialogs, and one or two "bad day" states. Hold back about a third as `test`, spread across flows. `purpose` = one sentence on what the screen is for.
3. **Write a capture script** in the project (e.g. `<app>/eval/capture.*`) that puts the app into each case's state with **fixed fake data** and saves `vN/shots/<id>.png` at a real device size. Recipes are below. Make the dates relative to "now", so a case looks the same on any day.
4. **Show the user** the screens (`node sheet.mjs <flowDir> v0`, then render the HTML) and the plan: judge = Opus via `claude -p` on their Claude Code plan, 2 reps per screen, about $0.10 per grading, max 8 rounds, stop after 2 flat rounds on test. **Get a yes before the first graded run.** If they say "just do it", don't ask again.

## 1. Baseline

`node grade.mjs <flowDir> v0 --reps 2`. It writes `results.jsonl` and `summary.json`. Run it in the background (it takes ~8 min for 36 gradings with 4 jobs). Then run `node compare.mjs <flowDir>`. Report train and test UX scores, the **noise floor** (mean |rep A − rep B|), and the most common failed checks.

## 2. Each round

1. Read **only train** results: `compare.mjs` prints the top issues per train screen and the failure counts per check. Never read the test explanations; test is scored, not studied.
2. Pick fixes that are **systemic** (a shared component, a nav bar, an icon system, a copy pattern) and appear on several screens. Fix them at the shared component. Functional and state problems come before cosmetic ones (impeccable's polish triage). Make every fix through the impeccable command mapped above.
3. **Don't overrule the user**: anything the user explicitly asked for stays, even if the judge keeps flagging it. Mention it in the report instead.
4. Build. Run the project's tests. Capture `vN/shots`. **Look at a few screenshots yourself** (splash screens, dialogs that didn't open, and clipped states make a round meaningless). Grade `vN`. Run `compare.mjs`.
5. **Keep or revert**: a round counts as better when the test score rises by more than the noise floor. If a screen drops a lot, look at why, then fix it in the next round or revert that change.
6. Post one short line to the user per round: train/test scores and what changed.

## 3. Stop and report

Stop after 8 rounds, after 2 rounds in a row with flat test scores, at the budget cap, or when the user says so. The final report gives:
- the score table per round (train and test)
- the per-screen before/after
- what changed
- what the judge still flags
- anything left unchanged on purpose (the user's own choices)

Commit only when asked.

## Capture recipes

- **Web**: Playwright (`npx playwright@1 screenshot --viewport-size=390,844 <url> <png>`, or a small script that seeds fake data through localStorage/API mocks, then clicks). Shoot mobile (390×844) and desktop (1440×900) as separate cases if both matter.
- **Android emulator**:
  - Write the app's state file with `adb push` to `/data/local/tmp`, then `run-as <pkg> cp`.
  - `am force-stop`, then `am start --es <extra>` for deep links into each screen.
  - `adb exec-out screencap -p`.
  - Pitfalls:
    - Cold starts vary in length. Poll the screenshot until it stops being the splash screen (the splash PNG is far smaller).
    - Continuous animations stop `uiautomator dump` from going idle, so tap by coordinates.
    - Grant permissions with `pm grant` / `appops`.
- **iOS simulator**: `xcrun simctl launch`, `xcrun simctl io booted screenshot`, deep links through `simctl openurl`.
- **Desktop/Electron**: Playwright's `_electron`, or the app's own test hooks.

## Notes

- The judge needs Claude Code signed in (`claude -p`). The grader passes no tools, no hooks, no MCP and no session persistence, and it puts the image in through stream-json.
- The rubric is fixed during a climb. Changing it, or the cases, invalidates the comparisons. Start a new flow instead.
- `--split train` grades only train, to save usage while you iterate. Always grade the full set for a round that counts.
