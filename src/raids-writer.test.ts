import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildRaidsOutput } from "./raids-writer.js";
import type { RaidBoss, RaidEvent } from "./raids/parser.js";

describe("buildRaidsOutput", () => {
  const mockEvent: RaidEvent = {
    name: "Test Event",
    description: "A test event",
    starts: "Jul 15, 2026, 6:00 AM",
    ends: "Jul 20, 2026, 8:00 PM",
  };

  const mockRaids: RaidBoss[] = [
    {
      name: "Kyogre",
      tier: 5,
      shadow: false,
      types: ["Water"],
      cpRange: { min: 2260, max: 2351 },
      boostedCpRange: { min: 2825, max: 2939 },
      weatherBoosts: ["Rainy"],
    },
    {
      name: "Shadow Palkia",
      tier: 5,
      shadow: true,
      types: ["Water", "Dragon"],
      cpRange: { min: 2118, max: 2280 },
      boostedCpRange: { min: 2648, max: 2850 },
      weatherBoosts: ["Rainy", "Windy"],
    },
    {
      name: "Unknown Boss",
      tier: 1,
      shadow: false,
      types: ["Normal"],
      cpRange: null,
      boostedCpRange: null,
      weatherBoosts: [],
    },
  ];

  const mockMatcher = (name: string): number | null => {
    const map: Record<string, number> = {
      Kyogre: 382,
      "Shadow Palkia": 484,
    };
    return map[name] ?? null;
  };

  it("produces correct output structure", () => {
    const result = buildRaidsOutput(mockRaids, mockEvent, mockMatcher);
    expect(result.event).toEqual(mockEvent);
    expect(result.raids).toHaveLength(3);
    expect(result.lastUpdated).toBeDefined();
  });

  it("cross-references dexNr for known Pokemon", () => {
    const result = buildRaidsOutput(mockRaids, mockEvent, mockMatcher);
    expect(result.raids[0].dexNr).toBe(382);
    expect(result.raids[1].dexNr).toBe(484);
  });

  it("sets dexNr to null for unknown Pokemon", () => {
    const result = buildRaidsOutput(mockRaids, mockEvent, mockMatcher);
    expect(result.raids[2].dexNr).toBeNull();
  });

  it("preserves all boss fields", () => {
    const result = buildRaidsOutput(mockRaids, mockEvent, mockMatcher);
    const kyogre = result.raids[0];
    expect(kyogre.name).toBe("Kyogre");
    expect(kyogre.tier).toBe(5);
    expect(kyogre.shadow).toBe(false);
    expect(kyogre.types).toEqual(["Water"]);
    expect(kyogre.cpRange).toEqual({ min: 2260, max: 2351 });
    expect(kyogre.boostedCpRange).toEqual({ min: 2825, max: 2939 });
    expect(kyogre.weatherBoosts).toEqual(["Rainy"]);
  });

  it("preserves shadow flag", () => {
    const result = buildRaidsOutput(mockRaids, mockEvent, mockMatcher);
    expect(result.raids[1].shadow).toBe(true);
  });

  it("handles null event", () => {
    const result = buildRaidsOutput(mockRaids, null, mockMatcher);
    expect(result.event).toBeNull();
  });

  it("handles empty raids array", () => {
    const result = buildRaidsOutput([], mockEvent, mockMatcher);
    expect(result.raids).toEqual([]);
  });

  it("includes lastUpdated as ISO string", () => {
    const before = new Date().toISOString();
    const result = buildRaidsOutput(mockRaids, mockEvent, mockMatcher);
    const after = new Date().toISOString();
    expect(result.lastUpdated >= before).toBe(true);
    expect(result.lastUpdated <= after).toBe(true);
  });
});
