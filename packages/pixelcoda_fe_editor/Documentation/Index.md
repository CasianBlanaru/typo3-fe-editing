# Pixelcoda FE Editor Documentation

This documentation belongs to the TYPO3 extension `pixelcoda_fe_editor`.

Start here:

- [README](../README.md)
- [Frontend editing toolbar](Images/frontend-editing-toolbar.png)
- [Image edit button](Images/image-edit-button.png)
- [Contextual record canvas](Images/contextual-record-canvas.png)
- [AI writing canvas](Images/ai-writing-canvas.png)
- [Premium element actions](Images/premium-element-actions.png)
- [Drag-and-drop insertion indicator](Images/drag-drop-indicator.png)
- [Save route debug](Images/save-route-debug.png)

## Existing Frontends

The editor automatically maps common TYPO3 content wrappers including `id="c123"`, `data-content-element-uid`, and `data-table="tt_content" data-uid`. It also matches unique content records from the current page. This supports many existing classic TYPO3 frontends without Fluid changes.

Headless frontends must expose a stable record identifier. Without one, identical rendered text cannot be mapped safely to a specific database record.

Administrators can disable all frontend editing UI for selected backend users or groups:

```typoscript
tx_pixelcodafeeditor.disabled = 1
```

## Side Canvas

Image and record editing stays on the frontend page. TYPO3's contextual record editor opens in an accessible right-side canvas. Native TYPO3 save events close the canvas and reload the frontend automatically.

Normal clicks stay in the side canvas. `Ctrl`/`Cmd`-click opens the full TYPO3 editor in a new tab for advanced FormEngine workflows.

The AI canvas provides field selection state and actions for improving, shortening, or expanding content. Provider keys remain server-side.

The standard content-element wrapper convention, UserTSconfig switch and contextual editing approach align with the established concepts documented by [XIMA TYPO3 Frontend Edit](https://docs.typo3.org/p/xima/xima-typo3-frontend-edit/main/en-us/Index.html).

## Content Sorting

Content elements can be reordered directly in the frontend. Drag from the dedicated handle and drop at the visible insertion line. Arrow buttons provide the keyboard-accessible alternative. Only the affected content column is persisted through TYPO3 DataHandler.

The adjacent element-action menu provides contextual editing, hiding, and deletion with an accessible confirmation dialog.

The workflow review was informed by [xima-media/xima-typo3-frontend-edit](https://github.com/xima-media/xima-typo3-frontend-edit). Pixelcoda FE Editor remains an independent implementation and does not copy GPL source code.

## AI Configuration

Configure OpenAI, Anthropic Claude, OpenRouter, or Mistral under TYPO3 Extension Configuration for `pixelcoda_fe_editor`. Production environments should prefer environment variables.

## Accessibility

The side canvas uses dialog semantics, keyboard focus management, Escape-to-close, visible focus states, live status messages, responsive layouts, reduced motion, and automatic dark/light color schemes.

Contact:

- Email: [casianus@me.com](mailto:casianus@me.com)
- Website: [https://pixelcoda.de](https://pixelcoda.de)
