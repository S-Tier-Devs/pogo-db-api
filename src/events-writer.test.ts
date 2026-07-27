import { describe, it, expect } from "vitest";
import { buildEventsOutput } from "./events-writer.js";
import type { EventSection } from "./events/parser.js";

describe("buildEventsOutput", () => {
  const mockSections: EventSection[] = [
    {
      label: "ENDS TODAY",
      status: "active",
      events: [
        {
          name: "GO Fest 2026 Sunday Raid Makeup",
          category: "Pokémon GO Fest",
          time: "Sun, Jul 26, at 7:00 PM Local Time",
          link: "https://leekduck.com/events/pokemon-go-fest-2026-global-sunday-raid-makeup/",
        },
        {
          name: "Ozone Ascent - Rayquaza Timed Research",
          category: "Event",
          time: "Sun, Jul 26, at 8:00 PM Local Time",
          link: "https://leekduck.com/events/ozone-ascent-2026/",
        },
      ],
    },
    {
      label: "STARTS NEXT WEEK",
      status: "upcoming",
      events: [
        {
          name: "Kyurem Raid Hour",
          category: "Raid Hour",
          time: "Wed, Jul 29, at 6:00 PM Local Time",
          link: "https://leekduck.com/events/raidhour20260729/",
        },
      ],
    },
  ];

  it("produces correct output structure", () => {
    const result = buildEventsOutput(mockSections);
    expect(result.sections).toHaveLength(2);
    expect(result.lastUpdated).toBeDefined();
  });

  it("includes lastUpdated as ISO string", () => {
    const before = new Date().toISOString();
    const result = buildEventsOutput(mockSections);
    const after = new Date().toISOString();
    expect(result.lastUpdated >= before).toBe(true);
    expect(result.lastUpdated <= after).toBe(true);
  });

  it("preserves section labels and status", () => {
    const result = buildEventsOutput(mockSections);
    expect(result.sections[0].label).toBe("ENDS TODAY");
    expect(result.sections[0].status).toBe("active");
    expect(result.sections[1].label).toBe("STARTS NEXT WEEK");
    expect(result.sections[1].status).toBe("upcoming");
  });

  it("preserves all event fields", () => {
    const result = buildEventsOutput(mockSections);
    const firstEvent = result.sections[0].events[0];
    expect(firstEvent.name).toBe("GO Fest 2026 Sunday Raid Makeup");
    expect(firstEvent.category).toBe("Pokémon GO Fest");
    expect(firstEvent.time).toBe("Sun, Jul 26, at 7:00 PM Local Time");
    expect(firstEvent.link).toBe(
      "https://leekduck.com/events/pokemon-go-fest-2026-global-sunday-raid-makeup/"
    );
  });

  it("preserves event count per section", () => {
    const result = buildEventsOutput(mockSections);
    expect(result.sections[0].events).toHaveLength(2);
    expect(result.sections[1].events).toHaveLength(1);
  });

  it("handles empty sections array", () => {
    const result = buildEventsOutput([]);
    expect(result.sections).toEqual([]);
    expect(result.lastUpdated).toBeDefined();
  });

  it("handles section with empty events array", () => {
    const sections: EventSection[] = [
      { label: "ENDS TODAY", status: "active", events: [] },
    ];
    const result = buildEventsOutput(sections);
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].events).toEqual([]);
  });
});
