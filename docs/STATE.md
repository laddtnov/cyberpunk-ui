# Project state

What is already built, and the conventions any addition has to follow.
Current as of **0.5.0**.

`CHANGELOG.md` records what changed and when. This file records what *is* —
read it before adding a component, so nothing gets rebuilt or invented twice.

## Layout

Zero dependencies, zero JavaScript, no build step. 1457 lines of CSS.

| File | Lines | Contains |
| --- | --- | --- |
| `tokens.css` | 134 | every custom property, plus the `[data-theme="light"]` overrides |
| `effects.css` | 114 | glow, glitch, scanlines, grid, cursor |
| `components.css` | 159 | `.cy-btn`, `.cy-card` |
| `containers.css` | 198 | accordion, modal, terminal — all on native elements |
| `navigation.css` | 167 | nav bar, breadcrumb |
| `table.css` | 126 | data table, scroll container |
| `forms.css` | 296 | field, label, input, select, textarea, checkbox, radio, hint, error |
| `feedback.css` | 254 | alert, toast, badge, spinner, progress, sr-only |
| `cyberpunk-ui.css` | 9 | `@import`s all of the above |

Supporting files: `demo/index.html` (the live demo — every component is
exercised there, including both validation paths, and it is the OG image
source), `demo/playground.js` (the live token editor; demo-only, and never
published — `files` ships `*.css`, `README.md` and `LICENSE` only),
`scripts/check-contrast.js` and `scripts/check-conventions.js`
(dev-only, not published), `docs/superpowers/` (specs and plans),
`.github/workflows/`.

**A new CSS file needs a matching entry in `package.json`'s `exports` map**
and an `@import` in `cyberpunk-ui.css`. Current subpaths: `.`, `/tokens`,
`/effects`, `/components`, `/containers`, `/navigation`, `/table`, `/forms`,
`/feedback`, and `./package.json`.

That last one is not a stylesheet. Once a package declares `exports`, anything
absent from the map is unreachable — including `package.json` itself, which
build tools and linters routinely read. It is mapped explicitly so they can.

## Package managers

Verified against the **published** package, not a local tarball, on
2026-07-31:

| Manager | Version | Result |
| --- | --- | --- |
| npm | 10.9.8 | installs, all 6 stylesheet subpaths resolved at the time |
| pnpm | 11.18.0 | installs, all 6 resolved — **24h cooldown**, see below |
| Yarn Classic | 1.22.22 | installs, all 6 resolved |
| Yarn Berry | 4.18.0 | installs, all 6 resolved — under **Plug'n'Play too**, with no `node_modules` on disk. **24h cooldown** |
| Bun | 1.3.14 | installs, all 6 resolved |

Nothing had to change for any of them. The kit is plain CSS with no
dependencies, no postinstall and no build step, so there is very little for a
manager to disagree about — the only real risk was the `exports` map, and it
resolves everywhere, PnP included.

**pnpm 11 and Yarn 4 will not install a version younger than 24 hours.** Both
ship a supply-chain cooldown on by default — pnpm's `minimumReleaseAge` and
Yarn's `npmMinimalAgeGate`, each 1440 minutes. They do not error; they quietly
resolve to the newest release older than the gate, so a fresh `pnpm add` lands
on the *previous* version and prints `(x.y.z is available)` next to it. This
was confirmed both ways: with the gate at its default the install produced
0.2.0, and with `--config.minimumReleaseAge=0` (pnpm) or `npmMinimalAgeGate: 0`
(Yarn) it produced 0.2.1.

The practical consequence is for **releasing**: after publishing, do not verify
with a bare `pnpm add` or `yarn add` and conclude the release failed. Pin the
version explicitly, or wait a day.

## Tokens

Colour
: `--cy-bg` `--cy-surface` `--cy-text` `--cy-heading` `--cy-neon-cyan`
  `--cy-neon-pink` `--cy-neon-purple`

Status
: `--cy-success` `--cy-warning` `--cy-danger` `--cy-info`

RGB channel twins
: `--cy-cyan-rgb` `--cy-pink-rgb` `--cy-purple-rgb` `--cy-success-rgb`
  `--cy-warning-rgb` `--cy-danger-rgb`

Geometry
: `--cy-radius-sm` `--cy-radius` `--cy-radius-lg` `--cy-border-width`

Spacing (4px scale)
: `--cy-space-xs` `--cy-space-sm` `--cy-space-md` `--cy-space-lg`
  `--cy-space-xl`

Focus
: `--cy-focus-width` `--cy-focus-offset` `--cy-focus-color`

Type
: `--cy-font-body` `--cy-font-display` `--cy-font-mono`

Scrim
: `--cy-backdrop` — the modal backdrop, a finished `rgba()` rather than a hue
  plus a twin, because the alpha *is* the value and nothing fades it further.
  Deliberately **not** derived from `--cy-bg`: a scrim pushes the page behind
  it away, so it stays dark in both themes. Tying it to `--cy-bg` made the
  light theme wash near-white over near-white and separate nothing.

Other
: `--cy-ease` `--cy-disabled-opacity`

Every translucent glow in the kit is `rgba(var(--cy-*-rgb), α)` — `color-mix()`
is deliberately not used, for reach. So **a new colour token needs its `-rgb`
twin** or nothing can fade it.

## Components

**Effects** — `.cy-glow` (`--pink`, `--purple`), `.cy-text-glow` (`--pink`),
`.cy-glitch`, `.cy-scanlines`, `.cy-grid-bg`, `.cy-cursor`

**Button** — `.cy-btn` with `--secondary` `--danger` `--pink` `--sm` `--lg`,
plus disabled styling

**Card** — `.cy-card`

**Forms** — `.cy-field` `.cy-label` `.cy-input` (`--sm` `--lg`; also styles
`select.cy-input` and `textarea.cy-input`) `.cy-checkbox` `.cy-radio`
`.cy-hint` `.cy-error`

**Containers** — `.cy-accordion` + `.cy-accordion__body` (on `<details>`;
styles `summary` scoped to the wrapper), `.cy-modal` (on `<dialog>`, with
`::backdrop`), `.cy-terminal` + `.cy-terminal__bar` (styles a scoped `<pre>`)

**Feedback** — `.cy-alert` (`--success` `--warning` `--danger` `--info`),
`.cy-toast` (`--success` `--warning` `--danger`), `.cy-toast-container`
(`--bottom`), `.cy-badge` (`--success` `--warning` `--danger` `--outline`),
`.cy-spinner`, `.cy-progress`, `.cy-sr-only`

**Navigation** — `.cy-nav` + `.cy-nav__brand` (current item styled from
`[aria-current]`, never a modifier class), `.cy-breadcrumb`

**Table** — `.cy-table` (`--striped` `--compact`), `.cy-table-scroll`

## Conventions

- **`cy-` prefix on every class.** Modifiers are `--variant`. A `__element`
  child only where one is unavoidable — `.cy-accordion__body` (no readable
  selector means "everything that is not
  the summary"), and `.cy-terminal__bar`. Where a native child *can* carry the
  style it does, scoped to the wrapper: `.cy-accordion > summary` and
  `.cy-terminal > pre` keep the consumer's markup contract to one class.
- **Opt-in classes only.** Never style a bare `input {}` or `button {}` — that
  hijacks every control on a consumer's page the moment they import the kit.
- **Style the native element.** `appearance: none` on the real control, never
  the hidden-input-plus-styled-span pattern: the input stays the focusable,
  screen-reader-announced element and we simply paint it. No JavaScript ships,
  ever — if a component needs behaviour, it is built on `<dialog>`,
  `<details>`, or an existing native element.
- **Light theme** is `:root[data-theme="light"]`.
- **`:user-invalid`, not `:invalid`** — `:invalid` matches empty required
  fields before the user types, so forms load pre-shouting in red.
  `[aria-invalid="true"]` is the hook for JS-driven validation.
- **Focus rings are shared and non-negotiable.** Disabled styling scopes
  `outline: none` to `:disabled` only; `[aria-disabled]` elements are still
  focusable and must keep their ring (WCAG 2.4.7).
- `@media (prefers-reduced-motion: reduce)` disables transitions.
- Prefer additive changes. Pre-1.0, but the author's portfolio pins an exact
  version over CDN, so breaking changes cost a coordinated update.

## Accessibility floors

Two scripts run in CI and fail the build on regression. Both are dependency-free,
like the package.

`scripts/check-contrast.js` is **role-aware**: 4.5:1 for tokens that render as
text, 3.0:1 for non-text UI (`--cy-neon-purple` is glow-only and clears 4.5 in
neither theme).

`scripts/check-conventions.js` enforces the rules in this file that a generic
CSS linter cannot know: that every `-rgb` twin exists and agrees with its base
colour about being themed, that class names match `cy-block__element--modifier`,
that no selector styles a bare element without a `cy-` class scoping it, that
every stylesheet is wired into both the barrel and the `exports` map, and that
the docs only name classes and tokens which exist.

`scripts/check-visual.js` is the third, and the one that is **not in CI**:
it drives ego-browser, which is a desktop browser GitHub's runners cannot
start. It captures one PNG per demo section, compares each against
`docs/baselines/`, and reports the bounding box of anything that moved.

Run it before releasing, and after any CSS change you believe is invisible:

```sh
npm run check:visual              # compare
npm run check:visual -- --update  # re-record, after an intended change
npm run check:visual -- --report  # print every region's diff without failing
```

Three things make a capture reproducible, and all three are required: every
animation and transition frozen, `deviceScaleFactor` pinned to 1 (this machine
captures at 2x, so an unpinned baseline is not portable), and web fonts
confirmed applied before shooting — the run aborts rather than baseline a page
rendered in fallback fonts.

Even so, captures **settle** rather than being trusted first time. Each region
is shot twice and only a matching pair is compared. That came from measurement:
27 of 28 region-runs were pixel-identical, and the one that was not repeated
the *same* 1181 pixels later, which is a second discrete state rather than
noise. Loosening the tolerance would have hidden a real 1181-pixel change to
buy off a flake.

The comparison runs in the page through a canvas, so nothing on the Node side
decodes an image and the tools stay dependency-free. Baselines total ~160 kB.

Two known limits. The sticky topbar and the fixed toast container are hidden
during capture, because a floating element makes a region's picture depend on
scroll position — so `.cy-toast` is not covered. And the whole check is
local-only, which is why it is not part of `npm run check`.

**Stylelint was tried first and rejected on evidence.** Against this codebase it
reported 123 problems and zero bugs — it wanted `rgb()` over `rgba()`, which is
the kit's entire glow mechanism, `#f0f` over `#ff00ff`, which `check-contrast.js`
parses, and no blank lines between token groups. `selector-class-pattern`, the
one rule worth having, found nothing, because that convention has never been
broken. The cost would have been 103 packages, a lockfile and a CI install step.

It checks **tokens against backgrounds only**. It cannot see a component's
colour *pairings* — a hardcoded `color: #000` on `.cy-btn:hover` sat at 3.62:1
and shipped, because no token was involved. Check pairings by hand.

### `prefers-contrast: more`

A lift, and most of it happens in `tokens.css`, because raising a token reaches
every rule that consumes it. Body text goes to the extreme of each theme
(12.95:1 → **19.78:1** dark, 9.88:1 → **15.85:1** light), borders go to 2px,
focus rings to 3px, and `--cy-disabled-opacity` rises from 0.45 to 0.7 —
"disabled" is still carried by the cursor, the styling and the semantics, so
dimming it toward invisible was never doing that work alone.

What cannot be lifted centrally is the borders: each uses its own alpha
(`rgba(var(--cy-cyan-rgb), 0.2)` through `0.6`), and those values are not
interchangeable, so **every file raises its own to full strength**. The hint
and placeholder opacities go to 1 — they sit at the lowest value that clears
4.5:1, and clearing the floor is the minimum rather than the goal.

### `forced-colors: active`

A surrender, not a lift. The user's palette replaces the kit's, and the only
job left is making sure **no affordance was being carried by colour alone**.
Three were:

- **The spinner.** Its entire animation reads because three borders are faint
  and the fourth is bright. Forced colours rewrites every `border-color` to the
  same value, turning a spinning arc into a static ring — nothing looks broken,
  it just silently stops saying "working". Now `GrayText` against `CanvasText`.
- **The checked checkbox and radio.** The tick is knocked out in `--cy-bg` and
  the radio's dot is a `background-image`. Forced colours rewrites
  `background-color` but **not** `background-image`, and forces the tick's
  border to the same colour as its fill — so the checkbox would become a solid
  block with an invisible tick and the radio would keep a cyan dot the user
  asked not to see. Both now use the system's `Highlight` / `HighlightText`
  pair, and the radio drops its dot for a solid fill.
- **The progress fill.** A gradient, so forced colours ignores it and it would
  keep its cyan-to-pink while everything around it changed. Pinned to
  `Highlight` on both code paths.

Decoration is removed rather than left to the UA, because two of the properties
involved are not forced at all: `text-shadow` (a cyan glow can survive under
forced text and muddy it) and `background-image` (the grid and the scanline
veil would keep painting over recoloured content). The scanline overlay is the
worst of them — a translucent black wash on top of the text, which is a direct
contrast *reduction* applied to someone who asked for more.

**State signals must not depend on `box-shadow` here.** Shadows are unreliable
in this mode; that is why the radio's checked dot became a fill rather than an
inset shadow.

**Verification status, stated plainly:** `prefers-contrast` was verified by
applying the same declarations unwrapped and measuring the computed result.
`forced-colors` was **not** verified visually — it needs Windows High Contrast
Mode, which is not available here. What was confirmed is that both media
blocks parse and are live in the CSSOM, that every selector in them matches a
real element in the demo, and that every system colour keyword used is
supported. The reasoning above is sound but unproven on a real forced-colors
display, and should be treated that way until someone looks.

## CI and releasing

- `ci.yml` on PRs: contrast check, then `npm pack --dry-run`. Deliberately
  **not** `npm publish --dry-run` — that contacts the registry and fails on
  any already-published version, which would break every PR.
- `release.yml` on a `v*` tag: `npm publish --provenance` (SLSA attestation),
  mirror to GitHub Packages (`continue-on-error`), cut a GitHub Release.

  It also takes a **manual run** — Actions → Release → Run workflow — with the
  tag typed into a form. That exists because a tag push is a *single event*:
  when Actions is down as the tag lands, no run is ever created, and the only
  other way back in is deleting and re-pushing the tag. v0.5.0 was tagged
  during an Actions outage and needed exactly that. The manual path publishes
  an existing tag; it never publishes from a branch.

To release: merge the PR, then

```sh
git checkout main && git pull
npm version patch   # or minor
git push --follow-tags
```

To confirm the release landed, ask npm — `npm view @laddtnov/cyberpunk-ui
version`. A bare `pnpm add` or `yarn add` will report the *previous* version
for the first 24 hours because of the release cooldown described above, which
looks exactly like a failed publish and is not one.

`main` is protected, so feature work goes through a PR. The version-bump
commit lands on `main` directly.

## Verifying in a browser

A `file://` snapshot cannot execute JavaScript, so computed-style checks need
the demo served over HTTP:

```sh
python3 -m http.server 8085 -d .
# then open http://localhost:8085/demo/index.html
```

Two traps worth knowing:

- **Anything with a `transition` reads stale right after you change it.** This
  used to be written down as a theme-toggling problem, which undersold it —
  the theme switch is simply the most obvious case. It is really any
  transitioned property measured before the tween has finished, and almost
  everything in this kit transitions something.

  It produces false failures that look exactly like real ones. Three in one
  sitting while building `containers.css`: the accordion chevron read `45deg`
  when open (the `[open]` rule *was* applying — `rotate` was mid-tween), and
  the summary's colour read the dark-theme cyan in light mode twice, because
  `color` is transitioned too.

  Measuring "in a separate step" is not always enough, since a step can still
  land inside the 0.2s window. When a value looks wrong, **prove it before
  believing it**: inject `transition: none !important` for that selector and
  read again. If it changes, the CSS was right and the clock was wrong. The
  cheaper habit is to write the check against a non-transitioned property
  where one exists — the open accordion's `border-bottom-color` was correct
  every time the chevron lied.

- The portfolio demo registers a service worker that serves stale HTML.
  Unregister it and clear caches before trusting anything you see.

## Known debt

- **The `<select>` arrow colour is baked into two data-URI SVGs** in
  `forms.css` (dark and light) and must be hand-synced whenever
  `--cy-neon-cyan` changes. `mask-image` was tried so the arrow could take
  `background-color` directly, and reverted: masking a bare `<select>` clips
  its entire painted box, and the kit's markup contract offers no wrapper
  element to scope the mask to.
- ~~**Two code paths for progress.**~~ Resolved in 0.5.0 by removing
  `.cy-progress__fill`; only the native `<progress class="cy-progress">`
  remains. The ledger against the div path had four entries by the end — a
  Sonar rule for its `role="progressbar"`, a pair that read as a rendering
  duplicate when shown beside the native bar, a silent visual drift where its
  trailing edge was square while the native one was round, and no demo coverage
  once the duplicate was taken back out — against a benefit no consumer ever
  asked for.

  The deciding argument was not the ledger, though. Correct use of that path
  required a `progressbar` role, three `aria-value*` attributes and a name:
  four things the kit could not enforce, each of which produces no visual
  symptom when omitted. A component whose failure mode is "looks perfect,
  announces nothing" is one the kit should not ship.

- **Two validation paths, and they are easy to confuse.** `:user-invalid` is
  CSS-only and stays quiet until the user has interacted;
  `[aria-invalid="true"]` is the hook for JS-driven validation and applies the
  instant it is set. The demo's Email field hardcodes `aria-invalid`, so it
  renders red on load *by design* — it is the static showcase, and it never
  matches `:user-invalid`. The **Relay address** field carries no
  `aria-invalid` and exists specifically to exercise the CSS-only path. Adding
  `aria-invalid` to it would silently retire that coverage.
- **Firefox is fully verified**, on macOS, against the demo page — first pass
  at 0.2.1, completed at 0.2.2. **Nothing has ever needed fixing for Gecko.**

  Confirmed painting: `appearance: none` on input / select / textarea (the
  custom select arrow renders, with no native arrow beside it), the checkbox
  `::after` tick, the radio dot, the native `<progress>` including
  `::-moz-progress-bar`, `[aria-invalid="true"]`, `:user-invalid` (cyan on
  load, red after blur), alerts, badges, spinner, toast, glow and disabled
  styling.

  Also confirmed, in the second pass: **the light theme**, including the
  `select` arrow — the one item here with real risk, since its colour is baked
  into a per-theme data-URI (see the debt entry above) and a desync would show
  as a cyan arrow on a light background. It renders teal, so the two SVGs are
  in sync. And the **glitch, scanline, grid and cursor effects**, which animate
  correctly.

  This retired a wrong assumption rather than confirming one. The kit used to
  say Gecko cannot generate pseudo-elements on replaced elements, and that the
  checkbox tick was therefore at risk. It is not: `appearance: none` makes the
  input non-replaced, and the tick renders. `forms.css` carries the correction
  inline so it does not get re-derived.

  **Nothing is left unseen in Gecko.** Safari confirmed; Chromium confirmed.
  All three engines now render the kit as designed, so a regression here would
  be new work rather than an unknown — which is the case for item 5's visual
  regression, not for another manual sweep.
- ~~`::-webkit-progress-value` / `::-moz-progress-bar` carry a `transition`
  that does not actually animate.~~ Removed. The div path animates because
  `width` is a real style on a real element; a native `<progress>` derives its
  bar length from the element's value, which neither engine transitions. The
  matching `transition: none` overrides in the reduced-motion block went too,
  having nothing left to cancel.

## Next up — v0.3

Scoped, not started:

- **Containers** — modal on `<dialog>`, accordion on `<details>`/`<summary>`,
  and a **terminal / code window**, the strongest differentiator of the three.
- **Navigation and data** — top nav bar, breadcrumb, data table.

`ROADMAP.md` carries the rest: what comes after v0.3, what is blocked on an
accessibility decision, and what has been ruled out.
