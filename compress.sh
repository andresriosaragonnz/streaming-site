#!/bin/bash

# Configuration
INPUT_DIR="./devAssets/images/original"
OUTPUT_DIR="./devAssets/images/compressed"

mkdir -p "$OUTPUT_DIR"

if [ ! -d "$INPUT_DIR" ]; then
    echo "❌ Error: Source directory '$INPUT_DIR' does not exist."
    exit 1
fi

echo "🚀 Starting Consolidated Image Generation Pipeline..."
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
        convert "$src_file" -gravity center -crop "$crop_geom" +repage -resize "$resize_geom" -strip -quality 80 "${base_output}.jpg" < /dev/null
    else
        # Process without crop (Desktop / Small YouTube Card)
        convert "$src_file" -resize "$resize_geom" -strip -quality 65 "${base_output}.avif" < /dev/null
        convert "$src_file" -resize "$resize_geom" -strip -quality 80 "${base_output}.jpg" < /dev/null
    fi
}

# Enable nullglob to safely handle empty matches
shopt -s nullglob
shopt -s globstar

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
    IS_LETTERBOX=$(convert "$img" -crop 9999x1+0+20 -format "%[fx:(mean<0.15 && standard_deviation<0.05)?1:0]" info: < /dev/null)

    MASTER_TMP="/tmp/master_${base_name}.jpg"

    if [ "$IS_LETTERBOX" -eq 1 ]; then
        echo "   -> 🎞️ Anamorphic letterbox detected. Applying surgical center crop..."
        convert "$img" \
                -gravity center \
                -crop 1138x640+142+80 +repage \
                -resize 1920x1080! \
                -strip -quality 92 \
                "$MASTER_TMP" < /dev/null
    else
        echo "   -> 📺 Standard 16:9 asset detected. Normalizing..."
        convert "$img" \
                -resize 1920x1080! \
                -strip -quality 92 \
                "$MASTER_TMP" < /dev/null
    fi

    # 1. Desktop Master (16:9 - 1920x1080)
    export_variants "$MASTER_TMP" "$OUTPUT_DIR/${base_name}_desktop" "1920x1080!" ""
    echo "   -> 🖥️ Exported ${base_name}_desktop (.avif, .jpg)"

    # 2. Compact Card Item (16:9 - 320x180)
    export_variants "$MASTER_TMP" "$OUTPUT_DIR/${base_name}_card" "320x180!" ""
    echo "   -> 🃏 Exported ${base_name}_card (.avif, .jpg)"

    # 3. Mobile Portrait (4:5 - 600x750)
    export_variants "$MASTER_TMP" "$OUTPUT_DIR/${base_name}_mobile" "600x750" "864x1080+0+0"
    echo "   -> 📱 Exported ${base_name}_mobile (.avif, .jpg)"

    rm -f "$MASTER_TMP"
    echo "   ✓ Successfully processed $filename"
done

echo "--------------------------------------------------------"
echo "✨ Pipeline complete! Clean asset set saved in $OUTPUT_DIR"