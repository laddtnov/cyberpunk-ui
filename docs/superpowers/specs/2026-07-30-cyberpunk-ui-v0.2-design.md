# @laddtnov/cyberpunk-ui v0.2 — design

**Status:** approved 2026-07-30
**Version:** 0.1.1 → 0.2.0 (minor; additive only, no breaking changes)

## Goal

Grow the kit from *effects plus two components* into something you can build a
real page with, while keeping its defining promise: **zero dependencies, zero
JavaScript, no build step**.

Scope was chosen over three alternatives (all four component bundles at once, a
trimmed version of all four, or a two-release split). The split won: this release
covers the token substrate, Forms and Feedback; v0.3 covers Containers and
Navigation/data. Forms and Feedback carry the accessibility work and are what
people reach for first; getting the substrate right makes the second batch
largely mechanical.

## Constraints

- **No JavaScript ships in the package.** Interactive behaviour comes from native
  elements (`<dialog>`, `<details>`) or is left to the consumer, documented with
  copy-paste snippets.
- **No build step.** The `.css` files are the dist.
- **Additive only.** No existing token or class changes meaning, so nothing
  breaks for existing consumers — notably laddtnov-hub, which aliases
  `--cy-neon-*` into its own palette.

## Architecture

```
tokens.css        extended — substrate below
effects.css       unchanged
components.css    modified — adds .cy-btn--secondary / --danger / --sm / --lg
forms.css         new  (~2KB)
feedback.css      new  (~2.5KB)
cyberpunk-ui.css  barrel — imports all five
```

New subpath exports so consumers can cherry-pick:

```json
"./forms":    "./forms.css",
"./feedback": "./feedback.css"
```

Files stay small and single-purpose: someone wanting only form styling pulls
~2KB rather than the whole kit.

## Token substrate (tokens.css)

Every token is consumed by something in this release. Nothing speculative.

```css
:root {
  /* Geometry */
  --cy-radius-sm: 2px;
  --cy-radius:    4px;
  --cy-radius-lg: 8px;
  --cy-border-width: 1px;

  /* Spacing — 4px-based scale */
  --cy-space-xs: 0.25rem;
  --cy-space-sm: 0.5rem;
  --cy-space-md: 0.75rem;
  --cy-space-lg: 1rem;
  --cy-space-xl: 1.5rem;

  /* Focus — shared by every interactive element */
  --cy-focus-width:  2px;
  --cy-focus-offset: 2px;
  --cy-focus-color:  var(--cy-neon-cyan);

  /* Status — alerts, toasts, badges, :user-invalid, .cy-btn--danger */
  --cy-success: #52ff9a;
  --cy-warning: #ffc857;
  --cy-danger:  #ff4d4d;
  --cy-info:    var(--cy-neon-cyan);

  --cy-success-rgb: 82, 255, 154;
  --cy-warning-rgb: 255, 200, 87;
  --cy-danger-rgb:  255, 77, 77;

  --cy-disabled-opacity: 0.45;
}

:root[data-theme="light"] {
  --cy-success: #0a7d43;
  --cy-warning: #8a5a00;
  --cy-danger:  #c2110f;

  --cy-success-rgb: 10, 125, 67;
  --cy-warning-rgb: 138, 90, 0;
  --cy-danger-rgb:  194, 17, 15;
}
```

`--cy-success` is Voidarium's `--terminal-green`, reusing an established colour
from the wider brand rather than inventing one.

The `-rgb` channel triplets exist so components can build translucent tints —
`rgba(var(--cy-danger-rgb), 0.08)` — that track the active theme.

There is deliberately **no `--cy-info-rgb`**: `--cy-info` aliases
`--cy-neon-cyan`, whose channels are already published as `--cy-cyan-rgb`. The
info variants of alert, toast and badge use `rgba(var(--cy-cyan-rgb), …)`.
Adding a duplicate token would create two sources of truth for one colour.

Light-theme overrides exist because the neon hues fail WCAG contrast on light
backgrounds, consistent with the treatment `--cy-neon-cyan` already receives.

### Sizing decision

Sizes are **component modifiers** (`.cy-btn--sm`, `.cy-input--lg`), not global
`--cy-size-*` tokens. Global size tokens tend to be under-used and awkward to
apply consistently; modifiers are what consumers reach for.

## Forms (forms.css)

| Class | Purpose |
|---|---|
| `.cy-field` | wrapper: label + control + hint/error, spacing from `--cy-space-*` |
| `.cy-label` | uppercase mono, letter-spaced |
| `.cy-input` | one class for all text-like controls: `<input>` (text/email/password/number/search/url/tel), `<textarea>`, and `<select>` — applied directly to each element |
| `.cy-checkbox` | |
| `.cy-radio` | |
| `.cy-hint` | muted helper text |
| `.cy-error` | danger-coloured message |

Modifiers: `.cy-input--sm`, `.cy-input--lg`.

### Decisions

**Opt-in classes, never bare element selectors.** Styling `input { }` would
hijack every input on a consumer's page at import. `.cy-input` keeps it
explicit — more markup, far fewer surprises.

**Checkbox and radio use `appearance: none` on the input itself**, not the
hidden-input-plus-styled-`<span>` pattern. The input remains the real focusable,
screen-reader-announced element; `::after` paints the check or dot. This gets the
neon glow without the accessibility problems that pattern is known for.
`accent-color` was rejected: one line, but it can only set a fill — no glow.

**Validation styles on `:user-invalid`, not `:invalid`.** `:invalid` matches
empty required fields before any interaction, so forms load pre-shouting in red.
`:user-invalid` fires only after the user has engaged. `[aria-invalid="true"]` is
supported alongside it so JS validation can drive the state explicitly.

**`<select>`** uses `appearance: none` plus an inline SVG arrow as a data URI —
native dropdown arrows cannot be styled consistently across browsers.

**Focus** uses `:focus-visible` with the shared `--cy-focus-*` tokens: a
consistent ring that meets contrast in both themes, and no rings on mouse click.

## Feedback (feedback.css)

| Class | Purpose |
|---|---|
| `.cy-alert` | `--info` `--success` `--warning` `--danger` |
| `.cy-toast` | same four variants, shares variant styling with alert |
| `.cy-toast-container` | fixed stack, top-right; `--bottom` modifier |
| `.cy-badge` | same four variants, plus `--outline` |
| `.cy-spinner` | indeterminate rotating neon ring |
| `.cy-progress` + `.cy-progress__fill` | determinate bar |
| `.cy-sr-only` | visually-hidden utility (spinner labels need one) |

Alerts follow the existing portfolio idiom: 3px left border in the status colour
plus a faint `rgba(var(--status-rgb), 0.08)` tint.

### Decisions

**Toasts are styling only.** The container is `position: fixed` with
`pointer-events: none`; children re-enable it, so it never blocks clicks beneath.
Consumers append and remove nodes; the README carries a ~5-line vanilla snippet.
Two positions ship (top-right default, `--bottom`); beyond that consumers
override the container.

**Under `prefers-reduced-motion` the spinner keeps rotating.** A frozen spinner
reads as broken, and it is essential feedback rather than decoration. Reduced
motion slows the rotation and drops the decorative glow pulse. Toast slide-in
degrades to a plain fade.

**ARIA lives in the docs, because CSS cannot supply it.** A red box means nothing
to a screen reader without `role="alert"`; a spinner needs `role="status"` plus
visually-hidden text. Every README example ships with correct attributes rather
than leaving consumers to infer them.

## Buttons (components.css)

```
.cy-btn             unchanged — primary, cyan
.cy-btn--secondary  muted outline
.cy-btn--danger     --cy-danger
.cy-btn--pink       unchanged — brand accent
.cy-btn--sm / --lg  size modifiers
```

`--secondary` is a quieter outline style rather than an alias of `--pink`, which
stays a distinct brand accent.

## Verification

The package currently has **no CI on pull requests** — only `release.yml`, which
runs after tagging. A broken `files` allowlist or a contrast regression would not
surface until after publish. This release adds:

**`scripts/check-contrast.js`** — parses `tokens.css`, computes WCAG contrast
ratios for text and status colours against their backgrounds in both themes, and
exits non-zero below AA. Pure Node, no dependencies. Converts the README's
"WCAG-aware light theme" claim into an enforced invariant.

**`.github/workflows/ci.yml`** on pull requests — runs the contrast check plus
`npm publish --dry-run` to catch tarball and allowlist mistakes pre-release.

Manual verification: every new component added to the demo page and checked in
both themes and at mobile width.

## Release checklist

1. `CHANGELOG.md` — first entry covering 0.2.0
2. README sections per component, each with ARIA-correct markup
3. Demo page extended with the new components
4. `npm version minor` → `0.2.0`, push tag; CI publishes with provenance
5. **laddtnov-hub:** bump the CDN pin `@0.1.0` → `@0.2.0` **and** recompute the
   SRI hash together. `tokens.css` gains tokens this release, so its hash
   changes. Missing this makes the browser silently block the stylesheet and
   fall back to the hardcoded hues:

   ```
   curl -s https://cdn.jsdelivr.net/npm/@laddtnov/cyberpunk-ui@0.2.0/tokens.css \
     | openssl dgst -sha384 -binary | openssl base64 -A
   ```

## Out of scope (v0.3)

Containers (modal via `<dialog>`, accordion via `<details>`, terminal window) and
Navigation/data (nav bar, breadcrumb, table). The terminal window is the kit's
strongest differentiator and is deferred deliberately, to headline v0.3 rather
than be rushed alongside fifteen other components.
