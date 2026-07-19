# pogo-db-api

A custom-tailored static JSON API for Pokémon GO data. Fetches upstream data from [pokemon-go-api](https://pokemon-go-api.github.io/pokemon-go-api/), trims it to English-only essentials, computes DPS/STAB stats at build time, and deploys as individual per-Pokémon JSON files to GitHub Pages.

## API Usage

Base URL: `https://<username>.github.io/pogo-db-api/api/pokemon/`

### Endpoints

| Endpoint | Description |
|----------|-------------|
| `api/pokemon/index.json` | Manifest of all available Pokémon (dexNr, name, id) |
| `api/pokemon/{dexNr}.json` | Individual Pokémon data (e.g., `api/pokemon/25.json` for Pikachu) |

### Example Response (`api/pokemon/1.json`)

```json
{
  "id": "BULBASAUR",
  "formId": "BULBASAUR",
  "dexNr": 1,
  "generation": 1,
  "name": "Bulbasaur",
  "stats": { "stamina": 128, "attack": 118, "defense": 111 },
  "primaryType": { "type": "POKEMON_TYPE_GRASS", "name": "Grass" },
  "secondaryType": { "type": "POKEMON_TYPE_POISON", "name": "Poison" },
  "quickMoves": [
    {
      "id": "VINE_WHIP_FAST",
      "name": "Vine Whip",
      "power": 6,
      "energy": 5,
      "durationMs": 500,
      "type": { "type": "POKEMON_TYPE_GRASS", "name": "Grass" },
      "computed": { "dps": 12, "stabDps": 14.4 }
    }
  ]
}
```

### Computed Fields

Each move includes a `computed` object with:

- **dps** — Damage Per Second: `power / (durationMs / 1000)`
- **stabDps** — STAB-adjusted DPS: `dps × 1.2` when the move type matches the Pokémon's primary or secondary type

## Architecture

```
Upstream API → fetch → transform → compute → write → GitHub Pages
```

| Stage | Module | Description |
|-------|--------|-------------|
| Fetch | `src/fetcher.ts` | Downloads full Pokédex from upstream |
| Transform | `src/transformer.ts` | Trims to English-only, flattens structure |
| Compute | `src/calculators/` | Extensible pipeline of stat calculators |
| Write | `src/writer.ts` | Outputs individual JSON files per dexNr |
| Orchestrate | `src/index.ts` | Wires everything together with change detection |

### Adding New Calculators

Create a new file in `src/calculators/` implementing the `Calculator` interface:

```typescript
import type { Calculator } from "./index.js";
import type { Pokemon } from "../types.js";

export const myCalculator: Calculator = {
  name: "my-calc",
  compute(pokemon: Pokemon): Pokemon {
    // Add your computation logic here
    return pokemon;
  },
};
```

Then register it in `src/index.ts`:

```typescript
import { myCalculator } from "./calculators/my-calc.js";
const calculators = [dpsCalculator, myCalculator];
```

## Development

### Prerequisites

- Node.js 20+

### Commands

```bash
npm install          # Install dependencies
npm run build        # Fetch data, compute stats, write JSON files
npm run typecheck    # Run TypeScript type checking
npm test             # Run unit tests
npm run test:watch   # Run tests in watch mode
```

### Project Structure

```
src/
├── index.ts              # Build pipeline entry point
├── types.ts              # TypeScript type definitions
├── fetcher.ts            # Upstream API data fetcher
├── transformer.ts        # Raw → trimmed English transformer
├── writer.ts             # JSON file writer
└── calculators/
    ├── index.ts          # Calculator interface + pipeline runner
    └── dps.ts            # DPS/STAB computation
public/api/pokemon/       # Generated output (gitignored)
data/
└── last-hash.txt         # Change detection hash (gitignored)
.github/workflows/
├── build-and-deploy.yml  # Scheduled build + GitHub Pages deploy
└── ci.yml                # PR/push test runner
```

## Deployment

Automated via GitHub Actions:

- **Scheduled**: Rebuilds every 6 hours to pick up upstream data changes
- **On push**: Deploys on every push to `main`
- **Manual**: Can be triggered via `workflow_dispatch`
- **Change detection**: Only deploys when upstream data has actually changed (SHA-256 hash comparison)

The API is served from the `gh-pages` branch via GitHub Pages.

## Data Source

All Pokémon data is sourced from [pokemon-go-api](https://github.com/pokemon-go-api/pokemon-go-api), which in turn parses the Pokémon GO GameMaster files from PokeMiners.

## License

MIT
