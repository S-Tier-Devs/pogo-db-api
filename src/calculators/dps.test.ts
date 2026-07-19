import { describe, it, expect } from "vitest";
import { dpsCalculator } from "./dps.js";
import { runPipeline } from "./index.js";
import type { Pokemon, Move } from "../types.js";

function makeMoveFixture(overrides: Partial<Move> = {}): Move {
  return {
    id: "TEST_MOVE",
    name: "Test Move",
    power: 10,
    energy: 5,
    durationMs: 500,
    type: { type: "POKEMON_TYPE_FIRE", name: "Fire" },
    combat: null,
    computed: { dps: 0, stabDps: 0 },
    ...overrides,
  };
}

function makePokemonFixture(overrides: Partial<Pokemon> = {}): Pokemon {
  return {
    id: "TEST_POKEMON",
    formId: "TEST_POKEMON",
    dexNr: 999,
    generation: 1,
    name: "Test Pokemon",
    stats: { stamina: 100, attack: 100, defense: 100 },
    primaryType: { type: "POKEMON_TYPE_GRASS", name: "Grass" },
    secondaryType: { type: "POKEMON_TYPE_POISON", name: "Poison" },
    pokemonClass: null,
    quickMoves: [],
    cinematicMoves: [],
    eliteQuickMoves: [],
    eliteCinematicMoves: [],
    assets: null,
    evolutions: [],
    hasMegaEvolution: false,
    megaEvolutions: [],
    ...overrides,
  };
}

describe("dpsCalculator", () => {
  it("computes basic DPS (power / seconds)", () => {
    const move = makeMoveFixture({ power: 10, durationMs: 500 });
    const pokemon = makePokemonFixture({ quickMoves: [move] });

    const result = dpsCalculator.compute(pokemon);

    expect(result.quickMoves[0].computed.dps).toBe(20);
  });

  it("computes STAB DPS when move type matches primary type", () => {
    const move = makeMoveFixture({
      power: 10,
      durationMs: 1000,
      type: { type: "POKEMON_TYPE_GRASS", name: "Grass" },
    });
    const pokemon = makePokemonFixture({ quickMoves: [move] });

    const result = dpsCalculator.compute(pokemon);

    expect(result.quickMoves[0].computed.dps).toBe(10);
    expect(result.quickMoves[0].computed.stabDps).toBe(12); // 10 * 1.2
  });

  it("computes STAB DPS when move type matches secondary type", () => {
    const move = makeMoveFixture({
      power: 10,
      durationMs: 1000,
      type: { type: "POKEMON_TYPE_POISON", name: "Poison" },
    });
    const pokemon = makePokemonFixture({ quickMoves: [move] });

    const result = dpsCalculator.compute(pokemon);

    expect(result.quickMoves[0].computed.stabDps).toBe(12);
  });

  it("does not apply STAB when move type does not match pokemon types", () => {
    const move = makeMoveFixture({
      power: 10,
      durationMs: 1000,
      type: { type: "POKEMON_TYPE_FIRE", name: "Fire" },
    });
    const pokemon = makePokemonFixture({ quickMoves: [move] });

    const result = dpsCalculator.compute(pokemon);

    expect(result.quickMoves[0].computed.dps).toBe(10);
    expect(result.quickMoves[0].computed.stabDps).toBe(10); // no bonus
  });

  it("handles durationMs of 0 gracefully (DPS = 0)", () => {
    const move = makeMoveFixture({ power: 10, durationMs: 0 });
    const pokemon = makePokemonFixture({ quickMoves: [move] });

    const result = dpsCalculator.compute(pokemon);

    expect(result.quickMoves[0].computed.dps).toBe(0);
    expect(result.quickMoves[0].computed.stabDps).toBe(0);
  });

  it("handles pokemon with no secondary type", () => {
    const move = makeMoveFixture({
      power: 10,
      durationMs: 1000,
      type: { type: "POKEMON_TYPE_GRASS", name: "Grass" },
    });
    const pokemon = makePokemonFixture({
      quickMoves: [move],
      secondaryType: null,
    });

    const result = dpsCalculator.compute(pokemon);

    // Still gets STAB from primary type
    expect(result.quickMoves[0].computed.stabDps).toBe(12);
  });

  it("computes DPS for cinematic, elite quick, and elite cinematic moves", () => {
    const move = makeMoveFixture({ power: 100, durationMs: 2000 });
    const pokemon = makePokemonFixture({
      cinematicMoves: [move],
      eliteQuickMoves: [move],
      eliteCinematicMoves: [move],
    });

    const result = dpsCalculator.compute(pokemon);

    expect(result.cinematicMoves[0].computed.dps).toBe(50);
    expect(result.eliteQuickMoves[0].computed.dps).toBe(50);
    expect(result.eliteCinematicMoves[0].computed.dps).toBe(50);
  });

  it("rounds DPS to 2 decimal places", () => {
    const move = makeMoveFixture({ power: 10, durationMs: 300 });
    const pokemon = makePokemonFixture({ quickMoves: [move] });

    const result = dpsCalculator.compute(pokemon);

    // 10 / 0.3 = 33.333... → 33.33
    expect(result.quickMoves[0].computed.dps).toBe(33.33);
  });
});

describe("runPipeline", () => {
  it("runs multiple calculators in sequence", () => {
    const move = makeMoveFixture({
      power: 10,
      durationMs: 1000,
      type: { type: "POKEMON_TYPE_GRASS", name: "Grass" },
    });
    const pokemon = makePokemonFixture({ quickMoves: [move] });

    const result = runPipeline([pokemon], [dpsCalculator]);

    expect(result[0].quickMoves[0].computed.dps).toBe(10);
    expect(result[0].quickMoves[0].computed.stabDps).toBe(12);
  });

  it("passes output of one calculator as input to the next", () => {
    const mockCalculator = {
      name: "mock",
      compute: (p: Pokemon) => ({ ...p, name: p.name + "_modified" }),
    };

    const pokemon = makePokemonFixture();
    const result = runPipeline([pokemon], [mockCalculator, mockCalculator]);

    expect(result[0].name).toBe("Test Pokemon_modified_modified");
  });
});
