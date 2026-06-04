# Pixelcoda FE Editor for TYPO3

Accessible, premium frontend editing for TYPO3 12 LTS, TYPO3 13 LTS and TYPO3 14.

Edit TYPO3 content directly on the rendered website with inline text editing, drag-and-drop sorting, contextual FormEngine records, image editing, headless-ready markers and an optional AI writing assistant.

> Stable release: `v1.2.3` · Extension key: `pixelcoda_fe_editor` · Composer package: `pixelcoda/fe-editor`

![Pixelcoda TYPO3 frontend editing overview](packages/pixelcoda_fe_editor/Documentation/Images/editor-overview.png)

## Why Pixelcoda FE Editor?

- **Edit where content is visible:** update headlines and body text directly in the frontend.
- **TYPO3-native persistence:** all writes use DataHandler, backend permissions, CSRF protection and cache invalidation.
- **Premium content operations:** drag-and-drop sorting, keyboard move controls and per-element actions.
- **Contextual FormEngine canvas:** edit complete content records and FAL images without leaving the page.
- **Works with existing frontends:** automatically detects standard TYPO3 `c{uid}` wrappers and common content markers.
- **Headless-ready:** explicit record markers support decoupled frontends without changing the save API.
- **Accessible by design:** keyboard navigation, focus management, reduced motion, visible focus states and responsive light/dark UI.
- **Optional AI assistance:** server-side OpenAI, Anthropic Claude, OpenRouter and Mistral integration.

## Product Screenshots

| Element actions | Drag-and-drop sorting |
| --- | --- |
| ![Premium element actions](packages/pixelcoda_fe_editor/Documentation/Images/element-actions.png) | ![Content drag-and-drop](packages/pixelcoda_fe_editor/Documentation/Images/content-drag-drop.png) |

| Contextual TYPO3 editor | AI writing assistant |
| --- | --- |
| ![Contextual TYPO3 editor](packages/pixelcoda_fe_editor/Documentation/Images/contextual-editor.png) | ![AI writing assistant](packages/pixelcoda_fe_editor/Documentation/Images/ai-assistant.png) |

## Installable Extension

The installable TYPO3 extension lives in [`packages/pixelcoda_fe_editor`](packages/pixelcoda_fe_editor).

- [Complete extension README](packages/pixelcoda_fe_editor/README.md)
- [Extension documentation](packages/pixelcoda_fe_editor/Documentation/Index.md)
- [Changelog](packages/pixelcoda_fe_editor/CHANGELOG.md)
- [Audit summary](packages/pixelcoda_fe_editor/Build/reports/audit-summary.md)

## Requirements

- TYPO3 `^12.4 || ^13.4 || ^14.0`
- PHP supported by the active TYPO3 version
- Authenticated backend user with `tt_content` modify permission
- Optional AI provider API key

## Installation

Stable Composer installation after the first TYPO3 Extension Repository
publication:

```bash
composer require pixelcoda/fe-editor
vendor/bin/typo3 extension:setup
vendor/bin/typo3 cache:flush
```

The TER extension key is `pixelcoda_fe_editor`. Tagged releases are validated,
packaged and published by the `Publish extension to TER` GitHub Actions
workflow.

Repository-based development:

```bash
git clone https://github.com/CasianBlanaru/pixelcoda-typo3-fe-editing.git packages/typo3_fe_editing
composer config repositories.pixelcoda-fe-editor path packages/typo3_fe_editing/packages/pixelcoda_fe_editor
composer require pixelcoda/fe-editor:@dev
vendor/bin/typo3 extension:setup
vendor/bin/typo3 cache:flush
```

For local DDEV development:

```bash
ddev composer config repositories.pixelcoda-fe-editor path packages/typo3_fe_editing/packages/pixelcoda_fe_editor
ddev composer require pixelcoda/fe-editor:@dev
ddev exec vendor/bin/typo3 extension:setup
```

## Quality

- PHPStan level max without baseline
- TYPO3 12, 13 and 14 compatibility
- Pa11y WCAG2AA: no issues found
- Lighthouse Desktop Performance: 100
- Lighthouse Accessibility: 100
- Lighthouse Best Practices: 100
- Lighthouse SEO: 100
- Browser-tested contextual editor, action menu, dialogs and drag sorting

![Lighthouse scores: 100 Performance, Accessibility, Best Practices and SEO](packages/pixelcoda_fe_editor/Documentation/Images/lighthouse-scores.png)

The reproducible desktop audit keeps the first visible LCP element unanimated while retaining GSAP and ScrollTrigger on following content. Results: FCP `0.2 s`, LCP `0.8 s`, TBT `0 ms`, CLS `0`.

## License

See [`LICENSE`](LICENSE) and the installable package metadata. Pixelcoda FE Editor is developed and maintained by Casian Blanaru (Pixelcoda).
