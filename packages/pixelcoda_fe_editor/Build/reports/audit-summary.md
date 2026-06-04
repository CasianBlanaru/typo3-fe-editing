# Audit Summary

Date: 2026-06-04
Target: `https://typo3-inst.localhost/`

## Extension Check

Command:

```bash
packages/typo3_fe_editing/packages/pixelcoda_fe_editor/Build/check.sh
```

Result: passed

Covered:

- PHP syntax for all extension PHP files
- JavaScript syntax for `Resources/Public/editor.js`
- TYPO3 Ajax route registration for `ajax_fe_editor_save` and `ajax_fe_editor_ai`
- TYPO3 cache flush and asset publish
- Frontend smoke test for demo page content and images

## Lighthouse

Command:

```bash
npx --yes lighthouse https://typo3-inst.localhost/ \
  --chrome-flags="--headless --ignore-certificate-errors --no-sandbox" \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=html --output=json \
  --output-path=packages/typo3_fe_editing/packages/pixelcoda_fe_editor/Build/reports/lighthouse
```

Scores:

- Performance: 49
- Accessibility: 100
- Best Practices: 100
- SEO: 100

Core metrics:

- First Contentful Paint: 2.5 s
- Largest Contentful Paint: 5.6 s
- Total Blocking Time: 1,090 ms
- Cumulative Layout Shift: 0
- Speed Index: 5.7 s

Local throttled mobile runs varied between 49 and 85. The remaining performance score is dominated by the demo frontend's large visible content image, GSAP demo bundle and LCP timing. Frontend-editor assets are injected only for authenticated backend editors and do not affect anonymous production visitors.

Reports:

- `lighthouse.report.html`
- `lighthouse.report.json`

## Pa11y / WCAG2AA

Command:

```bash
npx --yes pa11y https://typo3-inst.localhost/ \
  --config packages/typo3_fe_editing/packages/pixelcoda_fe_editor/Build/pa11y.config.cjs \
  --reporter cli
```

Result: no issues found

Note: The GSAP animation runtime keeps readable text visible during transform animations so automated contrast checks do not evaluate transparent text.

## PHPStan

Command:

```bash
ddev exec ./vendor/bin/phpstan analyse \
  -c packages/typo3_fe_editing/packages/pixelcoda_fe_editor/Build/phpstan.neon \
  --no-progress
```

Result: level max, no errors, no baseline.

## Contextual Editor

Verified in a real browser:

- The native TYPO3 contextual record editor opens in the frontend side canvas.
- Save closes the canvas and reloads the frontend.
- Keyboard focus is trapped while the dialog is open and restored after closing.
