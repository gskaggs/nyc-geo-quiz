/**
 * NYC Geo Quiz — map view + question presenter.
 *
 * Core idea: the basemap (CARTO `light_nolabels`) has street/area geometry but
 * ZERO labels, so the app fully controls which names appear. For each question:
 *   - the target geometry is drawn highlighted, with no name
 *   - each context feature gets a name label, with no highlight
 */

const TILE_URL =
  "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
  'contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const TARGET_STYLES = {
  polygon: { color: "#e11d48", weight: 3, fillColor: "#e11d48", fillOpacity: 0.25 },
  line: { color: "#e11d48", weight: 7, opacity: 0.9 },
};

const map = L.map("map", { zoomControl: true });
L.tileLayer(TILE_URL, {
  attribution: TILE_ATTRIBUTION,
  subdomains: "abcd",
  maxZoom: 20,
}).addTo(map);

let questionLayer = L.layerGroup().addTo(map);
let currentIndex = 0;

function contextLabel(feature) {
  const cls = feature.kind === "area" ? "context-label area-label" : "context-label";
  return L.marker(feature.labelAt, {
    interactive: false,
    icon: L.divIcon({
      className: cls,
      html: `<span>${feature.name}</span>`,
      iconSize: null,
    }),
  });
}

function targetLayer(geometry) {
  if (geometry.type === "Point") {
    const [lng, lat] = geometry.coordinates;
    return L.marker([lat, lng], {
      interactive: false,
      icon: L.divIcon({ className: "target-marker", iconSize: [22, 22] }),
    });
  }
  const isLine = geometry.type.endsWith("LineString");
  return L.geoJSON(geometry, {
    interactive: false,
    style: isLine ? TARGET_STYLES.line : TARGET_STYLES.polygon,
  });
}

function renderQuestion(index) {
  currentIndex = (index + QUESTIONS.length) % QUESTIONS.length;
  const q = QUESTIONS[currentIndex];

  questionLayer.clearLayers();
  questionLayer.addLayer(targetLayer(q.target));
  q.context.forEach((c) => questionLayer.addLayer(contextLabel(c)));
  map.setView(q.view.center, q.view.zoom);

  document.getElementById("question-type").textContent = q.type;
  document.getElementById("question-prompt").textContent = q.prompt;
  document.getElementById("question-counter").textContent =
    `${currentIndex + 1} / ${QUESTIONS.length}`;
  const answerEl = document.getElementById("answer");
  answerEl.textContent = q.answer;
  answerEl.classList.add("hidden");

  document.querySelectorAll("#question-list button").forEach((btn, i) => {
    btn.classList.toggle("active", i === currentIndex);
  });
}

function buildQuestionList() {
  const list = document.getElementById("question-list");
  QUESTIONS.forEach((q, i) => {
    const btn = document.createElement("button");
    btn.textContent = `${i + 1}. ${q.prompt}`;
    btn.addEventListener("click", () => renderQuestion(i));
    list.appendChild(btn);
  });
}

document.getElementById("prev-btn").addEventListener("click", () =>
  renderQuestion(currentIndex - 1)
);
document.getElementById("next-btn").addEventListener("click", () =>
  renderQuestion(currentIndex + 1)
);
document.getElementById("reveal-btn").addEventListener("click", () => {
  document.getElementById("answer").classList.remove("hidden");
});

buildQuestionList();
renderQuestion(0);
