# pogo-db-api

A custom-tailored static JSON API for Pokémon GO data. Stores Pokémon data as a local database of JSON files, computes DPS/STAB stats at build time, and deploys individual per-Pokémon JSON files to GitHub Pages.

## API Usage

Base URL: `https://<username>.github.io/pogo-db-api/api/pokemon/`

### Endpoints

| Endpoint | Description |
|----------|-------------|
| `api/pokemon/index.json` | Manifest of all available Pokémon (dexNr, name, id) |
| `api/pokemon/{dexNr}.json` | Individual Pokémon data (e.g., `api/pokemon/25.json` for Pikachu) |
| `api/rankings/index.json` | List of available type rankings |
| `api/rankings/{type}.json` | Top attackers for a type (e.g., `api/rankings/fire.json`) |
| `api/raids/current.json` | Current raid bosses (scraped from Leek Duck, updated daily) |
| `api/events/current.json` | Current and upcoming events (scraped from Leek Duck, updated daily) |

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

Each Pokémon includes a top-level `computed` object (if stats are available) with:

- **pokemon** — Real stats at Level 50, 15/15/15 IVs: `{ atkReal, defReal, hpReal }`
- **movesets.regular** — All fast × charge combos ranked by TDO (regular moves only)
- **movesets.elite** — Combos requiring at least one Elite TM move, ranked by TDO

TDO (Total Damage Output) = `combo_dps_atk × HP_real × DEF_real` — a boss-agnostic composite blending damage output and bulk. See the frontend's Methodology page for the full formula.

### Shadow & Mega Variants

Each Pokémon file includes a `variants` array (when applicable) containing shadow and mega forms with their own computed stats:

```json
{
  "variants": [
    {
      "variant": "shadow",
      "variantName": "Shadow Mewtwo",
      "id": "MEWTWO_SHADOW",
      "formId": "MEWTWO_SHADOW",
      "name": "Shadow Mewtwo",
      "stats": { "stamina": 214, "attack": 360, "defense": 143.33 },
      "computed": { "pokemon": { ... }, "movesets": { ... } }
    },
    {
      "variant": "mega",
      "variantName": "Mega Mewtwo Y",
      "id": "MEWTWO_MEGA_Y",
      "formId": "MEWTWO_MEGA_Y",
      "name": "Mega Mewtwo Y",
      "stats": { "stamina": 214, "attack": 387, "defense": 232 },
      "computed": { "pokemon": { ... }, "movesets": { ... } }
    }
  ]
}
```

Type rankings (`api/rankings/{type}.json`) also include shadow and mega entries with `variant` and `variantName` fields for easy filtering.

- **Shadow** — Base stats × 1.2 ATK / × 0.833 DEF. Eligible Pokémon defined in `shadow_pokemon.csv`.
- **Mega** — Uses mega evolution stats/types with the base Pokémon's movepool.

## Architecture

```
data/pokemon/*.json → read → expand (shadow/mega) → compute → write → GitHub Pages
```

| Stage | Module | Description |
|-------|--------|-------------|
| Store | `data/pokemon/` | Local database of per-Pokémon JSON files (committed) |
| Read | `src/reader.ts` | Loads stored data, flattens forms, initializes computed fields |
| Expand | `src/expander.ts` | Synthesizes shadow/mega variants from base Pokémon + shadow list |
| Compute | `src/calculators/` | Extensible pipeline of stat calculators |
| Write | `src/writer.ts` | Outputs individual JSON files per dexNr to `public/api/` |
| Orchestrate | `src/index.ts` | Wires read → expand → compute → write |

### Adding New Pokémon

1. Create or edit `data/pokemon/{dexNr}.json` with the Pokémon's base data (no `computed` fields on moves — those are calculated at build time).
2. Push to `main` — the build pipeline computes DPS/STAB and deploys automatically.

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
npm run build        # Read data, compute stats, write JSON API files
npm run seed         # Re-seed data/pokemon/ from upstream API (overwrites existing)
npm run typecheck    # Run TypeScript type checking
npm test             # Run unit tests
npm run test:watch   # Run tests in watch mode
npx serve public     # Serve the frontend locally at http://localhost:3000
```

### Running Locally

To view the API documentation frontend and browse the API locally:

```bash
npm run build        # Generate the API files in public/api/
npx serve public     # Start a local server at http://localhost:3000
```

The frontend (`public/index.html`) is an interactive API documentation page. It requires `public/api/` to be populated first via `npm run build`.

### Project Structure

```
data/pokemon/             # Local database — one JSON file per dexNr (committed)
shadow_pokemon.csv        # Shadow-eligible Pokémon list (dex_number,name,form,type1,type2)
src/
├── index.ts              # Build pipeline: read → expand → compute → write
├── types.ts              # TypeScript type definitions
├── config.ts             # Configurable multipliers (shadow ATK/DEF)
├── reader.ts             # Reads data/pokemon/ into Pokemon[]
├── expander.ts           # Synthesizes shadow/mega variants from base Pokémon
├── shadow.ts             # Reads and parses shadow_pokemon.csv
├── seed.ts              # Seed script: fetch upstream → write data/pokemon/
├── fetcher.ts            # HTTP fetch from upstream (used by seed)
├── transformer.ts        # Raw → trimmed English (used by seed)
├── writer.ts             # JSON file writer for public/api/pokemon/
├── rankings-writer.ts    # Per-type TDO rankings writer for public/api/rankings/
├── raids-writer.ts       # Orchestrates raid boss fetch → parse → match → write
├── events-writer.ts      # Orchestrates events fetch → parse → write
├── raids/
│   ├── fetcher.ts        # Fetches Leek Duck HTML (with timeout, silent fail)
│   ├── parser.ts         # Cheerio-based HTML parser for raid boss data
│   └── matcher.ts        # Name matcher: display names → dexNr
├── events/
│   ├── fetcher.ts        # Fetches Leek Duck events HTML (with timeout, silent fail)
│   └── parser.ts         # Cheerio-based HTML parser for event data
└── calculators/
    ├── index.ts          # Calculator interface + pipeline runner
    ├── dps.ts            # DPS/STAB computation (per-move)
    └── tdo.ts            # TDO computation (moveset combos + rankings)
public/
├── index.html            # API documentation + methodology (with sidebar nav)
└── api/                  # Generated output (gitignored)
    ├── pokemon/          # Per-Pokémon JSON files
    ├── rankings/         # Per-type TDO ranking files
    ├── raids/            # Current raid bosses (scraped from Leek Duck)
    └── events/           # Current events (scraped from Leek Duck)
.github/workflows/
├── build-and-deploy.yml  # Build + GitHub Pages deploy (daily cron + push)
└── ci.yml                # PR/push test runner
```

## Deployment

Automated via GitHub Actions:

- **On push**: Deploys on every push to `main`
- **Daily cron**: Runs at 7AM EST to refresh raid boss data from Leek Duck
- **Manual**: Can be triggered via `workflow_dispatch`

The build reads from committed `data/pokemon/` files, computes stats, and writes to `public/api/`. The API is served from the `gh-pages` branch via GitHub Pages.

## Data Source

Initial data was seeded from [pokemon-go-api](https://github.com/pokemon-go-api/pokemon-go-api), which parses the Pokémon GO GameMaster files from PokeMiners. The data now lives locally in this repository and can be updated manually or re-seeded with `npm run seed`.

## License

MIT
