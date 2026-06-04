#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../../.." && pwd)"
EXT_DIR="$ROOT_DIR/packages/typo3_fe_editing/packages/pixelcoda_fe_editor"

cd "$ROOT_DIR"

echo "== PHP lint =="
find "$EXT_DIR" -name '*.php' -print0 | xargs -0 -n1 php -l

echo "== JavaScript syntax =="
node --check "$EXT_DIR/Resources/Public/editor.js"

echo "== TYPO3 routes =="
ddev exec ./vendor/bin/typo3 debug:backend:routes | rg 'ajax_fe_editor_(save|ai)'

echo "== TYPO3 cache and assets =="
ddev exec ./vendor/bin/typo3 cache:flush
ddev exec ./vendor/bin/typo3 asset:publish

echo "== Frontend smoke test =="
HTML="$(curl -k -s https://typo3-inst.localhost/)"
printf '%s' "$HTML" | rg '<main class="pc-demo-page">'
printf '%s' "$HTML" | rg 'Pixelcoda Content GSAP Animation'
printf '%s' "$HTML" | rg 'Headless-ready animation settings'
printf '%s' "$HTML" | rg 'image-embed-item'

echo "All extension checks passed."
