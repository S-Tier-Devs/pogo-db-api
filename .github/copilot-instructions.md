# Copilot Instructions

The canonical agent instructions for this repository live in [`/AGENTS.md`](../AGENTS.md)
at the repo root. Read and follow that file — it is the single source of truth for
project context, commands, workflow, invariants, and gotchas.

Scoped instructions (loaded by path, when present):
- `.github/instructions/*.instructions.md` — per-area rules with `applyTo` frontmatter

Do not duplicate content from AGENTS.md here. If something is missing there, add it
there (subject to its size budget) or to the doc its docs-ownership table names.
