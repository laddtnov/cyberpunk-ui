# Changelog

All notable changes to this project are documented here.
This project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
