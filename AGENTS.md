# AGENTS.md

<!-- ============================================================
CANONICAL AGENT INSTRUCTIONS — tool-neutral.
CLAUDE.md contains `@AGENTS.md`; .github/copilot-instructions.md points here.
Edit THIS file, never the pointers.

SIZE BUDGET: ~150 lines. This file loads on EVERY agent session.
The test for any addition: does it describe HOW TO WORK HERE?
  - "How to work here" (commands, conventions, invariants, gotchas) → belongs here
  - "What was built" (feature detail, spec history, endpoint catalogs) → belongs in
    docs/ARCHITECTURE.md or a dated spec in docs/superpowers/specs/ — link it instead
If a section grows past ~25 lines, extract to docs/ and leave a pointer.
============================================================ -->

## Project

pogo-db-api is a static JSON API for Pokémon GO data. There is no server runtime: a
TypeScript build pipeline reads a committed local database of JSON files, computes
DPS/STAB/TDO stats, and writes per-Pokémon JSON files served from GitHub Pages.

Living docs: `docs/ARCHITECTURE.md` (system map — read before architectural
decisions), `docs/FEATURES.md` (backlog + shipped record — what's built),
`docs/ROADMAP.md` (phases and release procedure), `CHANGELOG.md`. Specs and plans:
`docs/superpowers/specs/`, `docs/superpowers/plans/`. Workflow and onboarding:
`docs/CONTRIBUTING.md` — see its **docs-ownership table** for which file to update
when.

## Commands

    npm install
    npm run build                       # read → expand → compute → write public/api/
    npm run seed                        # re-seed data/pokemon/ from upstream (OVERWRITES)
    npm run typecheck                   # tsc --noEmit
    npm test                            # vitest run
    npm run test:watch                  # vitest in watch mode
    npx serve public                    # local server on :3000 — run build first

    npm test -- src/reader.test         # single test file

Traps: `public/index.html` renders nothing useful until `npm run build` has populated
`public/api/`. Fetcher tests take ~8s because the retry sleep is a hardcoded 2000ms.
`npm run seed` overwrites the committed store — it is for initial population or a
deliberate bulk refresh, never part of a normal build.

## Workflow (repo convention — all contributors and their agents)

<!-- STANDARD BLOCK — keep identical across repos. Update the master in
ai-standards/templates/AGENTS.md first, then sync outward. -->

- New feature/change → superpowers:brainstorming → spec → superpowers:writing-plans
  → plan → **superpowers:subagent-driven-development** to execute. Do not implement
  plan tasks inline.
- **UI designs get a visual mockup before the spec is finalized:** when a design adds
  or reshapes a page, publish a self-contained HTML mockup (representative data
  clearly labeled as mock) and get sign-off on it as part of the brainstorm — the
  approved mockup is referenced in the spec.
- Model selection — session (main loop), in tiers so it survives model releases:
  brainstorming, spec writing, and plan writing run on the most capable model;
  subagent orchestration (executing the plan via subagent-driven-development)
  likewise. Switch sessions/models at the plan→execution handoff.
- Model selection — subagent dispatch: cheapest tier when the plan contains the
  complete code (transcription); mid-tier for integration/real-run tasks and all
  reviewers; most capable model for the final whole-branch review. Always specify
  the model explicitly on dispatch.
- After all tasks: final whole-branch review with the accumulated Minor-findings
  list for triage → ONE fix subagent → superpowers:finishing-a-development-branch.
- A feature isn't finished until its `docs/FEATURES.md` row exists and sits
  in **Shipped** with the version. Fresh sessions learn what's built by
  reading that table — a stale table recreates the re-explaining problem.
- Feature branches (`feat/<name>`), never implement on main. The SDD ledger
  (`.superpowers/sdd/progress.md`) survives compaction — trust it and `git log`
  over recollection.
- **Finish by pushing and opening a PR** (`gh pr create`); merge after the CI gate
  is green.

## Local environment

- Node.js 20+ (native `fetch`). ESM only — `"type": "module"`; relative imports carry
  the `.js` extension even in TypeScript source.
- No database and no `.env` are required: the store is committed JSON and the build
  reads only the repo. `.env.example` records that explicitly.
- The seed and raid/event fetchers reach the network. They time out and fail silently
  by design, so a build offline still succeeds with those sections empty — check the
  output, don't assume.
- Parallel agent instances must NOT share a checkout — use separate worktrees. There
  is no port or database to collide on.

## Deploy target

- Deploy target: **GitHub Pages** via GitHub Actions — no provider pack applies (the
  kit covers AWS, DigitalOcean, Vercel+Supabase). See `docs/ARCHITECTURE.md` →
  Deployment for the map.
- Merging to `main` ships it: `build-and-deploy.yml` builds and publishes `public/`
  to the `gh-pages` branch. There is no manual deploy command, and no rollback other
  than a follow-up commit.
- `public/api/` is generated and gitignored — never commit it, never hand-edit it.

## Auth

- Auth: **none** — no user accounts. If accounts are ever added, pick a tier
  from the `standards-auth` skill first.

## Invariants

- `data/pokemon/` is committed source, not build output — never gitignore it, never
  regenerate it as part of a build. Only `npm run seed` writes it, deliberately.
- Stored files carry no `computed` fields on moves. Computed values are derived at
  build time; persisting them lets the store and the calculators drift apart.
- `public/api/` is generated output — gitignored, rebuilt every deploy. Hand-edits
  there vanish on the next build.
- Public JSON shapes are the API contract. Renaming or removing a field breaks
  consumers silently, since there is no versioning layer — treat it as a breaking
  change with a CHANGELOG entry.
- Calculators stay pure per-Pokémon transforms matching the `Calculator` interface. A
  calculator that reaches outside its input makes pipeline order load-bearing.

## Hard-won gotchas

<!-- The promotion target for docs/ai/lessons-learned.md (see its promotion rule).
Mechanism-level entries only: what breaks, WHY it breaks, and the rule.
This section usually earns its context cost more than any other.
Repo-specific lessons only. A lesson that would bite any project on any stack is
promoted to the personal global file instead — see the promotion rule's last route. -->

- (empty — populated by the lessons-learned loop)

## Verification

- Gate every change on: typecheck, tests, build. Run them; don't assume. There is no
  lint step in this repo — `docs/CONTRIBUTING.md` records what CI actually runs.
- **Check exit codes directly.** `cmd | tail -2 && echo OK` tests `tail`'s exit
  code, not `cmd`'s, and will report a false green.
- **A build that succeeded is not a build that produced data.** The raid and event
  fetchers fail silently on network trouble; confirm the written files are populated
  rather than trusting the exit code.
- **Prefer proving a claim to asserting it.** Read the JSON that was *written* under
  `public/api/`, not the value a function returned.
- Anything needing live upstream data is **deferred, not skipped** — record it. A
  mock or fallback that makes something look done is worse than a truthful deferral.

## Conventions

- All types in `src/types.ts`; stored types prefixed `Stored*`, raw upstream types
  prefixed `RawUpstream*`.
- `public/index.html` is checked in — the landing page with interactive API docs.
- The seed script is clearly labeled and used only for initial population or bulk
  refresh.
