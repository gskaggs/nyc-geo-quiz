#!/usr/bin/env python3
"""
Generate quiz questions for js/questions_generated.js.

Sources:
- Neighborhood polygons: pedia-cities NYC neighborhoods GeoJSON (clean names, per-borough)
- Park polygons: Nominatim (polygon_geojson, simplified)
- Street geometry: Overpass `around` queries (maps.mail.ru mirror)

Context is auto-generated per user preferences:
- park / neighborhood questions -> nearest neighborhood names as area labels
- street questions -> nearest streets from the same batch (with geometry, so the
  app snaps/rotates labels and hover-highlights them)

Responses are cached in .cache/ so re-runs are cheap.
"""
import json
import math
import pathlib
import re
import subprocess
import time

ROOT = pathlib.Path(__file__).resolve().parent.parent
CACHE = ROOT / ".cache"
CACHE.mkdir(exist_ok=True)
OUT = ROOT / "js" / "questions_generated.js"

NBHD_URL = "https://raw.githubusercontent.com/HodgesWardElliott/custom-nyc-neighborhoods/master/custom-pedia-cities-nyc-Mar2018.geojson"
OVERPASS = "https://maps.mail.ru/osm/tools/overpass/api/interpreter"
NOMINATIM = "https://nominatim.openstreetmap.org/search"
UA = "nyc-geo-quiz-generator/0.1 (personal learning project)"

# ---------------------------------------------------------------- specs

MANHATTAN_PARKS = [
    "Central Park", "Washington Square Park", "Bryant Park", "Madison Square Park",
    "Union Square Park", "Tompkins Square Park", "Riverside Park", "Battery Park",
]
BROOKLYN_PARKS = [
    "Prospect Park", "McCarren Park", "Fort Greene Park", "Brooklyn Bridge Park",
]
MANHATTAN_NEIGHBORHOODS = [
    "Financial District", "Tribeca", "Chinatown", "Lower East Side", "SoHo",
    "Greenwich Village", "West Village", "East Village", "Chelsea", "Gramercy",
    "Midtown", "Hell's Kitchen", "Murray Hill", "Upper East Side", "Upper West Side",
    "Harlem", "East Harlem", "Morningside Heights", "Washington Heights", "Inwood",
]
BROOKLYN_NEIGHBORHOODS = [
    "Williamsburg", "Greenpoint", "Bushwick", "Bedford-Stuyvesant", "DUMBO",
    "Brooklyn Heights", "Downtown Brooklyn", "Fort Greene", "Park Slope",
    "Prospect Heights", "Crown Heights", "Sunset Park", "Bay Ridge", "Coney Island",
    "Flatbush", "Red Hook", "Carroll Gardens",
]
# (display/answer name, OSM name), fetched around a neighborhood anchor point
SOHO_STREETS = [
    "West Broadway", "Spring Street", "Broome Street", "Grand Street", "Mercer Street",
    "Greene Street", "Wooster Street", "Sullivan Street", "Thompson Street", "Lafayette Street",
]
SOHO_ANCHOR = (40.7228, -74.0010)
SOHO_RADIUS = 450
VILLAGE_STREETS = [
    "Bleecker Street", "MacDougal Street", "Christopher Street", "West 4th Street",
    "Waverly Place", "Grove Street", "Bedford Street", "Greenwich Avenue",
    "University Place", "West 8th Street",
]
VILLAGE_ANCHOR = (40.7325, -74.0005)
VILLAGE_RADIUS = 700

# ---------------------------------------------------------------- helpers

def slug(name):
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", name.lower())).strip("-")

def curl(url_and_args):
    r = subprocess.run(["curl", "-s", "--max-time", "45", "-A", UA] + url_and_args,
                       capture_output=True, text=True)
    return r.stdout

def cached(key, fetch_fn):
    f = CACHE / f"{slug(key)}.json"
    if f.exists():
        return json.load(open(f))
    data = fetch_fn()
    json.dump(data, open(f, "w"))
    time.sleep(1.2)
    return data

def fetch_overpass(osm_name, lat, lng, radius):
    q = (f'[out:json][timeout:25];way["highway"]["name"="{osm_name}"]'
         f'(around:{radius},{lat},{lng});out geom;')
    for attempt in range(6):
        try:
            d = json.loads(curl([OVERPASS, "--data-urlencode", f"data={q}"]))
            lines = []
            for w in d.get("elements", []):
                if w.get("type") != "way" or "geometry" not in w:
                    continue
                if w.get("tags", {}).get("highway") in ("service", "footway", "cycleway", "motorway_link"):
                    continue
                lines.append([[round(g["lon"], 6), round(g["lat"], 6)] for g in w["geometry"]])
            return lines
        except (json.JSONDecodeError, KeyError):
            time.sleep(4 * (attempt + 1))
    raise RuntimeError(f"overpass failed: {osm_name}")

def fetch_park(name, borough):
    def go():
        out = curl([f"{NOMINATIM}?format=json&polygon_geojson=1&polygon_threshold=0.0002&limit=5",
                    "--get", "--data-urlencode", f"q={name}, {borough}, New York"])
        for r in json.loads(out):
            g = r.get("geojson", {})
            if g.get("type") in ("Polygon", "MultiPolygon"):
                return {"geojson": g, "display_name": r["display_name"]}
        raise RuntimeError(f"no polygon for {name}")
    return cached(f"park-{borough}-{name}", go)

def round_coords(c, nd=5):
    if isinstance(c[0], (int, float)):
        return [round(c[0], nd), round(c[1], nd)]
    return [round_coords(x, nd) for x in c]

def decimate_ring(ring, max_pts=150):
    if len(ring) <= max_pts:
        return ring
    step = math.ceil(len(ring) / max_pts)
    out = ring[::step]
    if out[-1] != ring[-1]:
        out.append(ring[-1])
    return out

def simplify_polygon(geom):
    if geom["type"] == "Polygon":
        geom["coordinates"] = [decimate_ring(r) for r in geom["coordinates"]]
    elif geom["type"] == "MultiPolygon":
        geom["coordinates"] = [[decimate_ring(r) for r in poly] for poly in geom["coordinates"]]
    geom["coordinates"] = round_coords(geom["coordinates"])
    return geom

def all_points(geom):
    pts = []
    def walk(c):
        if isinstance(c[0], (int, float)):
            pts.append(c)
        else:
            for x in c:
                walk(x)
    walk(geom["coordinates"])
    return pts

def centroid(geom):
    pts = all_points(geom)
    return (sum(p[1] for p in pts) / len(pts), sum(p[0] for p in pts) / len(pts))  # lat,lng

def dist_km(a, b):
    k = math.cos(math.radians(a[0]))
    return 111.0 * math.hypot(a[0] - b[0], (a[1] - b[1]) * k)

def view_for(geom, min_zoom=11, max_zoom=16):
    pts = all_points(geom)
    lats = [p[1] for p in pts]; lngs = [p[0] for p in pts]
    c = centroid(geom)
    span = max((max(lats) - min(lats)) * 1.32, max(lngs) - min(lngs), 1e-4)
    zoom = int(max(min_zoom, min(max_zoom, math.floor(math.log2(450 * 360 / (256 * span))))))
    return {"center": [round(c[0], 5), round(c[1], 5)], "zoom": zoom}

# ---------------------------------------------------------------- build

def load_neighborhoods():
    f = CACHE / "nyc-neighborhoods.json"
    if not f.exists():
        raw = curl([NBHD_URL])
        open(f, "w").write(raw)
    d = json.load(open(f))
    hoods = {}
    for feat in d["features"]:
        p = feat["properties"]
        if p["borough"] in ("Manhattan", "Brooklyn", "Queens", "Bronx"):
            key = (p["neighborhood"], p["borough"])
            hoods[key] = feat["geometry"]
    return hoods

def nearest_hoods(hood_centroids, from_latlng, exclude_names, borough=None,
                  n=4, min_km=0.2, max_km=6.0, min_sep_km=0.8):
    """Nearest neighborhoods for context labels. Prefers the target's borough
    (cross-river picks get a distance penalty) and keeps picked labels at least
    min_sep_km apart so they don't render on top of each other."""
    cands = []
    for (name, boro), c in hood_centroids.items():
        # skip names that would give the answer away ("East Williamsburg" for
        # Williamsburg, "Battery Park City" for Battery Park, ...)
        if any(x.lower() in name.lower() or name.lower() in x.lower()
               for x in exclude_names):
            continue
        d = dist_km(from_latlng, c)
        if min_km <= d <= max_km:
            score = d + (1.0 if borough and boro != borough else 0.0)
            cands.append((score, name, c))
    cands.sort()
    picked, names = [], set()
    for _, name, c in cands:
        if name in names:
            continue
        if any(dist_km(c, (p["labelAt"][0], p["labelAt"][1])) < min_sep_km for p in picked):
            continue
        picked.append({"name": name, "labelAt": [round(c[0], 5), round(c[1], 5)], "kind": "area"})
        names.add(name)
        if len(picked) >= n:
            break
    return picked

def main():
    hoods = load_neighborhoods()
    hood_centroids = {k: centroid(g) for k, g in hoods.items()}
    questions = []

    # --- parks
    for borough, parks in (("Manhattan", MANHATTAN_PARKS), ("Brooklyn", BROOKLYN_PARKS)):
        for park in parks:
            data = fetch_park(park, borough)
            geom = simplify_polygon(data["geojson"])
            c = centroid(geom)
            ctx = nearest_hoods(hood_centroids, c, exclude_names={park}, borough=borough,
                                n=3, min_km=0.2)
            questions.append({
                "id": f"park-{slug(park)}",
                "type": "park",
                "prompt": "What park is highlighted?",
                "answer": park,
                "target": geom,
                "context": ctx,
                "view": view_for(geom),
            })
            print(f"park {park}: {len(ctx)} ctx, zoom {questions[-1]['view']['zoom']}")

    # --- neighborhoods
    for borough, names in (("Manhattan", MANHATTAN_NEIGHBORHOODS), ("Brooklyn", BROOKLYN_NEIGHBORHOODS)):
        for name in names:
            geom = simplify_polygon(json.loads(json.dumps(hoods[(name, borough)])))
            c = centroid(geom)
            ctx = nearest_hoods(hood_centroids, c, exclude_names={name}, borough=borough,
                                n=4, min_km=0.3)
            questions.append({
                "id": f"neighborhood-{slug(name)}",
                "type": "neighborhood",
                "prompt": "What neighborhood is highlighted?",
                "answer": name,
                "target": geom,
                "context": ctx,
                "view": view_for(geom, min_zoom=12),
            })
            print(f"hood {name}: {len(ctx)} ctx, zoom {questions[-1]['view']['zoom']}")

    # --- streets
    for area, streets, (alat, alng), radius in (
        ("SoHo", SOHO_STREETS, SOHO_ANCHOR, SOHO_RADIUS),
        ("Greenwich Village", VILLAGE_STREETS, VILLAGE_ANCHOR, VILLAGE_RADIUS),
    ):
        geoms = {}
        for st in streets:
            lines = cached(f"street-{area}-{st}", lambda: fetch_overpass(st, alat, alng, radius))
            if not lines:
                print(f"!! no geometry for {st} ({area}) — skipped")
                continue
            geoms[st] = {"type": "MultiLineString", "coordinates": lines}
        cents = {st: centroid(g) for st, g in geoms.items()}
        for st, geom in geoms.items():
            others = sorted((dist_km(cents[st], cents[o]), o) for o in geoms if o != st)
            ctx = [{
                "name": o, "labelAt": [round(cents[o][0], 5), round(cents[o][1], 5)],
                "kind": "street", "geometry": geoms[o],
            } for _, o in others[:3]]
            questions.append({
                "id": f"street-{slug(st)}",
                "type": "street",
                "prompt": "What street is highlighted?",
                "answer": st,
                "target": geom,
                "context": ctx,
                "view": view_for(geom, min_zoom=14, max_zoom=16),
            })
            print(f"street {st} ({area}): ctx {[c['name'] for c in ctx]}")

    ids = [q["id"] for q in questions]
    assert len(ids) == len(set(ids)), "duplicate question ids"

    body = ",\n".join("  " + json.dumps(q, separators=(",", ":")) for q in questions)
    OUT.write_text(
        "// GENERATED by scripts/generate_questions.py — do not edit by hand.\n"
        f"const GENERATED_QUESTIONS = [\n{body}\n];\n"
        "QUESTIONS.push(...GENERATED_QUESTIONS);\n"
    )
    print(f"\nwrote {len(questions)} questions to {OUT}")

if __name__ == "__main__":
    main()
