import { writeFileSync } from 'node:fs';
import { renderSectorMap } from '../src/services/mapRenderer.js';

// fake counts to preview the final rendering
const counts = [
  { name: 'Pau Centre', count: 9, visible: true },
  { name: 'Pau Université', count: 5, visible: true },
  { name: 'Pau Le Hameau', count: 3, visible: true },
  { name: 'Lons', count: 12, visible: true },
  { name: 'Billère', count: 2, visible: false },
];

writeFileSync('map_preview.png', await renderSectorMap(counts));
console.log('map_preview.png written');
