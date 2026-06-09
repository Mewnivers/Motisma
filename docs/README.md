# Rotom — interactive web map

Static site (Leaflet + OpenStreetMap) showing how many Pokemon GO players are
active in each area of Pau. No address is ever exposed: a sector reveals its
number only once it reaches the anonymity threshold (`minVisiblePlayers`, 3).

## Files

- `index.html` / `style.css` / `app.js` — the map UI
- `sectors.geojson` — zone geometry (copied from `../assets/sectors.geojson`)
- `counts.json` — live aggregated counts, written by the bot
- `CNAME` — custom domain for GitHub Pages (`rotom-pogo.mxrine-mz.dev`)

## Preview locally

```bash
cd docs
python3 -m http.server 8099
# open http://localhost:8099
```

## Deploy (free, GitHub Pages)

1. Repo **Settings > Pages**: Source = `Deploy from a branch`, branch `main`,
   folder `/docs`. Save.
2. The site goes live at `https://zelphyris.github.io/Rotom/`.
3. **Custom domain** — the `CNAME` file already targets
   `rotom-pogo.mxrine-mz.dev`. At your DNS provider for `mxrine-mz.dev`, add:

   ```
   CNAME   rotom-pogo   zelphyris.github.io.
   ```

   Then in Settings > Pages, set the custom domain and enable "Enforce HTTPS".

## Keeping the numbers fresh

The bot generates `counts.json` from the Discord sector roles
(`src/services/counts.js > writeCounts`). To publish new numbers, commit and
push `docs/counts.json` (e.g. from a scheduled job). GitHub Pages redeploys
automatically. Identities are never written — only per-sector totals.

## Geometry changes

`sectors.geojson` here is a copy. When the zones change, re-copy:

```bash
cp ../assets/sectors.geojson sectors.geojson
```
