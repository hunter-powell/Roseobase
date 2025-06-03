// src/pages/JBrowse.jsx
import React, { useRef, useEffect } from 'react'
import { JBrowseApp, createViewState } from '@jbrowse/react-app2'

const JBrowseComp = () => {
  const config = {
    assemblies: [
      {
        name: 'volvox',
        sequence: {
          type: 'ReferenceSequenceTrack',
          trackId: 'volvox_refseq',
          adapter: {
            type: 'TwoBitAdapter',
            twoBitLocation: {
              uri: 'https://jbrowse.org/code/JBrowse2/sample_data/volvox.2bit',
            },
          },
        },
      },
    ],
    tracks: [
      {
        type: 'AlignmentsTrack',
        trackId: 'volvox_bam',
        name: 'Volvox BAM Track',
        assemblyNames: ['volvox'],
        adapter: {
          type: 'BamAdapter',
          bamLocation: {
            uri: 'https://jbrowse.org/code/JBrowse2/sample_data/volvox-sorted.bam',
          },
          index: {
            location: {
              uri: 'https://jbrowse.org/code/JBrowse2/sample_data/volvox-sorted.bam.bai',
            },
          },
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
            id: 'volvox_bam_track',
            type: 'AlignmentsTrack',
            configuration: 'volvox_bam',
          },
        ],
      },
    },
  };

  const state = createViewState({
    config,
  });

  // Programmatically show the track
  React.useEffect(() => {
    if (state.session.views && state.session.views[0]) {
      state.session.views[0].showTrack('volvox_cram');
    }
  }, [state]);

  return (
    <div className='jbrowse'>
      <JBrowseApp viewState={state} />
    </div>
  );
};

export default JBrowseComp;
