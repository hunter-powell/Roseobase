import express from 'express';
import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

import { PROJECT_ROOT, getBundledGenomeDirs } from './bundled-paths.js';

function parseOutfmt6(line) {
  const cols = line.split('\t');
  if (cols.length < 15) return null;
  const evalue = Number(cols[10]);
  const bitscore = Number(cols[11]);
  return { cols, evalue, bitscore };
}

function buildMergedLine(dbName, cols) {
  return [dbName, ...cols].join('\t');
}

export function createBlastRouter({ dataDir = '', blastBinDir = '' } = {}) {
  const router = express.Router();

  function getBlastDbDir() {
    if (dataDir) {
      const dir = path.join(dataDir, 'blastdb');
      if (fs.existsSync(dir)) return dir;
    }
    const fallback = path.join(PROJECT_ROOT, 'blastdb');
    if (fs.existsSync(fallback)) return fallback;
    return '';
  }

  /** Ordered search paths: user data first, then bundled genomes. */
  function getGenomeSearchDirs() {
    const dirs = [];
    if (dataDir) {
      const userDir = path.join(dataDir, 'genomes');
      if (fs.existsSync(userDir)) dirs.push(userDir);
    }
    for (const dir of getBundledGenomeDirs()) {
      if (!dirs.includes(dir)) dirs.push(dir);
    }
    return dirs;
  }

  function resolveBlastBin(program) {
    if (blastBinDir) {
      const ext = process.platform === 'win32' ? '.exe' : '';
      const binPath = path.join(blastBinDir, program + ext);
      if (fs.existsSync(binPath)) return binPath;
    }
    return program;
  }

  function listBlastDbs() {
    const dbDir = getBlastDbDir();
    if (!dbDir || !fs.existsSync(dbDir)) {
      console.warn(`BLAST database directory not found: ${dbDir}`);
      return [];
    }

    const allFiles = fs.readdirSync(dbDir);
    const ninFiles = allFiles.filter(f => f.endsWith('.nin'));

    const databases = ninFiles
      .map(f => f.replace('.nin', ''))
      .filter(name => !name.endsWith(' 2'));

    console.log(`Found ${databases.length} BLAST databases in ${dbDir}`);
    return databases;
  }

  // POST /api/blast
  router.post('/', async (req, res) => {
    const BLAST_DB_DIR = getBlastDbDir();
    if (!BLAST_DB_DIR) {
      return res.status(500).json({ error: 'No BLAST database directory configured. Please select a data directory in Settings.' });
    }

    try {
      const { sequence, program = 'blastn', evalue = '10', maxHits = 100, wordSize = '', db } = req.body;
      if (!sequence || !sequence.trim()) {
        return res.status(400).json({ error: 'No sequence provided' });
      }

      const tmpDir = os.tmpdir();
      const queryFile = path.join(tmpDir, `blast_query_${Date.now()}.fasta`);
      fs.writeFileSync(queryFile, sequence);

      const bin = resolveBlastBin(program);

      const runBlast = (dbPath, dbName) => new Promise((resolve) => {
        if (dbName && dbName.includes(' 2')) return resolve([]);

        const requiredFiles = ['.nin', '.nhr'];
        const missingRequired = requiredFiles.filter(ext => !fs.existsSync(dbPath + ext));
        if (missingRequired.length > 0) {
          console.log(`Skipping ${dbName}: missing required files ${missingRequired.join(', ')}`);
          return resolve([]);
        }

        const args = [
          '-query', queryFile,
          '-db', dbPath,
          '-outfmt', "6 qseqid sseqid pident length mismatch gapopen qstart qend sstart send evalue bitscore stitle sscinames qcovs",
          '-evalue', String(evalue),
          '-max_target_seqs', String(maxHits),
        ];
        if (wordSize || wordSize === 0) {
          args.push('-word_size', String(wordSize || 4));
        } else {
          args.push('-word_size', '4');
        }

        execFile(bin, args, (error, stdout, stderr) => {
          if (error) {
            console.error(`BLAST error for ${dbName}:`, stderr || error.message);
            return resolve([]);
          }
          if (!stdout || !stdout.trim()) return resolve([]);
          const lines = stdout.trim().split(/\r?\n/).filter(Boolean);
          const annotated = lines.map(line => {
            const parsed = parseOutfmt6(line);
            return parsed ? { dbName, ...parsed } : null;
          }).filter(Boolean);
          resolve(annotated);
        });
      });

      const useAllDbs = typeof db === 'string' && db.toUpperCase() === 'ALL';

      if (useAllDbs) {
        const dbNames = listBlastDbs();
        if (dbNames.length === 0) {
          fs.unlinkSync(queryFile);
          return res.status(500).json({ error: 'No BLAST databases found.' });
        }

        const resultsPerDb = await Promise.all(dbNames.map(name => {
          const dbPath = path.join(BLAST_DB_DIR, name);
          return runBlast(dbPath, name);
        }));

        const merged = resultsPerDb.flat();
        merged.sort((a, b) => {
          if (a.evalue !== b.evalue) return a.evalue - b.evalue;
          return b.bitscore - a.bitscore;
        });

        const top = merged.slice(0, Number(maxHits) || 100);
        const out = top.map(({ dbName, cols }) => buildMergedLine(dbName, cols)).join('\n');

        fs.unlinkSync(queryFile);
        return res.type('text').send(out);
      }

      // Single database mode
      const dbPath = path.join(BLAST_DB_DIR, path.basename(db || 'testdb'));

      const args = [
        '-query', queryFile,
        '-db', dbPath,
        '-outfmt', "6 qseqid sseqid pident length mismatch gapopen qstart qend sstart send evalue bitscore stitle sscinames qcovs",
        '-evalue', evalue,
        '-max_target_seqs', maxHits.toString(),
      ];
      if (wordSize || wordSize === 0) {
        args.push('-word_size', String(wordSize || 4));
      } else {
        args.push('-word_size', '4');
      }

      execFile(bin, args, (error, stdout, stderr) => {
        fs.unlinkSync(queryFile);
        if (error) {
          return res.status(500).json({ error: stderr || error.message });
        }
        if (!stdout || !stdout.trim()) {
          return res.status(500).json({ error: 'BLAST did not return any output.' });
        }
        res.type('text').send(stdout);
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/blast/blastdbs
  router.get('/blastdbs', (req, res) => {
    const dbs = listBlastDbs();
    res.json(dbs);
  });

  // GET /api/blast/scan-genomes — dynamically build JBrowse config
  router.get('/scan-genomes', (req, res) => {
    const dirs = getGenomeSearchDirs();
    if (dirs.length === 0) {
      return res.json({ assemblies: [], tracks: [], unindexedFasta: [] });
    }

    const fastaNames = new Set();
    for (const d of dirs) {
      for (const f of fs.readdirSync(d)) {
        if (f.endsWith('.fna') || f.endsWith('.fa')) fastaNames.add(f);
      }
    }

    const faiInAnyDir = (file) => dirs.some(d => fs.existsSync(path.join(d, `${file}.fai`)));
    const gffInAnyDir = (gffFile) => dirs.some(d => fs.existsSync(path.join(d, gffFile)));

    const unindexedFasta = [];
    const files = [];
    for (const file of fastaNames) {
      if (faiInAnyDir(file)) files.push(file);
      else unindexedFasta.push(file);
    }
    files.sort();
    unindexedFasta.sort();

    const assemblies = files.map(file => {
      const baseName = file.replace(/\.(fna|fa)$/, '');
      return {
        name: baseName,
        sequence: {
          type: 'ReferenceSequenceTrack',
          trackId: `${baseName}_refseq`,
          adapter: {
            type: 'IndexedFastaAdapter',
            fastaLocation: { uri: `/genomes/${file}` },
            faiLocation: { uri: `/genomes/${file}.fai` },
          },
        },
      };
    });

    const tracks = files
      .map(file => {
        const baseName = file.replace(/\.(fna|fa)$/, '');
        const gffFile = `${baseName}.gff`;
        if (gffInAnyDir(gffFile)) {
          return {
            type: 'FeatureTrack',
            trackId: `${baseName}_gff3`,
            name: 'GFF3 Annotations',
            assemblyNames: [baseName],
            adapter: {
              type: 'Gff3Adapter',
              gffLocation: { uri: `/genomes/${gffFile}` },
            },
          };
        }
        return null;
      })
      .filter(Boolean);

    res.json({ assemblies, tracks, unindexedFasta });
  });

  // GET /api/blast/data-status — check if data directory looks valid
  router.get('/data-status', (req, res) => {
    const blastDir = getBlastDbDir();
    const genomeDirs = getGenomeSearchDirs();
    let genomeCount = 0;
    if (genomeDirs.length > 0) {
      const names = new Set();
      for (const d of genomeDirs) {
        for (const f of fs.readdirSync(d)) {
          if (f.endsWith('.fna') || f.endsWith('.fa')) names.add(f);
        }
      }
      genomeCount = names.size;
    }
    res.json({
      dataDir: dataDir || null,
      hasBlastDbs: !!blastDir && fs.existsSync(blastDir),
      hasGenomes: genomeDirs.length > 0,
      blastDbCount: blastDir && fs.existsSync(blastDir)
        ? fs.readdirSync(blastDir).filter(f => f.endsWith('.nin')).length
        : 0,
      genomeCount,
    });
  });

  return router;
}

export default createBlastRouter;
