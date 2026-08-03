# Architecture

<!-- The system map for anyone new to the repo, human or agent. This file absorbs
the detail that would otherwise bloat AGENTS.md: package boundaries, data flow,
key abstractions, and WHY the shape is what it is. Feature-level detail still
belongs in dated specs under docs/superpowers/specs/ — link them from here. -->

## Overview

There is no server runtime. This is a TypeScript build pipeline: it reads a committed
local database of JSON files, computes derived stats, and writes static JSON files that
GitHub Pages serves as an API.

```
data/pokemon/*.json (committed) → read → expand (shadow/mega) → compute → write → GitHub Pages
```

The store is committed source, not a build artifact. Generated output under
`public/api/` is gitignored and rebuilt on every deploy.

## Packages / boundaries

- **Store** (`data/pokemon/`) — local database of per-Pokémon JSON files, one file per
  dexNr, committed. Base data only; no computed fields (those are derived at build
  time). Multi-form Pokémon carry a `forms` array of additional forms.
- **Read** (`src/reader.ts`) — loads every JSON file from the store, flattens
  multi-form entries, and initializes `computed` fields to zero for the pipeline.
- **Expand** (`src/expander.ts`) — synthesizes shadow and mega variants from base
  Pokémon. Shadow eligibility comes from `shadow_pokemon.csv`; mega variants use the
  base's movepool with mega stats and types.
- **Compute** (`src/calculators/`) — extensible pipeline. Each calculator implements
  `{ name: string; compute(pokemon: Pokemon): Pokemon }`. Currently DPS, STAB DPS, TDO.
- **Write** (`src/writer.ts`) — emits `public/api/pokemon/{dexNr}.json` per Pokémon
  (with a variants array) plus a `public/api/pokemon/index.json` manifest.
- **Orchestrate** (`src/index.ts`) — wires read → expand → compute → write.
- **Seed** (`src/seed.ts`) — re-runnable script that fetches upstream data and
  populates `data/pokemon/`. Used for initial population or bulk refresh only, never
  as part of a normal build.

### Key files

| File | Purpose |
|------|---------|
| `src/index.ts` | Build entry point: read → expand → compute → write |
| `src/types.ts` | All TypeScript interfaces (Pokemon, StoredPokemon, Move, etc.) |
| `src/config.ts` | Configurable multipliers (shadow ATK/DEF, ER alpha) |
| `src/reader.ts` | Reads `data/pokemon/*.json` into `Pokemon[]` |
| `src/expander.ts` | Synthesizes shadow/mega variants from base Pokémon |
| `src/shadow.ts` | Reads and parses `shadow_pokemon.csv` |
| `src/seed.ts` | Seed script: fetch upstream → transform → write store |
| `src/fetcher.ts` | HTTP fetch with retry (seed only) |
| `src/transformer.ts` | Raw upstream → trimmed English (seed only) |
| `src/calculators/index.ts` | Calculator interface + pipeline runner |
| `src/calculators/dps.ts` | DPS and STAB DPS computation (per-move) |
| `src/calculators/tdo.ts` | TDO computation (moveset combos, real stats, rankings) |
| `src/writer.ts` | JSON output to `public/api/pokemon/` |
| `src/rankings-writer.ts` | Per-type TDO ranking files to `public/api/rankings/` |
| `src/counters-writer.ts` | Per-Pokémon raid counter files to `public/api/counters/` |
| `src/type-effectiveness.ts` | Pokémon GO type effectiveness chart (18×18 matrix) |
| `src/raids-writer.ts` | Orchestrates raid boss fetch → parse → match → write |
| `src/raids/fetcher.ts` | Fetches Leek Duck HTML (timeout, silent fail) |
| `src/raids/parser.ts` | Cheerio-based HTML parser for raid boss data |
| `src/raids/matcher.ts` | Name matcher: display names → dexNr |
| `src/events-writer.ts` | Orchestrates events fetch → parse → write |
| `src/events/fetcher.ts` | Fetches Leek Duck events HTML (timeout, silent fail) |
| `src/events/parser.ts` | Cheerio-based HTML parser for event data |
| `public/index.html` | API documentation + methodology page (sidebar nav) |

## Data model

Files in `data/pokemon/` follow the `StoredPokemon` type — identical to `Pokemon`
except that moves carry no `computed` field. When a dexNr has multiple forms, the file
carries a `forms` array with the additional forms. The schema of record is
`src/types.ts`; do not duplicate it here.

Naming convention: stored types are prefixed `Stored*`, raw upstream types
`RawUpstream*`.

### Computation logic

**DPS** — `power / (durationMs / 1000)`; `durationMs === 0` returns 0.
**STAB DPS** — `dps × 1.2` when `move.type.type` matches the Pokémon's primary or
secondary type. Results round to 2 decimal places.

**Rankings** use the Gamepress Comprehensive DPS formula with ER (Equivalent Rating):

- Comprehensive DPS: `DPS0 + (CDPS - FDPS) / (CEPS + FEPS) × (0.5 - x/HP) × y`,
  where `y = 900/DEF` and `x = 0.5×CE + 0.5×FE`
- TDO: `DPS × HP_real × DEF_real / 900`
- ER: `DPS^0.75 × TDO^0.25` (α configurable in `src/config.ts`)

Type rankings use **type-specific DPS** — only damage from moves matching the target
type counts toward the ranking score.

Credits: Gamepress (comprehensive DPS), u/Elastic_Space (ER metric), u/Flyfunner and
u/bmenrigh (raid system research).

## Extension points

### Adding a calculator

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

2. Register it in `src/index.ts`:

```typescript
import { myCalculator } from "./calculators/my-calc.js";
const calculators = [dpsCalculator, myCalculator];
```

3. Run `npm run build` to verify.

### Adding a Pokémon

1. Create `data/pokemon/{dexNr}.json` with base data.
2. Do **not** include `computed` fields on moves — those are derived at build time.
3. Follow the `StoredPokemon` shape in `src/types.ts`.
4. Run `npm run build` and confirm the output carries computed stats.
5. Merge to `main` — deployment is automatic.

## Deployment

Runs as static files on **GitHub Pages**. No provider pack applies (the kit's packs
cover AWS, DigitalOcean, and Vercel+Supabase); the deploy is GitHub Actions only.

| Piece | Service | Notes |
|---|---|---|
| API + docs | GitHub Pages (`gh-pages` branch) | published by `actions/deploy-pages@v4` |
| Build | GitHub Actions | `.github/workflows/build-and-deploy.yml` |
| Gate | GitHub Actions | `.github/workflows/ci.yml` — typecheck + tests |
| Data store | committed JSON in `data/pokemon/` | no database |
| Secrets | none | no runtime, no credentials |

`.github/workflows/build-and-deploy.yml` triggers on push to `main` and on manual
dispatch: it reads the committed store, runs the build, and deploys `public/` to the
`gh-pages` branch.

Deploy command: none by hand — merging to `main` ships it.
