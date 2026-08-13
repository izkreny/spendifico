# Setting up an automated Claude PR reviewer on your own repository

This repo uses [Claude Code GitHub Actions](https://github.com/anthropics/claude-code-action)
to review every pull request automatically. This guide walks you through setting up the
same thing on **your own project repository**, and lists the four pitfalls we hit so you
do not have to rediscover them. Apart from #2, which fails CI loudly, every one of them
produced a _green_ CI job and no review comment, so read them before you start
debugging in circles.

## What you get

Two workflows, both living in `.github/workflows/`:

| Workflow                 | Trigger                                            | What it does                                                                    |
| ------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------- |
| `claude-code-review.yml` | Every PR (opened, updated, reopened)               | Claude reviews the PR in the Linus Torvalds persona and posts a verdict comment |
| `claude.yml`             | Anyone writes `@claude ...` in an issue/PR comment | Claude answers the question or performs the requested task on that issue/PR     |

You can copy both files from this repository as a starting point. For a working
end-to-end example, see PR #7: a deliberately buggy endpoint and the review it earned.

### How the review workflow is wired

`claude-code-action` starts a real Claude Code session on the runner, with a checkout
of the repo. Three inputs in `claude-code-review.yml` define its behaviour:

- **`prompt`** is the user message for that session. Ours tells Claude to adopt the
  reviewer persona from `.claude/agents/linus-reviewer.md` (one file, reused by the
  local agent and by CI), gather context with `gh pr view` / `gh pr diff`, and publish
  a single consolidated review.
- **`track_progress: true`** makes the action create a tracking comment on the PR and
  exposes the `mcp__github_comment__update_claude_comment` tool. That comment is where
  the review lands. Pitfall #4 explains why we post through this tool instead of
  `gh pr comment`.
- **`claude_args: '--allowed-tools "..."'`** is the tool allowlist for the session.
  Everything not listed is denied, and in CI there is no human to approve anything.

To change the reviewer's personality, edit `.claude/agents/linus-reviewer.md` or point
the prompt at a different persona file. You can also append instructions to the
session's system prompt with `claude_args: '--append-system-prompt "..."'` (prefer
this over `--system-prompt`, which replaces the built-in GitHub instructions
entirely). Remember pitfall #1: workflow changes only take effect after they land on
the default branch.

## Prerequisites

- Admin access to your GitHub repository (you need to install a GitHub App and add a secret).
- A Claude subscription (Pro/Max) **or** an Anthropic API key. The workflows in this repo
  use a subscription OAuth token; if you use an API key instead, see the
  [official docs](https://code.claude.com/docs/en/github-actions) for the
  `anthropic_api_key` variant.

## Recommended setup: `/install-github-app`

The fastest path is to let Claude Code do the wiring for you:

1. Open a terminal in a clone of **your** repository and start `claude`.
2. Run `/install-github-app` and follow the prompts. This will:
   - install the [Claude GitHub App](https://github.com/apps/claude) on your repository,
   - create the `CLAUDE_CODE_OAUTH_TOKEN` repository secret for you,
   - open a PR against your repo adding the two workflow files.
3. Review and merge that PR (but first read "Pitfalls" below).

## Manual setup (if the installer is not an option)

1. Install the [Claude GitHub App](https://github.com/apps/claude) and grant it access
   to your repository.
2. Generate a token: run `claude setup-token` in your terminal and copy the resulting
   OAuth token.
3. In your repository: **Settings → Secrets and variables → Actions → New repository
   secret**, name it `CLAUDE_CODE_OAUTH_TOKEN`, paste the token.
4. Copy `.github/workflows/claude-code-review.yml` and `.github/workflows/claude.yml`
   from this repository into yours, commit them on a branch, and open a PR.

## Pitfalls (all four hit in this repo, see PRs #6 to #10)

### 1. The first PR will NOT get a review, and that is expected

`claude-code-action` refuses to run unless the workflow file on the PR branch is
**identical to the version on the default branch**. This is a security guard: without it,
anyone could modify the workflow inside a PR and make the action run arbitrary code or
leak secrets.

Consequence: on the very PR that introduces the workflow, the job ends green but the
action is skipped with this warning in the log:

> Workflow validation failed. The workflow file must exist and have identical content to
> the version on the repository's default branch. If you're seeing this on a PR when you
> first add a code review workflow file to your repository, this is normal and you
> should ignore this error.

Do not debug this. Merge the PR, then open any small follow-up PR: that one gets the
automatic review. The same applies later whenever a PR _changes_ the workflow file: the
old version from the default branch is what runs.

### 2. The installer's commit messages fail commitlint

If your repo enforces Conventional Commits in CI (this one does), note that
`/install-github-app` creates commits like `"Claude Code Review workflow"`, with no
type prefix. The `conventions` job will fail with `type-empty` / `subject-empty`.

Fix: reword the commits on the PR branch before merging, e.g.:

```bash
git fetch origin <installer-branch>
git checkout <installer-branch>
git reset --soft origin/main
git commit -m "ci: add Claude PR assistant and code review workflows"
git push --force-with-lease origin <installer-branch>
```

### 3. A green job does not mean the review was posted

The action does not fail the job when Claude finishes without posting anything. The
installer's default review workflow gave the job a read-only token
(`pull-requests: read`) and allowed no write-capable tools, so on our first real test
(PR #7) Claude wrote a complete review and was then denied 22 times trying to publish
it. The job still ended green.

Two things must both be true for the review to land:

- the job needs `pull-requests: write` (and `issues: write` if posting goes through
  the issues API, which PR comments do),
- `claude_args: '--allowed-tools "..."'` must explicitly allow whatever tool posts
  the review.

When a run looks fine but no comment appears, download nothing and guess nothing:
open the run log and look for `permission_denials_count` in the final result block.
Any value above zero means Claude tried to do something the session refused.

### 4. Committed `.claude/settings.json` "ask" rules also apply in CI

This is the subtle one. The action restores `.claude/` from your default branch into
the runner's checkout, so a committed `settings.json` governs the CI session too. Rule
precedence is `deny` > `ask` > `allow`, and `--allowed-tools` only contributes `allow`
entries. Any command listed under `ask` (this repo lists `Bash(gh pr comment *)` there,
so local sessions confirm before commenting on PRs) can therefore never run in
headless CI: there is nobody to answer the prompt, and the ask silently becomes a
denial. No matter how you shape the `gh pr comment` command, it will be refused.

The fix that keeps the local confirmation behaviour intact: do not post via `gh` at
all. Set `track_progress: true` on the action and have the prompt publish the review
through the `mcp__github_comment__update_claude_comment` tool. MCP tools are not
matched by `Bash(...)` rules, so the committed settings stay untouched.

## Verifying it works

1. Merge the setup PR into your default branch.
2. Open a test PR, ideally with something actually wrong in it, so the reviewer has
   material to work with (see PR #7 for our version of this).
3. The **Claude Code Review** workflow posts a `claude[bot]` tracking comment on the
   PR and fills it with the review; the whole run takes a couple of minutes.
4. Test the second workflow by commenting `@claude what does this PR change?` on any PR
   or issue.
5. If the run is green but no review appears, work through pitfalls #3 and #4.

## Customising the reviewer

The persona lives in `.claude/agents/linus-reviewer.md` and the wiring in
`claude-code-review.yml`; see "How the review workflow is wired" above. For the other
action inputs (path filters, author filters, API-key auth, extra `claude_args`), see
the [claude-code-action usage docs](https://github.com/anthropics/claude-code-action/blob/main/docs/usage.md).
Keep in mind pitfall #1: any change to the workflow file only takes effect after it
lands on the default branch, so iterate via small merged PRs, not by re-running the
job on the branch that changes it.
