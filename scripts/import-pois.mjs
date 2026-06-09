/* Pre-populate app/pois.geojson from OpenStreetMap (Overpass).
   PokeStops/Gyms are Niantic-proprietary and have no legal API; OSM POIs
   (fountains, artworks, churches, monuments, info boards...) overlap heavily
   with real stops and are open data. The result is a CANDIDATE list to prune
   by hand: all points are tagged "pokestop" — mark gyms manually afterwards.

   Usage: node scripts/import-pois.mjs */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SECTORS = join(ROOT, 'app', 'sectors.geojson');
const OUT = join(ROOT, 'app', 'pois.geojson');

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.osm.ch/api/interpreter',
];
const UA = 'RotomPau/0.1 (community map; +https://github.com/ZelPhyris/Rotom)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// OSM tag -> human label (French). Order matters: first match wins.
const LABELS = [
  [(t) => t.amenity === 'fountain', 'Fontaine'],
  [(t) => t.tourism === 'artwork', "Œuvre d'art"],
  [(t) => t.amenity === 'place_of_worship', 'Lieu de culte'],
  [(t) => t.historic === 'monument', 'Monument'],
  [(t) => t.historic === 'memorial', 'Mémorial'],
  [(t) => t.historic === 'wayside_cross', 'Croix'],
  [(t) => t.historic === 'wayside_shrine', 'Oratoire'],
  [(t) => !!t.historic, 'Lieu historique'],
  [(t) => t.tourism === 'information', "Panneau d'information"],
  [(t) => t.amenity === 'townhall', 'Mairie'],
  [(t) => t.leisure === 'playground', 'Aire de jeux'],
];

const labelFor = (t) => {
  if (t.name) return t.name;
  for (const [test, label] of LABELS) if (test(t)) return label;
  return 'Point';
};

function bbox(geo) {
  let s = 90, w = 180, n = -90, e = -180;
  for (const f of geo.features)
    for (const ring of f.geometry.coordinates)
      for (const [lng, lat] of ring) {
        s = Math.min(s, lat); n = Math.max(n, lat);
        w = Math.min(w, lng); e = Math.max(e, lng);
      }
  return { s, w, n, e };
}

// ray casting; ring is [[lng,lat],...]
function inRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const hit = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (hit) inside = !inside;
  }
  return inside;
}
const inAnySector = (lng, lat, geo) =>
  geo.features.some((f) => f.geometry.coordinates.some((ring) => inRing(lng, lat, ring)));

async function overpass(query) {
  let lastErr;
  for (const url of ENDPOINTS) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': UA,
            Accept: 'application/json',
          },
          body: 'data=' + encodeURIComponent(query),
        });
        if (res.status === 429 || res.status === 504) throw new Error(`HTTP ${res.status} (busy)`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        lastErr = err;
        console.warn(`[warn] ${url} attempt ${attempt}: ${err.message}`);
        if (attempt < 3) await sleep(2000 * attempt);
      }
    }
  }
  throw lastErr;
}

const geo = JSON.parse(readFileSync(SECTORS, 'utf8'));
const { s, w, n, e } = bbox(geo);
const box = `${s},${w},${n},${e}`;

const query = `[out:json][timeout:90];
(
  nwr["amenity"="fountain"](${box});
  nwr["tourism"="artwork"](${box});
  nwr["amenity"="place_of_worship"](${box});
  nwr["historic"](${box});
  nwr["tourism"="information"]["information"~"board|map|guidepost|office"](${box});
  nwr["amenity"="townhall"](${box});
  nwr["leisure"="playground"](${box});
);
out center tags;`;

console.log(`Querying Overpass for bbox ${box} ...`);
const json = await overpass(query);

const seen = new Set();
const features = [];
for (const el of json.elements) {
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (lat == null || lng == null) continue;
  if (!inAnySector(lng, lat, geo)) continue;
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (seen.has(key)) continue;
  seen.add(key);
  features.push({
    type: 'Feature',
    properties: { name: labelFor(el.tags ?? {}), kind: 'pokestop' },
    geometry: { type: 'Point', coordinates: [Number(lng.toFixed(6)), Number(lat.toFixed(6))] },
  });
}

features.sort((a, b) => a.properties.name.localeCompare(b.properties.name, 'fr'));
writeFileSync(OUT, JSON.stringify({ type: 'FeatureCollection', features }, null, 2) + '\n');
console.log(`Wrote ${features.length} candidate POIs to ${OUT}`);
