---
name: repo-review-prs
description: This skill should be used when the user asks to "review all open PRs", "review unreviewed PRs", "review PR #N", or "check what PRs need review". Fetches open PRs, skips already-reviewed ones, and runs a full interactive review on each unreviewed PR, posting inline comments directly to GitHub.
argument-hint: "[PR number | all]"
disable-model-invocation: true
allowed-tools: Bash(gh:*), Read, Grep, Glob
---

> **Tools used:** `Bash(gh:*)`, `Read`, `Grep`, `Glob` - fetches PR list, diffs and issue context via the `gh` CLI, and posts inline comments to GitHub.

> **Output format:** All console output must be plain text - no markdown syntax (`**bold**`, `## headers`, `---` rules, or backtick fences). Use plain ASCII characters and box-drawing lines (`─`, `│`) for structure. Markdown is only acceptable inside the `body` strings sent to the GitHub API.

## When this skill triggers

1. If argument is a specific PR number → review that PR only
2. If argument is `all` or empty → fetch all open PRs, skip already-reviewed ones, review the rest sequentially
3. For each PR: follow the full review workflow below

---

## Step 0 - Preflight check

Run:

```bash
gh auth status
```

If the command is not found, stop and tell the user: "The `gh` CLI is not installed. See `docs/guides/installation.md` for install and login steps."

If it runs but exits non-zero, stop and tell the user: "`gh` is installed but not authenticated - run `gh auth login` and try again. `docs/guides/installation.md` lists the prompts and the answers you want."

Do not attempt the review without `gh`; every later step depends on it.

Issue context comes from the same `gh` you just checked, so there is no second thing to authenticate and nothing to degrade to when an MCP server is absent. This is the practical gain from retiring the Jira MCP: a headless run under `claude --print` or cron now gets the same issue context an interactive one does, where the Jira connector was authorized interactively and so was never available there. A branch that carries no issue key at all still yields no context - see Step 2 - but that is a property of the branch, not of the environment.

## Step 1 - Determine scope

If a PR number was provided as argument, skip to Step 3 with that number.

Otherwise fetch all open PRs:

```bash
gh pr list --json number,title,author,headRefName,reviewDecision
```

Filter to unreviewed PRs only - skip any where `reviewDecision` is not `null`. Present the list and ask for confirmation before proceeding:

```
Found N unreviewed PRs:
  #21 feat(frontend): add user profile card - <author>
  #20 feat(backend): add user lookup endpoint - <author>

Post reviews for all N PRs? (yes/no)
```

Stop cleanly if the user says no.

## Step 2 - For each PR, run the full review loop

For each PR number, run the interactive review loop:

1. **Load project context** - read root `CLAUDE.md`, the scoped `CLAUDE.md` under `backend/` or `frontend/` for every app the diff touches, and any `docs/agents/` guide the root pointer table names for the change at hand.
2. **Fetch the PR** - `gh pr view <n>` and `gh pr diff <n>`. If the diff is empty, skip the PR and note it in the summary as "skipped - empty diff".
3. **Enrich with the issue** - take the number from the branch name `{type}/GHI-{number}_{slug}`: drop everything up to and including the first `/`, take everything before the first `_`, then strip the `GHI-` prefix. On `feat/GHI-171_retire-jira-tooling` that yields `171`. Read it with `gh issue view <n> --json title,body,labels,parent,blockedBy` for acceptance-criteria context. A branch predating the convention carries `PET-<n>` instead, whose number is **not** the issue number - resolve those by title search (`gh issue list --state all --search "PET-<n>"`) rather than by assuming. Skip silently if neither yields an issue.
4. **Analyse** against the evaluation criteria below.
5. **De-duplicate** - read existing PR comments first; do not repeat a point already raised.
6. **Post inline comments** via `gh api`. Use `REQUEST_CHANGES` for blockers, `COMMENT` for suggestions.
7. If the `gh api` POST fails (rate limit, network error), note it in the summary as "failed - [reason]" and continue to the next PR.

### Evaluation criteria

Review each PR against, in priority order:

| Dimension         | What to check                                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Correctness**   | Logic bugs, unhandled edge cases, wrong error handling, race conditions                                                                 |
| **Contract**      | Backend is the source of truth for the HTTP contract; frontend must consume generated types, not redefine shapes (see `docs/agents/api-contract.md`) |
| **Security**      | Untyped external input reaching inward, missing validation at the boundary, leaked secrets, injection                                   |
| **Architecture**  | KISS / DRY / YAGNI, module boundaries, enums over repeated string literals                                                              |
| **Test coverage** | New endpoints/components without tests, missing edge-case tests                                                                         |
| **Conventions**   | Conventional Commits, branch naming (`{type}/GHI-{number}_{slug}`), commit trailer `(GHI-<n>)`, scope (`backend`/`frontend`)             |

## Step 3 - Summary

After all PRs are reviewed, print a plain-text summary table:

```
PR Reviews Complete
─────────────────────────────────────────────────────
#21  feat(frontend): user profile card   COMMENT   3 comments
#20  feat(backend): user lookup endpoint  COMMENT   2 comments
─────────────────────────────────────────────────────
Total: 2 PRs reviewed, 5 comments posted
```

---

## Running automatically (headless) - high-level

Beyond the interactive loop above, PR review can run **without a Claude Code window open**, on a schedule. The demo repo describes two options; the actual runner scripts are intentionally **not** committed here - they'd live under `.claude/skills/repo-review-prs/scripts/` (for example a `pr-watcher.sh` entry point, a `pr-watcher.Dockerfile`, a token-refresh helper, and a container MCP-settings file).

### Option A - Cron

A cron job periodically runs the watcher script, which detects new/unreviewed PRs and invokes Claude Code in headless (`--print`) mode to review them.

```
*/15 * * * * /path/to/repo/.claude/skills/repo-review-prs/scripts/pr-watcher.sh
```

⚠️ **Limitation:** an open editor extension can intercept headless `claude` calls, causing reviews to fail silently. Use the Docker option if you need it to run while your editor is open.

### Option B - Docker

Run the watcher in a container so it's isolated from the local editor. The container mounts the repo and `~/.claude`, receives a GitHub token and API key via env vars, and runs the same watcher script on a cron. This is the robust option for always-on review.

Both options ultimately drive the **same review loop** documented in Step 2 - the only difference is what triggers it and where it runs.
