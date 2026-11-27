# Dashboard: when, how, and how to serve it

Bottom line: the dashboard is the day-14 tool, not a day-0 summary. Its job is a loop: record what you did, compare it, find what got in the way, fix the plan, report to a person. Insights are the weakest-evidence part, so they are few, quote-backed, and easy to reject. Research basis: the "Life audit dashboard insights" report (if-then plans d = 0.54 to 0.65; progress monitoring d = 0.40, about 0.19 bias-adjusted, stronger when written down and reported to someone; re-reading goals adds nothing; AI coaching beat a questionnaire only through perceived accountability).

## When

| Moment | What to do |
|---|---|
| End of sitting 4, after commitments are saved | Build it (steps below), serve it, walk the user through it for 2 minutes, stop the server when the sitting ends. |
| Before each check-in (day 14, then monthly x3) | Read `checkins/state.json`, refresh the data block if findings changed, serve it, let the user record first, then talk. |
| After each check-in | Fold what they recorded into the files (see "Reading what they recorded"), rebuild, stop the server. |
| Never | Between check-ins as a daily companion, or in `capture-only` mode. Do not build it before sitting 4. |

## Build steps

1. Copy `templates/dashboard.html` to `life-audit/outputs/dashboard.html` (first time only). Afterwards only replace the JSON inside `<script id="data">`. Never edit the page code per user.
2. Fill the straightforward fields from files: `commitments` from `outputs/commitments.md`, `goals` from `findings/values-and-motives.md`, `lives` from `findings/alternative-lives.md`, `record` from the findings files, `schedule` from `state.md` (day 14 plus three monthly dates), `accountability` from `profile.md`.
3. Generate `gaps`, `synergies`, `conflicts`, and `plan_check` in a fresh context (see "Insight pipeline"). Not at the end of the interview thread: models that already agreed with someone rarely recover.
4. Set `"example": false`.
5. Run `python <skill>/scripts/verify_quotes.py life-audit`. Any NOT FOUND quote gets fixed to the exact words or removed. Do not serve until it passes.
6. Serve (below).

## Field rules

- `anchor_quote`: one verbatim quote about what matters most to the user. It goes first because affirming a core value lowers defensiveness before hard information.
- `plan_check` per commitment:
  - `cue_specific`: a time, place, or event that happens on its own ("after my 2:30 lab"). "When I have time" or "when I feel like it" fails.
  - `action_concrete`: a visible behavior someone could watch.
  - `obstacle_internal`: a habit, feeling, or thought, not an outside excuse.
  - `fix`: one rewritten if-then, only when a check fails. Empty otherwise.
- `target_per_week`: days per week the user agreed to. The page compares the last 14 days against twice this.
- `gaps` (2 to 4, never more). Each is a computed difference the user could not see in the transcript. Allowed kinds:
  - `hours`: hours goals claim vs hours available. Include `chart`. Only with numbers the user gave.
  - `motive`: high priority with pressure-driven motive and low follow-through, or high autonomy with no plan (leverage).
  - `energy`: recurring features of absorbed moments vs whether any goal contains them.
  - `fantasy`: vivid outcome, vague obstacle, high confidence on the same goal.
  - `values`: something called important that gets little time or energy.
  Every gap has: `title` (plain finding, no verdict about who they are), `observation` (the comparison), `quotes` (FOR), `counter` (AGAINST, may be empty but must be searched for), `question` ("Could it be that...?"), `lever` (one concrete change, tied to a commitment or a conflict decision).
- `goals`: `autonomous` (enjoyment plus personal value) and `controlled` (guilt plus outside reward) each 0 to 4, kept separate, from the motive answers. `follow_through` is the user's 1 to 10. `has_plan` true only if a commitment serves it.
- `synergies` before `conflicts`. Each conflict names the shared resource and 2 or 3 options (sequence, merge, drop). `decided` holds the user's choice if they already made one.
- `lives`: same four ratings for all three. `linked_to_now` is false when no commitment moves that life; the page flags it.
- `prompts`: at least 3 notice/understand/act triples built from this user's material. The page rotates one per check-in.
- `rerate`: 2 or 3 day-0 pain-point quotes to re-rate at each check-in.
- `least_sure`: open questions, phrased as questions.

## Insight pipeline (anti-sycophancy, anti-fabrication)

1. **Draft in a fresh context.** If subagents exist, give one only the `findings/`, `outputs/`, `decisions.md`, and `profile.md` files plus these rules, and ask for candidate gaps, synergies, conflicts, and plan checks as JSON. Without subagents, start a new turn block by re-reading only those files and ignore the conversation's tone.
2. **Critic pass.** A second fresh agent (or a separate pass) sees each claim with its quotes only, answers "do these quotes support this claim?", and searches the files for counter-quotes.
3. **Minimum evidence.** A pattern needs quotes from at least 2 different sittings. A contradiction needs at least one quote on each side. Thinner items move to `least_sure` as questions.
4. **Barnum test.** Would this be true of most people doing a life audit ("you want more balance")? Cut it.
5. **No praise layer.** No "great job", no compliments, no red FAILED. Neutral counts and changes.
6. **Banned moves:** calling avoidance thoughtfulness, calling a contradiction "complexity", accepting the user's account of who is at fault without a quote.
7. **Cap negatives.** At most 4 gaps, each with a lever.
8. Run `verify_quotes.py`.

## Serving

```
python <skill>/scripts/serve_dashboard.py life-audit --open
```

- Run it in the background so it survives the turn. It serves `http://127.0.0.1:8780/` (use `--port` if busy) and saves everything the user taps or types to `life-audit/checkins/state.json` (previous version kept as `.bak`). Localhost only, stdlib only.
- Give the user the URL. Tell them: tap the days you did each commitment, answer the check-in questions, mark each insight Fits, Partly, or Does not fit.
- Stop the server when the sitting or check-in ends.
- No Python: open `life-audit/outputs/dashboard.html` directly. It works, but saves only in that browser. The user presses "Copy for Claude" and pastes the result into the chat.
- Never publish the page online (hosted artifact, gist, etc.) unless the user asks, after reminding them it contains personal reflections.

## Reading what they recorded (`checkins/state.json`)

The page owns this file. Treat it as truth. Keys:
- `done`: commitment id to list of ISO dates done (minimum version counts).
- `diag`, `decision`, `new_if_then`, `replace`: per commitment check-in answers. Copy decisions into `decisions.md`; update `outputs/commitments.md` with new if-thens.
- `insight`: gap id to `fits` / `partly` / `no`; `insight_edit` holds their correction. Mirror into `hypotheses.md` (accepted / unsure / rejected). Rejected gaps do not come back unless new quotes support them.
- `conflict`: chosen option per conflict. Copy into `decisions.md` and `findings/goal-conflicts.md`.
- `reflect`, `rerate`: answers per check-in (`r0`, `r1`, ...). Quote them in `log/checkin-DATE.md`.
- `history`: one line per completed check-in.

## Did it help? (log in `log/checkin-DATE.md`)

At each check-in, note three things: did they record a number, did they reject or correct at least one insight, did they change at least one if-then. A 100% "fits" rate is a warning sign that insights are too agreeable, not a success.

## Honest limits

Almost none of the evidence comes from dashboards built on interview data; it comes from health tracking and lab tasks. Insight caps, counter-quotes, the motive map, and the cue/skip/pointless diagnosis are design inferences, not tested. The AI coaching result is a 2-week preprint. Treat this page as a well-grounded guess.
