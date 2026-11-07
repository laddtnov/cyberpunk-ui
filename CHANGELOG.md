# Changelog

All notable changes to this project are documented here.
This project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Removed
- **The GitHub Packages mirror step.** It had been failing with
  `npm error code ENEEDAUTH` and nobody noticed, because it was
  `continue-on-error` — the job stayed green and the only trace was an
  annotation on the run. Its own comment already conceded it was "NOT a
  usable install channel", since GitHub Packages demands authentication even
  for public packages, so it could only ever produce a false annotation or a
  false sense of a second channel. npmjs.org was always the canonical
  registry and the only one carrying the provenance attestation.
  - The `packages: write` permission went with it.
  - No consumer-facing change; nothing about installing the package differs.

## [0.11.1] — 2026-11-07

**No consumer-facing change.** `files` ships `*.css`, `README.md` and
`LICENSE`, and none of them differ from 0.11.0 — the tarball is identical
apart from the version. This release exists so the tooling work below sits
behind a tag rather than drifting as unreleased work on `main`.

### Fixed
- **The visual check no longer needs a retry to pass.** An unchanged region
  can produce more than one byte-identical picture, and nothing in the DOM
  says which one is coming: measured at the moment of capture, the content
  region alternated between exactly two rasterisations on a strict period of
  two with identical `scrollY` (2808), `document.scrollHeight` (3708),
  bounding rect (top 384.6796875, height 451.15625) and device pixel ratio.
  `--update` now records every distinct phase a region produces, and a capture
  matching any of them passes. Four of the eight regions have two phases,
  `feedback` has three, three have one.
  - `captureBeyondViewport` is off. It was photographing offscreen tiles and
    was a real cause of a *different* instability, but the alternation
    outlives it. Ruled out by measurement, alongside the in-page canvas
    `diff()`, region order and the web-font probe.
  - Verified by mutation: `.cy-meter` reverted to the half-height-bar bug is
    caught as `9701 px differ from every one of 3 phase(s)`, and removing
    `.cy-kbd`'s inset rim as `316 px differ from every one of 2 phase(s)` —
    the latter in the same two rows where the 6-pixel noise lives.
  - `ATTEMPTS` stays at 2 and is documented as not being a retry budget.

### Added
- **`--update` rejects a blank capture.** A black frame is perfectly stable
  and compares equal to another black frame, so a broken capture looks exactly
  like a passing check. Converting the clip to viewport coordinates (CDP wants
  document coordinates) produced exactly that: every baseline re-recorded
  blank, six consecutive runs passed comparing blank against blank, and only a
  mutation probe that failed to fail revealed it. A recorded baseline holding
  fewer than eight distinct colours is now an error.

## [0.11.0] — 2026-11-07

### Added
- **`npm run check:forced-colors` — forced colours audited in a real engine,
  against the palettes Windows ships.** `scripts/check-forced-colors.js`
  drives Gecko's own forced-colors code path rather than an emulation of it,
  with the colour values of the four Windows 11 contrast themes (Night Sky,
  Aquatic, Desert, Dusk). All four pass. Local-only, like the visual check:
  it needs a desktop Firefox, which GitHub's runners cannot start.
  - Firefox enters that path when `ui.useAccessibilityTheme` is 1, and every
    system colour then comes from a `ui.*` pref. Measured with Night Sky:
    `Canvas` → `#000000`, `ButtonFace` → `#FFEE32`, `Highlight` → `#D6B4FD`,
    and a `#00f2ff` border → `#FFFFFF`. Gecko reports `prefers-contrast: more`
    as matching at the same time, so both of the kit's media blocks apply
    together — which is the real condition on Windows.
  - **It also narrowed what the kit's forced-colors rules are worth.** In
    Gecko the engine overrides author colours and strips both `box-shadow` and
    `background-image` on its own, so most of those rules are inert there.
    Proved by mutation, not argued: a transparent `.cy-card` border, a `cite`
    coloured `Canvas`, and deleting the grid and scanline `background-image:
    none` rules each changed nothing observable. They stay as a backstop for
    engines that force less.
  - The two properties forced colours leaves under author control are
    `opacity` and `forced-color-adjust`, and those assertions are live:
    dimming `.cy-card` to `opacity: 0.45` and giving `.cy-terminal`
    `forced-color-adjust: none` are both caught.
  - Reported every run and not fixable in CSS: the four alert variants render
    identically, because forced colours collapses their accent borders to one
    value. Inherent to the mode, and why the docs require `role="alert"` and
    real words rather than letting colour carry the meaning.
  - **Still not Windows.** A second engine and four palettes is not the
    hardware, where the OS supplies the colours and Edge may force less than
    Gecko. That check stays open.
- **Four native content elements, the last unstyled ones the roadmap listed.**
  All four follow the kit's native-element-first pattern — the element already
  carries the meaning, the class only paints it — and all four live in
  `components.css` rather than a new part, so the `exports` map keeps its
  shape and the package-manager matrix verified on 2026-11-07 stays valid.
  - `.cy-kbd` on `<kbd>`: a keycap, sized in `em` so it tracks the type around
    it rather than standing at one fixed size in a heading and in body text
    alike.
  - `.cy-dl` on `<dl>`: a HUD readout, gold monospace labels in a column that
    sizes itself to the longest one. Columns are assigned explicitly rather
    than left to auto-placement, so a term with several `<dd>` values stacks
    them in the value column instead of pushing the second under the label.
  - `.cy-figure` on `<figure>`: a frame replacing the UA's `1em 40px` margin,
    which indents a figure out of alignment with everything around it.
    `<svg>` and `<video>` are styled beside `<img>`.
  - `.cy-quote` on `<blockquote>`: an accent rule on the inline start, with no
    decorative `"` from `::before` — generated content is announced by some
    screen readers and not others, and a quotation already announces itself.
  - All four are covered by `prefers-contrast: more` and
    `forced-colors: active`, and the demo gains a `Content` section with its
    own visual-regression baseline.

### Fixed
- **README's headline figures were stale, one of them since 0.8.0.** It
  claimed 38 design tokens; 0.8.0 deleted the seven `-rgb` twins, so the real
  count is 31. The CSS size was given as 63 kB against an actual 87 kB
  (21 kB gzipped). Both measured rather than adjusted.
- **A baseline could depend on the total height of the demo page.** A scroll
  aimed at a region near the end of the document is clamped to
  `scrollHeight - innerHeight`, which is fractional whenever the document
  height is — the last section landed on 2316.5 rather than its own 2764, and
  a half-pixel offset rasterises a whole region differently from an integer
  one. Appending the `Content` section moved the clamp and `feedback` reported
  22850 changed pixels for a change that added no CSS to it. `capture()` now
  floors the offset.
- **The visual check's `FREEZE` now de-promotes layers rather than only
  hiding them.** The demo's topbar is `position: sticky`, and a sticky element
  gets its own compositing layer once the page is actually scrolled. That
  changed how the glow halos beside it rasterised: `buttons` had been stable
  to the byte for weeks, then began alternating between two states — 10124
  pixels, diffuse, deltas of 3 to 6 across 108 rows — as soon as captures
  started scrolling. It is given `position: static`, which keeps its box in
  normal flow so no layout moves; the fixed toast container is removed.
  - Honest remainder: the `.cy-glow` halos in `buttons` still occasionally
    alternate, as do a dozen pixels in `feedback` and `content`. Four
    consecutive runs passed, but the spare attempt is doing real work rather
    than sitting unused. `ATTEMPTS` stays at 2 — the states alternate rather
    than landing at random, and raising it again would be treating the
    symptom.
- **The visual regression check was photographing offscreen tiles, and that is
  why it cried wolf.** `Page.captureScreenshot` with `captureBeyondViewport`
  rasterises content below the viewport off the fast path, and that path is not
  deterministic. Only the two deepest regions ever failed — `forms` at document
  y=2034 and `feedback` at y=2764, against a 900px viewport — while the five
  above them were stable to the byte across sessions and days.
  `scripts/visual-agent.mjs` now scrolls each region into view before capturing
  it, which makes it live viewport content.
  - Found by measurement after two releases of guessing. `--update` re-recorded
    `feedback` and produced bytes *identical to the baseline taken two days
    earlier*, while the comparison run captured something 32 px different on
    every attempt, with the clip rectangle and scroll offset identical in both.
    Hashing each capture showed three rasterisations of that one region, the
    comparison loop alternating between two of them on a period of two. Region
    order made no difference, ruling out the canvas the diff builds in the page.
  - The 32 px were all antialiasing: one row of each of the four alerts' left
    accent borders (`19,28,28` → `72,137,117`) and the rounded corners of
    `<progress>` and `<meter>` at deltas of 3 to 17.
  - Three consecutive runs now pass with one capture per region and no retries,
    so `ATTEMPTS` drops from 6 to 2. The retries were never the cure, and six of
    them hid the evidence by printing the same pixel count six times.
  - Verified by mutation: reverting `.cy-meter`'s
    `::-webkit-meter-inner-element` from `display: flex` to `block` — the real
    half-height-bar bug 0.10.0 fixed — is reported as
    `9702 px (max delta 221) at 880x48+0+338`, the meter's exact box, with the
    other six regions still passing.
  - `docs/baselines/containers.png`, `forms.png` and `feedback.png` re-recorded
    under the new capture conditions. No CSS changed.
- **The 24-hour cooldown advice was wrong for Yarn.** README and
  `docs/STATE.md` both said naming an exact version skips pnpm's and Yarn's
  supply-chain gate. That is true of pnpm and false of Yarn 4, which refuses a
  quarantined version however it is asked for:
  `YN0016: All versions satisfying "0.10.0" are quarantined`. The escape is
  `--npmMinimalAgeGate 0`, or `npmMinimalAgeGate: 0` in `.yarnrc.yml`.
  - Measured on 0.10.0's release day rather than reasoned about: pnpm unpinned
    installed 0.9.0, pnpm pinned installed 0.10.0, Yarn pinned installed
    nothing.

### Documented
- **The package-manager matrix is re-verified against 0.10.0.** The previous
  run was against 0.2.1, when the kit was six stylesheets wired with
  `@import`; it is now one concatenated file inside a cascade layer published
  over eight subpaths, which is exactly the "shape of the `exports` map
  changed" condition STATE named as the trigger for a re-run.
  - npm 10.9.8, pnpm 11.18.0, Yarn Classic 1.22.22, Yarn Berry 4.18.1 and Bun
    1.3.14 each install the pinned version and resolve **all ten** `exports`
    entries — the eight stylesheets plus `.` and `./package.json`. Yarn Berry
    was tested under Plug'n'Play with no `node_modules` on disk.

### Changed
- **Releases authenticate with npm trusted publishing (OIDC) instead of a
  token.** `NPM_TOKEN` is gone from the publish step; npm trusts the
  short-lived identity GitHub mints for this workflow, named by the package's
  trusted-publisher configuration on npmjs.com.
  - This replaced the token path after it failed four times running. The token
    expired first — `E404` on `PUT`, which is how npm reports an auth failure
    without confirming a package exists. Replacing it produced `EOTP` on every
    subsequent attempt: a 2FA setting demanding a one-time password, which no
    CI job can ever supply. Neither failure is fixable by rotating a token
    again, which is why the token is gone rather than refreshed.
  - `--provenance` is dropped from the publish command. Trusted publishing
    generates and publishes the attestation on its own for a public repository
    and package.
  - Node moves 20 → 24, because trusted publishing requires npm 11.5.1 or
    later and Node 22.14 or later. Node 24 bundles npm 11.19.1 and has bundled
    at least 11.5.1 since 24.5.0, so nothing is installed — the workflow only
    asserts the version, because a CLI older than 11.5.1 does not fail loudly:
    it falls back to token auth and dies with the same `EOTP`.
  - **The workflow filename is now part of the release contract.** Renaming
    `release.yml`, or moving the publish step into another workflow, breaks
    publishing until the npmjs.com configuration is updated to match.

## [0.10.0] — 2026-11-05

### Added
- **`.cy-fieldset`** in `/forms`, for grouping radios and checkboxes on a
  native `<fieldset>` with a scoped `<legend>`. The kit has shipped `.cy-radio`
  since 0.2.0 with nothing to group it, and a radio group is the one control
  that is broken without a group label: each option announces its own text and
  nothing says what is being chosen. The demo had the same hole — two radios in
  a bare `<div>` — and it is fixed here too.
  - Sets `min-inline-size: 0`, because a `<fieldset>` has a UA
    `min-inline-size: min-content` that stops it shrinking inside a flex or
    grid column.
- **`.cy-meter`** in `/feedback`, on the native `<meter>` element. The gauge to
  `.cy-progress`'s task bar: `<progress>` is *this job is 60% done*, `<meter>`
  is *this quantity sits here in its range*. The browser decides which of three
  states a value is in from `low`/`high`/`optimum` and exposes each as its own
  pseudo-element, so the kit maps them to `--cy-success`, `--cy-warning` and
  `--cy-danger` — the colour follows the number with no class and no script.
  - **Chromium's inner element needs `display: flex`.** With `block` the
    coloured bar paints across exactly the top half of the track at any size —
    measured at 24 of 48 device rows at 24px and 6 of 12 at the shipped 6px —
    and setting a height on the bar, on the value pseudo-elements, or on the
    inner element itself changes nothing. Only `flex` makes it stretch.
  - Firefox exposes one bar pseudo-element for every state and cannot colour
    them apart, so it takes the optimum colour there. `<meter>` requires
    fallback text, which is what carries the value in that case.

### Fixed
- **The release checks are now a gate rather than a habit.** `npm version` runs
  them through the `preversion` hook, so a failing check aborts the bump before
  any commit or tag exists.
  - This is a fix for a real miss: **v0.9.0 was tagged seconds after the visual
    check failed**, because the tag push had been chained onto a `grep` whose
    exit code said nothing about the check. The diff was the known flake and two
    re-runs passed, so the release was correct — by luck, not by the check.
  - Proven end to end rather than assumed. With a stale bundle committed,
    `npm version patch` exits 1, the version stays put, and **no tag is
    created** — which is precisely what did not happen at 0.9.0.
  - `CY_SKIP_VISUAL=1` gets past the visual half and says loudly that it
    skipped rather than passed. It exists because the browser is a dependency
    that has broken before, not as a way around a diff.
- **Documented why `git push --follow-tags` silently pushed nothing** at 0.7.0:
  it only pushes annotated tags, and a hand-made `git tag` is lightweight.
  `npm version` annotates — confirmed by `git for-each-ref`, which reports the
  object type as `tag` rather than `commit`. The routine now says not to tag by
  hand.

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
