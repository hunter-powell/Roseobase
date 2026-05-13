import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, Loader2, Download, Eye, Info, AlertCircle } from 'lucide-react';
import { getApiBase } from '../utils/api';

const BlastTool = () => {
  const [sequence, setSequence] = useState('');
  const [blastProgram, setBlastProgram] = useState('blastn');
  const [databases, setDatabases] = useState({});
  const [database, setDatabase] = useState('ALL');
  const [maxHits, setMaxHits] = useState(100);
  const [eValue, setEValue] = useState('10');
  const [wordSize, setWordSize] = useState('4');
  const [megablast, setMegablast] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');

  const apiBaseRef = useRef('');

  const blastPrograms = {
    'blastn': 'Nucleotide BLAST (blastn)',
    'blastp': 'Protein BLAST (blastp)',
    'blastx': 'Translated Query-Protein DB (blastx)',
    'tblastn': 'Protein Query-Translated DB (tblastn)',
    'tblastx': 'Translated Query-Translated DB (tblastx)'
  };

  useEffect(() => {
    (async () => {
      const base = await getApiBase();
      apiBaseRef.current = base;
      const res = await fetch(`${base}/api/blast/blastdbs`);
      const dbs = await res.json();
      const dbMap = {};
      dbs.forEach(db => { dbMap[db] = db; });
      setDatabases(dbMap);
      setDatabase('ALL');
    })();
  }, []);

  const submitBlast = async () => {
    if (!sequence.trim()) {
      setError('Please enter a sequence');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);
    setStatus('Running local BLAST...');

    try {
      // Prepare request body for local API
      const body = {
        sequence,
        program: blastProgram,
        evalue: eValue || '10',
        maxHits: maxHits || 100,
        wordSize: wordSize || '4',
        db: database // send selected db or 'ALL'
      };

      const response = await fetch(`${apiBaseRef.current}/api/blast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'BLAST failed');
      }

      const resultText = await response.text();
      setResults(resultText);
      setStatus('Results retrieved successfully!');
      setIsLoading(false);
    } catch (err) {
      setError(`Error running BLAST: ${err.message}`);
      setIsLoading(false);
    }
  };

  const formatSequence = (seq) => {
    if (!seq) return '';
    return seq.match(/.{1,60}/g)?.join('\n') || seq;
  };

  const parseEValue = (evalue) => {
    if (typeof evalue === 'number') {
      return evalue.toExponential(2);
    }
    return evalue;
  };

  // Helper function to clean database names for display
  const cleanDbName = (name) => {
    return name
      .replace(/_cds_from_genomic/g, '')
      .replace(/_/g, ' ')
      .trim();
  };

  // Helper function to extract function from protein= in description
  const extractFunction = (description) => {
    if (!description) return '';
    const match = description.match(/protein=([^[\]]+)/i);
    return match ? match[1].trim() : '';
  };

  // Helper function to extract location from loc= in description
  const extractLocation = (description) => {
    if (!description) return '';
    const match = description.match(/loc=([^\s\[\]]+)/i);
    if (!match) return '';
    const locString = match[1].trim();
    // Extract just the coordinate part (e.g., "1000..2000" from "chromosome:1000..2000")
    const coordMatch = locString.match(/:(\d+\.\.\d+)/);
    if (coordMatch) {
      return coordMatch[1]; // Return just "1000..2000"
    }
    // If no colon format, try to extract numbers with dots
    const numberMatch = locString.match(/(\d+\.\.\d+)/);
    return numberMatch ? numberMatch[1] : locString;
  };

  return (
    <div className="blast-outer" style={{ marginTop: '1rem' }}>
      <div className="blast-container">
        <div className="blast-card">
          <div className="blast-header-row">
            <div className="blast-header-icon">
              <Search className="blast-header-icon-svg" />
            </div>
            <h1 className="blast-title">NCBI BLAST Search Tool</h1>
          </div>
          {/* Input Section */}
          <div className="blast-input-section">
            <div className="blast-input-col">
              <div>
                <label className="blast-label">Sequence Input</label>
                <textarea
                  value={sequence}
                  onChange={(e) => setSequence(e.target.value)}
                  placeholder="Enter your sequence here (FASTA format supported)..."
                  className="blast-textarea"
                />
              </div>
              <div>
                <label className="blast-label">BLAST Program</label>
                <select
                  value={blastProgram}
                  onChange={(e) => setBlastProgram(e.target.value)}
                  className="blast-select"
                >
                  {Object.entries(blastPrograms).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="blast-label">Database</label>
                <select
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                  className="blast-select"
                >
                  <option key="ALL" value="ALL">Use all databases</option>
                  {Object.entries(databases).map(([value, label]) => (
                    <option key={value} value={value}>{cleanDbName(label)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="blast-input-col">
              <div>
                <label className="blast-label">E-value Threshold</label>
                <input
                  type="text"
                  value={eValue}
                  onChange={(e) => setEValue(e.target.value)}
                  placeholder="10"
                  className="blast-input"
                />
              </div>
              <div>
                <label className="blast-label">Max Target Sequences</label>
                <input
                  type="number"
                  value={maxHits}
                  onChange={(e) => setMaxHits(parseInt(e.target.value) || 100)}
                  min="1"
                  max="5000"
                  className="blast-input"
                />
              </div>
              <div>
                <label className="blast-label">Word Size (optional)</label>
                <input
                  type="number"
                  value={wordSize}
                  onChange={(e) => setWordSize(e.target.value)}
                  placeholder="4 (default)"
                  className="blast-input"
                />
              </div>
              {blastProgram === 'blastn' && (
                <div className="blast-checkbox-row">
                  <input
                    type="checkbox"
                    id="megablast"
                    checked={megablast}
                    onChange={(e) => setMegablast(e.target.checked)}
                    className="blast-checkbox"
                  />
                  <label htmlFor="megablast" className="blast-label">Use Megablast</label>
                </div>
              )}
            </div>
          </div>
          {/* Submit Button */}
          <div className="blast-submit-row">
            <button
              onClick={submitBlast}
              disabled={isLoading || !sequence.trim()}
              className="blast-submit-btn"
            >
              {isLoading ? (
                <>
                  <Loader2 className="blast-loader" />
                  Running BLAST...
                </>
              ) : (
                <>
                  <Search className="blast-search-icon" />
                  Run BLAST
                </>
              )}
            </button>
          </div>
          {/* Status */}
          {status && (
            <div className="blast-status">
              <div className="blast-status-row">
                <Info className="blast-status-icon" />
                <span className="blast-status-text">{status}</span>
              </div>
            </div>
          )}
          {/* Error */}
          {error && (
            <div className="blast-error">
              <div className="blast-error-row">
                <AlertCircle className="blast-error-icon" />
                <span className="blast-error-text">{error}</span>
              </div>
            </div>
          )}
        </div>
        {/* Results Section */}
        {results && (
          <div className="blast-results">
            <h2 className="blast-results-title">BLAST Results</h2>
            {/* Table rendering for tabular BLAST output */}
            {(() => {
              const lines = results.trim().split(/\r?\n/).filter(line => line && !line.startsWith('#'));
              if (lines.length > 0) {
                const firstCols = lines[0].split('\t');
                const hasDbPrefix = firstCols.length >= 16; // db + 15 outfmt6 columns
                return (
                  <div className="blast-table-container">
                    <table className="blast-table">
                      <thead className="blast-table-head">
                        <tr>
                          <th className="blast-th">Description</th>
                          <th className="blast-th">Function</th>
                          <th className="blast-th">Query Cover</th>
                          <th className="blast-th">E value</th>
                          <th className="blast-th">Per. identity</th>
                          <th className="blast-th">Genome Loc. (Mbp)</th>
                        </tr>
                      </thead>
                      <tbody className="blast-table-body">
                        {lines.map((line, idx) => {
                          const cols = line.split('\t');
                          const offset = hasDbPrefix ? 1 : 0;
                          const dbNameCol = hasDbPrefix ? cols[0] : (database || '').replace(/_/g, ' ');
                          const description = (hasDbPrefix ? cols[12 + offset] : cols[12] || '').replace(/_/g, ' ');
                          const functionText = extractFunction(description);
                          const locationText = extractLocation(description);
                          // Get coordinates
                          const sstart = Math.min(Number(cols[8 + offset]), Number(cols[9 + offset]));
                          const send = Math.max(Number(cols[8 + offset]), Number(cols[9 + offset]));
                          const coordinates = `${sstart}..${send}`;
                          // Construct full location for JBrowse link
                          const location = locationText
                            ? `${cols[1 + offset]}:${locationText}`
                            : `${cols[1 + offset]}:${coordinates}`;
                          return (
                            <tr key={idx}>
                              <td className="blast-td">{cleanDbName(dbNameCol)}</td>
                              <td className="blast-td">{functionText}</td>
                              <td className="blast-td">{cols[14 + offset] || ''}</td>
                              <td className="blast-td">{cols[10 + offset]}</td>
                              <td className="blast-td">{cols[2 + offset]}</td>
                              <td className="blast-td">
                                <Link
                                  to={`/jbrowse?loc=${encodeURIComponent(location)}`}
                                  className="blast-link"
                                >
                                  {locationText || coordinates}
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              } else {
                return (
                  <pre className="blast-pre">
                    {results}
                  </pre>
                );
              }
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlastTool;
