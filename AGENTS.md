# AGENTS.md

## What This Is

A static JSON API for Pokémon GO data. No server runtime — it's a TypeScript build pipeline that fetches upstream data, transforms it, computes stats, and writes individual JSON files deployed to GitHub Pages.

## Architecture

```
Upstream API (pokemon-go-api) → fetch → transform → compute → write → GitHub Pages
```

- **Fetch** (`src/fetcher.ts`): Downloads full Pokédex from `https://pokemon-go-api.github.io/pokemon-go-api/api/pokedex.json`. Retries once on failure.
- **Transform** (`src/transformer.ts`): Trims to English-only names, flattens multi-language objects, converts move maps to arrays.
- **Compute** (`src/calculators/`): Extensible pipeline. Each calculator implements `{ name: string; compute(pokemon: Pokemon): Pokemon }`. Currently runs DPS + STAB DPS.
- **Write** (`src/writer.ts`): Outputs `public/api/pokemon/{dexNr}.json` per Pokémon + `public/api/pokemon/index.json` manifest.
- **Orchestrate** (`src/index.ts`): Wires the pipeline, includes SHA-256 change detection (stored in `data/last-hash.txt`). Skips write if data hasn't changed.

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Build entry point |
| `src/types.ts` | All TypeScript interfaces (Pokemon, Move, etc.) |
| `src/fetcher.ts` | HTTP fetch with retry |
| `src/transformer.ts` | Raw upstream → trimmed English |
| `src/calculators/index.ts` | Calculator interface + pipeline runner |
| `src/calculators/dps.ts` | DPS and STAB DPS computation |
| `src/writer.ts` | JSON file output |
| `public/index.html` | API documentation landing page |

## Commands

```bash
npm install          # Install dependencies
npm run build        # Full pipeline: fetch → transform → compute → write
npm run typecheck    # TypeScript type checking
npm test             # Run all unit tests (vitest)
npm run test:watch   # Tests in watch mode
npx serve public     # Local server at http://localhost:3000
```

## Running Tests

Tests use vitest. No network calls — fetcher tests mock `global.fetch`. Writer tests use OS temp directories.

```bash
npm test                              # All tests
npm test -- src/calculators/dps.test  # Single file
```

Note: Fetcher tests take ~8s due to hardcoded 2000ms retry delays in the sleep function.

## Adding a New Calculator

1. Create `src/calculators/my-calc.ts`:
```typescript
import type { Calculator } from "./index.js";
import type { Pokemon } from "../types.js";

export const myCalculator: Calculator = {
  name: "my-calc",
  compute(pokemon: Pokemon): Pokemon {
    // Mutate/add computed fields on moves or pokemon
    return pokemon;
  },
};
```

2. Register in `src/index.ts`:
```typescript
import { myCalculator } from "./calculators/my-calc.js";
const calculators = [dpsCalculator, myCalculator];
```

3. Run `npm run build` to verify.

## DPS Computation Logic

- **DPS**: `power / (durationMs / 1000)` — handles `durationMs === 0` → returns 0
- **STAB DPS**: `dps × 1.2` when `move.type.type === pokemon.primaryType.type || move.type.type === pokemon.secondaryType?.type`
- Results rounded to 2 decimal places

## Deployment

GitHub Actions (`.github/workflows/build-and-deploy.yml`):
- Triggers: cron every 6h, push to main, manual dispatch
- Caches `data/last-hash.txt` between runs for change detection
- Deploys `public/` to `gh-pages` branch via `peaceiris/actions-gh-pages@v4`
- Only deploys when data has actually changed

CI (`.github/workflows/ci.yml`): Runs typecheck + tests on PRs and pushes.

## Conventions

- Node.js 20+ required (uses native `fetch`)
- ESM only (`"type": "module"` in package.json)
- All types in `src/types.ts` — raw upstream types prefixed with `RawUpstream*`
- Generated output in `public/api/` is gitignored
- `public/index.html` is checked in (landing page with interactive API docs)
