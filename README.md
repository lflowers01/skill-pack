# skill-pack

A hand-picked set of agent skills for Claude Code and Codex. Each folder in `skills/` is one skill with a `SKILL.md`.

## Install

**Claude Code:** copy the folders you want into your skills folder.

```
git clone https://github.com/lflowers01/skill-pack
cp -r skill-pack/skills/* ~/.claude/skills/
```

On Windows that folder is `C:\Users\<you>\.claude\skills`. Restart Claude Code, then type `/` to see them, or just ask for the task and the matching skill loads on its own.

**Codex:** copy them into `~/.codex/skills/` instead.

Superpowers and Ponytail are also published as Claude Code plugins, which stay up to date on their own:

```
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

## What's inside

### Coding workflow (Superpowers)
| Skill | Use it for |
|---|---|
| using-superpowers | Teaches the agent to check for a skill before every task |
| brainstorming | Turn an idea into a design before writing code |
| writing-plans | Break a design into a step-by-step plan |
| executing-plans | Work through a plan yourself, step by step |
| subagent-driven-development | Hand plan steps to subagents and review each one |
| dispatching-parallel-agents | Run independent tasks at the same time |
| test-driven-development | Write the failing test first, then the code |
| systematic-debugging | Find the root cause before fixing a bug |
| verification-before-completion | Run the checks before saying "done" |
| requesting-code-review / receiving-code-review | Ask for a review, and handle feedback without blindly agreeing |
| using-git-worktrees | Isolated branches for feature work |
| finishing-a-development-branch | Merge, PR, or clean up when the work is done |
| writing-skills | Write and test your own skills |
| diagnosing-superpowers | Figure out why a session went off the rails |

### Keep code simple (Ponytail)
| Skill | Use it for |
|---|---|
| ponytail | The simplest solution that works: no extra abstractions or dependencies |
| ponytail-review / ponytail-audit / ponytail-debt | Find over-engineering in a diff or a whole codebase |
| ponytail-gain / ponytail-help | Measure the savings; list the commands |

### Design and frontend
| Skill | Use it for |
|---|---|
| impeccable | Design, critique, audit and polish any UI |
| frontend-design | A distinctive look instead of a generic template |
| better-ui | Exact values for radius, shadows, icons and motion |
| animate | Build an animation that feels right |
| design-hillclimb | Screenshot, grade and improve a UI in measured rounds |
| webapp-testing | Test a local web app with Playwright |

### Study, writing and planning
| Skill | Use it for |
|---|---|
| interactive-math-tutor | Step-by-step tutoring in any subject, practice on paper, mock exams, tracking weak spots |
| ste | Rewrite a confusing explanation in clear, plain technical English |
| doc-coauthoring | Write specs, proposals and docs together, section by section |
| interview | Get interviewed in depth to turn an idea into a detailed spec |
| relentless-goal | Keep working on a long goal until it is actually finished and verified |
| life-audit-interview | A guided interview over a few sittings to sort out goals and direction |

### Build your own tools
| Skill | Use it for |
|---|---|
| skill-creator | Create, test and improve skills |
| mcp-builder | Build an MCP server that connects an agent to an API |
| reverse-engineer-anything | Take apart apps, binaries, firmware and web pages to see how they work. Needs the [REA](https://github.com/morluto/rea) MCP server installed first |

## Credits and licenses

These skills come from their original authors and keep their licenses:

- Superpowers by Jesse Vincent, MIT (`licenses/superpowers-MIT.txt`)
- Ponytail by DietrichGebert, MIT (`licenses/ponytail-MIT.txt`)
- animate by Emil Kowalski, MIT; better-ui by Jakub Krehel, MIT (license in each folder)
- impeccable, Apache 2.0
- reverse-engineer-anything from [morluto/rea](https://github.com/morluto/rea), MIT
- frontend-design, skill-creator, mcp-builder, webapp-testing and doc-coauthoring from Anthropic's public skills repo, Apache 2.0
- interactive-math-tutor, design-hillclimb, relentless-goal and life-audit-interview were written for personal use and are shared as is
