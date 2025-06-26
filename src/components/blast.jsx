import React, { useState, useEffect } from 'react';
import { Search, Loader2, Download, Eye, Info, AlertCircle } from 'lucide-react';

const BlastTool = () => {
  const [sequence, setSequence] = useState('');
  const [blastProgram, setBlastProgram] = useState('blastn');
  const [database, setDatabase] = useState('nt');
  const [maxHits, setMaxHits] = useState(100);
  const [eValue, setEValue] = useState('10');
  const [wordSize, setWordSize] = useState('');
  const [megablast, setMegablast] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');

  const blastPrograms = {
    'blastn': 'Nucleotide BLAST (blastn)',
    'blastp': 'Protein BLAST (blastp)',
    'blastx': 'Translated Query-Protein DB (blastx)',
    'tblastn': 'Protein Query-Translated DB (tblastn)',
    'tblastx': 'Translated Query-Translated DB (tblastx)'
  };

  const databases = {
    'nt': 'Nucleotide collection (nt)',
    'nr': 'Non-redundant protein sequences (nr)',
    'refseq_rna': 'RefSeq Transcript Database',
    'refseq_protein': 'RefSeq Protein Database',
    'swissprot': 'UniProtKB/Swiss-Prot',
    'pataa': 'Patent protein sequences',
    'pdbaa': 'PDB protein database',
    'env_nr': 'Environmental nr',
    'tsa_nr': 'Transcriptome Shotgun Assembly'
  };

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
        wordSize: wordSize || '',
        db: undefined // use default testdb for now
      };

      const response = await fetch('/api/blast', {
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

      const resultData = await response.json();
      setResults(resultData);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Search className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">NCBI BLAST Search Tool</h1>
          </div>

          {/* Input Section */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sequence Input
                </label>
                <textarea
                  value={sequence}
                  onChange={(e) => setSequence(e.target.value)}
                  placeholder="Enter your sequence here (FASTA format supported)..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BLAST Program
                </label>
                <select
                  value={blastProgram}
                  onChange={(e) => setBlastProgram(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.entries(blastPrograms).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Database
                </label>
                <select
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.entries(databases).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-value Threshold
                </label>
                <input
                  type="text"
                  value={eValue}
                  onChange={(e) => setEValue(e.target.value)}
                  placeholder="10"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Target Sequences
                </label>
                <input
                  type="number"
                  value={maxHits}
                  onChange={(e) => setMaxHits(parseInt(e.target.value) || 100)}
                  min="1"
                  max="5000"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Word Size (optional)
                </label>
                <input
                  type="number"
                  value={wordSize}
                  onChange={(e) => setWordSize(e.target.value)}
                  placeholder="Auto"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {blastProgram === 'blastn' && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="megablast"
                    checked={megablast}
                    onChange={(e) => setMegablast(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="megablast" className="text-sm font-medium text-gray-700">
                    Use Megablast
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center mb-6">
            <button
              onClick={submitBlast}
              disabled={isLoading || !sequence.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 mx-auto transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Running BLAST...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  Run BLAST
                </>
              )}
            </button>
          </div>

          {/* Status */}
          {status && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                <span className="text-blue-800">{status}</span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        {results && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">BLAST Results</h2>

            {results.BlastOutput2 && results.BlastOutput2[0] && results.BlastOutput2[0].report && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">Search Summary</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Program:</strong> {results.BlastOutput2[0].report.program}
                    </div>
                    <div>
                      <strong>Database:</strong> {results.BlastOutput2[0].report.search_target?.db || database}
                    </div>
                    <div>
                      <strong>Query Length:</strong> {results.BlastOutput2[0].report.results?.search?.query_len || 'N/A'}
                    </div>
                    <div>
                      <strong>Job ID:</strong> {jobId}
                    </div>
                  </div>
                </div>

                {/* Hits */}
                {results.BlastOutput2[0].report.results?.search?.hits && results.BlastOutput2[0].report.results.search.hits.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Significant Alignments</h3>
                    <div className="space-y-4">
                      {results.BlastOutput2[0].report.results.search.hits.slice(0, 10).map((hit, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-blue-600 hover:text-blue-800 cursor-pointer">
                                {hit.description?.[0]?.title || 'No title available'}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Accession: {hit.description?.[0]?.accession || 'N/A'}
                              </p>
                            </div>
                            <div className="text-right text-sm">
                              <div><strong>Length:</strong> {hit.len || 'N/A'}</div>
                            </div>
                          </div>

                          {hit.hsps && hit.hsps.length > 0 && (
                            <div className="grid md:grid-cols-4 gap-4 text-sm bg-white rounded p-3">
                              <div>
                                <strong>Score:</strong> {hit.hsps[0].bit_score?.toFixed(1) || 'N/A'}
                              </div>
                              <div>
                                <strong>E-value:</strong> {parseEValue(hit.hsps[0].evalue)}
                              </div>
                              <div>
                                <strong>Identity:</strong> {hit.hsps[0].identity || 'N/A'}/{hit.hsps[0].align_len || 'N/A'} ({hit.hsps[0].identity && hit.hsps[0].align_len ? ((hit.hsps[0].identity / hit.hsps[0].align_len) * 100).toFixed(1) : 'N/A'}%)
                              </div>
                              <div>
                                <strong>Gaps:</strong> {hit.hsps[0].gaps || 0}/{hit.hsps[0].align_len || 'N/A'}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {results.BlastOutput2[0].report.results.search.hits.length > 10 && (
                      <div className="text-center mt-4">
                        <p className="text-gray-600">
                          Showing top 10 results out of {results.BlastOutput2[0].report.results.search.hits.length} total hits
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <span className="text-yellow-800">No significant alignments found</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlastTool;
