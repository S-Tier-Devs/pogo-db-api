/**
 * ===================================================
 * SEED SCRIPT — Populate data/pokemon/ from upstream
 * ===================================================
 *
 * This script fetches the full Pokédex from the upstream pokemon-go-api,
 * transforms it to English-only format, strips computed fields (DPS/STAB),
 * and writes individual JSON files to data/pokemon/.
 *
 * Usage:
 *   npm run seed
 *
 * The data files written by this script serve as the local database.
 * After seeding, the build pipeline reads these files, runs calculators,
 * and generates the public API output.
 *
 * This script can be re-run at any time to refresh data from upstream.
 * Existing files will be overwritten.
 */

import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";

import { fetchPokedex } from "./fetcher.js";
import { transformAll } from "./transformer.js";
import type { Pokemon, StoredPokemon, StoredMove, Move } from "./types.js";

const DATA_DIR = "data/pokemon";

/**
 * Strips the `computed` field from a Move, producing a StoredMove.
 */
export function stripComputed(move: Move): StoredMove {
  return {
    id: move.id,
    name: move.name,
    power: move.power,
    energy: move.energy,
    durationMs: move.durationMs,
    type: move.type,
    combat: move.combat,
  };
}

/**
 * Converts a Pokemon to a StoredPokemon (strips computed from all moves).
 */
export function toStoredPokemon(pokemon: Pokemon): StoredPokemon {
  return {
    id: pokemon.id,
    formId: pokemon.formId,
    dexNr: pokemon.dexNr,
    generation: pokemon.generation,
    name: pokemon.name,
    stats: pokemon.stats,
    primaryType: pokemon.primaryType,
    secondaryType: pokemon.secondaryType,
    pokemonClass: pokemon.pokemonClass,
    quickMoves: pokemon.quickMoves.map(stripComputed),
    cinematicMoves: pokemon.cinematicMoves.map(stripComputed),
    eliteQuickMoves: pokemon.eliteQuickMoves.map(stripComputed),
    eliteCinematicMoves: pokemon.eliteCinematicMoves.map(stripComputed),
    assets: pokemon.assets,
    evolutions: pokemon.evolutions,
    hasMegaEvolution: pokemon.hasMegaEvolution,
    megaEvolutions: pokemon.megaEvolutions,
  };
}

/**
 * Determines if a Pokemon entry is the "base" form (no regional/form suffix).
 * Base forms have formId equal to their id (e.g., CHARIZARD vs CHARIZARD_ALOLA).
 */
function isBaseForm(pokemon: Pokemon): boolean {
  return pokemon.id === pokemon.formId;
}

/**
 * Groups Pokemon by dexNr. If multiple forms share the same dexNr,
 * the base form (where id === formId) becomes the primary entry and
 * alternate forms (Alolan, Galarian, Hisuian, etc.) go into the `forms` array.
 *
 * If no clear base form is found, the first entry is used as primary.
 */
export function groupByDexNr(
  pokemon: Pokemon[]
): Map<number, StoredPokemon> {
  const groups = new Map<number, Pokemon[]>();

  for (const p of pokemon) {
    const existing = groups.get(p.dexNr) ?? [];
    existing.push(p);
    groups.set(p.dexNr, existing);
  }

  const result = new Map<number, StoredPokemon>();

  for (const [dexNr, forms] of groups) {
    // Prefer the base form as primary
    const baseIndex = forms.findIndex(isBaseForm);
    const primaryIndex = baseIndex >= 0 ? baseIndex : 0;

    const primaryPokemon = forms[primaryIndex];
    const alternateForms = forms.filter((_, i) => i !== primaryIndex);

    const primary = toStoredPokemon(primaryPokemon);

    if (alternateForms.length > 0) {
      primary.forms = alternateForms.map(toStoredPokemon);
    }

    result.set(dexNr, primary);
  }

  return result;
}

/**
 * Writes grouped Pokemon data to individual JSON files in the output directory.
 */
export async function writeSeedData(
  grouped: Map<number, StoredPokemon>,
  outputDir: string = DATA_DIR
): Promise<number> {
  await mkdir(outputDir, { recursive: true });

  let filesWritten = 0;

  for (const [dexNr, stored] of grouped) {
    const filePath = join(outputDir, `${dexNr}.json`);
    await writeFile(filePath, JSON.stringify(stored, null, 2), "utf-8");
    filesWritten++;
  }

  return filesWritten;
}

function elapsed(start: number): string {
  return ((performance.now() - start) / 1000).toFixed(2) + "s";
}

async function main(): Promise<void> {
  const seedStart = performance.now();
  console.log("🌱 Seed script started — fetching upstream data");

  // Step 1: Fetch upstream data
  const fetchStart = performance.now();
  const rawData = await fetchPokedex();
  console.log(`📥 Fetched ${rawData.length} pokemon in ${elapsed(fetchStart)}`);

  // Step 2: Transform to English-only format
  const transformStart = performance.now();
  const transformed = transformAll(rawData);
  console.log(`🔄 Transformed ${transformed.length} pokemon in ${elapsed(transformStart)}`);

  // Step 3: Group by dexNr and strip computed fields
  const groupStart = performance.now();
  const grouped = groupByDexNr(transformed);
  console.log(`📦 Grouped into ${grouped.size} entries in ${elapsed(groupStart)}`);

  // Step 4: Clean existing data and write new files
  const writeStart = performance.now();
  await rm(DATA_DIR, { recursive: true, force: true });
  const filesWritten = await writeSeedData(grouped);
  console.log(`💾 Wrote ${filesWritten} files to ${DATA_DIR}/ in ${elapsed(writeStart)}`);

  console.log(`✅ Seed complete in ${elapsed(seedStart)}`);
}

main().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
