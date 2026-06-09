# Rotom — interactive web map

Static site (Leaflet + OpenStreetMap) showing how many Pokemon GO players are
active in each area of Pau. No address is ever exposed: a sector reveals its
number only once it reaches the anonymity threshold (`minVisiblePlayers`, 3).

## Files

- `index.html` / `style.css` / `app.js` — the map UI (entry point: `index.html`)
- `sectors.geojson` — zone geometry (copied from `../assets/sectors.geojson`)
- `counts.json` — live aggregated counts, written by the bot
- `pois.geojson` — community-curated PokeStops and Gyms (see below)

## Preview locally

```bash
cd app
python3 -m http.server 8099
# open http://localhost:8099
```

## Deploy

Served by the VPS nginx at `rotom-pogo.mxrine-mz.dev`.
See [`../deploy/README.md`](../deploy/README.md) for the one-time setup and the
`publish.sh` update command. Only aggregated counts are published — never
member identities.

## PokeStops and Gyms (`pois.geojson`)

Hand-curated by the community — there is no official or legal API for the exact
in-game locations, and scraping Niantic risks account bans. Each point is a
GeoJSON Feature with a `kind` of `"pokestop"` or `"gym"` and a `name`:

```json
{
  "type": "Feature",
  "properties": { "name": "Fontaine de la place", "kind": "pokestop" },
  "geometry": { "type": "Point", "coordinates": [-0.3700, 43.2970] }
}
```

Coordinates are `[longitude, latitude]`. Add points by hand or with geojson.io,
then run `deploy/publish.sh`. The map shows blue dots for PokeStops, red for
Gyms, with a layer toggle. The file ships with a few example points — replace
them with real ones.

## Geometry changes

`sectors.geojson` here is a copy. When the zones change, re-copy:

```bash
cp ../assets/sectors.geojson sectors.geojson
```
