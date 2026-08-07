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
let hoverLayer = L.layerGroup().addTo(map);
let currentIndex = 0;

// Display order over QUESTIONS: identity by default, shuffled when enabled.
let order = [];
let shuffled = false;

function resetOrder() {
  order = QUESTIONS.map((_, i) => i);
}

function shuffleOrder() {
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
}

const HOVER_STYLE = { color: "#2563eb", weight: 6, opacity: 0.85 };

/**
 * Snap a label position onto the nearest point of a street geometry and
 * compute the street's local screen bearing there (for inline label rotation).
 * Returns { at: [lat, lng], angle: degrees in (-90, 90] }.
 */
function snapToStreet(geometry, labelAt) {
  const [lat0, lng0] = labelAt;
  const k = Math.cos((lat0 * Math.PI) / 180); // lon → local x scale
  const px = lng0 * k, py = lat0;
  const lines =
    geometry.type === "LineString" ? [geometry.coordinates] : geometry.coordinates;
  let best = null;
  for (const line of lines) {
    for (let i = 0; i + 1 < line.length; i++) {
      const ax = line[i][0] * k, ay = line[i][1];
      const bx = line[i + 1][0] * k, by = line[i + 1][1];
      const dx = bx - ax, dy = by - ay;
      const len2 = dx * dx + dy * dy;
      const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
      const qx = ax + t * dx, qy = ay + t * dy;
      const d2 = (px - qx) ** 2 + (py - qy) ** 2;
      if (!best || d2 < best.d2) {
        // screen angle: x → east, y → down (so negate dlat)
        let angle = (Math.atan2(-dy, dx) * 180) / Math.PI;
        if (angle > 90) angle -= 180;
        if (angle <= -90) angle += 180;
        best = { d2, at: [qy, qx / k], angle };
      }
    }
  }
  return best;
}

function contextLabel(feature) {
  const cls = feature.kind === "area" ? "context-label area-label" : "context-label";
  let at = feature.labelAt;
  let angle = 0;
  if (feature.geometry && feature.kind === "street") {
    const snapped = snapToStreet(feature.geometry, feature.labelAt);
    if (snapped) ({ at, angle } = snapped);
  }
  const marker = L.marker(at, {
    interactive: Boolean(feature.geometry),
    icon: L.divIcon({
      className: cls,
      html: `<span style="transform: translate(-50%, -50%) rotate(${angle.toFixed(1)}deg)">${feature.name}</span>`,
      iconSize: null,
    }),
  });
  if (feature.geometry) {
    marker.on("mouseover", () => {
      hoverLayer.clearLayers();
      hoverLayer.addLayer(
        L.geoJSON(feature.geometry, { interactive: false, style: HOVER_STYLE })
      );
    });
    marker.on("mouseout", () => hoverLayer.clearLayers());
  }
  return marker;
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
  currentIndex = (index + order.length) % order.length;
  const q = QUESTIONS[order[currentIndex]];

  questionLayer.clearLayers();
  hoverLayer.clearLayers();
  questionLayer.addLayer(targetLayer(q.target));
  q.context.forEach((c) => questionLayer.addLayer(contextLabel(c)));
  map.setView(q.view.center, q.view.zoom);

  document.getElementById("question-type").textContent = q.type;
  document.getElementById("question-prompt").textContent = q.prompt;
  document.getElementById("question-counter").textContent =
    `${currentIndex + 1} / ${order.length}`;
  const answerEl = document.getElementById("answer");
  answerEl.textContent = q.answer;
  answerEl.classList.add("hidden");

  document.querySelectorAll("#question-list button").forEach((btn, i) => {
    btn.classList.toggle("active", i === currentIndex);
  });
}

function buildQuestionList() {
  const list = document.getElementById("question-list");
  list.innerHTML = "";
  order.forEach((qi, i) => {
    const btn = document.createElement("button");
    btn.textContent = `${i + 1}. ${QUESTIONS[qi].prompt}`;
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

// Shuffle toggle: on = random order, off = original order. The question being
// viewed stays the same; only its position in the deck changes.
document.getElementById("shuffle-btn").addEventListener("click", (e) => {
  const viewing = order[currentIndex];
  shuffled = !shuffled;
  resetOrder();
  if (shuffled) shuffleOrder();
  e.target.classList.toggle("active", shuffled);
  buildQuestionList();
  renderQuestion(order.indexOf(viewing));
});

// "Open in Google Maps" — keep the link pointed at the current view
const gmapsBtn = document.getElementById("gmaps-btn");
function syncGmapsLink() {
  const c = map.getCenter();
  const z = Math.round(map.getZoom());
  gmapsBtn.href = `https://www.google.com/maps/@${c.lat.toFixed(6)},${c.lng.toFixed(6)},${z}z`;
}
map.on("moveend", syncGmapsLink);

// Keyboard: space/enter reveals answer, then advances to next question
document.addEventListener("keydown", (e) => {
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    const answerEl = document.getElementById("answer");
    if (answerEl.classList.contains("hidden")) {
      answerEl.classList.remove("hidden");
    } else {
      renderQuestion(currentIndex + 1);
    }
  }
});

resetOrder();
buildQuestionList();
renderQuestion(0);
syncGmapsLink();
