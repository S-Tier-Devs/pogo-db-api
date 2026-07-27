import * as cheerio from "cheerio";

const LEEKDUCK_BASE = "https://leekduck.com";

/** A single parsed event entry */
export interface ParsedEvent {
  name: string;
  category: string;
  time: string;
  link: string;
}

/** A section grouping events by time bucket */
export interface EventSection {
  label: string;
  status: "active" | "upcoming";
  events: ParsedEvent[];
}

/** Full parsed result from the Leek Duck events page */
export interface ParsedEventsPage {
  sections: EventSection[];
}

/**
 * Determines the status based on the parent section.
 * Events under "Happening Now" are "active", under "Upcoming Events" are "upcoming".
 */
function resolveStatus(sectionHeader: string): "active" | "upcoming" {
  if (sectionHeader.toLowerCase().includes("happening now")) {
    return "active";
  }
  return "upcoming";
}

/**
 * Resolves a relative href to a full Leek Duck URL.
 */
function resolveLink(href: string): string {
  if (href.startsWith("http")) return href;
  return `${LEEKDUCK_BASE}${href}`;
}

/**
 * Parses the Leek Duck events page HTML into structured event data
 * grouped by time-bucket sections.
 *
 * Events are organized into sections like "Ends Today", "Starts Next Week", etc.
 * Each section has a status of "active" (under Happening Now) or "upcoming" (under Upcoming Events).
 */
export function parseEventsPage(html: string): ParsedEventsPage {
  const $ = cheerio.load(html);
  const sections: EventSection[] = [];

  // Process each top-level section (Happening Now, Upcoming Events)
  $(".events-pokemon-go-section").each((_i, sectionEl) => {
    const $section = $(sectionEl);
    const sectionHeader = $section.find("h2.section-header").first().text().trim();
    const status = resolveStatus(sectionHeader);

    // Process each time-bucket sub-section
    $section.find(".events-pokemon-go-sub-pokemon-section").each((_j, subEl) => {
      const $sub = $(subEl);
      const label = $sub.find("h5.pokemon-section-header").first().text().trim();

      const events: ParsedEvent[] = [];

      // Process each event card
      $sub.find("a.event-pokemon-card").each((_k, cardEl) => {
        const $card = $(cardEl);

        const href = $card.attr("href") || "";
        const link = resolveLink(href);

        const name = $card.find("h2.pokemon-card-title").text().trim();
        const category = $card.find("span[class*='event-pokemon-card-pokemon-type']").text().trim();
        const time = $card.find("p.pokemon-card-time").text().trim();

        if (name) {
          events.push({ name, category, time, link });
        }
      });

      if (events.length > 0) {
        sections.push({ label, status, events });
      }
    });
  });

  return { sections };
}
