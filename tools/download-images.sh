#!/usr/bin/env bash
# Copies every photo the site currently loads from Shopify into ./images
# and points the pages at the local copies.
# RUN THIS BEFORE CANCELLING SHOPIFY: Shopify-hosted images stop working once the store closes.
# Works on Mac, Linux, or Windows with Git Bash.
# Usage (from the site folder):  bash tools/download-images.sh
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p images
SITE="https://averaearthworx.com.au"

urls=$(grep -ohE 'https://cdn\.shopify\.com/[^"'"'"' )]+' ./*.html | sort -u)
for url in $urls; do
  file=$(basename "${url%%\?*}")
  if [ ! -s "images/$file" ]; then
    echo "Downloading $file"
    curl -fsSL "$url" -o "images/$file"
  fi
  export URL="$url" FILE="$file" SITE
  # Social-share tags and Google business data need full web addresses...
  perl -pi -e 's/(content="|"(?:image|logo)": ")\Q$ENV{URL}\E/$1$ENV{SITE}\/images\/$ENV{FILE}/g' ./*.html
  # ...everything else uses the local path.
  perl -pi -e 's/\Q$ENV{URL}\E/images\/$ENV{FILE}/g' ./*.html
done
echo "Done. All images are now in ./images"
