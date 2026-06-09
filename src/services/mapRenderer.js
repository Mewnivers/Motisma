import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { MIN_VISIBLE_PLAYERS } from '../config/sectors.js';

const require = createRequire(import.meta.url);
GlobalFonts.registerFromPath(require.resolve('dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf'), 'PauBold');
GlobalFonts.registerFromPath(require.resolve('dejavu-fonts-ttf/ttf/DejaVuSans.ttf'), 'Pau');

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const GEOJSON = join(ROOT, 'assets', 'sectors.geojson');
const CACHE_DIR = join(ROOT, 'assets');

const TILE = 256;
const MARGIN = 48;
const MAX_DIM = 2048;
const HEADER_H = 76;
const UA = 'RotomPau-bot/0.1 (community map; +https://github.com/ZelPhyris/Rotom)';

const COLD = [44, 125, 160];
const HOT = [244, 121, 31];
const MUTED = [120, 128, 138];

const lerp = (a, b, t) => Math.round(a + (b - a) * t);
const xt = (lon, z) => ((lon + 180) / 360) * 2 ** z;
const yt = (lat, z) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z;
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function centroid(pts) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
    const f = x0 * y1 - x1 * y0;
    a += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f;
  }
  a *= 0.5;
  return Math.abs(a) < 1e-6 ? pts[0] : [cx / (6 * a), cy / (6 * a)];
}

function computeLayout(geo) {
  let minLng = 180, minLat = 90, maxLng = -180, maxLat = -90;
  for (const f of geo.features)
    for (const ring of f.geometry.coordinates)
      for (const [lng, lat] of ring) {
        minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
      }
  let Z = 10;
  for (let z = 18; z >= 8; z--) {
    const wpx = (xt(maxLng, z) - xt(minLng, z)) * TILE;
    const hpx = (yt(minLat, z) - yt(maxLat, z)) * TILE;
    if (wpx + 2 * MARGIN <= MAX_DIM && hpx + 2 * MARGIN <= MAX_DIM) { Z = z; break; }
  }
  const originPxX = xt(minLng, Z) * TILE - MARGIN;
  const originPxY = yt(maxLat, Z) * TILE - MARGIN;
  const W = Math.ceil((xt(maxLng, Z) - xt(minLng, Z)) * TILE + 2 * MARGIN);
  const H = Math.ceil((yt(minLat, Z) - yt(maxLat, Z)) * TILE + 2 * MARGIN);
  const project = (lng, lat) => [xt(lng, Z) * TILE - originPxX, yt(lat, Z) * TILE - originPxY];
  return { Z, originPxX, originPxY, W, H, project };
}

// Fetch + composite the tiles once, soften them, and cache the result.
async function getBaseImage(layout) {
  const { Z, originPxX, originPxY, W, H } = layout;
  const cacheFile = join(CACHE_DIR, `basemap_z${Z}_${W}x${H}.png`);
  if (existsSync(cacheFile)) return loadImage(readFileSync(cacheFile));

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const tileX0 = Math.floor(originPxX / TILE), tileY0 = Math.floor(originPxY / TILE);
  const tileX1 = Math.floor((originPxX + W) / TILE), tileY1 = Math.floor((originPxY + H) / TILE);
  for (let tx = tileX0; tx <= tileX1; tx++)
    for (let ty = tileY0; ty <= tileY1; ty++) {
      const res = await fetch(`https://tile.openstreetmap.org/${Z}/${tx}/${ty}.png`, { headers: { 'User-Agent': UA } });
      const img = await loadImage(Buffer.from(await res.arrayBuffer()));
      ctx.drawImage(img, tx * TILE - originPxX, ty * TILE - originPxY);
    }

  // soften the base map (desaturate + lighten) so colored zones stand out
  const data = ctx.getImageData(0, 0, W, H);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const l = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
    d[i] = lerp(0.35 * d[i] + 0.65 * l, 255, 0.12);
    d[i + 1] = lerp(0.35 * d[i + 1] + 0.65 * l, 255, 0.12);
    d[i + 2] = lerp(0.35 * d[i + 2] + 0.65 * l, 255, 0.12);
  }
  ctx.putImageData(data, 0, 0);

  const buf = canvas.toBuffer('image/png');
  writeFileSync(cacheFile, buf);
  return loadImage(buf);
}

/**
 * Render the sector map as a PNG.
 * @param {Array<{ name: string, count: number, visible: boolean }>} sectorCounts
 * @returns {Promise<Buffer>}
 */
export async function renderSectorMap(sectorCounts) {
  const geo = JSON.parse(readFileSync(GEOJSON, 'utf8'));
  const layout = computeLayout(geo);
  const { W, H, project } = layout;
  const base = await getBaseImage(layout);

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(base, 0, 0);

  const byName = new Map(sectorCounts.map((s) => [s.name, s]));
  const maxRef = Math.max(MIN_VISIBLE_PLAYERS + 5, ...sectorCounts.map((s) => s.count));
  const heat = (c) => {
    const t = Math.max(0, Math.min(1, (c - MIN_VISIBLE_PLAYERS) / (maxRef - MIN_VISIBLE_PLAYERS)));
    return [lerp(COLD[0], HOT[0], t), lerp(COLD[1], HOT[1], t), lerp(COLD[2], HOT[2], t)];
  };

  // zone fills + outlines
  for (const f of geo.features) {
    const s = byName.get(f.properties.name) ?? { count: 0, visible: false };
    const col = s.visible ? heat(s.count) : MUTED;
    const pts = f.geometry.coordinates[0].map(([lng, lat]) => project(lng, lat));
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},0.42)`;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},0.95)`;
    ctx.stroke();
  }

  // badges (drawn after all fills so they sit on top)
  for (const f of geo.features) {
    const name = f.properties.name;
    const s = byName.get(name) ?? { count: 0, visible: false };
    const col = s.visible ? heat(s.count) : MUTED;
    const pts = f.geometry.coordinates[0].map(([lng, lat]) => project(lng, lat));
    const [cx, cy] = centroid(pts);
    const r = s.visible ? 30 : 24;

    // name pill below the badge
    ctx.font = '18px PauBold';
    const label = s.visible ? name : `${name} · en éveil`;
    const pw = ctx.measureText(label).width + 22;
    const py = cy + r + 7;
    roundRect(ctx, cx - pw / 2, py, pw, 26, 13);
    ctx.fillStyle = 'rgba(20,24,30,0.82)';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, py + 14);

    // circular count badge
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
    ctx.fill();
    ctx.restore();
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.stroke();
    ctx.fillStyle = '#fff';
    if (s.visible) {
      ctx.font = '30px PauBold';
      ctx.fillText(String(s.count), cx, cy + 1);
    } else {
      ctx.font = '16px PauBold';
      ctx.fillText('•••', cx, cy + 1);
    }
  }

  // header band
  ctx.fillStyle = 'rgba(18,21,26,0.78)';
  ctx.fillRect(0, 0, W, HEADER_H);
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = '30px PauBold';
  ctx.fillText('Pau — joueurs par secteur', 24, HEADER_H / 2);
  const total = sectorCounts.filter((s) => s.visible).reduce((a, s) => a + s.count, 0);
  ctx.textAlign = 'right';
  ctx.font = '22px PauBold';
  ctx.fillText(`Total : ${total} joueurs`, W - 20, HEADER_H / 2);

  // legend (cold -> hot)
  const lx = 20, ly = H - 50, lw = 170, lh = 12;
  roundRect(ctx, lx - 12, ly - 20, lw + 24, 46, 12);
  ctx.fillStyle = 'rgba(18,21,26,0.74)';
  ctx.fill();
  const grad = ctx.createLinearGradient(lx, 0, lx + lw, 0);
  grad.addColorStop(0, `rgb(${COLD[0]},${COLD[1]},${COLD[2]})`);
  grad.addColorStop(1, `rgb(${HOT[0]},${HOT[1]},${HOT[2]})`);
  roundRect(ctx, lx, ly, lw, lh, 6);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '13px Pau';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText('peu', lx, ly + lh + 3);
  ctx.textAlign = 'right';
  ctx.fillText('beaucoup', lx + lw, ly + lh + 3);

  // attribution (required by OSM)
  ctx.font = '15px Pau';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  const attr = '© OpenStreetMap contributors';
  const tw = ctx.measureText(attr).width;
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillRect(W - tw - 14, H - 24, tw + 12, 20);
  ctx.fillStyle = '#333';
  ctx.fillText(attr, W - 8, H - 6);

  return canvas.toBuffer('image/png');
}
