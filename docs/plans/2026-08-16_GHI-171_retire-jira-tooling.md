# Retire the Jira tooling and adopt the GHI convention

Jira stopped being this project's tracker on 2026-08-13, when its 85 tickets were migrated into
this repository's issue tracker. The tooling that talked to it did not stop with it. Fifteen files
still describe a Jira that no longer exists, one skill still tries to reach it over an MCP server,
and every branch, plan and commit in this repository is still named after a Jira key.

This plan finishes the move. It is deliberately two things at once, because they cannot be
separated without leaving the repository contradicting itself for the length of a second ticket:
removing what pointed at Jira, and naming what replaced it.

## Why now

The user revoked every Jira API token on 2026-08-16, and the `JIRA_EMAIL` / `JIRA_API_TOKEN` /
`JIRA_BASE` block was deleted from `backend/.env.local` the same day. From that moment the
`repo-jira` skill could not have worked even if invoked, and `.claude/jira-config.md` documented
credentials for a site nobody can reach. Documentation that describes a capability the repository
does not have is worse than no documentation, because a reader cannot tell it apart from a feature
they have not found yet.

`repo-jira` itself was already backed up to `/home/izkreny/Backup/agents/skills/JIRA/repo-jira/`
and removed from the working tree before this plan was written, and ported to a personal skill at
`/home/izkreny/.agents/skills/github-solo-dev-repo/`. That removal is why
`docs/agents/claude-tooling.md:22` currently points at a directory that is not there.

## The naming decision

Branches, plans and commit trailers move from `PET-` to **`GHI-`**, for GitHub Issue:

| Thing | Was | Becomes |
| --- | --- | --- |
| Branch | `{type}/PET-{number}-{slug}` | `{type}/GHI-{number}_{slug}` |
| Plan file | `YYYY-MM-DD_PET-{number}_{slug}.md` | `YYYY-MM-DD_GHI-{number}_{slug}.md` |
| Commit trailer | `(PET-{number})` | `(GHI-{number})` |

Two things about that are decisions rather than shape.

**It is not `#{number}`, and that is not a style preference.** `docs/migration/README.md` records
that 93 of the 588 commit messages already contain a `#NN` reference, every one of them a pull
request number in `AntePrkacin/personal-expense-tracker`, and every one of them now resolving
against *this* tracker confidently and wrongly. That is unfixable without rewriting all 588 SHAs.
Adopting `(#171)` as a commit trailer would make `#NN` in a commit message permanently ambiguous
between "an old cross-repository pull request" and "a local issue". `GHI-171` cannot collide with
either. `Closes #171` in a **pull request body** is the deliberate exception and stays, because
GitHub itself reads it and it is what closes the issue on merge.

**The separator changes from `-` to `_` before the slug.** `feat/PET-12-add-transaction-modal` has
one separator doing two jobs, so extracting the key needs prior knowledge of the key's shape.
`feat/GHI-171_retire-jira-tooling` splits on the first `_` with one regex. This matters because
`repo-commit` and `repo-review-prs` both parse the key out of the branch name, and the old rule
breaks the first time a slug begins with a digit.

**Existing plans are not renamed.** All 50-odd `PET-` files in `docs/plans/` name issues that
really are titled `[PET-n]` in this tracker, so renaming them would detach every plan from the
issue it serves. Two conventions coexist, and `docs/agents/conventions.md` says so with the
cutover date, or somebody will eventually tidy them.

## The tracker taxonomy, already applied

The label set was cleaned up on GitHub while this plan was being written, so this section is a
record rather than a task. It is here because nothing else in the repository explains why the
tracker looks the way it does, and a taxonomy nobody can find the reasoning for gets re-litigated.

**41 labels became 11**, on four axes plus provenance:

| Axis | Question it answers | Labels | The default, never labelled |
| --- | --- | --- | --- |
| Layer | Which part of the system? | `backend` `frontend` `fullstack` `infrastructure` `documentation` | none, mandatory |
| Nature | Fixing, answering, or building? | `bug` | **task** - building a thing |
| Structure | Does it contain other work? | `epic` | **leaf** - no sub-issues |
| Priority | When? | `urgent` `someday` | **normal** - backlog order |
| Provenance | Where did it come from? | `jira-archive` `pr-archive` | not applied to new issues |

`spike` is a legitimate Nature value and is deliberately **not created**: this tracker has none, and
a label with no members is what GitHub's nine stock labels were. Create it with `gh label create
spike` the day the first one is opened.

Three rules did the work, and they are worth more than the table:

**Never label the default.** A label carried by the overwhelming majority says nothing and destroys
the meaning of its own absence. There is no `feature`, because 83 of 85 tickets were building
something. There is no middle priority, because `urgent` and `someday` are two labels giving three
states. There is no `task`, for the same reason: it is the third value of the Nature axis and would
land on nearly everything. The evidence was in the data - `priority:medium` was on **44 of 85**
tickets, the largest single group, applied because the field existed rather than because anyone
decided.

**Delete what a native relation already encodes, and encodes better.** Seven feature-area labels
(`settings`, `dashboard`, `transactions`, `insights`, `onboarding`, `categories`, `shell`) went
because the eight epics **are** the feature areas, as real parent relations on 68 of 85 tickets.
The labels were also less complete: `categories` was on 4 issues while its epic has 8 sub-issues, so
filtering by label missed half the work.

**Delete what the issue body already says.** `type:*`, `priority:medium`, `status:in-progress`,
`merged` and `not-merged` are all printed verbatim in the migrated body header (`**Type** Task ·
**Status** Done · **Priority** Medium`), so removing the labels lost nothing a reader can't see.
This test is why the deletions were safe and why `sprint-*` was **not** deleted the same way.

**Sprints became milestones rather than disappearing.** `sprint-1` and `sprint-2` failed the test
above: sprint membership appeared in no body, so the labels were the only record for 50 issues.
They are now two closed milestones carrying the real Jira date ranges recovered from the export -
Sprint 1 (2026-07-31 to 2026-08-05, 22 issues) and Sprint 2 (2026-08-06 to 2026-08-12, 28 issues) -
with membership verified against the old label counts before the labels were dropped.

**Two deletions were knowingly lossy**, on the product owner's decision after the cost was stated:
`mvp` (29 issues) and `phase-2` (4) recorded scope that appears in no body, and `design-review` (10)
recorded which tickets went through design review and was likewise derivable from nothing else.

**The layer axis has two renderings on purpose.** Titles keep the abbreviated `[BE]` / `[FE]` /
`[FULL]` / `[INFRA]` / `[DOCS]` prefix, because a title competes for space in a list of eighty;
labels are the full word, because a chip must say what it is with no context. They are one axis, and
the rule is that each prefix maps to exactly one label, not that the strings match.

## What this does not touch

The historical record stays exactly as it is: `docs/plans/**`, `docs/project-management/**`,
`docs/migration/**`, `docs/.migration/**`, and `docs/TODO.md:1371`.

`docs/showcase/data/tickets.json` **stays frozen** at its 2026-08-12 values, and
`scripts/showcase/charts.jsx:117` keeps the label "Jira tickets". Both are correct: the statistic
is a record of how this project was tracked while the work happened, and 84 Jira tickets is what it
was. Re-sourcing it from `gh issue list` would silently change the number's meaning to 170 issues,
of which 85 are archived pull requests. What does change is the two places that explain *why* the
file cannot be regenerated, which currently say "it comes from the Jira MCP" and will now say it is
a frozen historical record.

## Tasks

- [ ] Delete `.claude/jira-config.md` (backed up; cloud ID, issue-type IDs, priority IDs, board number, all dead)
- [ ] Remove the `mcp-atlassian` server block from `.mcp.json.example`
- [ ] Remove the `repo-jira` row from `docs/agents/claude-tooling.md` (currently dangling)
- [ ] Rewrite Jira enrichment in `.claude/skills/repo-review-prs/SKILL.md`: drop the five Atlassian MCP tools from `allowed-tools`, and replace the enrichment step and its degraded-mode paragraph with `gh issue view` against the number parsed from the branch
- [ ] Update `.claude/skills/repo-commit/SKILL.md`: branch format, ticket inference, and the `(PET-<n>)` trailer
- [ ] Update `.claude/skills/repo-stack/SKILL.md` branch format
- [ ] Update the branch and plan conventions in `CLAUDE.md`, `README.md`, `docs/CONTRIBUTING.md`, `docs/README.md` and `docs/agents/conventions.md`, keeping each fact in its one owning file
- [ ] Record the cutover date in `docs/agents/conventions.md` and state that existing `PET-` plans are not renamed
- [ ] Correct why `tickets.json` is not regenerated, in `CLAUDE.md` and `docs/showcase/README.md`
- [ ] Reword the four "Jira ticket" pointers in `frontend/src/app/CLAUDE.md` (lines 70, 996, 2723, 2817) to "issue", keeping the fact and fixing the pointer
- [ ] Rename `docs/TODO.md`'s "Post-Jira Cleanup Tasks" heading, whose three bullets are unrelated to Jira
- [ ] Record the tracker taxonomy in `.claude/gh-issues.md`: the five axes, their defaults, the prefix-to-label mapping, and that `spike` is deliberately uncreated
- [ ] Verify: no Jira reference outside the historical record, with a sweep that reaches dotfiles and ignored files
- [ ] Verify: `npm run docs:check`, and lint each app from its own directory

## Verification

The sweep has to use `--no-ignore`, not just `--hidden`. This was learned the expensive way earlier
in the same session: `rg --hidden` still honours `.gitignore`, so the first sweep for Jira
credentials reported clean while the only real token in the repository sat in `backend/.env.local`.
The form is:

`rg -in --hidden --no-ignore -e jira -e atlassian -g '!node_modules' -g '!.git/**' -g '!docs/.migration/**' -g '!docs/migration/**' -g '!docs/plans/**' -g '!docs/project-management/**' -g '!docs/showcase/**'`

No `npm run api:sync` is needed. Nothing here touches a request or response body.

## Considered and declined

**Rewriting the real names out of `docs/migration/scripts/`.** `render.py` and `build.py` carry
`"Iskren Nemet"` and `"Ante Prkacin"` as constants. They are left alone for two reasons. They are
functional: both are Jira display names matched against the exported data, so changing them would
make the scripts a false record of the run, which is the one property `docs/migration/README.md`
claims for them. And they add no exposure the repository does not already have, since
`scripts/showcase/lib.mjs:82` publishes both names on `main` today and all 588 commits carry
`Iskren <iskren.nemet@gmail.com>` as author metadata.

**Re-sourcing `tickets.json` from `gh`.** Covered above: it would change what the number means.

**Retiring the `repo-review-prs` skill along with `repo-jira`.** It does more than Jira enrichment,
already drives `gh` for everything else, and loses only one step. Rewriting that step is cheaper
than replacing the skill.

## A deviation to record

`CLAUDE.md` asks that a plan be committed **alone as the branch's first commit**, with a draft PR
opened on it. This plan is the third commit on `jira-to-github-migration`, behind the two that
record the migration itself. That was the product owner's choice, made explicitly: everything
Jira-related ships as one branch and one pull request rather than two. The plan is still committed
alone, so it reviews as its own diff.
