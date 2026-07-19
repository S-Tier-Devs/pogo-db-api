import type {
  Pokemon,
  Move,
  PokemonType,
  Assets,
  Evolution,
  MegaEvolution,
  PokemonStats,
  MoveCombatStats,
  RawUpstreamPokemon,
  RawUpstreamMove,
  RawUpstreamEvolution,
  RawUpstreamMegaEvolution,
} from "./types.js";

function transformType(raw: { type: string; names: Record<string, string> }): PokemonType {
  return {
    type: raw.type,
    name: raw.names.English ?? raw.type,
  };
}

function transformMove(raw: RawUpstreamMove): Move {
  const combat: MoveCombatStats | null = raw.combat
    ? {
        energy: raw.combat.energy,
        power: raw.combat.power,
        turns: raw.combat.turns,
        buffs: raw.combat.buffs
          ? {
              activationChance: raw.combat.buffs.activationChance,
              attackerAttackStatsChange: raw.combat.buffs.attackerAttackStatsChange,
              attackerDefenseStatsChange: raw.combat.buffs.attackerDefenseStatsChange,
              targetAttackStatsChange: raw.combat.buffs.targetAttackStatsChange,
              targetDefenseStatsChange: raw.combat.buffs.targetDefenseStatsChange,
            }
          : null,
      }
    : null;

  return {
    id: raw.id,
    name: raw.names.English ?? raw.id,
    power: raw.power,
    energy: raw.energy,
    durationMs: raw.durationMs,
    type: transformType(raw.type),
    combat,
    // Placeholder — filled in by the DPS calculator
    computed: { dps: 0, stabDps: 0 },
  };
}

function transformMoves(raw: Record<string, RawUpstreamMove>): Move[] {
  return Object.values(raw).map(transformMove);
}

function transformAssets(raw: { image: string; shinyImage: string } | null): Assets | null {
  if (!raw) return null;
  return { image: raw.image, shinyImage: raw.shinyImage };
}

function transformStats(raw: { stamina: number; attack: number; defense: number } | null): PokemonStats | null {
  if (!raw) return null;
  return { stamina: raw.stamina, attack: raw.attack, defense: raw.defense };
}

function transformEvolution(raw: RawUpstreamEvolution): Evolution {
  return {
    id: raw.id,
    formId: raw.formId,
    candies: raw.candies,
  };
}

function transformMegaEvolution(raw: RawUpstreamMegaEvolution): MegaEvolution {
  return {
    id: raw.id,
    name: raw.names.English ?? raw.id,
    stats: {
      stamina: raw.stats.stamina,
      attack: raw.stats.attack,
      defense: raw.stats.defense,
    },
    primaryType: transformType(raw.primaryType),
    secondaryType: raw.secondaryType ? transformType(raw.secondaryType) : null,
    assets: { image: raw.assets.image, shinyImage: raw.assets.shinyImage },
  };
}

export function transformPokemon(raw: RawUpstreamPokemon): Pokemon {
  return {
    id: raw.id,
    formId: raw.formId,
    dexNr: raw.dexNr,
    generation: raw.generation,
    name: raw.names.English ?? raw.id,
    stats: transformStats(raw.stats),
    primaryType: transformType(raw.primaryType),
    secondaryType: raw.secondaryType ? transformType(raw.secondaryType) : null,
    pokemonClass: raw.pokemonClass ?? null,
    quickMoves: transformMoves(raw.quickMoves ?? {}),
    cinematicMoves: transformMoves(raw.cinematicMoves ?? {}),
    eliteQuickMoves: transformMoves(raw.eliteQuickMoves ?? {}),
    eliteCinematicMoves: transformMoves(raw.eliteCinematicMoves ?? {}),
    assets: transformAssets(raw.assets),
    evolutions: (raw.evolutions ?? []).map(transformEvolution),
    hasMegaEvolution: raw.hasMegaEvolution,
    megaEvolutions: Object.values(raw.megaEvolutions ?? {}).map(transformMegaEvolution),
  };
}

export function transformAll(rawData: RawUpstreamPokemon[]): Pokemon[] {
  return rawData.map(transformPokemon);
}
