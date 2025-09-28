# PixelCoda FE Editor

A modern frontend editor for TYPO3 with AI integration and beautiful UI.

## Features

- **Frontend Editing**: Edit content directly on the frontend with a modern toolbar
- **AI Integration**: Built-in AI suggestions and content generation
- **Modern UI**: Dark theme with smooth animations and responsive design
- **Security**: CSRF protection and permission-based access control
- **Extensible**: Plugin architecture for AI providers and custom functionality

## Installation

1. Install the extension via Composer:
   ```bash
   composer require pixelcoda/fe-editor
   ```

2. Activate the extension in the TYPO3 backend

3. Include the static TypoScript "PixelCoda FE Editor Demo"

4. Create a new content element "PixelCoda Demo (editable)"

## Usage

### Basic Setup

1. **Activate Extension**: Go to Admin Tools → Extensions and activate "PixelCoda FE Editor"

2. **Include TypoScript**: In your root page template, include the static TypoScript "PixelCoda FE Editor Demo"

3. **Create Demo Content**: Add a new content element and select "PixelCoda Demo (editable)"

4. **Frontend Editing**: As a backend user, visit the frontend page to see the editing toolbar

### Frontend Editor

The frontend editor provides three main functions:

- **Edit Button**: Toggle content editing mode for fields marked with `data-pc-field`
- **AI Button**: Apply AI suggestions to editable content
- **Add Button**: Create new content elements from the frontend

### Content Element Structure

The demo content element includes:

- **Header**: Editable title field
- **Subheader**: Editable subtitle field  
- **Body Text**: Rich text content with RTE
- **Dropzone**: Area for adding new elements

## Configuration

### Permissions

The extension respects TYPO3's permission system:

- **Admin users**: Full access to all features
- **Regular users**: Requires `tables_modify` permission for `tt_content`

### AI Providers

The extension includes a plugin architecture for AI providers:

- **NullProvider**: Demo provider that adds "[KI Vorschlag]" prefix
- **Future providers**: OpenAI, local models, etc.

### Customization

#### Adding Custom Fields

To make additional fields editable:

1. Add `data-pc-field` attribute to HTML elements
2. Include `data-pc-table` and `data-pc-uid` attributes
3. Update the whitelist in `SaveController.php`

#### Styling

The extension includes modern CSS with:

- Dark theme toolbar (`#111827`)
- Smooth animations and transitions
- Responsive design for mobile devices
- Custom notification system

## Development

### Extension Structure

```
Classes/
├── Ai/                    # AI provider interfaces
├── Configuration/         # Ajax routes and icons
├── Controller/           # Save controller
├── Middleware/          # Frontend overlay middleware
└── Service/             # Permission and token services

Resources/
├── Public/
│   ├── CSS/             # Frontend styles
│   ├── Icons/           # SVG icons
│   └── JavaScript/      # Frontend editor
└── Private/
    └── Templates/       # Fluid templates
```

### Adding AI Providers

1. Implement `AiProviderInterface`
2. Register in `AiService`
3. Configure in extension settings

### Custom Content Types

1. Add TCA configuration in `ext_tables.php`
2. Create Fluid template
3. Add TypoScript mapping
4. Register in PageTS wizard

## Roadmap

### Planned Features

- **Move/Copy/Delete**: Frontend content management
- **AI Configuration**: API key management in extension settings
- **Theme Switch**: Light/dark mode toggle
- **Content Blocks**: Registry for additional tables/fields
- **Real AI Integration**: OpenAI, Anthropic, local models

### Future Enhancements

- **Collaborative Editing**: Real-time multi-user editing
- **Version History**: Track content changes
- **Workflow Integration**: Approval processes
- **Performance Optimization**: Lazy loading and caching

## Support

For support and feature requests, please contact:

- **Email**: info@pixelcoda.com
- **Website**: https://pixelcoda.com

## License

GPL-2.0-or-later

## Changelog

### v1.0.0
- Initial release
- Frontend editing with modern UI
- AI integration framework
- Demo content type
- Security and permission system