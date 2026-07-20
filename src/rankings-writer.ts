import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Pokemon, MovesetCombo, Move } from "./types.js";

const OUTPUT_DIR = "public/api/rankings";

/** A single entry in the type rankings file */
export interface TypeRankingEntry {
  dexNr: number;
  name: string;
  id: string;
  formId: string;
  quickMove: string;
  cinematicMove: string;
  comboDps: number;
  comboDpsAtk: number;
  tdo: number;
  isElite: boolean;
}

/** The full type ranking file structure */
export interface TypeRankingFile {
  type: { type: string; name: string };
  rankings: TypeRankingEntry[];
}

/** All known Pokemon types */
const POKEMON_TYPES = [
  { type: "POKEMON_TYPE_BUG", name: "Bug" },
  { type: "POKEMON_TYPE_DARK", name: "Dark" },
  { type: "POKEMON_TYPE_DRAGON", name: "Dragon" },
  { type: "POKEMON_TYPE_ELECTRIC", name: "Electric" },
  { type: "POKEMON_TYPE_FAIRY", name: "Fairy" },
  { type: "POKEMON_TYPE_FIGHTING", name: "Fighting" },
  { type: "POKEMON_TYPE_FIRE", name: "Fire" },
  { type: "POKEMON_TYPE_FLYING", name: "Flying" },
  { type: "POKEMON_TYPE_GHOST", name: "Ghost" },
  { type: "POKEMON_TYPE_GRASS", name: "Grass" },
  { type: "POKEMON_TYPE_GROUND", name: "Ground" },
  { type: "POKEMON_TYPE_ICE", name: "Ice" },
  { type: "POKEMON_TYPE_NORMAL", name: "Normal" },
  { type: "POKEMON_TYPE_POISON", name: "Poison" },
  { type: "POKEMON_TYPE_PSYCHIC", name: "Psychic" },
  { type: "POKEMON_TYPE_ROCK", name: "Rock" },
  { type: "POKEMON_TYPE_STEEL", name: "Steel" },
  { type: "POKEMON_TYPE_WATER", name: "Water" },
];

/**
 * Finds the best combo for a Pokemon where the charge move matches the target type.
 * Searches both regular and elite movesets.
 */
function findBestComboForType(
  pokemon: Pokemon,
  targetType: string
): { combo: MovesetCombo; isElite: boolean } | null {
  if (!pokemon.computed) return null;

  // Build a lookup of all cinematic moves by ID (regular + elite) to check type
  const allCinematicMoves = new Map<string, Move>();
  for (const m of pokemon.cinematicMoves) {
    allCinematicMoves.set(m.id, m);
  }
  for (const m of pokemon.eliteCinematicMoves) {
    allCinematicMoves.set(m.id, m);
  }

  // Check regular movesets first
  const regularQuickIds = new Set(pokemon.quickMoves.map((m) => m.id));
  const regularCinematicIds = new Set(pokemon.cinematicMoves.map((m) => m.id));

  let bestRegular: MovesetCombo | null = null;
  for (const combo of pokemon.computed.movesets.regular) {
    const chargeMove = allCinematicMoves.get(combo.cinematicMove);
    if (chargeMove && chargeMove.type.type === targetType) {
      bestRegular = combo;
      break; // Already sorted by TDO desc, so first match is best
    }
  }

  let bestElite: MovesetCombo | null = null;
  for (const combo of pokemon.computed.movesets.elite) {
    const chargeMove = allCinematicMoves.get(combo.cinematicMove);
    if (chargeMove && chargeMove.type.type === targetType) {
      bestElite = combo;
      break;
    }
  }

  // Pick the better of regular vs elite
  if (bestRegular && bestElite) {
    if (bestElite.tdo > bestRegular.tdo) {
      return { combo: bestElite, isElite: true };
    }
    return { combo: bestRegular, isElite: false };
  }

  if (bestElite) return { combo: bestElite, isElite: true };
  if (bestRegular) return { combo: bestRegular, isElite: false };
  return null;
}

/**
 * Generates per-type ranking data from computed Pokemon.
 */
export function generateTypeRankings(
  pokemon: Pokemon[]
): Map<string, TypeRankingFile> {
  const rankings = new Map<string, TypeRankingFile>();

  for (const typeInfo of POKEMON_TYPES) {
    const entries: TypeRankingEntry[] = [];

    for (const p of pokemon) {
      const result = findBestComboForType(p, typeInfo.type);
      if (result) {
        entries.push({
          dexNr: p.dexNr,
          name: p.name,
          id: p.id,
          formId: p.formId,
          quickMove: result.combo.quickMove,
          cinematicMove: result.combo.cinematicMove,
          comboDps: result.combo.comboDps,
          comboDpsAtk: result.combo.comboDpsAtk,
          tdo: result.combo.tdo,
          isElite: result.isElite,
        });
      }
    }

    // Sort by TDO descending
    entries.sort((a, b) => b.tdo - a.tdo);

    rankings.set(typeInfo.type, {
      type: typeInfo,
      rankings: entries,
    });
  }

  return rankings;
}

/**
 * Writes type ranking files to the output directory.
 * Creates:
 *   - /api/rankings/index.json (list of available types)
 *   - /api/rankings/{type-name}.json (per-type rankings)
 */
export async function writeRankings(
  pokemon: Pokemon[],
  outputDir: string = OUTPUT_DIR
): Promise<number> {
  await mkdir(outputDir, { recursive: true });

  const rankings = generateTypeRankings(pokemon);
  let filesWritten = 0;

  const indexEntries: { type: string; name: string; file: string }[] = [];

  for (const [, ranking] of rankings) {
    // Convert type name to filename: "Fire" → "fire.json"
    const fileName = ranking.type.name.toLowerCase() + ".json";
    const filePath = join(outputDir, fileName);

    await writeFile(filePath, JSON.stringify(ranking, null, 2), "utf-8");
    filesWritten++;

    indexEntries.push({
      type: ranking.type.type,
      name: ranking.type.name,
      file: fileName,
    });
  }

  // Sort index alphabetically by name
  indexEntries.sort((a, b) => a.name.localeCompare(b.name));

  // Write index
  const indexPath = join(outputDir, "index.json");
  await writeFile(indexPath, JSON.stringify(indexEntries, null, 2), "utf-8");
  filesWritten++;

  return filesWritten;
}
