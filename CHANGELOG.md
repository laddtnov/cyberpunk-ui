# Changelog

All notable changes to this project are documented here.
This project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.9.0] — 2026-09-10

### Added
- **`.cy-popover` — a toggle-tip**, and the answer to a tooltip request that
  had been declined since 0.3.0. The objection was never effort: a CSS-only
  tooltip fires on `:hover`, so keyboard users, touch users and screen readers
  are all excluded, and no amount of CSS fixes that.
  - The Popover API removes the objection instead of working around it. The
    trigger is a real button — focusable, activatable by Enter and Space — and
    **the browser reports its expanded state in the accessibility tree with no
    ARIA in the markup**. Measured rather than assumed: the invoker exposes
    `expanded=false` closed and `expanded=true` open, while the DOM attribute
    stays null. Escape, light-dismiss and the top layer come free.
  - It shipped now because `popover` reached Baseline in **January 2025**
    (Chrome 116, Firefox 125, Safari 17). It stays a *toggle*-tip: a hover
    version needs interest invokers, which are Chrome-only, and hover-only is
    the failure this replaces.
  - Anchored to its trigger where CSS anchor positioning exists, centred in the
    viewport everywhere else — an `@supports` enhancement, because anchor
    positioning is still Chrome-only.
  - The convention checker caught the first draft styling a bare
    `[popovertarget]`, which would have claimed every popover trigger on a
    consumer's page. Scoped to `.cy-btn[popovertarget]`.

### Documented
- **Tabs stay declined, and now say what to use instead.** `<details name>`
  makes a group exclusive — one panel open at a time, which is what most people
  reach for tabs to get — and has been Baseline since September 2024. Real tabs
  need `role="tablist"`, roving `tabindex` and arrow-key navigation; none of it
  is expressible in CSS, and the CSS-only imitations announce a control as
  something it is not.
- **`forced-colors` has had an emulated pass**, and the result is recorded
  along with what it does not prove. Every component resolves to system colours
  as intended: `LinkText` for buttons and current-nav items, `CanvasText` for
  text and borders, `Highlight` for the progress fill, and the spinner keeps
  two distinct border colours so its rotation stays visible.
  - Two findings that pass but are worth knowing: translucent tints survive as
    system colours at low alpha (a card's 3% wash becomes 3% of Canvas over
    Canvas — invisible rather than wrong), and the four alert variants become
    indistinguishable, which is inherent to the mode and why the docs require
    `role="alert"`.
  - **This does not close the item.** Emulation approximates one theme; real
    Windows High Contrast ships several, and Firefox and Edge map them
    differently.

## [0.8.0] — 2026-09-10

### Removed
- **The seven `--cy-*-rgb` twin tokens.** `--cy-cyan-rgb`, `--cy-pink-rgb`,
  `--cy-purple-rgb`, `--cy-gold-rgb`, `--cy-success-rgb`, `--cy-warning-rgb`
  and `--cy-danger-rgb` are gone.

  **Migration:** if you overrode a hue you had to override its twin as well, or
  the glows kept the old colour. Now there is nothing to keep in sync — delete
  the twin and keep the hue:

  ```css
  /* before */                        /* after */
  :root {                             :root { --cy-neon-cyan: #39ff14; }
    --cy-neon-cyan: #39ff14;
    --cy-cyan-rgb: 57, 255, 20;
  }
  ```

  If you overrode *only* twins and never the hues, those overrides now do
  nothing and the kit will render its own colours.

### Changed
- **Glows are `color-mix()` instead of `rgba()` on a raw channel triplet.** All
  72 call sites moved from `rgba(var(--cy-cyan-rgb), 0.5)` to
  `color-mix(in srgb, var(--cy-neon-cyan) 50%, transparent)`, which reads the
  colour token directly.
  - The twins existed because `color-mix()` was not safe to rely on. It reached
    Baseline in 2023, so the reason expired; **the floor is now Chrome 111,
    Safari 16.2, Firefox 113.**
  - Equivalence was measured, not assumed: `rgba(0, 242, 255, 0.25)` and
    `color(srgb 0 0.94902 1 / 0.25)` are the same colour by two computed
    representations (0.94902 × 255 = 242).
  - This deletes more than it adds — the twin declarations, the checker rule
    that policed them, the playground's `hexToRgb` helper and its twin-writing
    branch, and the "colours come in pairs" warning from four documents.
    84 lines out, 19 in.

### Fixed
- **The visual check retries six times instead of three.** Moving to
  `color-mix()` gave the page a second stable rasterisation — both states
  repeat exactly, so matching a baseline became a question of how many tries it
  takes to see the right one rather than of loosening what counts as a match.
  Three consecutive clean runs after the change.

### Fixed
- **The contrast check only tested the easier background.** Every text token was
  measured against `--cy-bg` and nothing was measured against `--cy-surface` —
  which is what every card, terminal, toast, modal, sidebar and input actually
  puts text on, and which is the tighter of the two in both themes (lighter
  than the page in dark, white in light). It now checks both: 36 pairings
  instead of 18.
  - Nothing failed. The gap was in coverage, not in the palette; the worst
    pairing on surface is `--cy-neon-purple` at 3.36 against a 3.0 UI floor.
  - This was found the hard way once already: when `.cy-sidebar` landed, its
    current-item cyan had to be measured against `--cy-surface` by hand, and
    the number ended up in a commit message where nothing could re-check it.
  - Proven by mutation — darkening `--cy-surface` to `#6b1a1a` fails three
    tokens on surface while every one of them still passes against the page.

## [0.7.0] — 2026-09-10

### Added
- **`@layer cyberpunk-ui`.** Every rule now ships inside a cascade layer, so a
  consumer's unlayered rule beats the kit at any specificity — overriding needs
  no `!important` and no longer selector than the one you would write anyway.
  Verified in a browser: a plain `.cy-btn { color: … }` in a consumer stylesheet
  wins against the kit's own `.cy-btn`.
  - The wrapper goes in each file rather than around the bundle, so anyone
    cherry-picking `@import ".../forms"` gets the same cascade as anyone
    loading the whole kit.
- **`data-theme="auto"`** follows `prefers-color-scheme`. The full matrix, all
  eight cases measured in a browser: no attribute is always dark, `auto`
  follows the OS, and `light`/`dark` win over whatever the OS says.
  - **It is opt-in on purpose.** `prefers-color-scheme: light` matches when a
    visitor has expressed *no* preference, not only when they have chosen
    light. The first version keyed off the absence of `data-theme`, which the
    probe showed would flip the kit to light for `no-preference` users too —
    silently restyling every site already using it. `auto` is static markup, so
    it still costs no JavaScript.
  - The light palette is declared twice, because a media query cannot join a
    selector list. `check-conventions.js` now compares the two blocks
    declaration by declaration; proven by mutation.

### Changed
- **Directional properties are logical**, so the kit mirrors under `dir="rtl"`
  with no second stylesheet: alert and toast accent bars, the sidebar frame and
  its current-item marker, the nav brand spacer, the accordion chevron's
  position, and table alignment. Measured under `dir="rtl"`: the alert's 3px
  accent moves from the left edge to the right.
  - Two things stay physical deliberately. The `<select>` arrow, because
    `background-position` has no inline-axis keyword — it gets a `[dir="rtl"]`
    rule instead. And the rotated-border glyphs for the checkbox tick and the
    accordion chevron, which are shapes rather than layout: mirroring those
    would flip the drawing.
  - No visual change in left-to-right: all seven visual-regression regions
    match baselines recorded before any of this landed.

### Changed
- **`cyberpunk-ui.css` is one concatenated stylesheet instead of eight
  `@import` lines.** The barrel was the right shape for a bundler and the wrong
  one for a browser: fetched over a CDN it was 276 bytes, and the eight imports
  inside it could not be discovered until that response landed and parsed. One
  `<link>` cost **nine serialised, render-blocking round trips** — on the
  no-build-step path the README recommends, to the audience least able to work
  around it. It is now a single request: 63.5 kB raw, 16 kB gzipped.
  - Rendering is unchanged, and that is measured rather than assumed: the seven
    visual-regression regions all match baselines recorded before the change.
  - Bundler users are unaffected either way — webpack, Vite and friends inline
    `@import` at build time. Cherry-picking is unaffected too; every part still
    ships as its own file and its own `exports` subpath.
  - No minifier and no dependency: concatenation is the whole build, and
    jsDelivr already serves a clean-css copy at `/cyberpunk-ui.min.css`.
- **The convention checker's wiring rule follows.** "Wired in" used to mean an
  `@import` in the barrel; it now means membership of `PARTS` in
  `scripts/build-bundle.js`, which `check-conventions.js` reads from that file
  so the list has one home. Both halves were proven by mutation: an unlisted
  stylesheet fails the check, and an edited part with a stale bundle fails
  `check:bundle`.

### Removed
- **`docs/superpowers/`** — the v0.2 implementation plan and design spec,
  1,505 lines between them, against 1,610 lines of shipped CSS. The plan was a
  checkbox list ending at version 0.2.0 and describing growth "from 2
  components to 11"; the kit is at 0.6.2 with 60 classes. A finished checklist
  is not a record, and CHANGELOG.md already holds what shipped. Git history
  holds the rest.
- **`id="pg-note"`** in the demo playground, referenced by nothing — no CSS, no
  script, no `aria-*`. The only dead attribute of the demo's 33 ids.

### Fixed
- **The STATE.md line-count table had drifted** where 0.6.0 added the gold
  tokens and `--cy-font-terminal`: `tokens.css` read 146 against an actual 164,
  and the total read 1,592 against 1,610. Recomputed from `wc -l`.
- **STATE.md listed three of the four dev scripts**, omitting
  `scripts/visual-agent.mjs` — the browser half of the visual check, and half
  its code.
- **The package-manager matrix now says which era it measured.** Its rows read
  "all 6 stylesheet subpaths" where there are eight today. The numbers are left
  as measured — the run happened on 2026-07-31 against 0.2.1, which shipped
  exactly six, confirmed against the `exports` map at that commit. Re-wording a
  record of a test nobody re-ran would claim evidence that does not exist, so
  the table gained a note about when it was taken and when to re-run it.

## [0.6.2] — 2026-08-13

### Changed
- **The support button moved above the fold**, from the bottom of the README to
  directly under the live-demo link in the header block. A link at the foot of a
  400-line file is a link nobody reaches.
  - It is the official Buy Me a Coffee button image rather than a seventh
    shields badge, which was the first attempt and the wrong one: last in a row
    of six flat badges is barely more visible than the bottom of the file.
  - The PNG is deliberate over the SVG that `button-api` serves, which could
    have matched `--cy-neon-gold`. GitHub proxies README images through camo and
    does not reliably render externally hosted SVG, so the on-palette version
    risked rendering nothing at all.

## [0.6.1] — 2026-08-13

### Added
- **Support links.** `.github/FUNDING.yml` puts a Sponsor button on the
  repository, a `funding` field in `package.json` gives npm a Funding link and
  makes the project visible to `npm fund`, and the README and demo each carry
  one link. Four places, one URL, no CSS involved.

### Changed
- **The README leads with what the kit renders**, not with how to install it.
  It opens on a complete copy-paste page — CDN link, fonts, glitching headline,
  grid, scanlines, card, progress bar, buttons — which was tested by extracting
  it verbatim and loading it against the live CDN. That test caught a missing
  Rajdhani in the font link, which would have dropped body text to `system-ui`
  for anyone who copied it.
  - Fixes a filing error: `.cy-nav`, `.cy-breadcrumb`, `.cy-sidebar` and
    `.cy-table` were documented under Feedback (`feedback.css`). They live in
    `navigation.css` and `table.css`.
  - Documents the theming trap: colours come in pairs, and overriding
    `--cy-neon-cyan` without `--cy-cyan-rgb` leaves every glow on the old hue.

### Fixed
- **The visual check compared the wrong thing.** Each region was captured until
  two attempts agreed, which proves the page is quiet rather than that it
  matches — so a settled pair could land on the wrong rasterisation and report
  a change that was not one. It now takes up to three captures and compares
  each against the baseline, passing on the first exact match.
  - The page has **two rasterisations of identical content**, found by diffing
    the states rather than counting them: rows 315 and 321 at 575 pixels each
    (the top and bottom edge of the progress fill, 575 being its 66% value),
    plus a few pixels on the alert accent borders where success green lands on
    `82,254,153` in one state and `80,246,149` in the other.
  - Detection is unaffected, and that was verified rather than assumed:
    reintroducing the square progress edge fails all three attempts and is
    reported as `1156 px (max delta 150) at 581x7+0+315`. Widening the
    tolerance would have had to swallow a max delta of 59, against a real
    regression at 150.

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
