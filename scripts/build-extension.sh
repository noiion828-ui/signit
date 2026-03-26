#!/usr/bin/env bash
# build-extension.sh — Creates a production-ready zip for Chrome Web Store upload.
# Usage: bash scripts/build-extension.sh
# Output: signit-extension.zip in project root (also reported at end of script)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BUILD_DIR="${TMPDIR:-/tmp}/signit-build"
ZIP_OUT="$PROJECT_ROOT/signit-extension.zip"

echo "[SignIt Build] Starting production build..."

# --- Clean build directory ---
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# --- Copy extension files ---
echo "[SignIt Build] Copying extension files..."

# Root-level files
cp "$PROJECT_ROOT/extension/manifest.json" "$BUILD_DIR/"

# Icons
mkdir -p "$BUILD_DIR/icons"
cp "$PROJECT_ROOT/extension/icons/"*.png "$BUILD_DIR/icons/"

# Popup (HTML, CSS, JS) — NO dev-reset.js
mkdir -p "$BUILD_DIR/popup"
cp "$PROJECT_ROOT/extension/popup/popup.html" "$BUILD_DIR/popup/"
cp "$PROJECT_ROOT/extension/popup/popup.css" "$BUILD_DIR/popup/"
cp "$PROJECT_ROOT/extension/popup/popup.js" "$BUILD_DIR/popup/"

# Shared scripts — explicitly exclude dev-reset.js
mkdir -p "$BUILD_DIR/shared"
cp "$PROJECT_ROOT/extension/shared/storage.js" "$BUILD_DIR/shared/"

# Content scripts
mkdir -p "$BUILD_DIR/content"
cp "$PROJECT_ROOT/extension/content/openpetition.js" "$BUILD_DIR/content/"

# Background service worker
mkdir -p "$BUILD_DIR/background"
cp "$PROJECT_ROOT/extension/background/service-worker.js" "$BUILD_DIR/background/"

# Locales
mkdir -p "$BUILD_DIR/_locales/de"
cp "$PROJECT_ROOT/extension/_locales/de/messages.json" "$BUILD_DIR/_locales/de/"

# --- Sanity checks ---
echo "[SignIt Build] Running sanity checks..."

# Ensure dev-reset.js is NOT in the build
if find "$BUILD_DIR" -name "dev-reset.js" | grep -q .; then
  echo "[SignIt Build] ERROR: dev-reset.js found in build directory. Aborting."
  exit 1
fi

# Ensure popup.html does NOT reference dev-reset.js
if grep -q "dev-reset" "$BUILD_DIR/popup/popup.html"; then
  echo "[SignIt Build] ERROR: popup.html still references dev-reset.js. Aborting."
  exit 1
fi

# Ensure rate limit is set to 5 (production value)
if grep -q "MAX_AUTOFILLS_PER_HOUR = 20" "$BUILD_DIR/shared/storage.js"; then
  echo "[SignIt Build] WARNING: MAX_AUTOFILLS_PER_HOUR is still 20 (beta value). Expected 5 for production."
  exit 1
fi

echo "[SignIt Build] Sanity checks passed."

# --- Create zip ---
echo "[SignIt Build] Creating zip archive..."
rm -f "$ZIP_OUT"

# Zip from inside build dir so paths are relative (Chrome Web Store requirement)
(cd "$BUILD_DIR" && zip -r "$ZIP_OUT" . -x "*.DS_Store" -x "__MACOSX/*")

# --- Report ---
ZIP_SIZE=$(du -sh "$ZIP_OUT" | cut -f1)
echo ""
echo "[SignIt Build] Done."
echo "  Zip:  $ZIP_OUT"
echo "  Size: $ZIP_SIZE"
echo ""
echo "  Contents:"
unzip -l "$ZIP_OUT" | tail -n +4 | head -n -2 | awk '{print "    " $4}'
echo ""
echo "[SignIt Build] Upload this file to the Chrome Web Store Developer Dashboard:"
echo "  https://chrome.google.com/webstore/devconsole"
