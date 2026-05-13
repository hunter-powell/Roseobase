#!/bin/bash

# Script to create BLAST databases from genome folders
# Each folder should contain a cds_from_genomic.fna file at a specific path
# Usage: ./create_blastdbs_from_folders.sh <genomes_directory> [relative_path_to_cds_file]

GENOMES_DIR="/Users/hunterpowell/Downloads/OneDrive_1_2-18-2026"
CDS_PATH="ncbi_dataset/data/GCF*/cds_from_genomic.fna"  # Relative path from each genome folder
BLASTDB_DIR="./blastdb"

# Create blastdb directory if it doesn't exist
mkdir -p "$BLASTDB_DIR"

if [ ! -d "$GENOMES_DIR" ]; then
    echo "Error: Directory $GENOMES_DIR not found"
    exit 1
fi

echo "Looking for genome folders in: $GENOMES_DIR"
echo "CDS file path (relative to each folder): $CDS_PATH"
echo "Output directory: $BLASTDB_DIR"
echo ""

# Counter
SUCCESS=0
FAILED=0
SKIPPED=0

# Process each folder in the genomes directory
for GENOME_FOLDER in "$GENOMES_DIR"/*; do
    # Check if it's a directory
    [ -d "$GENOME_FOLDER" ] || continue

    # Get the folder name (genome name)
    GENOME_NAME=$(basename "$GENOME_FOLDER")

    # Remove spaces and replace with underscores for database name
    DB_NAME=$(echo "$GENOME_NAME" | tr ' ' '_')

    # Handle wildcards in CDS_PATH (e.g., GCF* directories)
    # Expand the glob pattern to find the actual file
    CDS_FILE=""
    if [[ "$CDS_PATH" == *"*"* ]]; then
        # Use find to locate the file matching the pattern
        CDS_FILE=$(find "$GENOME_FOLDER" -path "*/$CDS_PATH" -type f 2>/dev/null | head -1)
    else
        # No wildcard, use direct path
        CDS_FILE="$GENOME_FOLDER/$CDS_PATH"
    fi

    # Check if CDS file exists
    if [ -z "$CDS_FILE" ] || [ ! -f "$CDS_FILE" ]; then
        echo "Skipping $GENOME_NAME: CDS file not found (searched for pattern: $CDS_PATH)"
        SKIPPED=$((SKIPPED + 1))
        continue
    fi

    # Full path to database output
    DB_PATH="$BLASTDB_DIR/$DB_NAME"

    echo "Processing: $GENOME_NAME"
    echo "  CDS file: $CDS_FILE"
    echo "  Database name: $DB_NAME"

    # Create nucleotide BLAST database
    makeblastdb -in "$CDS_FILE" \
        -dbtype nucl \
        -out "$DB_PATH" \
        -parse_seqids \
        2>&1 | grep -v "^$"  # Show errors but suppress empty lines

    if [ $? -eq 0 ]; then
        echo "  ✓ Successfully created: $DB_NAME"
        SUCCESS=$((SUCCESS + 1))
    else
        echo "  ✗ Failed: $DB_NAME"
        FAILED=$((FAILED + 1))
    fi
    echo ""
done

echo "=========================================="
echo "Summary:"
echo "  Successful: $SUCCESS"
echo "  Failed: $FAILED"
echo "  Skipped: $SKIPPED"
echo "  Total processed: $((SUCCESS + FAILED + SKIPPED))"
echo "=========================================="
