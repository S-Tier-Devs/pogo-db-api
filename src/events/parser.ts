import * as cheerio from "cheerio";
import type { Element } from "domhandler";

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
 * Resolves a relative href to a full Leek Duck URL.
 */
function resolveLink(href: string): string {
  if (href.startsWith("http")) return href;
  return `${LEEKDUCK_BASE}${href}`;
}

/**
 * Parses events from a flat container where h5.event-section-divider elements
 * act as separators between groups of event wrapper spans.
 *
 * The real DOM structure is:
 *   div.events-list
 *     h5.event-section-divider  "ENDS TODAY"
 *     span.event-header-item-wrapper
 *       a.event-item-link
 *         div.event-item-wrapper
 *           ...
 *           div.event-text
 *             span.event-tag-badge  "Raid Hour"
 *             h2  "Kyurem Raid Hour"
 *             p   "Wed, Jul 29, at 7:00 PM Local Time"
 *     h5.event-section-divider  "ENDS TOMORROW"
 *     span.event-header-item-wrapper
 *       ...
 */
function parseEventsList(
  $: cheerio.CheerioAPI,
  container: cheerio.Cheerio<Element>,
  status: "active" | "upcoming"
): EventSection[] {
  const sections: EventSection[] = [];
  let currentLabel = "";
  let currentEvents: ParsedEvent[] = [];

  // Iterate over direct children of the events-list container
  container.children().each((_i, el) => {
    const $el = $(el);

    if ($el.is("h5.event-section-divider")) {
      // Save previous section if it has events
      if (currentLabel && currentEvents.length > 0) {
        sections.push({ label: currentLabel, status, events: currentEvents });
      }
      currentLabel = $el.text().trim();
      currentEvents = [];
    } else if ($el.is("span.event-header-item-wrapper")) {
      // Parse the event card inside
      const $link = $el.find("a.event-item-link");
      if (!$link.length) return;

      const href = $link.attr("href") || "";
      const link = resolveLink(href);

      const $eventText = $link.find(".event-text");
      const category = $eventText.find("span.event-tag-badge").first().text().trim();
      const name = $eventText.find("h2").first().text().trim();
      // Get the time from the <p> that doesn't have a data-event-list-date attribute
      // (those with data-event-list-date say "Calculating...")
      const $timeEl = $eventText.find("p").first();
      const time = $timeEl.text().trim();

      if (name) {
        currentEvents.push({ name, category, time, link });
      }
    }
  });

  // Don't forget the last section
  if (currentLabel && currentEvents.length > 0) {
    sections.push({ label: currentLabel, status, events: currentEvents });
  }

  return sections;
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

  // Parse "Happening Now" (active) events
  const liveContainer = $(".events-section-live .events-list");
  if (liveContainer.length) {
    sections.push(...parseEventsList($, liveContainer, "active"));
  }

  // Parse "Upcoming Events" events
  const upcomingContainer = $(".events-section-upcoming .events-list");
  if (upcomingContainer.length) {
    sections.push(...parseEventsList($, upcomingContainer, "upcoming"));
  }

  return { sections };
}
