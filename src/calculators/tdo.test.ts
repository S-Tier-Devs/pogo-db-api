import { describe, it, expect } from "vitest";
import { tdoCalculator, computeRealStats, computeCombo, computeER } from "./tdo.js";
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

describe("computeER", () => {
  it("computes ER as DPS^alpha * TDO^(1-alpha)", () => {
    const dps = 30;
    const tdo = 600;
    const alpha = 0.75;
    const expected = Math.pow(30, 0.75) * Math.pow(600, 0.25);
    expect(computeER(dps, tdo, alpha)).toBeCloseTo(expected, 2);
  });

  it("returns 0 for zero DPS", () => {
    expect(computeER(0, 500)).toBe(0);
  });

  it("returns 0 for zero TDO", () => {
    expect(computeER(30, 0)).toBe(0);
  });

  it("higher DPS wins with similar TDO (DPS-weighted)", () => {
    const highDps = computeER(35, 500);
    const lowDps = computeER(25, 500);
    expect(highDps).toBeGreaterThan(lowDps);
  });

  it("DPS matters more than TDO at alpha=0.75", () => {
    // 10% more DPS vs 10% more TDO
    const moreDps = computeER(33, 500);
    const moreTdo = computeER(30, 550);
    expect(moreDps).toBeGreaterThan(moreTdo);
  });
});

describe("computeCombo", () => {
  const pokemon = makePokemonFixture();
  const realStats = computeRealStats(pokemon.stats!);

  it("computes a valid combo with DPS, TDO, and ER", () => {
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
    expect(combo!.dps).toBeGreaterThan(0);
    expect(combo!.tdo).toBeGreaterThan(0);
    expect(combo!.er).toBeGreaterThan(0);
  });

  it("TDO formula uses DPS * HP * DEF / 900", () => {
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

    // TDO should equal DPS * HP * DEF / 900
    const expectedTdo = combo!.dps * realStats.hpReal * realStats.defReal / 900;
    expect(combo!.tdo).toBeCloseTo(expectedTdo, 0);
  });

  it("ER equals DPS^0.75 * TDO^0.25", () => {
    const quick = makeMoveFixture();
    const charge = makeMoveFixture({
      id: "POWER_WHIP",
      power: 90,
      energy: -50,
      durationMs: 2600,
      type: { type: "POKEMON_TYPE_GRASS", name: "Grass" },
    });

    const combo = computeCombo(quick, charge, pokemon, realStats);
    const expectedER = Math.pow(combo!.dps, 0.75) * Math.pow(combo!.tdo, 0.25);
    expect(combo!.er).toBeCloseTo(expectedER, 0);
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

  it("STAB moves produce higher DPS than non-STAB", () => {
    const quickStab = makeMoveFixture({
      power: 10, energy: 10, durationMs: 1000,
      type: { type: "POKEMON_TYPE_GRASS", name: "Grass" },
    });
    const chargeStab = makeMoveFixture({
      id: "GRASS_CHARGE", power: 100, energy: -50, durationMs: 2000,
      type: { type: "POKEMON_TYPE_GRASS", name: "Grass" },
    });

    const quickNoStab = makeMoveFixture({
      power: 10, energy: 10, durationMs: 1000,
      type: { type: "POKEMON_TYPE_NORMAL", name: "Normal" },
    });
    const chargeNoStab = makeMoveFixture({
      id: "NORMAL_CHARGE", power: 100, energy: -50, durationMs: 2000,
      type: { type: "POKEMON_TYPE_NORMAL", name: "Normal" },
    });

    const comboStab = computeCombo(quickStab, chargeStab, pokemon, realStats);
    const comboNoStab = computeCombo(quickNoStab, chargeNoStab, pokemon, realStats);

    expect(comboStab!.dps).toBeGreaterThan(comboNoStab!.dps);
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
    expect(result.computed!.movesets.regular).toHaveLength(1);
    expect(result.computed!.movesets.elite).toHaveLength(0);
  });

  it("skips Pokemon with null stats", () => {
    const pokemon = makePokemonFixture({ stats: null });
    const result = tdoCalculator.compute(pokemon);
    expect(result.computed).toBeNull();
  });

  it("sorts regular movesets by ER descending", () => {
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
    expect(regular[0].er).toBeGreaterThanOrEqual(regular[1].er);
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

    expect(result.computed!.movesets.regular).toHaveLength(1);
    expect(result.computed!.movesets.regular[0].cinematicMove).toBe("REGULAR_CHARGE");

    expect(result.computed!.movesets.elite).toHaveLength(1);
    expect(result.computed!.movesets.elite[0].cinematicMove).toBe("ELITE_CHARGE");
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

    const eliteCombos = result.computed!.movesets.elite;
    const purelyRegular = eliteCombos.find(
      (c) => c.quickMove === "REGULAR_FAST" && c.cinematicMove === "REGULAR_CHARGE"
    );
    expect(purelyRegular).toBeUndefined();
  });

  it("rounds values to 2 decimal places", () => {
    const pokemon = makePokemonFixture();
    const result = tdoCalculator.compute(pokemon);

    const combo = result.computed!.movesets.regular[0];
    const dpsDecimals = combo.dps.toString().split(".")[1]?.length ?? 0;
    const tdoDecimals = combo.tdo.toString().split(".")[1]?.length ?? 0;
    const erDecimals = combo.er.toString().split(".")[1]?.length ?? 0;

    expect(dpsDecimals).toBeLessThanOrEqual(2);
    expect(tdoDecimals).toBeLessThanOrEqual(2);
    expect(erDecimals).toBeLessThanOrEqual(2);
  });
});
