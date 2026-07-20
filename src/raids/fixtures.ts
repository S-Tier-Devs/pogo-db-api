/**
 * Minimal HTML fixture representing the Leek Duck raid bosses page structure.
 * Includes: event info, 1-star regular, 5-star regular, mega, and shadow sections.
 */
export const RAID_PAGE_HTML = `
<html><body>
<div class="raid-selector-container" id="regular-raid-selector">
  <div class="raid-selector-wrapper">
    <div class="raid-dropdown-wrapper">
      <div class="custom-dropdown" data-type="regular">
        <div class="custom-dropdown-selected">
          <div class="selected-left">
            <div class="selected-title">
              <span class="title-text">Special Anniversary Raids</span>
            </div>
            <div class="raid-description">Kyogre in 5-star raids; Mega Sceptile in Mega raids</div>
          </div>
          <div class="selected-right">
            <div class="raid-time-labels">
              <div class="time-row"><span class="time-label">Starts:</span><span class="time-value">Jul 15, 2026, 6:00 AM</span></div>
              <div class="time-row"><span class="time-label">Ends:</span><span class="time-value">Jul 20, 2026, 8:00 PM</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="raid-bosses" data-raid-type="regular">
  <div class="tier">
    <h2 class="header" data-tier="1"><span class="tier-label">1-Star Raids</span></h2>
    <div class="grid">
      <div class="card">
        <div class="identity">
          <p class="name">Pikachu wearing a Safari Hat</p>
          <div class="boss-type">
            <span class="type type-electric"><img class="type1" title="Electric" /><span class="type-label">Electric</span></span>
          </div>
        </div>
        <div class="cp-range"><span class="cp_prefix">CP </span>493 - 536</div>
        <div class="boosted-cp-row"><span class="boosted-cp"><span class="cp_prefix">CP </span>616 - 670</span></div>
        <div class="weather-boosted"><span class="boss-weather"><span class="weather-pill"><img alt="Rainy" /><span class="label">Rainy</span></span></span></div>
      </div>
    </div>
  </div>

  <div class="tier">
    <h2 class="header" data-tier="3"><span class="tier-label">3-Star Raids</span></h2>
    <div class="grid">
      <div class="card">
        <div class="identity">
          <p class="name">Alolan Raichu</p>
          <div class="boss-type">
            <span class="type type-electric"><img class="type1" title="Electric" /><span class="type-label">Electric</span></span>
            <span class="type type-psychic"><img class="type2" title="Psychic" /><span class="type-label">Psychic</span></span>
          </div>
        </div>
        <div class="cp-range"><span class="cp_prefix">CP </span>1238 - 1306</div>
        <div class="boosted-cp-row"><span class="boosted-cp"><span class="cp_prefix">CP </span>1548 - 1633</span></div>
        <div class="weather-boosted"><span class="boss-weather">
          <span class="weather-pill"><img alt="Rainy" /><span class="label">Rainy</span></span>
          <span class="weather-pill"><img alt="Windy" /><span class="label">Windy</span></span>
        </span></div>
      </div>
    </div>
  </div>

  <div class="tier">
    <h2 class="header" data-tier="5"><span class="tier-label">5-Star Raids</span></h2>
    <div class="grid">
      <div class="card">
        <div class="identity">
          <p class="name">Kyogre</p>
          <div class="boss-type">
            <span class="type type-water"><img class="type1" title="Water" /><span class="type-label">Water</span></span>
          </div>
        </div>
        <div class="cp-range"><span class="cp_prefix">CP </span>2260 - 2351</div>
        <div class="boosted-cp-row"><span class="boosted-cp"><span class="cp_prefix">CP </span>2825 - 2939</span></div>
        <div class="weather-boosted"><span class="boss-weather"><span class="weather-pill"><img alt="Rainy" /><span class="label">Rainy</span></span></span></div>
      </div>
    </div>
  </div>

  <div class="tier">
    <h2 class="header" data-tier="Mega"><span class="tier-label">Mega Raids</span></h2>
    <div class="grid">
      <div class="card">
        <div class="identity">
          <p class="name">Mega Sceptile</p>
          <div class="boss-type">
            <span class="type type-grass"><img class="type1" title="Grass" /><span class="type-label">Grass</span></span>
            <span class="type type-dragon"><img class="type2" title="Dragon" /><span class="type-label">Dragon</span></span>
          </div>
        </div>
        <div class="cp-range"><span class="cp_prefix">CP </span>1500 - 1575</div>
        <div class="boosted-cp-row"><span class="boosted-cp"><span class="cp_prefix">CP </span>1876 - 1969</span></div>
        <div class="weather-boosted"><span class="boss-weather"><span class="weather-pill"><img alt="Sunny" /><span class="label">Sunny</span></span></span></div>
      </div>
    </div>
  </div>
</div>

<div class="raid-selector-container" id="shadow-raid-selector">
  <div class="raid-selector-wrapper">
    <div class="raid-dropdown-wrapper">
      <div class="custom-dropdown" data-type="shadow">
        <div class="custom-dropdown-selected">
          <div class="selected-left">
            <div class="selected-title">
              <span class="title-text">Shadow Palkia July 2026</span>
            </div>
            <div class="raid-description">Shadow Raid Bosses featuring Shadow Palkia</div>
          </div>
          <div class="selected-right">
            <div class="raid-time-labels">
              <div class="time-row"><span class="time-label">Starts:</span><span class="time-value">Jul 1, 2026, 6:00 AM</span></div>
              <div class="time-row"><span class="time-label">Ends:</span><span class="time-value">Aug 4, 2026, 10:00 PM</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="shadow-raid-bosses" data-raid-type="shadow">
  <div class="tier">
    <h2 class="header" data-tier="1"><span class="tier-label">1-Star Raids</span></h2>
    <div class="grid">
      <div class="card -shadow">
        <div class="identity">
          <p class="name">Shadow Phanpy</p>
          <div class="boss-type">
            <span class="type type-ground"><img class="type1" title="Ground" /><span class="type-label">Ground</span></span>
          </div>
        </div>
        <div class="cp-range"><span class="cp_prefix">CP </span>600 - 689</div>
        <div class="boosted-cp-row"><span class="boosted-cp"><span class="cp_prefix">CP </span>750 - 862</span></div>
        <div class="weather-boosted"><span class="boss-weather"><span class="weather-pill"><img alt="Sunny" /><span class="label">Sunny</span></span></span></div>
      </div>
    </div>
  </div>

  <div class="tier">
    <h2 class="header" data-tier="5"><span class="tier-label">5-Star Raids</span></h2>
    <div class="grid">
      <div class="card -shadow">
        <div class="identity">
          <p class="name">Shadow Palkia</p>
          <div class="boss-type">
            <span class="type type-water"><img class="type1" title="Water" /><span class="type-label">Water</span></span>
            <span class="type type-dragon"><img class="type2" title="Dragon" /><span class="type-label">Dragon</span></span>
          </div>
        </div>
        <div class="cp-range"><span class="cp_prefix">CP </span>2118 - 2280</div>
        <div class="boosted-cp-row"><span class="boosted-cp"><span class="cp_prefix">CP </span>2648 - 2850</span></div>
        <div class="weather-boosted"><span class="boss-weather">
          <span class="weather-pill"><img alt="Rainy" /><span class="label">Rainy</span></span>
          <span class="weather-pill"><img alt="Windy" /><span class="label">Windy</span></span>
        </span></div>
      </div>
    </div>
  </div>
</div>
</body></html>
`;
