import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fetchEventsPage } from "./events/fetcher.js";
import {
  parseEventsPage,
  type EventSection,
  type ParsedEvent,
} from "./events/parser.js";

const OUTPUT_PATH = "public/api/events/current.json";

/** An event entry in the output JSON */
export interface EventOutput {
  name: string;
  category: string;
  time: string;
  link: string;
}

/** A section in the output JSON */
export interface EventSectionOutput {
  label: string;
  status: "active" | "upcoming";
  events: EventOutput[];
}

/** The full events API output shape */
export interface EventsOutput {
  lastUpdated: string;
  sections: EventSectionOutput[];
}

/**
 * Transforms parsed event sections into the API output format.
 * Pure function — no I/O, easy to test.
 */
export function buildEventsOutput(sections: EventSection[]): EventsOutput {
  const outputSections: EventSectionOutput[] = sections.map((section) => ({
    label: section.label,
    status: section.status,
    events: section.events.map((event) => ({
      name: event.name,
      category: event.category,
      time: event.time,
      link: event.link,
    })),
  }));

  return {
    lastUpdated: new Date().toISOString(),
    sections: outputSections,
  };
}

/**
 * Fetches, parses, and writes the current events JSON file.
 * Returns true if the file was written, false if skipped (fetch failure).
 *
 * Silently skips if:
 * - Fetch fails (network error, timeout, HTTP error)
 * - No events found in parsed HTML
 */
export async function writeEvents(
  outputPath: string = OUTPUT_PATH
): Promise<boolean> {
  // Fetch the page
  const html = await fetchEventsPage();
  if (!html) {
    console.warn("⚠️  Skipping events — fetch returned no data");
    return false;
  }

  // Parse the HTML
  const { sections } = parseEventsPage(html);
  if (sections.length === 0) {
    console.warn("⚠️  Skipping events — no events found in HTML");
    return false;
  }

  // Build the output
  const output = buildEventsOutput(sections);

  // Write the file
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(output, null, 2), "utf-8");

  return true;
}
