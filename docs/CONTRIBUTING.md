# Contributing

How work ships in this repo: what to name a branch, what a commit message has to look like, what
the two git hooks do to your commit, and what CI checks. The rules here are the ones a human
follows; the reasoning an agent needs is in `docs/agents/conventions.md`.

Before you make this repo public, check that no real secret was ever committed. `.env` files are
gitignored precisely so that stays safe, and no real name or personal address belongs in the
repo either: it is a public-facing teaching project, so anything committed is effectively
published.

## Branching and committing

**HARD RULE: never commit or push directly to `main`.** Branch first. `settings.json`
puts `git push` behind a confirmation prompt to give this rule a real barrier rather
than just an instruction.

Branch format: `{type}/GHI-{number}_{slug}`, for example
`feat/GHI-160_user-profile-card`, where the number is the GitHub issue the branch serves.
Commit headers name the same issue as `(#160)`, and carry no scope:
`fix: reject a blank email (#160)`, all lowercase.

**The scope lives on the pull request title, not on the branch commits.** A PR is titled
`{type}({scope}): {issue title}`, all lowercase, where the scope is the issue's layer
label and is dropped when it would repeat the type - `docs: ...`, never `docs(docs): ...`.
GitHub builds the squash subject on `main` from that title plus `(#{pr-number})`, so it is
the line that survives the merge. Putting a scope on the branch commits too would record it
twice.

**Merges are squash-only.** The branch's commits are working history; the squash subject and
the PR body are the record. Step checklists live in the PR body and are ticked by whoever
runs the gate; an issue's acceptance criteria are ticked by the implementer as each one
verifiably lands.

**Commit bodies carry the AI disclaimer and no `Co-Authored-By` trailer.** The disclaimer
replaces the trailer rather than joining it.

**`GHI-` and `#` each go where the other cannot.** A branch name and a plan filename cannot
use `#`: it is hostile in a shell and in a path, and it links to nothing there, so `GHI-160`
supplies the label a bare `160` would lack in `git branch -a`. A commit header and a PR body
can use it, and should: `#160` resolves to the issue, and `Closes #160` in a **pull request
body** is what GitHub itself acts on at merge.

**A `#NN` in an inherited commit message means something else entirely.** Those predate this
convention and refer to pull requests in the repository this one was migrated from, so they
resolve here confidently and wrongly, and cannot be fixed without rewriting every SHA.
`docs/migration/README.md` has the count and the detail.

Branches cut before 2026-08-16 use the older `{type}/PET-{number}-{slug}` form, naming the Jira
ticket that the issue was migrated from. Those are left as they are; the two forms coexist.

**Verify the branch in the same breath as the commit.** The branch checked out earlier in
a session is a snapshot, not a guarantee: on 2026-08-04 a commit meant for
`feat/PET-45-profile-read` landed on local `main` because HEAD had moved during a
plan-mode session, straight through the hard rule above. Read `git branch --show-current`
immediately before `git commit`, and read the `[branch sha]` line the commit prints back.
Recovery, if it happens anyway, is `git branch -f <feature> <sha>` and then
`git reset --hard origin/main` with main checked out.

**The first push of a branch is `git push -u origin <branch>`.** A bare
`git push origin <branch>` leaves the local branch with no upstream, which costs
`git status`, `git pull` and every later bare `git push` their reference point. Repair an
already-pushed branch with `git branch --set-upstream-to=origin/<branch>`.

**Stacked branches are restacked with `gh stack`, never with a raw `git rebase`. Ordinary
branches are nobody's business but yours.** This repo uses GitHub's stacked branches
feature routinely: a feature branch is often cut from an unmerged parent branch rather
than from `main` (`feat/PET-14-link-verification-and-sessions` on top of
`feat/PET-50-api-openapi-typegen`, for example), so the parent's PR merges first and
GitHub retargets the child. Open the PR against the parent, and cut new work that depends
on an unmerged branch from that branch's tip rather than from `main`.

**Retargeting is not the whole job, because this repo squash-merges.** A squash replaces
the parent's commits with one new commit on `main`, so the parent's originals stop being
ancestors of `main` while the child still carries them. GitHub moves the child's base and
nothing else, which leaves the child's diff showing the parent's changes as well as its
own. The fix is `gh stack sync`, or `gh stack rebase` when a cascade is needed - run it
after a parent lands, not before.

**That is why the rule is "not by hand" rather than "never".** A raw `git rebase` rewrites
history the stack tooling is tracking and desynchronises it; `gh stack` rewrites the same
commits and keeps its own record straight. Squash-only merges make a restack routine
rather than exceptional, so reach for the tool rather than avoiding the operation.

**That restriction is about stacks only**, and it is the reason to check before assuming:
`gh pr view <branch> --json baseRefName` names the PR's base, and a base other than `main`
means a stacked branch. A plain branch off `main` is normal git - rebase it, squash it,
force-push it as you like.

The tooling for it is the `gh stack` extension (`github/gh-stack`), installed per
developer with `gh extension install github/gh-stack` - like the root `npm install`, a
fresh clone does not carry it. Note the layers of truth. On GitHub a stack is a
first-class object: a stacked PR's REST payload carries a `stack` field with the stack
number, size and the PR's position (`gh api "repos/{owner}/{repo}/pulls/<n>" --jq
.stack`; an empty result means that PR is stacked only through its base branch, which
GitHub still retargets on merge). The extension's local tracking is a separate, optional
layer, so `gh stack view` can say a branch "is not part of a stack" that very much is in
one on GitHub; adopt an existing GitHub stack with `gh stack checkout <stack-number>`,
and reserve `gh stack init` for branches not yet stacked anywhere. Finally, the worktree
trap: `sync` and `rebase` rewrite every branch in the stack, git refuses to move a
branch checked out in another worktree, and this repo routinely parks stack branches in
`.claude/worktrees/*` - detach the other checkouts before a cascade rebase. The
official `gh-stack` skill, installed at user scope rather than committed here, is the
CLI manual; the `github-pr-flow` skill covers the wiring above.

**Use the fewest commits that make sense, not one per task.** A plan's checklist is a list
of tasks, not a list of commits: implementing six planned steps is free to land as one
commit. Split only when a genuine reason exists - unrelated concerns in one working tree,
or both apps changed for different reasons. The plan doc itself is the one standing
exception, committed alone as the
branch's first commit so the draft PR can exist before any code does.

## What the hooks do

**Conventional Commits are enforced** by a `commit-msg` hook running commitlint. The
allowed types are restricted (see `commitlint.config.js`): `build`, `chore`, `ci`,
`docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`. Anything else is
rejected, including a bare description with no type.

**pre-commit** runs `lint-staged` (`.lintstagedrc.js`): per-app `eslint --fix`, then
Prettier. ESLint is invoked from each app's own directory so its config and plugins
resolve correctly, which is why you should not try to lint one app from the other's cwd.

That indirection is via `bash -c "cd <app> && npx eslint ..."`, so **every staged path is
single-quoted through a `shellQuote` helper**. Not defensive: a Next.js route group folder
is literally named `(app)`, and bash reads an unquoted `(` as a subshell. PET-19 hit this
the first time it tried to commit `frontend/src/app/(app)/layout.tsx`, and the error bash
prints (`syntax error near unexpected token '('`) names no file, so it reads as a broken
hook rather than a quoting bug. Prettier needs no quoting, because lint-staged spawns it
with no shell.

**Backend tests are not run on commit.** The hook prints a reminder only, because they
are slow. CI runs them on every PR, but run them locally before pushing backend changes.

Prettier config is per app and there is **no root config at all**: the frontend sets
`printWidth: 100` with `singleQuote` in its `package.json`, the backend has its own
`backend/.prettierrc`. Anything outside those two directories - `CLAUDE.md`, `README.md`,
`docs/`, `.claude/` - therefore gets Prettier's defaults, which means `printWidth: 80` and
**double** quotes. Prose is unaffected because `proseWrap` defaults to `preserve`, but a
fenced `ts` block in one of those files will be reformatted away from repo style. Keep
short code samples in those files as inline spans, which Prettier leaves alone.

## What CI checks

`.github/workflows/ci.yml` runs three jobs in parallel on every PR and on pushes to
`main`:

- **backend**: lint, build, OpenAPI spec is fresh, unit tests, e2e
- **frontend**: generated API types are fresh, lint, unit tests, build, build-storybook
- **conventions**: commitlint over the PR's commit range, then `npm run docs:check`

The two freshness steps are the drift gate, and `docs/agents/api-contract.md` explains why
they live in the jobs they do.

`npm run docs:check` (`scripts/docs-check.sh`) asserts that the facts this documentation
states about the code still match it: the Node major and floor, the backend's environment
variables, that every backticked path resolves, and that no code fence is left unclosed.
Run it locally before pushing a docs change; no hook runs it for you. The rule it enforces,
and the table of which file owns which fact, are in `docs/agents/conventions.md`.
