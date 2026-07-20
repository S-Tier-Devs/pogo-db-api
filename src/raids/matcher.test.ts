import { describe, it, expect } from "vitest";
import { createMatcher, PokemonIndexEntry } from "./matcher.js";

const TEST_INDEX: PokemonIndexEntry[] = [
  { dexNr: 25, name: "Pikachu", id: "PIKACHU" },
  { dexNr: 26, name: "Raichu", id: "RAICHU" },
  { dexNr: 157, name: "Typhlosion", id: "TYPHLOSION" },
  { dexNr: 231, name: "Phanpy", id: "PHANPY" },
  { dexNr: 254, name: "Sceptile", id: "SCEPTILE" },
  { dexNr: 280, name: "Ralts", id: "RALTS" },
  { dexNr: 382, name: "Kyogre", id: "KYOGRE" },
  { dexNr: 484, name: "Palkia", id: "PALKIA" },
  { dexNr: 554, name: "Darumaka", id: "DARUMAKA" },
  { dexNr: 884, name: "Duraludon", id: "DURALUDON" },
];

describe("createMatcher", () => {
  const match = createMatcher(TEST_INDEX);

  describe("exact matches", () => {
    it("matches a simple base name", () => {
      expect(match("Kyogre")).toBe(382);
    });

    it("matches case-insensitively", () => {
      expect(match("kyogre")).toBe(382);
      expect(match("KYOGRE")).toBe(382);
    });

    it("matches Duraludon directly", () => {
      expect(match("Duraludon")).toBe(884);
    });
  });

  describe("prefix stripping", () => {
    it("strips Shadow prefix", () => {
      expect(match("Shadow Palkia")).toBe(484);
    });

    it("strips Mega prefix", () => {
      expect(match("Mega Sceptile")).toBe(254);
    });

    it("strips Alolan prefix", () => {
      expect(match("Alolan Raichu")).toBe(26);
    });

    it("strips Hisuian prefix", () => {
      expect(match("Hisuian Typhlosion")).toBe(157);
    });

    it("strips Galarian prefix", () => {
      expect(match("Galarian Darumaka")).toBe(554);
    });

    it("strips Paldean prefix", () => {
      expect(match("Paldean Typhlosion")).toBe(157);
    });

    it("strips Shadow prefix for Shadow Phanpy", () => {
      expect(match("Shadow Phanpy")).toBe(231);
    });
  });

  describe("costume stripping", () => {
    it("strips 'with' costume suffix", () => {
      expect(match("Pikachu with red accents")).toBe(25);
    });

    it("strips 'wearing' costume suffix", () => {
      expect(match("Pikachu wearing a Safari Hat")).toBe(25);
    });

    it("handles complex costume names", () => {
      expect(match("Formal Pikachu with red accents")).toBe(25);
    });

    it("handles event prefix names", () => {
      expect(match("World Championships 2022 Pikachu")).toBe(25);
    });

    it("handles crown/accessory prefix names", () => {
      expect(match("Amethyst Crown Pikachu")).toBe(25);
    });

    it("strips 'wearing a varsity jacket'", () => {
      expect(match("Pikachu wearing a varsity jacket")).toBe(25);
    });
  });

  describe("unmatched names", () => {
    it("returns null for completely unknown names", () => {
      expect(match("Florgbulon")).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(match("")).toBeNull();
    });

    it("returns null for names with no recognizable base", () => {
      expect(match("Primal Unknown Beast")).toBeNull();
    });
  });
});
