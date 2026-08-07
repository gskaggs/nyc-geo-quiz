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
    id: "landmark-empire-state",
    type: "landmark",
    prompt: "What landmark is at the highlighted point?",
    answer: "Empire State Building",
    target: { type: "Point", coordinates: [-73.9857, 40.7484] },
    context: [
      { name: "W 34th St", labelAt: [40.7494, -73.9878], kind: "street" },
      { name: "Fifth Ave", labelAt: [40.7470, -73.9843], kind: "street" },
      { name: "Broadway", labelAt: [40.7502, -73.9886], kind: "street" },
      { name: "Sixth Ave", labelAt: [40.7495, -73.9903], kind: "street" }
    ],
    view: { center: [40.7487, -73.9867], zoom: 16 }
  },

  {
    id: "landmark-grand-central",
    type: "landmark",
    prompt: "What landmark is at the highlighted point?",
    answer: "Grand Central Terminal",
    target: { type: "Point", coordinates: [-73.9773, 40.7527] },
    context: [
      { name: "E 42nd St", labelAt: [40.7519, -73.9750], kind: "street" },
      { name: "Park Ave", labelAt: [40.7540, -73.9764], kind: "street" },
      { name: "Lexington Ave", labelAt: [40.7533, -73.9739], kind: "street" },
      { name: "Madison Ave", labelAt: [40.7538, -73.9795], kind: "street" }
    ],
    view: { center: [40.7530, -73.9768], zoom: 16 }
  },

  {
    id: "borough-brooklyn",
    type: "borough",
    prompt: "What borough is highlighted?",
    answer: "Brooklyn",
    target: {
      type: "Polygon",
      coordinates: [[[-74.05669, 40.62704], [-74.04157, 40.603], [-74.03511, 40.57819],
        [-74.03805, 40.55034], [-73.87895, 40.57445], [-73.84978, 40.5882],
        [-73.83424, 40.60679], [-73.83294, 40.62898], [-73.84803, 40.64383],
        [-73.85514, 40.64287], [-73.86354, 40.6583], [-73.8557, 40.66371],
        [-73.85763, 40.67166], [-73.86603, 40.68192], [-73.86907, 40.6953],
        [-73.89648, 40.68232], [-73.90446, 40.6958], [-73.9219, 40.70939],
        [-73.92921, 40.72774], [-73.95525, 40.73943], [-73.96255, 40.73644],
        [-73.96172, 40.72487], [-73.9679, 40.71732], [-73.96931, 40.70547],
        [-73.97226, 40.7091], [-73.99599, 40.70377], [-74.00829, 40.68644],
        [-74.01958, 40.67965], [-74.03544, 40.68512], [-74.05577, 40.65147],
        [-74.05669, 40.62704]]]
    },
    context: [
      { name: "Manhattan", labelAt: [40.758, -73.975], kind: "area" },
      { name: "Queens", labelAt: [40.735, -73.86], kind: "area" },
      { name: "Staten Island", labelAt: [40.58, -74.15], kind: "area" }
    ],
    view: { center: [40.65, -73.95], zoom: 10 }
  },

  {
    id: "street-canal",
    type: "street",
    prompt: "What street is highlighted?",
    answer: "Canal Street",
    target: {
      type: "MultiLineString",
      coordinates: [
        [[-73.990228, 40.714421], [-73.990373, 40.714447], [-73.990663, 40.714533],
         [-73.991064, 40.714656], [-73.991128, 40.714676]],
        [[-73.99545, 40.716016], [-73.995502, 40.716106], [-73.995699, 40.716459],
         [-73.995719, 40.716486], [-73.995738, 40.71651], [-73.995771, 40.716539],
         [-73.995807, 40.716565], [-73.995827, 40.716586], [-73.995838, 40.716602],
         [-73.995849, 40.716608]],
        [[-73.999309, 40.717554], [-73.999363, 40.717593], [-73.99983, 40.717931],
         [-73.999882, 40.717968], [-73.999953, 40.718019], [-74.000037, 40.718079],
         [-74.000097, 40.718121], [-74.00041, 40.718344], [-74.000454, 40.718376],
         [-74.000552, 40.718449], [-74.000618, 40.718499], [-74.000671, 40.718538],
         [-74.000934, 40.718726], [-74.001268, 40.718964]],
        [[-74.007929, 40.723763], [-74.008033, 40.723845], [-74.00848, 40.724179],
         [-74.008544, 40.724226], [-74.008671, 40.724316], [-74.008813, 40.72442],
         [-74.008883, 40.724472], [-74.008948, 40.724519]]
      ]
    },
    context: [
      { name: "Broadway", labelAt: [40.7172, -74.0025], kind: "street" },
      { name: "Bowery", labelAt: [40.7156, -73.9942], kind: "street" },
      { name: "Hudson St", labelAt: [40.7225, -74.0065], kind: "street" },
      { name: "Walker St", labelAt: [40.7186, -74.0010], kind: "street" }
    ],
    view: { center: [40.7185, -74.0000], zoom: 15 }
  },

  {
    id: "landmark-flatiron",
    type: "landmark",
    prompt: "What landmark is at the highlighted point?",
    answer: "Flatiron Building",
    // Real OSM position (via Nominatim): 175 5th Ave
    target: { type: "Point", coordinates: [-73.98964, 40.74106] },
    // Preference: landmark questions reveal the nearby crossroads
    context: [
      { name: "Fifth Ave", labelAt: [40.7398, -73.9901], kind: "street" },
      { name: "Broadway", labelAt: [40.7425, -73.9886], kind: "street" },
      { name: "E 23rd St", labelAt: [40.7399, -73.9868], kind: "street" },
      { name: "W 23rd St", labelAt: [40.7419, -73.9931], kind: "street" }
    ],
    view: { center: [40.7411, -73.9894], zoom: 16 }
  },

  {
    id: "street-st-marks",
    type: "street",
    prompt: "What street is highlighted?",
    answer: "St Marks Place",
    // Real OSM geometry (via Nominatim), 3rd Ave → 1st Ave, East Village
    target: {
      type: "MultiLineString",
      coordinates: [
        [
          [-73.987665, 40.728604], [-73.987551, 40.728556],
          [-73.985439, 40.727655], [-73.985307, 40.727599]
        ],
        [
          [-73.985307, 40.727599], [-73.985175, 40.727544],
          [-73.983198, 40.726712], [-73.98309, 40.726666]
        ]
      ]
    },
    // Preference: street questions reveal nearby streets
    context: [
      { name: "3rd Ave", labelAt: [40.7300, -73.9882], kind: "street" },
      { name: "2nd Ave", labelAt: [40.7297, -73.9861], kind: "street" },
      { name: "E 9th St", labelAt: [40.7290, -73.9868], kind: "street" },
      { name: "E 7th St", labelAt: [40.7273, -73.9866], kind: "street" }
    ],
    view: { center: [40.7277, -73.9856], zoom: 16 }
  },

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
    // Preference: landmark questions reveal the nearby crossroads
    context: [
      { name: "W 53rd St", labelAt: [40.7619, -73.9793], kind: "street" },
      { name: "Fifth Ave", labelAt: [40.7597, -73.9749], kind: "street" },
      { name: "Sixth Ave", labelAt: [40.7608, -73.9808], kind: "street" }
    ],
    view: { center: [40.7604, -73.9778], zoom: 16 }
  }
];
