# Durable state and handoff

Use the host's existing durable goal state or automation scratch when it can carry the checkpoint. Otherwise use `work/goals/<goal-slug>/goal.json` inside the current authorized workspace. Reuse the same path across sessions; record its absolute path in the handoff. Do not put task data in the installed skill folder or user-profile memory by default.

Read before writing. Write updates atomically where possible, preserve unrelated fields, and give one coordinator ownership when workers run in parallel. Do not overwrite an unrecognized existing goal. Checkpoint after meaningful increments and before yielding, rather than after every tool call.

## Minimum content

Keep these facts in one record; equivalent native fields are fine:

- Goal identity, objective, target/workspace, user constraints, and scope revisions.
- Explicitly requested tools, skills, methods, and environments, with execution evidence or an unresolved prerequisite. A fallback result does not erase these requirements.
- Stable criterion IDs with exact acceptance conditions, status, and evidence references.
- Recent meaningful attempts: hypothesis, action/input, observed result, evidence, and changed precondition needed for a retry.
- Current status, active operation handles, pending user questions, and dependencies requiring external change.
- The exact next action, how to verify it, and what event resumes a gate.
- For an unfinished handoff, the stopping audit: attempted actions, verified blocker per remaining requirement, and relevant alternatives exhausted or still available. Do not record completion while any required method remains unverified.
- Artifact paths and current revision/time; never credentials or session tokens.

Suggested states: `active`, `waiting`, `needs_input`, `paused`, `complete`. Native host states take precedence; map the gate honestly to its supported state rather than inventing a status API. Only user instruction creates a paused state. Waiting must identify an actual job or registered continuation. If the host uses `blocked`, preserve its required evidence and recurrence rules.

Concrete example, with illustrative evidence rather than a live task:

```json
{
  "id": "weekly-export",
  "objective": "Produce the weekly sales export and confirm delivery to the approved destination",
  "revision": 3,
  "status": "needs_input",
  "constraints": ["Use the existing export format", "Do not send until the destination is approved"],
  "scope_revisions": [],
  "criteria": [
    {
      "id": "C1",
      "acceptance": "Export contains the complete reporting week with validated totals",
      "status": "proven",
      "evidence": ["outputs/weekly-sales.csv", "work/export-validation.txt"]
    },
    {
      "id": "C2",
      "acceptance": "Approved destination confirms receipt of the validated export",
      "status": "unverified",
      "evidence": []
    }
  ],
  "attempts": [
    {
      "hypothesis": "Generated export matches the source totals",
      "action": "Ran existing reconciliation check",
      "result": "Source and export totals matched",
      "evidence": "work/export-validation.txt"
    }
  ],
  "active_operations": [],
  "pending_input": "Destination approval requested once; no response received",
  "resume_when": "User provides the approved destination",
  "next_action": "Verify destination approval, deliver once using the supported tool, then inspect the receipt"
}
```

Evidence paths must resolve within the actual workspace or identify an accessible external object, operation, source URL, test result, or revision. Retained tool evidence may expire with its session; export permitted necessary evidence or mark it for revalidation. A timestamp or evidence ID alone does not establish that a result is still valid.

## Resume checklist

1. Confirm goal identity and the latest user request. Preserve unfinished goals if the user changes tasks; do not silently resume them in the new task.
2. Inspect the artifact or external state needed for the next action. Reconcile contradictions explicitly. A stale `complete` checkpoint never overrides a broken or missing result.
3. Resolve uncertain side effects through receipts or operation lookup before repeating them. If the result is indeterminate and the action is not safely repeatable, ask for the missing evidence instead of guessing.
4. Keep valid completed work; refresh only evidence whose dependencies changed. Resume from the next criterion, not from initialization.

## Handoff format

Write a compact handoff with: objective; checkpoint path; proven criteria and evidence; unfinished criteria; pending handles/questions; failed approaches and why not to repeat them; exact next action and verification; any user pause, deadline, or budget. Tell the user whether a real continuation is registered or whether another session/input is required. Do not imply that a checkpoint file runs itself.

Compact old attempts into decisions plus evidence links once they no longer affect the next action. Retain permission decisions, scope changes, uncertain side effects, and failures that would otherwise be repeated. Resume the original objective after a gate clears; do not redefine the gate or a partial artifact as success.
