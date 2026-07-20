import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, writeFile, rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readPokedex, toPokemon } from "./reader.js";
import type { StoredPokemon } from "./types.js";

function makeStoredPokemon(overrides: Partial<StoredPokemon> = {}): StoredPokemon {
  return {
    id: "BULBASAUR",
    formId: "BULBASAUR",
    dexNr: 1,
    generation: 1,
    name: "Bulbasaur",
    stats: { stamina: 128, attack: 118, defense: 111 },
    primaryType: { type: "POKEMON_TYPE_GRASS", name: "Grass" },
    secondaryType: { type: "POKEMON_TYPE_POISON", name: "Poison" },
    pokemonClass: null,
    quickMoves: [
      {
        id: "VINE_WHIP_FAST",
        name: "Vine Whip",
        power: 6,
        energy: 5,
        durationMs: 500,
        type: { type: "POKEMON_TYPE_GRASS", name: "Grass" },
        combat: { energy: 8, power: 5, turns: 2, buffs: null },
      },
    ],
    cinematicMoves: [
      {
        id: "POWER_WHIP",
        name: "Power Whip",
        power: 90,
        energy: -50,
        durationMs: 2600,
        type: { type: "POKEMON_TYPE_GRASS", name: "Grass" },
        combat: { energy: -50, power: 90, turns: 1, buffs: null },
      },
    ],
    eliteQuickMoves: [],
    eliteCinematicMoves: [],
    assets: { image: "https://example.com/bulbasaur.png", shinyImage: "https://example.com/bulbasaur_shiny.png" },
    evolutions: [{ id: "IVYSAUR", formId: "IVYSAUR", candies: 25 }],
    hasMegaEvolution: false,
    megaEvolutions: [],
    ...overrides,
  };
}

describe("toPokemon", () => {
  it("converts a StoredPokemon to Pokemon with computed fields initialized to zero", () => {
    const stored = makeStoredPokemon();
    const pokemon = toPokemon(stored);

    expect(pokemon.id).toBe("BULBASAUR");
    expect(pokemon.dexNr).toBe(1);
    expect(pokemon.quickMoves[0].computed).toEqual({ dps: 0, stabDps: 0 });
    expect(pokemon.cinematicMoves[0].computed).toEqual({ dps: 0, stabDps: 0 });
  });

  it("preserves all base fields from StoredPokemon", () => {
    const stored = makeStoredPokemon();
    const pokemon = toPokemon(stored);

    expect(pokemon.name).toBe("Bulbasaur");
    expect(pokemon.generation).toBe(1);
    expect(pokemon.stats).toEqual({ stamina: 128, attack: 118, defense: 111 });
    expect(pokemon.primaryType).toEqual({ type: "POKEMON_TYPE_GRASS", name: "Grass" });
    expect(pokemon.secondaryType).toEqual({ type: "POKEMON_TYPE_POISON", name: "Poison" });
    expect(pokemon.pokemonClass).toBeNull();
    expect(pokemon.assets).toEqual({
      image: "https://example.com/bulbasaur.png",
      shinyImage: "https://example.com/bulbasaur_shiny.png",
    });
    expect(pokemon.evolutions).toEqual([{ id: "IVYSAUR", formId: "IVYSAUR", candies: 25 }]);
    expect(pokemon.hasMegaEvolution).toBe(false);
    expect(pokemon.megaEvolutions).toEqual([]);
  });

  it("preserves move fields except adds computed", () => {
    const stored = makeStoredPokemon();
    const pokemon = toPokemon(stored);

    const move = pokemon.quickMoves[0];
    expect(move.id).toBe("VINE_WHIP_FAST");
    expect(move.name).toBe("Vine Whip");
    expect(move.power).toBe(6);
    expect(move.energy).toBe(5);
    expect(move.durationMs).toBe(500);
    expect(move.type).toEqual({ type: "POKEMON_TYPE_GRASS", name: "Grass" });
    expect(move.combat).toEqual({ energy: 8, power: 5, turns: 2, buffs: null });
  });

  it("handles Pokemon with null stats", () => {
    const stored = makeStoredPokemon({ stats: null });
    const pokemon = toPokemon(stored);
    expect(pokemon.stats).toBeNull();
  });

  it("handles Pokemon with null secondaryType", () => {
    const stored = makeStoredPokemon({ secondaryType: null });
    const pokemon = toPokemon(stored);
    expect(pokemon.secondaryType).toBeNull();
  });
});

describe("readPokedex", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "reader-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("reads a single Pokemon file", async () => {
    const stored = makeStoredPokemon();
    await writeFile(join(tempDir, "1.json"), JSON.stringify(stored), "utf-8");

    const result = await readPokedex(tempDir);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("BULBASAUR");
    expect(result[0].dexNr).toBe(1);
    expect(result[0].quickMoves[0].computed).toEqual({ dps: 0, stabDps: 0 });
  });

  it("reads multiple Pokemon files", async () => {
    const bulbasaur = makeStoredPokemon();
    const charmander = makeStoredPokemon({
      id: "CHARMANDER",
      formId: "CHARMANDER",
      dexNr: 4,
      name: "Charmander",
      primaryType: { type: "POKEMON_TYPE_FIRE", name: "Fire" },
      secondaryType: null,
    });

    await writeFile(join(tempDir, "1.json"), JSON.stringify(bulbasaur), "utf-8");
    await writeFile(join(tempDir, "4.json"), JSON.stringify(charmander), "utf-8");

    const result = await readPokedex(tempDir);

    expect(result).toHaveLength(2);
    const ids = result.map((p) => p.id);
    expect(ids).toContain("BULBASAUR");
    expect(ids).toContain("CHARMANDER");
  });

  it("flattens multi-form Pokemon into individual entries", async () => {
    const deoxys = makeStoredPokemon({
      id: "DEOXYS",
      formId: "DEOXYS",
      dexNr: 386,
      name: "Deoxys",
      forms: [
        makeStoredPokemon({
          id: "DEOXYS",
          formId: "DEOXYS_ATTACK",
          dexNr: 386,
          name: "Deoxys",
        }),
        makeStoredPokemon({
          id: "DEOXYS",
          formId: "DEOXYS_DEFENSE",
          dexNr: 386,
          name: "Deoxys",
        }),
      ],
    });

    await writeFile(join(tempDir, "386.json"), JSON.stringify(deoxys), "utf-8");

    const result = await readPokedex(tempDir);

    expect(result).toHaveLength(3);
    const formIds = result.map((p) => p.formId);
    expect(formIds).toContain("DEOXYS");
    expect(formIds).toContain("DEOXYS_ATTACK");
    expect(formIds).toContain("DEOXYS_DEFENSE");
  });

  it("ignores non-JSON files", async () => {
    const stored = makeStoredPokemon();
    await writeFile(join(tempDir, "1.json"), JSON.stringify(stored), "utf-8");
    await writeFile(join(tempDir, "readme.txt"), "ignore me", "utf-8");

    const result = await readPokedex(tempDir);
    expect(result).toHaveLength(1);
  });

  it("returns empty array for empty directory", async () => {
    const result = await readPokedex(tempDir);
    expect(result).toHaveLength(0);
  });

  it("initializes computed fields on all move categories", async () => {
    const stored = makeStoredPokemon({
      eliteQuickMoves: [
        {
          id: "RAZOR_LEAF_FAST",
          name: "Razor Leaf",
          power: 13,
          energy: 7,
          durationMs: 1000,
          type: { type: "POKEMON_TYPE_GRASS", name: "Grass" },
          combat: null,
        },
      ],
      eliteCinematicMoves: [
        {
          id: "FRENZY_PLANT",
          name: "Frenzy Plant",
          power: 100,
          energy: -50,
          durationMs: 2600,
          type: { type: "POKEMON_TYPE_GRASS", name: "Grass" },
          combat: null,
        },
      ],
    });

    await writeFile(join(tempDir, "1.json"), JSON.stringify(stored), "utf-8");

    const result = await readPokedex(tempDir);
    const pokemon = result[0];

    expect(pokemon.eliteQuickMoves[0].computed).toEqual({ dps: 0, stabDps: 0 });
    expect(pokemon.eliteCinematicMoves[0].computed).toEqual({ dps: 0, stabDps: 0 });
  });
});
