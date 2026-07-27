import type { Pokemon, MegaEvolution, PokemonStats } from './types.js';
import type { ShadowEntry } from './shadow.js';
import { SHADOW_ATK_MULTIPLIER, SHADOW_DEF_MULTIPLIER } from './config.js';

/**
 * Applies shadow stat multipliers to base stats.
 */
export function applyShadowStats(stats: PokemonStats): PokemonStats {
  return {
    stamina: stats.stamina,
    attack: Math.round(stats.attack * SHADOW_ATK_MULTIPLIER * 100) / 100,
    defense: Math.round(stats.defense * SHADOW_DEF_MULTIPLIER * 100) / 100,
  };
}

/**
 * Creates a shadow variant Pokemon from a base Pokemon.
 */
export function createShadowVariant(pokemon: Pokemon): Pokemon {
  return {
    id: pokemon.id + '_SHADOW',
    formId: pokemon.formId + '_SHADOW',
    dexNr: pokemon.dexNr,
    generation: pokemon.generation,
    name: 'Shadow ' + pokemon.name,
    stats: applyShadowStats(pokemon.stats!),
    primaryType: pokemon.primaryType,
    secondaryType: pokemon.secondaryType,
    pokemonClass: pokemon.pokemonClass,
    quickMoves: pokemon.quickMoves,
    cinematicMoves: pokemon.cinematicMoves,
    eliteQuickMoves: pokemon.eliteQuickMoves,
    eliteCinematicMoves: pokemon.eliteCinematicMoves,
    assets: pokemon.assets,
    evolutions: pokemon.evolutions,
    hasMegaEvolution: false,
    megaEvolutions: [],
    computed: null,
    variant: 'shadow',
    variantName: 'Shadow ' + pokemon.name,
    baseFormId: pokemon.formId,
  };
}

/**
 * Creates a mega variant Pokemon from a base Pokemon and its mega evolution data.
 * Mega Pokemon use the base's movepool but the mega's stats and types.
 */
export function createMegaVariant(pokemon: Pokemon, mega: MegaEvolution): Pokemon {
  return {
    id: mega.id,
    formId: mega.id,
    dexNr: pokemon.dexNr,
    generation: pokemon.generation,
    name: mega.name,
    stats: mega.stats,
    primaryType: mega.primaryType,
    secondaryType: mega.secondaryType,
    pokemonClass: pokemon.pokemonClass,
    quickMoves: pokemon.quickMoves,
    cinematicMoves: pokemon.cinematicMoves,
    eliteQuickMoves: pokemon.eliteQuickMoves,
    eliteCinematicMoves: pokemon.eliteCinematicMoves,
    assets: mega.assets,
    evolutions: [],
    hasMegaEvolution: false,
    megaEvolutions: [],
    computed: null,
    variant: 'mega',
    variantName: mega.name,
    baseFormId: pokemon.formId,
  };
}

/**
 * Checks if a Pokemon matches a shadow entry.
 * For base forms (empty form field), matches by dexNr alone.
 * For alternate forms, would match by dexNr + form suffix (future support).
 */
export function isShadowEligible(pokemon: Pokemon, shadowList: ShadowEntry[]): boolean {
  return shadowList.some(entry =>
    entry.dexNr === pokemon.dexNr && entry.form === ''
  );
}

/**
 * Expands the Pokemon array with shadow and mega variants.
 * Returns: original Pokemon + all generated shadow/mega variants.
 */
export function expandVariants(pokemon: Pokemon[], shadowList: ShadowEntry[]): Pokemon[] {
  const expanded: Pokemon[] = [...pokemon];

  for (const p of pokemon) {
    // Skip Pokemon without stats (can't compute variants)
    if (!p.stats) continue;

    // Skip if this is already a variant (shouldn't happen but guard)
    if (p.variant) continue;

    // Generate shadow variant if eligible
    if (isShadowEligible(p, shadowList)) {
      expanded.push(createShadowVariant(p));
    }

    // Generate mega variants
    if (p.hasMegaEvolution && p.megaEvolutions.length > 0) {
      for (const mega of p.megaEvolutions) {
        expanded.push(createMegaVariant(p, mega));
      }
    }
  }

  return expanded;
}
