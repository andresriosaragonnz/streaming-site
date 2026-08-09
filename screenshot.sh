#!/usr/bin/env bash

# Exit if ffmpeg or ffprobe are missing
command -v ffmpeg >/dev/null 2>&1 || { echo "ffmpeg is required but not installed. Aborting." >&2; exit 1; }
command -v ffprobe >/dev/null 2>&1 || { echo "ffprobe is required but not installed. Aborting." >&2; exit 1; }

# Target directory (defaults to current directory if not provided)
TARGET_DIR="${1:-.}"

cd "$TARGET_DIR" || exit 1

# Process each MP4 file in the directory
for file in *.mp4; do
    # Handle cases where no .mp4 files exist
    [ -e "$file" ] || { echo "No .mp4 files found in $TARGET_DIR"; break; }

    filename="${file%.*}"
    echo "Processing: $file"

    # Get total duration in seconds (floating point)
    duration=$(ffprobe -v error -show_entries format=duration -of default=noprintwrappers=1:nokey=1 "$file")

    if [ -z "$duration" ]; then
        echo "  [Error] Could not retrieve duration for $file. Skipping."
        continue
    fi

    # Calculate timestamps for 10%, 30%, and 80% using BC
    t1=$(bc -l <<< "$duration * 0.10")
    t2=$(bc -l <<< "$duration * 0.30")
    t3=$(bc -l <<< "$duration * 0.80")

    # Array of target timestamps
    timestamps=("$t1" "$t2" "$t3")

    # Extract images
    idx=1
    for ts in "${timestamps[@]}"; do
        output_name="${filename}_${idx}.jpg"
        
        ffmpeg -ss "$ts" -i "$file" -frames:v 1 -q:v 2 "$output_name" -y -loglevel error
        
        echo "  -> Saved $output_name (at ${ts%.*}s)"
        ((idx++))
    done
done

echo "Done!"