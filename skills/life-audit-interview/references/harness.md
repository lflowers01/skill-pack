# Harness: state protocol

Bottom line: the conversation is disposable, the files are the source of truth. Treat context as a cache. If context is cleared, compacted, or a new session starts, you must resume exactly where you left off by reading files.

## Project folder (in the user's working directory)

```
life-audit/
  README.md                 what this folder is, how to resume
  state.md                  control file: machine-readable header + plain notes
  profile.md                user context from sitting 1 setup
  log/
    sitting-1.md ... sitting-4.md   digests, not transcripts
    checkin-YYYY-MM-DD.md
  findings/
    pain-points.md          detest fest list, quotes, ranked, top two costliest marked
    energy-and-problems.md  absorbed and drained moments, problems seen firsthand, gap log
    values-and-motives.md   per goal: motive type, would-I-still-want-it, follow-through score
    goal-conflicts.md       competing goals and how the user resolved them (or did not)
    hypotheses.md           each hypothesis, date, status: proposed / accepted / rejected / unsure
    alternative-lives.md    three lives: title, key question, resource rating, cheapest experiment
    premortem.md            failure reasons, which are in the user's control, chosen responses
  outputs/
    summary.md              one-page summary (draft sitting 3, final sitting 4)
    commitments.md          at most three commitments plus check-in agenda
    dashboard.html          the check-in tool, built end of sitting 4 (see references/dashboard.md)
  checkins/
    state.json              what the user recorded on the dashboard (page owns it; treat as truth)
  decisions.md              append-only, every decision the user made, with date
  open-threads.md           parked questions, things to return to
  safety-notes.md           only whether a trigger occurred and was handled
```

If `life-audit/` exists, never overwrite it. Read and resume. Never delete user files; archive by moving to `life-audit/archive/`.

## state.md header

Read it first, every time. Update it every 5 user messages and at every phase boundary.

```
---
skill: life-audit-interview
version: 1
user_label:
current_sitting: 1
current_phase: setup
phase_started:
questions_asked_this_sitting: 0
user_messages_since_last_checkpoint: 0
next_sitting_date:
checkin_date: null
mode: normal            # normal | capture-only
safety_status: none     # none | trigger-handled | paused
last_sycophancy_check_at_message: 0
last_safety_restate_at_message: 0
total_user_messages: 0
---
## Last question asked
## What I was about to do next
## Anything the user asked me to remember or avoid
```

Phase ids: `setup`, `detest-fest`, `close-1`, `energy-and-problem-mining`, `values-and-motives`, `close-2`, `alternative-lives`, `premortem-and-challenge`, `draft-summary`, `edit-summary`, `woop-and-commitments`, `checkin`.

## The loop

### Start of session or after context loss
1. Read `README.md`, then `state.md`, then `profile.md`.
2. Read only the findings files the current phase needs (table below), plus `open-threads.md` and the most recent log.
3. Say in one sentence where we are. Run opening checks (sleep, mood, time). Continue from "What I was about to do next."
4. Missing or contradictory file: tell the user plainly, repair from logs, ask before overwriting.

### During a sitting
- After every answer with a quotable finding: append a verbatim quote with the date to the right findings file. Do it silently in the same turn, before the next question. Do not narrate file writes unless asked.
- Every 5 user messages or at a phase boundary (whichever first): update `state.md` (counters, phase, last question, what is next) and append a 3 to 6 line digest to `log/sitting-N.md`.
- At each phase boundary: write a phase recap at the top of the current log (learned, still open). Show it to the user in 2 or 3 sentences for correction. Corrections overwrite the finding; the old text stays in the log marked "corrected".
- Hypotheses: write to `hypotheses.md` the moment proposed, status `proposed`. Update on the user's reaction.
- Stated decisions ("I will drop X", "I want Y"): append to `decisions.md` immediately.
- Parked items: `open-threads.md`.
- Safety trigger: write date and "protocol followed" to `safety-notes.md`, set `safety_status`, stop writing quotes about the distressing content. Never write self-harm specifics anywhere.

### End of sitting
1. Final digest to the log. Set `next_sitting_date` and write the exact first question for next time under "What I was about to do next."
2. Generate the sitting's output, save it, show the user where it is.
3. Consistency pass: no finding the user rejected, no duplicate quotes, every hypothesis has a status, every stated decision is in `decisions.md`.

### Digest, not transcript
Save user quotes plus one line of context each. Never the full conversation. Keep each `log/sitting-N.md` under about 100 lines.

## Reads and writes per phase

| Phase | Reads | Writes |
|---|---|---|
| Setup (1) | state, README | profile, state, log/sitting-1 |
| Detest fest (1) | profile | findings/pain-points, open-threads, log |
| Energy and problem mining (2) | profile, pain-points | findings/energy-and-problems, open-threads, log |
| Values and motives (2) | profile, pain-points, energy-and-problems | findings/values-and-motives, hypotheses, log |
| Alternative lives (3) | all findings | findings/alternative-lives, hypotheses, log |
| Pre-mortem and challenge (3) | alternative-lives, values-and-motives | findings/premortem, findings/goal-conflicts, decisions, log |
| Draft summary (3) | all findings | outputs/summary.md (draft) |
| Edit summary (4) | outputs/summary.md, hypotheses | outputs/summary.md (final), hypotheses, log |
| WOOP and commitments (4) | values-and-motives, premortem, goal-conflicts | outputs/commitments.md, decisions, state |
| Dashboard (end of 4) | all findings, outputs/summary.md, outputs/commitments.md, profile | outputs/dashboard.html (data block only) |
| Check-in | checkins/state.json first, then outputs/commitments.md, decisions, last log | log/checkin-DATE, decisions, hypotheses, commitments, state, dashboard data block |

## Privacy

- First run: say what will be saved and where, ask permission. Offer no-save mode (resuming then needs pasted notes; use `templates/running-notes.md` as the paste format).
- Store only what the user stated. No diagnoses, no health details beyond what the user said about their own goals, nothing they ask not to record.
- Never store self-harm specifics, passwords, account numbers, or other people's private details beyond first names the user chose to give.
- "Forget this": delete that quote from every file where it appears (grep the folder), confirm, log only that a deletion occurred.
- Tell the user they can read, edit, or delete any file at any time. Hand edits are truth on the next read.
- Inside a git repo: add `life-audit/` to `.gitignore`. Warn before any commit that would include it.

## Failure handling

- Context lost mid-sitting: resume from "What I was about to do next", say so, re-ask the last question once.
- Corrupted or missing file: rebuild from the other files and logs, tell the user what was rebuilt.
- Two sessions writing at once: before writing, check that `total_user_messages` in `state.md` matches what you expect. If higher, re-read and merge first.
