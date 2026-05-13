import React, { useState, useEffect } from 'react'
import { isElectron, getApiBase, resetApiBase } from '../utils/api'
import { FolderOpen, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

const Settings = () => {
  const [dataDir, setDataDir] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStatus = async () => {
    try {
      const base = await getApiBase()
      const res = await fetch(`${base}/api/blast/data-status`)
      const data = await res.json()
      setStatus(data)
      setDataDir(data.dataDir || '')
    } catch {
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStatus() }, [])

  const handleSelectDirectory = async () => {
    if (!isElectron()) return

    const selected = await window.electronAPI.selectDataDirectory()
    if (selected) {
      setDataDir(selected)
      setLoading(true)
      resetApiBase()
      const result = await window.electronAPI.restartServer(selected)
      if (result?.error) {
        console.error('Server restart failed:', result.error)
      }
      await fetchStatus()
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ fontSize: '1.2rem', color: '#64748b' }}>Loading settings...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Settings</h1>

      <div style={{
        background: '#fff',
        borderRadius: '1rem',
        boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>
          Data Directory
        </h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          Select the folder containing your Roseobase data. It should have <code>genomes/</code> and <code>blastdb/</code> subdirectories.
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem',
          background: '#f8fafc',
          borderRadius: '0.5rem',
          border: '1px solid #e2e8f0',
          marginBottom: '1.5rem'
        }}>
          <FolderOpen size={20} style={{ color: '#64748b', flexShrink: 0 }} />
          <span style={{ color: dataDir ? '#1e293b' : '#94a3b8', flex: 1, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.9rem' }}>
            {dataDir || 'No directory selected'}
          </span>
        </div>

        {isElectron() ? (
          <button
            onClick={handleSelectDirectory}
            style={{
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: '600',
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background 0.2s'
            }}
          >
            <FolderOpen size={18} />
            {dataDir ? 'Change Directory' : 'Select Directory'}
          </button>
        ) : (
          <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>
            Directory selection is available in the desktop app. In development, data is loaded from the project&apos;s default locations.
          </p>
        )}
      </div>

      {status && (
        <div style={{
          background: '#fff',
          borderRadius: '1rem',
          boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
          padding: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b' }}>
              Data Status
            </h2>
            <button
              onClick={fetchStatus}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <StatusRow
              ok={status.hasGenomes}
              label="Genomes"
              detail={status.hasGenomes ? `${status.genomeCount} genome file(s) found` : 'No genomes/ directory found'}
            />
            <StatusRow
              ok={status.hasBlastDbs}
              label="BLAST Databases"
              detail={status.hasBlastDbs ? `${status.blastDbCount} database(s) found` : 'No blastdb/ directory found'}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function StatusRow({ ok, label, detail }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      background: ok ? '#f0fdf4' : '#fef2f2',
      borderRadius: '0.5rem',
      border: `1px solid ${ok ? '#bbf7d0' : '#fecaca'}`
    }}>
      {ok
        ? <CheckCircle size={18} style={{ color: '#16a34a' }} />
        : <AlertCircle size={18} style={{ color: '#dc2626' }} />
      }
      <div>
        <div style={{ fontWeight: '600', color: ok ? '#166534' : '#991b1b' }}>{label}</div>
        <div style={{ fontSize: '0.85rem', color: ok ? '#15803d' : '#b91c1c' }}>{detail}</div>
      </div>
    </div>
  )
}

export default Settings
