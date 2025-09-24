# PixelCoda FE Editor

A modern frontend editing extension for TYPO3 with AI integration and intuitive UI.

## Features

- **Frontend Editing**: Edit content directly in the frontend with a modern toolbar
- **AI Integration**: AI-powered content suggestions and rewriting
- **Dropzone Support**: Add new content elements with drag-and-drop
- **Modern UI**: Dark theme with responsive design
- **Security**: CSRF protection and permission-based access control
- **Demo Content Type**: Ready-to-use `pc_demo` content type for testing

## Installation

1. **Install via Composer**:
   ```bash
   composer require pixelcoda/fe-editor
   ```

2. **Activate Extension**:
   - Go to Admin Tools → Extensions
   - Activate `pixelcoda_fe_editor`

3. **Include TypoScript**:
   - Go to Web → Template
   - Include static template "PixelCoda FE Editor Demo"

## Usage

### Demo Setup

1. **Create Content Element**:
   - Go to your page in the backend
   - Add new content element
   - Select "PixelCoda Demo (editable)" from the Special category

2. **Frontend Editing**:
   - Open the frontend page as a backend user
   - The toolbar will appear in the bottom-right corner
   - Click "Edit" to enable field editing
   - Click "AI" for AI-powered suggestions
   - Click "Add Element" to create new content

### Custom Integration

To use the editor with your own content types:

1. **Add Data Attributes**:
   ```html
   <h2 data-pc-field="header" data-pc-table="tt_content" data-pc-uid="{data.uid}">
       {data.header}
   </h2>
   ```

2. **Configure Permissions**:
   - Ensure backend users have `tables_modify` permission for `tt_content`
   - Or grant admin privileges

3. **Customize Styling**:
   - Override CSS classes in your own stylesheet
   - Use `#pc-fe-editor-toolbar` for toolbar customization

## Configuration

### TypoScript Constants

```typoscript
plugin.tx_pixelcodafeeditor {
    settings {
        ajaxUrl = /typo3/ajax/fe_editor_save
        enableAi = 1
        theme = dark
    }
}
```

### AJAX Endpoints

- **Save Field**: `POST /typo3/ajax/fe_editor_save`
  - Parameters: `table`, `uid`, `field`, `value`, `csrfToken`
- **Create Element**: `POST /typo3/ajax/fe_editor_save`
  - Parameters: `data` (JSON), `csrfToken`

## Security

- **CSRF Protection**: All requests require valid CSRF tokens
- **Permission Checks**: Only authorized backend users can edit
- **Field Whitelisting**: Only allowed fields can be modified
- **Table Restrictions**: Limited to `tt_content` by default

## API Reference

### JavaScript API

```javascript
// Initialize editor
const editor = new PixelCodaFeEditor();

// Toggle edit mode
editor.toggleEditMode();

// Save field
editor.saveField(fieldElement);

// Handle AI action
editor.handleAiAction();
```

### PHP Classes

- `FrontendEditOverlay`: Middleware for injecting editor assets
- `SaveController`: Handles AJAX save requests
- `PermissionChecker`: Validates user permissions
- `TokenService`: Manages CSRF tokens
- `AiProviderInterface`: AI integration interface

## Development

### File Structure

```
Classes/
├── Middleware/
│   └── FrontendEditOverlay.php
├── Controller/
│   └── SaveController.php
└── Service/
    ├── AiProviderInterface.php
    ├── NullAiProvider.php
    ├── PermissionChecker.php
    └── TokenService.php

Resources/
├── Public/
│   ├── Css/editor.css
│   ├── JavaScript/editor.js
│   └── Icons/
└── Private/
    ├── Templates/PcDemo.html
    └── Language/locallang.xlf

Configuration/
├── Backend/
│   ├── AjaxRoutes.php
│   └── DefaultConfiguration.php
├── TCA/Overrides/tt_content.php
├── PageTS/NewContentElementWizard.ts
└── TypoScript/
```

### Adding New Content Types

1. **Create TCA Override**:
   ```php
   $GLOBALS['TCA']['tt_content']['types']['your_type'] = [
       'showitem' => '...',
   ];
   ```

2. **Add Fluid Template**:
   ```html
   <div data-pc-field="your_field" data-pc-table="tt_content" data-pc-uid="{data.uid}">
       {data.your_field}
   </div>
   ```

3. **Update Allowed Fields**:
   ```php
   const ALLOWED_FIELDS = [
       'tt_content' => ['header', 'your_field']
   ];
   ```

## Roadmap

- [ ] Move/Copy/Delete buttons in frontend
- [ ] AI provider configuration in extension settings
- [ ] Theme switching (dark/light)
- [ ] Content block registry for multiple tables
- [ ] Real-time collaboration features
- [ ] Advanced AI providers (OpenAI, local models)

## Support

- **Documentation**: [GitHub Wiki](https://github.com/pixelcoda/fe-editor/wiki)
- **Issues**: [GitHub Issues](https://github.com/pixelcoda/fe-editor/issues)
- **Email**: info@pixelcoda.com

## License

GPL-2.0-or-later

## Changelog

### 1.0.0
- Initial release
- Frontend editing with modern UI
- AI integration hooks
- Demo content type
- CSRF protection
- Permission-based access control