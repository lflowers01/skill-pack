# Research basis

Reviewed 2026-10-19. The workflow is an adaptation for Codex and general multi-step tasks, not a reproduction of a vendor runtime or a promise of unlimited autonomous execution.

## Primary sources and decisions

1. [Anthropic: Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents), 2025-11-26. Initial setup, structured requirements, incremental execution, progress artifacts, and end-to-end testing address lost context and premature completion. We retain the principles, but do not mandate Git commits or a startup shell script for every domain.
2. [Anthropic: Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps), 2026-03-24. Independent evaluation and testable completion contracts improved difficult builds. Components such as context resets and sprint structure became unnecessary as models improved. We use proportional review and continuous execution rather than a fixed multi-agent architecture or mandatory resets.
3. [Anthropic Agent SDK: Agent loop](https://code.claude.com/docs/en/agent-sdk/agent-loop) and [sessions](https://code.claude.com/docs/en/agent-sdk/sessions). A final response ends the loop; compaction can lose context; session IDs and durable application state support resumption. We separate model instructions, task evidence, and the host's actual continuation mechanism.
4. [LangGraph: Persistence](https://docs.langchain.com/oss/python/langgraph/persistence) and [interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts). Durable checkpoints and explicit resume inputs preserve workflow state. Interrupted nodes can rerun earlier side effects. We revalidate state and inspect receipts before repeating a mutation, and never treat elapsed time as authorization.
5. [Temporal: Retry policies](https://docs.temporal.io/encyclopedia/retry-policies). Retry behavior distinguishes permanent errors, backoff, and bounds; unlimited attempts can be the default. We require changed preconditions or a transient-failure basis for retrying, and audit alternatives after repeated no-progress cycles.
6. [OpenAI: Run long horizon tasks with Codex](https://developers.openai.com/blog/run-long-horizon-tasks-with-codex) and [skills](https://developers.openai.com/plugins/concepts/skills). Clear deliverables, durable plans/state, and completion verification are distinct from the skill packaging that instructs the model. We use native host facilities rather than building another execution service.

## Existing options considered

The [official autonomous-coding example](https://github.com/anthropics/claude-quickstarts/tree/main/autonomous-coding) demonstrates the original coding workflow. LangGraph and Temporal provide durable execution when an application needs an actual runtime. A new runtime, API dependency, or scheduler is unnecessary for the requested reusable skill. No third-party source code is bundled.

## Design choices to evaluate, not vendor claims

- One compact canonical checkpoint is the default; artifact references carry detailed evidence.
- Two equivalent no-progress cycles trigger a strategy review; a third triggers an alternatives audit. These thresholds are local heuristics, not an Anthropic or Temporal prescription.
- Default to one executing agent. Independent review or research is valuable when justified and authorized, not a universal prerequisite.
- Test persistence behavior against fresh-context recovery, ambiguous side effects, invalid completion claims, changing user intent, and quiet future continuation. Passing structural validation alone does not establish good agent behavior.
- Do not optimize for run duration, number of tool calls, or the absence of a failure status. Optimize for verified movement toward the actual user objective.
