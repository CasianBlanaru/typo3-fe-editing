# PixelCoda FE Editor - Design System

## Color Palette

### Primary Colors
- **Primary**: `#667eea` - Main brand color for gradients and highlights
- **Secondary**: `#764ba2` - Complementary color for gradients
- **Accent**: `#0ea5e9` - Interactive elements and focus states

### Background Colors
- **Background**: `#111827` - Main dark background for toolbar
- **Surface**: `#1f2937` - Elevated surfaces and cards
- **Overlay**: `rgba(0, 0, 0, 0.3)` - Modal and overlay backgrounds

### Text Colors
- **Primary Text**: `#f9fafb` - Main text on dark backgrounds
- **Secondary Text**: `#d1d5db` - Muted text and labels
- **Interactive**: `#0ea5e9` - Links and interactive elements

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### Font Weights
- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600

## Component Design

### Toolbar
- **Position**: Fixed bottom-right
- **Background**: `#111827` with backdrop blur
- **Border Radius**: `12px`
- **Shadow**: `0 10px 25px rgba(0, 0, 0, 0.3)`
- **Padding**: `8px`
- **Gap**: `4px` between buttons

### Buttons
- **Size**: `32px × 32px`
- **Border Radius**: `8px`
- **Hover**: `rgba(255, 255, 255, 0.1)` background
- **Active**: `#0ea5e9` background
- **Icon Size**: `16px × 16px`

### Editable Fields
- **Outline**: `2px dashed #0ea5e9`
- **Offset**: `2px`
- **Focus**: `3px solid #0284c7`
- **Border Radius**: `4px`

### Notifications
- **Position**: Fixed top-right
- **Border Radius**: `8px`
- **Padding**: `12px 20px`
- **Animation**: Slide in from right
- **Colors**:
  - Success: `#10b981`
  - Error: `#ef4444`
  - Info: `#3b82f6`

## Responsive Design

### Mobile Breakpoints
- **Small**: `< 768px`
- **Medium**: `768px - 1024px`
- **Large**: `> 1024px`

### Mobile Adaptations
- Reduced toolbar size (`28px` buttons)
- Adjusted positioning (`10px` margins)
- Full-width notifications
- Touch-friendly interactions

## Animation Guidelines

### Transitions
- **Duration**: `0.2s`
- **Easing**: `ease`
- **Properties**: `all`, `transform`, `opacity`

### Hover Effects
- **Transform**: `translateY(-1px)`
- **Background**: Light overlay
- **Scale**: `1.05` for interactive elements

### Loading States
- **Skeleton**: Shimmer effect
- **Spinner**: Rotating circle
- **Progress**: Linear progress bar

## Accessibility

### Color Contrast
- **AA Compliance**: Minimum 4.5:1 ratio
- **AAA Compliance**: Minimum 7:1 ratio for important text

### Focus Management
- **Visible Focus**: Clear outline on interactive elements
- **Tab Order**: Logical navigation sequence
- **Keyboard Support**: All functions accessible via keyboard

### Screen Reader Support
- **ARIA Labels**: Descriptive labels for all interactive elements
- **Live Regions**: Announce dynamic content changes
- **Semantic HTML**: Proper heading structure and landmarks

## Icon Design

### Style
- **Type**: SVG icons
- **Style**: Outlined with 2px stroke
- **Size**: 16px, 24px, 32px variants
- **Color**: Inherit from parent (currentColor)

### Icon Set
- **Edit**: Pencil icon for content editing
- **AI**: Checkmark with sparkle for AI features
- **Add**: Plus icon for creating content
- **Close**: X icon for dismissing elements

## Implementation Notes

### CSS Custom Properties
Use CSS custom properties for consistent theming:

```css
:root {
  --pc-primary: #667eea;
  --pc-secondary: #764ba2;
  --pc-accent: #0ea5e9;
  --pc-bg: #111827;
  --pc-surface: #1f2937;
  --pc-text: #f9fafb;
  --pc-text-secondary: #d1d5db;
}
```

### Component Structure
- **BEM Methodology**: Block__Element--Modifier
- **Namespace**: `pc-` prefix for all classes
- **Modularity**: Separate files for different components

### Performance
- **Critical CSS**: Inline critical styles
- **Lazy Loading**: Non-critical styles loaded asynchronously
- **Minification**: Production builds should be minified
- **Vendor Prefixes**: Use Autoprefixer for browser compatibility