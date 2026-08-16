# GitHub issue conventions for this repository

Read by the `github-solo-dev-repo` skill, whose `validate.md` treats this file as winning on every
conflict with its own defaults. The label set here is the tracker's applied state, produced by the
cleanup recorded in `docs/plans/2026-08-16_GHI-171_retire-jira-tooling.md`.

**The title and layer rules bind new issues only.** The 170 migrated issues are titled `[PET-n] …`
and `[PR-n] …` rather than `[LAYER] …`, and 97 of them carry no layer label at all — every archived
pull request, plus the eight epics and a handful of others. That is the migration's shape, not a
backlog of mislabelled work, and `validate.md` should not be run against them expecting a pass.

Repository: `izkreny/spendifico`. Personal account, so **issue types do not exist** - that field is
organization-only and `gh api orgs/izkreny/issue-types` returns 404. Kind is expressed by label.

## Labels

Each label answers one question, and the axes are independent. Every axis but Layer has a default,
and the default is expressed by **carrying no label at all**.

| Axis | Question it answers | Labels | The default, never labelled |
| --- | --- | --- | --- |
| Layer | Which part of the system? | `backend` `frontend` `fullstack` `infrastructure` `documentation` | none: required on **new** issues |
| Nature | Fixing, answering, or building? | `bug` | **task** - building a thing |
| Structure | Does it contain other work? | `epic` | **leaf** - no sub-issues |
| Priority | When? | `urgent` `someday` | **normal** - backlog order |
| Provenance | Where did it come from? | `jira-archive` `pr-archive` | not applied to new issues |

**Never label the default.** There is no `feature`, because 83 of the 85 migrated tickets were
building something and the label would land on nearly all of them. There is no middle priority,
because `urgent` and `someday` are two labels giving three states. There is no `task`, for the same
reason. A label carried by the majority says nothing and destroys the meaning of its own absence.

**`spike` is a legitimate Nature value and is deliberately not created.** This tracker has none.
Run `gh label create spike` the day the first one is opened, and not before: a label with no members
is what GitHub's nine stock labels were, and all nine were deleted.

**Size is not used here.** The skill offers `size/1` … `size/8`; this repository does not use them.

**The two provenance labels are historical.** `jira-archive` marks the 85 migrated Jira tickets
(`#1`-`#85`) and `pr-archive` the 85 archived pull requests (`#86`-`#170`). Never apply either to a
new issue.

## Titles

`[LAYER] Imperative action`, under ~80 characters. The prefix is abbreviated and the label is not,
deliberately: a title competes for space in a list, a chip has to say what it is with no context.
Each prefix maps to exactly one label. **Do not check them for string equality.**

| Prefix | Label |
| --- | --- |
| `[BE]` | `backend` |
| `[FE]` | `frontend` |
| `[FULL]` | `fullstack` |
| `[INFRA]` | `infrastructure` |
| `[DOCS]` | `documentation` |

## Milestones

Used for **what ships together**, not for time boxes. Two exist, both closed, both retroactive
records of the Jira sprints recovered from the migration export: `Sprint 1` (2026-07-31 to
2026-08-05, 22 issues) and `Sprint 2` (2026-08-06 to 2026-08-12, 28 issues).

There is no `gh milestone` command. Assigning and filtering use `--milestone`; creating, closing and
listing go through `gh api repos/izkreny/spendifico/milestones`.

## Projects

**Not used.** They need a `project` token scope the default `gh auth login` does not grant, and a
board is more than a solo backlog needs. Do not reach for one without being asked.

## Branches, plans and commits

Owned by `docs/CONTRIBUTING.md` (branch and trailer) and `docs/agents/conventions.md` (plan
filename). Copied here because the skill that reads this file runs in repositories that have
neither, so a pointer would not be executable.

<!-- sync: docs/CONTRIBUTING.md -->

| Thing | Form | Example |
| --- | --- | --- |
| Branch | `{type}/GHI-{number}_{slug}` | `feat/GHI-42_login-form` |
| Plan file | `docs/plans/YYYY-MM-DD_GHI-{number}_{slug}.md` | `2026-08-16_GHI-171_retire-jira-tooling.md` |
| Commit trailer | `(GHI-{number})` | `fix(api): reject a blank email (GHI-42)` |
| PR body | must contain `Closes #{number}` | `Closes #42` |
| Assignee | always `@me`, on issues and pull requests alike | `--assignee @me` |

**`GHI-` rather than `#{number}` is load-bearing here specifically.** Many of this repository's 588
commit messages contain a `#NN` that means a pull request in
`AntePrkacin/personal-expense-tracker`, and every one of them now resolves against this tracker
instead - wrongly, and unfixably without rewriting all 588 SHAs; `docs/migration/README.md` has the
count. A prefixed key cannot collide with them. `Closes #171` in a pull request **body** is the
exception and is correct, because GitHub reads that one itself.

Branches and plans from before 2026-08-16 use `PET-{number}`, the Jira key. They are **not renamed**:
every one of those tickets kept its key in its migrated issue title, so `PET-13` still finds the
issue it names. The two forms coexist and the cutover date tells them apart.
