import { describe, it, expect } from "vitest";
import { tdoCalculator, computeRealStats, computeCombo } from "./tdo.js";
import type { Pokemon, Move, PokemonRealStats } from "../types.js";

function makeMoveFixture(overrides: Partial<Move> = {}): Move {
  return {
    id: "VINE_WHIP_FAST",
    name: "Vine Whip",
    power: 6,
    energy: 5,
    durationMs: 500,
    type: { type: "POKEMON_TYPE_GRASS", name: "Grass" },
    combat: null,
    computed: { dps: 0, stabDps: 0 },
    ...overrides,
  };
}

function makePokemonFixture(overrides: Partial<Pokemon> = {}): Pokemon {
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
    quickMoves: [makeMoveFixture()],
    cinematicMoves: [
      makeMoveFixture({
        id: "POWER_WHIP",
        name: "Power Whip",
        power: 90,
        energy: -50,
        durationMs: 2600,
        type: { type: "POKEMON_TYPE_GRASS", name: "Grass" },
      }),
    ],
    eliteQuickMoves: [],
    eliteCinematicMoves: [],
    assets: null,
    evolutions: [],
    hasMegaEvolution: false,
    megaEvolutions: [],
    computed: null,
    ...overrides,
  };
}

describe("computeRealStats", () => {
  it("computes real stats at Level 50, 15 IVs", () => {
    const stats = { stamina: 128, attack: 118, defense: 111 };
    const real = computeRealStats(stats);

    // (118 + 15) * 0.84029999 = 111.76
    expect(real.atkReal).toBeCloseTo(111.76, 1);
    // (111 + 15) * 0.84029999 = 105.88
    expect(real.defReal).toBeCloseTo(105.88, 1);
    // floor((128 + 15) * 0.84029999) = floor(120.16) = 120
    expect(real.hpReal).toBe(120);
  });

  it("computes Mewtwo real stats correctly", () => {
    const stats = { stamina: 214, attack: 300, defense: 182 };
    const real = computeRealStats(stats);

    // (300 + 15) * 0.84029999 = 264.69
    expect(real.atkReal).toBeCloseTo(264.69, 1);
    // (182 + 15) * 0.84029999 = 165.54
    expect(real.defReal).toBeCloseTo(165.54, 1);
    // floor((214 + 15) * 0.84029999) = floor(192.43) = 192
    expect(real.hpReal).toBe(192);
  });
});

describe("computeCombo", () => {
  const pokemon = makePokemonFixture();
  const realStats = computeRealStats(pokemon.stats!);

  it("computes a valid combo with STAB on both moves", () => {
    const quick = makeMoveFixture(); // Grass type, Bulbasaur is Grass
    const charge = makeMoveFixture({
      id: "POWER_WHIP",
      power: 90,
      energy: -50,
      durationMs: 2600,
      type: { type: "POKEMON_TYPE_GRASS", name: "Grass" },
    });

    const combo = computeCombo(quick, charge, pokemon, realStats);

    expect(combo).not.toBeNull();
    expect(combo!.quickMove).toBe("VINE_WHIP_FAST");
    expect(combo!.cinematicMove).toBe("POWER_WHIP");
    expect(combo!.comboDps).toBeGreaterThan(0);
    expect(combo!.comboDpsAtk).toBeGreaterThan(0);
    expect(combo!.tdo).toBeGreaterThan(0);
  });

  it("applies STAB correctly (1.2x for matching type)", () => {
    // Both moves are Grass type, Bulbasaur is Grass → both get STAB
    const quick = makeMoveFixture({ power: 10, energy: 10, durationMs: 1000 });
    const charge = makeMoveFixture({
      id: "GRASS_CHARGE",
      power: 100,
      energy: -100,
      durationMs: 2000,
    });

    const comboStab = computeCombo(quick, charge, pokemon, realStats);

    // Normal type move (no STAB)
    const quickNoStab = makeMoveFixture({
      power: 10,
      energy: 10,
      durationMs: 1000,
      type: { type: "POKEMON_TYPE_NORMAL", name: "Normal" },
    });
    const chargeNoStab = makeMoveFixture({
      id: "NORMAL_CHARGE",
      power: 100,
      energy: -100,
      durationMs: 2000,
      type: { type: "POKEMON_TYPE_NORMAL", name: "Normal" },
    });

    const comboNoStab = computeCombo(quickNoStab, chargeNoStab, pokemon, realStats);

    // STAB combo should be 1.2x higher DPS
    expect(comboStab!.comboDps).toBeCloseTo(comboNoStab!.comboDps * 1.2, 1);
  });

  it("correctly computes energy cycle (n_fast)", () => {
    // quick: 10 energy gain, 1s duration → eps = 10/s
    // charge: 50 energy cost, 2s duration
    // n_fast = ceil(50 / (10 * 1)) = 5
    // cycle_time = 5 * 1 + 2 = 7s
    const quick = makeMoveFixture({
      power: 10,
      energy: 10,
      durationMs: 1000,
      type: { type: "POKEMON_TYPE_NORMAL", name: "Normal" },
    });
    const charge = makeMoveFixture({
      id: "CHARGE",
      power: 100,
      energy: -50,
      durationMs: 2000,
      type: { type: "POKEMON_TYPE_NORMAL", name: "Normal" },
    });

    const combo = computeCombo(quick, charge, pokemon, realStats);

    // combo_dps = (5 * 10 * 1.0 + 100 * 1.0) / 7 = 150 / 7 = 21.43
    expect(combo!.comboDps).toBeCloseTo(21.43, 1);
  });

  it("returns null for moves with zero energy", () => {
    const quick = makeMoveFixture({ energy: 0 });
    const charge = makeMoveFixture({ id: "CHARGE", power: 50, energy: -50, durationMs: 2000 });
    expect(computeCombo(quick, charge, pokemon, realStats)).toBeNull();
  });

  it("returns null for moves with zero durationMs", () => {
    const quick = makeMoveFixture({ durationMs: 0 });
    const charge = makeMoveFixture({ id: "CHARGE", power: 50, energy: -50, durationMs: 2000 });
    expect(computeCombo(quick, charge, pokemon, realStats)).toBeNull();
  });

  it("returns null for charge moves with zero energy cost", () => {
    const quick = makeMoveFixture();
    const charge = makeMoveFixture({ id: "CHARGE", power: 50, energy: 0, durationMs: 2000 });
    expect(computeCombo(quick, charge, pokemon, realStats)).toBeNull();
  });

  it("applies STAB for secondary type", () => {
    // Poison move on Bulbasaur (secondary type is Poison)
    const quick = makeMoveFixture({
      power: 10,
      energy: 10,
      durationMs: 1000,
      type: { type: "POKEMON_TYPE_POISON", name: "Poison" },
    });
    const charge = makeMoveFixture({
      id: "POISON_CHARGE",
      power: 100,
      energy: -50,
      durationMs: 2000,
      type: { type: "POKEMON_TYPE_POISON", name: "Poison" },
    });

    const comboPoison = computeCombo(quick, charge, pokemon, realStats);

    // Same power/energy/duration but Normal type (no STAB)
    const quickNormal = makeMoveFixture({
      power: 10,
      energy: 10,
      durationMs: 1000,
      type: { type: "POKEMON_TYPE_NORMAL", name: "Normal" },
    });
    const chargeNormal = makeMoveFixture({
      id: "NORMAL_CHARGE",
      power: 100,
      energy: -50,
      durationMs: 2000,
      type: { type: "POKEMON_TYPE_NORMAL", name: "Normal" },
    });

    const comboNormal = computeCombo(quickNormal, chargeNormal, pokemon, realStats);

    expect(comboPoison!.comboDps).toBeCloseTo(comboNormal!.comboDps * 1.2, 1);
  });
});

describe("tdoCalculator", () => {
  it("populates computed field with real stats and movesets", () => {
    const pokemon = makePokemonFixture();
    const result = tdoCalculator.compute(pokemon);

    expect(result.computed).not.toBeNull();
    expect(result.computed!.pokemon.atkReal).toBeGreaterThan(0);
    expect(result.computed!.pokemon.defReal).toBeGreaterThan(0);
    expect(result.computed!.pokemon.hpReal).toBeGreaterThan(0);
    expect(result.computed!.movesets.regular).toHaveLength(1); // 1 quick × 1 cinematic
    expect(result.computed!.movesets.elite).toHaveLength(0); // no elite moves
  });

  it("skips Pokemon with null stats", () => {
    const pokemon = makePokemonFixture({ stats: null });
    const result = tdoCalculator.compute(pokemon);
    expect(result.computed).toBeNull();
  });

  it("sorts regular movesets by TDO descending", () => {
    const pokemon = makePokemonFixture({
      quickMoves: [
        makeMoveFixture({ id: "WEAK_FAST", power: 3, energy: 5, durationMs: 500 }),
        makeMoveFixture({ id: "STRONG_FAST", power: 12, energy: 8, durationMs: 1000 }),
      ],
      cinematicMoves: [
        makeMoveFixture({ id: "CHARGE_A", power: 90, energy: -50, durationMs: 2600 }),
      ],
    });

    const result = tdoCalculator.compute(pokemon);
    const regular = result.computed!.movesets.regular;

    expect(regular.length).toBe(2);
    expect(regular[0].tdo).toBeGreaterThanOrEqual(regular[1].tdo);
  });

  it("separates elite combos from regular combos", () => {
    const pokemon = makePokemonFixture({
      quickMoves: [makeMoveFixture({ id: "REGULAR_FAST" })],
      cinematicMoves: [
        makeMoveFixture({ id: "REGULAR_CHARGE", power: 80, energy: -50, durationMs: 2500 }),
      ],
      eliteQuickMoves: [],
      eliteCinematicMoves: [
        makeMoveFixture({ id: "ELITE_CHARGE", power: 120, energy: -50, durationMs: 2500 }),
      ],
    });

    const result = tdoCalculator.compute(pokemon);

    // Regular: REGULAR_FAST × REGULAR_CHARGE only
    expect(result.computed!.movesets.regular).toHaveLength(1);
    expect(result.computed!.movesets.regular[0].cinematicMove).toBe("REGULAR_CHARGE");

    // Elite: REGULAR_FAST × ELITE_CHARGE (uses elite move)
    expect(result.computed!.movesets.elite).toHaveLength(1);
    expect(result.computed!.movesets.elite[0].cinematicMove).toBe("ELITE_CHARGE");
  });

  it("elite set includes combos with elite quick move", () => {
    const pokemon = makePokemonFixture({
      quickMoves: [makeMoveFixture({ id: "REGULAR_FAST" })],
      cinematicMoves: [
        makeMoveFixture({ id: "REGULAR_CHARGE", power: 80, energy: -50, durationMs: 2500 }),
      ],
      eliteQuickMoves: [
        makeMoveFixture({ id: "ELITE_FAST", power: 15, energy: 12, durationMs: 800 }),
      ],
      eliteCinematicMoves: [],
    });

    const result = tdoCalculator.compute(pokemon);

    // Elite set: ELITE_FAST × REGULAR_CHARGE
    const eliteCombos = result.computed!.movesets.elite;
    expect(eliteCombos.length).toBeGreaterThan(0);
    expect(eliteCombos.some((c) => c.quickMove === "ELITE_FAST")).toBe(true);
  });

  it("elite set does not include purely regular combos", () => {
    const pokemon = makePokemonFixture({
      quickMoves: [makeMoveFixture({ id: "REGULAR_FAST" })],
      cinematicMoves: [
        makeMoveFixture({ id: "REGULAR_CHARGE", power: 80, energy: -50, durationMs: 2500 }),
      ],
      eliteQuickMoves: [makeMoveFixture({ id: "ELITE_FAST" })],
      eliteCinematicMoves: [
        makeMoveFixture({ id: "ELITE_CHARGE", power: 120, energy: -50, durationMs: 2500 }),
      ],
    });

    const result = tdoCalculator.compute(pokemon);

    // The purely regular combo (REGULAR_FAST × REGULAR_CHARGE) should NOT be in elite
    const eliteCombos = result.computed!.movesets.elite;
    const purelyRegular = eliteCombos.find(
      (c) => c.quickMove === "REGULAR_FAST" && c.cinematicMove === "REGULAR_CHARGE"
    );
    expect(purelyRegular).toBeUndefined();
  });

  it("handles Pokemon with no cinematic moves", () => {
    const pokemon = makePokemonFixture({
      quickMoves: [makeMoveFixture()],
      cinematicMoves: [],
    });

    const result = tdoCalculator.compute(pokemon);
    expect(result.computed!.movesets.regular).toHaveLength(0);
  });

  it("handles Pokemon with no quick moves", () => {
    const pokemon = makePokemonFixture({
      quickMoves: [],
      cinematicMoves: [
        makeMoveFixture({ id: "CHARGE", power: 80, energy: -50, durationMs: 2500 }),
      ],
    });

    const result = tdoCalculator.compute(pokemon);
    expect(result.computed!.movesets.regular).toHaveLength(0);
  });

  it("rounds values to 2 decimal places", () => {
    const pokemon = makePokemonFixture();
    const result = tdoCalculator.compute(pokemon);

    const combo = result.computed!.movesets.regular[0];
    const dpsDecimals = combo.comboDps.toString().split(".")[1]?.length ?? 0;
    const atkDecimals = combo.comboDpsAtk.toString().split(".")[1]?.length ?? 0;
    const tdoDecimals = combo.tdo.toString().split(".")[1]?.length ?? 0;

    expect(dpsDecimals).toBeLessThanOrEqual(2);
    expect(atkDecimals).toBeLessThanOrEqual(2);
    expect(tdoDecimals).toBeLessThanOrEqual(2);
  });
});
