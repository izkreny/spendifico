# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository. Everything
below is verified against the code, not aspirational.

`README.md` is the human-facing entry point: setup steps, commands, and troubleshooting.
This file is the reasoning behind them, so the two overlap deliberately but do not
duplicate. When something structural changes, check whether both need updating.

## What this is

**Decode Academy Demo**, a teaching boilerplate for academy final projects. A minimal
Next.js frontend talks to a NestJS backend over HTTP. Exactly one feature works
end to end: the frontend fetches a greeting from the backend's `GET /api/hello` and
renders it. Everything else is scaffolding for you to build on.

Because this is a starting point rather than a finished app, the "Not yet built"
section at the bottom is load-bearing. Read it before assuming a feature exists.

## Repository layout

This is a **multi-app repo, not a workspace-managed monorepo**. There is no npm
workspaces, turbo, or nx setup. The root `package.json` owns only repo-wide dev tooling
(Husky, commitlint, lint-staged, Prettier) and does **not** manage the two apps.

```text
backend/          NestJS 11 API, port 3000, its own package.json + node_modules
frontend/         Next.js 16 + React 19, port 4200, its own package.json + node_modules
.claude/          Skills, agents and permissions for Claude Code (see below)
.github/workflows/ci.yml
.husky/           pre-commit and commit-msg hooks
vercel.json       Both apps as two Vercel services (see Deployment below)
```

Two consequences that trip people up:

- There are **three** `package.json` files and each is installed separately. Run
  `npm install` inside each app, and run it at the root too. The root install is
  **mandatory, not a convenience**: its `prepare` script is what sets `core.hooksPath` to
  `.husky/_`. Skip it and both hooks are simply absent, so any commit message shape is
  accepted and staged files are never linted. The failure is silent locally and only
  surfaces when the `conventions` job fails on the PR. Verify with
  `git config core.hooksPath`.
- Run app commands from inside that app's directory (`cd backend`, `cd frontend`). This
  matters for ESLint especially, whose config and plugins resolve from the app's own
  `node_modules`.

Node version comes from `.nvmrc` (currently **24**). CI reads that same file, so bump it
there and CI follows. Use `nvm use`, which reads `.nvmrc` and needs no version argument;
avoid `nvm install --lts`, which installs whatever LTS happens to be current. The hard
floor is **v20.9.0**, declared by `next` in its `engines` field, and all three
`package.json` files now carry that same `engines` constraint so npm warns on a mismatch.

## Common commands

Backend, from `backend/`:

| Command              | Purpose                                                   |
| -------------------- | --------------------------------------------------------- |
| `npm run start:dev`  | Nest in watch mode on :3000                               |
| `npm run build`      | Compile to `dist/`. Doubles as the typecheck gate (`tsc`) |
| `npm run lint`       | ESLint with `--fix`                                       |
| `npm test`           | Jest unit tests (`*.spec.ts` under `src/`)                |
| `npm run test:watch` | Same, in watch mode                                       |
| `npm run test:e2e`   | Supertest e2e (`test/`, uses `test/jest-e2e.json`)        |
| `npm run test:cov`   | Coverage                                                  |

Frontend, from `frontend/`:

| Command              | Purpose                                         |
| -------------------- | ----------------------------------------------- |
| `npm run dev`        | Next dev server on :4200                        |
| `npm run build`      | Production build. Doubles as the typecheck gate |
| `npm start`          | Serve the production build on :4200             |
| `npm run lint`       | ESLint (`eslint-config-next`)                   |
| `npm test`           | Jest + React Testing Library (jsdom)            |
| `npm run test:watch` | Same, in watch mode                             |

Single test in either app: `npm test -- page` filters by path,
`npm test -- -t "greeting"` filters by test name.

Neither app has a standalone `typecheck` script. `npm run build` is the typecheck.

To run the whole thing locally, start both in separate terminals: backend on 3000,
frontend on 4200. The frontend calls the backend, never the reverse.

## Architecture

**Ports are fixed and asymmetric.** Backend API on **3000**, frontend on **4200**. Both
are wired into code and config, so do not swap them.

**The `/api` prefix is set in one place but depended on in three.**
`backend/src/main.ts` sets a global `api` prefix, so a controller mapped to `hello` is served
at `GET /api/hello`. Note the consequence: `GET http://localhost:3000/` returns 404, which is
normal, not a broken server. Two other places assume that exact prefix: the e2e test
re-applies it manually to match production, and the deployed path transform in `vercel.json`
rewrites into it. Change the prefix and all three must change together, or local dev and CI
stay green while every deployed route 404s.

**Frontend to backend data flow.** The home page (`frontend/src/app/page.tsx`) is an
**async Server Component**. It fetches the backend at request time on the server with
`cache: 'no-store'`, which means no CORS is involved and there is no client-side loading
state for that call. CORS is enabled on the backend anyway (`main.ts`), for the case of
genuinely client-side fetches, allowing origin `FRONTEND_URL`.

The base URL for that fetch comes from `BACKEND_URL`, which means two different things in the
two environments: a `.env.local` value pointing at `localhost:3000` when developing, and a
value Vercel generates from a service binding once deployed. The code does not care, because
both are absolute URL bases and `page.tsx` appends `/api/hello` to whichever it gets. See
Deployment below.

**Configuration goes through ConfigService.** `ConfigModule.forRoot({ isGlobal: true })`
is registered in `backend/src/app.module.ts`, so it reads `backend/.env` at startup and
`ConfigService` is injectable everywhere without re-importing the module. Read values
through `ConfigService`, as `main.ts` does, rather than scattering `process.env` through
the code.

**API response contract is hand-mirrored, and that is a known wart.** `HelloResponse`
is declared in `backend/src/app.service.ts` (the source of truth) and copied by hand
into `frontend/src/app/page.tsx`. Change a response shape and you must edit both. The
intended fix is generating frontend types from an OpenAPI spec, but the backend does not
expose one yet.

## Environment variables

Copy the templates, then fill in values. Both real files are gitignored.

| App      | Template                | Real file             | Variables                                                                            |
| -------- | ----------------------- | --------------------- | ------------------------------------------------------------------------------------ |
| Backend  | `backend/.env.example`  | `backend/.env`        | `PORT` (default 3000), `FRONTEND_URL` (CORS origin, default `http://localhost:4200`) |
| Frontend | `frontend/.env.example` | `frontend/.env.local` | `BACKEND_URL` (default `http://localhost:3000`)                                      |

Both apps run on their defaults with no `.env` at all, so a missing file is not an error.

Note the filename difference: Nest reads `.env`, Next.js reads `.env.local`.

The table above describes **local development**. Deployed, none of these three need setting:
`PORT` is ignored, `FRONTEND_URL` is unused because nothing crosses an origin, and
`BACKEND_URL` is generated by a service binding. See Deployment.

**Never give a server-only secret a `NEXT_PUBLIC_` prefix.** `BACKEND_URL` deliberately
has no prefix because it is read server-side only; a `NEXT_PUBLIC_` variable is inlined
into the browser bundle and is therefore public forever.

There is **no config validation**: `ConfigModule` is registered without a
`validationSchema`, so a missing variable surfaces at first use rather than at boot.

## What is in `.claude/`

This repo ships Claude Code configuration. Knowing what is there prevents both
reinventing it and being surprised by it.

**Skills.** A skill is invoked by its own name, so the slash command is the full name in
the left column (`/repo-dev-setup`). You do not have to remember them: each skill's
description also matches plain requests, so "set me up locally" reaches `repo-dev-setup`
on its own. The short forms quoted inside the descriptions (`/dev-setup`, `/commit`) are
matching phrases, not registered commands.

| Skill             | What it does                                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `repo-dev-setup`  | First-time local setup, both apps. Start here on a fresh clone                                                                                                     |
| `repo-commit`     | Analyses changes, runs per-app lint/test, writes Conventional Commit messages, guards against committing to `main`                                                 |
| `repo-secrets`    | Manages `.env` files from templates, explains where real secrets live                                                                                              |
| `repo-jira`       | Creates/estimates/transitions Jira issues over MCP. Needs a Jira MCP server; see `.claude/skills/repo-jira/references/jira-access.md` for the two supported setups |
| `repo-review-prs` | Fetches open PRs via `gh` and reviews unreviewed ones                                                                                                              |
| `backend-nestjs`  | Passive reference library, 12 NestJS rules across 7 categories. Consulted when writing backend code                                                                |
| `frontend-nextjs` | Passive reference library, 16 Next.js/React rules. Consulted when writing frontend code                                                                            |

**Agents** (delegated subtasks with their own context): `code-reviewer`, `debugger`,
`test-automator`, `nestjs-specialist` and `nextjs-specialist` (these two fetch and
synthesise the live official docs, which is different from the passive rule libraries
above), and `linus-reviewer` (a deliberately blunt review persona; it has no tools, so
paste the diff into the prompt).

**Permissions.** `.claude/settings.json` is committed and applies to everyone. Notably,
`Edit` and `Write` are **not** pre-approved, so Claude asks before every file change and
you see the diff before it lands. Every decision in that file is explained in
`.claude/SETTINGS.md`, because JSON cannot hold comments. Personal preferences belong in
`.claude/settings.local.json`, which is gitignored.

`.claude/commit-checks.md` is a generated cache read by `repo-commit`. Regenerate it
with `/repo-commit refresh-checks` when it goes stale.

## Git workflow

**HARD RULE: never commit or push directly to `main`.** Branch first. `settings.json`
puts `git push` behind a confirmation prompt to give this rule a real barrier rather
than just an instruction.

Branch format: `{type}/DEMO-{number}-{slug}`, for example
`feat/DEMO-160-user-profile-card`.

**Conventional Commits are enforced** by a `commit-msg` hook running commitlint. The
allowed types are restricted (see `commitlint.config.js`): `build`, `chore`, `ci`,
`docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`. Anything else is
rejected, including a bare description with no type.

**pre-commit** runs `lint-staged` (`.lintstagedrc.js`): per-app `eslint --fix`, then
Prettier. ESLint is invoked from each app's own directory so its config and plugins
resolve correctly, which is why you should not try to lint one app from the other's cwd.

**Backend tests are not run on commit.** The hook prints a reminder only, because they
are slow. CI runs them on every PR, but run them locally before pushing backend changes.

Prettier config is split: root and frontend use `printWidth: 100` with `singleQuote`;
the backend has its own `backend/.prettierrc`.

## CI

`.github/workflows/ci.yml` runs three jobs in parallel on every PR and on pushes to
`main`:

- **backend**: lint, build, unit tests, e2e
- **frontend**: lint, unit tests, build
- **conventions**: commitlint over the PR's commit range

A repo-wide `prettier --check` step exists but is **intentionally commented out**: 55
files predate the Prettier config and the step would fail immediately on a fresh clone.
To enable it, run `npx prettier --write .` once, commit the result, then uncomment.

## Deployment

Both apps deploy to Vercel as **one project holding two services**, defined entirely by the
root `vercel.json`. Step-by-step instructions live in `README.md` under "Deploying to Vercel";
what follows is the part that changes how you write code.

**Neither app needed a code change.** Vercel locates the backend entrypoint by filename and
`backend/src/main.ts` already matches its list, so `bootstrap()` and `app.listen()` stay as
they are. The port argument is simply ignored in production. Do not add an `api/index.ts`
Express-adapter handler: that recipe predates first-class NestJS support and is no longer
needed.

**Read `vercel.json` before changing any route, prefix or cross-app call.** It owns three
things that are easy to break from inside application code:

1. **Public routing.** `/api/backend/*` goes to the backend service, everything else to the
   frontend. The rest of `/api/*` is therefore the frontend's, which is where a future
   `/api/chat` route handler belongs.
2. **A path transform.** Vercel hands a service the **original** request path, so the backend
   would see `/api/backend/hello` while Nest, with its global `api` prefix, only answers
   `/api/hello`. A `request.path` transform on the backend service bridges that. Changing the
   global prefix in `main.ts`, or the public prefix in `vercel.json`, means changing the
   transform to match, otherwise every deployed route 404s while local dev keeps working.
3. **A service binding.** The frontend declares a binding to the backend, and Vercel generates
   and injects `BACKEND_URL` at runtime. Never set that variable in Vercel's project settings:
   the generated value is deployment-aware, so previews reach their own backend. Bindings do
   not resolve at build time, so only request-time code may read it.

Because both services share a domain, browser calls to `/api/backend/*` are same-origin and
server-side calls go over the binding. **CORS is not part of the deployed path at all.** It
still matters locally, where 4200 and 3000 are different origins.

Root Directory in the dashboard must stay at the repository root, since `vercel.json` is
resolved relative to it. Pointing it into an app hides the services definition and Vercel
falls back to treating the repo as a static site, failing with
`No Output Directory named "public" found`. That was the original deploy failure here, back
when the setup used two projects and a per-app `framework` pin instead.

**Each service runs as a function, so the backend's execution model differs from
`npm run start:dev`.** One long-lived process locally, an on-demand function in production.
This rules out a category of backend code that otherwise looks perfectly reasonable:

- No state held in module or instance variables between requests, so no in-memory cache
  and no in-memory session store.
- No WebSockets, therefore no Nest gateways.
- No `setInterval` schedulers, background workers or in-process queues. Scheduled work goes
  through Vercel Cron, declared under `crons` in `vercel.json`.
- No writes outside `/tmp`, so no local SQLite file and no uploads to disk.

When a task needs any of the above, say so rather than writing code that passes locally and
silently misbehaves once deployed.

**Environment variables come from project settings, not files.** `backend/.env` and
`frontend/.env.local` are gitignored and do not exist on Vercel. `ConfigModule` still works
because `ConfigService` reads `process.env`. Two caveats: `BACKEND_URL` is the exception, being
generated by the binding rather than set by hand, and a variable changed in the dashboard does
not affect existing deployments until a redeploy.

## Not yet built

Treat these as planned, not available. This section exists so you do not build on
something that is not there.

- **The frontend `/api/chat` route handler.** No route handler exists, and the env
  template deliberately declares no model-provider key. Add whichever variable your
  provider needs when you build the route, server-side only and never behind
  `NEXT_PUBLIC_`. Related: `@google/genai` was once present in `frontend/node_modules`
  while absent from `package.json`, so a clean install removes it. Declare any SDK
  properly rather than relying on a leftover install.
- **Generated API types.** No OpenAPI spec, so `HelloResponse` is hand-mirrored between
  the two apps as described under Architecture.
- **Config validation.** No `validationSchema` on `ConfigModule`.
- **`frontend/src/components/`.** Does not exist. Create it with your first shared
  component.
- **A database.** Nothing is wired up. Pick your own persistence layer; that choice is
  deliberately left to you.

`backend/README.md` is the stock NestJS starter README. Ignore it as a source of truth
for this project.
