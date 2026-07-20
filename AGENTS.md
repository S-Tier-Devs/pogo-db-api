# AGENTS.md

## What This Is

A static JSON API for Pokémon GO data. No server runtime — it's a TypeScript build pipeline that reads a local database of JSON files, computes stats (DPS/STAB), and writes individual JSON files deployed to GitHub Pages.

## Architecture

```
data/pokemon/*.json (committed) → read → compute → write → GitHub Pages
```

- **Store** (`data/pokemon/`): Local database of per-Pokémon JSON files. One file per dexNr, committed to the repo. Contains all base data but no computed fields (those are calculated at build time).
- **Read** (`src/reader.ts`): Loads all JSON files from `data/pokemon/`, flattens multi-form entries, and initializes `computed` fields to zero for the calculator pipeline.
- **Compute** (`src/calculators/`): Extensible pipeline. Each calculator implements `{ name: string; compute(pokemon: Pokemon): Pokemon }`. Currently runs DPS + STAB DPS.
- **Write** (`src/writer.ts`): Outputs `public/api/pokemon/{dexNr}.json` per Pokémon + `public/api/pokemon/index.json` manifest.
- **Orchestrate** (`src/index.ts`): Wires read → compute → write.
- **Seed** (`src/seed.ts`): One-time/re-runnable script to fetch upstream data and populate `data/pokemon/`. Uses `fetcher.ts` and `transformer.ts`.

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Build entry point: read → compute → write |
| `src/types.ts` | All TypeScript interfaces (Pokemon, StoredPokemon, Move, etc.) |
| `src/reader.ts` | Reads data/pokemon/*.json into Pokemon[] |
| `src/seed.ts` | Seed script: fetch upstream → transform → write data/pokemon/ |
| `src/fetcher.ts` | HTTP fetch with retry (used by seed only) |
| `src/transformer.ts` | Raw upstream → trimmed English (used by seed only) |
| `src/calculators/index.ts` | Calculator interface + pipeline runner |
| `src/calculators/dps.ts` | DPS and STAB DPS computation (per-move) |
| `src/calculators/tdo.ts` | TDO computation (moveset combos, real stats, rankings) |
| `src/writer.ts` | JSON file output to public/api/pokemon/ |
| `src/rankings-writer.ts` | Per-type TDO ranking files to public/api/rankings/ |
| `src/raids-writer.ts` | Orchestrates raid boss fetch → parse → match → write |
| `src/raids/fetcher.ts` | Fetches Leek Duck HTML (with timeout, silent fail) |
| `src/raids/parser.ts` | Cheerio-based HTML parser for raid boss data |
| `src/raids/matcher.ts` | Name matcher: display names → dexNr |
| `public/index.html` | API documentation + methodology page (with sidebar nav) |

## Commands

```bash
npm install          # Install dependencies
npm run build        # Read data → compute → write public/api/
npm run seed         # Re-seed data/pokemon/ from upstream API (overwrites)
npm run typecheck    # TypeScript type checking
npm test             # Run all unit tests (vitest)
npm run test:watch   # Tests in watch mode
npx serve public     # Local server at http://localhost:3000
```

Note: The frontend (`public/index.html`) requires `public/api/` to be populated first. Run `npm run build` before serving locally.

## Running Tests

Tests use vitest. No network calls in the main test suite — reader/seed tests use OS temp directories, fetcher tests mock `global.fetch`.

```bash
npm test                              # All tests
npm test -- src/reader.test           # Single file
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

## Adding New Pokémon

1. Create `data/pokemon/{dexNr}.json` with the Pokémon's base data.
2. Do NOT include `computed` fields on moves — those are calculated at build time.
3. Follow the `StoredPokemon` type shape (see `src/types.ts`).
4. Run `npm run build` to verify the API output includes computed stats.
5. Push to `main` — deploys automatically.

## Stored Data Shape

Files in `data/pokemon/` follow the `StoredPokemon` type — same as `Pokemon` but moves have no `computed` field. If a dexNr has multiple forms, the file has a `forms` array containing additional forms.

## DPS Computation Logic

- **DPS**: `power / (durationMs / 1000)` — handles `durationMs === 0` → returns 0
- **STAB DPS**: `dps × 1.2` when `move.type.type === pokemon.primaryType.type || move.type.type === pokemon.secondaryType?.type`
- Results rounded to 2 decimal places

## Deployment

GitHub Actions (`.github/workflows/build-and-deploy.yml`):
- Triggers: push to main, manual dispatch
- Reads from committed `data/pokemon/` files
- Runs build (read → compute → write)
- Deploys `public/` to `gh-pages` branch via `actions/deploy-pages@v4`

CI (`.github/workflows/ci.yml`): Runs typecheck + tests on PRs and pushes.

## Conventions

- Node.js 20+ required (uses native `fetch`)
- ESM only (`"type": "module"` in package.json)
- All types in `src/types.ts` — stored types prefixed with `Stored*`, raw upstream types prefixed with `RawUpstream*`
- Generated output in `public/api/` is gitignored
- Data files in `data/pokemon/` are committed (the local database)
- `public/index.html` is checked in (landing page with interactive API docs)
- The seed script is clearly labeled and only used for initial population or bulk refresh
