# Contributing

The workflow and freshness contract for pogo-db-api — for any contributor (human or
agent) who wasn't in the room when a decision got made. If you only read one section,
read **Docs ownership** at the bottom: it's the mechanism that keeps this repo honest.

## Quick start

There is no database, no `.env`, and no service to start. The store is committed JSON
and the build reads only the repo.

```bash
npm install
npm run build          # populates the gitignored public/api/
npx serve public       # http://localhost:3000 — build first or the page is empty
```

Then run the full local gate — the same checks CI runs on every PR, plus the build:

```bash
npm run typecheck
npm test
npm run build
```

There is **no lint step** in this repo. `npm run lint` does not exist; don't add it to
a script or workflow expecting it to work.

## PR flow

1. Branch from `main`: `feat/<name>` (or `fix/<name>`). Never commit directly to main.
2. Push and open a PR: `git push -u origin feat/<name>` then `gh pr create`.
3. Wait for the CI check to go green (`gh pr checks --watch`). The workflow is named
   **CI** (`.github/workflows/ci.yml`) and runs typecheck + tests — it does **not**
   run the build. Run `npm run build` locally before opening the PR.
4. Merge once green. Linear history — squash or fast-forward, matching the existing
   history (`git log --oneline main`).

Merging to `main` deploys: `build-and-deploy.yml` publishes `public/` to `gh-pages`.
There is no staging environment and no rollback other than a follow-up commit.

## Release procedure

1. Bump the version in `package.json` and add a matching section to `CHANGELOG.md` in
   the same PR.
2. Merge through the normal PR flow; the deploy runs from `main` automatically.
3. Mark shipped rows in `docs/FEATURES.md` and add the release to `docs/ROADMAP.md`
   history.

Public JSON field shapes are the API contract — there is no versioning layer in the
URL, so a removed or renamed field breaks consumers silently. Treat it as a breaking
change and say so in the CHANGELOG.

## Feature intake

Every idea, review finding, or piece of user feedback gets a row in
`docs/FEATURES.md` **before** it gets built:

1. Add a row under **Unassigned** using the template at the top of that file.
2. Periodically, accepted rows get grouped into the next phase and marked
   `assigned (vX.Y)`.
3. The phase goes through the normal cycle: brainstorm → spec → plan →
   subagent-driven implementation → PR → release.

## Docs ownership

The mechanism that keeps documentation from drifting: every PR's checklist
(`.github/pull_request_template.md`) asks "did you update the doc that owns this?"
Use this table to answer that question.

| When you change… | You must update… |
|---|---|
| Anything user-visible (including JSON output shapes) | CHANGELOG.md (+ version if releasing) |
| Feature scope/status | docs/FEATURES.md row |
| Architecture boundaries, stacks, invariants | docs/ARCHITECTURE.md |
| Workflow/conventions/gotchas | AGENTS.md and/or docs/CONTRIBUTING.md |
| A correction or incident happened | docs/ai/lessons-learned.md (promote per its rule) |
| Release shipped | docs/ROADMAP.md history |
