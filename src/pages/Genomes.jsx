import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getApiBase } from '../utils/api'

const Genomes = () => {
  const [genomes, setGenomes] = useState([])
  const [unindexedFasta, setUnindexedFasta] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const base = await getApiBase()
        const res = await fetch(`${base}/api/blast/scan-genomes`)
        const data = await res.json()
        setUnindexedFasta(Array.isArray(data.unindexedFasta) ? data.unindexedFasta : [])
        const list = data.assemblies.map(assembly => ({
          name: assembly.name,
          displayName: assembly.name.replace(/_/g, ' ').replace(/GCF.*genomic/g, '').trim()
        }))

        list.sort((a, b) => {
          if (a.name === 'Ruegeria_pomeroyi_DSS-3') return -1
          if (b.name === 'Ruegeria_pomeroyi_DSS-3') return 1
          return a.displayName.localeCompare(b.displayName)
        })

        setGenomes(list)
      } catch (err) {
        console.error('Failed to load genomes:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ fontSize: '1.2rem', color: '#64748b' }}>Loading genomes...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px' }}>
      <h1 style={{ marginBottom: '2rem', textAlign: 'center' }}>Available Genomes</h1>
      {unindexedFasta.length > 0 && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1rem 1.25rem',
            backgroundColor: '#fffbeb',
            border: '1px solid #fcd34d',
            borderRadius: '8px',
            color: '#92400e',
            fontSize: '0.95rem',
          }}
        >
          <strong>Missing FASTA index (.fai)</strong>
          <p style={{ margin: '0.5rem 0 0', lineHeight: 1.5 }}>
            These files are in your genomes folder but are not indexed yet, so they are hidden from JBrowse until you
            build an index (same folder as the FASTA):
          </p>
          <ul style={{ margin: '0.75rem 0 0', paddingLeft: '1.25rem' }}>
            {unindexedFasta.map((f) => (
              <li key={f}>
                <code style={{ fontSize: '0.9em' }}>{f}</code> — run{' '}
                <code style={{ fontSize: '0.9em' }}>samtools faidx {f}</code>
              </li>
            ))}
          </ul>
        </div>
      )}
      {genomes.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#64748b', marginTop: '2rem' }}>
          <p style={{ fontSize: '1.1rem' }}>No genomes found.</p>
          <p style={{ marginTop: '0.5rem' }}>Please select a data directory containing genome files in Settings.</p>
          {unindexedFasta.length > 0 && (
            <p style={{ marginTop: '0.75rem', maxWidth: '520px', marginLeft: 'auto', marginRight: 'auto' }}>
              You have FASTA files without a <code>.fai</code> index. Index them (see the notice above), then refresh
              this page.
            </p>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem'
        }}>
          {genomes.map((genome, index) => (
            <div
              key={index}
              style={{
                display: 'block',
                padding: '1rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                color: '#333',
                backgroundColor: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                overflow: 'hidden'
              }}
            >
              <div style={{ fontWeight: '500', fontSize: '1rem', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                {genome.displayName}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                {genome.name}
              </div>
            </div>
          ))}
        </div>
      )}

      <Link
        to='/jbrowse?genome=Ruegeria_pomeroyi_DSS-3'
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          padding: '1rem 2rem',
          backgroundColor: '#2563eb',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontWeight: '600',
          fontSize: '1rem',
          transition: 'all 0.2s',
          zIndex: 1000
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#1d4ed8'
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#2563eb'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        View Genomes
      </Link>
    </div>
  )
}

export default Genomes
