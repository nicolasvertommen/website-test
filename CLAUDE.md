# CLAUDE.md

## Project Overview

Nero — a premium landing page for a powerbank rental / charging station startup. The site is a static, single-page marketing website built to convey "what it is, how it works, and why it's useful" within seconds.

## Tech Stack

- Vanilla HTML, CSS, JavaScript (no frameworks, no build step)
- Google Fonts (Inter)
- All icons are inline SVGs

## Project Structure

```
├── index.html   — Full landing page markup
├── styles.css   — All styles (variables, layout, components, responsive)
├── script.js    — Scroll animations, counters, mobile nav, modals, FAQ, map
├── images/      — Logo, hero image, step images, venue logos
├── .claude/     — Launch config for dev server
└── CLAUDE.md    — This file
```

## Development

Open `index.html` directly in a browser or use `npx serve .` on port 3000. No build step or dependencies required.

## Design System

- **Colors**: `--green: #00e87b`, `--cyan: #00c9ff`, backgrounds white/light grey, text dark
- **Typography**: Inter, bold/heavy weights, large headings with tight letter-spacing
- **Spacing**: 120px section padding, 24px container padding
- **Radius**: `--radius-sm: 10px` through `--radius-xl: 32px`
- **Aesthetic**: Apple/Stripe-inspired, minimal, lots of whitespace, gradient accents

## Page Sections

1. Hero — headline, CTA, hero image, stats
2. How It Works — 3-step process with images
3. Product — feature cards + station visual + inline hero image on "Return Anywhere"
4. Benefits — users vs. venues split
5. Social Proof — infinite logo carousel + testimonials
6. Final CTA — dark card with glow + Find a Station / Become a Partner
7. FAQ — accordion-style frequently asked questions
8. Footer

## Interactive Features

- **Find a Station** buttons open a map modal with interactive Belgium SVG map + city sidebar + search
- **Become a Partner** buttons open a lead generation form modal (Venue Name, Contact Person, Email, Phone, Location, Venue Type)
- **Logo Carousel** — infinite horizontal scroll, pauses on hover, edge fade masks
- **FAQ Accordion** — single-open accordion with smooth height animation
- All modals close via overlay click, close button, or Escape key

## Coding Conventions

- CSS custom properties for all design tokens (defined in `:root`)
- BEM-like class naming (`.section-header`, `.step-card`, `.hero-title`)
- Scroll animations use `.fade-up` class + IntersectionObserver
- Modal triggers use `data-open-map` / `data-open-partner` attributes
- Mobile-first responsive breakpoints: 480px, 768px, 1024px
