import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { JBrowseApp, createViewState } from '@jbrowse/react-app2'
import { getApiBase } from '../utils/api'

const JBrowseComp = () => {
  const [searchParams] = useSearchParams();
  const genomeParam = searchParams.get('genome');
  const locParam = searchParams.get('loc');

  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const base = await getApiBase();
        const res = await fetch(`${base}/api/blast/scan-genomes`);
        if (!res.ok) throw new Error('Failed to load genome configuration');
        const data = await res.json();

        if (base) {
          for (const asm of data.assemblies) {
            const adapter = asm.sequence?.adapter;
            if (adapter?.fastaLocation?.uri) {
              adapter.fastaLocation.uri = `${base}${adapter.fastaLocation.uri}`;
            }
            if (adapter?.faiLocation?.uri) {
              adapter.faiLocation.uri = `${base}${adapter.faiLocation.uri}`;
            }
          }
          for (const track of data.tracks) {
            const adapter = track.adapter;
            if (adapter?.gffLocation?.uri) {
              adapter.gffLocation.uri = `${base}${adapter.gffLocation.uri}`;
            }
          }
        }

        if (!cancelled) {
          setConfig(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const state = useMemo(() => {
    if (!config || config.assemblies.length === 0) return null;

    const defaultAssembly = genomeParam || config.assemblies[0].name;

    const defaultSession = {
      name: 'My session',
      view: {
        id: 'LinearGenomeView',
        type: 'LinearGenomeView',
        assemblyName: defaultAssembly,
        ...(locParam ? { locString: locParam } : {}),
        tracks: config.tracks
          .filter(track => track.assemblyNames.includes(defaultAssembly))
          .map(track => ({
            id: `${track.trackId}_track`,
            type: track.type,
            configuration: track.trackId
          }))
      }
    };

    return createViewState({
      config,
      defaultSession,
    });
  }, [config, genomeParam, locParam]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '85vh' }}>
        <p style={{ fontSize: '1.2rem', color: '#64748b' }}>Loading genome browser...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '85vh', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ fontSize: '1.2rem', color: '#dc2626' }}>Failed to load genomes</p>
        <p style={{ color: '#64748b' }}>{error}</p>
        <p style={{ color: '#64748b' }}>Please check your data directory in Settings.</p>
      </div>
    );
  }

  if (!config || config.assemblies.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '85vh', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ fontSize: '1.2rem', color: '#64748b' }}>No genomes found</p>
        <p style={{ color: '#94a3b8' }}>Please select a data directory containing genome files in Settings.</p>
      </div>
    );
  }

  return (
    <div className='jbrowse' style={{ width: '100%', height: '85vh', minHeight: 500 }}>
      <JBrowseApp viewState={state} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default JBrowseComp;
