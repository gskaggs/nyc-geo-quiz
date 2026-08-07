---
name: create-quiz-questions
description: How to add new questions to the NYC Geo Quiz (js/questions.js) — the question data model, the user's per-type preferences for which context names to reveal, where to source accurate geometry (Nominatim/Overpass), and the mandatory screenshot-based accuracy verification. Use whenever asked to add, fix, or review quiz questions for this repo.
---

# Creating NYC Geo Quiz questions

Questions live in `js/questions.js` as entries in the `QUESTIONS` array. Each one shows a
highlighted-but-**unnamed** target on a label-free basemap, plus **named** context features.
The user is learning real geography from these — **a misplaced highlight or mislabeled
context feature teaches them something wrong**, so accuracy verification is not optional.

## Data model

```js
{
  id:      "street-prince",                 // unique, "<type>-<slug>"
  type:    "borough" | "neighborhood" | "street" | "landmark",
  prompt:  "What street is highlighted?",
  answer:  "Prince Street",                 // never rendered on the map
  target:  { /* GeoJSON geometry */ },      // Polygon | (Multi)LineString | Point
  context: [{ name, labelAt: [lat, lng], kind: "street"|"area"|"landmark" }],
  view:    { center: [lat, lng], zoom }     // frame target + all context labels
}
```

⚠️ **Coordinate-order trap:** GeoJSON `target` coordinates are `[lng, lat]`, but Leaflet's
`labelAt` and `view.center` are `[lat, lng]`. For NYC, lat ≈ 40.x and lng ≈ -74.x /
-73.9x — if a label doesn't appear, you almost certainly swapped them.

## What context to reveal (user preferences — follow these)

| Question type | Reveal as named context | Do NOT reveal |
|---|---|---|
| **landmark** (pinpoint) | The nearby **crossroads** — names of the streets at/around the intersection where the landmark sits | The landmark's own name |
| **neighborhood** | Nearby **areas** — the surrounding neighborhoods/boroughs (`kind: "area"`) | **No cross streets / street names** |
| **street** | **Nearby streets** — parallel neighbors and cross streets (`kind: "street"`) | The target street's own name |
| **borough** | Neighboring boroughs / adjacent areas (e.g. New Jersey) | — |

Zero, one, or several context features are fine, but aim for 3–4 well-spread labels so the
user can orient without the answer being given away.

## Sourcing accurate geometry (in order of preference)

1. **Streets — always use real OSM geometry, never eyeball a polyline.** A hand-drawn line
   will visibly miss the basemap street. Nominatim's structured street search returns real
   LineStrings:
   ```bash
   curl -s -A 'nyc-geo-quiz/0.1 (dev)' \
     'https://nominatim.openstreetmap.org/search?street=Prince+Street&city=New+York&format=json&polygon_geojson=1&limit=5'
   ```
   Filter results by borough in `display_name` (street names repeat across boroughs!),
   take `geojson.coordinates`, round to 6 decimals. Multiple ways → `MultiLineString`.
2. **Boroughs / large areas** — same query with `q=<name>` plus
   `polygon_threshold=0.002` for a simplified real polygon.
3. **Landmarks** — Nominatim `q=<landmark>, New York`, take `lat`/`lon`. Sanity-check the
   `display_name` (street address) matches what you expect.
4. **Neighborhoods** — most NYC neighborhoods have **no OSM polygon** (Nominatim returns a
   point or an unrelated POI). Hand-approximate a polygon whose vertices are the real
   corner intersections of the bounding streets (e.g. Nolita = Houston × Lafayette,
   Houston × Bowery, Broome × Bowery, Broome × Lafayette), and verify visually (below).
5. Overpass API (`overpass-api.de`) gives fuller geometry when it's up; it was 504ing when
   this scaffold was built, and Nominatim has been sufficient.

Rate-limit courtesy: send a descriptive `User-Agent` and `sleep 1` between Nominatim calls.

Context **label positions** are hand-placed: put a street label *on* that street a block or
two away from the target, and an area label near that area's center. Derive positions from
known intersections, not guesses.

## Mandatory accuracy verification (screenshot loop)

Never ship a question without seeing it rendered:

1. `just run` (serves at `http://localhost:8642/`).
2. Drive a real browser with `agent-browser`:
   ```bash
   agent-browser open http://localhost:8642/
   agent-browser find text "<question prompt as listed in sidebar>" click
   sleep 4   # let tiles load
   agent-browser screenshot /tmp/q-check.png   # use an ABSOLUTE path
   ```
3. **Read the screenshot back** and check every one of these:
   - The highlight sits exactly on the intended basemap feature (street highlight lies on
     the street's casing; polygon edges follow the bounding streets; pin is on the right
     block).
   - Each context label sits on/inside the feature it names — cross-check against a real
     map source if unsure, not memory.
   - No context label overlaps or crowds the target highlight.
   - The answer is NOT visible anywhere on the map.
   - The initial view frames the target and all context labels; nothing is cut off.
   - The context obeys the reveal-preferences table above.
4. Click **Reveal answer** and confirm the sidebar shows the correct name.
5. If anything is off, fix coordinates and re-screenshot until it passes.

Also test zoom in/out once if you touched map behavior (not needed for data-only edits).

## Answer-correctness checks

- Verify the `answer` string against the geometry source's `display_name` — don't trust
  memory for spellings (e.g. "Saint Marks Place" in OSM vs "St. Marks Place" colloquially;
  prefer the common colloquial form for `answer`, but be sure it's the same feature).
- Make sure `prompt` matches `type` ("What street…" for a street, etc.).
- Keep `id` unique — grep the file before adding.
