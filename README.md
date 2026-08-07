<div align="center">

# `>_ @laddtnov/cyberpunk-ui`

**Zero-dependency cyberpunk neon CSS kit** — design tokens, glow / glitch / scanline effects, form controls, and feedback components.

[![npm](https://img.shields.io/npm/v/@laddtnov/cyberpunk-ui?style=flat-square&color=00f2ff)](https://www.npmjs.com/package/@laddtnov/cyberpunk-ui)
[![downloads](https://img.shields.io/npm/dm/@laddtnov/cyberpunk-ui?style=flat-square&color=00f2ff)](https://www.npmjs.com/package/@laddtnov/cyberpunk-ui)
[![CI](https://img.shields.io/github/actions/workflow/status/laddtnov/cyberpunk-ui/ci.yml?style=flat-square&color=00f2ff&label=CI)](https://github.com/laddtnov/cyberpunk-ui/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-ff00ff?style=flat-square)](./LICENSE)
![size](https://img.shields.io/npm/unpacked-size/@laddtnov/cyberpunk-ui?style=flat-square&color=ff00ff&label=unpacked)
![deps](https://img.shields.io/badge/dependencies-0-9d00ff?style=flat-square)

### [**`>_ OPEN THE LIVE DEMO`**](https://laddtnov.github.io/cyberpunk-ui/demo/)

Every component on one page — themes, forms, feedback, effects.

</div>

---

No build step, no JavaScript, no runtime. Just CSS custom properties and a set
of classes, extracted from the [laddtnov.xyz](https://laddtnov.xyz) portfolio.

Buttons, cards, inputs, checkboxes, radios, alerts, toasts, badges, a spinner,
a progress bar, and containers built on native elements — an accordion, a
modal and a terminal window. All driven by a token substrate you can override
to reskin the whole kit.

Accessibility is treated as part of the design, not a footnote: a **WCAG-aware
light theme** dims the neon hues so text keeps its contrast, every contrast
ratio is enforced in CI, focus rings are consistent across every control, and
animations respect `prefers-reduced-motion`.

## Install

Pick your package manager — the kit is plain CSS with no dependencies, no
postinstall and no build step, so all four behave the same.

```bash
npm install @laddtnov/cyberpunk-ui
```
```bash
pnpm add @laddtnov/cyberpunk-ui
```
```bash
yarn add @laddtnov/cyberpunk-ui
```
```bash
bun add @laddtnov/cyberpunk-ui
```

All eight stylesheet subpaths resolve under every one of them, including Yarn
Plug'n'Play with no `node_modules` on disk. Verified against the published
package — see [docs/STATE.md](docs/STATE.md) for the version matrix.

> **Just published and your lockfile still shows the previous version?**
> That is deliberate, and not a bug in this package. **pnpm 11** and **Yarn 4**
> both refuse versions younger than 24 hours by default — a supply-chain
> cooldown (`minimumReleaseAge` / `npmMinimalAgeGate`, both 1440 minutes). They
> silently resolve to the newest release older than that, and pnpm prints
> `(x.y.z is available)` while doing it. npm, Yarn Classic and Bun install
> immediately. Ask for the version explicitly to bypass the wait — naming any
> exact version skips the gate, so use whichever one you are actually after:
>
> ```bash
> pnpm add @laddtnov/cyberpunk-ui@0.6.0
> ```

```css
/* everything */
@import "@laddtnov/cyberpunk-ui";

/* …or cherry-pick */
@import "@laddtnov/cyberpunk-ui/tokens";
@import "@laddtnov/cyberpunk-ui/effects";
@import "@laddtnov/cyberpunk-ui/components";
@import "@laddtnov/cyberpunk-ui/containers";
@import "@laddtnov/cyberpunk-ui/navigation";
@import "@laddtnov/cyberpunk-ui/table";
@import "@laddtnov/cyberpunk-ui/forms";
@import "@laddtnov/cyberpunk-ui/feedback";
```

### No build? Use the CDN

```html
<link rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/@laddtnov/cyberpunk-ui/cyberpunk-ui.css">

<button class="cy-btn cy-glow">&gt;_ ENTER</button>
```

## Documentation

Per-component reference, one page per subpath — markup, modifiers, the tokens
that restyle each component, and the accessibility contract the kit cannot
enforce for you:

**[docs/components/](docs/components/)** — [effects](docs/components/effects.md)
· [button and card](docs/components/components.md)
· [containers](docs/components/containers.md)
· [navigation](docs/components/navigation.md)
· [table](docs/components/table.md)
· [forms](docs/components/forms.md)
· [feedback](docs/components/feedback.md)

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

A form and a status message:

```html
<div class="cy-field">
  <label class="cy-label" for="callsign">Callsign</label>
  <input class="cy-input" id="callsign" aria-describedby="callsign-hint">
  <span class="cy-hint" id="callsign-hint">Visible to other operatives.</span>
</div>

<label><input class="cy-checkbox" type="checkbox" checked> Encrypt</label>

<button class="cy-btn cy-btn--danger">Purge</button>

<output class="cy-alert cy-alert--success">Upload complete.</output>
<span class="cy-badge cy-badge--warning">BETA</span>
```

## Reference

### Tokens (`tokens.css`)

| Custom property | Purpose |
|-----------------|---------|
| `--cy-neon-cyan` / `--cy-neon-pink` / `--cy-neon-purple` | accent hues |
| `--cy-neon-gold` | brass-gold accent — warm, unlit, and carries no status meaning (unlike `--cy-warning`) |
| `--cy-bg` / `--cy-surface` | background & card surfaces |
| `--cy-text` / `--cy-heading` | body & heading text |
| `--cy-cyan-rgb` / `--cy-pink-rgb` / `--cy-purple-rgb` / `--cy-gold-rgb` | raw RGB triplets for theme-aware `rgba()` glows |
| `--cy-font-display` / `--cy-font-body` / `--cy-font-mono` | type stacks (you load the fonts) |
| `--cy-font-terminal` | `.cy-terminal` only — asks for a Nerd Font (powerline separators, file icons), falls through to `--cy-font-mono` |
| `--cy-ease` | shared easing curve |
| `--cy-radius-sm` / `--cy-radius` / `--cy-radius-lg` | corner radii |
| `--cy-border-width` | shared border thickness |
| `--cy-space-xs` / `--cy-space-sm` / `--cy-space-md` / `--cy-space-lg` / `--cy-space-xl` | 4px-based spacing scale |
| `--cy-focus-width` / `--cy-focus-offset` / `--cy-focus-color` | shared `:focus-visible` ring, used by every interactive element |
| `--cy-success` / `--cy-warning` / `--cy-danger` / `--cy-info` | status colours (+ `-rgb` channels for theme-aware `rgba()`) |
| `--cy-backdrop` | modal scrim — stays dark in both themes, since a scrim's job is to push the page behind it away |
| `--cy-disabled-opacity` | opacity applied to disabled controls |

### Effects (`effects.css`)

| Class | Effect |
|-------|--------|
| `.cy-glow` · `--pink` · `--purple` · `--gold` | neon box-shadow glow |
| `.cy-text-glow` · `--pink` · `--gold` | neon text-shadow glow |
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

### Containers (`containers.css`)

| Class | Purpose |
|-------|---------|
| `.cy-accordion` · `.cy-accordion__body` | disclosure on `<details>` — styles `summary` itself, so the wrapper class is the whole contract |
| `.cy-modal` | dialog on `<dialog>`, with a blurred `::backdrop` |
| `.cy-terminal` · `.cy-terminal__bar` | code window; styles a scoped `<pre>`. Add `.cy-scanlines` and `.cy-cursor` for the CRT treatment |

All three are native elements, so the behaviour is the browser's: `<details>`
handles its own keyboard and open state, and `<dialog>` brings focus trapping,
`Esc` and the top layer.

**Open the modal with `showModal()`, not `show()`.** Only `showModal()` traps
focus, wires up `Esc`, and renders `::backdrop` at all — `show()` gives a
non-modal box with none of it, and nothing for the kit to paint.

```html
<dialog class="cy-modal" id="m">…</dialog>
<script>m.showModal()</script>
```

### Feedback (`feedback.css`)

| Class | Purpose |
|-------|---------|
| `.cy-alert` | inline message (+ `--info` `--success` `--warning` `--danger`) |
| `.cy-toast` · `.cy-toast-container` | floating message (+ `--bottom`) |
| `.cy-badge` | status pill (+ variants, `--outline`) |
| `.cy-spinner` | indeterminate loader |
| `.cy-progress` | determinate bar, on the native `<progress>` element |
| `.cy-sr-only` | visually-hidden text |
| `.cy-nav` · `.cy-nav__brand` | top navigation bar; current item via `aria-current` |
| `.cy-breadcrumb` | breadcrumb trail on an `<ol>` |
| `.cy-sidebar` · `.cy-sidebar__title` | vertical section nav on a `<ul>`; the page owns its width |
| `.cy-table` | data table (+ `--striped` `--compact`), plus `.cy-table-scroll` |

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

Progress is the native `<progress>` element — accessible by default, no ARIA
required:

```html
<progress class="cy-progress" value="66" max="100"></progress>
```

Omit `value` for an indeterminate bar; the element handles that itself. The
div-and-fill progress pair was removed in 0.5.0 — see the CHANGELOG if you
were using it.

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

## Contributing

[`docs/STATE.md`](docs/STATE.md) is the map: every token and class that
already exists, the conventions an addition has to follow, how releases work,
and the known debt. Read it before adding a component.

## License

MIT © [Vladyslav Novytskyi](https://laddtnov.xyz)
