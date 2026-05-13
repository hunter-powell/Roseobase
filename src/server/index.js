import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createBlastRouter } from './blast-api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../..');

let currentServer = null;

export async function startServer({ dataDir = '', blastBinDir = '', port = 0 } = {}) {
  if (currentServer) {
    await new Promise((resolve) => currentServer.close(resolve));
    currentServer = null;
  }

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '5mb' }));

  // Serve FASTA/GFF/.fai from the user's data directory first, then fall back to
  // bundled `public/genomes` (e.g. indices shipped with the app).
  if (dataDir) {
    const userGenomes = path.join(dataDir, 'genomes');
    if (fs.existsSync(userGenomes)) {
      app.use('/genomes', express.static(userGenomes));
    }
  }
  const publicGenomes = path.join(PROJECT_ROOT, 'public', 'genomes');
  if (fs.existsSync(publicGenomes)) {
    app.use('/genomes', express.static(publicGenomes));
  }

  const blastRouter = createBlastRouter({ dataDir, blastBinDir });
  app.use('/api/blast', blastRouter);

  return new Promise((resolve, reject) => {
    currentServer = app.listen(port, () => {
      const assignedPort = currentServer.address().port;
      console.log(`Roseobase API server running on port ${assignedPort}`);
      if (dataDir) console.log(`  Data directory: ${dataDir}`);
      if (blastBinDir) console.log(`  BLAST bin directory: ${blastBinDir}`);
      resolve(assignedPort);
    });
    currentServer.on('error', reject);
  });
}

const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('server/index.js') ||
  process.argv[1].endsWith('server\\index.js')
);

if (isDirectRun) {
  const PORT = process.env.PORT || 3001;
  startServer({ port: Number(PORT) })
    .then(p => console.log(`Standalone server on port ${p}`))
    .catch(err => console.error('Failed to start server:', err));
}
