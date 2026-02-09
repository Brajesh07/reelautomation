#!/bin/bash

# WebM to MP4 Converter for Astrology Reels
# Usage: ./convert-to-mp4.sh input.webm [output.mp4]

if [ -z "$1" ]; then
  echo "Usage: $0 input.webm [output.mp4]"
  echo "Example: $0 astrology-reel-1234567890.webm output.mp4"
  exit 1
fi

INPUT="$1"
OUTPUT="${2:-output/astrology-reel.mp4}"

if [ ! -f "$INPUT" ]; then
  echo "Error: File '$INPUT' not found"
  exit 1
fi

echo "Converting WebM to MP4..."
echo "Input: $INPUT"
echo "Output: $OUTPUT"
echo ""

ffmpeg -i "$INPUT" \
  -c:v libx264 \
  -crf 18 \
  -pix_fmt yuv420p \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" \
  -movflags +faststart \
  "$OUTPUT"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Conversion complete!"
  echo "📹 Video saved: $OUTPUT"
  echo "🎉 Ready for Instagram Reels (1080×1920, 9:16 vertical)"
  
  # Show file size
  SIZE=$(du -h "$OUTPUT" | cut -f1)
  echo "📦 File size: $SIZE"
else
  echo ""
  echo "❌ Conversion failed"
  exit 1
fi
