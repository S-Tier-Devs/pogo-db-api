/**
 * Pokémon GO type effectiveness chart.
 *
 * Multipliers:
 *   Super effective:       1.6
 *   Not very effective:    0.625
 *   Immune (MSG):          0.391 (double-resisted in GO)
 *   Neutral:               1.0
 *
 * For dual-type defenders, multiply the effectiveness against each type.
 */

/** Pokémon GO effectiveness multipliers */
const SE = 1.6; // Super effective
const NVE = 0.625; // Not very effective
const IMM = 0.390625; // "Immune" (0.625 × 0.625)
const N = 1.0; // Neutral

/**
 * Type indices for the effectiveness matrix.
 * Order matches standard Pokémon type chart.
 */
const TYPE_INDEX: Record<string, number> = {
  POKEMON_TYPE_NORMAL: 0,
  POKEMON_TYPE_FIGHTING: 1,
  POKEMON_TYPE_FLYING: 2,
  POKEMON_TYPE_POISON: 3,
  POKEMON_TYPE_GROUND: 4,
  POKEMON_TYPE_ROCK: 5,
  POKEMON_TYPE_BUG: 6,
  POKEMON_TYPE_GHOST: 7,
  POKEMON_TYPE_STEEL: 8,
  POKEMON_TYPE_FIRE: 9,
  POKEMON_TYPE_WATER: 10,
  POKEMON_TYPE_GRASS: 11,
  POKEMON_TYPE_ELECTRIC: 12,
  POKEMON_TYPE_PSYCHIC: 13,
  POKEMON_TYPE_ICE: 14,
  POKEMON_TYPE_DRAGON: 15,
  POKEMON_TYPE_DARK: 16,
  POKEMON_TYPE_FAIRY: 17,
};

/**
 * 18×18 type effectiveness matrix.
 * Row = attacking type, Column = defending type.
 * CHART[attacker][defender] = multiplier
 *
 * Order: Normal, Fighting, Flying, Poison, Ground, Rock, Bug, Ghost, Steel,
 *        Fire, Water, Grass, Electric, Psychic, Ice, Dragon, Dark, Fairy
 */
// prettier-ignore
const CHART: number[][] = [
  //          Nor   Fig   Fly   Poi   Gro   Roc   Bug   Gho   Ste   Fir   Wat   Gra   Ele   Psy   Ice   Dra   Dar   Fai
  /* Normal */  [N,    N,    N,    N,    N,    NVE,  N,    IMM,  NVE,  N,    N,    N,    N,    N,    N,    N,    N,    N],
  /* Fighting */[SE,   N,    NVE,  NVE,  N,    SE,   NVE,  IMM,  SE,   N,    N,    N,    N,    NVE,  SE,   N,    SE,   NVE],
  /* Flying */ [N,    SE,   N,    N,    N,    NVE,  SE,   N,    NVE,  N,    N,    SE,   NVE,  N,    N,    N,    N,    N],
  /* Poison */ [N,    N,    N,    NVE,  NVE,  NVE,  N,    NVE,  IMM,  N,    N,    SE,   N,    N,    N,    N,    N,    SE],
  /* Ground */ [N,    N,    IMM,  SE,   N,    SE,   NVE,  N,    SE,   SE,   N,    NVE,  SE,   N,    N,    N,    N,    N],
  /* Rock */   [N,    NVE,  SE,   N,    NVE,  N,    SE,   N,    NVE,  SE,   N,    N,    N,    N,    SE,   N,    N,    N],
  /* Bug */    [N,    NVE,  NVE,  NVE,  N,    N,    N,    NVE,  NVE,  NVE,  N,    SE,   N,    SE,   N,    N,    SE,   NVE],
  /* Ghost */  [IMM,  N,    N,    N,    N,    N,    N,    SE,   N,    N,    N,    N,    N,    SE,   N,    N,    NVE,  N],
  /* Steel */  [N,    N,    N,    N,    N,    SE,   N,    N,    NVE,  NVE,  NVE,  N,    NVE,  N,    SE,   N,    N,    SE],
  /* Fire */   [N,    N,    N,    N,    N,    NVE,  SE,   N,    SE,   NVE,  NVE,  SE,   N,    N,    SE,   NVE,  N,    N],
  /* Water */  [N,    N,    N,    N,    SE,   SE,   N,    N,    N,    SE,   NVE,  NVE,  N,    N,    N,    NVE,  N,    N],
  /* Grass */  [N,    N,    NVE,  NVE,  SE,   SE,   NVE,  N,    NVE,  NVE,  SE,   NVE,  N,    N,    N,    NVE,  N,    N],
  /* Electric*/[N,    N,    SE,   N,    IMM,  N,    N,    N,    NVE,  N,    SE,   NVE,  NVE,  N,    N,    NVE,  N,    N],
  /* Psychic */[N,    SE,   N,    SE,   N,    N,    N,    N,    NVE,  N,    N,    N,    N,    NVE,  N,    N,    IMM,  N],
  /* Ice */    [N,    N,    SE,   N,    SE,   N,    N,    N,    NVE,  NVE,  NVE,  SE,   N,    N,    NVE,  SE,   N,    N],
  /* Dragon */ [N,    N,    N,    N,    N,    N,    N,    N,    NVE,  N,    N,    N,    N,    N,    N,    SE,   N,    IMM],
  /* Dark */   [N,    NVE,  N,    N,    N,    N,    N,    SE,   N,    N,    N,    N,    N,    SE,   N,    N,    NVE,  NVE],
  /* Fairy */  [N,    SE,   N,    NVE,  N,    N,    N,    N,    NVE,  NVE,  N,    N,    N,    N,    N,    SE,   SE,   N],
];

/**
 * Gets the type effectiveness multiplier for an attacking move type
 * against a single defending type.
 *
 * Returns 1.0 if either type is unknown.
 */
function getSingleEffectiveness(attackType: string, defenseType: string): number {
  const atkIdx = TYPE_INDEX[attackType];
  const defIdx = TYPE_INDEX[defenseType];
  if (atkIdx === undefined || defIdx === undefined) return N;
  return CHART[atkIdx][defIdx];
}

/**
 * Gets the combined type effectiveness multiplier for an attacking move type
 * against a defender's full typing (primary + optional secondary).
 *
 * For dual-type defenders, the multipliers are multiplied together.
 * e.g., Ice vs Dragon/Flying = 1.6 × 1.6 = 2.56
 *
 * @param moveType - The attacking move's type (e.g., "POKEMON_TYPE_ICE")
 * @param defenderPrimary - Defender's primary type
 * @param defenderSecondary - Defender's secondary type (null if mono-type)
 * @returns Combined effectiveness multiplier
 */
export function getEffectiveness(
  moveType: string,
  defenderPrimary: string,
  defenderSecondary: string | null
): number {
  const primary = getSingleEffectiveness(moveType, defenderPrimary);
  if (!defenderSecondary) return primary;
  const secondary = getSingleEffectiveness(moveType, defenderSecondary);
  return primary * secondary;
}
