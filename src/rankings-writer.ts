import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Pokemon, MovesetCombo, Move } from "./types.js";
import { computeRealStats, computeER } from "./calculators/tdo.js";
import { ER_ALPHA } from "./config.js";

const OUTPUT_DIR = "public/api/rankings";

/** A single entry in the type rankings file */
export interface TypeRankingEntry {
  dexNr: number;
  name: string;
  id: string;
  formId: string;
  quickMove: string;
  cinematicMove: string;
  dps: number;
  tdo: number;
  er: number;
  isElite: boolean;
  variant: "shadow" | "mega" | null;
  variantName: string | null;
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

/** STAB multiplier */
const STAB_MULTIPLIER = 1.2;

/** Neutral enemy constant */
const ENEMY_DPS_CONSTANT = 900;

/**
 * Computes type-specific DPS for a moveset combo targeting a specific type.
 *
 * For type-specific rankings, DPS counts only the charge move's damage of the
 * target type. The fast move contributes energy generation but its off-type
 * damage does not count toward the type DPS.
 *
 * Type DPS = (charge_damage_per_cycle / cycle_time) × ATK_real
 * Type TDO = Type DPS × HP × DEF / 900
 * Type ER  = Type_DPS^α × Type_TDO^(1-α)
 */
function computeTypeSpecificER(
  pokemon: Pokemon,
  quickMoveId: string,
  cinematicMoveId: string,
  targetType: string
): { dps: number; tdo: number; er: number } | null {
  if (!pokemon.stats) return null;

  // Find the actual move objects
  const allQuick = [...pokemon.quickMoves, ...pokemon.eliteQuickMoves];
  const allCinematic = [...pokemon.cinematicMoves, ...pokemon.eliteCinematicMoves];

  const quickMove = allQuick.find((m) => m.id === quickMoveId);
  const cinematicMove = allCinematic.find((m) => m.id === cinematicMoveId);
  if (!quickMove || !cinematicMove) return null;

  const realStats = computeRealStats(pokemon.stats);

  const fastDuration = quickMove.durationMs / 1000;
  if (fastDuration <= 0 || quickMove.energy <= 0) return null;

  const energyCost = Math.abs(cinematicMove.energy);
  if (energyCost <= 0) return null;

  const chargeDuration = cinematicMove.durationMs / 1000;

  // Energy per fast move use
  const feps = quickMove.energy / fastDuration;

  // Number of fast moves to charge one charge move
  const nFast = Math.ceil(energyCost / quickMove.energy);

  // Total cycle time
  const cycleTime = nFast * fastDuration + chargeDuration;
  if (cycleTime <= 0) return null;

  // STAB on charge move (if Pokemon's type matches the charge move type)
  const chargeStab =
    cinematicMove.type.type === pokemon.primaryType.type ||
    cinematicMove.type.type === pokemon.secondaryType?.type
      ? STAB_MULTIPLIER
      : 1.0;

  // Fast move STAB (for total DPS calculation — fast move damage counts for TDO)
  const fastStab =
    quickMove.type.type === pokemon.primaryType.type ||
    quickMove.type.type === pokemon.secondaryType?.type
      ? STAB_MULTIPLIER
      : 1.0;

  // Type-specific DPS: only charge move damage of target type counts
  // But fast move damage of target type also counts if it matches
  const fastTypeMultiplier = quickMove.type.type === targetType ? 1.0 : 0.0;
  const chargeTypeMultiplier = cinematicMove.type.type === targetType ? 1.0 : 0.0;

  const typeDmgPerCycle =
    nFast * quickMove.power * fastStab * fastTypeMultiplier +
    cinematicMove.power * chargeStab * chargeTypeMultiplier;

  const typeDps = (typeDmgPerCycle / cycleTime) * realStats.atkReal;

  // TDO uses the FULL comprehensive DPS (all damage types) for survivability
  // because the Pokemon deals total damage while alive
  const totalDmgPerCycle =
    nFast * quickMove.power * fastStab +
    cinematicMove.power * chargeStab;
  const totalDps = (totalDmgPerCycle / cycleTime) * realStats.atkReal;
  const tdo = totalDps * realStats.hpReal * realStats.defReal / ENEMY_DPS_CONSTANT;

  // ER uses type-specific DPS (rewards fire specialists) but full TDO (rewards bulk)
  const er = computeER(typeDps, tdo);

  return {
    dps: Math.round(typeDps * 100) / 100,
    tdo: Math.round(tdo * 100) / 100,
    er: Math.round(er * 100) / 100,
  };
}

/**
 * Finds the best combo for a Pokemon where the charge move matches the target type.
 * Computes type-specific ER for ranking purposes.
 * Searches both regular and elite movesets.
 */
function findBestComboForType(
  pokemon: Pokemon,
  targetType: string
): { combo: MovesetCombo; isElite: boolean; typeER: { dps: number; tdo: number; er: number } } | null {
  if (!pokemon.computed) return null;

  // Build a lookup of all cinematic moves by ID (regular + elite) to check type
  const allCinematicMoves = new Map<string, Move>();
  for (const m of pokemon.cinematicMoves) {
    allCinematicMoves.set(m.id, m);
  }
  for (const m of pokemon.eliteCinematicMoves) {
    allCinematicMoves.set(m.id, m);
  }

  const regularQuickIds = new Set(pokemon.quickMoves.map((m) => m.id));
  const regularCinematicIds = new Set(pokemon.cinematicMoves.map((m) => m.id));

  // Collect all type-matching combos with their type-specific ER
  interface Candidate {
    combo: MovesetCombo;
    isElite: boolean;
    typeER: { dps: number; tdo: number; er: number };
  }

  const candidates: Candidate[] = [];

  // Check all combos (regular + elite) that have matching charge move
  const allCombos = [
    ...pokemon.computed.movesets.regular.map((c) => ({ combo: c, isElite: false })),
    ...pokemon.computed.movesets.elite.map((c) => ({ combo: c, isElite: true })),
  ];

  for (const { combo, isElite } of allCombos) {
    const chargeMove = allCinematicMoves.get(combo.cinematicMove);
    if (!chargeMove || chargeMove.type.type !== targetType) continue;

    const typeER = computeTypeSpecificER(
      pokemon,
      combo.quickMove,
      combo.cinematicMove,
      targetType
    );
    if (!typeER || typeER.er <= 0) continue;

    candidates.push({ combo, isElite, typeER });
  }

  if (candidates.length === 0) return null;

  // Sort by type-specific ER and pick the best
  candidates.sort((a, b) => b.typeER.er - a.typeER.er);
  return candidates[0];
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
          dps: result.typeER.dps,
          tdo: result.typeER.tdo,
          er: result.typeER.er,
          isElite: result.isElite,
          variant: p.variant ?? null,
          variantName: p.variantName ?? null,
        });
      }
    }

    // Sort by ER descending (DPS-weighted composite score)
    entries.sort((a, b) => b.er - a.er);

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
