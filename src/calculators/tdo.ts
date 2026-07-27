import type { Calculator } from "./index.js";
import type {
  Pokemon,
  Move,
  PokemonStats,
  PokemonRealStats,
  MovesetCombo,
  PokemonComputed,
} from "../types.js";
import { ER_ALPHA } from "../config.js";

/** CPM at Level 50 (max non-Best-Buddy level) */
const CPM_50 = 0.84029999;

/** Perfect IVs */
const IV = 15;

/** Same-type attack bonus multiplier */
const STAB_MULTIPLIER = 1.2;

/**
 * Neutral enemy DPS approximation constant.
 * Standard Gamepress assumption: enemy_DPS = 900 / DEF_real
 * This means TDO = DPS × HP_real × DEF_real / 900
 */
const ENEMY_DPS_CONSTANT = 900;

/**
 * Computes real stats at Level 50 with 15/15/15 IVs.
 */
export function computeRealStats(stats: PokemonStats): PokemonRealStats {
  return {
    atkReal: Math.round((stats.attack + IV) * CPM_50 * 100) / 100,
    defReal: Math.round((stats.defense + IV) * CPM_50 * 100) / 100,
    hpReal: Math.floor((stats.stamina + IV) * CPM_50),
  };
}

/**
 * Determines if a move gets STAB for a given Pokemon.
 */
function isStab(move: Move, pokemon: Pokemon): boolean {
  return (
    move.type.type === pokemon.primaryType.type ||
    move.type.type === pokemon.secondaryType?.type
  );
}

/**
 * Computes the Equivalent Rating (ER) composite score.
 * ER = DPS^α × TDO^(1-α)
 *
 * This balances raw DPS (how fast damage is dealt) with survivability (how long
 * the Pokemon lasts). With α = 0.75, DPS is weighted 3× more than TDO.
 */
export function computeER(dps: number, tdo: number, alpha: number = ER_ALPHA): number {
  if (dps <= 0 || tdo <= 0) return 0;
  return Math.pow(dps, alpha) * Math.pow(tdo, 1 - alpha);
}

/**
 * Computes comprehensive DPS for a single fast + charge move combination.
 *
 * Uses the Gamepress comprehensive DPS formula with neutral enemy assumptions:
 * - Enemy DPS (y) = 900 / DEF_real
 * - Wasted energy (x) = 0.5 * CE + 0.5 * FE
 *
 * Formula:
 *   DPS0 = (FDPS * CEPS + CDPS * FEPS) / (CEPS + FEPS)
 *   DPS  = DPS0 + (CDPS - FDPS) / (CEPS + FEPS) * (0.5 - x/HP) * y
 *
 * Then multiplied by ATK_real to get actual damage output rate.
 *
 * TDO = DPS * HP_real * DEF_real / 900
 * ER  = DPS^α * TDO^(1-α)
 *
 * Returns null if the combo is invalid (e.g., zero energy/duration).
 */
export function computeCombo(
  quickMove: Move,
  cinematicMove: Move,
  pokemon: Pokemon,
  realStats: PokemonRealStats
): MovesetCombo | null {
  const fastDuration = quickMove.durationMs / 1000;

  // Guard against invalid moves
  if (fastDuration <= 0 || quickMove.energy <= 0) return null;

  const energyCost = Math.abs(cinematicMove.energy);
  if (energyCost <= 0) return null;

  const chargeDuration = cinematicMove.durationMs / 1000;
  if (chargeDuration < 0) return null;

  // STAB bonuses
  const fastStab = isStab(quickMove, pokemon) ? STAB_MULTIPLIER : 1.0;
  const chargeStab = isStab(cinematicMove, pokemon) ? STAB_MULTIPLIER : 1.0;

  // Fast move DPS and EPS (energy per second)
  const fdps = (quickMove.power * fastStab) / fastDuration;
  const feps = quickMove.energy / fastDuration;

  // Charge move DPS and EPS (energy cost per second of charge move duration)
  const cdps = (cinematicMove.power * chargeStab) / chargeDuration;
  const ceps = energyCost / chargeDuration;

  // Guard against zero denominator
  if (ceps + feps <= 0) return null;

  // Simple cycle DPS (DPS0) — Gamepress formula
  const dps0 = (fdps * ceps + cdps * feps) / (ceps + feps);

  // Neutral enemy assumptions
  const y = ENEMY_DPS_CONSTANT / realStats.defReal; // enemy DPS
  const x = 0.5 * energyCost + 0.5 * quickMove.energy; // expected wasted energy
  const hp = realStats.hpReal;

  // Comprehensive DPS adjustment
  const energyEfficiency = (cdps - fdps) / (ceps + feps);
  const survivalFactor = (0.5 - x / hp) * y;
  let comprehensiveDps = dps0 + energyEfficiency * survivalFactor;

  // Floor at fast move DPS (minimum useful output)
  if (comprehensiveDps < fdps) comprehensiveDps = fdps;

  // Apply Attack stat for actual damage output rate
  const dps = comprehensiveDps * realStats.atkReal;

  // TDO = DPS × HP × DEF / 900 (total damage before fainting)
  const tdo = dps * hp * realStats.defReal / ENEMY_DPS_CONSTANT;

  // ER composite score
  const er = computeER(dps, tdo);

  return {
    quickMove: quickMove.id,
    cinematicMove: cinematicMove.id,
    dps: Math.round(dps * 100) / 100,
    tdo: Math.round(tdo * 100) / 100,
    er: Math.round(er * 100) / 100,
  };
}

/**
 * Brute-forces all fast × charge combinations and returns them sorted by ER descending.
 */
function rankCombos(
  quickMoves: Move[],
  cinematicMoves: Move[],
  pokemon: Pokemon,
  realStats: PokemonRealStats
): MovesetCombo[] {
  const combos: MovesetCombo[] = [];

  for (const quick of quickMoves) {
    for (const cinematic of cinematicMoves) {
      const combo = computeCombo(quick, cinematic, pokemon, realStats);
      if (combo) {
        combos.push(combo);
      }
    }
  }

  // Sort by ER descending
  combos.sort((a, b) => b.er - a.er);
  return combos;
}

/**
 * TDO Calculator — computes ranked moveset combinations for each Pokemon.
 *
 * Uses the Gamepress Comprehensive DPS formula with:
 * - Standard TDO: DPS × HP × DEF / 900
 * - ER composite: DPS^0.75 × TDO^0.25
 *
 * Credits:
 * - Gamepress: Comprehensive DPS formula
 * - u/Elastic_Space: ER (Equivalent Rating) metric
 * - u/Flyfunner, u/bmenrigh: New raid system research
 *
 * Produces two rankings:
 * - regular: only regularly available moves
 * - elite: combos that include at least one Elite TM move
 */
export const tdoCalculator: Calculator = {
  name: "tdo",
  compute(pokemon: Pokemon): Pokemon {
    // Skip Pokemon without stats (can't compute real stats)
    if (!pokemon.stats) {
      return pokemon;
    }

    const realStats = computeRealStats(pokemon.stats);

    // Regular movesets: regular quick × regular cinematic
    const regular = rankCombos(
      pokemon.quickMoves,
      pokemon.cinematicMoves,
      pokemon,
      realStats
    );

    // All available moves (regular + elite)
    const allQuick = [...pokemon.quickMoves, ...pokemon.eliteQuickMoves];
    const allCinematic = [
      ...pokemon.cinematicMoves,
      ...pokemon.eliteCinematicMoves,
    ];

    // All combos including elites
    const allCombos = rankCombos(allQuick, allCinematic, pokemon, realStats);

    // Elite set: only combos that use at least one elite move
    const regularQuickIds = new Set(pokemon.quickMoves.map((m) => m.id));
    const regularCinematicIds = new Set(pokemon.cinematicMoves.map((m) => m.id));

    const elite = allCombos.filter(
      (combo) =>
        !regularQuickIds.has(combo.quickMove) ||
        !regularCinematicIds.has(combo.cinematicMove)
    );

    const computed: PokemonComputed = {
      pokemon: realStats,
      movesets: { regular, elite },
    };

    return { ...pokemon, computed };
  },
};
