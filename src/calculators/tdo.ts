import type { Calculator } from "./index.js";
import type {
  Pokemon,
  Move,
  PokemonStats,
  PokemonRealStats,
  MovesetCombo,
  PokemonComputed,
} from "../types.js";

/** CPM at Level 50 (max non-Best-Buddy level) */
const CPM_50 = 0.84029999;

/** Perfect IVs */
const IV = 15;

/** Same-type attack bonus multiplier */
const STAB_MULTIPLIER = 1.2;

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
 * Computes TDO for a single fast + charge move combination.
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

  // Energy per second from fast move
  const eps = quickMove.energy / fastDuration;

  // Number of fast moves needed to charge one charge move
  const nFast = Math.ceil(energyCost / (eps * fastDuration));

  // Total cycle time: n fast moves + 1 charge move
  const cycleTime = nFast * fastDuration + chargeDuration;
  if (cycleTime <= 0) return null;

  // STAB bonuses
  const fastStab = isStab(quickMove, pokemon) ? STAB_MULTIPLIER : 1.0;
  const chargeStab = isStab(cinematicMove, pokemon) ? STAB_MULTIPLIER : 1.0;

  // Cycle-average DPS (without Attack stat)
  const comboDps =
    (nFast * quickMove.power * fastStab +
      cinematicMove.power * chargeStab) /
    cycleTime;

  // DPS × real Attack
  const comboDpsAtk = comboDps * realStats.atkReal;

  // TDO = combo_dps_atk × HP × Defense
  const tdo = comboDpsAtk * realStats.hpReal * realStats.defReal;

  return {
    quickMove: quickMove.id,
    cinematicMove: cinematicMove.id,
    comboDps: Math.round(comboDps * 100) / 100,
    comboDpsAtk: Math.round(comboDpsAtk * 100) / 100,
    tdo: Math.round(tdo * 100) / 100,
  };
}

/**
 * Brute-forces all fast × charge combinations and returns them sorted by TDO descending.
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

  // Sort by TDO descending
  combos.sort((a, b) => b.tdo - a.tdo);
  return combos;
}

/**
 * TDO Calculator — computes ranked moveset combinations for each Pokemon.
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
