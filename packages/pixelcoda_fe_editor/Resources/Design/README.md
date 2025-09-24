# PixelCoda FE Editor - Design System

## Overview

The PixelCoda FE Editor follows a modern, dark-first design system optimized for content editing workflows.

## Color Palette

### Primary Colors
- **Primary Blue**: `#0EA5E9` - Main action color, edit indicators
- **Secondary Orange**: `#F59E0B` - AI features, highlights
- **Background**: `#111827` - Main dark background
- **Surface**: `#1F2937` - Elevated surfaces, cards

### Text Colors
- **Primary Text**: `#F9FAFB` - Main content text
- **Secondary Text**: `#D1D5DB` - Muted text, labels
- **Border**: `#374151` - Borders, dividers

### Status Colors
- **Success**: `#10B981` - Success notifications
- **Error**: `#EF4444` - Error states, warnings
- **Warning**: `#F59E0B` - Caution states

## Typography

### Font Stack
```css
font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Font Sizes
- **XS**: 12px - Small labels, captions
- **SM**: 14px - Body text, descriptions
- **Base**: 16px - Default text size
- **LG**: 18px - Subheadings
- **XL**: 20px - Headings
- **2XL**: 24px - Large headings

### Font Weights
- **Normal**: 400 - Body text
- **Medium**: 500 - Emphasized text
- **Semibold**: 600 - Subheadings
- **Bold**: 700 - Headings

## Spacing System

### Base Unit: 4px

- **XS**: 4px - Tight spacing
- **SM**: 8px - Small gaps
- **MD**: 12px - Medium gaps
- **LG**: 16px - Standard gaps
- **XL**: 20px - Large gaps
- **2XL**: 24px - Section spacing
- **3XL**: 32px - Major spacing

## Border Radius

- **SM**: 4px - Small elements
- **MD**: 6px - Buttons, inputs
- **LG**: 8px - Cards, containers
- **XL**: 12px - Large containers
- **Full**: 50% - Circular elements

## Shadows

- **SM**: `0 1px 2px rgba(0, 0, 0, 0.05)` - Subtle elevation
- **MD**: `0 4px 6px rgba(0, 0, 0, 0.1)` - Cards, dropdowns
- **LG**: `0 10px 15px rgba(0, 0, 0, 0.1)` - Modals, toolbars
- **XL**: `0 20px 25px rgba(0, 0, 0, 0.15)` - Major overlays

## Component Guidelines

### Toolbar
- **Position**: Fixed bottom-right
- **Background**: `#111827` with `#374151` border
- **Buttons**: 32×32px with 6px border radius
- **Hover**: `#374151` background with 1px translate up
- **Active**: `#0EA5E9` background

### Editable Fields
- **Outline**: 2px dashed `#0EA5E9`
- **Background**: `rgba(14, 165, 233, 0.05)`
- **Focus**: 2px solid `#0EA5E9` with `rgba(14, 165, 233, 0.1)` background
- **Indicator**: Small edit icon in top-left corner

### Dropzone
- **Border**: 2px dashed `#6B7280`
- **Background**: `#F9FAFB`
- **Hover**: `#0EA5E9` border with `#F0F9FF` background
- **Button**: `#0EA5E9` background with white text

### Notifications
- **Success**: `#10B981` background
- **Error**: `#EF4444` background
- **Info**: `#3B82F6` background
- **Position**: Fixed top-right
- **Animation**: Slide in from right

## Responsive Design

### Mobile (< 768px)
- Toolbar: Reduced padding (8px)
- Buttons: Smaller size (28×28px)
- Notifications: Full width with 10px margins

### Desktop (≥ 768px)
- Toolbar: Standard padding (12px)
- Buttons: Full size (32×32px)
- Notifications: Fixed width (300px)

## Dark Mode Support

The design system is dark-first but includes light mode considerations:

```css
@media (prefers-color-scheme: light) {
  .pc-dropzone {
    background: #F9FAFB;
    border-color: #D1D5DB;
  }
}
```

## Accessibility

### Color Contrast
- All text meets WCAG AA standards (4.5:1 ratio)
- Interactive elements have sufficient contrast
- Focus indicators are clearly visible

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Tab order follows logical flow
- Focus indicators are prominent

### Screen Readers
- Semantic HTML structure
- ARIA labels for complex interactions
- Alt text for all icons and images

## Animation Guidelines

### Transitions
- **Duration**: 200ms for most interactions
- **Easing**: `ease` for natural feel
- **Properties**: Transform, opacity, background-color

### Keyframes
- **Slide In Up**: Toolbar appearance
- **Spin**: Loading indicators
- **Fade**: Notifications, overlays

## Implementation Notes

### CSS Custom Properties
Use CSS custom properties for consistent theming:

```css
:root {
  --pc-primary: #0EA5E9;
  --pc-background: #111827;
  --pc-text: #F9FAFB;
}
```

### Icon Guidelines
- All icons are 16×16px SVG
- Use `currentColor` for fill
- Maintain consistent stroke width (1.5px)
- Provide fallback text for screen readers

### Performance
- Use `transform` and `opacity` for animations
- Avoid animating layout properties
- Implement `will-change` for complex animations
- Use `prefers-reduced-motion` for accessibility