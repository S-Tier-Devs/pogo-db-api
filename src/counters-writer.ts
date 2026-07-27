import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Pokemon, Move, PokemonRealStats } from "./types.js";
import { computeRealStats, computeER } from "./calculators/tdo.js";
import { getEffectiveness } from "./type-effectiveness.js";
import { ER_ALPHA } from "./config.js";

const OUTPUT_DIR = "public/api/counters";

/** Maximum counters per file */
const TOP_N = 40;

/** STAB multiplier */
const STAB_MULTIPLIER = 1.2;

/** Neutral enemy DPS constant (Gamepress standard) */
const ENEMY_DPS_CONSTANT = 900;

/** A single counter entry in the output file */
export interface CounterEntry {
  dexNr: number;
  name: string;
  id: string;
  formId: string;
  quickMove: string;
  quickMoveName: string;
  quickMoveType: string;
  cinematicMove: string;
  cinematicMoveName: string;
  cinematicMoveType: string;
  dps: number;
  tdo: number;
  er: number;
  isElite: boolean;
  variant: "shadow" | "mega" | null;
  variantName: string | null;
}

/** The full counters file structure */
export interface CountersFile {
  target: {
    dexNr: number;
    name: string;
    id: string;
    primaryType: string;
    secondaryType: string | null;
  };
  counters: CounterEntry[];
}

/**
 * Computes effective DPS for a moveset combo against a specific target typing.
 *
 * Uses the Gamepress comprehensive DPS formula, but multiplies each move's
 * damage contribution by its type effectiveness against the target.
 * This allows mixed movesets (e.g., Psycho Cut + Ice Beam vs Dragon/Flying).
 *
 * The attacker's STAB bonuses are applied as normal.
 * Type effectiveness is applied on top of STAB.
 *
 * @returns { dps, tdo, er } or null if the combo is invalid
 */
export function computeEffectiveCombo(
  quickMove: Move,
  cinematicMove: Move,
  attacker: Pokemon,
  realStats: PokemonRealStats,
  defenderPrimary: string,
  defenderSecondary: string | null
): { dps: number; tdo: number; er: number } | null {
  const fastDuration = quickMove.durationMs / 1000;
  if (fastDuration <= 0 || quickMove.energy <= 0) return null;

  const energyCost = Math.abs(cinematicMove.energy);
  if (energyCost <= 0) return null;

  const chargeDuration = cinematicMove.durationMs / 1000;
  if (chargeDuration < 0) return null;

  // STAB bonuses (based on attacker's types)
  const fastStab =
    quickMove.type.type === attacker.primaryType.type ||
    quickMove.type.type === attacker.secondaryType?.type
      ? STAB_MULTIPLIER
      : 1.0;
  const chargeStab =
    cinematicMove.type.type === attacker.primaryType.type ||
    cinematicMove.type.type === attacker.secondaryType?.type
      ? STAB_MULTIPLIER
      : 1.0;

  // Type effectiveness against target
  const fastEff = getEffectiveness(
    quickMove.type.type,
    defenderPrimary,
    defenderSecondary
  );
  const chargeEff = getEffectiveness(
    cinematicMove.type.type,
    defenderPrimary,
    defenderSecondary
  );

  // Effective damage multipliers (STAB × type effectiveness)
  const fastMult = fastStab * fastEff;
  const chargeMult = chargeStab * chargeEff;

  // Fast move DPS and EPS
  const fdps = (quickMove.power * fastMult) / fastDuration;
  const feps = quickMove.energy / fastDuration;

  // Charge move DPS and EPS
  const cdps = (cinematicMove.power * chargeMult) / chargeDuration;
  const ceps = energyCost / chargeDuration;

  if (ceps + feps <= 0) return null;

  // Gamepress comprehensive DPS formula
  const dps0 = (fdps * ceps + cdps * feps) / (ceps + feps);

  const y = ENEMY_DPS_CONSTANT / realStats.defReal;
  const x = 0.5 * energyCost + 0.5 * quickMove.energy;
  const hp = realStats.hpReal;

  const energyEfficiency = (cdps - fdps) / (ceps + feps);
  const survivalFactor = (0.5 - x / hp) * y;
  let comprehensiveDps = dps0 + energyEfficiency * survivalFactor;

  // Floor at fast move DPS
  if (comprehensiveDps < fdps) comprehensiveDps = fdps;

  // Apply Attack stat
  const dps = comprehensiveDps * realStats.atkReal;

  // TDO uses effective DPS (attacker deals more total damage when moves are SE)
  const tdo = (dps * hp * realStats.defReal) / ENEMY_DPS_CONSTANT;

  // ER composite score
  const er = computeER(dps, tdo, ER_ALPHA);

  return {
    dps: Math.round(dps * 100) / 100,
    tdo: Math.round(tdo * 100) / 100,
    er: Math.round(er * 100) / 100,
  };
}

/**
 * Finds the best counter moveset for an attacker against a target's typing.
 * Brute-forces all fast × charge combinations (regular + elite).
 *
 * @returns The best combo by ER, or null if no valid combo exists
 */
export function findBestCounter(
  attacker: Pokemon,
  defenderPrimary: string,
  defenderSecondary: string | null
): {
  quickMove: Move;
  cinematicMove: Move;
  isElite: boolean;
  dps: number;
  tdo: number;
  er: number;
} | null {
  if (!attacker.stats) return null;

  const realStats = computeRealStats(attacker.stats);

  const allQuick = [...attacker.quickMoves, ...attacker.eliteQuickMoves];
  const allCinematic = [
    ...attacker.cinematicMoves,
    ...attacker.eliteCinematicMoves,
  ];

  // Track which moves are elite
  const eliteQuickIds = new Set(attacker.eliteQuickMoves.map((m) => m.id));
  const eliteCinematicIds = new Set(
    attacker.eliteCinematicMoves.map((m) => m.id)
  );

  let best: {
    quickMove: Move;
    cinematicMove: Move;
    isElite: boolean;
    dps: number;
    tdo: number;
    er: number;
  } | null = null;

  for (const quick of allQuick) {
    for (const cinematic of allCinematic) {
      const result = computeEffectiveCombo(
        quick,
        cinematic,
        attacker,
        realStats,
        defenderPrimary,
        defenderSecondary
      );
      if (!result) continue;

      if (!best || result.er > best.er) {
        const isElite =
          eliteQuickIds.has(quick.id) || eliteCinematicIds.has(cinematic.id);
        best = {
          quickMove: quick,
          cinematicMove: cinematic,
          isElite,
          dps: result.dps,
          tdo: result.tdo,
          er: result.er,
        };
      }
    }
  }

  return best;
}

/**
 * Generates the top N counters for a target Pokémon.
 *
 * @param target - The raid boss / defender
 * @param allAttackers - All available attacker Pokémon (with computed stats)
 * @returns Sorted array of top counter entries
 */
export function generateCounters(
  target: Pokemon,
  allAttackers: Pokemon[]
): CounterEntry[] {
  const defPrimary = target.primaryType.type;
  const defSecondary = target.secondaryType?.type ?? null;

  const entries: CounterEntry[] = [];

  for (const attacker of allAttackers) {
    // Skip the target itself (same id)
    if (attacker.id === target.id) continue;

    const result = findBestCounter(attacker, defPrimary, defSecondary);
    if (!result) continue;

    entries.push({
      dexNr: attacker.dexNr,
      name: attacker.variantName ?? attacker.name,
      id: attacker.id,
      formId: attacker.formId,
      quickMove: result.quickMove.id,
      quickMoveName: result.quickMove.name,
      quickMoveType: result.quickMove.type.type,
      cinematicMove: result.cinematicMove.id,
      cinematicMoveName: result.cinematicMove.name,
      cinematicMoveType: result.cinematicMove.type.type,
      dps: result.dps,
      tdo: result.tdo,
      er: result.er,
      isElite: result.isElite,
      variant: attacker.variant ?? null,
      variantName: attacker.variantName ?? null,
    });
  }

  // Sort by ER descending, take top N
  entries.sort((a, b) => b.er - a.er);
  return entries.slice(0, TOP_N);
}

/**
 * Writes per-Pokémon counter files to the output directory.
 *
 * For each base-form Pokémon with stats, generates a counters file containing
 * the top 40 best attackers ranked by ER (type-effective DPS + TDO).
 *
 * Creates:
 *   - /api/counters/{dexNr}.json (per-Pokémon counter lists)
 *   - /api/counters/index.json (manifest of available counter files)
 */
export async function writeCounters(
  pokemon: Pokemon[],
  outputDir: string = OUTPUT_DIR
): Promise<number> {
  await mkdir(outputDir, { recursive: true });

  // Only generate counters for unique base forms (not variants — they share a dexNr)
  // Group by dexNr, pick the primary base form
  const targets = new Map<number, Pokemon>();
  for (const p of pokemon) {
    // Skip variants (shadow/mega) as targets — they share a dexNr with base
    if (p.variant) continue;
    // Skip Pokemon without stats
    if (!p.stats) continue;
    // Keep first base form per dexNr (same as writer.ts logic)
    if (!targets.has(p.dexNr)) {
      targets.set(p.dexNr, p);
    }
  }

  // All attackers (including shadows/megas — those ARE valid counters)
  const allAttackers = pokemon.filter((p) => p.stats !== null);

  const index: { dexNr: number; name: string; id: string }[] = [];
  let filesWritten = 0;

  for (const [dexNr, target] of targets) {
    const counters = generateCounters(target, allAttackers);

    const file: CountersFile = {
      target: {
        dexNr: target.dexNr,
        name: target.name,
        id: target.id,
        primaryType: target.primaryType.type,
        secondaryType: target.secondaryType?.type ?? null,
      },
      counters,
    };

    const filePath = join(outputDir, `${dexNr}.json`);
    await writeFile(filePath, JSON.stringify(file), "utf-8");
    filesWritten++;

    index.push({ dexNr, name: target.name, id: target.id });
  }

  // Sort index by dexNr
  index.sort((a, b) => a.dexNr - b.dexNr);

  const indexPath = join(outputDir, "index.json");
  await writeFile(indexPath, JSON.stringify(index), "utf-8");
  filesWritten++;

  return filesWritten;
}
