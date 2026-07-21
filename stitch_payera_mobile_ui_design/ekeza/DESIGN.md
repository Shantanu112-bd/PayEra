---
name: Ekeza
colors:
  surface: '#f8faf4'
  surface-dim: '#d8dbd5'
  surface-bright: '#f8faf4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4ee'
  surface-container: '#ecefe8'
  surface-container-high: '#e6e9e3'
  surface-container-highest: '#e1e3dd'
  on-surface: '#191c19'
  on-surface-variant: '#404940'
  inverse-surface: '#2e312d'
  inverse-on-surface: '#eff2eb'
  outline: '#707970'
  outline-variant: '#c0c9be'
  surface-tint: '#2b6a3e'
  primary: '#0e5229'
  on-primary: '#ffffff'
  primary-container: '#2c6b3f'
  on-primary-container: '#a6e9b2'
  inverse-primary: '#94d6a0'
  secondary: '#556158'
  on-secondary: '#ffffff'
  secondary-container: '#d9e6da'
  on-secondary-container: '#5b675e'
  tertiary: '#753141'
  on-tertiary: '#ffffff'
  tertiary-container: '#924858'
  on-tertiary-container: '#ffcdd5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#aff2ba'
  primary-fixed-dim: '#94d6a0'
  on-primary-fixed: '#00210c'
  on-primary-fixed-variant: '#0d5229'
  secondary-fixed: '#d9e6da'
  secondary-fixed-dim: '#bdcabe'
  on-secondary-fixed: '#131e17'
  on-secondary-fixed-variant: '#3e4a41'
  tertiary-fixed: '#ffd9de'
  tertiary-fixed-dim: '#ffb2bf'
  on-tertiary-fixed: '#3c0416'
  on-tertiary-fixed-variant: '#743040'
  background: '#f8faf4'
  on-background: '#191c19'
  surface-variant: '#e1e3dd'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-padding: 20px
  stack-gap: 12px
---

## Brand & Style
The design system is centered on trust, clarity, and the seamless bridge between digital assets and physical spending. It targets modern, tech-savvy users who value efficiency and security.

The style is a **Refined Minimalism** in Light Mode, characterized by expansive white space, a high-contrast palette, and a focus on essential information. By utilizing generous negative space, the interface reduces cognitive load during complex financial transactions. The aesthetic avoids unnecessary decoration, opting for structural elegance and high-quality typography to convey a premium, institutional yet accessible feel.

## Colors
The palette is dominated by a "Pure White" canvas to maximize the minimalist effect. 

- **Primary Emerald Green:** Used for major action containers, primary buttons, and brand-heavy cards. It represents growth and financial stability.
- **Secondary Mint:** Employed for subtle highlights, background tags, and success states to provide a soft contrast against the primary green.
- **Charcoal & Gray:** These form the typographic hierarchy, ensuring high legibility and professional depth without the harshness of pure black.

## Typography
This design system utilizes **Hanken Grotesk** for its sharp, contemporary geometry and professional clarity. 

- **Headlines:** Set in Dark Charcoal with tight letter-spacing to command attention. 
- **Body Text:** Set in Medium Gray for long-form content to reduce visual weight, while using Dark Charcoal for critical transactional data.
- **Data Display:** Numerical values (crypto balances) should use slightly increased tracking to ensure every digit is distinct and readable at a glance.

## Layout & Spacing
The layout follows a fluid-first approach optimized for mobile devices, using a 4-column grid for handheld screens and an 8-column grid for tablets. 

- **Margins:** A standard 20px horizontal margin is maintained on mobile to provide breathing room.
- **Vertical Rhythm:** Elements are spaced using multiples of 4px. Use 24px (lg) spacing between major sections and 12px (stack-gap) between related items within a card.
- **Negative Space:** Prioritize vertical stacking with generous padding inside cards (minimum 24px) to emphasize the minimalist narrative.

## Elevation & Depth
Elevation is used sparingly to maintain the minimalist aesthetic. This design system avoids heavy shadows, opting for subtle depth only on floating elements.

- **Floating Elements:** Modals, floating action buttons, and active selection cards use a soft drop shadow: `Y: 4, Blur: 12, Color: #1A1A1A, Opacity: 5%`.
- **Static Cards:** Rely on light borders (`1px solid #F0F0F0`) or slight tonal shifts rather than shadows to define their boundaries.
- **Interactive States:** When pressed, elements should visually "sink" by removing the shadow and slightly darkening the background color.

## Shapes
The shape language is diverse yet intentional, creating a clear distinction between containers, actions, and data entry.

- **Major Cards:** Large 24px radius creates a friendly, approachable container for financial summaries.
- **Buttons:** Fully rounded "pill" shapes distinguish actions from static content, reinforcing the modern mobile-first identity.
- **Inputs:** A more structured 12px radius provides a balance of softness and functional precision.

## Components
- **Buttons:** Primary buttons are pill-shaped with Deep Emerald Green backgrounds and white text. Secondary buttons use the Light Mint Green background with Emerald Green text.
- **Cards:** Content is housed in 24px rounded containers. Use Pure White for background cards with a 1px border, or Deep Emerald Green for high-priority dashboard cards.
- **Input Fields:** Use a 12px radius with a light gray border. Labels should be small and positioned above the field in Medium Gray. Focus state transitions the border to Primary Emerald Green.
- **Chips/Tags:** Used for transaction statuses. Use Light Mint Green backgrounds with Emerald Green text for "Completed" and a soft red tint for "Failed."
- **Lists:** Clean, borderless rows with 16px vertical padding. Use thin separators (`#F0F0F0`) only when lists exceed 5 items.
- **Progress Indicators:** Use thin, 4px height bars with rounded ends. The track is Light Mint and the filler is Deep Emerald Green.