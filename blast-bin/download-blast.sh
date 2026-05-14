#!/bin/bash
# Downloads NCBI BLAST+ binaries for macOS and Windows.
# Run from the project root: bash blast-bin/download-blast.sh
#
# After running, the directory structure will be:
#   blast-bin/darwin/blastn, blastp, blastx, tblastn, tblastx, makeblastdb
#   blast-bin/win32/blastn.exe, blastp.exe, ...

set -e

BLAST_VERSION="2.16.0"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Downloading BLAST+ ${BLAST_VERSION} binaries..."

# macOS (x64 — works on ARM via Rosetta)
MAC_URL="https://ftp.ncbi.nlm.nih.gov/blast/executables/blast+/${BLAST_VERSION}/ncbi-blast-${BLAST_VERSION}+-x64-macosx.tar.gz"
MAC_TMP="${SCRIPT_DIR}/mac-tmp"
echo "  -> macOS..."
mkdir -p "${SCRIPT_DIR}/darwin" "${MAC_TMP}"
curl -sL "${MAC_URL}" | tar xz -C "${MAC_TMP}" --strip-components=2 "ncbi-blast-${BLAST_VERSION}+/bin"
for bin in blastn blastp blastx tblastn tblastx makeblastdb; do
  cp "${MAC_TMP}/${bin}" "${SCRIPT_DIR}/darwin/${bin}"
  chmod +x "${SCRIPT_DIR}/darwin/${bin}"
done
rm -rf "${MAC_TMP}"

# Windows (x64)
WIN_URL="https://ftp.ncbi.nlm.nih.gov/blast/executables/blast+/${BLAST_VERSION}/ncbi-blast-${BLAST_VERSION}+-x64-win64.tar.gz"
WIN_TMP="${SCRIPT_DIR}/win-tmp"
echo "  -> Windows..."
mkdir -p "${SCRIPT_DIR}/win32" "${WIN_TMP}"
curl -sL "${WIN_URL}" | tar xz -C "${WIN_TMP}" --strip-components=2 "ncbi-blast-${BLAST_VERSION}+/bin"
for bin in blastn blastp blastx tblastn tblastx makeblastdb; do
  cp "${WIN_TMP}/${bin}.exe" "${SCRIPT_DIR}/win32/${bin}.exe"
done
rm -rf "${WIN_TMP}"

echo "Done! BLAST+ binaries are in blast-bin/darwin/ and blast-bin/win32/"
