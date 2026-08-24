# GitHub conventions for this repository

Read by both personal skills - `github-solo-dev-repo` for the issue tracker, `github-pr-flow` for
branches, pull requests, review and merge. Each treats this file as **winning on every conflict**
with its own defaults, so anything stated here is this repository's answer and not a suggestion.
The label set below is the tracker's applied state, produced by the cleanup recorded in
`docs/plans/2026-08-16_GHI-171_retire-jira-tooling.md`.

**The title and layer rules bind new issues only.** The 170 migrated issues are titled `[PET-n] ...`
and `[PR-n] ...`, and 97 of them carry no layer label at all - every archived pull request, plus the
eight epics and a handful of others. That is the migration's shape, not a backlog of mislabelled
work, and the skills' validation should not be run against them expecting a pass.

Repository: `izkreny/spendifico`. Personal account, so **issue types do not exist** - that field is
organization-only and `gh api orgs/izkreny/issue-types` returns 404. Kind is expressed by label.

## Labels

Each label answers one question, and the axes are independent. Every axis but Layer has a default,
and the default is expressed by **carrying no label at all**.

| Axis | Question it answers | Labels | The default, never labelled |
| --- | --- | --- | --- |
| Layer | Which part of the system? | `backend` `frontend` `fullstack` `infra` `docs` | none: required on **new** issues, except epics |
| Nature | Fixing, answering, or building? | `bug` | **task** - building a thing |
| Structure | Does it contain other work? | `epic` | **leaf** - no sub-issues |
| Priority | When? | `urgent` `someday` | **normal** - backlog order |
| Provenance | Where did it come from? | `jira-archive` `pr-archive` | not applied to new issues |

**Never label the default.** There is no `feature`, because 83 of the 85 migrated tickets were
building something and the label would land on nearly all of them. There is no middle priority,
because `urgent` and `someday` are two labels giving three states. There is no `task`, for the same
reason. A label carried by the majority says nothing and destroys the meaning of its own absence.

**An epic carries no layer label.** It contains work from several layers by definition, so a layer
on it would be either wrong or arbitrary. This is the one exception to Layer being mandatory.

**`spike` is a legitimate Nature value and is deliberately not created.** This tracker has none.
Run `gh label create spike` the day the first one is opened, and not before: a label with no members
is what GitHub's nine stock labels were, and all nine were deleted.

**Size is not used here.** The skills offer `size/1` ... `size/8`; this repository does not use them.

**The two provenance labels are historical.** `jira-archive` marks the 85 migrated Jira tickets
(`#1`-`#85`) and `pr-archive` the 85 archived pull requests (`#86`-`#170`). Never apply either to a
new issue.

## Issue titles

**All lowercase, imperative, no prefix**, under ~80 characters. The layer is carried by the label
and nothing else, so a title never repeats it.

`extract the agent-facing context to user scope`, not `[DOCS] Extract the agent-facing context`.

The bracketed `[BE]` / `[FE]` / `[FULL]` / `[INFRA]` / `[DOCS]` prefixes are **retired**. They
duplicated the label in a place that cannot be filtered on, and the abbreviation had to be mapped
back to a label name that never matched it as a string.

## Milestones

Used for **what ships together**, not for time boxes. Two exist, both closed, both retroactive
records of the Jira sprints recovered from the migration export: `Sprint 1` (2026-07-31 to
2026-08-05, 22 issues) and `Sprint 2` (2026-08-06 to 2026-08-12, 28 issues).

There is no `gh milestone` command. Assigning and filtering use `--milestone`; creating, closing and
listing go through `gh api repos/izkreny/spendifico/milestones`.

## Projects

**Not used.** They need a `project` token scope the default `gh auth login` does not grant, and a
board is more than a solo backlog needs. Do not reach for one without being asked.

## Checks before pushing

`github-pr-flow` is told never to invent a repository's check commands and to read them from this
file. These are the commands; `docs/guides/commands.md` owns them and is where a fuller list lives.

| When | Run, from | Command |
| --- | --- | --- |
| Any change at all | repo root | `npm run docs:check` |
| A request or response body changed | repo root | `npm run api:sync`, then commit both generated artifacts |
| `backend/` touched | `backend/` | `npm run lint`, `npm run build`, `npm test`, `npm run test:e2e` |
| `frontend/` touched | `frontend/` | `npm run lint`, `npm run build`, `npm test` |

Three things about that table are traps rather than detail.

**`npm run build` is the typecheck.** Neither app has a standalone `typecheck` script, so skipping
the build means the branch was never type-checked.

**App commands run from inside the app's own directory.** ESLint resolves its config and plugins
from that app's `node_modules`, so linting one app from the other's working directory fails in a
way that reads as a broken config.

**Nothing runs the app suites for you.** `.husky/pre-commit` runs `lint-staged` only - per-app
ESLint and Prettier over staged files - and prints a reminder about the backend tests rather than
running them. `npm run docs:check` has no hook at all. CI catches all of it on the pull request,
which is a round trip rather than a safety net.

**Hooks fire only where `.husky/_` exists, and the config value cannot tell you whether it does.**
The root `npm install` sets `core.hooksPath` to `.husky/_`, and that setting reads back identically
whether or not the directory is there - so `git config core.hooksPath` confirms the configuration
and never the hooks. `ls .husky/_` is the check that distinguishes them. A sibling worktree is the
case where the two disagree: it inherits the config and does not necessarily carry the directory, so
a commit made there can skip `lint-staged` and `commitlint` entirely while the check you would think
to run reports that hooks are installed.

## Branches, commits, pull requests and merges

<!-- sync: docs/CONTRIBUTING.md -->

| Thing | Form | Example |
| --- | --- | --- |
| Branch | `{type}/GHI-{number}_{slug}` | `feat/GHI-42_login-form` |
| Plan file | `docs/plans/YYYY-MM-DD_GHI-{number}_{slug}.md` | `2026-08-16_GHI-173_agent-context.md` |
| Commit header | `{type}: {description} (#{number})` | `fix: reject a blank email (#42)` |
| PR title | `{type}({scope}): {issue title}` | `fix(backend): reject a blank email` |
| PR body | must contain `Closes #{number}` | `Closes #42` |
| Assignee | always `@me`, on issues and pull requests alike | `--assignee @me` |
| Merge | squash only | - |

**Commit headers carry no scope and are lowercase.** The scope belongs on the pull request title,
where it becomes the squash subject on `main`. A branch commit that carried one too would put it
in the history twice.

**The PR title's scope is the issue's layer label, and is omitted when it repeats the type.** A
`docs` issue opening a `docs:` pull request is `docs: ...`, never `docs(docs): ...`. GitHub builds
the squash subject from this title plus `(#{pr-number})`, so it is the line that lands on `main`.

**Every commit body carries the AI disclaimer, and no `Co-Authored-By` trailer.** The disclaimer
replaces the trailer rather than joining it.

**`GHI-` and `#` are not alternatives; each is the only thing that works where it appears.** A
branch name and a plan filename cannot use `#` - it is hostile in a shell and in a path, and it
autolinks nowhere - so `GHI-42` supplies the label that a bare `42` in `git branch -a` would lack.
A commit header and a pull request body can: `#42` both reads as an issue number and resolves to
one, and `Closes #42` is what GitHub itself acts on at merge.

**A `#NN` in an inherited commit message means a pull request in another repository.** Those
predate this convention, resolve against this tracker confidently and wrongly, and cannot be fixed
without rewriting every SHA. `docs/migration/README.md` has the count and the detail; read it there
rather than restating it, because the number grows as legitimate local references land.

Branches and plans from before 2026-08-16 use `PET-{number}`, the Jira key. They are **not renamed**:
every one of those tickets kept its key in its migrated issue title, so `PET-13` still finds the
issue it names. The two forms coexist and the cutover date tells them apart.
