# Project state

What is already built, and the conventions any addition has to follow.
Current as of **0.11.1**.

`CHANGELOG.md` records what changed and when. This file records what *is* —
read it before adding a component, so nothing gets rebuilt or invented twice.

## Layout

Zero dependencies, zero JavaScript, no build step. 2060 lines of CSS across the parts.

| File | Lines | Contains |
| --- | --- | --- |
| `tokens.css` | 199 | every custom property, plus the `[data-theme="light"]` overrides |
| `effects.css` | 133 | glow, glitch, scanlines, grid, cursor |
| `components.css` | 318 | `.cy-btn`, `.cy-card`, and the four content elements: `.cy-kbd`, `.cy-dl`, `.cy-figure`, `.cy-quote` |
| `containers.css` | 282 | accordion, modal, terminal — all on native elements |
| `navigation.css` | 277 | nav bar, breadcrumb, sidebar |
| `table.css` | 148 | data table, scroll container |
| `forms.css` | 359 | field, label, input, select, textarea, checkbox, radio, hint, error |
| `feedback.css` | 344 | alert, toast, badge, spinner, progress, sr-only |
| `cyberpunk-ui.css` | generated | all of the above concatenated, in that order |

Supporting files: `demo/index.html` (the live demo — every component is
exercised there, including both validation paths, and it is the OG image
source), `demo/playground.js` (the live token editor; demo-only, and never
published — `files` ships `*.css`, `README.md` and `LICENSE` only),
`scripts/build-bundle.js`, `scripts/check-forced-colors.js`, `scripts/check-contrast.js` (every text token
against **both** `--cy-bg` and `--cy-surface`, in both themes — 36 pairings),
`scripts/check-conventions.js`,
`scripts/check-visual.js` and its browser half `scripts/visual-agent.mjs`
(dev-only, not published), `.github/workflows/`.

The v0.2 plan and design spec that used to sit in `docs/superpowers/` were
deleted after 0.6.2. They described growing the kit from two components to
eleven and ended at version 0.2.0, so they had become a finished checklist
rather than a record — and CHANGELOG.md already says what shipped. Recover
them from git history if a decision ever needs re-reading.

`cyberpunk-ui.css` is **generated and committed** — `npm run build:css` writes
it, `npm run check:bundle` fails when a part was edited without a rebuild, and
CI runs that check first. It was eight `@import` lines until 0.6.2: correct for
a bundler, wrong for a browser, because a `<link>` fetched 276 bytes and only
then discovered eight more files to fetch in series. One request now, 63.5 kB
raw and 16 kB gzipped.

**A new CSS file needs a matching entry in `package.json`'s `exports` map**
and an entry in `PARTS` in `scripts/build-bundle.js`. Current subpaths: `.`, `/tokens`,
`/effects`, `/components`, `/containers`, `/navigation`, `/table`, `/forms`,
`/feedback`, and `./package.json`.

That last one is not a stylesheet. Once a package declares `exports`, anything
absent from the map is unreachable — including `package.json` itself, which
build tools and linters routinely read. It is mapped explicitly so they can.

## Package managers

Verified against the **published** package, not a local tarball, on
**2026-11-07**, against **0.10.0** — one concatenated stylesheet inside a
cascade layer, published over eight subpaths. Each row installs the pinned
version and then resolves all ten `exports` entries from that project:

| Manager | Version | Result |
| --- | --- | --- |
| npm | 10.9.8 | installs, **10/10** entries resolved |
| pnpm | 11.18.0 | installs, 10/10 — **24h cooldown**, pinning clears it |
| Yarn Classic | 1.22.22 | installs, 10/10 |
| Yarn Berry | 4.18.1 | installs, 10/10 — under **Plug'n'Play**, no `node_modules` on disk. **24h cooldown**, pinning does *not* clear it |
| Bun | 1.3.14 | installs, 10/10 |

Ten rather than eight because the map carries `.` and `./package.json`
alongside the eight stylesheets, and both have to resolve too.

The previous run was against 0.2.1, when the kit was six stylesheets wired
with `@import`. Everything that changed since — the concatenated bundle, the
cascade layer, `color-mix()`, two more subpaths — changed nothing here. The
kit is still plain CSS with no dependencies, no postinstall and no build step,
so the only real risk was the `exports` map, and it resolves everywhere.

**pnpm 11 and Yarn 4 will not install a version younger than 24 hours**, and
they do not behave the same way about it. Both ship a supply-chain cooldown on
by default — pnpm's `minimumReleaseAge` and Yarn's `npmMinimalAgeGate`, each
1440 minutes — but:

- **pnpm** resolves to the newest release older than the gate and prints
  `(x.y.z is available)` next to it. Asking for an exact version gets you that
  version. Measured on 0.10.0's release day: unpinned gave 0.9.0, pinned gave
  0.10.0.
- **Yarn 4** refuses outright, pinned or not:
  `YN0016: All versions satisfying "0.10.0" are quarantined`. The escape is
  `--npmMinimalAgeGate 0` on the command, or `npmMinimalAgeGate: 0` in
  `.yarnrc.yml`.

That difference was documented backwards until this run — README and this file
both said naming an exact version skips the gate, which is true of pnpm only.

The practical consequence is for **releasing**: after publishing, do not verify
with a bare `pnpm add` or `yarn add` and conclude the release failed. Pin the
version, or wait a day.

## Tokens

Colour
: `--cy-bg` `--cy-surface` `--cy-text` `--cy-heading` `--cy-neon-cyan`
  `--cy-neon-pink` `--cy-neon-purple` `--cy-neon-gold`

Status
: `--cy-success` `--cy-warning` `--cy-danger` `--cy-info`

Geometry
: `--cy-radius-sm` `--cy-radius` `--cy-radius-lg` `--cy-border-width`

Spacing (4px scale)
: `--cy-space-xs` `--cy-space-sm` `--cy-space-md` `--cy-space-lg`
  `--cy-space-xl`

Focus
: `--cy-focus-width` `--cy-focus-offset` `--cy-focus-color`

Type
: `--cy-font-body` `--cy-font-display` `--cy-font-mono` `--cy-font-terminal`
  — the last is used only by `.cy-terminal`, and names Nerd Fonts first so a
  fake terminal can draw powerline separators and file icons on a machine that
  has one. Nothing is shipped: patched Nerd Font builds run to tens of
  megabytes against a kit measured in kilobytes, so the token asks and falls
  through to `--cy-font-mono` when the answer is no. It is kept out of the
  shared mono stack deliberately — Hack is widely installed among developers,
  and putting it first there would repaint nav, badges, inputs and breadcrumb
  on most of their machines.

  **Unverified in a browser that can see it.** Both browsers available here —
  the in-app pane and ego-browser — are sandboxed away from user-installed
  fonts: canvas metrics for `Hack Nerd Font Mono` come back byte-identical to
  Menlo (60.2051px/char at 100px, against Hack's own 60.0), which is the
  fallback signature. What *is* verified is the fallback path, which is the one
  every user without the font takes.

Scrim
: `--cy-backdrop` — the modal backdrop, a finished `rgba()` rather than a hue
  plus a twin, because the alpha *is* the value and nothing fades it further.
  Deliberately **not** derived from `--cy-bg`: a scrim pushes the page behind
  it away, so it stays dark in both themes. Tying it to `--cy-bg` made the
  light theme wash near-white over near-white and separate nothing.

Other
: `--cy-ease` `--cy-disabled-opacity`

Every translucent glow is `color-mix(in srgb, var(--cy-token) α%, transparent)`,
which reads the colour token directly, so **a new colour token needs nothing
beyond itself**.

This replaced `rgba(var(--cy-*-rgb), α)` in 0.8.0. That form needed a
hand-maintained `-rgb` twin per colour — seven of them, a checker rule proving
each agreed with its base, and a documented trap where overriding a hue without
its twin left the glow behind. `color-mix()` is Baseline 2023, and that is what
changed: the twins existed for reach, and the reach argument expired.

## Components

**Effects** — `.cy-glow` (`--pink`, `--purple`, `--gold`), `.cy-text-glow`
(`--pink`, `--gold`),
`.cy-glitch`, `.cy-scanlines`, `.cy-grid-bg`, `.cy-cursor`

**Button** — `.cy-btn` with `--secondary` `--danger` `--pink` `--sm` `--lg`,
plus disabled styling

**Card** — `.cy-card`

**Content** — `.cy-kbd` (on `<kbd>`), `.cy-dl` (on `<dl>`; styles scoped
`<dt>`/`<dd>`), `.cy-figure` (on `<figure>`; styles a scoped `<figcaption>`
and a scoped `<img>`/`<svg>`/`<video>`), `.cy-quote` (on `<blockquote>`;
styles a scoped `<cite>`)

**Forms** — `.cy-fieldset` (on `<fieldset>`; styles a scoped `<legend>`)
`.cy-field` `.cy-label` `.cy-input` (`--sm` `--lg`; also styles
`select.cy-input` and `textarea.cy-input`) `.cy-checkbox` `.cy-radio`
`.cy-hint` `.cy-error`

**Containers** — `.cy-accordion` + `.cy-accordion__body` (on `<details>`;
styles `summary` scoped to the wrapper), `.cy-modal` (on `<dialog>`, with
`::backdrop`), `.cy-terminal` + `.cy-terminal__bar` (styles a scoped `<pre>`),
`.cy-popover` (on `[popover]`; a toggle-tip, never a hover tooltip)

**Feedback** — `.cy-alert` (`--success` `--warning` `--danger` `--info`),
`.cy-toast` (`--success` `--warning` `--danger`), `.cy-toast-container`
(`--bottom`), `.cy-badge` (`--success` `--warning` `--danger` `--outline`),
`.cy-spinner`, `.cy-progress`, `.cy-meter` (on `<meter>`; the three
low/high/optimum states map to the status colours), `.cy-sr-only`

**Navigation** — `.cy-nav` + `.cy-nav__brand` (current item styled from
`[aria-current]`, never a modifier class), `.cy-breadcrumb`, `.cy-sidebar` +
`.cy-sidebar__title` (requires a `<ul>`; sets no width of its own)

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
- **Light theme** is `:root[data-theme="light"]`. `data-theme="auto"` follows
  `prefers-color-scheme`, and the absence of the attribute is always dark.
  Following the OS is opt-in because `prefers-color-scheme: light` also matches
  visitors who have expressed no preference — keying off the attribute's
  absence would have flipped the kit to light for most of them. The light
  palette is therefore declared twice, and `check-conventions.js` compares the
  two blocks declaration by declaration so they cannot drift.
- **Every rule ships inside `@layer cyberpunk-ui`.** A consumer's unlayered
  rule beats the kit at any specificity, so overriding never needs
  `!important`. The wrapper is added per file rather than around the bundle, so
  cherry-picked imports cascade the same way. File bodies are deliberately not
  re-indented inside it.
- **Directional properties are logical**, so the kit mirrors under `dir="rtl"`
  without a second stylesheet: `border-inline-start`, `inset-inline-end`,
  `margin-inline-*`, `text-align: start`. Two exceptions are intentional — the
  `<select>` arrow, because `background-position` has no inline-axis keyword
  (it gets a `[dir="rtl"]` rule), and the rotated-border glyphs for the
  checkbox tick and accordion chevron, which are shapes rather than layout and
  would be flipped by mirroring.
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
CSS linter cannot know: that every glow mixes from a token that exists
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

Four things make a capture reproducible, and all four are required: every
animation and transition frozen, `deviceScaleFactor` pinned to 1 (this machine
captures at 2x, so an unpinned baseline is not portable), web fonts confirmed
applied before shooting — the run aborts rather than baseline a page rendered
in fallback fonts — and **the region scrolled into view before it is
photographed**.

The fourth is the one that took two releases to find, and it is worth the space
because everything built on top of it was a workaround for it.

`captureBeyondViewport` will photograph content far below the viewport, but it
rasterises those tiles off the fast path, and that path is not deterministic.
The symptom was that only the two deepest regions ever failed — `forms` at
document y=2034 and `feedback` at y=2764, against a 900px viewport — while the
five regions above them were stable to the byte across sessions and days. That
read as flakiness in the harness, and it was answered with retries: three
attempts, then six.

Retries were the wrong answer, and six of them hid the evidence. The loop would
print the same pixel count six times, which should have been read as *the
captures are deterministic* rather than as noise. The decisive measurement was
cheap and came late: `--update` re-recorded `feedback` and produced bytes
**identical to the baseline taken two days earlier**, while the comparison run
captured something 32 pixels different on every attempt, with the clip
rectangle and scroll offset identical in both paths. Hashing each capture
showed three distinct rasterisations of that one region, with the comparison
loop alternating between two of them on a period of two. Region order made no
difference, which ruled out the other obvious suspect — the canvas the diff
builds in the page under test.

The 32 pixels were all antialiasing: one row of each of the four alerts' left
accent borders, where the border went from `19,28,28` to `72,137,117`, plus the
rounded corners of `<progress>` and `<meter>` at deltas of 3 to 17.

Scrolling the region into view first makes it live viewport content, and
`captureBeyondViewport` is now **off** — it was the thing photographing
offscreen tiles, and with the region on screen it is not needed. The clip
stays in **document** coordinates either way; CDP wants it that way, and
converting it to viewport coordinates silently produced black frames (see
below).

Two consequences of scrolling, both found the same way and both worth knowing
before touching this script again.

**The offset has to be a whole number.** A scroll aimed at a region near the
end of the document is clamped to `scrollHeight - innerHeight`, which is
fractional whenever the document height is. The last section landed on 2316.5
instead of its own 2764, and a half-pixel offset rasterises a whole region
differently. That made every baseline for the final section depend on the
total height of the page: appending an unrelated section moved the clamp and
`feedback` reported 22850 changed pixels for a change that added no CSS to it.
`capture()` floors the offset.

**Anything that owns a compositing layer has to be de-promoted, not just
hidden.** The demo's topbar is `position: sticky`, and a sticky element gets
its own layer the moment the page is actually scrolled. `buttons` had been
stable to the byte for weeks, then began alternating as soon as captures
started scrolling. `FREEZE` gives it `position: static`, which keeps its box
in normal flow so no layout moves, and removes the layer. The toast container
is `position: fixed`, already out of flow, so it is removed outright.

### Phases

What is left after all of that is not noise and is not fixable from the DOM:
**an unchanged region can produce more than one byte-identical picture, and
the page cannot tell you which one it will give.**

The content region alternates between exactly two rasterisations on a strict
period of two — capture, capture, capture gives A, B, A, B. At the moment of
each capture everything observable is identical: `scrollY` 2808,
`document.scrollHeight` 3708, the section's `getBoundingClientRect()` at top
384.6796875 and height 451.15625, device pixel ratio 1. The six pixels that
move are antialiasing on two rows of keycap edges, at a maximum channel delta
of 7.

Measured and ruled out, so nobody pays for them twice:

| Suspect | Verdict |
| --- | --- |
| `captureBeyondViewport` | a real cause of a *different* instability; off now, but the alternation outlives it |
| the canvas `diff()` running in the page under test | captures alternate identically with no diff between them |
| region order | reversing it changed nothing |
| the web-font probe | adding it to a clean probe changed nothing |
| fractional scroll offset, sticky layer | real causes, both fixed above |

So the rasteriser has more than one correct answer. The check records them
all. `--update` captures each region four times and writes the distinct
results as `<slug>.png`, `<slug>.phase2.png`, `<slug>.phase3.png`; a capture
matching **any** phase is a pass, because every phase is a legitimate picture
of an unchanged page. Today: `text-glow`, `cards` and `navigation` have one
phase, `buttons`, `containers`, `forms` and `content` have two, `feedback`
has three.

Phases are capped at three. Without a cap an genuinely unstable region would
record a new "phase" every run and the check would pass against anything,
which is worse than one that cries wolf.

That this still catches real changes is verified by mutation, not asserted.
Reverting `.cy-meter`'s `::-webkit-meter-inner-element` from `display: flex`
to `block` — the half-height-bar bug 0.10.0 fixed — reports
`feedback: 9701 px differ from every one of 3 phase(s) (max delta 221)`.
Removing `.cy-kbd`'s inset rim reports `content: 316 px differ from every one
of 2 phase(s) (max delta 42)` — in the same two rows where the 6-pixel noise
lives, which is the case that matters: the phases absorb the rasteriser's
ambiguity without swallowing a real change in the same place.

`ATTEMPTS` is 2, and it is not a retry budget. It exists because a region may
have more phases than were recorded; it is not the answer to a failure.

### A blank frame is stable too

Every recorded baseline is now checked for content before it is written, and
that guard exists because of a real mistake rather than a hypothetical one.
Converting the clip to viewport coordinates pointed it at the top of the
document, far above the scrolled viewport, and with `captureBeyondViewport`
off that returns a black frame. Every baseline was re-recorded blank, six
consecutive runs passed comparing blank against blank, and the error surfaced
only because a mutation probe failed to fail.

A region of this kit is a styled component on a dark background, never one
flat colour, so `--update` rejects any capture holding fewer than eight
distinct colours.

Comparing each capture against the baseline is still strictly stronger than the
original design, which captured until two agreed — that proves the page is
*quiet*, not that it matches, and twice it settled onto the wrong state and
reported a change that was not one, both times at exactly 1179 pixels. Passing
needs one exact match, failing needs every attempt to differ, and a real
regression changes the content so it cannot pass by luck.

Verified by mutation, not by assertion. Reverting `.cy-meter`'s
`::-webkit-meter-inner-element` from `display: flex` back to `block` — the real
half-height-bar bug 0.10.0 fixed — was reported as
`9702 px (max delta 221) at 880x48+0+338`, the meter's exact box, with the other
six regions still passing. An earlier probe, reintroducing the square progress
edge, reported `1156 px (max delta 150) at 581x7+0+315`. Widening the tolerance
instead of fixing the capture would have had to swallow a max delta of 109 to
absorb the noise, and the small real regression sits at 150 — too close to be
safe.

If a run ever hangs in `Page.captureScreenshot`, the cause is almost certainly
a browser task space left over from an earlier aborted run: the space is looked
up by name, and its stale tabs point at the previous run's port, which is dead.
The run now closes its space in a `finally` for exactly this reason, so one
failure no longer poisons every run after it. Should it happen anyway, listing
the spaces and closing `cyberpunk visual regression` by hand clears it.

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
(`color-mix()` at 20% through 60%), and those values are not
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
`forced-colors` is now checked by `scripts/check-forced-colors.js` against a
**real** forced-colors implementation, and separately had an earlier emulated
pass in Chromium.

```sh
npm run check:forced-colors
```

It drives Gecko's own forced-colors code path rather than an emulation of it.
Firefox enters that path when `ui.useAccessibilityTheme` is 1, and every system
colour then comes from a `ui.*` pref — so the four contrast themes Windows 11
ships (Night Sky, Aquatic, Desert, Dusk) can be set as real palettes. Measured
with the Night Sky values: `Canvas` resolves to `#000000`, `ButtonFace` to
`#FFEE32`, `Highlight` to `#D6B4FD`, and a `#00f2ff` border comes back
`#FFFFFF`. Gecko reports `prefers-contrast: more` as matching at the same time,
so both of the kit's media blocks apply together — which is the real condition
on Windows, and the reason this checks the combination.

All four palettes pass. **What that is worth is narrower than it sounds**, and
the narrowing is the useful part:

| Property | Under Gecko's forced colours |
| --- | --- |
| author `color` / `border-color` / `background-color` | overridden by the engine |
| `box-shadow` | stripped by the engine |
| `background-image` | stripped by the engine |
| `opacity` | **left exactly as authored** |
| `forced-color-adjust` | **left exactly as authored** |

So most of the kit's `forced-colors` rules are inert *in Gecko* — the engine
would have done it anyway. Proved by mutation rather than argued: giving
`.cy-card` a transparent border, giving `cite` the `Canvas` colour, and
deleting the grid and scanline `background-image: none` rules each changed
nothing the DOM could observe. The rules stay because other engines force
less, but they are a backstop there, not the working part.

The two assertions with something to catch are opacity and
`forced-color-adjust`, and those are live: dimming `.cy-card` to `opacity: 0.45`
and giving `.cy-terminal` `forced-color-adjust: none` are both reported.

One finding the check reports every run, and cannot fix: **the four alert
variants render identically.** Forced colours collapses their accent borders to
one value, so info, success, warning and danger are visually the same message.
That is inherent to the mode, not a defect — and it is why the docs require
`role="alert"` and real words rather than letting colour carry the meaning.

Two further things worth knowing. Translucent tints survive as system colours
at low alpha — a card's 3% wash becomes 3% of Canvas over Canvas, which is
invisible rather than wrong. And a `<button class="cy-btn">` keeps
`appearance: auto`, so the platform paints it: it takes `ButtonText` on a
`ButtonFace` the DOM cannot see, while an `<a class="cy-btn">` takes `LinkText`
on the page background. The check compares each themed control against a bare
one of the same kind inserted into the same document, because a walked-up
background is the wrong pair for a control whose fill the widget draws.

**Still not Windows.** This is a second engine and four palettes, not the
hardware. Nobody has run the kit on Windows High Contrast, where Edge and
Firefox map themes differently and the OS supplies the colours rather than a
pref. That check remains open and this paragraph stays until someone looks.

## CI and releasing

- `ci.yml` on PRs: contrast check, then `npm pack --dry-run`. Deliberately
  **not** `npm publish --dry-run` — that contacts the registry and fails on
  any already-published version, which would break every PR.
- `release.yml` on a `v*` tag: `npm publish` over **trusted publishing**
  (OIDC — no `NPM_TOKEN`; the attestation is generated automatically), then
  cut a GitHub Release.

  There used to be a third step mirroring the tarball to GitHub Packages. It
  was deleted after 0.11.1, because it had been failing with
  `npm error code ENEEDAUTH` and nobody had noticed: it was
  `continue-on-error`, so the job stayed green and the only trace was an
  annotation. Its own comment already conceded it was "NOT a usable install
  channel" — GitHub Packages demands authentication even for public packages —
  so it was decoration that could only ever produce a false annotation or a
  false sense of a second channel.

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

**Use `npm version`. Do not tag by hand.** Two release bugs came from ignoring
that, and both were silent:

- `npm version` runs the **`preversion`** hook, which is `npm run check &&
  npm run check:visual`. A failing check aborts the bump — no commit, no tag.
  v0.9.0 was tagged seconds after the visual check failed, because the tag push
  had been chained onto a `grep` whose exit code said nothing about the check.
  Running the checks by hand first is not a gate; this is.
- `npm version` creates an **annotated** tag, which is what `git push
  --follow-tags` pushes. A hand-made `git tag v0.7.0` is lightweight, and
  `--follow-tags` skipped it while reporting "Everything up-to-date" — the tag
  sat local until it was pushed by name.

`CY_SKIP_VISUAL=1 npm version …` gets past the visual half, and prints that it
skipped rather than passed. It is for a broken browser — ego-browser's capture
pipeline once hung for an entire session, which would otherwise have blocked a
docs-only release — never for a diff you do not want to look at.

To confirm the release landed, ask npm — `npm view @laddtnov/cyberpunk-ui
version`. A bare `pnpm add` or `yarn add` will report the *previous* version
for the first 24 hours because of the release cooldown described above, which
looks exactly like a failed publish and is not one.

`main` is protected, and that includes the release. The version-bump commit
cannot be pushed to `main` directly — the push is rejected with `Changes must
be made through a pull request` — so a release goes:

```sh
git checkout -b release/0.11.0
npm version minor          # runs the preversion gate, commits, annotated tag
git push -u origin release/0.11.0      # branch only, not the tag yet
# merge the PR with a merge commit, then
git push origin v0.11.0                # this is what triggers release.yml
```

The tag is pushed **after** the merge, not with the branch. Pushing it first
would publish to npm before anyone had merged the thing being published, and
the tag would name a commit that might never reach `main`.

Merge it with a merge commit rather than a squash: a squash rewrites the
commit, and the tag would then point at an object that is not in `main`'s
history.

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
