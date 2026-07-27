import { describe, it, expect } from 'vitest';
import {
  applyShadowStats,
  createShadowVariant,
  createMegaVariant,
  isShadowEligible,
  expandVariants,
} from './expander.js';
import type { Pokemon, MegaEvolution, PokemonStats } from './types.js';
import type { ShadowEntry } from './shadow.js';

function makePokemon(overrides: Partial<Pokemon> = {}): Pokemon {
  return {
    id: 'CHARIZARD',
    formId: 'CHARIZARD',
    dexNr: 6,
    generation: 1,
    name: 'Charizard',
    stats: { stamina: 186, attack: 223, defense: 173 },
    primaryType: { type: 'POKEMON_TYPE_FIRE', name: 'Fire' },
    secondaryType: { type: 'POKEMON_TYPE_FLYING', name: 'Flying' },
    pokemonClass: null,
    quickMoves: [
      {
        id: 'FIRE_SPIN_FAST',
        name: 'Fire Spin',
        power: 14,
        energy: 10,
        durationMs: 1100,
        type: { type: 'POKEMON_TYPE_FIRE', name: 'Fire' },
        combat: null,
        computed: { dps: 12.73, stabDps: 15.27 },
      },
    ],
    cinematicMoves: [
      {
        id: 'BLAST_BURN',
        name: 'Blast Burn',
        power: 110,
        energy: -50,
        durationMs: 3300,
        type: { type: 'POKEMON_TYPE_FIRE', name: 'Fire' },
        combat: null,
        computed: { dps: 33.33, stabDps: 40 },
      },
    ],
    eliteQuickMoves: [],
    eliteCinematicMoves: [],
    assets: { image: 'img.png', shinyImage: 'shiny.png' },
    evolutions: [],
    hasMegaEvolution: true,
    megaEvolutions: [
      {
        id: 'CHARIZARD_MEGA_X',
        name: 'Mega Charizard X',
        stats: { stamina: 186, attack: 273, defense: 213 },
        primaryType: { type: 'POKEMON_TYPE_FIRE', name: 'Fire' },
        secondaryType: { type: 'POKEMON_TYPE_DRAGON', name: 'Dragon' },
        assets: { image: 'mega_x.png', shinyImage: 'mega_x_shiny.png' },
      },
    ],
    computed: null,
    ...overrides,
  };
}

const shadowList: ShadowEntry[] = [
  { dexNr: 6, name: 'Charizard', form: '', type1: 'Fire', type2: 'Flying' },
  { dexNr: 25, name: 'Pikachu', form: '', type1: 'Electric', type2: '' },
];

describe('applyShadowStats', () => {
  it('applies correct multipliers (6/5 atk, 5/6 def, stamina unchanged)', () => {
    const stats: PokemonStats = { stamina: 186, attack: 223, defense: 173 };
    const result = applyShadowStats(stats);

    expect(result.stamina).toBe(186);
    expect(result.attack).toBeCloseTo(223 * (6 / 5), 2);
    expect(result.defense).toBeCloseTo(173 * (5 / 6), 2);
  });
});

describe('createShadowVariant', () => {
  it('creates correct Pokemon with shadow fields', () => {
    const pokemon = makePokemon();
    const shadow = createShadowVariant(pokemon);

    expect(shadow.id).toBe('CHARIZARD_SHADOW');
    expect(shadow.formId).toBe('CHARIZARD_SHADOW');
    expect(shadow.name).toBe('Shadow Charizard');
    expect(shadow.variant).toBe('shadow');
    expect(shadow.variantName).toBe('Shadow Charizard');
    expect(shadow.baseFormId).toBe('CHARIZARD');
    expect(shadow.stats!.stamina).toBe(186);
    expect(shadow.stats!.attack).toBeCloseTo(223 * (6 / 5), 2);
    expect(shadow.stats!.defense).toBeCloseTo(173 * (5 / 6), 2);
    expect(shadow.quickMoves).toBe(pokemon.quickMoves);
    expect(shadow.primaryType).toBe(pokemon.primaryType);
    expect(shadow.computed).toBeNull();
    expect(shadow.hasMegaEvolution).toBe(false);
    expect(shadow.megaEvolutions).toEqual([]);
  });
});

describe('createMegaVariant', () => {
  it('creates correct Pokemon with mega stats/types and base movepool', () => {
    const pokemon = makePokemon();
    const mega = pokemon.megaEvolutions[0];
    const megaVariant = createMegaVariant(pokemon, mega);

    expect(megaVariant.id).toBe('CHARIZARD_MEGA_X');
    expect(megaVariant.formId).toBe('CHARIZARD_MEGA_X');
    expect(megaVariant.name).toBe('Mega Charizard X');
    expect(megaVariant.variant).toBe('mega');
    expect(megaVariant.variantName).toBe('Mega Charizard X');
    expect(megaVariant.baseFormId).toBe('CHARIZARD');
    expect(megaVariant.stats).toEqual({ stamina: 186, attack: 273, defense: 213 });
    expect(megaVariant.primaryType).toEqual({ type: 'POKEMON_TYPE_FIRE', name: 'Fire' });
    expect(megaVariant.secondaryType).toEqual({ type: 'POKEMON_TYPE_DRAGON', name: 'Dragon' });
    // Uses base Pokemon's movepool
    expect(megaVariant.quickMoves).toBe(pokemon.quickMoves);
    expect(megaVariant.cinematicMoves).toBe(pokemon.cinematicMoves);
    expect(megaVariant.assets).toEqual({ image: 'mega_x.png', shinyImage: 'mega_x_shiny.png' });
    expect(megaVariant.computed).toBeNull();
    expect(megaVariant.dexNr).toBe(6);
    expect(megaVariant.generation).toBe(1);
  });
});

describe('isShadowEligible', () => {
  it('returns true for matching dexNr with empty form', () => {
    const pokemon = makePokemon({ dexNr: 6 });
    expect(isShadowEligible(pokemon, shadowList)).toBe(true);
  });

  it('returns false for non-eligible Pokemon', () => {
    const pokemon = makePokemon({ dexNr: 999 });
    expect(isShadowEligible(pokemon, shadowList)).toBe(false);
  });
});

describe('expandVariants', () => {
  it('produces correct count (base + shadow + mega entries)', () => {
    const pokemon = [makePokemon()];
    const result = expandVariants(pokemon, shadowList);
    // 1 base + 1 shadow + 1 mega = 3
    expect(result).toHaveLength(3);
  });

  it('skips Pokemon without stats', () => {
    const pokemon = [makePokemon({ stats: null })];
    const result = expandVariants(pokemon, shadowList);
    // Only the base, no variants generated
    expect(result).toHaveLength(1);
  });

  it('does not modify original Pokemon entries', () => {
    const pokemon = [makePokemon()];
    const originalId = pokemon[0].id;
    const originalName = pokemon[0].name;
    expandVariants(pokemon, shadowList);
    expect(pokemon[0].id).toBe(originalId);
    expect(pokemon[0].name).toBe(originalName);
    expect(pokemon[0].variant).toBeUndefined();
  });

  it('skips Pokemon that are already variants', () => {
    const pokemon = [makePokemon({ variant: 'shadow', stats: { stamina: 100, attack: 100, defense: 100 } })];
    const result = expandVariants(pokemon, shadowList);
    // Only the base variant itself, no new variants
    expect(result).toHaveLength(1);
  });
});
