import { describe, it, expect } from "vitest";
import { parseEventsPage } from "./parser.js";
import { EVENTS_PAGE_HTML } from "./fixtures.js";

describe("parseEventsPage", () => {
  const result = parseEventsPage(EVENTS_PAGE_HTML);

  describe("section parsing", () => {
    it("parses all sections from the fixture", () => {
      // 3 sub-sections under Happening Now + 2 under Upcoming Events = 5
      expect(result.sections).toHaveLength(5);
    });

    it("assigns 'active' status to Happening Now sections", () => {
      const activeSections = result.sections.filter((s) => s.status === "active");
      expect(activeSections).toHaveLength(3);
    });

    it("assigns 'upcoming' status to Upcoming Events sections", () => {
      const upcomingSections = result.sections.filter((s) => s.status === "upcoming");
      expect(upcomingSections).toHaveLength(2);
    });

    it("parses section labels correctly", () => {
      const labels = result.sections.map((s) => s.label);
      expect(labels).toEqual([
        "ENDS TODAY",
        "ENDS TOMORROW",
        "ENDS NEXT WEEK",
        "STARTS TOMORROW",
        "STARTS NEXT WEEK",
      ]);
    });
  });

  describe("event parsing", () => {
    it("parses event names", () => {
      const endsToday = result.sections[0];
      expect(endsToday.events[0].name).toBe("GO Fest 2026 Sunday Raid Makeup");
      expect(endsToday.events[1].name).toBe("Ozone Ascent - Rayquaza Timed Research");
    });

    it("parses event categories", () => {
      const endsToday = result.sections[0];
      expect(endsToday.events[0].category).toBe("Pokémon GO Fest");
      expect(endsToday.events[1].category).toBe("Event");
    });

    it("parses event times", () => {
      const endsToday = result.sections[0];
      expect(endsToday.events[0].time).toBe("Sun, Jul 26, at 7:00 PM Local Time");
      expect(endsToday.events[1].time).toBe("Sun, Jul 26, at 8:00 PM Local Time");
    });

    it("resolves event links to full URLs", () => {
      const endsToday = result.sections[0];
      expect(endsToday.events[0].link).toBe(
        "https://leekduck.com/events/pokemon-go-fest-2026-global-sunday-raid-makeup/"
      );
      expect(endsToday.events[1].link).toBe(
        "https://leekduck.com/events/ozone-ascent-2026/"
      );
    });

    it("parses diverse categories across sections", () => {
      const allEvents = result.sections.flatMap((s) => s.events);
      const categories = [...new Set(allEvents.map((e) => e.category))];
      expect(categories).toContain("Pokémon GO Fest");
      expect(categories).toContain("Event");
      expect(categories).toContain("Max Mondays");
      expect(categories).toContain("Raid Hour");
      expect(categories).toContain("Community Day");
      expect(categories).toContain("Pokémon Spotlight Hour");
      expect(categories).toContain("Max Battles");
    });

    it("counts correct number of events per section", () => {
      expect(result.sections[0].events).toHaveLength(2); // Ends Today
      expect(result.sections[1].events).toHaveLength(1); // Ends Tomorrow
      expect(result.sections[2].events).toHaveLength(2); // Ends Next Week
      expect(result.sections[3].events).toHaveLength(1); // Starts Tomorrow
      expect(result.sections[4].events).toHaveLength(3); // Starts Next Week
    });
  });

  describe("edge cases", () => {
    it("returns empty sections for empty HTML", () => {
      const empty = parseEventsPage("<html><body></body></html>");
      expect(empty.sections).toEqual([]);
    });

    it("handles missing fields gracefully", () => {
      const html = `
        <div class="events-section events-section-live">
          <div class="events-list current-events">
            <h5 class="event-section-divider">ENDS TODAY</h5>
            <span class="event-header-item-wrapper">
              <a class="event-item-link" href="/events/test/">
                <div class="event-item-wrapper">
                  <div class="event-item">
                    <div class="event-text-container">
                      <div class="event-text">
                        <span class="event-tag-badge"></span>
                        <h2>Test Event</h2>
                        <p></p>
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            </span>
          </div>
        </div>
      `;
      const result = parseEventsPage(html);
      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].events[0].name).toBe("Test Event");
      expect(result.sections[0].events[0].category).toBe("");
      expect(result.sections[0].events[0].time).toBe("");
      expect(result.sections[0].events[0].link).toBe("https://leekduck.com/events/test/");
    });

    it("skips cards with no name", () => {
      const html = `
        <div class="events-section events-section-live">
          <div class="events-list current-events">
            <h5 class="event-section-divider">ENDS TODAY</h5>
            <span class="event-header-item-wrapper">
              <a class="event-item-link" href="/events/empty/">
                <div class="event-item-wrapper">
                  <div class="event-item">
                    <div class="event-text-container">
                      <div class="event-text">
                        <span class="event-tag-badge">Event</span>
                        <h2></h2>
                        <p>Mon, Jul 27</p>
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            </span>
          </div>
        </div>
      `;
      const result = parseEventsPage(html);
      expect(result.sections).toEqual([]);
    });

    it("skips sections with no valid events", () => {
      const html = `
        <div class="events-section events-section-live">
          <div class="events-list current-events">
            <h5 class="event-section-divider">ENDS TODAY</h5>
          </div>
        </div>
      `;
      const result = parseEventsPage(html);
      expect(result.sections).toEqual([]);
    });
  });
});
