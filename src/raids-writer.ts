import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fetchRaidPage } from "./raids/fetcher.js";
import { parseRaidPage, type RaidBoss, type RaidEvent } from "./raids/parser.js";
import { createMatcher, type PokemonIndexEntry } from "./raids/matcher.js";

const OUTPUT_PATH = "public/api/raids/current.json";
const INDEX_PATH = "public/api/pokemon/index.json";

/** A raid boss entry in the output JSON (with dexNr cross-reference) */
export interface RaidBossOutput {
  name: string;
  tier: number;
  shadow: boolean;
  types: string[];
  cpRange: { min: number; max: number } | null;
  boostedCpRange: { min: number; max: number } | null;
  weatherBoosts: string[];
  dexNr: number | null;
}

/** The full raids API output shape */
export interface RaidsOutput {
  lastUpdated: string;
  event: RaidEvent | null;
  raids: RaidBossOutput[];
}

/**
 * Loads the Pokemon index from the build output directory.
 */
async function loadPokemonIndex(
  indexPath: string = INDEX_PATH
): Promise<PokemonIndexEntry[]> {
  const content = await readFile(indexPath, "utf-8");
  return JSON.parse(content) as PokemonIndexEntry[];
}

/**
 * Transforms parsed raid bosses into output format with dexNr cross-references.
 */
export function buildRaidsOutput(
  raids: RaidBoss[],
  event: RaidEvent | null,
  match: (name: string) => number | null
): RaidsOutput {
  const raidEntries: RaidBossOutput[] = raids.map((boss) => ({
    name: boss.name,
    tier: boss.tier,
    shadow: boss.shadow,
    types: boss.types,
    cpRange: boss.cpRange,
    boostedCpRange: boss.boostedCpRange,
    weatherBoosts: boss.weatherBoosts,
    dexNr: match(boss.name),
  }));

  return {
    lastUpdated: new Date().toISOString(),
    event,
    raids: raidEntries,
  };
}

/**
 * Fetches, parses, and writes the current raid bosses JSON file.
 * Returns true if the file was written, false if skipped (fetch failure).
 *
 * Silently skips if:
 * - Fetch fails (network error, timeout, HTTP error)
 * - No raid bosses found in parsed HTML
 */
export async function writeRaids(
  outputPath: string = OUTPUT_PATH,
  indexPath: string = INDEX_PATH
): Promise<boolean> {
  // Fetch the page
  const html = await fetchRaidPage();
  if (!html) {
    console.warn("⚠️  Skipping raids — fetch returned no data");
    return false;
  }

  // Parse the HTML
  const { event, raids } = parseRaidPage(html);
  if (raids.length === 0) {
    console.warn("⚠️  Skipping raids — no raid bosses found in HTML");
    return false;
  }

  // Load the Pokemon index for name matching
  const pokemonIndex = await loadPokemonIndex(indexPath);
  const match = createMatcher(pokemonIndex);

  // Build the output
  const output = buildRaidsOutput(raids, event, match);

  // Write the file
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(output, null, 2), "utf-8");

  return true;
}
