/** Trimmed Pokemon type (English-only, with computed fields) */

export interface PokemonType {
  type: string;
  name: string;
}

export interface MoveComputedStats {
  dps: number;
  stabDps: number;
}

export interface MoveCombatStats {
  energy: number;
  power: number;
  turns: number;
  buffs: MoveBuffs | null;
}

export interface MoveBuffs {
  activationChance: number;
  attackerAttackStatsChange: number | null;
  attackerDefenseStatsChange: number | null;
  targetAttackStatsChange: number | null;
  targetDefenseStatsChange: number | null;
}

export interface Move {
  id: string;
  name: string;
  power: number;
  energy: number;
  durationMs: number;
  type: PokemonType;
  combat: MoveCombatStats | null;
  computed: MoveComputedStats;
}

export interface PokemonStats {
  stamina: number;
  attack: number;
  defense: number;
}

export interface Assets {
  image: string;
  shinyImage: string;
}

export interface Evolution {
  id: string;
  formId: string;
  candies: number;
}

export interface MegaEvolution {
  id: string;
  name: string;
  stats: PokemonStats;
  primaryType: PokemonType;
  secondaryType: PokemonType | null;
  assets: Assets;
}

/** Real stats at Level 50, 15/15/15 IVs */
export interface PokemonRealStats {
  atkReal: number;
  defReal: number;
  hpReal: number;
}

/** A single fast + charge move combination with computed TDO values */
export interface MovesetCombo {
  quickMove: string;
  cinematicMove: string;
  comboDps: number;
  comboDpsAtk: number;
  tdo: number;
}

/** Ranked moveset combinations, separated by availability */
export interface MovesetRankings {
  regular: MovesetCombo[];
  elite: MovesetCombo[];
}

/** Pokemon-level computed stats (calculated at build time) */
export interface PokemonComputed {
  pokemon: PokemonRealStats;
  movesets: MovesetRankings;
}

export interface Pokemon {
  id: string;
  formId: string;
  dexNr: number;
  generation: number;
  name: string;
  stats: PokemonStats | null;
  primaryType: PokemonType;
  secondaryType: PokemonType | null;
  pokemonClass: string | null;
  quickMoves: Move[];
  cinematicMoves: Move[];
  eliteQuickMoves: Move[];
  eliteCinematicMoves: Move[];
  assets: Assets | null;
  evolutions: Evolution[];
  hasMegaEvolution: boolean;
  megaEvolutions: MegaEvolution[];
  computed: PokemonComputed | null;
}

/** Stored data types (local database files in data/pokemon/) */

export interface StoredMove {
  id: string;
  name: string;
  power: number;
  energy: number;
  durationMs: number;
  type: PokemonType;
  combat: MoveCombatStats | null;
}

export interface StoredPokemon {
  id: string;
  formId: string;
  dexNr: number;
  generation: number;
  name: string;
  stats: PokemonStats | null;
  primaryType: PokemonType;
  secondaryType: PokemonType | null;
  pokemonClass: string | null;
  quickMoves: StoredMove[];
  cinematicMoves: StoredMove[];
  eliteQuickMoves: StoredMove[];
  eliteCinematicMoves: StoredMove[];
  assets: Assets | null;
  evolutions: Evolution[];
  hasMegaEvolution: boolean;
  megaEvolutions: MegaEvolution[];
  forms?: StoredPokemon[];
}

/** Raw upstream types (for typing the fetcher response) */
export interface RawUpstreamPokemon {
  id: string;
  formId: string;
  dexNr: number;
  generation: number;
  names: Record<string, string>;
  stats: { stamina: number; attack: number; defense: number } | null;
  primaryType: { type: string; names: Record<string, string> };
  secondaryType: { type: string; names: Record<string, string> } | null;
  pokemonClass: string | null;
  quickMoves: Record<string, RawUpstreamMove>;
  cinematicMoves: Record<string, RawUpstreamMove>;
  eliteQuickMoves: Record<string, RawUpstreamMove>;
  eliteCinematicMoves: Record<string, RawUpstreamMove>;
  assets: { image: string; shinyImage: string } | null;
  assetForms: unknown[];
  regionForms: Record<string, unknown>;
  evolutions: RawUpstreamEvolution[];
  hasGigantamaxEvolution: boolean;
  hasMegaEvolution: boolean;
  megaEvolutions: Record<string, RawUpstreamMegaEvolution>;
}

export interface RawUpstreamMove {
  id: string;
  power: number;
  energy: number;
  durationMs: number;
  type: { type: string; names: Record<string, string> };
  names: Record<string, string>;
  combat: {
    energy: number;
    power: number;
    turns: number;
    buffs: {
      activationChance: number;
      attackerAttackStatsChange: number | null;
      attackerDefenseStatsChange: number | null;
      targetAttackStatsChange: number | null;
      targetDefenseStatsChange: number | null;
    } | null;
  } | null;
}

export interface RawUpstreamEvolution {
  id: string;
  formId: string;
  candies: number;
  item: unknown;
  quests: unknown[];
}

export interface RawUpstreamMegaEvolution {
  id: string;
  names: Record<string, string>;
  stats: { stamina: number; attack: number; defense: number };
  primaryType: { type: string; names: Record<string, string> };
  secondaryType: { type: string; names: Record<string, string> } | null;
  energyCost: number;
  assets: { image: string; shinyImage: string };
}
