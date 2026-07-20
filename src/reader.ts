import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Pokemon, Move, StoredMove, StoredPokemon } from "./types.js";

const DEFAULT_DATA_DIR = "data/pokemon";

/**
 * Converts a StoredMove (no computed fields) to a Move with
 * computed fields initialized to zero (filled in by calculators).
 */
function toMove(stored: StoredMove): Move {
  return {
    ...stored,
    computed: { dps: 0, stabDps: 0 },
  };
}

/**
 * Converts a StoredPokemon (no computed fields on moves) to a Pokemon
 * ready for the calculator pipeline.
 */
export function toPokemon(stored: StoredPokemon): Pokemon {
  return {
    id: stored.id,
    formId: stored.formId,
    dexNr: stored.dexNr,
    generation: stored.generation,
    name: stored.name,
    stats: stored.stats,
    primaryType: stored.primaryType,
    secondaryType: stored.secondaryType,
    pokemonClass: stored.pokemonClass,
    quickMoves: stored.quickMoves.map(toMove),
    cinematicMoves: stored.cinematicMoves.map(toMove),
    eliteQuickMoves: stored.eliteQuickMoves.map(toMove),
    eliteCinematicMoves: stored.eliteCinematicMoves.map(toMove),
    assets: stored.assets,
    evolutions: stored.evolutions,
    hasMegaEvolution: stored.hasMegaEvolution,
    megaEvolutions: stored.megaEvolutions,
    computed: null,
  };
}

/**
 * Reads all stored Pokemon data files from the given directory.
 * Handles multi-form files (with `forms` array) by flattening
 * them into individual Pokemon entries.
 *
 * Returns Pokemon[] ready for the calculator pipeline.
 */
export async function readPokedex(
  dataDir: string = DEFAULT_DATA_DIR
): Promise<Pokemon[]> {
  const files = await readdir(dataDir);
  const jsonFiles = files.filter((f) => f.endsWith(".json"));

  const pokemon: Pokemon[] = [];

  for (const file of jsonFiles) {
    const filePath = join(dataDir, file);
    const content = await readFile(filePath, "utf-8");
    const stored: StoredPokemon = JSON.parse(content);

    // Add the primary form
    pokemon.push(toPokemon(stored));

    // Flatten additional forms if present
    if (stored.forms && stored.forms.length > 0) {
      for (const form of stored.forms) {
        pokemon.push(toPokemon(form));
      }
    }
  }

  return pokemon;
}
