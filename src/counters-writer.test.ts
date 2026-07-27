import { describe, it, expect } from "vitest";
import {
  computeEffectiveCombo,
  findBestCounter,
  generateCounters,
} from "./counters-writer.js";
import type { Pokemon, Move } from "./types.js";
import { computeRealStats } from "./calculators/tdo.js";

/** Helper to create a minimal Move */
function makeMove(overrides: Partial<Move> & { id: string; name: string }): Move {
  return {
    power: 10,
    energy: 5,
    durationMs: 500,
    type: { type: "POKEMON_TYPE_NORMAL", name: "Normal" },
    combat: null,
    computed: { dps: 0, stabDps: 0 },
    ...overrides,
  };
}

/** Helper to create a minimal Pokemon */
function makePokemon(overrides: Partial<Pokemon> & { id: string; name: string }): Pokemon {
  return {
    formId: overrides.id,
    dexNr: 1,
    generation: 1,
    stats: { stamina: 200, attack: 250, defense: 200 },
    primaryType: { type: "POKEMON_TYPE_NORMAL", name: "Normal" },
    secondaryType: null,
    pokemonClass: null,
    quickMoves: [],
    cinematicMoves: [],
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

describe("computeEffectiveCombo", () => {
  const iceMove = makeMove({
    id: "ICE_BEAM",
    name: "Ice Beam",
    power: 90,
    energy: -50,
    durationMs: 3000,
    type: { type: "POKEMON_TYPE_ICE", name: "Ice" },
  });

  const psychoCut = makeMove({
    id: "PSYCHO_CUT_FAST",
    name: "Psycho Cut",
    power: 4,
    energy: 7,
    durationMs: 500,
    type: { type: "POKEMON_TYPE_PSYCHIC", name: "Psychic" },
  });

  const powderSnow = makeMove({
    id: "POWDER_SNOW_FAST",
    name: "Powder Snow",
    power: 6,
    energy: 15,
    durationMs: 1000,
    type: { type: "POKEMON_TYPE_ICE", name: "Ice" },
  });

  const avalanche = makeMove({
    id: "AVALANCHE",
    name: "Avalanche",
    power: 90,
    energy: -50,
    durationMs: 2500,
    type: { type: "POKEMON_TYPE_ICE", name: "Ice" },
  });

  it("applies type effectiveness — Ice vs Dragon/Flying gets 2.56× on Ice moves", () => {
    const attacker = makePokemon({
      id: "MAMOSWINE",
      name: "Mamoswine",
      stats: { stamina: 242, attack: 247, defense: 146 },
      primaryType: { type: "POKEMON_TYPE_ICE", name: "Ice" },
      secondaryType: { type: "POKEMON_TYPE_GROUND", name: "Ground" },
      quickMoves: [powderSnow],
      cinematicMoves: [avalanche],
    });

    const realStats = computeRealStats(attacker.stats!);

    // Against Dragon/Flying (Rayquaza)
    const effective = computeEffectiveCombo(
      powderSnow,
      avalanche,
      attacker,
      realStats,
      "POKEMON_TYPE_DRAGON",
      "POKEMON_TYPE_FLYING"
    );

    // Against Neutral target
    const neutral = computeEffectiveCombo(
      powderSnow,
      avalanche,
      attacker,
      realStats,
      "POKEMON_TYPE_NORMAL",
      null
    );

    expect(effective).not.toBeNull();
    expect(neutral).not.toBeNull();

    // Effective DPS should be significantly higher than neutral
    // Both moves get 2.56× vs Dragon/Flying and 1.2× STAB = 3.072× total
    // vs neutral: just 1.2× STAB
    // Ratio should be approximately 2.56
    const dpsRatio = effective!.dps / neutral!.dps;
    expect(dpsRatio).toBeCloseTo(2.56, 1);
  });

  it("applies mixed moveset effectiveness — Psycho Cut neutral, Ice Beam SE", () => {
    const attacker = makePokemon({
      id: "MEWTWO",
      name: "Mewtwo",
      stats: { stamina: 214, attack: 300, defense: 182 },
      primaryType: { type: "POKEMON_TYPE_PSYCHIC", name: "Psychic" },
      secondaryType: null,
      quickMoves: [psychoCut],
      cinematicMoves: [iceMove],
    });

    const realStats = computeRealStats(attacker.stats!);

    // Psycho Cut vs Dragon/Flying: neutral (1.0)
    // Ice Beam vs Dragon/Flying: 2.56×
    const result = computeEffectiveCombo(
      psychoCut,
      iceMove,
      attacker,
      realStats,
      "POKEMON_TYPE_DRAGON",
      "POKEMON_TYPE_FLYING"
    );

    expect(result).not.toBeNull();
    expect(result!.dps).toBeGreaterThan(0);
    expect(result!.tdo).toBeGreaterThan(0);
    expect(result!.er).toBeGreaterThan(0);
  });

  it("returns null for invalid moves (0 energy)", () => {
    const badMove = makeMove({
      id: "BAD",
      name: "Bad",
      energy: 0,
      durationMs: 500,
    });
    const attacker = makePokemon({ id: "TEST", name: "Test" });
    const realStats = computeRealStats(attacker.stats!);

    const result = computeEffectiveCombo(
      badMove,
      iceMove,
      attacker,
      realStats,
      "POKEMON_TYPE_DRAGON",
      null
    );
    expect(result).toBeNull();
  });
});

describe("findBestCounter", () => {
  const powderSnow = makeMove({
    id: "POWDER_SNOW_FAST",
    name: "Powder Snow",
    power: 6,
    energy: 15,
    durationMs: 1000,
    type: { type: "POKEMON_TYPE_ICE", name: "Ice" },
  });

  const mudSlap = makeMove({
    id: "MUD_SLAP_FAST",
    name: "Mud-Slap",
    power: 15,
    energy: 9,
    durationMs: 1500,
    type: { type: "POKEMON_TYPE_GROUND", name: "Ground" },
  });

  const avalanche = makeMove({
    id: "AVALANCHE",
    name: "Avalanche",
    power: 90,
    energy: -50,
    durationMs: 2500,
    type: { type: "POKEMON_TYPE_ICE", name: "Ice" },
  });

  const earthquake = makeMove({
    id: "EARTHQUAKE",
    name: "Earthquake",
    power: 140,
    energy: -100,
    durationMs: 3500,
    type: { type: "POKEMON_TYPE_GROUND", name: "Ground" },
  });

  it("picks the best moveset by ER against target typing", () => {
    const attacker = makePokemon({
      id: "MAMOSWINE",
      name: "Mamoswine",
      stats: { stamina: 242, attack: 247, defense: 146 },
      primaryType: { type: "POKEMON_TYPE_ICE", name: "Ice" },
      secondaryType: { type: "POKEMON_TYPE_GROUND", name: "Ground" },
      quickMoves: [powderSnow, mudSlap],
      cinematicMoves: [avalanche, earthquake],
    });

    // Against Dragon/Flying — Ice moves get 2.56×, Ground is immune to Flying
    const result = findBestCounter(
      attacker,
      "POKEMON_TYPE_DRAGON",
      "POKEMON_TYPE_FLYING"
    );

    expect(result).not.toBeNull();
    // Should pick Powder Snow + Avalanche (Ice × 2.56) over Ground moves
    expect(result!.quickMove.id).toBe("POWDER_SNOW_FAST");
    expect(result!.cinematicMove.id).toBe("AVALANCHE");
  });

  it("marks elite moves correctly", () => {
    const eliteCharge = makeMove({
      id: "ELITE_MOVE",
      name: "Elite Move",
      power: 200,
      energy: -100,
      durationMs: 2000,
      type: { type: "POKEMON_TYPE_ICE", name: "Ice" },
    });

    const attacker = makePokemon({
      id: "TEST",
      name: "Test",
      stats: { stamina: 200, attack: 300, defense: 200 },
      primaryType: { type: "POKEMON_TYPE_ICE", name: "Ice" },
      quickMoves: [powderSnow],
      cinematicMoves: [avalanche],
      eliteCinematicMoves: [eliteCharge],
    });

    const result = findBestCounter(attacker, "POKEMON_TYPE_DRAGON", "POKEMON_TYPE_FLYING");

    expect(result).not.toBeNull();
    // Elite move is much stronger, should be selected
    expect(result!.cinematicMove.id).toBe("ELITE_MOVE");
    expect(result!.isElite).toBe(true);
  });

  it("returns null for Pokemon without stats", () => {
    const attacker = makePokemon({
      id: "NO_STATS",
      name: "No Stats",
      stats: null,
      quickMoves: [powderSnow],
      cinematicMoves: [avalanche],
    });

    const result = findBestCounter(attacker, "POKEMON_TYPE_DRAGON", null);
    expect(result).toBeNull();
  });
});

describe("generateCounters", () => {
  const powderSnow = makeMove({
    id: "POWDER_SNOW_FAST",
    name: "Powder Snow",
    power: 6,
    energy: 15,
    durationMs: 1000,
    type: { type: "POKEMON_TYPE_ICE", name: "Ice" },
  });

  const avalanche = makeMove({
    id: "AVALANCHE",
    name: "Avalanche",
    power: 90,
    energy: -50,
    durationMs: 2500,
    type: { type: "POKEMON_TYPE_ICE", name: "Ice" },
  });

  const dragonBreath = makeMove({
    id: "DRAGON_BREATH_FAST",
    name: "Dragon Breath",
    power: 6,
    energy: 4,
    durationMs: 500,
    type: { type: "POKEMON_TYPE_DRAGON", name: "Dragon" },
  });

  const outrage = makeMove({
    id: "OUTRAGE",
    name: "Outrage",
    power: 110,
    energy: -50,
    durationMs: 4000,
    type: { type: "POKEMON_TYPE_DRAGON", name: "Dragon" },
  });

  it("excludes the target from its own counter list", () => {
    const target = makePokemon({
      id: "RAYQUAZA",
      name: "Rayquaza",
      dexNr: 384,
      stats: { stamina: 213, attack: 284, defense: 170 },
      primaryType: { type: "POKEMON_TYPE_DRAGON", name: "Dragon" },
      secondaryType: { type: "POKEMON_TYPE_FLYING", name: "Flying" },
      quickMoves: [dragonBreath],
      cinematicMoves: [outrage],
    });

    const attacker = makePokemon({
      id: "MAMOSWINE",
      name: "Mamoswine",
      dexNr: 473,
      stats: { stamina: 242, attack: 247, defense: 146 },
      primaryType: { type: "POKEMON_TYPE_ICE", name: "Ice" },
      secondaryType: { type: "POKEMON_TYPE_GROUND", name: "Ground" },
      quickMoves: [powderSnow],
      cinematicMoves: [avalanche],
    });

    const counters = generateCounters(target, [target, attacker]);

    expect(counters.length).toBe(1);
    expect(counters[0].id).toBe("MAMOSWINE");
    expect(counters[0].name).toBe("Mamoswine");
  });

  it("returns counters sorted by ER descending", () => {
    const target = makePokemon({
      id: "DRAGONITE",
      name: "Dragonite",
      dexNr: 149,
      stats: { stamina: 209, attack: 263, defense: 198 },
      primaryType: { type: "POKEMON_TYPE_DRAGON", name: "Dragon" },
      secondaryType: { type: "POKEMON_TYPE_FLYING", name: "Flying" },
      quickMoves: [dragonBreath],
      cinematicMoves: [outrage],
    });

    const strongAttacker = makePokemon({
      id: "STRONG",
      name: "Strong Ice",
      dexNr: 900,
      stats: { stamina: 200, attack: 300, defense: 200 },
      primaryType: { type: "POKEMON_TYPE_ICE", name: "Ice" },
      quickMoves: [powderSnow],
      cinematicMoves: [avalanche],
    });

    const weakAttacker = makePokemon({
      id: "WEAK",
      name: "Weak Dragon",
      dexNr: 901,
      stats: { stamina: 150, attack: 150, defense: 100 },
      primaryType: { type: "POKEMON_TYPE_DRAGON", name: "Dragon" },
      quickMoves: [dragonBreath],
      cinematicMoves: [outrage],
    });

    const counters = generateCounters(target, [target, strongAttacker, weakAttacker]);

    expect(counters.length).toBe(2);
    expect(counters[0].id).toBe("STRONG");
    expect(counters[1].id).toBe("WEAK");
    expect(counters[0].er).toBeGreaterThan(counters[1].er);
  });

  it("limits results to top 40", () => {
    const target = makePokemon({
      id: "TARGET",
      name: "Target",
      dexNr: 1,
      stats: { stamina: 200, attack: 200, defense: 200 },
      primaryType: { type: "POKEMON_TYPE_NORMAL", name: "Normal" },
      quickMoves: [dragonBreath],
      cinematicMoves: [outrage],
    });

    // Create 50 attackers
    const attackers = Array.from({ length: 50 }, (_, i) =>
      makePokemon({
        id: `ATTACKER_${i}`,
        name: `Attacker ${i}`,
        dexNr: 100 + i,
        stats: { stamina: 200, attack: 200 + i, defense: 200 },
        primaryType: { type: "POKEMON_TYPE_FIGHTING", name: "Fighting" },
        quickMoves: [
          makeMove({
            id: "COUNTER_FAST",
            name: "Counter",
            power: 12,
            energy: 8,
            durationMs: 1000,
            type: { type: "POKEMON_TYPE_FIGHTING", name: "Fighting" },
          }),
        ],
        cinematicMoves: [
          makeMove({
            id: "CLOSE_COMBAT",
            name: "Close Combat",
            power: 105,
            energy: -100,
            durationMs: 2500,
            type: { type: "POKEMON_TYPE_FIGHTING", name: "Fighting" },
          }),
        ],
      })
    );

    const counters = generateCounters(target, [target, ...attackers]);
    expect(counters.length).toBe(40);
    // Highest ATK attacker should be first
    expect(counters[0].id).toBe("ATTACKER_49");
  });
});
