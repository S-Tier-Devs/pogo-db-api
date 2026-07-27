/**
 * Minimal HTML fixture representing the Leek Duck events page structure.
 * Based on the actual DOM observed from https://leekduck.com/events/
 *
 * Structure:
 * - div.events-section.events-section-live > div.events-list.current-events
 *     h5.event-section-divider (time bucket label)
 *     span.event-header-item-wrapper > a.event-item-link > div.event-item-wrapper
 *       div.event-item > div.event-text-container > div.event-text
 *         span.event-tag-badge (category)
 *         h2 (title)
 *         p (time)
 * - div.events-section.events-section-upcoming > div.events-list.upcoming-events
 *     (same structure)
 */
export const EVENTS_PAGE_HTML = `
<html><body>
<div class="events-sections-wrapper">

  <div class="events-section events-section-live">
    <h2 class="events-list-header">Happening Now</h2>
    <div class="events-list current-events">

      <h5 class="event-section-divider skeleton-loading first-ending-header">ENDS TODAY</h5>

      <span class="event-header-item-wrapper" data-event-type="pokémon-go-fest">
        <a class="event-item-link" href="/events/pokemon-go-fest-2026-global-sunday-raid-makeup/">
          <div class="event-item-wrapper pokémon-go-fest skeleton-loading">
            <p>Pokémon GO Fest</p>
            <div class="event-item">
              <div class="event-text-container">
                <div class="event-text">
                  <span class="event-tag-badge">Pokémon GO Fest</span>
                  <h2>GO Fest 2026 Sunday Raid Makeup</h2>
                  <p>Sun, Jul 26, at 7:00 PM Local Time</p>
                </div>
              </div>
            </div>
          </div>
        </a>
      </span>

      <span class="event-header-item-wrapper" data-event-type="event">
        <a class="event-item-link" href="/events/ozone-ascent-2026/">
          <div class="event-item-wrapper event skeleton-loading">
            <p>Event</p>
            <div class="event-item">
              <div class="event-text-container">
                <div class="event-text">
                  <span class="event-tag-badge">Event</span>
                  <h2>Ozone Ascent - Rayquaza Timed Research</h2>
                  <p>Sun, Jul 26, at 8:00 PM Local Time</p>
                </div>
              </div>
            </div>
          </div>
        </a>
      </span>

      <h5 class="event-section-divider skeleton-loading">ENDS TOMORROW</h5>

      <span class="event-header-item-wrapper" data-event-type="max-mondays">
        <a class="event-item-link" href="/events/max-mondays-2026-07-27/">
          <div class="event-item-wrapper max-mondays skeleton-loading">
            <p>Max Mondays</p>
            <div class="event-item">
              <div class="event-text-container">
                <div class="event-text">
                  <span class="event-tag-badge">Max Mondays</span>
                  <h2>Dynamax Feebas during Max Monday</h2>
                  <p>Mon, Jul 27, at 9:00 PM Local Time</p>
                </div>
              </div>
            </div>
          </div>
        </a>
      </span>

      <h5 class="event-section-divider skeleton-loading">ENDS NEXT WEEK</h5>

      <span class="event-header-item-wrapper" data-event-type="raid-hour">
        <a class="event-item-link" href="/events/raidhour20260729/">
          <div class="event-item-wrapper raid-hour skeleton-loading">
            <p>Raid Hour</p>
            <div class="event-item">
              <div class="event-text-container">
                <div class="event-text">
                  <span class="event-tag-badge">Raid Hour</span>
                  <h2>Kyurem Raid Hour</h2>
                  <p>Wed, Jul 29, at 7:00 PM Local Time</p>
                </div>
              </div>
            </div>
          </div>
        </a>
      </span>

      <span class="event-header-item-wrapper" data-event-type="community-day">
        <a class="event-item-link" href="/events/august-communityday2026/">
          <div class="event-item-wrapper community-day skeleton-loading">
            <p>Community Day</p>
            <div class="event-item">
              <div class="event-text-container">
                <div class="event-text">
                  <span class="event-tag-badge">Community Day</span>
                  <h2>Nickit Community Day</h2>
                  <p>Sun, Aug 16, at 5:00 PM Local Time</p>
                </div>
              </div>
            </div>
          </div>
        </a>
      </span>

    </div>
  </div>

  <div class="events-section events-section-upcoming">
    <h2 class="events-list-header">Upcoming Events</h2>
    <div class="events-list upcoming-events">

      <h5 class="event-section-divider skeleton-loading first-starting-header">STARTS TOMORROW</h5>

      <span class="event-header-item-wrapper" data-event-type="max-mondays">
        <a class="event-item-link" href="/events/max-mondays-2026-07-27/">
          <div class="event-item-wrapper max-mondays skeleton-loading">
            <p>Max Mondays</p>
            <div class="event-item">
              <div class="event-text-container">
                <div class="event-text">
                  <span class="event-tag-badge">Max Mondays</span>
                  <h2>Dynamax Feebas during Max Monday</h2>
                  <p>Mon, Jul 27, at 6:00 AM Local Time</p>
                </div>
              </div>
            </div>
          </div>
        </a>
      </span>

      <h5 class="event-section-divider skeleton-loading">STARTS NEXT WEEK</h5>

      <span class="event-header-item-wrapper" data-event-type="raid-hour">
        <a class="event-item-link" href="/events/raidhour20260729/">
          <div class="event-item-wrapper raid-hour skeleton-loading">
            <p>Raid Hour</p>
            <div class="event-item">
              <div class="event-text-container">
                <div class="event-text">
                  <span class="event-tag-badge">Raid Hour</span>
                  <h2>Kyurem Raid Hour</h2>
                  <p>Wed, Jul 29, at 6:00 PM Local Time</p>
                </div>
              </div>
            </div>
          </div>
        </a>
      </span>

      <span class="event-header-item-wrapper" data-event-type="pokémon-spotlight-hour">
        <a class="event-item-link" href="/events/pokemonspotlighthour2026-07-30/">
          <div class="event-item-wrapper pokémon-spotlight-hour skeleton-loading">
            <p>Pokémon Spotlight Hour</p>
            <div class="event-item">
              <div class="event-text-container">
                <div class="event-text">
                  <span class="event-tag-badge">Pokémon Spotlight Hour</span>
                  <h2>Bidoof Spotlight Hour</h2>
                  <p>Thu, Jul 30, at 6:00 PM Local Time</p>
                </div>
              </div>
            </div>
          </div>
        </a>
      </span>

      <span class="event-header-item-wrapper" data-event-type="max-battles">
        <a class="event-item-link" href="/events/gigantamax-rillaboom-max-battle-day-2026/">
          <div class="event-item-wrapper max-battles skeleton-loading">
            <p>Max Battles</p>
            <div class="event-item">
              <div class="event-text-container">
                <div class="event-text">
                  <span class="event-tag-badge">Max Battles</span>
                  <h2>Gigantamax Rillaboom Max Battle Day</h2>
                  <p>Sat, Aug 1, at 2:00 PM Local Time</p>
                </div>
              </div>
            </div>
          </div>
        </a>
      </span>

    </div>
  </div>

</div>
</body></html>
`;
