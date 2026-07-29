<div align="center">

# `>_ @laddtnov/cyberpunk-ui`

**Zero-dependency cyberpunk neon CSS kit** — design tokens, glow / glitch / scanline effects, and holo components.

[![npm](https://img.shields.io/npm/v/@laddtnov/cyberpunk-ui?style=flat-square&color=00f2ff)](https://www.npmjs.com/package/@laddtnov/cyberpunk-ui)
[![license](https://img.shields.io/badge/license-MIT-ff00ff?style=flat-square)](./LICENSE)
![deps](https://img.shields.io/badge/dependencies-0-9d00ff?style=flat-square)

</div>

---

No build step, no JavaScript, no runtime. Just CSS custom properties and a
handful of classes, extracted from the [laddtnov.xyz](https://laddtnov.xyz)
portfolio. Ships with a **WCAG-aware light theme** — the neon hues are dimmed
on light backgrounds so text keeps its contrast.

## Install

```bash
npm install @laddtnov/cyberpunk-ui
```

```css
/* everything */
@import "@laddtnov/cyberpunk-ui";

/* …or cherry-pick */
@import "@laddtnov/cyberpunk-ui/tokens";
@import "@laddtnov/cyberpunk-ui/effects";
@import "@laddtnov/cyberpunk-ui/components";
```

### No build? Use the CDN

```html
<link rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/@laddtnov/cyberpunk-ui/cyberpunk-ui.css">

<button class="cy-btn cy-glow">&gt;_ ENTER</button>
```

## Usage

```html
<h1 class="cy-glitch">GALAXY MAP</h1>

<div class="cy-card">
  <p>Deep space observatory <span class="cy-cursor"></span></p>
  <a href="#" class="cy-btn cy-glow">Launch</a>
  <a href="#" class="cy-btn cy-btn--pink">Abort</a>
</div>

<section class="cy-grid-bg cy-scanlines"> … </section>
```

## Reference

### Tokens (`tokens.css`)

| Custom property | Purpose |
|-----------------|---------|
| `--cy-neon-cyan` / `--cy-neon-pink` / `--cy-neon-purple` | accent hues |
| `--cy-bg` / `--cy-surface` | background & card surfaces |
| `--cy-text` / `--cy-heading` | body & heading text |
| `--cy-cyan-rgb` / `--cy-pink-rgb` / `--cy-purple-rgb` | raw RGB triplets for theme-aware `rgba()` glows |
| `--cy-font-display` / `--cy-font-body` / `--cy-font-mono` | type stacks (you load the fonts) |
| `--cy-ease` | shared easing curve |

### Effects (`effects.css`)

| Class | Effect |
|-------|--------|
| `.cy-glow` · `--pink` · `--purple` | neon box-shadow glow |
| `.cy-text-glow` · `--pink` | neon text-shadow glow |
| `.cy-glitch` | RGB-split glitch on text |
| `.cy-scanlines` | CRT scanline overlay (on any container) |
| `.cy-grid-bg` | animated moving grid backdrop |
| `.cy-cursor` | blinking terminal `_` cursor |

### Components (`components.css`)

| Class | Component |
|-------|-----------|
| `.cy-btn` · `.cy-btn--pink` | neon outline button with hover-glow |
| `.cy-card` | glassmorphism holo card with edge glow |

## Theming

Everything reads from CSS custom properties, so override a token to reskin the
whole kit:

```css
:root { --cy-neon-cyan: #39ff14; } /* go acid-green */
```

Flip to the accessible light theme by setting an attribute on `<html>`:

```html
<html data-theme="light">
```

## Accessibility

- Light theme dims cyan/pink to preserve WCAG contrast.
- All animations (`glitch`, `grid`, `cursor`, hover transforms) are disabled
  under `prefers-reduced-motion: reduce`.

## License

MIT © [Vladyslav Novytskyi](https://laddtnov.xyz)
