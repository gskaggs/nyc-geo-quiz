# NYC Geo Quiz

A web app for learning the geography of New York City. It presents map-based
questions — *"What borough is this?"*, *"What street is this?"*, *"What
neighborhood is this?"*, *"What landmark is this?"* — by showing a zoomable map
of NYC with **partial information**:

- the **target** feature is highlighted but **unnamed**
- nearby **context** features are **named** but not highlighted
  (e.g. Nolita highlighted with no label, while SoHo / NoHo / Little Italy
  labels are visible around it)

## Running it

No build step. Serve the directory statically and open it:

```bash
just run    # serve at http://localhost:8642/
just open   # serve + open in browser
```

(Or without just: `python3 -m http.server 8642`.)

(Requires network access for map tiles and the Leaflet CDN.)

## How it works

| Piece | Choice | Why |
|---|---|---|
| Map library | [Leaflet 1.9](https://leafletjs.com) (CDN) | Lightweight, mature, trivial GeoJSON overlays. MapLibre GL and OpenLayers were considered but are heavier than this needs. |
| Basemap | CARTO `light_nolabels` raster tiles | The tiles draw all street/area **geometry** but contain **zero labels**, so the app controls exactly which names appear — the core requirement for partial-information quizzing. |
| Data | Inline GeoJSON in `js/questions.js` + generated `js/questions_generated.js` | Hand-authored questions use real OSM geometry (Nominatim/Overpass). The bulk of the bank (parks, neighborhoods, SoHo/Village streets) is produced by `scripts/generate_questions.py` from pedia-cities neighborhood polygons, Nominatim park polygons, and Overpass street geometry. |

## Structure

```
Justfile                      run / open recipes
index.html                    app shell (sidebar + map)
css/style.css                 layout, highlight + label styles
js/questions.js               question data model + hand-authored questions
js/questions_generated.js     generated question bank (do not edit by hand)
scripts/generate_questions.py generator: parks, neighborhoods, SoHo/Village streets
js/app.js                     map init, question renderer, keyboard + hover behavior
report/                       verification report (screenshots of each question type)
```

## Question data model

Defined and documented in `js/questions.js`:

```js
{
  id: "neighborhood-nolita",
  type: "neighborhood",            // borough | neighborhood | street | landmark
  prompt: "What neighborhood is highlighted?",
  answer: "Nolita",                // never drawn on the map
  target: { /* GeoJSON geometry: Polygon | (Multi)LineString | Point */ },
  context: [                       // named but NOT highlighted
    { name: "SoHo", labelAt: [40.7233, -74.0009], kind: "area" },
    ...
  ],
  view: { center: [40.7228, -73.9945], zoom: 15 }
}
```

Zero, one, or several context features are allowed per question.

## Future work (out of scope for the scaffold)

- Answer input + accuracy/progress tracking
- Bigger question bank; generate questions from NYC Open Data / OSM Overpass
  instead of inline GeoJSON
- Optional context geometry overlays (e.g. dashed outlines for neighbor areas)
