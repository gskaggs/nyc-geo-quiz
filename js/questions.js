/**
 * Question data model
 * -------------------
 * A Question describes everything the map view needs to pose one
 * "what is this?" prompt with partial information:
 *
 * {
 *   id:      string                  — unique id
 *   type:    'borough' | 'neighborhood' | 'street' | 'landmark'
 *   prompt:  string                  — the question shown to the user
 *   answer:  string                  — name of the target (never drawn on the map)
 *   target:  GeoJSON Geometry        — the highlighted-but-unnamed feature.
 *            Polygon/MultiPolygon (borough, neighborhood),
 *            LineString/MultiLineString (street), Point (landmark).
 *   context: Array<ContextFeature>   — nearby features that ARE named but NOT
 *            highlighted. The label-free basemap already draws their geometry,
 *            so each context feature only needs a name + label position.
 *            { name: string, labelAt: [lat, lng], kind: 'street'|'area'|'landmark' }
 *   view:    { center: [lat, lng], zoom: number } — initial camera
 * }
 */

const QUESTIONS = [
  {
    id: "borough-staten-island",
    type: "borough",
    prompt: "What borough is highlighted?",
    answer: "Staten Island",
    target: {
      type: "Polygon",
      coordinates: [[
        [-74.25884, 40.49887], [-74.25304, 40.48666], [-74.22533, 40.47658],
        [-74.04378, 40.50783], [-74.03461, 40.5761], [-74.04157, 40.603],
        [-74.05669, 40.62704], [-74.05577, 40.65147], [-74.08699, 40.65151],
        [-74.12602, 40.64215], [-74.18165, 40.64653], [-74.19143, 40.64202],
        [-74.2024, 40.63159], [-74.20483, 40.60606], [-74.19959, 40.59785],
        [-74.20724, 40.58792], [-74.21458, 40.56053], [-74.218, 40.55706],
        [-74.23141, 40.55918], [-74.24748, 40.54938], [-74.25029, 40.5423],
        [-74.24602, 40.52096], [-74.2541, 40.51566], [-74.25813, 40.50872],
        [-74.25884, 40.49887]
      ]]
    },
    context: [
      { name: "Brooklyn", labelAt: [40.645, -73.97], kind: "area" },
      { name: "Manhattan", labelAt: [40.776, -73.966], kind: "area" },
      { name: "New Jersey", labelAt: [40.63, -74.32], kind: "area" }
    ],
    view: { center: [40.58, -74.15], zoom: 10 }
  },

  {
    id: "neighborhood-nolita",
    type: "neighborhood",
    prompt: "What neighborhood is highlighted?",
    answer: "Nolita",
    // Approximate bounds: Houston (N), Bowery (E), Broome (S), Lafayette (W)
    target: {
      type: "Polygon",
      coordinates: [[
        [-73.99560, 40.72542], // Houston & Lafayette
        [-73.99195, 40.72475], // Houston & Bowery
        [-73.99380, 40.71930], // Bowery & Broome
        [-73.99790, 40.72020], // Broome & Lafayette
        [-73.99560, 40.72542]
      ]]
    },
    context: [
      { name: "SoHo", labelAt: [40.7233, -74.0009], kind: "area" },
      { name: "NoHo", labelAt: [40.7268, -73.9929], kind: "area" },
      { name: "Little Italy", labelAt: [40.7178, -73.9973], kind: "area" },
      { name: "Lower East Side", labelAt: [40.7189, -73.9865], kind: "area" }
    ],
    view: { center: [40.7228, -73.9945], zoom: 15 }
  },

  {
    id: "street-prince",
    type: "street",
    prompt: "What street is highlighted?",
    answer: "Prince Street",
    // Real OSM geometry (via Nominatim), Lafayette St → Sixth Ave
    target: {
      type: "MultiLineString",
      coordinates: [
        [
          [-73.997785, 40.724235], [-73.99789, 40.724287], [-73.998537, 40.724608],
          [-73.998585, 40.724632], [-73.998649, 40.724664], [-73.999287, 40.72498],
          [-73.999345, 40.725008], [-73.999411, 40.725041], [-74.000043, 40.725353],
          [-74.000101, 40.725382], [-74.000164, 40.725413], [-74.000626, 40.72564],
          [-74.000789, 40.725719], [-74.000817, 40.725733], [-74.000906, 40.725777]
        ],
        [
          [-74.000906, 40.725777], [-74.000983, 40.725816], [-74.001546, 40.726095],
          [-74.001596, 40.72612], [-74.001658, 40.726151], [-74.002293, 40.726466],
          [-74.002351, 40.726495], [-74.002413, 40.726526], [-74.003045, 40.72684],
          [-74.003107, 40.72687]
        ]
      ]
    },
    context: [
      { name: "Spring St", labelAt: [40.72405, -74.0009], kind: "street" },
      { name: "W Houston St", labelAt: [40.72765, -74.0004], kind: "street" },
      { name: "Broadway", labelAt: [40.7232, -73.9982], kind: "street" },
      { name: "Lafayette St", labelAt: [40.7226, -73.9964], kind: "street" }
    ],
    view: { center: [40.7255, -74.0005], zoom: 16 }
  },

  {
    id: "landmark-moma",
    type: "landmark",
    prompt: "What landmark is at the highlighted point?",
    answer: "Museum of Modern Art (MoMA)",
    target: { type: "Point", coordinates: [-73.97744, 40.76143] },
    context: [
      { name: "Radio City Music Hall", labelAt: [40.75998, -73.9799], kind: "landmark" },
      { name: "St. Patrick's Cathedral", labelAt: [40.75847, -73.97611], kind: "landmark" },
      { name: "Rockefeller Center", labelAt: [40.75874, -73.97867], kind: "landmark" }
    ],
    view: { center: [40.7604, -73.9778], zoom: 16 }
  }
];
