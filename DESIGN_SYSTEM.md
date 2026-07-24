# Design System — Fondation Météo Assistance

**Version:** 1.0  
**Date:** 24 juillet 2026  
**Status:** Foundation (Phase 1)  
**Purpose:** Source of truth for all UI/UX decisions

---

## Table of Contents

1. [Brand Identity](#brand-identity)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing](#spacing)
5. [Border Radius](#border-radius)
6. [Shadows & Elevation](#shadows--elevation)
7. [Component Sizing](#component-sizing)
8. [Interactions & Animation](#interactions--animation)
9. [Light/Dark Theme](#lightdark-theme)
10. [Accessibility](#accessibility)
11. [Implementation Guide](#implementation-guide)

---

## Brand Identity

### Purpose
Fondation Météo Assistance is a mutual aid association for the Congolese diaspora. The design system must inspire:
- **Trust** → Professional, reliable
- **Transparency** → Clear, honest
- **Solidarity** → Warm, inclusive, community-focused
- **Professionalism** → Clean, organized, modern
- **Simplicity** → Easy to use, not austere

### Visual Tone
- Modern but warm (not corporate/austere)
- Community-first (not corporate)
- Accessible and inclusive
- Respectful of cultural values

---

## Color System

### Primary Palette (FMA Brand Colors)

#### Navy (#001a4d)
- **Role:** Primary brand color, deep trust
- **Usage:** Backgrounds, important containers, primary buttons
- **Contrast:** 100% white text
- **RGB:** rgb(0, 26, 77)
- **HSL:** hsl(217, 100%, 15%)
- **Accessibility:** WCAG AAA with white text

```css
--color-navy: #001a4d;
--color-navy-50: #f5f7fb;
--color-navy-100: #e0e7f7;
--color-navy-200: #c1cfef;
--color-navy-300: #8fa8d9;
--color-navy-400: #5d81c3;
--color-navy-500: #2b5aad;
--color-navy-600: #1a3a7d;
--color-navy-700: #001a4d;
--color-navy-800: #001339;
--color-navy-900: #000d25;
```

#### Gold (#FFD700)
- **Role:** Accent, highlight, warmth
- **Usage:** CTAs, highlights, accents, hover states
- **Contrast:** Navy text on gold (WCAG AAA)
- **RGB:** rgb(255, 215, 0)
- **HSL:** hsl(51, 100%, 50%)
- **Accessibility:** Use with navy (#001a4d) for text

```css
--color-gold: #FFD700;
--color-gold-50: #fffbeb;
--color-gold-100: #fef3c7;
--color-gold-200: #fce7a3;
--color-gold-300: #fdd16d;
--color-gold-400: #fcbb35;
--color-gold-500: #f99f15;
--color-gold-600: #d97706;
--color-gold-700: #b45309;
--color-gold-800: #92400e;
--color-gold-900: #78350f;
```

#### Green (#1a8a3e)
- **Role:** Success, positive, growth, hope
- **Usage:** Success states, positive indicators, environmental messaging
- **Contrast:** White text (WCAG AAA)
- **RGB:** rgb(26, 138, 62)
- **HSL:** hsl(141, 68%, 32%)

```css
--color-green: #1a8a3e;
--color-green-50: #f0fdf4;
--color-green-100: #dcfce7;
--color-green-200: #bbf7d0;
--color-green-300: #86efac;
--color-green-400: #4ade80;
--color-green-500: #22c55e;
--color-green-600: #16a34a;
--color-green-700: #1a8a3e;
--color-green-800: #166534;
--color-green-900: #145231;
```

#### Red (#e63946)
- **Role:** Alert, warning, danger
- **Usage:** Errors, destructive actions, warnings
- **Contrast:** White text (WCAG AAA)
- **RGB:** rgb(230, 57, 70)
- **HSL:** hsl(356, 72%, 56%)

```css
--color-red: #e63946;
--color-red-50: #fef2f2;
--color-red-100: #fee2e2;
--color-red-200: #fecaca;
--color-red-300: #fca5a5;
--color-red-400: #f87171;
--color-red-500: #ef4444;
--color-red-600: #dc2626;
--color-red-700: #b91c1c;
--color-red-800: #991b1b;
--color-red-900: #7f1d1d;
```

### Semantic Color Mapping

#### Light Theme
```
--color-primary:              #001a4d (Navy)
--color-primary-foreground:   #ffffff (White)
--color-primary-light:        #f5f7fb (Navy 50)

--color-secondary:            #FFD700 (Gold)
--color-secondary-foreground: #001a4d (Navy)
--color-secondary-light:      #fffbeb (Gold 50)

--color-accent:               #06B6D4 (Cyan - supporting)
--color-accent-foreground:    #ffffff (White)

--color-success:              #1a8a3e (Green)
--color-success-foreground:   #ffffff (White)
--color-success-light:        #f0fdf4 (Green 50)

--color-warning:              #f99f15 (Gold dark - caution)
--color-warning-foreground:   #ffffff (White)
--color-warning-light:        #fffbeb (Gold 50)

--color-error:                #e63946 (Red)
--color-error-foreground:     #ffffff (White)
--color-error-light:          #fef2f2 (Red 50)

--color-info:                 #06B6D4 (Cyan)
--color-info-foreground:      #ffffff (White)
--color-info-light:           #ecf9fd (Cyan 50)

--color-background:           #ffffff (White)
--color-foreground:           #1f2937 (Gray-800)

--color-muted:                #f3f4f6 (Gray-100)
--color-muted-foreground:     #6b7280 (Gray-500)

--color-border:               #e5e7eb (Gray-200)
--color-input:                #f3f4f6 (Gray-100)

--color-card:                 #ffffff (White)
--color-card-foreground:      #1f2937 (Gray-800)
```

#### Dark Theme
```
--color-primary:              #FFD700 (Gold - stands out)
--color-primary-foreground:   #001a4d (Navy)
--color-primary-light:        #fffbeb (Gold 50)

--color-secondary:            #001a4d (Navy)
--color-secondary-foreground: #ffffff (White)
--color-secondary-light:      #f5f7fb (Navy 50)

--color-accent:               #06B6D4 (Cyan)
--color-accent-foreground:    #ffffff (White)

--color-success:              #4ade80 (Green bright)
--color-success-foreground:   #001a4d (Navy)
--color-success-light:        #f0fdf4 (Green 50)

--color-warning:              #fcd34d (Gold lighter)
--color-warning-foreground:   #001a4d (Navy)
--color-warning-light:        #fffbeb (Gold 50)

--color-error:                #ff6b6b (Red bright)
--color-error-foreground:     #ffffff (White)
--color-error-light:          #fef2f2 (Red 50)

--color-info:                 #06B6D4 (Cyan)
--color-info-foreground:      #ffffff (White)
--color-info-light:           #ecf9fd (Cyan 50)

--color-background:           #0f1419 (Almost black)
--color-foreground:           #e5e7eb (Gray-100)

--color-muted:                #1f2937 (Gray-800)
--color-muted-foreground:     #9ca3af (Gray-400)

--color-border:               rgba(255, 255, 255, 0.1) (White 10%)
--color-input:                rgba(255, 255, 255, 0.12) (White 12%)

--color-card:                 #1a1f2e (Dark slate)
--color-card-foreground:      #e5e7eb (Gray-100)
```

### Interaction States

For all interactive elements:

```
Default:    Primary color
Hover:      Primary + 10% darker
Active:     Primary + 20% darker
Disabled:   Gray-300 with 50% opacity
Focus:      Ring color (primary) with 3px ring
```

---

## Typography

### Font Stack
```css
--font-sans:   "Geist Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-mono:   "Geist Mono", "Courier New", monospace;
```

### Font Weights
```
100: Thin       (not used)
300: Light      (secondary/muted text)
400: Regular    (body text, default)
500: Medium     (small headings, labels)
600: Semibold   (headings, strong emphasis)
700: Bold       (headings, button text)
900: Black      (display, logo)
```

### Type Scale

#### Light Theme
```
h1: 36px (2.25rem), 600, Navy
h2: 28px (1.75rem), 600, Navy
h3: 24px (1.5rem), 600, Navy
h4: 20px (1.25rem), 600, Navy
h5: 16px (1rem), 600, Navy
h6: 14px (0.875rem), 600, Navy

body:       16px (1rem), 400, Gray-800
label:      14px (0.875rem), 500, Gray-700
caption:    12px (0.75rem), 400, Gray-600
button:     16px (1rem), 600, varies
code:       14px (0.875rem), 400, Mono, Gray-800
```

#### Dark Theme
```
h1: 36px (2.25rem), 600, Gold
h2: 28px (1.75rem), 600, Gold
h3: 24px (1.5rem), 600, White
h4: 20px (1.25rem), 600, White
h5: 16px (1rem), 600, White
h6: 14px (0.875rem), 600, White

body:       16px (1rem), 400, Gray-100
label:      14px (0.875rem), 500, Gray-300
caption:    12px (0.75rem), 400, Gray-400
button:     16px (1rem), 600, varies
code:       14px (0.875rem), 400, Mono, Gray-300
```

### Line Height
```
tight:    1.2   (headings, labels)
normal:   1.5   (body text)
relaxed:  1.75  (description, captions)
loose:    2     (form hints)
```

### Letter Spacing
```
default:  0
tight:    -0.01em
wide:     0.05em
wider:    0.1em
```

---

## Spacing

### Base Unit: 4px

A modular spacing scale ensures consistency and alignment:

```css
--space-0:    0px
--space-1:    4px
--space-2:    8px
--space-3:    12px
--space-4:    16px
--space-5:    20px
--space-6:    24px
--space-8:    32px
--space-10:   40px
--space-12:   48px
--space-16:   64px
--space-20:   80px
--space-24:   96px
```

### Usage Guidelines

| Scale | Use Case |
|-------|----------|
| **2 (8px)** | Icon spacing, badge padding, tight components |
| **3 (12px)** | Form label spacing, small gaps |
| **4 (16px)** | Component padding (default), vertical gaps |
| **6 (24px)** | Section spacing, header gaps |
| **8 (32px)** | Major section spacing, page margins |
| **12 (48px)** | Between major sections |
| **16 (64px)** | Page top/bottom padding |

### Examples

```
Button:           px-4 py-2 (16px horizontal, 8px vertical)
Input:            px-3 py-2 (12px horizontal, 8px vertical)
Card padding:     p-6 (24px all sides)
Section margin:   gap-8 (32px between sections)
Page margin:      p-8 (32px all sides)
```

---

## Border Radius

### Scale

```css
--radius-sm:   6px   (small buttons, tight components)
--radius-md:   8px   (default, inputs, cards)
--radius-lg:   12px  (larger cards, modals)
--radius-xl:   16px  (display elements)
--radius-full: 9999px (avatars, badges, pills)
```

### Usage

```
Button:        radius-md (8px)
Input:         radius-md (8px)
Card:          radius-lg (12px)
Modal/Dialog:  radius-lg (12px)
Avatar:        radius-full (circle)
Badge:         radius-full (pill)
Tab:           radius-md (8px)
```

---

## Shadows & Elevation

### Shadow System (4-level elevation)

#### Light Theme
```css
--shadow-xs:   0 1px 2px 0 rgba(0, 26, 77, 0.05);
--shadow-sm:   0 1px 3px 0 rgba(0, 26, 77, 0.1), 
               0 1px 2px -1px rgba(0, 26, 77, 0.1);
--shadow-md:   0 4px 6px -1px rgba(0, 26, 77, 0.1),
               0 2px 4px -2px rgba(0, 26, 77, 0.1);
--shadow-lg:   0 10px 15px -3px rgba(0, 26, 77, 0.1),
               0 4px 6px -4px rgba(0, 26, 77, 0.1);
--shadow-xl:   0 20px 25px -5px rgba(0, 26, 77, 0.1),
               0 8px 10px -6px rgba(0, 26, 77, 0.1);
```

#### Dark Theme
```css
--shadow-xs:   0 1px 2px 0 rgba(0, 0, 0, 0.2);
--shadow-sm:   0 1px 3px 0 rgba(0, 0, 0, 0.3),
               0 1px 2px -1px rgba(0, 0, 0, 0.3);
--shadow-md:   0 4px 6px -1px rgba(0, 0, 0, 0.4),
               0 2px 4px -2px rgba(0, 0, 0, 0.4);
--shadow-lg:   0 10px 15px -3px rgba(0, 0, 0, 0.5),
               0 4px 6px -4px rgba(0, 0, 0, 0.5);
--shadow-xl:   0 20px 25px -5px rgba(0, 0, 0, 0.6),
               0 8px 10px -6px rgba(0, 0, 0, 0.6);
```

### Elevation Mapping

| Component | Shadow | Elevation |
|-----------|--------|-----------|
| Default card | shadow-sm | 1 |
| Hover card | shadow-md | 2 |
| Floating action | shadow-lg | 3 |
| Modal backdrop | shadow-xl | 4 |
| Dropdown/Popover | shadow-md | 2 |

---

## Component Sizing

### Buttons

```
Extra Small (xs):  h-6  gap-1   px-2   text-xs
Small (sm):        h-8  gap-1   px-2.5 text-sm
Default (md):      h-10 gap-2   px-4   text-base
Large (lg):        h-12 gap-2.5 px-6   text-base
Extra Large (xl):  h-14 gap-3   px-8   text-lg
```

**Mobile optimization:** Use lg (h-12) minimum for touch targets (48px height)

### Input Fields

```
Small (sm):    h-8  px-2.5 text-sm
Default (md):  h-10 px-3   text-base
Large (lg):    h-12 px-4   text-base
```

**Mobile optimization:** Use lg (h-12) minimum for inputs on mobile

### Icons

```
Extra Small (xs):  16px (size-4)
Small (sm):        20px (size-5)
Default (md):      24px (size-6)
Large (lg):        32px (size-8)
Extra Large (xl):  40px (size-10)
```

### Avatars

```
Extra Small (xs):  24px (size-6)
Small (sm):        32px (size-8)
Default (md):      40px (size-10)
Large (lg):        56px (size-14)
Extra Large (xl):  80px (size-20)
```

---

## Interactions & Animation

### Duration Scale

```css
--duration-fast:   150ms (micro-interactions)
--duration-base:   200ms (standard transitions)
--duration-slow:   300ms (complex animations)
--duration-slower: 500ms (page transitions)
```

### Easing Functions

```css
--ease-in-out:     cubic-bezier(0.4, 0, 0.2, 1)
--ease-in:         cubic-bezier(0.4, 0, 1, 1)
--ease-out:        cubic-bezier(0, 0, 0.2, 1)
--ease-linear:     linear
```

### Standard Transitions

```
Button hover:      background-color 150ms ease-out
Button active:     transform 150ms ease-out (scale 0.98)
Input focus:       border-color 150ms ease-out
Card hover:        box-shadow 200ms ease-out
Page transition:   opacity 300ms ease-out
Modal enter:       opacity 200ms + transform 200ms
Skeleton:          background 2s ease-in-out infinite
```

---

## Light/Dark Theme

### CSS Variables Structure

**Light Theme (Default)**
```css
:root {
  --color-background: #ffffff;
  --color-foreground: #1f2937;
  --color-primary: #001a4d;
  --color-primary-foreground: #ffffff;
  /* ... */
}
```

**Dark Theme**
```css
.dark {
  --color-background: #0f1419;
  --color-foreground: #e5e7eb;
  --color-primary: #FFD700;
  --color-primary-foreground: #001a4d;
  /* ... */
}
```

### Theme Detection
- **Default:** Light theme
- **System preference:** `prefers-color-scheme`
- **User override:** Class toggle on `<html>`
- **Storage:** LocalStorage (`theme=light|dark|system`)

---

## Accessibility

### Color Contrast Minimums

```
Text on background:      4.5:1 (WCAG AA)
Large text (24px+):      3:1 (WCAG AA)
UI components:           3:1 (WCAG AA)
Target (interactive):    WCAG AAA: 7:1 (aspirational)
```

### Navigation & Focus

```
Focus visible:           3px ring, color-primary
Focus ring offset:       2px
Keyboard navigation:     Logical tab order
Skip links:              Visible on focus
```

### Icon & Color Usage

```
Never use color alone:   Always pair with icon/text
Icon size minimum:       24px (click target)
Touch target minimum:    44x44px (48px preferred)
```

### Testing Checklist

- [ ] WCAG AA contrast check (WebAIM, Lighthouse)
- [ ] Keyboard navigation (Tab, Enter, Esc)
- [ ] Screen reader test (NVDA, JAWS, VoiceOver)
- [ ] Color blind simulation (Coblis)
- [ ] Mobile touch target testing (44x44px minimum)
- [ ] Focus indicator visibility

---

## Implementation Guide

### Step 1: Update CSS Variables

Update `globals.css` with all tokens from this design system.

```css
:root {
  /* FMA Brand Colors */
  --color-navy: #001a4d;
  --color-gold: #FFD700;
  --color-green: #1a8a3e;
  --color-red: #e63946;
  
  /* Semantic Colors (Light Theme) */
  --color-primary: #001a4d;
  --color-secondary: #FFD700;
  /* ... */
  
  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  /* ... */
  
  /* Border Radius */
  --radius-sm: 6px;
  /* ... */
  
  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 26, 77, 0.1);
  /* ... */
  
  /* Animation */
  --duration-fast: 150ms;
  /* ... */
}

.dark {
  --color-primary: #FFD700;
  /* Dark theme overrides */
}
```

### Step 2: Update Tailwind Config

Ensure `tailwind.config.ts` references design tokens:

```ts
export default {
  theme: {
    extend: {
      colors: {
        navy: 'var(--color-navy)',
        gold: 'var(--color-gold)',
        green: 'var(--color-green)',
        red: 'var(--color-red)',
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        /* ... */
      },
      spacing: {
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        /* ... */
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        /* ... */
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        /* ... */
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        base: 'var(--duration-base)',
        /* ... */
      },
    },
  },
}
```

### Step 3: Component Implementation

All components should use design tokens:

**❌ Before:**
```tsx
<button className="bg-[#6366F1] px-4 py-2 h-8 rounded-lg">Click</button>
```

**✅ After:**
```tsx
<button className="bg-primary text-primary-foreground px-4 py-2 h-10 rounded-md">
  Click
</button>
```

### Step 4: Documentation

Each component should document:
- Variants available
- Sizing options
- States (default, hover, active, disabled, focus)
- Accessibility requirements
- Usage examples

---

## Color Reference Table (Complete)

### Light Theme
| Token | Hex | Usage |
|-------|-----|-------|
| primary | #001a4d | Main brand, buttons, accents |
| secondary | #FFD700 | Highlights, CTAs |
| success | #1a8a3e | Positive states, checks |
| warning | #f99f15 | Caution, alerts |
| error | #e63946 | Errors, destructive |
| info | #06B6D4 | Information, details |
| background | #ffffff | Page background |
| foreground | #1f2937 | Body text |
| muted | #f3f4f6 | Disabled, secondary |
| border | #e5e7eb | Dividers, outlines |

### Dark Theme
| Token | Hex | Usage |
|-------|-----|-------|
| primary | #FFD700 | Main brand, buttons |
| secondary | #001a4d | Containers, accents |
| success | #4ade80 | Positive states |
| warning | #fcd34d | Caution, alerts |
| error | #ff6b6b | Errors, destructive |
| info | #06B6D4 | Information |
| background | #0f1419 | Page background |
| foreground | #e5e7eb | Body text |
| muted | #1f2937 | Disabled, secondary |
| border | rgba(255,255,255,0.1) | Dividers |

---

## Design Tokens Summary

```json
{
  "colors": {
    "navy": "#001a4d",
    "gold": "#FFD700",
    "green": "#1a8a3e",
    "red": "#e63946",
    "cyan": "#06B6D4"
  },
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "16px",
    "lg": "24px",
    "xl": "32px",
    "2xl": "48px"
  },
  "radius": {
    "sm": "6px",
    "md": "8px",
    "lg": "12px",
    "xl": "16px",
    "full": "9999px"
  },
  "shadows": {
    "sm": "0 1px 3px rgba(...)",
    "md": "0 4px 6px rgba(...)",
    "lg": "0 10px 15px rgba(...)",
    "xl": "0 20px 25px rgba(...)"
  },
  "animation": {
    "fast": "150ms",
    "base": "200ms",
    "slow": "300ms"
  }
}
```

---

## Next Steps (Phase 2)

Once this Design System is approved:

1. ✅ Update `globals.css` with all tokens
2. ✅ Update `tailwind.config.ts` with token references
3. ✅ Test light theme rendering
4. ✅ Test dark theme rendering
5. ✅ Validate WCAG AA contrast
6. ✅ Apply to existing components
7. ➡️ Move to Phase 2: Branding Implementation

---

**Design System created:** 2026-07-24  
**Ready for implementation:** YES ✅
