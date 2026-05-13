#!/bin/bash

# Script to prepare JBrowse files from genome directories
# Creates .fai files, copies .fna and .gff files to public/genomes with genome names
# Usage: ./prepare_jbrowse_files.sh [genomes_directory]

GENOMES_DIR=${1:-"/Users/hunterpowell/Downloads/OneDrive_1_2-18-2026"}
OUTPUT_DIR="./public/genomes"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

if [ ! -d "$GENOMES_DIR" ]; then
    echo "Error: Directory $GENOMES_DIR not found"
    exit 1
fi

echo "Looking for genome folders in: $GENOMES_DIR"
echo "Output directory: $OUTPUT_DIR"
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

    # Remove spaces and replace with underscores for file names
    GENOME_NAME_CLEAN=$(echo "$GENOME_NAME" | tr ' ' '_')

    echo "Processing: $GENOME_NAME"
    echo "  Clean name: $GENOME_NAME_CLEAN"

    # Find the genomic.fna file (can be in subdirectories)
    FNA_FILE=$(find "$GENOME_FOLDER" -type f -name "*genomic.fna" 2>/dev/null | head -1)

    if [ -z "$FNA_FILE" ] || [ ! -f "$FNA_FILE" ]; then
        echo "  ✗ Skipping: genomic.fna file not found"
        SKIPPED=$((SKIPPED + 1))
        echo ""
        continue
    fi

    echo "  Found .fna: $FNA_FILE"

    # Find the .gff file (can be in subdirectories)
    GFF_FILE=$(find "$GENOME_FOLDER" -type f -name "*.gff" 2>/dev/null | head -1)

    if [ -z "$GFF_FILE" ] || [ ! -f "$GFF_FILE" ]; then
        echo "  ⚠ Warning: .gff file not found, will skip GFF copy"
        GFF_FILE=""
    else
        echo "  Found .gff: $GFF_FILE"
    fi

    # Output file paths
    OUTPUT_FNA="$OUTPUT_DIR/$GENOME_NAME_CLEAN.fna"
    OUTPUT_FAI="$OUTPUT_DIR/$GENOME_NAME_CLEAN.fna.fai"
    OUTPUT_GFF="$OUTPUT_DIR/$GENOME_NAME_CLEAN.gff"

    # Copy .fna file
    echo "  Copying .fna file..."
    cp "$FNA_FILE" "$OUTPUT_FNA"
    if [ $? -ne 0 ]; then
        echo "  ✗ Failed to copy .fna file"
        FAILED=$((FAILED + 1))
        echo ""
        continue
    fi

    # Create .fai file using samtools faidx
    echo "  Creating .fai index file..."
    if command -v samtools &> /dev/null; then
        samtools faidx "$OUTPUT_FNA"
        if [ $? -eq 0 ]; then
            echo "  ✓ Created .fai file"
        else
            echo "  ✗ Failed to create .fai file"
            FAILED=$((FAILED + 1))
            echo ""
            continue
        fi
    else
        echo "  ✗ Error: samtools not found. Please install samtools to create .fai files."
        echo "    Install with: brew install samtools (macOS) or apt-get install samtools (Linux)"
        FAILED=$((FAILED + 1))
        echo ""
        continue
    fi

    # Copy .gff file if found
    if [ -n "$GFF_FILE" ] && [ -f "$GFF_FILE" ]; then
        echo "  Copying .gff file..."
        cp "$GFF_FILE" "$OUTPUT_GFF"
        if [ $? -eq 0 ]; then
            echo "  ✓ Copied .gff file"
        else
            echo "  ⚠ Warning: Failed to copy .gff file"
        fi
    fi

    echo "  ✓ Successfully processed: $GENOME_NAME_CLEAN"
    echo "    Files created:"
    echo "      - $OUTPUT_FNA"
    echo "      - $OUTPUT_FAI"
    [ -f "$OUTPUT_GFF" ] && echo "      - $OUTPUT_GFF"
    SUCCESS=$((SUCCESS + 1))
    echo ""
done

echo "=========================================="
echo "Summary:"
echo "  Successful: $SUCCESS"
echo "  Failed: $FAILED"
echo "  Skipped: $SKIPPED"
echo "  Total processed: $((SUCCESS + FAILED + SKIPPED))"
echo "=========================================="
echo ""
echo "Output files are in: $OUTPUT_DIR"
