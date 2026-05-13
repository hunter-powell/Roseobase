#!/usr/bin/env node

// Script to generate JBrowse config from actual files in public/genomes
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const genomesDir = path.join(__dirname, 'public/genomes');
const outputFile = path.join(__dirname, 'src/components/jbrowseConfig.json');

// Get all .fna and .fa files
const files = fs.readdirSync(genomesDir).filter(f => f.endsWith('.fna') || f.endsWith('.fa'));

const assemblies = files.map(file => {
  const baseName = file.replace(/\.(fna|fa)$/, '');
  const isFa = file.endsWith('.fa');
  const ext = isFa ? '.fa' : '.fna';

  return {
    name: baseName,
    sequence: {
      type: 'ReferenceSequenceTrack',
      trackId: `${baseName}_refseq`,
      adapter: {
        type: 'IndexedFastaAdapter',
        fastaLocation: {
          uri: `/genomes/${file}`
        },
        faiLocation: {
          uri: `/genomes/${file}.fai`
        }
      }
    }
  };
});

// Create tracks for each assembly (GFF files)
const tracks = files.map(file => {
  const baseName = file.replace(/\.(fna|fa)$/, '');
  const gffFile = `${baseName}.gff`;
  const gffPath = path.join(genomesDir, gffFile);

  // Only create track if GFF file exists
  if (fs.existsSync(gffPath)) {
    return {
      type: 'FeatureTrack',
      trackId: `${baseName}_gff3`,
      name: 'GFF3 Annotations',
      assemblyNames: [baseName],
      adapter: {
        type: 'Gff3Adapter',
        gffLocation: {
          uri: `/genomes/${gffFile}`
        }
      }
    };
  }
  return null;
}).filter(Boolean);

const config = {
  assemblies,
  tracks
};

// Write config file
try {
  fs.writeFileSync(outputFile, JSON.stringify(config, null, 2));
  console.log(`✓ Generated JBrowse config with ${assemblies.length} assemblies and ${tracks.length} tracks`);
  console.log(`✓ Config written to: ${outputFile}`);
} catch (error) {
  console.error('Error writing config file:', error.message);
  console.log('\nConfig JSON (copy this to jbrowseConfig.json):');
  console.log(JSON.stringify(config, null, 2));
}
