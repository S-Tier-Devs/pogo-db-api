import { describe, it, expect } from "vitest";
import { parseRaidPage } from "./parser.js";
import { RAID_PAGE_HTML } from "./fixtures.js";

describe("parseRaidPage", () => {
  const result = parseRaidPage(RAID_PAGE_HTML);

  describe("event parsing", () => {
    it("parses the event name", () => {
      expect(result.event).not.toBeNull();
      expect(result.event!.name).toBe("Special Anniversary Raids");
    });

    it("parses the event description", () => {
      expect(result.event!.description).toBe(
        "Kyogre in 5-star raids; Mega Sceptile in Mega raids"
      );
    });

    it("parses event start and end times", () => {
      expect(result.event!.starts).toBe("Jul 15, 2026, 6:00 AM");
      expect(result.event!.ends).toBe("Jul 20, 2026, 8:00 PM");
    });
  });

  describe("regular raids", () => {
    it("parses all regular raid bosses", () => {
      const regular = result.raids.filter((r) => !r.shadow);
      expect(regular).toHaveLength(4);
    });

    it("parses a 1-star raid boss", () => {
      const pikachu = result.raids.find(
        (r) => r.name === "Pikachu wearing a Safari Hat"
      );
      expect(pikachu).toBeDefined();
      expect(pikachu!.tier).toBe(1);
      expect(pikachu!.shadow).toBe(false);
      expect(pikachu!.types).toEqual(["Electric"]);
      expect(pikachu!.cpRange).toEqual({ min: 493, max: 536 });
      expect(pikachu!.boostedCpRange).toEqual({ min: 616, max: 670 });
      expect(pikachu!.weatherBoosts).toEqual(["Rainy"]);
    });

    it("parses a 3-star raid boss with dual types", () => {
      const raichu = result.raids.find((r) => r.name === "Alolan Raichu");
      expect(raichu).toBeDefined();
      expect(raichu!.tier).toBe(3);
      expect(raichu!.shadow).toBe(false);
      expect(raichu!.types).toEqual(["Electric", "Psychic"]);
      expect(raichu!.cpRange).toEqual({ min: 1238, max: 1306 });
      expect(raichu!.boostedCpRange).toEqual({ min: 1548, max: 1633 });
      expect(raichu!.weatherBoosts).toEqual(["Rainy", "Windy"]);
    });

    it("parses a 5-star raid boss", () => {
      const kyogre = result.raids.find((r) => r.name === "Kyogre");
      expect(kyogre).toBeDefined();
      expect(kyogre!.tier).toBe(5);
      expect(kyogre!.shadow).toBe(false);
      expect(kyogre!.types).toEqual(["Water"]);
      expect(kyogre!.cpRange).toEqual({ min: 2260, max: 2351 });
      expect(kyogre!.boostedCpRange).toEqual({ min: 2825, max: 2939 });
    });

    it("parses a mega raid boss as tier 6", () => {
      const mega = result.raids.find((r) => r.name === "Mega Sceptile");
      expect(mega).toBeDefined();
      expect(mega!.tier).toBe(6);
      expect(mega!.shadow).toBe(false);
      expect(mega!.types).toEqual(["Grass", "Dragon"]);
      expect(mega!.cpRange).toEqual({ min: 1500, max: 1575 });
      expect(mega!.boostedCpRange).toEqual({ min: 1876, max: 1969 });
      expect(mega!.weatherBoosts).toEqual(["Sunny"]);
    });
  });

  describe("shadow raids", () => {
    it("parses all shadow raid bosses", () => {
      const shadows = result.raids.filter((r) => r.shadow);
      expect(shadows).toHaveLength(2);
    });

    it("parses a 1-star shadow raid boss", () => {
      const phanpy = result.raids.find((r) => r.name === "Shadow Phanpy");
      expect(phanpy).toBeDefined();
      expect(phanpy!.tier).toBe(1);
      expect(phanpy!.shadow).toBe(true);
      expect(phanpy!.types).toEqual(["Ground"]);
      expect(phanpy!.cpRange).toEqual({ min: 600, max: 689 });
      expect(phanpy!.boostedCpRange).toEqual({ min: 750, max: 862 });
      expect(phanpy!.weatherBoosts).toEqual(["Sunny"]);
    });

    it("parses a 5-star shadow raid boss", () => {
      const palkia = result.raids.find((r) => r.name === "Shadow Palkia");
      expect(palkia).toBeDefined();
      expect(palkia!.tier).toBe(5);
      expect(palkia!.shadow).toBe(true);
      expect(palkia!.types).toEqual(["Water", "Dragon"]);
      expect(palkia!.cpRange).toEqual({ min: 2118, max: 2280 });
      expect(palkia!.boostedCpRange).toEqual({ min: 2648, max: 2850 });
      expect(palkia!.weatherBoosts).toEqual(["Rainy", "Windy"]);
    });
  });

  describe("total count", () => {
    it("returns all raids (regular + shadow) in a flat array", () => {
      expect(result.raids).toHaveLength(6);
    });
  });

  describe("edge cases", () => {
    it("returns empty raids for empty HTML", () => {
      const empty = parseRaidPage("<html><body></body></html>");
      expect(empty.event).toBeNull();
      expect(empty.raids).toEqual([]);
    });

    it("handles missing CP ranges gracefully", () => {
      const html = `
        <div class="raid-bosses" data-raid-type="regular">
          <div class="tier">
            <h2 class="header" data-tier="1"></h2>
            <div class="grid">
              <div class="card">
                <div class="identity"><p class="name">TestMon</p><div class="boss-type"></div></div>
                <div class="cp-range"></div>
                <div class="boosted-cp-row"><span class="boosted-cp"></span></div>
                <div class="weather-boosted"></div>
              </div>
            </div>
          </div>
        </div>
      `;
      const result = parseRaidPage(html);
      expect(result.raids).toHaveLength(1);
      expect(result.raids[0].name).toBe("TestMon");
      expect(result.raids[0].cpRange).toBeNull();
      expect(result.raids[0].boostedCpRange).toBeNull();
      expect(result.raids[0].types).toEqual([]);
      expect(result.raids[0].weatherBoosts).toEqual([]);
    });
  });
});
