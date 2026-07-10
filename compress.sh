#!/bin/bash

# Configuration
INPUT_DIR="./src/static/screenshots"
OUTPUT_DIR="./public/screenshots"
FULLSCREEN_DIR="$OUTPUT_DIR/full"
CARD_DIR="$OUTPUT_DIR/cards"

# 1. Initialize environment directories
mkdir -p "$FULLSCREEN_DIR" "$CARD_DIR"

if [ ! -d "$INPUT_DIR" ]; then
    echo "❌ Error: Source directory '$INPUT_DIR' does not exist."
    echo "Please execute this script from your project's root folder."
    exit 1
fi

echo "🚀 Starting Pixel-Sampling Guard-Rail Pipeline..."
echo "📂 Source directory: $INPUT_DIR"
echo "--------------------------------------------------------"

# 2. Process all image assets
find -L "$INPUT_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" \) | while read -r img; do
    filename=$(basename "$img")
    echo "Analyzing: $filename"

    # Step 1: Sample a 1-pixel high line across the frame width at Y=20
    # Returns 1 if the line has very low brightness (mean < 15%) and low variation (std dev < 5%)
    IS_LETTERBOX=$(convert "$img" -crop 9999x1+0+20 -format "%[fx:(mean<0.15 && standard_deviation<0.05)?1:0]" info:)

    if [ "$IS_LETTERBOX" -eq 1 ]; then
        echo "   -> 🎞️ Anamorphic detected. Zooming and cropping center to full 16:9..."
        
        # Surgical Center Crop: Extracts a 1422x800 sweet-spot from the center.
        # This completely drops the 140px black bars on top/bottom and pulls the sides in to match 16:9.
        convert "$img" \
                -gravity center \
                -crop 1422x800+0+0 +repage \
                -resize 1920x1080 \
                "$FULLSCREEN_DIR/$filename"
    else
        echo "   -> 📺 Standard 16:9 detected. Normalizing asset..."
        # If it's already full-frame, just resize natively to fit our target master layout
        convert "$img" \
                -resize 1920x1080 \
                "$FULLSCREEN_DIR/$filename"
    fi

    # Step 2: Generate the lightweight Card asset (Max 340px horizontal) from our clean master
    convert "$FULLSCREEN_DIR/$filename" -resize 340x "$CARD_DIR/$filename"
    
    echo "   -> Base assets successfully updated."
done

echo "--------------------------------------------------------"
echo "✨ Pipeline complete! Clean files populated in $OUTPUT_DIR"


mkdir -p compressed && for f in *.png; do [ -f "$f" ] && convert "$f" -strip -quality 65 "compressed/${f%.*}.jpg" && convert "$f" -resize 350x -quality 75 "compressed/${f%.*}_card.jpg"; done

for f in *.png; do [ -f "$f" ] && convert "$f" -strip -quality 65 "compressed/${f%.*}.jpg" ; done