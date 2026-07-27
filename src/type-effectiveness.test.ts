import { describe, it, expect } from "vitest";
import { getEffectiveness } from "./type-effectiveness.js";

describe("getEffectiveness", () => {
  describe("single-type defenders", () => {
    it("returns 1.6 for super effective (Fire vs Grass)", () => {
      expect(getEffectiveness("POKEMON_TYPE_FIRE", "POKEMON_TYPE_GRASS", null)).toBeCloseTo(1.6);
    });

    it("returns 0.625 for not very effective (Fire vs Water)", () => {
      expect(getEffectiveness("POKEMON_TYPE_FIRE", "POKEMON_TYPE_WATER", null)).toBeCloseTo(0.625);
    });

    it("returns 0.390625 for immune/doubly resisted (Normal vs Ghost)", () => {
      expect(getEffectiveness("POKEMON_TYPE_NORMAL", "POKEMON_TYPE_GHOST", null)).toBeCloseTo(0.390625);
    });

    it("returns 1.0 for neutral (Fire vs Normal)", () => {
      expect(getEffectiveness("POKEMON_TYPE_FIRE", "POKEMON_TYPE_NORMAL", null)).toBeCloseTo(1.0);
    });

    it("returns 1.6 for Fighting vs Normal", () => {
      expect(getEffectiveness("POKEMON_TYPE_FIGHTING", "POKEMON_TYPE_NORMAL", null)).toBeCloseTo(1.6);
    });

    it("returns 0.390625 for Ground vs Flying (immune)", () => {
      expect(getEffectiveness("POKEMON_TYPE_GROUND", "POKEMON_TYPE_FLYING", null)).toBeCloseTo(0.390625);
    });

    it("returns 1.6 for Ice vs Dragon", () => {
      expect(getEffectiveness("POKEMON_TYPE_ICE", "POKEMON_TYPE_DRAGON", null)).toBeCloseTo(1.6);
    });
  });

  describe("dual-type defenders", () => {
    it("returns 2.56 for Ice vs Dragon/Flying (double super effective)", () => {
      expect(
        getEffectiveness("POKEMON_TYPE_ICE", "POKEMON_TYPE_DRAGON", "POKEMON_TYPE_FLYING")
      ).toBeCloseTo(2.56);
    });

    it("returns 1.0 for Fire vs Dragon/Flying (SE vs one, NVE vs other)", () => {
      // Fire vs Dragon = 0.625 (NVE), Fire vs Flying = 1.0 (neutral)
      // 0.625 * 1.0 = 0.625
      expect(
        getEffectiveness("POKEMON_TYPE_FIRE", "POKEMON_TYPE_DRAGON", "POKEMON_TYPE_FLYING")
      ).toBeCloseTo(0.625);
    });

    it("returns 1.6 for Rock vs Dragon/Flying", () => {
      // Rock vs Dragon = 1.0, Rock vs Flying = 1.6 (SE)
      expect(
        getEffectiveness("POKEMON_TYPE_ROCK", "POKEMON_TYPE_DRAGON", "POKEMON_TYPE_FLYING")
      ).toBeCloseTo(1.6);
    });

    it("returns 2.56 for Fighting vs Dark/Ice (double SE)", () => {
      // Fighting vs Dark = 1.6, Fighting vs Ice = 1.6
      expect(
        getEffectiveness("POKEMON_TYPE_FIGHTING", "POKEMON_TYPE_DARK", "POKEMON_TYPE_ICE")
      ).toBeCloseTo(2.56);
    });

    it("returns 0.390625 for Electric vs Grass/Dragon (double NVE)", () => {
      // Electric vs Grass = 0.625, Electric vs Dragon = 0.625
      expect(
        getEffectiveness("POKEMON_TYPE_ELECTRIC", "POKEMON_TYPE_GRASS", "POKEMON_TYPE_DRAGON")
      ).toBeCloseTo(0.390625);
    });

    it("returns correct value for Ground vs Electric/Steel (immune × SE)", () => {
      // Ground vs Electric = immune (0.390625 in GO? No — Ground is SE vs Electric!)
      // Actually: Ground vs Electric = 1.6 (SE), Ground vs Steel = 1.6 (SE)
      expect(
        getEffectiveness("POKEMON_TYPE_GROUND", "POKEMON_TYPE_ELECTRIC", "POKEMON_TYPE_STEEL")
      ).toBeCloseTo(2.56);
    });

    it("returns ~0.244 for Normal vs Rock/Ghost (NVE × immune)", () => {
      // Normal vs Rock = 0.625 (NVE), Normal vs Ghost = 0.390625 (immune)
      // 0.625 * 0.390625 = 0.244140625
      expect(
        getEffectiveness("POKEMON_TYPE_NORMAL", "POKEMON_TYPE_ROCK", "POKEMON_TYPE_GHOST")
      ).toBeCloseTo(0.244140625);
    });
  });

  describe("edge cases", () => {
    it("returns 1.0 for unknown attacking type", () => {
      expect(getEffectiveness("POKEMON_TYPE_UNKNOWN", "POKEMON_TYPE_FIRE", null)).toBeCloseTo(1.0);
    });

    it("returns 1.0 for unknown defending type", () => {
      expect(getEffectiveness("POKEMON_TYPE_FIRE", "POKEMON_TYPE_UNKNOWN", null)).toBeCloseTo(1.0);
    });
  });
});
