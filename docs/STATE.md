# Project state

What is already built, and the conventions any addition has to follow.
Current as of **0.2.1**.

`CHANGELOG.md` records what changed and when. This file records what *is* —
read it before adding a component, so nothing gets rebuilt or invented twice.

## Layout

Zero dependencies, zero JavaScript, no build step. 741 lines of CSS.

| File | Lines | Contains |
| --- | --- | --- |
| `tokens.css` | 94 | every custom property, plus the `[data-theme="light"]` overrides |
| `effects.css` | 80 | glow, glitch, scanlines, grid, cursor |
| `components.css` | 135 | `.cy-btn`, `.cy-card` |
| `forms.css` | 232 | field, label, input, select, textarea, checkbox, radio, hint, error |
| `feedback.css` | 194 | alert, toast, badge, spinner, progress, sr-only |
| `cyberpunk-ui.css` | 6 | `@import`s all of the above |

Supporting files: `demo/index.html` (the live demo — every component is
exercised there, including both progress code paths and both validation
paths, and it is the OG image source), `scripts/check-contrast.js`
(dev-only, not published), `docs/superpowers/` (specs and plans),
`.github/workflows/`.

**A new CSS file needs a matching entry in `package.json`'s `exports` map**
and an `@import` in `cyberpunk-ui.css`. Current subpaths: `.`, `/tokens`,
`/effects`, `/components`, `/forms`, `/feedback`, and `./package.json`.

That last one is not a stylesheet. Once a package declares `exports`, anything
absent from the map is unreachable — including `package.json` itself, which
build tools and linters routinely read. It is mapped explicitly so they can.

## Package managers

Verified against the **published** package, not a local tarball, on
2026-07-31:

| Manager | Version | Result |
| --- | --- | --- |
| npm | 10.9.8 | installs, all 6 subpaths resolve |
| pnpm | 11.18.0 | installs, all 6 resolve — **24h cooldown**, see below |
| Yarn Classic | 1.22.22 | installs, all 6 resolve |
| Yarn Berry | 4.18.0 | installs, all 6 resolve — under **Plug'n'Play too**, with no `node_modules` on disk. **24h cooldown** |
| Bun | 1.3.14 | installs, all 6 resolve |

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

**Feedback** — `.cy-alert` (`--success` `--warning` `--danger` `--info`),
`.cy-toast` (`--success` `--warning` `--danger`), `.cy-toast-container`
(`--bottom`), `.cy-badge` (`--success` `--warning` `--danger` `--outline`),
`.cy-spinner`, `.cy-progress` + `.cy-progress__fill`, `.cy-sr-only`

## Conventions

- **`cy-` prefix on every class.** Modifiers are `--variant`. A `__element`
  child only where one is unavoidable (`.cy-progress__fill`).
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

`scripts/check-contrast.js` runs in CI and fails the build on regression. It is
**role-aware**: 4.5:1 for tokens that render as text, 3.0:1 for non-text UI
(`--cy-neon-purple` is glow-only and clears 4.5 in neither theme).

It checks **tokens against backgrounds only**. It cannot see a component's
colour *pairings* — a hardcoded `color: #000` on `.cy-btn:hover` sat at 3.62:1
and shipped, because no token was involved. Check pairings by hand.

## CI and releasing

- `ci.yml` on PRs: contrast check, then `npm pack --dry-run`. Deliberately
  **not** `npm publish --dry-run` — that contacts the registry and fails on
  any already-published version, which would break every PR.
- `release.yml` on a `v*` tag: `npm publish --provenance` (SLSA attestation),
  mirror to GitHub Packages (`continue-on-error`), cut a GitHub Release.

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

- Toggling the theme and reading computed styles **in the same synchronous
  block** returns stale values. Measure in a separate step.
- The portfolio demo registers a service worker that serves stale HTML.
  Unregister it and clear caches before trusting anything you see.

## Known debt

- **The `<select>` arrow colour is baked into two data-URI SVGs** in
  `forms.css` (dark and light) and must be hand-synced whenever
  `--cy-neon-cyan` changes. `mask-image` was tried so the arrow could take
  `background-color` directly, and reverted: masking a bare `<select>` clips
  its entire painted box, and the kit's markup contract offers no wrapper
  element to scope the mask to.
- **Two code paths for progress** — a native `<progress class="cy-progress">`
  and a div plus `.cy-progress__fill`. A deliberate choice to support both;
  dropping `__fill` would simplify. Both are in the demo now, and measure
  identically (880px track, fill at 66.0%, matching the native `value="66"`).
  **Only the native element is in the demo.** The div path was added there so
  something exercised it, and taken out again: two bars at the same value read
  as one bar rendered twice, and captioning them turned a component showcase
  into documentation. The demo shows components; this file documents them.

  Before it was removed it earned its keep once, by exposing a drift nobody had
  noticed — the div fill had no `border-radius`, so its trailing edge was
  square while the native bar's was round. The track clips the *leading* edge
  for both, which is why it survived: only the right-hand end differed, and
  nothing had ever put the two side by side. Fixed; all five progress radii now
  read `var(--cy-radius-lg)`.

  So `__fill` is once again the one component no browser check covers, and the
  ledger against it now reads: a Sonar rule, a pair that looked like a bug, a
  silent visual drift, and no demo coverage — against a benefit no consumer has
  asked for. **Retiring it at the next breaking change is the strongest item in
  this section.** Until then it stays, and the radius fix keeps the two paths
  honest.

  The case for dropping it got stronger: SonarCloud flags `role="progressbar"`
  on the div, on the grounds that the native element is the accessible choice —
  which is the same argument this entry already made, arrived at independently.
  The div in the demo is `aria-hidden` because it duplicates the native bar's
  value, but a consumer using `__fill` for real must supply the role, the three
  `aria-value*` attributes and a label, or the bar announces nothing. **That
  burden is the argument for retiring `__fill` at the next breaking change** —
  a component whose correct use requires four attributes the kit cannot enforce
  is a component that will mostly be used incorrectly.

- **Two validation paths, and they are easy to confuse.** `:user-invalid` is
  CSS-only and stays quiet until the user has interacted;
  `[aria-invalid="true"]` is the hook for JS-driven validation and applies the
  instant it is set. The demo's Email field hardcodes `aria-invalid`, so it
  renders red on load *by design* — it is the static showcase, and it never
  matches `:user-invalid`. The **Relay address** field carries no
  `aria-invalid` and exists specifically to exercise the CSS-only path. Adding
  `aria-invalid` to it would silently retire that coverage.
- **Firefox is verified as of 0.2.1**, on macOS, against the demo page.
  Confirmed painting: `appearance: none` on input / select / textarea (the
  custom select arrow renders, with no native arrow beside it), the checkbox
  `::after` tick, the radio dot, the native `<progress>` including
  `::-moz-progress-bar`, `[aria-invalid="true"]`, `:user-invalid` (cyan on
  load, red after blur), alerts, badges, spinner, toast, glow and disabled
  styling. Nothing needed fixing.

  This retired a wrong assumption rather than confirming one. The kit used to
  say Gecko cannot generate pseudo-elements on replaced elements, and that the
  checkbox tick was therefore at risk. It is not: `appearance: none` makes the
  input non-replaced, and the tick renders. `forms.css` carries the correction
  inline so it does not get re-derived.

  **Still unseen in Gecko**, and cosmetic: the light theme, and the glitch /
  scanline / grid effects. Neither was in frame during the pass. Safari
  confirmed; Chromium confirmed.
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
