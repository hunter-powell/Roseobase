#!/bin/bash

# Script to create BLAST databases from FASTA files
# Usage: ./create_blastdb.sh <input.fasta> <database_name>

if [ $# -lt 2 ]; then
    echo "Usage: $0 <input.fasta> <database_name>"
    echo "Example: $0 genome.fasta genome_name"
    exit 1
fi

INPUT_FASTA=$1
DB_NAME=$2
BLASTDB_DIR="./blastdb"

# Check if input file exists
if [ ! -f "$INPUT_FASTA" ]; then
    echo "Error: Input file $INPUT_FASTA not found"
    exit 1
fi

# Create blastdb directory if it doesn't exist
mkdir -p "$BLASTDB_DIR"

# Full path to database
DB_PATH="$BLASTDB_DIR/$DB_NAME"

echo "Creating BLAST database from $INPUT_FASTA..."
echo "Database name: $DB_NAME"
echo "Output path: $DB_PATH"

# Create nucleotide BLAST database
makeblastdb -in "$INPUT_FASTA" \
    -dbtype nucl \
    -out "$DB_PATH" \
    -parse_seqids

if [ $? -eq 0 ]; then
    echo "Successfully created BLAST database: $DB_NAME"
    echo "Files created:"
    ls -lh "$DB_PATH".*
else
    echo "Error: Failed to create BLAST database"
    exit 1
fi
