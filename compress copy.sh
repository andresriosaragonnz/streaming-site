#!/bin/bash

# Configuration
INPUT_DIR="./src/static/screenshots"
OUTPUT_DIR="./public/screenshots"

mkdir -p "$OUTPUT_DIR"

if [ ! -d "$INPUT_DIR" ]; then
    echo "❌ Error: Source directory '$INPUT_DIR' does not exist."
    exit 1
fi

echo "🚀 Starting Responsive Multi-Format Generation Pipeline..."
echo "📂 Source directory: $INPUT_DIR"
echo "📂 Output directory: $OUTPUT_DIR"
echo "--------------------------------------------------------"

export_variants() {
    local src_file="$1"
    local base_output="$2"
    local resize_geom="$3"
    local crop_geom="$4"

    if [ -n "$crop_geom" ]; then
        # Process with crop (Mobile 4:5)
        convert "$src_file" -gravity center -crop "$crop_geom" +repage -resize "$resize_geom" -strip -quality 65 "${base_output}.avif" < /dev/null
        convert "$src_file" -gravity center -crop "$crop_geom" +repage -resize "$resize_geom" -strip -quality 75 "${base_output}.webp" < /dev/null
        convert "$src_file" -gravity center -crop "$crop_geom" +repage -resize "$resize_geom" -strip -quality 80 "${base_output}.jpg" < /dev/null
    else
        # Process without crop (Desktop / Tablet)
        convert "$src_file" -resize "$resize_geom" -strip -quality 65 "${base_output}.avif" < /dev/null
        convert "$src_file" -resize "$resize_geom" -strip -quality 75 "${base_output}.webp" < /dev/null
        convert "$src_file" -resize "$resize_geom" -strip -quality 80 "${base_output}.jpg" < /dev/null
    fi
}

# Enable nullglob to safely handle empty matches
shopt -s nullglob
shopt -s globstar

# Collect all matching files into an array
files=("$INPUT_DIR"/*.jpg "$INPUT_DIR"/*.jpeg "$INPUT_DIR"/*.png "$INPUT_DIR"/*.JPG "$INPUT_DIR"/*.PNG)

if [ ${#files[@]} -eq 0 ]; then
    echo "⚠️ No image files found in $INPUT_DIR"
    exit 0
fi

for img in "${files[@]}"; do
    [ -f "$img" ] || continue
    
    filename=$(basename "$img")
    base_name="${filename%.*}"

    echo "Processing: $filename"

    # Detect Anamorphic Letterboxing (Sample Y=20 line)
    # Redirect < /dev/null to ensure convert doesn't drain stdin
    IS_LETTERBOX=$(convert "$img" -crop 9999x1+0+20 -format "%[fx:(mean<0.15 && standard_deviation<0.05)?1:0]" info: < /dev/null)

    MASTER_TMP="/tmp/master_${base_name}.jpg"

    if [ "$IS_LETTERBOX" -eq 1 ]; then
        echo "   -> 🎞️ Anamorphic letterbox detected. Applying surgical center crop..."[cite: 2]
        convert "$img" \
                -gravity center \
                -crop 1138x640+142+80 +repage \
                -resize 1920x1080! \
                -strip -quality 92 \
                "$MASTER_TMP" < /dev/null
    else
        echo "   -> 📺 Standard 16:9 asset detected. Normalizing..."[cite: 2]
        convert "$img" \
                -resize 1920x1080! \
                -strip -quality 92 \
                "$MASTER_TMP" < /dev/null
    fi

    # VARIANT 1: Desktop Master (16:9 - 1920x1080)
    export_variants "$MASTER_TMP" "$OUTPUT_DIR/${base_name}_desktop" "1920x1080!" ""
    echo "   -> 🖥️ Exported ${base_name}_desktop (.avif, .webp, .jpg)"

    # VARIANT 2: Tablet (16:9 - 1280x720)
    export_variants "$MASTER_TMP" "$OUTPUT_DIR/${base_name}_tablet" "1280x720" ""
    echo "   -> 💻 Exported ${base_name}_tablet (.avif, .webp, .jpg)"

    # VARIANT 3: Mobile Portrait (4:5 - 800x1000)
    export_variants "$MASTER_TMP" "$OUTPUT_DIR/${base_name}_mobile" "800x1000" "864x1080+0+0"
    echo "   -> 📱 Exported ${base_name}_mobile (.avif, .webp, .jpg)"

    rm -f "$MASTER_TMP"
    echo "   ✓ Successfully processed $filename"
done

echo "--------------------------------------------------------"
echo "✨ Pipeline complete! All files processed in $OUTPUT_DIR"