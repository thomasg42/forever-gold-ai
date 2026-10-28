# Hero slot

The home hero is `data-hero-slot="v1-gem"`. Version 1 is a drawn gem, not a video. There is no autoplay and no video file.

Codex may later place still or video media inside `.hero-media` and drive it with a `bootHeroScrub` function. That pass may change motion inside the slot.

Codex must not edit, in that pass:

- headlines, body copy, or the motto
- phone, text, audit, or booking links
- titles, descriptions, canonicals, or JSON-LD
- the six facet labels or which system each facet links to

The gem still has to read as complete gold when motion is reduced, when JavaScript fails, or when the viewport is under 900px. The h1 and the two hero buttons stay visible in all of those states. `window.__fgaiReady` must be set by the booted script. If it is missing after 3 seconds, the head script removes the `js` class so the nav does not stay closed.
