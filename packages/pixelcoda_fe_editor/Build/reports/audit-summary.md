# Audit Summary

Date: 2026-06-03
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
  --only-categories=accessibility,best-practices,seo \
  --output=html --output=json \
  --output-path=packages/typo3_fe_editing/packages/pixelcoda_fe_editor/Build/reports/lighthouse
```

Scores:

- Accessibility: 100
- Best Practices: 100
- SEO: 100

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
