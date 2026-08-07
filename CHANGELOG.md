# Changelog

All notable changes to this project are documented here.
This project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.6.0] — 2026-08-07

### Added
- **`.cy-sidebar`** and `.cy-sidebar__title` in `/navigation` — a vertical
  section nav, the last of the components from the original roadmap worth
  building. Requires a `<ul>`, for the reason the breadcrumb requires an
  `<ol>`: it is what makes a screen reader announce a list and count through
  it, and a column of bare links looks identical while announcing as loose
  links. The current item is styled from `[aria-current]`, never a modifier
  class — the rule the rest of `/navigation` already follows.
  - **It sets no width**, deliberately. Where a sidebar sits and how wide it is
    belong to the page, not the component. It is also not sticky and not
    scrollable: a scroll container owes the keyboard a `tabindex` and a label,
    and that is a real cost to impose on every sidebar for the sake of the tall
    ones.
  - Contrast measured on `--cy-surface` rather than assumed from the token
    check, which only covers `--cy-bg`: the worst pairing is the current item's
    cyan on its own tint at 5.51:1 in the light theme, against a 4.5 floor.

- **`--cy-neon-gold`** and its `--cy-gold-rgb` twin, with `.cy-text-glow--gold`
  and `.cy-glow--gold`. A brass gold in the Deus Ex register rather than the
  neon one — `#d4af37` dark (9.41:1), `#7d5800` light (5.66:1), both
  contrast-checked as text.
  - The gold halo is **not** the neon one recoloured: 6px at higher opacity and
    a dimmer far shadow, because a warm low-saturation hue smears at the 10px
    radius that makes cyan look lit.
  - Kept distinct from `--cy-warning`, which is a pale caution yellow with a
    meaning attached. A heading painted in the status colour announces nothing
    but looks like a problem.

- **`--cy-font-terminal`**, used only by `.cy-terminal`. Names Nerd Fonts
  first — patched monospaces carrying powerline separators and file icons —
  and falls through to `--cy-font-mono`. Nothing is shipped: the patched builds
  run to tens of megabytes against a kit measured in kilobytes.
  - It is kept out of the shared mono stack on purpose. Hack is widely
    installed among developers, and putting it first there would silently
    repaint nav, badges, inputs and breadcrumb on most of their machines.
  - The fallback path is verified; the Nerd Font path is **not**. Both browsers
    available here are sandboxed away from user-installed fonts — canvas
    metrics for `Hack Nerd Font Mono` come back identical to Menlo, which is
    the fallback signature.
- **`scripts/check-conventions.js`**, running in CI alongside the contrast
  check. Enforces the rules in `docs/STATE.md` that a generic CSS linter cannot
  know: `-rgb` twins existing and agreeing with their base colour about being
  themed, class naming, no unscoped bare element selectors, every stylesheet
  wired into both the barrel and `exports`, and docs naming only things that
  exist. Dependency-free, like the package.
  - **Stylelint was tried first and rejected on evidence** — 123 problems, zero
    bugs, almost all of it house style contradicting deliberate choices. Recorded
    in `docs/STATE.md` so it is not re-proposed.
  - It found real drift on first run: the README still documented
    `.cy-progress__fill`, which 0.5.0 removed, and had never been updated to
    list the `/navigation` and `/table` imports.
  - The bare-element check now descends into at-rules. Both earlier versions of
    the prelude walk stopped at the first `{`, so everything inside `@media`
    was skipped in silence — and the reduced-motion, `prefers-contrast` and
    `forced-colors` blocks are where much of this kit's CSS lives.

- **`scripts/check-visual.js`** — region-based visual regression, driving
  ego-browser. Captures one PNG per demo section, compares against
  `docs/baselines/`, and reports the bounding box of what moved. Verified
  against the defect that motivated it: reintroducing the square trailing edge
  on the progress bar is caught as 1154 px at delta 150, located to
  `581x7+0+315` — the fill itself.
  - **Not in CI**, deliberately: ego-browser is a desktop browser and GitHub's
    runners cannot start it. It belongs to the release routine instead, and
    `npm run check` still covers what CI enforces.
  - Reproducibility needs animations frozen, `deviceScaleFactor` pinned, and
    fonts confirmed applied — the run aborts rather than baseline a page in
    fallback fonts. Captures also settle: each region is shot twice and only a
    matching pair is compared, which came from measuring 28 region-runs rather
    than picking a tolerance.
  - The diff runs in the page through a canvas, so the Node side never decodes
    an image. Baselines total ~160 kB.

### Fixed
- **README** no longer documents the removed `.cy-progress__fill`, lists all
  eight stylesheet subpaths, and its version-pin example names a current
  version rather than 0.2.2.

### Changed
- **`release.yml` can be run by hand** — Actions → Release → Run workflow, with
  the tag as an input. A tag push is a single event, so if Actions is degraded
  when the tag lands the run is simply never created; the only other recovery
  was deleting and re-pushing the tag. The tag is validated for shape and
  charset before use, and the workflow still refuses to publish anything that
  is not a version tag. No change to how a normal tagged release behaves.

## [0.5.0] — 2026-08-06

### Added
- **Navigation (`navigation.css`)** — `.cy-nav` with `.cy-nav__brand`, and
  `.cy-breadcrumb` on an `<ol>`. Links are styled through the wrapper, so the
  markup contract stays one class.
  - **The current item is styled from `aria-current`, and there is no
    `--active` modifier.** A class would allow a nav whose current item looks
    current and announces as ordinary; using the attribute makes the appearance
    and the announcement the same declaration.
  - The breadcrumb separator is `content: "/" / ""` — the empty second half is
    the alternative text, so the glyph is not read aloud. Held to the 4.5:1
    text floor anyway (0.75 opacity: 7.48:1 dark, 4.92:1 light), matching
    `.cy-hint`, because a trail with faded separators is harder to read as a
    trail.
- **Table (`table.css`)** — `.cy-table` with `--striped` and `--compact`, plus
  `.cy-table-scroll` for wide tables. Cells styled through the wrapper.
  - The scroll container is a **`<section>` with an accessible name**, not a
    `<div role="region">` — a named section already carries that role, and the
    kit prefers the element over the ARIA attribute everywhere else.
  - It keeps `tabindex="0"`: a box that scrolls only under a mouse fails WCAG
    2.1.1. Firefox focuses scrollers natively and Chrome now does too, but it
    is not universal. A linter flagging `tabindex` on a non-interactive element
    is applying a rule of thumb to which a scrollable region is the documented
    exception.
  - `scope`, `<caption>` and `<thead>` are the consumer's, and the table looks
    identical without them — which is exactly why the component page leads with
    them.
- Subpath exports `@laddtnov/cyberpunk-ui/navigation` and `/table`, plus
  component reference pages for both.
- **A live theme playground in the demo** (`demo/playground.js`) — five colour
  pickers, a radius slider and a border-width slider, plus a COPY CSS button
  that emits only what was actually changed, so a visitor leaves with a `:root`
  block to paste. Demo only; `files` has never published `demo/`, so the
  package still ships no JavaScript.
  - Every colour writes its **`-rgb` twin** alongside the hue. Writing only the
    hue recolours borders and text and leaves every glow behind — the rule was
    documented, and this is the first place it is demonstrable in one drag.
  - Switching themes **clears the overrides** and re-reads that theme's values:
    an inline style on `:root` outranks `:root[data-theme="light"]`, so an edit
    made in dark mode would otherwise pin a near-black background over the
    light theme.

### Removed
- **BREAKING: `.cy-progress__fill` is gone.** Progress is now the native
  `<progress class="cy-progress">` element only.

  It let a plain `<div>` act as a progress bar, and correct use of it required
  a `progressbar` role, all three `aria-value*` attributes **and** an
  accessible name — four things the kit could not enforce, none of which
  produce a visual symptom when omitted. A component whose failure mode is
  "looks perfect, announces nothing" is one this kit should not ship. Along the
  way it also drew a Sonar rule, read as a rendering duplicate when placed
  beside the native bar, and drifted out of visual sync with it unnoticed.

  **Migration.** In almost every case, the native element is a smaller,
  better-behaved replacement and needs no ARIA at all:

  ```html
  <!-- before -->
  <div class="cy-progress" role="progressbar"
       aria-valuenow="66" aria-valuemin="0" aria-valuemax="100"
       aria-label="Sync progress">
    <div class="cy-progress__fill" style="width:66%"></div>
  </div>

  <!-- after -->
  <progress class="cy-progress" value="66" max="100"></progress>
  ```

  Omit `value` for an indeterminate bar. If you genuinely need the div — an
  animation `<progress>` cannot express, say — `.cy-progress` still styles the
  track, and this is the rule that was removed, to paste into your own project:

  ```css
  .my-progress-fill {
    height: 100%;
    width: 0;
    background: linear-gradient(90deg, var(--cy-neon-cyan), var(--cy-neon-pink));
    box-shadow: 0 0 12px rgba(var(--cy-cyan-rgb), 0.6);
    border-radius: var(--cy-radius-lg);
    transition: width 0.3s var(--cy-ease);
  }
  ```

  Keep the role and the `aria-value*` attributes if you do; they were never
  optional.

### Docs
- **A per-component reference in `docs/components/`**, one page per subpath —
  `/effects`, `/components`, `/containers`, `/forms`, `/feedback` — because the
  subpath is the boundary consumers import, not the individual component.
  Each entry documents the markup the kit expects, the modifier classes, the
  tokens that restyle it, and the accessibility contract.
- That last section is the point. Every item in it is a way to build something
  that **looks finished and is not**: a `.cy-error` with no `aria-describedby`,
  a `.cy-spinner` with no `.cy-sr-only` label, a `<div>` where a toast needs
  `<output>`, a modal opened with `show()` instead of `showModal()`. None of
  them produce a visual symptom, so none get caught by looking.
- Records the `<select>` arrow's baked-in colour as a **consumer-facing**
  limitation rather than only internal debt: override `--cy-neon-cyan` and the
  arrow will not follow.
- README links the reference.

## [0.4.0] — 2026-08-05

### Added
- **High-contrast support**, closing the last gap in the accessibility story.
  - **`prefers-contrast: more`** — a lift, mostly absorbed by `tokens.css`
    since raising a token reaches everything that consumes it. Body text goes
    to the extreme of each theme (12.95:1 → 19.78:1 dark, 9.88:1 → 15.85:1
    light), borders to 2px, focus rings to 3px, and `--cy-disabled-opacity`
    from 0.45 to 0.7. Borders carry per-rule alphas that cannot be lifted
    centrally, so each file raises its own; hint and placeholder opacity go
    to full.
  - **`forced-colors: active`** — a surrender. The work was finding the three
    places that signalled state with colour alone and would have failed
    *silently*: the spinner (every border forced to one value turns a spinning
    arc into a static ring), the checked checkbox and radio (the tick is
    knocked out in `--cy-bg`, the radio's dot is a `background-image`, and
    forced colours rewrites `background-color` but not `background-image`),
    and the progress fill (a gradient, so it is ignored entirely). All now use
    the system `Highlight` / `HighlightText` / `GrayText` palette.
  - Decoration is removed explicitly rather than left to the UA, because
    `text-shadow` and `background-image` are not forced — the scanline veil
    would otherwise keep washing translucent black over recoloured text.
  - Follows the existing per-file `prefers-reduced-motion` precedent; no new
    stylesheet, no new export.
  - **`forced-colors` is not visually verified** — it needs Windows High
    Contrast Mode. Both blocks parse and are live, every selector matches a
    real element, and every system colour used is supported. See
    `docs/STATE.md`.

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
