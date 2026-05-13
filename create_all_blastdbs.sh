#!/bin/bash

# Script to create BLAST databases for all FASTA files in a directory
# Usage: ./create_all_blastdbs.sh <fasta_directory> [blastdb_output_directory]

FASTA_DIR=${1:-"./public/genomes"}
BLASTDB_DIR=${2:-"./blastdb"}

# Create blastdb directory if it doesn't exist
mkdir -p "$BLASTDB_DIR"

echo "Looking for FASTA files in: $FASTA_DIR"
echo "Output directory: $BLASTDB_DIR"
echo ""

# Counter
SUCCESS=0
FAILED=0

# Process each FASTA file
for FASTA_FILE in "$FASTA_DIR"/*.fasta "$FASTA_DIR"/*.fa "$FASTA_DIR"/*.fna; do
    # Check if file exists (handles case where no files match)
    [ -f "$FASTA_FILE" ] || continue

    # Get base name without extension and path
    BASENAME=$(basename "$FASTA_FILE")
    DB_NAME="${BASENAME%.*}"

    # Remove any spaces and replace with underscores (BLAST doesn't like spaces)
    DB_NAME=$(echo "$DB_NAME" | tr ' ' '_')

    # Full path to database
    DB_PATH="$BLASTDB_DIR/$DB_NAME"

    echo "Processing: $BASENAME -> $DB_NAME"

    # Create nucleotide BLAST database
    makeblastdb -in "$FASTA_FILE" \
        -dbtype nucl \
        -out "$DB_PATH" \
        -parse_seqids \
        > /dev/null 2>&1

    if [ $? -eq 0 ]; then
        echo "  ✓ Successfully created: $DB_NAME"
        SUCCESS=$((SUCCESS + 1))
    else
        echo "  ✗ Failed: $DB_NAME"
        FAILED=$((FAILED + 1))
    fi
done

echo ""
echo "Summary:"
echo "  Successful: $SUCCESS"
echo "  Failed: $FAILED"
echo "  Total: $((SUCCESS + FAILED))"
