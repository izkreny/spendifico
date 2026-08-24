# What ships in `.claude/` and `.agents/`

This repo commits its own Claude Code configuration. Knowing what is there prevents both
reinventing it and being surprised by it.

Two boundaries first, because the names collide. **`.claude/agents/` holds subagent
definitions the harness loads; `docs/agents/` (this directory) holds prose agents read.** And
**`.claude/SETTINGS.md` owns every permission decision** in `.claude/settings.json`, decision by
decision, because JSON cannot hold comments; this file does not restate them.

**Skills.** A skill is invoked by its own name, so the slash command is the full name in
the left column (`/repo-dev-setup`). You do not have to remember them: each skill's
description also matches plain requests, so "set me up locally" reaches `repo-dev-setup`
on its own. The short forms quoted inside the descriptions (`/dev-setup`, `/secrets`) are
matching phrases, not registered commands.

| Skill             | What it does                                                                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `repo-dev-setup`  | First-time local setup, both apps. Start here on a fresh clone                                                                                                           |
| `repo-secrets`    | Manages `.env` files from templates, explains where real secrets live                                                                                                    |
| `repo-fly`        | Driving the Fly.io deploy through `flyctl` in Bash: when it loads and the traps that bit the initial deploy. The runbook and config themselves live in `docs/guides/deployment.md` and `backend/fly.toml` |
| `backend-nestjs`  | Passive reference library of NestJS rules, vendored from upstream. Consulted when writing backend code                                                                    |
| `frontend-nextjs` | Passive reference library of Next.js/React rules, vendored from upstream. Consulted when writing frontend code                                                            |
| `backend-drizzle` | How Drizzle and Turso are wired in **this** repo: the two migration scopes, the database-per-user consequences, the Turso drivers. Deliberately not a drizzle-kit manual |

**Tracker and pull-request conventions live in `.agents/github.md`**, not in a skill. It records
this repository's label set, what each axis asks, the default that is expressed by carrying no
label, the milestones, the issue title form, and the branch, commit, PR and merge forms. There is
no `repo-jira` skill any more: Jira stopped being the tracker on 2026-08-13 and its tooling was
retired on 2026-08-16, so issue work is `gh` in Bash.

**The file is named for its readers, and the name is load-bearing.** Two personal skills outside
this repository read it - `github-solo-dev-repo` for the tracker and `github-pr-flow` for branches,
pull requests and merges - and both look for `.agents/github.md` first, falling back to the same
filename under `.claude/`. Its previous name, `gh-issues.md`, was read by neither, so the per-repo
conventions it records were silently ignored. Each skill treats it as winning on every
conflict with its own defaults. Nothing under `.claude/skills/` names it, because nothing in this
repository consumes it.

**Agents** (delegated subtasks with their own context): `nestjs-specialist` and
`nextjs-specialist`. Both fetch and synthesise the live official docs, which is different from
the passive rule libraries above, and both name these two apps - which is why they are the only
two left here.

Four are gone. `code-reviewer` is superseded by the review rules in the user's own `AGENTS.md`.
`linus-reviewer`, `debugger` and `test-automator` moved to user scope rather than being retired:
nothing about any of them was specific to this repository, so each now loads in every repository
instead of one. `test-automator` was rewritten on the way out - its guidance named Jest, NestJS
and React Testing Library throughout, which would have read as confidently wrong in a repository
built on none of them, so it now reads the repository's own test setup before proposing
anything.

**Permissions.** `.claude/settings.json` is committed and applies to everyone. Notably,
`Edit` and `Write` are **not** pre-approved, so Claude asks before every file change and
you see the diff before it lands. Every decision in that file is explained in
`.claude/SETTINGS.md`, because JSON cannot hold comments. Personal preferences belong in
`.claude/settings.local.json`, which is gitignored.

**The `gh stack` CLI ships an official agent skill, and this repo no longer vendors it.** It was
committed here once, so that a fresh clone carried a byte-identical copy; it is now installed at
user scope instead, pinned to the same tag and the same tree SHA, which made the committed copy
redundant rather than merely duplicated. Stacked-branch work is covered by the user's
`github-pr-flow` skill, which owns both the CLI mechanics and this repo's wiring.

**Drizzle ships its own skills, and they are committed.** `drizzle-kit` bundles agent skills
of its own (`drizzle`, `drizzle-generate`, `drizzle-migrations`, `drizzle-push`,
`drizzle-pull`, `drizzle-hints`, `drizzle-output-modes`, `drizzle-responses-and-errors`, at
the revision committed here). `npm run skills`
at the repo root extracts them from the drizzle-kit in `backend/node_modules` into
`.agents/skills/`, and symlinks `.claude/skills/drizzle*` at them.

Both the files and the symlinks are committed, for the same reason `backend/drizzle/`
migrations are: they are generated, but everyone must have byte-identical copies, and a
fresh clone should work with no extra step. Only `skills-lock.json` is gitignored, because
it records the absolute path of whoever ran the installer.

**Refreshing them is a deliberate act, like regenerating migrations.** Bumping `drizzle-kit`
does not update them; re-run `npm run skills` and commit the diff. You will be told when
that is needed: the `drizzle` skill compares its own `metadata.revision` against
`drizzle-kit skills version` from the _installed_ binary and prints a notice when the
bundle is newer. That check is why committing them is safe - drift is surfaced rather than
silent.

Because those cover the CLI thoroughly, the repo's own `backend-drizzle` skill covers only
this project's wiring and defers the rest to them.

`drizzle-kit` also ships an **MCP server**, `node backend/node_modules/drizzle-kit/bin.cjs
mcp`, exposing `generate`, `push`, `pull`, `check`, `export` and `up` as tools. It is in
`.mcp.json.example`; copy that to `.mcp.json`, which is gitignored and therefore
per-developer. Note that `push` applies schema changes directly to a database without
writing a migration, which is the opposite of this repo's committed-migrations workflow.

**The daisyUI Blueprint MCP drives frontend UI work, and its three stages earn three
different levels of trust.** It is a per-developer server rather than a committed one, and
PET-57's plan is what made it this repo's method: run `daisyui_setup_expert`,
`daisyui_rules_enforcer` and `daisyui_component_syntax_expert` before writing daisyUI markup,
and `daisyui_quality_inspector` with `auditIntent` `fix_changes` after. What PET-57's
incorporation of main established, verified finding by finding:

- **Follow the syntax stage verbatim.** Every canonical structure it returned matched the
  installed daisyUI's own CSS, and it is what keeps parallel work consistent. Double-checking
  it is wasted effort.
- **Adjudicate the inspector's automated findings; never auto-apply its fixes.** On this
  codebase it produces confident false positives: it cannot see a label association that goes
  through component composition (`frontend/src/components/ui/FieldShell.tsx`'s `htmlFor` names
  every field control it flags as unlabelled), it reports the repo's variant-map convention -
  whole literal class strings selected from a `Record`, the pattern `frontend/CLAUDE.md`
  mandates - as "dynamic classes", and it can anchor a finding on a comment line while the
  code it asks for sits lower in the same file. It repeated fifteen identical false findings
  across two runs of PET-57's incorporation, so a clean automated pass may simply be
  unreachable here; the suite's `getByLabelText` assertions pin the associations it cannot
  see. Check each finding against source, fix the real ones, and record the verdict on the
  rest.
- **Nothing it does replaces opening the app.** The one real defect of that incorporation -
  daisyUI animating `modal-box` through `scale`, which made the box the containing block for
  the date popover's `position: fixed` - was invisible to the inspector and to a fully green
  test suite, and only a Chrome walk of the changed flow caught it. The inspector's
  manual-check protocol demands that walk; treat the walk, not the findings list, as the
  stage's real value.

**That walk runs in headless Chromium over the DevTools protocol, and the method is not this
repo's to state.** It lives at user scope, in the `browser-verification` skill: launching and
attaching, why computed style and the accessibility tree are the evidence rather than a screenshot,
why the pre-fix markup gets probed in the same run, and five gotchas met in practice. Do not ask
which browser to use.

What belongs here is the part that is only true of this app, and it is worth reading before writing
a walk against it.

- **The defects a walk finds here are catalogued.** `frontend/CLAUDE.md`'s Where daisyUI and
  Tailwind fight is the list of classes that are present in the markup and paint nothing, which is
  the whole class of defect this check exists for.
- **Two contrast controls, both on record from independent runs.** `base-300` measures ~1.16:1
  against `base-100` and must **fail**; `base-content/50` measures ~3.4:1 light and ~4.8:1 dark and
  must **pass**. A harness without a pair like this proves nothing about itself. A third case:
  a class Tailwind never compiled reports exactly 1.0, so a passing control tells you the harness
  works *and* that the class exists.
- **This app ships the Expensa theme pair selected by `prefers-color-scheme` (PET-74)**, so a
  theme-specific check needs `Emulation.setEmulatedMedia`. The Settings Theme control pins one
  instead, through a `data-theme` attribute the root layout stamps from the `spendifico.theme`
  cookie; a walk of that path sets the attribute or the cookie rather than emulating media.
- **The ₵ CEDI SIGN in `ui/Sidebar.tsx`'s wordmark is the glyph this repo flags for a human eye**,
  because `next/font` fetches from Google at build time and the fallback family renders offline.
- **Storybook is the cheap surface and does not cover everything.** `npm run storybook` plus
  `iframe.html?viewMode=story&id=<id>` reaches every component and screen with no backend and no
  session, and `index.json` lists the story ids. The four `(app)` screens sit behind the session
  gate, so reaching them headlessly means driving register, the emailed link and `/auth/verify`
  first - possible, and far more setup than a component check needs.

