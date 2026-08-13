# How this repository got its history

This repository is the migrated home of a Decode Academy final project. Both halves of its past
were moved here on 2026-08-13: the git history from another GitHub repository, and the issue
tracker from a Jira project that no longer needs to be reachable to read the record.

This page exists because the *reasoning* behind that move is not recoverable from the result. The
scripts are in `scripts/`, the run logs in `run-logs/`, and the mapping in `issue-map.md`; what
follows is why any of it is shaped the way it is.

## Where it came from

| | |
| --- | --- |
| Code and history | `AntePrkacin/personal-expense-tracker` on GitHub |
| Tickets | `PET`, a team-managed Jira project on `decode.atlassian.net` |
| Scaffold | `DECODE-Agentic-Academy/decode-academy-demo`, this repo's template |

**This was a migration, not a transfer and not a fork.** A GitHub *transfer* moves the repository
object itself, so the original owner loses it; that was explicitly not wanted, because the source
repository is his to keep. A *fork* would have carried a permanent "forked from" relationship and,
like a transfer, copies no issues anyway. So the content was copied into an independent repository
and the tracker rebuilt from scratch.

The template's own first commit is preserved as the tag `template-base`. It is an unrelated root -
it shares no ancestor with the migrated history - which is why the two could not simply be joined.

## The git history

All 588 commits are here, verified byte-identical to the source: same head `b9fb197`, same tree
`6e845916`, and an empty `git diff` between the two. Authored dates are intact, running from
2026-07-27.

It landed without a force push, which matters because a force push would have been the obvious
approach and is the one that loses the audit trail:

1. push the source history to a **new** `main-history` ref (a new ref, so nothing is overwritten)
2. flip the repository's default branch to it
3. delete the now-orphaned `main`, whose only content was the template commit
4. rename `main-history` back to `main`

One trap worth recording: **the GitHub rename API left `default_branch` stale**, still pointing at
the old name, and it needed an explicit `PATCH` afterwards. A check that only looked at `git
ls-remote` would have missed it.

## The issue tracker

170 issues, 153 comments, 68 sub-issue links, 33 labels. Two sets, distinguishable by label:

| Label | What it is |
| --- | --- |
| `jira` | 85 issues migrated from Jira, titled `[PET-n] ...` |
| `pr-archive` | 85 pull requests from the source repo, archived as issues, titled `[PR-n] ...` |

Pull requests cannot be moved between repositories by any mechanism, so the 85 of them were
rebuilt as closed issues carrying their original body, discussion, and a link back to the original.
Every one of the 4 that was closed without merging is included too; they are labelled `not-merged`
and closed as `not_planned`.

### What the labels mean

Jira's own labels are preserved as-is, alongside four synthetic families: `type:*` (epic, task,
story, bug), `priority:*`, `status:in-progress` for the two issues that were mid-flight, and
`sprint-1` / `sprint-2`, which is the only surviving trace of the sprint structure since GitHub has
no equivalent field.

### Status mapping

GitHub has only open and closed, so Jira's three states collapse: **Done** becomes closed with
reason `completed`, **To Do** and **In Progress** both stay open, with the latter carrying a label
so the distinction survives. Seven issues are open; the rest are closed.

### Epics

GitHub has no epic. It does have **sub-issues**, a real parent/child relationship, so the 8 epics
carry their children as native sub-issues *and* as a checklist in the body. Worth knowing:
`addSubIssue` was measured to work on **closed** issues in all three combinations, which is why the
migration closes issues before linking them rather than the other way round. The GitHub web UI will
not offer a closed issue in its sub-issue picker, but that is a search filter, not an API limit.

## Things that will confuse a reader

### `#NN` in commit messages now resolves, and resolves wrongly

**93 of the 588 commit messages contain a `#NN` reference**, including the head commit, `Merge pull
request #93 from AntePrkacin/chore/PET-80-showcase-preps`. Those numbers were pull request numbers
**in the source repository**.

Before this migration they were dead text, because this repository had no issues. They now all
resolve against *this* tracker, where `#1`-`#85` are Jira tickets and `#86`-`#170` are archived pull
requests. So `#93` in that commit message links to `[PR-9]`, confidently and incorrectly.

This is not fixable. Aligning 85 pull request numbers (which ran to 96, with gaps) against 170
issues is impossible, and rewriting the commit messages would rewrite every SHA and destroy the
verified-identical property above. **Treat a `#NN` inside a commit message as referring to
`AntePrkacin/personal-expense-tracker`, never to this repository.**

Inside the migrated issues the same references were rewritten to point at the source repository
explicitly, so they are correct there - 358 such links. Only commit messages are affected.

### Timestamps

Jira served its timestamps at `+0200` and GitHub serves UTC. Both are normalised to UTC and
labelled in the migrated text, so the two halves of the archive are directly comparable. An earlier
draft dropped the offset and put a silent two-hour skew between them.

### Attribution

Every issue and comment here was created by the repository owner's account, because that is whose
token ran the migration. **Real authorship is in the text**, in a quoted header on each body and
comment. Where a mention would have pointed at a person, it is rendered as a markdown link to their
GitHub profile rather than an `@mention`: a mention inside link text does not fire GitHub's mention
parser, so the archive attributes people without notifying them 170 times. That was verified against
GitHub's renderer, not assumed - a bare `@handle` produces a `user-mention` span, a linked one does
not.

### What was deliberately left out

- **64 `vercel[bot]` deployment comments**, which were 65% of all pull request comments.
- **Jira's changelog**, 636 history entries. Final state is preserved; the audit trail is not.
- **Direct links to Jira tickets.** The keys stay as plain text, the URLs are gone: they need a
  Decode login to resolve, so they would have been dead ends. Figma links are kept.
- **Reactions**, 7 of them, and Jira worklogs, of which there were none.

## Re-running or extending

`scripts/` holds the six scripts that ran, with one later change: `apply.py` was
backported from a second migration where GitHub returned a 500 on a label POST and the
no-retry-on-5xx rule turned it into a dead stop. Label and assignee POSTs may now retry;
issue and comment creation still may not, because a retry there could duplicate silently.
That run saw no 5xx at all, so nothing about what is recorded in `run-logs/` changes -
but these are no longer byte-for-byte the bytes that executed. They need the Jira and GitHub
export, which is **not committed** - it is 11MB and contains personal email addresses. It lives
outside version control in `docs/.migration/`, which `docs/.gitignore` keeps out of the repository
by its standing rule that every hidden path under `docs/` is local-only.

| Script | Role |
| --- | --- |
| `adf2md.py` | Atlassian Document Format to GitHub Flavored Markdown |
| `render.py` | the text pipeline: unwiki, Jira links, cross-references, mentions |
| `build.py` | assembles issue payloads |
| `apply.py` | the runner: six phases, resumable |
| `assign.py` | a separate assignment pass |
| `dryrun.py` | renders every issue to disk for review without writing anything |

Two design rules are load-bearing if anyone touches these:

**No target issue number is ever predicted.** `build(None)` produces bodies that reference nothing
in this repository, safe to create before any number exists; the real numbers come back from the API
and `build(real_map)` re-renders the 78 bodies that need them, which the runner then PATCHes. An
earlier version computed the numbers in advance, which was correct only as long as nothing else was
ever filed in the tracker.

**Pacing is set by the hourly limit, not the per-minute one.** GitHub allows roughly 80
content-generating requests per minute but only ~500 per hour, and community reports show blocks
well below that with no `Retry-After` header. At 7.2s per mutation the full run took 78 minutes and
was never throttled. A faster pace clears the per-minute limit and breaches the hourly one.

The runner is resumable: every step is recorded before the next begins, a crashed create is adopted
by matching issue titles on the next run, and re-running after success is a no-op. It refuses to
start against a non-empty tracker unless it has state proving it was the one that filled it.

## Assignees

162 of the 170 issues carry an assignee, taken from the Jira assignee where one was set and falling
back to the reporter, or for an archived pull request to its author. The 8 without one are the
epics, which were unassigned in Jira in all 8 cases - deliberately, since an epic is a container and
its child tasks carry the owner.

This ran as a **separate pass** (`assign.py`) rather than as part of the main run, because the
runner sets assignees only at create time and every issue already existed by then. Assignment is the
one part of the migration that does notify people, which is why it was a deliberate opt-in rather
than a default.

## Review

The scripts and the plan were reviewed by two independent passes before anything was written, which
found four blockers - a markdown bug that turned a paragraph into a heading on all 8 epics, four
`#NN` references that would have resolved against the wrong repository, a `POST` retry that could
double-create on a 502, and the rate limit above. All four were fixed and verified before the run.
The final state was then checked against the API independently of the script's own reporting.
