import express from 'express';
import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const router = express.Router();
const BLAST_DB = path.join(path.resolve(), 'blastdb/testdb');
const BLAST_BIN = 'blastn';

// POST /api/blast
router.post('/', async (req, res) => {
  try {
    const { sequence, program = 'blastn', evalue = '10', maxHits = 100, wordSize = '', db = BLAST_DB } = req.body;
    if (!sequence || !sequence.trim()) {
      return res.status(400).json({ error: 'No sequence provided' });
    }

    // Write sequence to a temporary FASTA file
    const tmpDir = os.tmpdir();
    const queryFile = path.join(tmpDir, `blast_query_${Date.now()}.fasta`);
    fs.writeFileSync(queryFile, sequence);

    // Prepare BLAST command
    const args = [
      '-query', queryFile,
      '-db', db,
      '-outfmt', '15', // JSON output
      '-evalue', evalue,
      '-max_target_seqs', maxHits.toString(),
    ];
    if (wordSize) args.push('-word_size', wordSize);

    // Use the requested program (blastn, blastp, etc.)
    const bin = program;

    console.log('Received BLAST request:', { sequence, program, evalue, maxHits, wordSize, db });

    execFile(bin, args, (error, stdout, stderr) => {
      console.log('BLAST finished:', { error, stdout, stderr });
      fs.unlinkSync(queryFile);
      if (error) {
        return res.status(500).json({ error: stderr || error.message });
      }
      if (!stdout || !stdout.trim()) {
        return res.status(500).json({ error: 'BLAST did not return any output.' });
      }
      try {
        const result = JSON.parse(stdout);
        res.json(result);
      } catch (parseErr) {
        res.status(500).json({ error: 'Failed to parse BLAST output', details: parseErr.message, raw: stdout });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;