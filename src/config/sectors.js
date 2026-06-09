/**
 * Play areas of Pau. Geometry lives in assets/sectors.geojson (matched by name);
 * here we only map each area to the Discord role players self-assign.
 *
 * TODO: fill in the real role IDs (Developer Mode on > right-click role > Copy Role ID).
 */
export const sectors = [
  { name: 'Pau Centre', roleId: '' },
  { name: 'Pau Université', roleId: '' },
  { name: 'Pau Le Hameau', roleId: '' },
  { name: 'Lons', roleId: '' },
  { name: 'Billère', roleId: '' },
];

/** A sector only reveals its count once it reaches this many players (anonymity). */
export const MIN_VISIBLE_PLAYERS = 3;
