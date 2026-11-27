# skill-pack

A hand-picked set of agent skills for Claude Code, Codex, Google Antigravity and OpenCode. Each folder in `skills/` is one skill with a `SKILL.md`.

## Install

### Easiest: let your agent do it

Paste this into Claude Code, Codex, Antigravity or OpenCode:

```
Install the skills from https://github.com/lflowers01/skill-pack. Follow the "Instructions for agents" section in its README.
```

### Instructions for agents

If a user asked you to install this skill pack, do this:

1. Clone the public repo into a temporary folder: `git clone --depth 1 https://github.com/lflowers01/skill-pack`
2. Pick the skills folder for the agent you are running in:
   - Claude Code: `~/.claude/skills/` (Windows: `%USERPROFILE%\.claude\skills\`)
   - Codex: `~/.codex/skills/`
   - Google Antigravity: `~/.gemini/config/skills/` (shared by the Antigravity IDE, app and CLI; older versions read `~/.gemini/antigravity/skills/`, so if the skills don't show up, copy them there too)
   - OpenCode: `~/.config/opencode/skills/` (Windows: `%USERPROFILE%\.config\opencode\skills\`)
   `~` means the user's home folder (Windows: `%USERPROFILE%`). Create the folder if it does not exist. If you are not sure which agent you are, ask the user.
3. Copy every folder inside the repo's `skills/` folder into that skills folder, so each skill ends up as `<skills folder>/<skill-name>/SKILL.md`. Copy the folders themselves, not the `skills/` folder around them.
4. If a skill with the same name is already installed, ask the user before replacing it.
5. Delete the temporary clone.
6. Tell the user which skills were installed, and that they need to restart the agent (or start a new session) to load them.
7. `reverse-engineer-anything` only works once the REA MCP server is installed. Mention that, but do not install it unless the user asks. If they ask, follow "Full reverse-engineer-anything setup" below.

To update later, run the same steps again. The newest version is always at https://github.com/lflowers01/skill-pack.

### By hand

**Claude Code:** copy the folders you want into your skills folder.

```
git clone https://github.com/lflowers01/skill-pack
cp -r skill-pack/skills/* ~/.claude/skills/
```

On Windows that folder is `C:\Users\<you>\.claude\skills`. Restart Claude Code, then type `/` to see them, or just ask for the task and the matching skill loads on its own.

**Other agents:** same thing, different folder:

| Agent | Skills folder |
|---|---|
| Codex | `~/.codex/skills/` |
| Google Antigravity | `~/.gemini/config/skills/` (older versions: `~/.gemini/antigravity/skills/`) |
| OpenCode | `~/.config/opencode/skills/` |

To use the skills in just one project instead, copy them into `.agents/skills/` (Antigravity) or `.opencode/skills/` (OpenCode) inside that project. In Antigravity, open **Customizations** in the agent side panel to check they loaded. OpenCode also reads `~/.claude/skills/`, so if you already installed them for Claude Code you're done.

Superpowers and Ponytail are also published as Claude Code plugins, which stay up to date on their own:

```
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

### Full reverse-engineer-anything setup

The skill in this pack is just the instructions. The tools it drives come from REA ([morluto/rea](https://github.com/morluto/rea), [rea.tools](https://rea.tools/)). Only download REA from those two places or the [rea-agents](https://www.npmjs.com/package/rea-agents) npm package; look-alike copies exist.

1. Install [Node.js](https://nodejs.org/) (it includes npm).
2. Open a terminal in a normal folder, **not** inside a project you plan to take apart, and run:
   ```
   npx rea-agents setup
   ```
3. Pick your agent (Claude Code, Codex, Antigravity, OpenCode and others are on the list), read the plan it shows, and approve it. Setup backs up your config, connects the REA MCP server, and installs the newest version of this skill.
4. Restart the agent. Check it worked by asking: "Is REA connected? List its tools."
5. Optional, for native apps (`.exe`, `.dll`, Mac apps, firmware): REA needs an analysis engine. It can use Ghidra (free), Hopper, IDA, or Kuna if you have one, and setup can offer to install Hopper. JavaScript, Electron and website analysis need no engine.

Try it: "Understand how search works in the Notes app, show me the evidence, and build a similar feature for my project."

To update later: `npx rea-agents@latest setup`, then restart the agent. More help: [installation guide](https://github.com/morluto/rea/blob/main/docs/getting-started/installation.md).

Agents: run `npx rea-agents setup` only with the user's go-ahead, and let the user review and approve its plan themselves.

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
