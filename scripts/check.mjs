// Vérifie la syntaxe de tous les fichiers JavaScript de src/ et scripts/
// avec `node --check`. Usage : npm run check
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function collect(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return collect(full);
    return /\.(c|m)?js$/.test(entry.name) ? [full] : [];
  });
}

const files = ['src', 'scripts'].flatMap(collect);
let failed = 0;
for (const file of files) {
  const { status } = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (status !== 0) failed++;
}

console.log(`${files.length} fichiers vérifiés, ${failed} en erreur.`);
process.exit(failed ? 1 : 0);
