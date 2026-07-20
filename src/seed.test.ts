import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { stripComputed, toStoredPokemon, groupByDexNr, writeSeedData } from "./seed.js";
import type { Pokemon, Move } from "./types.js";

function makeMove(overrides: Partial<Move> = {}): Move {
  return {
    id: "VINE_WHIP_FAST",
    name: "Vine Whip",
    power: 6,
    energy: 5,
    durationMs: 500,
    type: { type: "POKEMON_TYPE_GRASS", name: "Grass" },
    combat: { energy: 8, power: 5, turns: 2, buffs: null },
    computed: { dps: 12, stabDps: 14.4 },
    ...overrides,
  };
}

function makePokemon(overrides: Partial<Pokemon> = {}): Pokemon {
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
    quickMoves: [makeMove()],
    cinematicMoves: [makeMove({ id: "POWER_WHIP", name: "Power Whip", power: 90, energy: -50, durationMs: 2600, computed: { dps: 34.62, stabDps: 41.54 } })],
    eliteQuickMoves: [],
    eliteCinematicMoves: [],
    assets: { image: "https://example.com/bulbasaur.png", shinyImage: "https://example.com/bulbasaur_shiny.png" },
    evolutions: [{ id: "IVYSAUR", formId: "IVYSAUR", candies: 25 }],
    hasMegaEvolution: false,
    megaEvolutions: [],
    ...overrides,
  };
}

describe("stripComputed", () => {
  it("removes the computed field from a Move", () => {
    const move = makeMove({ computed: { dps: 12, stabDps: 14.4 } });
    const stored = stripComputed(move);

    expect(stored).not.toHaveProperty("computed");
    expect(stored.id).toBe("VINE_WHIP_FAST");
    expect(stored.name).toBe("Vine Whip");
    expect(stored.power).toBe(6);
    expect(stored.energy).toBe(5);
    expect(stored.durationMs).toBe(500);
    expect(stored.type).toEqual({ type: "POKEMON_TYPE_GRASS", name: "Grass" });
    expect(stored.combat).toEqual({ energy: 8, power: 5, turns: 2, buffs: null });
  });

  it("preserves combat as null when absent", () => {
    const move = makeMove({ combat: null });
    const stored = stripComputed(move);
    expect(stored.combat).toBeNull();
  });
});

describe("toStoredPokemon", () => {
  it("strips computed from all move categories", () => {
    const pokemon = makePokemon({
      eliteQuickMoves: [makeMove({ id: "RAZOR_LEAF_FAST", computed: { dps: 13, stabDps: 15.6 } })],
      eliteCinematicMoves: [makeMove({ id: "FRENZY_PLANT", computed: { dps: 38.46, stabDps: 46.15 } })],
    });

    const stored = toStoredPokemon(pokemon);

    expect(stored.quickMoves[0]).not.toHaveProperty("computed");
    expect(stored.cinematicMoves[0]).not.toHaveProperty("computed");
    expect(stored.eliteQuickMoves[0]).not.toHaveProperty("computed");
    expect(stored.eliteCinematicMoves[0]).not.toHaveProperty("computed");
  });

  it("preserves all non-move fields", () => {
    const pokemon = makePokemon();
    const stored = toStoredPokemon(pokemon);

    expect(stored.id).toBe("BULBASAUR");
    expect(stored.formId).toBe("BULBASAUR");
    expect(stored.dexNr).toBe(1);
    expect(stored.generation).toBe(1);
    expect(stored.name).toBe("Bulbasaur");
    expect(stored.stats).toEqual({ stamina: 128, attack: 118, defense: 111 });
    expect(stored.primaryType).toEqual({ type: "POKEMON_TYPE_GRASS", name: "Grass" });
    expect(stored.secondaryType).toEqual({ type: "POKEMON_TYPE_POISON", name: "Poison" });
    expect(stored.pokemonClass).toBeNull();
    expect(stored.assets).toEqual({ image: "https://example.com/bulbasaur.png", shinyImage: "https://example.com/bulbasaur_shiny.png" });
    expect(stored.evolutions).toEqual([{ id: "IVYSAUR", formId: "IVYSAUR", candies: 25 }]);
    expect(stored.hasMegaEvolution).toBe(false);
    expect(stored.megaEvolutions).toEqual([]);
  });

  it("does not include a forms property", () => {
    const pokemon = makePokemon();
    const stored = toStoredPokemon(pokemon);
    expect(stored.forms).toBeUndefined();
  });
});

describe("groupByDexNr", () => {
  it("groups a single Pokemon into one entry", () => {
    const pokemon = [makePokemon()];
    const grouped = groupByDexNr(pokemon);

    expect(grouped.size).toBe(1);
    expect(grouped.has(1)).toBe(true);

    const entry = grouped.get(1)!;
    expect(entry.id).toBe("BULBASAUR");
    expect(entry.forms).toBeUndefined();
  });

  it("groups multiple forms under the same dexNr", () => {
    const pokemon = [
      makePokemon({ formId: "DEOXYS", dexNr: 386, name: "Deoxys" }),
      makePokemon({ formId: "DEOXYS_ATTACK", dexNr: 386, name: "Deoxys" }),
      makePokemon({ formId: "DEOXYS_DEFENSE", dexNr: 386, name: "Deoxys" }),
    ];

    const grouped = groupByDexNr(pokemon);

    expect(grouped.size).toBe(1);
    const entry = grouped.get(386)!;
    expect(entry.formId).toBe("DEOXYS");
    expect(entry.forms).toHaveLength(2);
    expect(entry.forms![0].formId).toBe("DEOXYS_ATTACK");
    expect(entry.forms![1].formId).toBe("DEOXYS_DEFENSE");
  });

  it("strips computed fields from forms too", () => {
    const pokemon = [
      makePokemon({ formId: "DEOXYS", dexNr: 386 }),
      makePokemon({ formId: "DEOXYS_ATTACK", dexNr: 386 }),
    ];

    const grouped = groupByDexNr(pokemon);
    const entry = grouped.get(386)!;

    expect(entry.quickMoves[0]).not.toHaveProperty("computed");
    expect(entry.forms![0].quickMoves[0]).not.toHaveProperty("computed");
  });

  it("separates different dexNrs into separate entries", () => {
    const pokemon = [
      makePokemon({ dexNr: 1 }),
      makePokemon({ dexNr: 4, id: "CHARMANDER", formId: "CHARMANDER", name: "Charmander" }),
    ];

    const grouped = groupByDexNr(pokemon);

    expect(grouped.size).toBe(2);
    expect(grouped.has(1)).toBe(true);
    expect(grouped.has(4)).toBe(true);
  });
});

describe("writeSeedData", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "seed-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it("writes individual JSON files per dexNr", async () => {
    const grouped = groupByDexNr([
      makePokemon({ dexNr: 1 }),
      makePokemon({ dexNr: 4, id: "CHARMANDER", formId: "CHARMANDER" }),
    ]);

    const count = await writeSeedData(grouped, tempDir);

    expect(count).toBe(2);
    const files = await readdir(tempDir);
    expect(files.sort()).toEqual(["1.json", "4.json"]);
  });

  it("writes valid JSON that can be parsed back", async () => {
    const grouped = groupByDexNr([makePokemon({ dexNr: 1 })]);
    await writeSeedData(grouped, tempDir);

    const content = await readFile(join(tempDir, "1.json"), "utf-8");
    const parsed = JSON.parse(content);

    expect(parsed.id).toBe("BULBASAUR");
    expect(parsed.dexNr).toBe(1);
    expect(parsed.quickMoves[0]).not.toHaveProperty("computed");
  });

  it("includes forms array for multi-form Pokemon", async () => {
    const grouped = groupByDexNr([
      makePokemon({ formId: "DEOXYS", dexNr: 386 }),
      makePokemon({ formId: "DEOXYS_ATTACK", dexNr: 386 }),
    ]);

    await writeSeedData(grouped, tempDir);

    const content = await readFile(join(tempDir, "386.json"), "utf-8");
    const parsed = JSON.parse(content);

    expect(parsed.formId).toBe("DEOXYS");
    expect(parsed.forms).toHaveLength(1);
    expect(parsed.forms[0].formId).toBe("DEOXYS_ATTACK");
  });

  it("writes pretty-printed JSON", async () => {
    const grouped = groupByDexNr([makePokemon({ dexNr: 1 })]);
    await writeSeedData(grouped, tempDir);

    const content = await readFile(join(tempDir, "1.json"), "utf-8");
    // Pretty-printed JSON has newlines
    expect(content).toContain("\n");
    expect(content.startsWith("{")).toBe(true);
  });
});
