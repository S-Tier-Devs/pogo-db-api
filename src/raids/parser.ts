import * as cheerio from "cheerio";
import type { Element } from "domhandler";

/** A parsed raid boss entry */
export interface RaidBoss {
  name: string;
  tier: number;
  shadow: boolean;
  types: string[];
  cpRange: { min: number; max: number } | null;
  boostedCpRange: { min: number; max: number } | null;
  weatherBoosts: string[];
}

/** Event metadata from the raid page */
export interface RaidEvent {
  name: string;
  description: string;
  starts: string;
  ends: string;
}

/** Full parsed result from the Leek Duck raid page */
export interface ParsedRaidPage {
  event: RaidEvent | null;
  raids: RaidBoss[];
}

/**
 * Parses a CP range string like "CP 493 - 536" or "493 - 536" into min/max.
 * Returns null if parsing fails.
 */
function parseCpRange(text: string): { min: number; max: number } | null {
  const match = text.match(/(\d[\d,]*)\s*-\s*(\d[\d,]*)/);
  if (!match) return null;
  const min = parseInt(match[1].replace(/,/g, ""), 10);
  const max = parseInt(match[2].replace(/,/g, ""), 10);
  if (isNaN(min) || isNaN(max)) return null;
  return { min, max };
}

/**
 * Converts the data-tier attribute to a numeric tier value.
 * "1" → 1, "3" → 3, "5" → 5, "Mega" → 6
 */
function parseTier(dataTier: string): number {
  if (dataTier === "Mega") return 6;
  const n = parseInt(dataTier, 10);
  return isNaN(n) ? 0 : n;
}

/**
 * Parses a single raid boss card element.
 */
function parseCard(
  $: cheerio.CheerioAPI,
  card: Element,
  tier: number,
  shadow: boolean
): RaidBoss {
  const $card = $(card);

  // Name from p.name
  const name = $card.find("p.name").text().trim();

  // Types from img with title attribute inside .boss-type
  const types: string[] = [];
  $card.find(".boss-type img[title]").each((_i, el) => {
    const title = $(el).attr("title");
    if (title) types.push(title);
  });

  // CP range from div.cp-range text
  const cpText = $card.find(".cp-range").text().trim();
  const cpRange = parseCpRange(cpText);

  // Boosted CP from span.boosted-cp text
  const boostedCpText = $card.find(".boosted-cp").text().trim();
  const boostedCpRange = parseCpRange(boostedCpText);

  // Weather boosts from span.weather-pill span.label
  const weatherBoosts: string[] = [];
  $card.find(".weather-pill .label").each((_i, el) => {
    const label = $(el).text().trim();
    if (label) weatherBoosts.push(label);
  });

  return {
    name,
    tier,
    shadow,
    types,
    cpRange,
    boostedCpRange,
    weatherBoosts,
  };
}

/**
 * Parses a raid section container (regular or shadow) and returns all raid bosses.
 */
function parseRaidSection(
  $: cheerio.CheerioAPI,
  container: cheerio.Cheerio<Element>,
  shadow: boolean
): RaidBoss[] {
  const raids: RaidBoss[] = [];

  container.find("div.tier").each((_i, tierEl) => {
    const $tier = $(tierEl);
    const dataTier = $tier.find("h2.header").attr("data-tier") || "0";
    const tier = parseTier(dataTier);

    $tier.find("div.card").each((_j, cardEl) => {
      raids.push(parseCard($, cardEl, tier, shadow));
    });
  });

  return raids;
}

/**
 * Parses the event metadata from a raid selector container.
 */
function parseEvent(
  $: cheerio.CheerioAPI,
  selectorId: string
): RaidEvent | null {
  const container = $(`#${selectorId}`);
  if (!container.length) return null;

  const name = container.find(".title-text").first().text().trim();
  const description = container.find(".raid-description").first().text().trim();

  const timeValues: string[] = [];
  container.find(".time-value").each((_i, el) => {
    timeValues.push($(el).text().trim());
  });

  if (!name) return null;

  return {
    name,
    description,
    starts: timeValues[0] || "",
    ends: timeValues[1] || "",
  };
}

/**
 * Parses the Leek Duck raid bosses HTML page into structured data.
 * Returns all regular and shadow raid bosses in a flat array.
 */
export function parseRaidPage(html: string): ParsedRaidPage {
  const $ = cheerio.load(html);

  // Parse event info from the regular raid selector
  const event = parseEvent($, "regular-raid-selector");

  // Parse regular raids
  const regularContainer = $("div.raid-bosses");
  const regularRaids = parseRaidSection($, regularContainer, false);

  // Parse shadow raids
  const shadowContainer = $("div.shadow-raid-bosses");
  const shadowRaids = parseRaidSection($, shadowContainer, true);

  return {
    event,
    raids: [...regularRaids, ...shadowRaids],
  };
}
