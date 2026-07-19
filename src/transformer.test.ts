import { describe, it, expect } from "vitest";
import { transformPokemon, transformAll } from "./transformer.js";
import type { RawUpstreamPokemon } from "./types.js";

const rawBulbasaur: RawUpstreamPokemon = {
  id: "BULBASAUR",
  formId: "BULBASAUR",
  dexNr: 1,
  generation: 1,
  names: { English: "Bulbasaur", German: "Bisasam", French: "Bulbizarre" },
  stats: { stamina: 128, attack: 118, defense: 111 },
  primaryType: {
    type: "POKEMON_TYPE_GRASS",
    names: { English: "Grass", German: "Pflanze" },
  },
  secondaryType: {
    type: "POKEMON_TYPE_POISON",
    names: { English: "Poison", German: "Gift" },
  },
  pokemonClass: null,
  quickMoves: {
    VINE_WHIP_FAST: {
      id: "VINE_WHIP_FAST",
      power: 6,
      energy: 5,
      durationMs: 500,
      type: { type: "POKEMON_TYPE_GRASS", names: { English: "Grass", German: "Pflanze" } },
      names: { English: "Vine Whip", German: "Rankenhieb" },
      combat: { energy: 8, power: 5, turns: 2, buffs: null },
    },
    TACKLE_FAST: {
      id: "TACKLE_FAST",
      power: 5,
      energy: 5,
      durationMs: 500,
      type: { type: "POKEMON_TYPE_NORMAL", names: { English: "Normal", German: "Normal" } },
      names: { English: "Tackle", German: "Tackle" },
      combat: { energy: 3, power: 3, turns: 1, buffs: null },
    },
  },
  cinematicMoves: {
    POWER_WHIP: {
      id: "POWER_WHIP",
      power: 90,
      energy: -50,
      durationMs: 2600,
      type: { type: "POKEMON_TYPE_GRASS", names: { English: "Grass", German: "Pflanze" } },
      names: { English: "Power Whip", German: "Blattgeißel" },
      combat: { energy: -50, power: 90, turns: 4, buffs: null },
    },
  },
  eliteQuickMoves: {},
  eliteCinematicMoves: {},
  assets: {
    image: "https://example.com/bulbasaur.png",
    shinyImage: "https://example.com/bulbasaur_shiny.png",
  },
  assetForms: [],
  regionForms: {},
  evolutions: [
    { id: "IVYSAUR", formId: "IVYSAUR", candies: 25, item: null, quests: [] },
  ],
  hasGigantamaxEvolution: false,
  hasMegaEvolution: false,
  megaEvolutions: {},
};

describe("transformPokemon", () => {
  it("extracts English name only", () => {
    const result = transformPokemon(rawBulbasaur);
    expect(result.name).toBe("Bulbasaur");
  });

  it("maps basic fields correctly", () => {
    const result = transformPokemon(rawBulbasaur);
    expect(result.id).toBe("BULBASAUR");
    expect(result.formId).toBe("BULBASAUR");
    expect(result.dexNr).toBe(1);
    expect(result.generation).toBe(1);
    expect(result.pokemonClass).toBeNull();
  });

  it("transforms stats", () => {
    const result = transformPokemon(rawBulbasaur);
    expect(result.stats).toEqual({ stamina: 128, attack: 118, defense: 111 });
  });

  it("transforms primary and secondary types to English", () => {
    const result = transformPokemon(rawBulbasaur);
    expect(result.primaryType).toEqual({ type: "POKEMON_TYPE_GRASS", name: "Grass" });
    expect(result.secondaryType).toEqual({ type: "POKEMON_TYPE_POISON", name: "Poison" });
  });

  it("transforms quick moves from object to array with English names", () => {
    const result = transformPokemon(rawBulbasaur);
    expect(result.quickMoves).toHaveLength(2);

    const vineWhip = result.quickMoves.find((m) => m.id === "VINE_WHIP_FAST");
    expect(vineWhip).toBeDefined();
    expect(vineWhip!.name).toBe("Vine Whip");
    expect(vineWhip!.power).toBe(6);
    expect(vineWhip!.energy).toBe(5);
    expect(vineWhip!.durationMs).toBe(500);
    expect(vineWhip!.type).toEqual({ type: "POKEMON_TYPE_GRASS", name: "Grass" });
  });

  it("transforms cinematic moves", () => {
    const result = transformPokemon(rawBulbasaur);
    expect(result.cinematicMoves).toHaveLength(1);
    expect(result.cinematicMoves[0].name).toBe("Power Whip");
    expect(result.cinematicMoves[0].power).toBe(90);
  });

  it("initializes computed fields to zero (pre-calculation)", () => {
    const result = transformPokemon(rawBulbasaur);
    const vineWhip = result.quickMoves.find((m) => m.id === "VINE_WHIP_FAST");
    expect(vineWhip!.computed).toEqual({ dps: 0, stabDps: 0 });
  });

  it("transforms evolutions (simplified)", () => {
    const result = transformPokemon(rawBulbasaur);
    expect(result.evolutions).toEqual([
      { id: "IVYSAUR", formId: "IVYSAUR", candies: 25 },
    ]);
  });

  it("handles null stats", () => {
    const rawNoStats = { ...rawBulbasaur, stats: null };
    const result = transformPokemon(rawNoStats);
    expect(result.stats).toBeNull();
  });

  it("handles null secondaryType", () => {
    const rawNoSecondary = { ...rawBulbasaur, secondaryType: null };
    const result = transformPokemon(rawNoSecondary);
    expect(result.secondaryType).toBeNull();
  });

  it("transforms assets", () => {
    const result = transformPokemon(rawBulbasaur);
    expect(result.assets).toEqual({
      image: "https://example.com/bulbasaur.png",
      shinyImage: "https://example.com/bulbasaur_shiny.png",
    });
  });

  it("preserves combat stats for PvP", () => {
    const result = transformPokemon(rawBulbasaur);
    const vineWhip = result.quickMoves.find((m) => m.id === "VINE_WHIP_FAST");
    expect(vineWhip!.combat).toEqual({ energy: 8, power: 5, turns: 2, buffs: null });
  });
});

describe("transformAll", () => {
  it("transforms an array of pokemon", () => {
    const result = transformAll([rawBulbasaur, rawBulbasaur]);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Bulbasaur");
  });
});
