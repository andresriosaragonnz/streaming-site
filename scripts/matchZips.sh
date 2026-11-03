#!/usr/bin/env bash

set -euo pipefail

# Directory definitions
JSON_DIR="/media/work/fragments/processed"
MP4_DIR="/mnt/big_archive/performances"
DEST_DIR="/mnt/big_archive/performance_zips"

# Create destination directory if it doesn't exist
mkdir -p "$DEST_DIR"

# Counters for reporting
matched_count=0
missing_count=0

echo "Starting matching and archiving..."
echo "----------------------------------------"

# Loop through all JSON files in the source directory
for json_file in "$JSON_DIR"/*.json; do
    # Handle edge case where no JSON files exist in the directory
    [ -e "$json_file" ] || { echo "No JSON files found in $JSON_DIR"; exit 0; }

    # Extract base filename without path or extension (e.g. "song_01")
    filename=$(basename "$json_file" .json)
    
    mp4_file="$MP4_DIR/$filename.mp4"
    zip_file="$DEST_DIR/$filename.zip"

    # Check if matching MP4 exists
    if [ -f "$mp4_file" ]; then
        echo "Creating: $zip_file"
        
        # -j stores only the file name, stripping directory paths inside the zip archive
        zip -j -q "$zip_file" "$json_file" "$mp4_file"
        
        matched_count=$((matched_count + 1))
    else
        echo "WARNING: Missing MP4 for '$filename.json' (Expected: $mp4_file)"
        missing_count=$((missing_count + 1))
    fi
done

echo "----------------------------------------"
echo "Completed! Zip files created: $matched_count | Missing matches: $missing_count"