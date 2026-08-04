# Changelog

All notable changes to this project are documented here.
This project adheres to [Semantic Versioning](https://semver.org/).

## [0.3.0] — 2026-08-04

### Added
- **Containers (`containers.css`)** — the v0.3 batch, each built on the native
  element that already owns the behaviour, so nothing new ships as JavaScript.
  - `.cy-accordion` + `.cy-accordion__body` on `<details>`. The `summary` is
    styled through the wrapper (`.cy-accordion > summary`), so the consumer's
    markup contract stays one class. Keyboard and open state are the browser's.
  - `.cy-modal` on `<dialog>`, with a blurred `::backdrop`. **Open it with
    `showModal()`, not `show()`** — only `showModal()` traps focus, wires up
    `Esc`, and renders `::backdrop` at all.
  - `.cy-terminal` + `.cy-terminal__bar`, styling a scoped `<pre>`. Composes
    with `.cy-scanlines` and `.cy-cursor` rather than reimplementing them.
- **`--cy-backdrop`** — the modal scrim. A finished `rgba()` rather than a hue
  plus an `-rgb` twin, because the alpha is the value and nothing fades it
  further. Deliberately **not** derived from `--cy-bg`: a scrim pushes the page
  behind it away, and deriving it made the light theme wash near-white over
  near-white and separate nothing.
- Subpath export `@laddtnov/cyberpunk-ui/containers`.

### Changed
- **The barrel's banner no longer carries a version number.** It read `v0.2.0`
  at 0.2.2, having drifted twice, because `npm version` does not touch it.
  Removing the number removes the drift rather than the symptom.

### Verified
- **Firefox coverage is complete.** A second pass closed the two things the
  first had not seen: the light theme and the glitch / scanline / grid effects.
  Both correct, including the `select` arrow — the only item with real risk,
  since its colour is baked into a per-theme data-URI and a desync would paint
  a cyan arrow on a light background. It renders teal. **Nothing has ever
  needed fixing for Gecko**, and all three engines are now verified.

### Docs
- **Sharpened the stale-computed-styles trap in `docs/STATE.md`.** It was
  written as a theme-toggling problem; it is really any transitioned property
  measured before the tween finishes, and almost everything in the kit
  transitions something. Building `containers.css` produced three false
  failures from it in one sitting. Now says how to prove it — inject
  `transition: none !important` and read again — and to prefer checking a
  non-transitioned property where one exists.
- **A parked section in `docs/ROADMAP.md` for type of the kit's own**, recording
  why the font tokens are already the right seam and the three constraints that
  bind anything further: a locally installed font is invisible to consumers, one
  Nerd Font is fifty to two hundred times the size of the whole package, and
  licences follow the original typeface rather than whoever patched it.
- **The licensing traps that go with it**, written down before anyone reaches
  for a font file. The kit is at zero exposure while none ships. Past that line:
  a repository's licence does not cover fonts bundled inside it, Nerd Fonts is
  many licences with per-family Reserved Font Name status, OFL cannot be
  relicensed to MIT, and OFL does not restrict documents *produced with* a font
  — which is what makes a pre-rendered SVG wordmark clean.
- Corrected a stale claim in `docs/STATE.md` that both progress paths appear in
  the demo; only the native element does.

## [0.2.2] — 2026-07-31

### Fixed
- **`.cy-progress__fill` had no `border-radius`, so its trailing edge was
  square** while the native `<progress>` bar's was round. The track clips the
  *leading* edge of both (`overflow: hidden` against its own radius), so only
  the right-hand end differed — and nothing had ever put the two paths side by
  side, so it went unnoticed. The two are meant to be interchangeable; all five
  progress radii now read `var(--cy-radius-lg)`. Visible change for anyone
  using the div path.

### Added
- **A link to the live demo, in the README.** The page has been hosted at
  <https://laddtnov.github.io/cyberpunk-ui/demo/> the whole time, deploying
  from `main` and tracking merges on its own, and the README never mentioned
  it — so it existed and nothing led anyone to it.

- **`./package.json` is now an `exports` subpath.** A package that declares
  `exports` makes everything absent from the map unreachable, and
  `package.json` was absent — so build tools and linters that read it were
  locked out. Additive; nothing that worked before changes.
- **Install instructions for npm, pnpm, Yarn and Bun**, plus downloads, CI and
  unpacked-size badges.

- **The demo shows one progress bar again**, the native element. The div +
  `.cy-progress__fill` path was added to the page so something exercised it,
  then captioned when the identical pair read as a rendering duplicate — but
  captions turned a component showcase into documentation. Both are gone; the
  second path is documented in `docs/STATE.md` instead. It did expose the
  radius defect above before it went. Demo only.

### Removed
- **The `transition` on `::-webkit-progress-value` and `::-moz-progress-bar`**,
  which never animated anything. The div path animates because `width` is a
  real style on a real element; a native `<progress>` takes its bar length from
  the element's value, which neither engine transitions. The matching
  `transition: none` overrides in the reduced-motion block went with them,
  having nothing left to cancel. No visual change in any engine.

### Verified
- **All four package managers**, against the published package rather than a
  local tarball: npm 10.9.8, pnpm 11.18.0, Yarn Classic 1.22.22, Yarn Berry
  4.18.0 and Bun 1.3.14. Every one installs the kit and resolves all six
  subpath exports — Yarn Berry does so under **Plug'n'Play**, with no
  `node_modules` on disk, which was the one real risk for an `exports`-only
  package. Nothing had to change for any manager. Matrix in `docs/STATE.md`.
- **pnpm 11 and Yarn 4 will not install a version younger than 24 hours.** Both
  default to a supply-chain cooldown (`minimumReleaseAge` /
  `npmMinimalAgeGate`, 1440 minutes) and neither errors — they quietly resolve
  to the previous release, so a bare `pnpm add` straight after publishing looks
  like a failed publish. Documented in the README and in STATE.md's release
  section. Not a defect in this package; no code change.

### Changed
- **The demo now covers both validation paths and both progress paths.** It
  previously showed only the `[aria-invalid="true"]` half of validation — on a
  field with the attribute hardcoded, which renders red on load and can never
  match `:user-invalid`, making the selector untestable from the page. A
  **Relay address** field carries no `aria-invalid` and exercises the CSS-only
  path. A div + `.cy-progress__fill` example joins the native `<progress>`,
  which was previously the only one present — marked `aria-hidden`, since it
  duplicates the native bar's value and exists to prove the div path paints.
  Demo only — no CSS changed.

### Docs
- **`docs/ROADMAP.md`** — what is not built yet, ordered by the two constraints
  that decide it (no JavaScript ships; accessibility outranks the component
  count), plus what has been ruled out and why.
- **Firefox verified** on macOS against the demo at 0.2.1, with nothing needing
  a fix. `appearance: none`, the custom select arrow, the checkbox tick, the
  radio dot, the native `<progress>` with `::-moz-progress-bar`,
  `[aria-invalid="true"]`, `:user-invalid` (cyan on load, red after blur) and
  the feedback components all render correctly. Recorded in `docs/STATE.md`;
  the light theme and the glitch / scanline / grid effects were not in frame
  and remain unseen in Gecko.
- **Corrected the rationale for 0.2.1's radio dot change.** It claimed Gecko
  does not generate pseudo-elements on replaced elements such as `<input>`.
  That rule does not apply to these controls: `appearance: none` makes the
  input non-replaced, and Firefox renders the checkbox's `::after` tick — the
  very construction the note predicted would fail. The `background-image` dot
  is kept (it needs no generated box at all, on the one control whose only
  state signal is that dot), but the reasoning is fixed in `forms.css` so it is
  not re-derived. No CSS behaviour changed.

## [0.2.1] — 2026-07-31

### Fixed
- **The radio's checked dot may not have rendered in Firefox.** It was an
  `::after` on the `<input>`, and Gecko does not generate pseudo-elements on
  replaced elements. Unlike the checkbox — which also fills solid when checked,
  so it still reads as selected — the radio had nothing else to signal state,
  making a checked radio look identical to an unchecked one. The dot is now a
  `background-image` radial-gradient, which paints on replaced elements in
  every engine. Animating `background-size` preserves the grow-in motion.

  Identical rendering in Chromium and Safari: 8.8px dot, and the colour still
  tracks `--cy-neon-cyan` in both themes (no hardcoded hex).

## [0.2.0] — 2026-07-30

### Added
- **Token substrate** — geometry (`--cy-radius-*`, `--cy-border-width`), a
  4px-based spacing scale (`--cy-space-*`), shared focus tokens
  (`--cy-focus-*`), status colours (`--cy-success|warning|danger|info`) with
  `-rgb` channels, and `--cy-disabled-opacity`.
- **Forms** (`forms.css`) — `.cy-field`, `.cy-label`, `.cy-input` (with `--sm` /
  `--lg`), `.cy-checkbox`, `.cy-radio`, `.cy-hint`, `.cy-error`.
- **Feedback** (`feedback.css`) — `.cy-alert`, `.cy-toast` +
  `.cy-toast-container`, `.cy-badge`, `.cy-spinner`, `.cy-progress` (both a
  native `progress.cy-progress` element and the div + `.cy-progress__fill`
  pair), and the `.cy-sr-only` utility.
- **Button variants** — `.cy-btn--secondary`, `.cy-btn--danger`, `.cy-btn--sm`,
  `.cy-btn--lg`, plus disabled styling.
- Subpath exports `@laddtnov/cyberpunk-ui/forms` and `/feedback`.
- `scripts/check-contrast.js` and PR CI enforcing WCAG contrast on the 8 colour
  tokens that render as text or UI (not every token — geometry, spacing, and
  font tokens have no contrast ratio to check).

### Changed
- `.cy-btn` and `.cy-card` now consume the token substrate instead of hardcoded
  values, so overriding `--cy-radius` or `--cy-space-*` reaches every component.
  Visually identical apart from slightly tighter button padding (`0.65em 1.8em`
  → `0.5rem 1.5rem`); the old em-based padding scaled with font-size and broke
  the new `--sm` / `--lg` modifiers.
- `.cy-btn` gained the shared `:focus-visible` ring used by every other
  interactive element.

### Fixed
- **Light-theme `--cy-neon-cyan` was `#008099`, which measures 4.07 against
  `--cy-bg`** — below the 4.5 AA floor for normal text. Now `#00707f` (5.10).
  Light mode renders a slightly deeper teal; no API change.
- **Demo: unlabelled disabled input** now wrapped in `.cy-field` with a
  `.cy-label`, matching every other control in the Forms section.
- **Demo: `role="status"` replaced with native `<output>`** on the polite
  alerts, the spinner, and the toast — same implicit semantics, one fewer
  attribute. `role="alert"` is unchanged on the warning/danger alerts since
  `alert` has no native-element equivalent.
- **`scripts/check-contrast.js`** — modernised to `node:` protocol imports,
  `Number.parseInt`, and optional chaining; removed a regex that could
  backtrack ambiguously while parsing `tokens.css`; split `checkTheme`'s
  per-token logic into `checkToken` to bring cognitive complexity back
  under the lint limit. Dev tooling only, not published in the package.

### Notes
- Still zero dependencies, zero JavaScript, no build step.
- Contrast floors are role-aware: 4.5 for text tokens, 3.0 for non-text UI
  (`--cy-neon-purple` is glow-only and clears 4.5 in neither theme).

## [0.1.1] — 2026-07-29
- First release published from CI with SLSA provenance. No CSS changes.

## [0.1.0] — 2026-07-29
- Initial release: tokens, effects (glow, glitch, scanlines, grid, cursor),
  `.cy-btn` and `.cy-card`.
