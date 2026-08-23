# Refactor and extract to user global space the agent-facing context

Work that used to live in this repository now lives at user scope. Two personal skills at
`/home/izkreny/.agents/skills/` - `github-solo-dev-repo` for the issue tracker and `github-pr-flow`
for branches, pull requests, review and merge - supersede three of this repo's own skills and one
of its subagents, and they carry conventions this repository has not adopted yet.

So this ticket is not the documentation refactor its issue was opened for. It is the repo half of a
move that already happened elsewhere: shed what is superseded, align what disagrees, and pull
anything still worth keeping up to user scope before it is deleted. The `CLAUDE.md` refactor waits
for its own ticket.

The instruction list this plan executes is
`/home/izkreny/tmp/agents/sessions/2026-08-18_github-skills-review_892acd4c/spendifico-cleanup.md`,
written by the session that reviewed those two skills. Its thirteen steps are all in scope.

**Two directories in this plan are named `.agents` and they are not the same one.**
`/home/izkreny/.agents/` is the user's own agent configuration, outside this repository and outside
every commit. `.agents/`, with no prefix, is this repository's own directory - it already holds the
generated drizzle skills, and Stage 1 puts `github.md` beside them. Every path here is written in
full: absolute means the user's home, and anything relative is relative to the repository root.

## Three stages, in priority order

1. **Extraction to global user space** - what leaves this repository, and what is read from
   `/home/izkreny/.agents/` instead
2. **Memory checkout** - the memory directory and its `MEMORY.md`, every file given a verdict
3. **The `CLAUDE.md` set** - deferred to its own ticket, but skimmed here for anything that belongs
   at user scope

Stages 2 and 3 reach outside this repository. Nothing in a commit here can create or verify a file
under `/home/izkreny/.agents/` or in the memory directory, so the branch cannot close over them:
that work is done alongside, reported, and recorded here with a verdict per file.

## What supersedes what

| Superseded here | By, at user scope |
| --- | --- |
| `.claude/skills/repo-commit/` | `github-pr-flow` |
| `.claude/skills/repo-review-prs/` | `github-pr-flow` |
| `.claude/skills/repo-stack/` | `github-pr-flow`, `workflows/stack.md` |
| `.claude/agents/code-reviewer.md` | `## Code changes` in `/home/izkreny/.agents/AGENTS.md` |
| `.claude/gh-issues.md` | `github-solo-dev-repo`, overridden per-repo by `.agents/github.md` |

`.claude/agents/linus-reviewer.md` is **moved rather than superseded**. It is a review persona
rather than an analyser, so nothing at user scope replaces it - and nothing about it is specific to
this repository either, so it goes to `/home/izkreny/.agents/agents/` where every repository gets it. The four
remaining subagents stay: `debugger` is generic but unexamined, and `nestjs-specialist`,
`nextjs-specialist` and `test-automator` all name these two apps.

**That move needs wiring that does not exist yet.** `/home/izkreny/.claude/` symlinks exactly three things into
`/home/izkreny/.agents/` - `CLAUDE.md`, `drafts` and `skills` - and there is no `agents` among them, nor an
`/home/izkreny/.agents/agents/` directory to point one at. An agent file placed there is read by no harness
until `/home/izkreny/.claude/agents` is symlinked at it, so the symlink is part of the task rather than a
follow-up. Its consequence is worth stating once: after it exists, every user-scope agent is
offered in every repository, which is the point for this one and the thing to remember before
putting a repo-specific agent there later.

## Decisions taken

**The per-repo file goes to `.agents/github.md`, not `.claude/github.md`.** Both skills read
`.agents/github.md` first and fall back to `.claude/github.md` only "where that is what the
repository uses" (`github-solo-dev-repo/SKILL.md:48`, `github-pr-flow/SKILL.md:38`). This
repository already has an `.agents/` directory, holding the generated drizzle skills, so the
preferred path costs nothing. The rename currently staged on this branch stops at the fallback and
is completed rather than kept.

**`scripts/docs-check.sh` must stop excluding all of `.agents/`.** Its `docs()` filter skips
`^\.agents/` wholesale, an exclusion written for the vendored skill trees under `.agents/skills/`.
Moving `github.md` there would silently drop it out of every assertion in that script - its
`<!-- sync: -->` marker, its backticked paths, its code fences - which is the opposite of what the
move is for. The pattern narrows to `^\.agents/skills/`.

**`commitlint.config.js` needs no `scope-enum`, and the reason is worth recording rather than
assuming.** Step 7 of the instruction list makes it conditional on the config linting commits on
`main`. It does not: `.github/workflows/ci.yml` guards the commitlint step with
`if: github.event_name == 'pull_request'`, so it never runs on a push to `main`, and no CI step
lints a pull request title. Since the scope arrives only on the squash subject GitHub builds from
the PR title, there is nothing for `scope-enum` to fire on. Adding it would be a rule that can
never fail.

**`.claude/commit-checks.md` goes with `repo-commit`.** `docs/agents/claude-tooling.md:174`
describes it as a generated cache read by that skill. It is not named in the instruction list, and
deleting the skill without it leaves a generated file with no generator and no reader.

**The two generic documentation checks now exist twice, and they stay that way.** Step 12 of the
instruction list records that the generic half of `scripts/docs-check.sh` - that backticked paths
resolve, and that no code fence is left unclosed - now also lives at
`/home/izkreny/.agents/skills/github-pr-flow/scripts/docs-check.py`. Stripping them from the shell script would
leave them enforced only by a user-scope skill, and CI cannot reach one: the `conventions` job runs
`npm run docs:check` and nothing else. Both copies keep them until the Python rewrite of the
repo-specific checks lands, which step 12 already names as a separate branch.

**The vendored `.claude/skills/gh-stack/` is deleted, and the two copies are provably the same
tree.** Its frontmatter pins the install - `github-ref: refs/tags/v0.1.0`, `github-tree-sha:
c95c8b5b4dd850f3fef007b304428f5684f2fb87` - and `/home/izkreny/.agents/.skill-lock.json` records
`skillFolderHash` at that same SHA for the user-scope install. So this is not a judgement about
which copy is better; they are byte-identical, and the repo copy is the redundant one. Note for
anyone refreshing it later that upstream's own frontmatter disagrees with itself, tagging `v0.1.0`
while declaring `version: 0.0.9`.

**The branch format does not change.** Step 6 of the instruction list rewrites the commit header,
the PR title and the issue title, and says nothing about branches - which reads as an omission and
is not one. `github-solo-dev-repo/references/standards.md:384` keeps
`{type}/GHI-{issue-number}_{slug}`, and `:417` gives the reason the prefix survives exactly there:
`#` is hostile in a shell and in a path, and a bare `41` in `git branch -a` says nothing about what
it counts. The trailer moves to `(#{issue-number})` because a commit message is the one place `#`
both works and autolinks. `docs/plans/` filenames keep `GHI-` for the same reason.

**Two decisions belong to the deferred `CLAUDE.md` ticket, and are recorded so the reasoning is not
re-derived.** The eight per-ticket narrative paragraphs in root `CLAUDE.md` (lines 42-204, PET-73
through PET-85) move to a new `docs/history/`, one file per ticket, keeping agent-file path
notation - they are a decision record rather than feature documentation, and neither `docs/plans/`
nor git history holds a mid-ticket decision in a form anyone finds. And `frontend/src/app/CLAUDE.md`
is **not** split despite its 3,270 lines: every promotion this repo has made was done by a ticket
already working in the area, and a split picked on line count alone is the mistake
`docs/agents/conventions.md` describes.

## What the instruction list leaves for us to find

The three skill deletions and the subagent deletion break references in five files. Only one of
them fails `npm run docs:check` - `docs/agents/conventions.md:40` backticks
`.claude/skills/repo-stack/SKILL.md` in the fact-ownership table - so the other four are silent and
have to be found by sweep rather than by gate: `docs/agents/claude-tooling.md` (the skill table,
the agents paragraph, the `gh-stack` paragraph and the `commit-checks.md` note),
`docs/CONTRIBUTING.md:76` and `:81`, `docs/guides/installation.md:160`, and `.claude/SETTINGS.md:49`.

The rename breaks three more, and these the gate does catch - it is red on this branch right now.
`CLAUDE.md:328`, `docs/agents/claude-tooling.md:29` and `docs/agents/conventions.md:47` all name
`.claude/gh-issues.md`. It reports five faults rather than three, because `AGENTS.md` and
`GEMINI.md` are symlinks to `CLAUDE.md` and `git ls-files` lists all three: one edit clears three
faults, which is worth knowing before anyone goes looking for two more files to fix.

Deleting the vendored `gh-stack` breaks two more, and both of those the gate does catch, because
both name the directory rather than the skill: `docs/CONTRIBUTING.md:75` and
`docs/agents/claude-tooling.md:49`. Each sits inside a paragraph arguing why the copy was committed,
so neither is repaired by fixing a path - the paragraphs go. `docs/agents/conventions.md:40` names
"the committed `gh-stack` skill" in prose with no path, so that one is silent and belongs with the
four above.

References under `docs/plans/` are left alone. They are the historical record, and `docs()` already
excludes that directory for exactly this reason.

## Tasks

**Stage 1 - the per-repo conventions file**

- [ ] `git mv .claude/github.md .agents/github.md`, completing the rename already staged at the fallback path
- [ ] Narrow `scripts/docs-check.sh`'s `docs()` exclusion from `^\.agents/` to `^\.agents/skills/`, so the moved file is checked again
- [ ] Rewrite `.agents/github.md` for the current conventions: renamed layer labels (`docs`, `infra`), commit form, PR title form, issue title form, and the merge rule
- [ ] Repoint the three references to the old filename - `CLAUDE.md:328`, `docs/agents/claude-tooling.md:29`, `docs/agents/conventions.md:47` - which currently fail `npm run docs:check`

**Stage 2 - shed what is superseded**

- [ ] Delete `.claude/skills/repo-commit/`, `.claude/skills/repo-review-prs/`, `.claude/skills/repo-stack/`, and `.claude/commit-checks.md` (the orphaned cache)
- [ ] Delete `.claude/agents/code-reviewer.md`
- [ ] Move `.claude/agents/linus-reviewer.md` to `/home/izkreny/.agents/agents/`: create the directory, `git rm` the repo copy, and symlink `/home/izkreny/.claude/agents` at it so a harness reads it
- [ ] Delete the vendored `.claude/skills/gh-stack/`, and repair `docs/agents/claude-tooling.md`'s paragraph on why it was committed
- [ ] Repair every dangling reference the deletions leave, in the five files listed above
- [ ] Sweep the rest of `.claude/` for anything else superseded or orphaned: `settings.json`, `SETTINGS.md`, the six surviving skills, and the four surviving subagents

**Stage 3 - align the conventions**

- [ ] Rewrite `docs/CONTRIBUTING.md` and `docs/agents/conventions.md`: commit form `type: description (#{issue-number})`, no scope, lowercase, disclaimer in the body, no `Co-Authored-By`; PR title `{type}({scope}): {issue title}`, scope omitted when it repeats the type; issue titles lowercase and imperative with layer as a label; squash-only merges, with step checklists in the PR body and acceptance criteria ticked by the implementing agent
- [ ] Keep the trailer-history warning in that rewrite: a `#NN` in any commit older than the trailer change means a pull request in `AntePrkacin/personal-expense-tracker`, 87 of 588 inherited messages
- [ ] Record in `commitlint.config.js` or the plan that `scope-enum` is deliberately absent, with the CI guard as the reason
- [ ] Record that `scripts/docs-check.sh` keeps its two generic checks despite the copy at user scope, because CI cannot run a user-scope skill

**Stage 4 - memory checkout**

- [ ] Repoint the `github-stacked-branches-no-rebase` memory at `github-pr-flow`'s `workflows/stack.md`, replacing the deleted `repo-stack`
- [ ] Retire the `ai-disclaimer-when-posting-as-user` memory: `/home/izkreny/.agents/AGENTS.md` is canonical and both skills state where the disclaimer applies
- [ ] Give every remaining memory a verdict - migrate to `/home/izkreny/.agents/`, migrate into this repo, keep as a working preference, or delete as stale - and record the table here
- [ ] Update `MEMORY.md` to match

**Stage 5 - GitHub state, which lands outside the diff**

- [ ] `gh label edit documentation --name docs -R izkreny/spendifico` and the same for `infrastructure --name infra`
- [ ] `gh api -X PATCH repos/izkreny/spendifico -f squash_merge_commit_message=PR_BODY`
- [ ] `gh api -X PATCH repos/izkreny/spendifico -F allow_merge_commit=false -F allow_rebase_merge=false`
- [ ] Apply branch protection on `main` - verified absent, the endpoint currently returns 404
- [ ] Add `Bash(git push origin main)` and `Bash(git push origin HEAD:main)` to the `deny` list in `.claude/settings.json`, and record the decision in `.claude/SETTINGS.md`

**Stage 6 - skim and close**

- [ ] Skim the seven `CLAUDE.md` files for material that belongs at user scope, and move it before the deferred ticket rewrites them
- [ ] Amend issue #173 so its acceptance criteria describe this ticket rather than the documentation refactor
- [ ] Open the follow-up issue for the `CLAUDE.md` refactor, carrying the two decisions recorded above
- [ ] Verify: `npm run docs:check`, the dangling-reference sweep, and the repo-settings read-back

## Memory verdicts

Thirty-two memories existed when this ticket started. Two were acted on because the instruction list names them; every other row is a recommendation left for the owner, since deleting somebody's memory is not a mechanical call. Ordered alphabetically, so the table reads against a listing of the memory directory.

| Memory | What it says | Action | Why |
| --- | --- | --- | --- |
| `ai-disclaimer-when-posting-as-user` | A fixed disclaimer line opens anything posted as the user | **Deleted** | Instruction list step 3. `AGENTS.md` is canonical for the wording, and both skills state where it applies |
| `a-missing-key-never-means-unset` | An explicit `fields` list replaces the default set, so an absent key proves nothing | KB note | A trap to read once, not a rule to obey continuously. Nothing in `/home/izkreny/.agents/` covers it |
| `autonomous-execution-no-questions` | Ask nothing until the run is finished and the gates are green | `AGENTS.md`, trimmed | Half of it is already structural: `github-implement` spawns a pinned implementer subagent, so the mixed-model half is the skill's job now. Only "ask nothing until the run is finished" is left to record |
| `backend-endpoint-queue` | The agreed order of the remaining backend endpoint tickets | Delete | Stale twice over: the queue is exhausted, and its ordering was Jira's |
| `backend-secrets-live-in-env-local` | `backend/.env.local` holds operator secrets and is absent from every worktree | Migrate into the repo | A fact about this repository's layout. `docs/guides/database.md` already states half of it |
| `blueprint-mcp-trust-levels` | How far to trust each daisyUI Blueprint MCP stage | Keep | Repo-specific and still true; the false positives it names are this codebase's conventions |
| `central-template-seed-not-applied-by-deploy` | The seed guard skips any already-seeded central database, so template changes need a manual step | Migrate into the repo | A deployment trap with an ops consequence. Its own index line already says a `docs/TODO.md` entry was queued for it |
| `claude-md-rule-exclusions` | Two working rules deliberately left out of the repo's `CLAUDE.md` | Keep, then re-read | Records a decision nothing else does. Re-read once this ticket's convention rewrite has landed, in case it named one of them |
| `drafts-go-to-a-stable-directory` | Hand-edited drafts go to a stable directory, then `Ctrl+G`, `:CCDraft` | Delete, once the conflict is settled | `AGENTS.md` already has a `## Drafts` section. The memory names a different path for the same directory, so settle which is canonical **before** deleting, not after |
| `fly-mcp-declined-flyctl-skill` | The Fly MCP was evaluated and declined; drive Fly through `flyctl` | Keep | A decision about this project's deploy, and `.claude/skills/repo-fly` still exists |
| `force-push-deny-rule` | Force pushes are deny-listed, and `git -C` slips past the pattern | Keep, but **fix the contradiction** | It says to hand a force push over `via ! git push ...`, and `AGENTS.md` says never to prefix a command with `!` because it breaks the paste. One of them is wrong and it is not `AGENTS.md` |
| `git-hooks-do-not-run-in-worktrees` | Husky hooks fire only where `.husky/_` exists, so check rather than assume | Keep | Repo-specific, and the check it prescribes is still the right one |
| `github-stacked-branches-no-rebase` | Stacked branches are the norm; read every stacking instruction before acting | **Repointed** - trim next | Done for this ticket, but it is still long and now duplicates `github-pr-flow`'s `workflows/stack.md`. Worth reducing to a pointer the way the browser one was |
| `local-dev-runs-in-local-mode` | Local testing runs the backend in local mode, never against Turso Cloud | Migrate into the repo | A fact about `backend/.env` and this repo's boot guard, not about how to work |
| `no-data-migrations-no-real-users` | No real users exist, so seeded-data changes need no backfill | Migrate into the repo | A property of this project that changes what a migration ticket has to do |
| `no-personal-data-in-repo` | Commit author metadata still carries a real name and address | Keep | Deliberately the one half of the rule that root `CLAUDE.md` does not carry |
| `one-decision-at-a-time` | One question per turn in design discussions, never a batch | `AGENTS.md`, `## Working style` | Checked against every user-scope skill: only `socratic-tutor` says anything similar, and that is a different mode. Uncovered |
| `opensuse-tumbleweed-zypper-and-mise` | The machine is openSUSE Tumbleweed; `zypper` for system packages, mise for CLIs | Delete | `AGENTS.md` has `## Environment` and `## Package management`, and the `package-management` skill carries the backends. Fully covered |
| `parallel-sessions-jest-oom` | Concurrent jest runs exhaust this machine and no OOM killer exists | Migrate into the repo | Names this repo's two suites and their commands; `docs/guides/troubleshooting.md` is where that belongs |
| `read-comments-on-cleanup-tasks` | Read descriptions and comments before reporting a discrepancy | `AGENTS.md`, `## Working style` | `github-solo-dev-repo` owns the tracker but says nothing about reading a body before reporting a discrepancy. Two lines |
| `satisfy-the-rule-before-amending-it` | Exhaust the options that satisfy a rule before proposing to amend it | `AGENTS.md`, near "Concerns do not block" | Adjacent to an existing rule rather than covered by it: that one says raise and continue, this one says exhaust the compliant options first |
| `showcase-run-handover` | What PET-80 shipped, plus the live hazards of the showcase run | Delete | Its `PR #93` does not resolve in this repository - the number predates the migration. Anything live in it belongs in `docs/TODO.md` |
| `show-progress-during-long-tasks` | Emit visible progress during long multi-step work | `AGENTS.md`, `## Working style` | `github-implement` ticks boxes as work lands, which is the PR-shaped version. The general preference is uncovered |
| `slow-mcp-reads-go-to-a-subagent` | Run hang-prone MCP reads in a subagent when other work can proceed | `AGENTS.md` | `github-implement` spawns subagents for implementation, not for slow reads. Different reason, uncovered |
| `spendifico-migration-staged` | This repo is the migrated home; both halves done, old checkout deleted | Keep | `docs/migration/README.md` covers the migration itself; what this adds is what was deliberately **not** migrated |
| `stop-after-plan-pr` | After planning, stop at the draft PR and wait | Delete | Superseded outright: `github-pr-flow`'s `workflows/open.md` Step 6 **is** this stop, and `workflows/auto.md` documents waiving it as a deliberate trade |
| `trust-user-assertions-about-their-own-work` | Record a user's statement about their own work as stated | `AGENTS.md`, `## Working style` | A working preference that holds everywhere, uncovered by any skill |
| `turso-cli-cannot-address-user-databases` | The Turso CLI resolves names against a stale cache and cannot see backend-created databases | Keep | Specific to this project's database-per-user design |
| `use-chromium-for-browser-automation` | Drive headless Chromium over CDP rather than the extension | **Done** - now a pointer | The method moved to a `browser-verification` skill at user scope, plus a KB note for the incidents behind each gotcha; this repo kept only what is true of this app. The richest copy had been the one another repository could not reach |
| `use-ripgrep-not-grep` | Never `grep`; always `rg`, plus the `-r` flag trap | `AGENTS.md` | Uncovered anywhere at user scope, and it binds every search in every session - the clearest case in the table |
| `while-read-drops-the-last-line` | A file with no trailing newline silently loses its last entry to `while read` | KB note | A shell trap worth reading once. Same shape as the API one; the two could share a note |
| `worktree-shell-cwd-trap` | One `cd` to the other path of a worktree-isolated session bricks every later Bash call | `AGENTS.md`, `## Worktrees` | That section already exists and `github-implement` defers to it for `EnterWorktree`, but neither states the trap itself |

Counts after the re-triage: **3 done, 5 recommended for deletion, 5 into this repository, 9 into
`/home/izkreny/.agents/AGENTS.md`, 2 into the knowledge base, 8 to keep** - three of those with an
edit named in their row.

**The re-triage happened because acting on one row changed the question.** The first pass wrote
"migrate to user scope" fourteen times, when `AGENTS.md` was the only user-scope destination the
table knew about. There are three, and every row was re-read against what
`/home/izkreny/.agents/` actually holds today rather than what it held when the plan was written -
twelve skills now, not two.

Three rows moved from "migrate" to "delete" on that reading, because a skill already owns them:
`stop-after-plan-pr` is `github-pr-flow`'s `workflows/open.md` Step 6 verbatim,
`opensuse-tumbleweed-zypper-and-mise` is `## Environment` plus the `package-management` skill, and
`drafts-go-to-a-stable-directory` is `## Drafts`. One row shrank rather than moved:
`autonomous-execution-no-questions` asked for a mixed-model setup that `github-implement` now
enforces structurally by spawning a pinned implementer, so only its first clause is left to record.

**One row is a contradiction rather than a duplication, and it is the reason to re-read rather than
re-file.** `force-push-deny-rule` says to hand a force push to the owner as `! git push
--force-with-lease ...`; `AGENTS.md` says never to prefix a command with `!`, because the owner
pastes commands straight out and the `!` breaks the paste. Both were written deliberately, both are
live, and they cannot both be followed. Fixing that is a smaller job than any migration in this
table and a more urgent one.

**"Migrate to user scope" turned out to mean three different destinations, not one**, and the third
memory to be acted on is what showed it. `AGENTS.md` is read in full by every session in every
directory, so it can only carry what binds every session: the browser method would have grown it by
about 39% for something a fraction of sessions use. Two lines from it did earn a place - the
headless-over-extension preference, because it settles a question otherwise asked every time, and
"a check that has never been seen to fail is not evidence", which came out of that method's pre-fix
probe and generalises to any test, grep or gate. The rest became a **skill**, which costs a
description per session and loads its body only when a UI check is the task. The war stories behind
each gotcha went to a **KB note**, as reference to read rather than instructions to follow.

Weigh the remaining fourteen rows against those three homes rather than against `AGENTS.md` alone.
The test that decided this one: does it bind every session regardless of task, or only when a
particular kind of work comes up?

## What the CLAUDE.md skim found

Stage 6 skims the seven `CLAUDE.md` files and `docs/agents/` for material that is not about this
repository and should live at user scope before the deferred ticket rewrites them. It found one
candidate, and one non-candidate worth writing down so it is not proposed again.

**The browser-verification method belongs at user scope.** `docs/agents/claude-tooling.md` carries
the fullest statement anywhere of how to verify a UI change: headless Chromium over the DevTools
protocol rather than the extension, why computed style and the accessibility tree are the evidence
rather than a screenshot, why the pre-fix markup must be probed in the same run so a check is seen
to fail, and five gotchas. `/home/izkreny/.agents/AGENTS.md` says nothing about browsers at all, and
the personal memory that does duplicates this file with three of the five gotchas. Only part of it
is repo-specific - the daisyUI cascade traps, the Expensa theme pair, the CEDI glyph, Storybook's
story ids - and the method around those is not. The split is the work; the memory then becomes a
pointer rather than a third copy.

**Root `CLAUDE.md`'s working rules are deliberately repo-level and stay.** Show-the-diff before
committing, explain a state-changing command first, the visible todo list, the absence-sweep
dotfiles trap, "acceptance criteria are amendable" - all of these read as generic, and moving them
to user scope would reverse a decision already on record. They were written into the repository on
2026-08-04 precisely so they bind anyone working here rather than only this user, and the
`claude-md-rule-exclusions` memory exists to record which rules were held back from that commit as
personal preference. A skim that only asks "is this sentence generic" would move them; the question
is who they are meant to bind.

## Verification

`npm run docs:check` is the gate, and this ticket changes what it covers: narrowing the `.agents/`
exclusion brings a file into its scope for the first time, so the script is run before and after
that change and both results are reported.

Note what it cannot see, which is most of this ticket. It verifies that a backticked path resolves,
not that a sentence about a deleted skill was removed; four of the five dangling references it
cannot detect at all. The sweep is the real check:

`rg -in --hidden --no-ignore -e repo-commit -e repo-review-prs -e repo-stack -e code-reviewer -e gh-issues -e commit-checks -g '!node_modules' -g '!.git/**' -g '!docs/plans/**'`

`--hidden` alone still honours `.gitignore`, which has produced a false clean in this repository
before, and `.claude/` is a dotdirectory - the exact case that trap describes.

The GitHub-state tasks are read back rather than trusted:
`gh api repos/izkreny/spendifico --jq '{allow_merge_commit, allow_rebase_merge, squash_merge_commit_message}'`,
`gh api repos/izkreny/spendifico/branches/main/protection`, and `gh label list`.

No `npm run api:sync` is needed. Nothing here touches a request or response body.

## Considered and declined

**Adding `scope-enum` to `commitlint.config.js` anyway, as documentation of the allowed set.**
Declined: a lint rule that cannot fire is worse than a comment, because it reads as enforcement. The
allowed scopes are the layer labels, and `.agents/github.md` is where they are stated.

**Renaming the `PET-` plans in `docs/plans/`, now that a second convention change has landed.**
Declined for the reason GHI-171 gave and which has not changed: every one of those tickets kept its
key in its migrated issue title, so the names still resolve.
