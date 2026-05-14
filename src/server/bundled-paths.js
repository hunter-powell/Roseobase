import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(__dirname, '../..');

/** Genome folders shipped with the app or present in a dev checkout. */
export function getBundledGenomeDirs() {
  const dirs = [];
  const candidates = [];

  if (process.resourcesPath) {
    candidates.push(path.join(process.resourcesPath, 'genomes'));
  }
  candidates.push(
    path.join(PROJECT_ROOT, 'public', 'genomes'),
    path.join(PROJECT_ROOT, 'dist', 'genomes'),
  );

  for (const dir of candidates) {
    if (fs.existsSync(dir) && !dirs.includes(dir)) {
      dirs.push(dir);
    }
  }
  return dirs;
}
