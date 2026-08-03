# Lessons Learned — pogo-db-api

This file is the operational memory for AI-assisted development on this project.

**Update rule**: add an entry after any correction from the user, at the end of every
phase, and within 48 hours of any incident or repeated mistake.

**Promotion rule**: if a lesson appears twice — or is clearly load-bearing on first
occurrence — promote it:
- agent-behavior or repo-convention lessons → the **Hard-won gotchas** or
  **Invariants** section of `AGENTS.md`
- procedure lessons → the relevant skill or prompt file
- architecture lessons → `docs/ARCHITECTURE.md`
- lessons that are **not specific to this repo** — the same mistake would bite any
  project, on any stack — → the **Cross-project gotchas** section of the personal
  global file (`~/.claude/CLAUDE.md`, source `global/user-CLAUDE.md` in the
  ai-standards kit; edit there and run the installer). Promote here on the second
  repo, not the second occurrence within this one — otherwise the same lesson is
  copy-pasted into every repo's AGENTS.md, which is what the global file exists to
  prevent. It must also be a mechanism, not a preference: what breaks, why, and the
  rule.

A promoted lesson stays here as history; the promoted form is what agents load every
session.

---

## Entry Template

```
## [DATE] — [Short Title]
**Phase/Context**:
**What worked**:
**What failed**:
**Root cause**:
**Reusable rule**:
**Action to encode**: (AGENTS.md gotcha / invariant / skill / doc / none)
```

---
