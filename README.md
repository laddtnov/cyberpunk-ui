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
@import "@laddtnov/cyberpunk-ui/forms";
@import "@laddtnov/cyberpunk-ui/feedback";
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
| `--cy-radius-sm` / `--cy-radius` / `--cy-radius-lg` | corner radii |
| `--cy-border-width` | shared border thickness |
| `--cy-space-xs` / `--cy-space-sm` / `--cy-space-md` / `--cy-space-lg` / `--cy-space-xl` | 4px-based spacing scale |
| `--cy-focus-width` / `--cy-focus-offset` / `--cy-focus-color` | shared `:focus-visible` ring, used by every interactive element |
| `--cy-success` / `--cy-warning` / `--cy-danger` / `--cy-info` | status colours (+ `-rgb` channels for theme-aware `rgba()`) |
| `--cy-disabled-opacity` | opacity applied to disabled controls |

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
| `.cy-btn` · `.cy-btn--pink` · `.cy-btn--secondary` · `.cy-btn--danger` (+ `--sm`, `--lg`) | neon outline button with hover-glow |
| `.cy-card` | glassmorphism holo card with edge glow |

### Forms (`forms.css`)

| Class | Element |
|-------|---------|
| `.cy-field` | wrapper for label + control + hint/error |
| `.cy-label` | field label |
| `.cy-input` | `<input>`, `<textarea>`, `<select>` (+ `--sm`, `--lg`) |
| `.cy-checkbox` · `.cy-radio` | applied to the real input |
| `.cy-hint` · `.cy-error` | helper and error text |

```html
<div class="cy-field">
  <label class="cy-label" for="email">Email</label>
  <input class="cy-input" id="email" type="email" required
         aria-invalid="true" aria-describedby="email-error">
  <span class="cy-error" id="email-error">Enter a valid address.</span>
</div>
```

Invalid styling uses `:user-invalid`, so fields only turn red **after** the user
interacts — not on page load. Drive it manually with `aria-invalid="true"`.

### Feedback (`feedback.css`)

| Class | Purpose |
|-------|---------|
| `.cy-alert` | inline message (+ `--info` `--success` `--warning` `--danger`) |
| `.cy-toast` · `.cy-toast-container` | floating message (+ `--bottom`) |
| `.cy-badge` | status pill (+ variants, `--outline`) |
| `.cy-spinner` | indeterminate loader |
| `.cy-progress` · `.cy-progress__fill` | determinate bar — native `<progress class="cy-progress">` (recommended) or the div + `.cy-progress__fill` pair (indeterminate/custom-animated) |
| `.cy-sr-only` | visually-hidden text |

Prefer native elements over ARIA roles where one exists — the browser gets
the semantics right for free. `<output>` has an implicit `role="status"`,
so use it for the "polite" cases (info/success alerts, the spinner, toasts):

```html
<output class="cy-alert cy-alert--info">Connection established.</output>

<output class="cy-spinner">
  <span class="cy-sr-only">Loading…</span>
</output>
```

`alert` is assertive and has no native-element equivalent, so warnings and
errors still need the explicit role — CSS cannot make a red box mean "error":

```html
<div class="cy-alert cy-alert--danger" role="alert">Breach detected.</div>
```

Progress ships two forms. Prefer the native `<progress>` element — it is
accessible by default, no ARIA required:

```html
<progress class="cy-progress" value="66" max="100"></progress>
```

Fall back to the `div` + `.cy-progress__fill` pair when you need an
indeterminate state or custom animation that `<progress>` can't express:

```html
<div class="cy-progress" role="progressbar"
     aria-valuenow="66" aria-valuemin="0" aria-valuemax="100">
  <div class="cy-progress__fill" style="width:66%"></div>
</div>
```

Toasts ship as styling only — no JavaScript in this package. Show one with:

```js
const container = document.querySelector('.cy-toast-container');
const toast = document.createElement('output');
toast.className = 'cy-toast cy-toast--success';
toast.textContent = 'Package published.';
container.append(toast);
setTimeout(() => toast.remove(), 4000);
```

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
- Most animations (`glitch`, `grid`, `cursor`, hover transforms) are disabled
  under `prefers-reduced-motion: reduce`. `.cy-spinner` is the exception: it
  keeps rotating, just slower and without the decorative glow pulse, because a
  frozen spinner reads as broken and is essential feedback, not decoration.

## License

MIT © [Vladyslav Novytskyi](https://laddtnov.xyz)
