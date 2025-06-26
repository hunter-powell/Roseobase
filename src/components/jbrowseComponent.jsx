// src/pages/JBrowse.jsx
import React, { useRef, useEffect } from 'react'
import { JBrowseApp, createViewState } from '@jbrowse/react-app2'

const JBrowseComp = () => {
  const config = {
    assemblies: [
      {
        name: 'DSS3_July2023',
        sequence: {
          type: 'ReferenceSequenceTrack',
          trackId: 'DSS3_July2023_refseq',
          adapter: {
            type: 'IndexedFastaAdapter',
            fastaLocation: { uri: '/genomes/DSS3_July2023.fa' },
            faiLocation: { uri: '/genomes/DSS3_July2023.fa.fai' },
          },
        },
      },
    ],
    tracks: [
      {
        type: 'FeatureTrack',
        trackId: 'DSS3_July2023_gff3',
        name: 'GFF3 Annotations',
        assemblyNames: ['DSS3_July2023'],
        adapter: {
          type: 'Gff3Adapter',
          gffLocation: { uri: '/genomes/DSS3_July2023.gff3' },
        },
      },
    ],
    defaultSession: {
      name: 'My session',
      view: {
        id: 'LinearGenomeView',
        type: 'LinearGenomeView',
        tracks: [
          {
            id: 'DSS3_July2023_gff3_track',
            type: 'FeatureTrack',
            configuration: 'DSS3_July2023_gff3',
          },
        ],
      },
    },
  };

  const state = createViewState({ config });

  // Programmatically show the track
  React.useEffect(() => {
    if (state.session.views && state.session.views[0]) {
      state.session.views[0].showTrack('volvox_cram');
    }
  }, [state]);

  return (
    <div className='jbrowse' style={{ width: '100%', height: '85vh', minHeight: 500 }}>
      <JBrowseApp viewState={state} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default JBrowseComp;
