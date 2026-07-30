# cyberpunk-ui v0.2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Grow `@laddtnov/cyberpunk-ui` from 2 components to 11 by adding a token substrate, form controls, and feedback components — without adding JavaScript, dependencies, or a build step.

**Architecture:** Pure CSS custom properties and classes. Two new stylesheets (`forms.css`, `feedback.css`) alongside the existing `tokens.css` / `effects.css` / `components.css`, all re-exported through the `cyberpunk-ui.css` barrel and the `exports` map. Verification is a dependency-free Node script that parses `tokens.css` and enforces WCAG contrast, run in CI on every pull request.

**Tech Stack:** Vanilla CSS (custom properties, `:focus-visible`, `:user-invalid`, `appearance: none`), Node 20 (verification scripts only — not shipped), GitHub Actions.

## Global Constraints

- **No JavaScript ships in the package.** `files` allowlist stays `["*.css", "README.md", "LICENSE"]`. Scripts live in `scripts/` and are excluded from the tarball.
- **No dependencies, no build step.** The `.css` files are the dist. `package.json` must have no `dependencies` and no `devDependencies`.
- **All classes are prefixed `cy-`.** No bare element selectors — never style `input {}` or `button {}` globally.
- **Every interactive element uses `:focus-visible`** with `--cy-focus-width` / `--cy-focus-offset` / `--cy-focus-color`. Never remove focus outlines without replacement.
- **Every animation respects `prefers-reduced-motion: reduce`.** Decorative motion stops; essential feedback (the spinner) slows instead of freezing.
- **Both themes must work.** Anything added is checked in default (dark) and `:root[data-theme="light"]`.
- **Contrast floors:** 4.5 for text tokens, 3.0 for non-text/UI tokens. Exact role mapping in `scripts/check-contrast.js`.
- **Version:** `0.1.1` → `0.2.0`.

---

### Task 1: Contrast checker, CI, and the token substrate

Builds the verification harness first so the tokens have something to prove them. The checker is written against tokens that do not exist yet, so it fails first — genuine TDD for CSS.

**Files:**
- Create: `scripts/check-contrast.js`
- Create: `.github/workflows/ci.yml`
- Modify: `tokens.css` (append to both `:root` blocks; change one existing value)

**Interfaces:**
- Consumes: nothing (first task)
- Produces: tokens `--cy-radius-sm|--cy-radius|--cy-radius-lg`, `--cy-border-width`, `--cy-space-xs|sm|md|lg|xl`, `--cy-focus-width|--cy-focus-offset|--cy-focus-color`, `--cy-success|--cy-warning|--cy-danger|--cy-info`, `--cy-success-rgb|--cy-warning-rgb|--cy-danger-rgb`, `--cy-disabled-opacity`. All later tasks consume these. Also `npm run check:contrast`.

- [ ] **Step 1: Write the failing checker**

Create `scripts/check-contrast.js`:

```js
#!/usr/bin/env node
// Parses tokens.css and enforces WCAG contrast against each theme's --cy-bg.
// Zero dependencies by design: this package ships none, and neither do its tools.

const fs = require('fs');
const path = require('path');

// Role decides the floor. WCAG 1.4.3 requires 4.5 for normal text; 1.4.11
// requires 3.0 for non-text UI. --cy-neon-purple is only ever a box-shadow
// glow, and no single value clears 4.5 in both themes, so it is checked as UI.
// If a token's role changes, move it between these lists.
const TEXT_TOKENS = [
  '--cy-text',
  '--cy-heading',
  '--cy-neon-cyan',
  '--cy-neon-pink',
  '--cy-success',
  '--cy-warning',
  '--cy-danger',
];
const UI_TOKENS = ['--cy-neon-purple'];

const TEXT_FLOOR = 4.5;
const UI_FLOOR = 3.0;

function parseBlock(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(escaped + '\\s*\\{([^}]*)\\}'));
  if (!match) throw new Error('Block not found: ' + selector);

  const tokens = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/(--cy-[a-z0-9-]+)\s*:\s*([^;]+);/i);
    if (m) tokens[m[1]] = m[2].trim();
  }
  return tokens;
}

function relativeLuminance(hex) {
  const c = hex.replace('#', '');
  const full = c.length === 3 ? c.split('').map((x) => x + x).join('') : c;
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(full.substr(i, 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(fg, bg) {
  const [hi, lo] = [relativeLuminance(fg), relativeLuminance(bg)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

function checkTheme(label, tokens, failures) {
  const bg = tokens['--cy-bg'];
  if (!bg || !bg.startsWith('#')) throw new Error(label + ': --cy-bg missing or not a hex value');

  console.log('\n' + label + '  (background ' + bg + ')');

  for (const [list, floor, role] of [
    [TEXT_TOKENS, TEXT_FLOOR, 'text'],
    [UI_TOKENS, UI_FLOOR, 'ui'],
  ]) {
    for (const name of list) {
      const value = tokens[name];
      if (!value) {
        failures.push(label + ' ' + name + ' is not defined');
        console.log('  ' + name.padEnd(16) + ' MISSING');
        continue;
      }
      // var() aliases resolve to a token already checked on its own.
      if (!value.startsWith('#')) {
        console.log('  ' + name.padEnd(16) + ' ' + value + '  (alias, skipped)');
        continue;
      }
      const ratio = contrast(value, bg);
      const ok = ratio >= floor;
      if (!ok) failures.push(label + ' ' + name + ' ' + ratio.toFixed(2) + ' < ' + floor + ' (' + role + ')');
      console.log(
        '  ' + name.padEnd(16) + ' ' + value.padEnd(9) +
        ratio.toFixed(2).padStart(6) + '  need ' + floor + '  ' + (ok ? 'PASS' : 'FAIL')
      );
    }
  }
}

function main() {
  const css = fs.readFileSync(path.join(__dirname, '..', 'tokens.css'), 'utf8');
  const dark = parseBlock(css, ':root');
  const light = { ...dark, ...parseBlock(css, ':root[data-theme="light"]') };

  const failures = [];
  checkTheme('dark theme', dark, failures);
  checkTheme('light theme', light, failures);

  if (failures.length) {
    console.error('\n' + failures.length + ' contrast failure(s):');
    for (const f of failures) console.error('  - ' + f);
    process.exit(1);
  }
  console.log('\nAll contrast checks passed.');
}

main();
```

- [ ] **Step 2: Wire it up and run it to watch it fail**

Add to `package.json` (top level, after `"exports"`):

```json
"scripts": {
  "check:contrast": "node scripts/check-contrast.js"
},
```

Run: `npm run check:contrast`

Expected: **FAIL** — exit code 1, reporting `--cy-success`, `--cy-warning`, `--cy-danger` are not defined, and `light theme --cy-neon-cyan 4.07 < 4.5 (text)`.

- [ ] **Step 3: Add the substrate to `tokens.css`**

Append inside the existing `:root { … }` block, after `--cy-ease`:

```css
  /* ── Geometry ─────────────────────────────────────────────── */
  --cy-radius-sm: 2px;
  --cy-radius:    4px;
  --cy-radius-lg: 8px;
  --cy-border-width: 1px;

  /* ── Spacing (4px-based scale) ────────────────────────────── */
  --cy-space-xs: 0.25rem;
  --cy-space-sm: 0.5rem;
  --cy-space-md: 0.75rem;
  --cy-space-lg: 1rem;
  --cy-space-xl: 1.5rem;

  /* ── Focus (shared by every interactive element) ──────────── */
  --cy-focus-width:  2px;
  --cy-focus-offset: 2px;
  --cy-focus-color:  var(--cy-neon-cyan);

  /* ── Status ────────────────────────────────────────────────
     --cy-info aliases the cyan on purpose: its channels are already
     published as --cy-cyan-rgb, so there is one source of truth. */
  --cy-success: #52ff9a;
  --cy-warning: #ffc857;
  --cy-danger:  #ff4d4d;
  --cy-info:    var(--cy-neon-cyan);

  --cy-success-rgb: 82, 255, 154;
  --cy-warning-rgb: 255, 200, 87;
  --cy-danger-rgb:  255, 77, 77;

  --cy-disabled-opacity: 0.45;
```

- [ ] **Step 4: Add light-theme overrides and fix the cyan**

In the existing `:root[data-theme="light"] { … }` block, change the two cyan lines:

```css
  /* #008099 measured 4.07 against --cy-bg — below the 4.5 AA floor for
     normal text. #00707f measures 5.10. */
  --cy-neon-cyan: #00707f;
  --cy-cyan-rgb:  0, 112, 127;
```

Then append to the same block:

```css
  /* Neon status hues fail contrast on a light background. */
  --cy-success: #0a7d43;
  --cy-warning: #8a5a00;
  --cy-danger:  #c2110f;

  --cy-success-rgb: 10, 125, 67;
  --cy-warning-rgb: 138, 90, 0;
  --cy-danger-rgb:  194, 17, 15;
```

- [ ] **Step 5: Run the checker to verify it passes**

Run: `npm run check:contrast`

Expected: **PASS**, exit 0. Every token ≥ its floor; `--cy-info` reported as `(alias, skipped)`; light cyan now 5.10.

- [ ] **Step 6: Add PR CI**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

# The package had no pull-request checks at all — release.yml only runs after
# a tag, so a contrast regression or a broken files allowlist would not surface
# until after publish.
on:
  pull_request:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  verify:
    name: Verify
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: WCAG contrast check
        run: npm run check:contrast

      # Catches an over-broad or over-narrow files allowlist before release.
      - name: Inspect publish tarball
        run: npm publish --dry-run
```

- [ ] **Step 7: Commit**

```bash
git add scripts/check-contrast.js .github/workflows/ci.yml tokens.css package.json
git commit -m "feat(tokens): add geometry, spacing, focus and status substrate

Adds the tokens every v0.2 component depends on, plus a dependency-free
contrast checker and PR CI to enforce them.

Fixes an accessibility bug found while writing the checker: light-theme
--cy-neon-cyan was #008099, which measures 4.07 against --cy-bg and fails
the 4.5 AA floor for normal text. Now #00707f (5.10).

Thresholds are role-aware: 4.5 for text tokens, 3.0 for non-text UI.
--cy-neon-purple is glow-only and clears 4.5 in neither theme."
```

---

### Task 2: Button variants

**Files:**
- Modify: `components.css` (append after the existing `.cy-btn--pink` rules)

**Interfaces:**
- Consumes: `--cy-danger`, `--cy-danger-rgb`, `--cy-text`, `--cy-space-*`, `--cy-radius`, `--cy-disabled-opacity` (Task 1)
- Produces: `.cy-btn--secondary`, `.cy-btn--danger`, `.cy-btn--sm`, `.cy-btn--lg`

- [ ] **Step 1: Add the variants**

Append to `components.css`:

```css
/* ── Button variants ──────────────────────────────────────────── */

/* Secondary: a quieter outline. Deliberately not an alias of --pink,
   which stays a distinct brand accent. */
.cy-btn--secondary {
  color: var(--cy-text);
  border-color: var(--cy-text);
}

.cy-btn--secondary:hover,
.cy-btn--secondary:focus-visible {
  color: var(--cy-bg);
  background: var(--cy-text);
  box-shadow: none;
}

.cy-btn--danger {
  color: var(--cy-danger);
  border-color: var(--cy-danger);
}

.cy-btn--danger:hover,
.cy-btn--danger:focus-visible {
  color: var(--cy-bg);
  background: var(--cy-danger);
  box-shadow: 0 0 14px var(--cy-danger),
              0 0 30px rgba(var(--cy-danger-rgb), 0.5);
}

/* ── Button sizes ─────────────────────────────────────────────── */
.cy-btn--sm {
  font-size: 0.8rem;
  padding: var(--cy-space-xs) var(--cy-space-md);
}

.cy-btn--lg {
  font-size: 1.05rem;
  padding: var(--cy-space-md) var(--cy-space-xl);
}

/* ── Disabled ─────────────────────────────────────────────────── */
.cy-btn:disabled,
.cy-btn[aria-disabled="true"] {
  opacity: var(--cy-disabled-opacity);
  cursor: not-allowed;
}

.cy-btn:disabled:hover,
.cy-btn[aria-disabled="true"]:hover {
  color: inherit;
  background: transparent;
  box-shadow: none;
  transform: none;
}
```

- [ ] **Step 2: Verify in the browser**

Serve the repo root and open the demo:

```bash
python3 -m http.server 8099
```

Add this temporarily to `demo/index.html` inside the Buttons `.row`, then load `http://localhost:8099/demo/`:

```html
<a href="#" class="cy-btn cy-btn--secondary">SECONDARY</a>
<a href="#" class="cy-btn cy-btn--danger">DANGER</a>
<button class="cy-btn cy-btn--sm">SMALL</button>
<button class="cy-btn cy-btn--lg">LARGE</button>
<button class="cy-btn" disabled>DISABLED</button>
```

Expected: secondary renders grey-outlined, danger red-outlined with red glow on hover, sm/lg visibly different heights, disabled at 45% opacity with no hover response. Toggle the theme button — all five stay legible.

Keep the markup: it becomes part of the demo in Task 5.

- [ ] **Step 3: Commit**

```bash
git add components.css demo/index.html
git commit -m "feat(buttons): add secondary, danger, size and disabled variants"
```

---

### Task 3: Forms

**Files:**
- Create: `forms.css`

**Interfaces:**
- Consumes: `--cy-space-*`, `--cy-radius`, `--cy-border-width`, `--cy-focus-*`, `--cy-danger`, `--cy-danger-rgb`, `--cy-disabled-opacity`, `--cy-font-mono`, `--cy-surface`, `--cy-text`, `--cy-neon-cyan`, `--cy-cyan-rgb` (Task 1)
- Produces: `.cy-field`, `.cy-label`, `.cy-input`, `.cy-input--sm`, `.cy-input--lg`, `.cy-checkbox`, `.cy-radio`, `.cy-hint`, `.cy-error`

- [ ] **Step 1: Write `forms.css`**

```css
/*! @laddtnov/cyberpunk-ui — forms.css | MIT */

/* Opt-in classes only. Styling bare `input {}` would hijack every input on a
   consumer's page the moment they import the kit. */

/* ── Field wrapper ────────────────────────────────────────────── */
.cy-field {
  display: flex;
  flex-direction: column;
  gap: var(--cy-space-xs);
  margin-bottom: var(--cy-space-lg);
}

.cy-label {
  font-family: var(--cy-font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--cy-neon-cyan);
}

/* ── Text-like controls ───────────────────────────────────────── */
.cy-input {
  font-family: var(--cy-font-mono);
  font-size: 0.95rem;
  color: var(--cy-text);
  background: var(--cy-surface);
  border: var(--cy-border-width) solid rgba(var(--cy-cyan-rgb), 0.35);
  border-radius: var(--cy-radius);
  padding: var(--cy-space-sm) var(--cy-space-md);
  width: 100%;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.cy-input::placeholder {
  color: var(--cy-text);
  opacity: 0.45;
}

.cy-input:hover {
  border-color: rgba(var(--cy-cyan-rgb), 0.6);
}

.cy-input:focus-visible {
  outline: var(--cy-focus-width) solid var(--cy-focus-color);
  outline-offset: var(--cy-focus-offset);
  border-color: var(--cy-neon-cyan);
  box-shadow: 0 0 12px rgba(var(--cy-cyan-rgb), 0.3);
}

/* Native dropdown arrows cannot be styled consistently, so draw our own. */
select.cy-input {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath fill='%2300f2ff' d='M0 0h12L6 8z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right var(--cy-space-md) center;
  background-size: 10px;
  padding-right: var(--cy-space-xl);
}

textarea.cy-input {
  min-height: 6rem;
  resize: vertical;
}

/* ── Sizes ────────────────────────────────────────────────────── */
.cy-input--sm { font-size: 0.8rem;  padding: var(--cy-space-xs) var(--cy-space-sm); }
.cy-input--lg { font-size: 1.05rem; padding: var(--cy-space-md) var(--cy-space-lg); }

/* ── Validation ───────────────────────────────────────────────────
   :user-invalid, not :invalid — :invalid matches empty required fields
   before the user has typed anything, so forms load pre-shouting in red.
   [aria-invalid="true"] lets JS validation drive the state explicitly. */
.cy-input:user-invalid,
.cy-input[aria-invalid="true"] {
  border-color: var(--cy-danger);
  box-shadow: 0 0 10px rgba(var(--cy-danger-rgb), 0.25);
}

.cy-error {
  font-family: var(--cy-font-mono);
  font-size: 0.75rem;
  color: var(--cy-danger);
}

.cy-hint {
  font-family: var(--cy-font-mono);
  font-size: 0.75rem;
  color: var(--cy-text);
  opacity: 0.7;
}

/* ── Checkbox and radio ───────────────────────────────────────────
   appearance:none on the real input, NOT the hidden-input + styled-span
   pattern: the input stays the focusable, screen-reader-announced element
   and we simply paint it. */
.cy-checkbox,
.cy-radio {
  appearance: none;
  width: 1.15rem;
  height: 1.15rem;
  flex-shrink: 0;
  margin: 0;
  display: inline-grid;
  place-content: center;
  background: var(--cy-surface);
  border: var(--cy-border-width) solid rgba(var(--cy-cyan-rgb), 0.5);
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.cy-checkbox { border-radius: var(--cy-radius-sm); }
.cy-radio    { border-radius: 50%; }

.cy-checkbox::after,
.cy-radio::after {
  content: "";
  transform: scale(0);
  transition: transform 0.15s var(--cy-ease);
}

.cy-checkbox::after {
  width: 0.6rem;
  height: 0.3rem;
  border-left: 2px solid var(--cy-neon-cyan);
  border-bottom: 2px solid var(--cy-neon-cyan);
  rotate: -45deg;
  margin-top: -0.15rem;
}

.cy-radio::after {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: var(--cy-neon-cyan);
}

.cy-checkbox:checked,
.cy-radio:checked {
  border-color: var(--cy-neon-cyan);
  box-shadow: 0 0 10px rgba(var(--cy-cyan-rgb), 0.45);
}

.cy-checkbox:checked::after,
.cy-radio:checked::after {
  transform: scale(1);
}

.cy-checkbox:focus-visible,
.cy-radio:focus-visible {
  outline: var(--cy-focus-width) solid var(--cy-focus-color);
  outline-offset: var(--cy-focus-offset);
}

/* ── Disabled ─────────────────────────────────────────────────── */
.cy-input:disabled,
.cy-checkbox:disabled,
.cy-radio:disabled {
  opacity: var(--cy-disabled-opacity);
  cursor: not-allowed;
}

/* ── Reduced motion ───────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .cy-input,
  .cy-checkbox,
  .cy-radio,
  .cy-checkbox::after,
  .cy-radio::after { transition: none; }
}
```

- [ ] **Step 2: Verify in the browser**

Add a temporary `<link rel="stylesheet" href="../forms.css">` to `demo/index.html`, then this section before `</div>` of `.wrap`:

```html
<section>
  <h2>Forms</h2>
  <div class="cy-field">
    <label class="cy-label" for="d-name">Name</label>
    <input class="cy-input" id="d-name" type="text" placeholder="Ada Lovelace">
    <span class="cy-hint">As it should appear publicly.</span>
  </div>
  <div class="cy-field">
    <label class="cy-label" for="d-mail">Email</label>
    <input class="cy-input" id="d-mail" type="email" required placeholder="you@example.com">
    <span class="cy-error">Enter a valid address.</span>
  </div>
  <div class="cy-field">
    <label class="cy-label" for="d-sel">Sector</label>
    <select class="cy-input" id="d-sel"><option>Night City</option><option>Chiba</option></select>
  </div>
  <div class="cy-field">
    <label class="cy-label" for="d-msg">Message</label>
    <textarea class="cy-input" id="d-msg" placeholder="Transmission…"></textarea>
  </div>
  <label><input class="cy-checkbox" type="checkbox" checked> Encrypt</label>
  <label><input class="cy-radio" type="radio" name="r" checked> Primary</label>
  <label><input class="cy-radio" type="radio" name="r"> Backup</label>
  <input class="cy-input" disabled value="disabled">
</section>
```

Serve with `python3 -m http.server 8099` and load `http://localhost:8099/demo/`.

Expected:
1. Tab through every control — each shows a cyan focus ring offset from the border.
2. Checked checkbox shows a cyan tick; checked radio a cyan dot; both glow.
3. Type `x` into the email field and blur — border turns red (that is `:user-invalid`). Reload: it is **not** red before you touch it.
4. Toggle the theme — all text stays legible, focus ring still visible.
5. Disabled input is dimmed and rejects input.

- [ ] **Step 3: Commit**

```bash
git add forms.css demo/index.html
git commit -m "feat(forms): add input, select, textarea, checkbox, radio and field styles"
```

---

### Task 4: Feedback

**Files:**
- Create: `feedback.css`

**Interfaces:**
- Consumes: `--cy-space-*`, `--cy-radius`, `--cy-border-width`, `--cy-success|warning|danger` and their `-rgb` channels, `--cy-cyan-rgb`, `--cy-font-mono`, `--cy-surface`, `--cy-ease` (Task 1)
- Produces: `.cy-alert` (+`--info|--success|--warning|--danger`), `.cy-toast`, `.cy-toast-container` (+`--bottom`), `.cy-badge` (+ variants, `--outline`), `.cy-spinner`, `.cy-progress`, `.cy-progress__fill`, `.cy-sr-only`

- [ ] **Step 1: Write `feedback.css`**

```css
/*! @laddtnov/cyberpunk-ui — feedback.css | MIT */

/* ── Visually-hidden utility ──────────────────────────────────────
   Lives here because .cy-spinner requires a text label to be
   accessible, and a spinner without one is the common mistake. */
.cy-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ── Alerts ───────────────────────────────────────────────────────
   Status colour on a 3px left border plus a faint tint of the same
   hue — which is why the substrate publishes -rgb channels. */
.cy-alert {
  font-family: var(--cy-font-mono);
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--cy-text);
  padding: var(--cy-space-md) var(--cy-space-lg);
  border-radius: var(--cy-radius);
  border-left: 3px solid var(--cy-info);
  background: rgba(var(--cy-cyan-rgb), 0.08);
}

.cy-alert--info    { border-left-color: var(--cy-info);    background: rgba(var(--cy-cyan-rgb),    0.08); }
.cy-alert--success { border-left-color: var(--cy-success); background: rgba(var(--cy-success-rgb), 0.08); }
.cy-alert--warning { border-left-color: var(--cy-warning); background: rgba(var(--cy-warning-rgb), 0.08); }
.cy-alert--danger  { border-left-color: var(--cy-danger);  background: rgba(var(--cy-danger-rgb),  0.08); }

/* ── Toasts ───────────────────────────────────────────────────────
   Styling only — no JavaScript ships. Consumers append and remove
   nodes; see the README snippet. pointer-events on the container is
   none so it never blocks clicks on the page beneath it. */
.cy-toast-container {
  position: fixed;
  top: var(--cy-space-lg);
  right: var(--cy-space-lg);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: var(--cy-space-sm);
  pointer-events: none;
}

.cy-toast-container--bottom {
  top: auto;
  bottom: var(--cy-space-lg);
}

.cy-toast {
  pointer-events: auto;
  min-width: 240px;
  max-width: 360px;
  font-family: var(--cy-font-mono);
  font-size: 0.85rem;
  color: var(--cy-text);
  background: var(--cy-surface);
  border: var(--cy-border-width) solid rgba(var(--cy-cyan-rgb), 0.4);
  border-left: 3px solid var(--cy-info);
  border-radius: var(--cy-radius);
  padding: var(--cy-space-md) var(--cy-space-lg);
  box-shadow: 0 0 24px rgba(var(--cy-cyan-rgb), 0.18);
  animation: cy-toast-in 0.25s var(--cy-ease);
}

.cy-toast--success { border-left-color: var(--cy-success); }
.cy-toast--warning { border-left-color: var(--cy-warning); }
.cy-toast--danger  { border-left-color: var(--cy-danger); }

@keyframes cy-toast-in {
  from { opacity: 0; transform: translateX(1rem); }
  to   { opacity: 1; transform: translateX(0); }
}

/* ── Badges ───────────────────────────────────────────────────── */
.cy-badge {
  display: inline-block;
  font-family: var(--cy-font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.15rem var(--cy-space-sm);
  border-radius: var(--cy-radius-lg);
  color: var(--cy-bg);
  background: var(--cy-info);
}

.cy-badge--success { background: var(--cy-success); }
.cy-badge--warning { background: var(--cy-warning); }
.cy-badge--danger  { background: var(--cy-danger); }

.cy-badge--outline {
  color: var(--cy-info);
  background: transparent;
  border: var(--cy-border-width) solid currentColor;
}

.cy-badge--outline.cy-badge--success { color: var(--cy-success); }
.cy-badge--outline.cy-badge--warning { color: var(--cy-warning); }
.cy-badge--outline.cy-badge--danger  { color: var(--cy-danger); }

/* ── Spinner ──────────────────────────────────────────────────── */
.cy-spinner {
  display: inline-block;
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid rgba(var(--cy-cyan-rgb), 0.25);
  border-top-color: var(--cy-neon-cyan);
  border-radius: 50%;
  animation: cy-spin 0.8s linear infinite,
             cy-spin-glow 1.6s ease-in-out infinite;
}

@keyframes cy-spin {
  to { transform: rotate(360deg); }
}

@keyframes cy-spin-glow {
  0%, 100% { box-shadow: 0 0 6px rgba(var(--cy-cyan-rgb), 0.4); }
  50%      { box-shadow: 0 0 16px rgba(var(--cy-cyan-rgb), 0.8); }
}

/* ── Progress ─────────────────────────────────────────────────── */
.cy-progress {
  width: 100%;
  height: 6px;
  background: rgba(var(--cy-cyan-rgb), 0.15);
  border-radius: var(--cy-radius-lg);
  overflow: hidden;
}

.cy-progress__fill {
  height: 100%;
  width: 0;
  background: linear-gradient(90deg, var(--cy-neon-cyan), var(--cy-neon-pink));
  box-shadow: 0 0 12px rgba(var(--cy-cyan-rgb), 0.6);
  transition: width 0.3s var(--cy-ease);
}

/* ── Reduced motion ───────────────────────────────────────────────
   The spinner KEEPS rotating: a frozen spinner reads as broken and it
   is essential feedback, not decoration. Slow it and drop the
   decorative glow pulse instead. */
@media (prefers-reduced-motion: reduce) {
  .cy-spinner { animation: cy-spin 2s linear infinite; }
  .cy-toast   { animation: cy-fade-in 0.2s ease; }
  .cy-progress__fill { transition: none; }
}

@keyframes cy-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

- [ ] **Step 2: Verify in the browser**

Add `<link rel="stylesheet" href="../feedback.css">` to `demo/index.html` and this section:

```html
<section>
  <h2>Feedback</h2>
  <div class="cy-alert cy-alert--info" role="status">Connection established.</div>
  <div class="cy-alert cy-alert--success" role="status">Upload complete.</div>
  <div class="cy-alert cy-alert--warning" role="alert">Signal degraded.</div>
  <div class="cy-alert cy-alert--danger" role="alert">Breach detected.</div>

  <div class="row" style="margin-top:1rem">
    <span class="cy-badge">NEW</span>
    <span class="cy-badge cy-badge--success">LIVE</span>
    <span class="cy-badge cy-badge--warning">BETA</span>
    <span class="cy-badge cy-badge--danger">DOWN</span>
    <span class="cy-badge cy-badge--outline cy-badge--success">v0.2</span>
  </div>

  <div class="row" style="margin-top:1rem">
    <span class="cy-spinner" role="status"><span class="cy-sr-only">Loading…</span></span>
  </div>

  <div class="cy-progress" style="margin-top:1rem" role="progressbar"
       aria-valuenow="66" aria-valuemin="0" aria-valuemax="100">
    <div class="cy-progress__fill" style="width:66%"></div>
  </div>
</section>

<div class="cy-toast-container">
  <div class="cy-toast cy-toast--success" role="status">Package published.</div>
</div>
```

Expected:
1. Four alerts, each with a distinct left border and matching faint tint.
2. Badges legible — dark text on solid colour, coloured text on outline.
3. Spinner rotates with a pulsing glow; the toast slides in from the right.
4. The toast does not block clicking things underneath it.
5. Toggle the theme — every status colour stays legible against the light background.
6. In macOS System Settings → Accessibility → Display → Reduce motion, reload: spinner still rotates (slower, no pulse), toast fades instead of sliding.

- [ ] **Step 3: Commit**

```bash
git add feedback.css demo/index.html
git commit -m "feat(feedback): add alerts, toasts, badges, spinner and progress"
```

---

### Task 5: Wire everything together

**Files:**
- Modify: `cyberpunk-ui.css`
- Modify: `package.json` (exports map)
- Modify: `demo/index.html` (tidy the temporary markup from Tasks 2–4)
- Modify: `README.md`
- Create: `CHANGELOG.md`

**Interfaces:**
- Consumes: everything from Tasks 1–4
- Produces: subpath exports `./forms` and `./feedback`

- [ ] **Step 1: Update the barrel**

Replace `cyberpunk-ui.css` entirely:

```css
/*! @laddtnov/cyberpunk-ui v0.2.0 | MIT | github.com/laddtnov/cyberpunk-ui */
@import "./tokens.css";
@import "./effects.css";
@import "./components.css";
@import "./forms.css";
@import "./feedback.css";
```

- [ ] **Step 2: Update the exports map**

In `package.json`, replace the `"exports"` block:

```json
  "exports": {
    ".": "./cyberpunk-ui.css",
    "./tokens": "./tokens.css",
    "./effects": "./effects.css",
    "./components": "./components.css",
    "./forms": "./forms.css",
    "./feedback": "./feedback.css"
  },
```

- [ ] **Step 3: Tidy the demo**

In `demo/index.html`, remove the two temporary `<link>` tags added in Tasks 3–4 — the demo loads `../cyberpunk-ui.css`, which now imports both. Keep the Forms and Feedback sections.

- [ ] **Step 4: Verify the whole kit loads through the barrel**

```bash
python3 -m http.server 8099
```

Load `http://localhost:8099/demo/` and run in the browser console:

```js
const cs = getComputedStyle(document.documentElement);
console.log({
  space:   cs.getPropertyValue('--cy-space-md').trim(),
  danger:  cs.getPropertyValue('--cy-danger').trim(),
  input:   !!document.querySelector('.cy-input'),
  alert:   !!document.querySelector('.cy-alert'),
  sheets:  document.styleSheets.length,
});
```

Expected: `space: "0.75rem"`, `danger: "#ff4d4d"`, both booleans `true`. Forms and Feedback still render with the temporary links removed — proving the barrel resolves them.

- [ ] **Step 5: Document in README**

Add to the Reference section, after the Components table:

```markdown
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
  <input class="cy-input" id="email" type="email" required>
  <span class="cy-error">Enter a valid address.</span>
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
| `.cy-progress` · `.cy-progress__fill` | determinate bar |
| `.cy-sr-only` | visually-hidden text |

Always give these the right ARIA — CSS cannot make a red box mean "error":

```html
<div class="cy-alert cy-alert--danger" role="alert">Breach detected.</div>

<span class="cy-spinner" role="status">
  <span class="cy-sr-only">Loading…</span>
</span>

<div class="cy-progress" role="progressbar"
     aria-valuenow="66" aria-valuemin="0" aria-valuemax="100">
  <div class="cy-progress__fill" style="width:66%"></div>
</div>
```

Toasts ship as styling only — no JavaScript in this package. Show one with:

```js
const container = document.querySelector('.cy-toast-container');
const toast = document.createElement('div');
toast.className = 'cy-toast cy-toast--success';
toast.setAttribute('role', 'status');
toast.textContent = 'Package published.';
container.append(toast);
setTimeout(() => toast.remove(), 4000);
```
```

- [ ] **Step 6: Write the changelog**

Create `CHANGELOG.md`:

```markdown
# Changelog

All notable changes to this project are documented here.
This project adheres to [Semantic Versioning](https://semver.org/).

## [0.2.0] — 2026-07-30

### Added
- **Token substrate** — geometry (`--cy-radius-*`, `--cy-border-width`), a
  4px-based spacing scale (`--cy-space-*`), shared focus tokens
  (`--cy-focus-*`), status colours (`--cy-success|warning|danger|info`) with
  `-rgb` channels, and `--cy-disabled-opacity`.
- **Forms** (`forms.css`) — `.cy-field`, `.cy-label`, `.cy-input` (with `--sm` /
  `--lg`), `.cy-checkbox`, `.cy-radio`, `.cy-hint`, `.cy-error`.
- **Feedback** (`feedback.css`) — `.cy-alert`, `.cy-toast` +
  `.cy-toast-container`, `.cy-badge`, `.cy-spinner`, `.cy-progress`, and the
  `.cy-sr-only` utility.
- **Button variants** — `.cy-btn--secondary`, `.cy-btn--danger`, `.cy-btn--sm`,
  `.cy-btn--lg`, plus disabled styling.
- Subpath exports `@laddtnov/cyberpunk-ui/forms` and `/feedback`.
- `scripts/check-contrast.js` and PR CI enforcing WCAG contrast on every token.

### Fixed
- **Light-theme `--cy-neon-cyan` was `#008099`, which measures 4.07 against
  `--cy-bg`** — below the 4.5 AA floor for normal text. Now `#00707f` (5.10).
  Light mode renders a slightly deeper teal; no API change.

### Notes
- Still zero dependencies, zero JavaScript, no build step.
- Contrast floors are role-aware: 4.5 for text tokens, 3.0 for non-text UI
  (`--cy-neon-purple` is glow-only and clears 4.5 in neither theme).

## [0.1.1] — 2026-07-29
- First release published from CI with SLSA provenance. No CSS changes.

## [0.1.0] — 2026-07-29
- Initial release: tokens, effects (glow, glitch, scanlines, grid, cursor),
  `.cy-btn` and `.cy-card`.
```

- [ ] **Step 7: Verify the tarball contains the new files**

Run: `npm publish --dry-run`

Expected: the file list includes `forms.css` and `feedback.css`, and **excludes** `scripts/`, `demo/`, `docs/`, and `CHANGELOG.md` (the `files` allowlist is `*.css`, `README.md`, `LICENSE`). Total should be 9 files.

- [ ] **Step 8: Commit**

```bash
git add cyberpunk-ui.css package.json demo/index.html README.md CHANGELOG.md
git commit -m "feat: wire forms and feedback into barrel, exports and docs"
```

---

### Task 6: Release 0.2.0 and update the portfolio

**Files:**
- Modify: `package.json` (version — via `npm version`)
- Modify (other repo): `laddtnov-hub/index.html`

**Interfaces:**
- Consumes: everything above
- Produces: published `@laddtnov/cyberpunk-ui@0.2.0`

- [ ] **Step 1: Open the pull request and let CI verify**

```bash
git push -u origin feat/v0.2
gh pr create --title "feat: v0.2 — token substrate, forms, feedback" --fill
```

Expected: the CI workflow runs `check:contrast` and `publish --dry-run`, both green.

- [ ] **Step 2: Merge, then tag the release**

After merging:

```bash
cd ~/cyberpunk-ui-publish && git checkout main && git pull
npm version minor && git push --follow-tags
```

Expected: version becomes `0.2.0`; the tag triggers `release.yml`, which publishes to npm with provenance and creates a GitHub Release.

- [ ] **Step 3: Verify the release landed**

```bash
npm view @laddtnov/cyberpunk-ui version
npm view @laddtnov/cyberpunk-ui dist.attestations
```

Expected: `0.2.0`, and an attestations object with `predicateType: https://slsa.dev/provenance/v1`.

- [ ] **Step 4: Recompute the SRI hash for the portfolio**

`tokens.css` changed this release, so its old hash is now wrong.

```bash
curl -s https://cdn.jsdelivr.net/npm/@laddtnov/cyberpunk-ui@0.2.0/tokens.css \
  | openssl dgst -sha384 -binary | openssl base64 -A
```

Copy the output — it is the new `sha384-…` value.

- [ ] **Step 5: Update the portfolio's pinned link**

In `laddtnov-hub/index.html`, update both the version and the hash together:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@laddtnov/cyberpunk-ui@0.2.0/tokens.css"
  integrity="sha384-PASTE_THE_NEW_HASH_HERE"
  crossorigin="anonymous"
  referrerpolicy="no-referrer">
```

- [ ] **Step 6: Verify the portfolio still gets its tokens**

Serve the portfolio and run in the browser console:

```js
const link = document.querySelector('link[rel="stylesheet"][href*="jsdelivr"]');
const sheet = [...document.styleSheets].find(s => (s.href||'').includes('jsdelivr'));
console.log({
  pinned:   link.href.includes('@0.2.0'),
  loaded:   !!sheet,
  token:    getComputedStyle(document.documentElement).getPropertyValue('--cy-neon-cyan').trim(),
});
```

Expected: `pinned: true`, `loaded: true`, `token: "#00f2ff"`.

**If `token` comes back empty, the SRI hash is wrong** — the browser blocked the stylesheet and the portfolio silently fell back to its hardcoded hues. Recompute the hash.

- [ ] **Step 7: Commit the portfolio change**

```bash
git add index.html
git commit -m "chore: bump cyberpunk-ui CDN pin to 0.2.0 with new SRI hash"
```

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| File layout (`forms.css`, `feedback.css`, barrel, exports) | 3, 4, 5 |
| Token substrate (geometry, spacing, focus, status, disabled) | 1 |
| Light-theme status overrides | 1 |
| Cyan accessibility fix `#008099` → `#00707f` | 1 |
| Role-aware contrast thresholds | 1 |
| Sizing via component modifiers | 2 (`--sm`/`--lg`), 3 (`.cy-input--sm/lg`) |
| Forms: field, label, input, select, textarea, checkbox, radio, hint, error | 3 |
| Opt-in classes, no bare element selectors | 3 (comment + implementation) |
| `appearance: none` on the real input | 3 |
| `:user-invalid` over `:invalid` | 3 |
| Feedback: alert, toast, badge, spinner, progress, sr-only | 4 |
| Toasts styling-only, `pointer-events` behaviour | 4, README snippet in 5 |
| Spinner keeps rotating under reduced motion | 4 |
| ARIA documented in every example | 4 (demo), 5 (README) |
| Button `--secondary`, `--danger`, sizes | 2 |
| `scripts/check-contrast.js` | 1 |
| PR CI workflow | 1 |
| CHANGELOG | 5 |
| Release + portfolio SRI bump | 6 |

No gaps.

**Placeholder scan:** none. Every code step contains complete, runnable content. The one literal placeholder (`PASTE_THE_NEW_HASH_HERE`) is unavoidable — the hash cannot exist until the package is published — and Step 4 gives the exact command to produce it, with Step 6 verifying it.

**Type/name consistency:** token names used in Tasks 2–4 all match the definitions in Task 1 (`--cy-space-*`, `--cy-radius*`, `--cy-focus-*`, `--cy-danger-rgb`, `--cy-cyan-rgb`, `--cy-disabled-opacity`, `--cy-ease`). Class names in the demo, README, and CHANGELOG match those defined in `forms.css` and `feedback.css`. `.cy-radius-sm` is used by `.cy-checkbox` and defined in Task 1. `--cy-ease` predates this release and is unchanged.
