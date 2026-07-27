/**
 * Minimal HTML fixture representing the Leek Duck events page structure.
 * Includes: "Happening Now" section with two time buckets and "Upcoming Events" with one bucket.
 * Each event card is an <a> tag containing category, title, and time info.
 *
 * Based on observed DOM structure from https://leekduck.com/events/
 */
export const EVENTS_PAGE_HTML = `
<html><body>
<div class="events-pokemon-go">

  <div class="events-pokemon-go-section" id="happeningNow">
    <h2 class="section-header">Happening Now</h2>

    <div class="events-pokemon-go-sub-pokemon-section">
      <h5 class="pokemon-section-header">ENDS TODAY</h5>
      <div class="events-pokemon-go-list">
        <a href="/events/pokemon-go-fest-2026-global-sunday-raid-makeup/" class="pokemon event-pokemon-card">
          <div class="pokemon-card-content">
            <span class="event-pokemon-card-pokemon-type-pokemon-go-fest-event">Pokémon GO Fest</span>
            <h2 class="pokemon-card-title">GO Fest 2026 Sunday Raid Makeup</h2>
            <p class="pokemon-card-time">Sun, Jul 26, at 7:00 PM Local Time</p>
          </div>
        </a>
        <a href="/events/ozone-ascent-2026/" class="pokemon event-pokemon-card">
          <div class="pokemon-card-content">
            <span class="event-pokemon-card-pokemon-type-event">Event</span>
            <h2 class="pokemon-card-title">Ozone Ascent - Rayquaza Timed Research</h2>
            <p class="pokemon-card-time">Sun, Jul 26, at 8:00 PM Local Time</p>
          </div>
        </a>
      </div>
    </div>

    <div class="events-pokemon-go-sub-pokemon-section">
      <h5 class="pokemon-section-header">ENDS TOMORROW</h5>
      <div class="events-pokemon-go-list">
        <a href="/events/ultra-unlock-10th-anniversary-edition/" class="pokemon event-pokemon-card">
          <div class="pokemon-card-content">
            <span class="event-pokemon-card-pokemon-type-event">Event</span>
            <h2 class="pokemon-card-title">Ultra Unlock: 10th Anniversary Edition</h2>
            <p class="pokemon-card-time">Mon, Jul 27, at 8:00 PM Local Time</p>
          </div>
        </a>
        <a href="/events/max-mondays-2026-07-27/" class="pokemon event-pokemon-card">
          <div class="pokemon-card-content">
            <span class="event-pokemon-card-pokemon-type-max-mondays">Max Mondays</span>
            <h2 class="pokemon-card-title">Dynamax Feebas during Max Monday</h2>
            <p class="pokemon-card-time">Mon, Jul 27, at 9:00 PM Local Time</p>
          </div>
        </a>
      </div>
    </div>

    <div class="events-pokemon-go-sub-pokemon-section">
      <h5 class="pokemon-section-header">ENDS NEXT WEEK</h5>
      <div class="events-pokemon-go-list">
        <a href="/events/raidhour20260729/" class="pokemon event-pokemon-card">
          <div class="pokemon-card-content">
            <span class="event-pokemon-card-pokemon-type-raid-hour">Raid Hour</span>
            <h2 class="pokemon-card-title">Kyurem Raid Hour</h2>
            <p class="pokemon-card-time">Wed, Jul 29, at 7:00 PM Local Time</p>
          </div>
        </a>
        <a href="/events/august-communityday2026/" class="pokemon event-pokemon-card">
          <div class="pokemon-card-content">
            <span class="event-pokemon-card-pokemon-type-community-day">Community Day</span>
            <h2 class="pokemon-card-title">Nickit Community Day</h2>
            <p class="pokemon-card-time">Sun, Aug 16, at 5:00 PM Local Time</p>
          </div>
        </a>
      </div>
    </div>
  </div>

  <div class="events-pokemon-go-section" id="upcomingEvents">
    <h2 class="section-header">Upcoming Events</h2>

    <div class="events-pokemon-go-sub-pokemon-section">
      <h5 class="pokemon-section-header">STARTS TOMORROW</h5>
      <div class="events-pokemon-go-list">
        <a href="/events/max-mondays-2026-07-27/" class="pokemon event-pokemon-card">
          <div class="pokemon-card-content">
            <span class="event-pokemon-card-pokemon-type-max-mondays">Max Mondays</span>
            <h2 class="pokemon-card-title">Dynamax Feebas during Max Monday</h2>
            <p class="pokemon-card-time">Mon, Jul 27, at 6:00 AM Local Time</p>
          </div>
        </a>
      </div>
    </div>

    <div class="events-pokemon-go-sub-pokemon-section">
      <h5 class="pokemon-section-header">STARTS NEXT WEEK</h5>
      <div class="events-pokemon-go-list">
        <a href="/events/raidhour20260729/" class="pokemon event-pokemon-card">
          <div class="pokemon-card-content">
            <span class="event-pokemon-card-pokemon-type-raid-hour">Raid Hour</span>
            <h2 class="pokemon-card-title">Kyurem Raid Hour</h2>
            <p class="pokemon-card-time">Wed, Jul 29, at 6:00 PM Local Time</p>
          </div>
        </a>
        <a href="/events/pokemonspotlighthour2026-07-30/" class="pokemon event-pokemon-card">
          <div class="pokemon-card-content">
            <span class="event-pokemon-card-pokemon-type-pokemon-spotlight-hour">Pokémon Spotlight Hour</span>
            <h2 class="pokemon-card-title">Bidoof Spotlight Hour</h2>
            <p class="pokemon-card-time">Thu, Jul 30, at 6:00 PM Local Time</p>
          </div>
        </a>
        <a href="/events/gigantamax-rillaboom-max-battle-day-2026/" class="pokemon event-pokemon-card">
          <div class="pokemon-card-content">
            <span class="event-pokemon-card-pokemon-type-max-battles">Max Battles</span>
            <h2 class="pokemon-card-title">Gigantamax Rillaboom Max Battle Day</h2>
            <p class="pokemon-card-time">Sat, Aug 1, at 2:00 PM Local Time</p>
          </div>
        </a>
      </div>
    </div>
  </div>

</div>
</body></html>
`;
