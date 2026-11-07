# Roadmap

Where the kit goes next, and why in that order.
Written against **0.10.0**.

`docs/STATE.md` records what *is*. This file records what is **not yet**, what
was considered and rejected, and what the constraints rule out entirely. Read
STATE.md first — half of what a roadmap normally proposes is already shipped
here, and the other half has to survive two constraints that never bend.

## The two constraints

**No JavaScript ships, ever.** If a component needs behaviour it is built on
`<dialog>`, `<details>`, or an existing native element. This is not a purity
exercise — it is what lets the kit be one `<link>` tag with no bundler, and it
is why the kit has no props, no variants object, and no runtime to version.

**Accessibility outranks the component list.** A component that only works with
a mouse does not ship, however good it looks. Where the two constraints
collide — and they do, on tabs and tooltips — the component waits.

Everything below is ordered by those two, not by what is easiest to demo.

## Next

Nothing here is a component. Everything the original roadmap proposed has
shipped, and what is left is the work that decides whether this becomes 1.0.

### 1. `forced-colors` on real Windows High Contrast

The only feature in the kit that has never been seen on the hardware it is for.
An emulated pass in Chromium found nothing broken — every component resolves to
system colours, the spinner keeps two distinct border colours so its rotation
survives, glows and the scanline wash are dropped. But emulation approximates
one theme, and real High Contrast ships several, with Firefox and Edge mapping
them differently.

Five minutes on a Windows machine. Nobody has had one.

### 2. Decide on 1.0.0

Pre-1.0 is what allows a breaking change in a minor release, and 0.8.0 used
that licence to delete seven public tokens. The API has been stable since. The
question is whether to keep that freedom or promise stability.

Item 1 is the one worth closing first: 1.0 is a claim about behaviour on
hardware, and that claim is still unverified. The package-manager half was
closed on 2026-11-07 — see the matrix in `docs/STATE.md` — and the visual
check was made deterministic the same day.

### 3. Four native elements are still unstyled

`<kbd>`, `<dl>/<dt>/<dd>`, `<figure>`, `<blockquote>`. The first two fit a HUD
readout — keycaps and term/value pairs — and follow the same native-element
pattern as `.cy-meter` and `.cy-fieldset`. The last two are ordinary content
styling with no cyberpunk angle, and are listed for completeness rather than as
a proposal.

## Shipped, for the record

What each release settled, so nothing gets planned twice. `CHANGELOG.md` holds
the detail and the measurements; this is the index.

| Release | Settled |
| --- | --- |
| 0.2.x | Firefox verified; the Gecko pseudo-element belief that drove a workaround was wrong and was retired |
| 0.2.2 | npm, pnpm, Yarn Classic, Yarn Berry (incl. PnP), Bun all resolve every subpath; badges added |
| 0.3.0 | containers on native elements: `<details>` accordion, `<dialog>` modal, terminal |
| 0.4.0 | `prefers-contrast: more` and `forced-colors: active` across every component |
| 0.4.x | per-component reference under `docs/components/` |
| 0.5.0 | `.cy-progress__fill` removed; the native `<progress>` is the only progress bar |
| 0.5.x | live token playground in the demo |
| 0.6.0 | `.cy-sidebar`, `--cy-neon-gold`, `--cy-font-terminal` |
| 0.6.x | convention checker and region-based visual regression; **stylelint rejected on evidence** — 123 problems, zero bugs |
| 0.6.3 | the barrel became one concatenated file: a `<link>` cost 9 serialised round trips, now 1 |
| 0.7.0 | `@layer cyberpunk-ui`, logical properties for RTL, `data-theme="auto"` |
| 0.8.0 | the seven `-rgb` twins retired for `color-mix()` |
| 0.9.0 | `.cy-popover` toggle-tip on the Popover API; contrast checked against `--cy-surface` too |
| 0.10.0 | `.cy-fieldset` and `.cy-meter`; releases moved to npm trusted publishing (OIDC) |
| 0.10.x | package-manager matrix re-verified against 0.10.0: all five managers resolve all ten `exports` entries, Yarn Berry under PnP included |

Decisions in that history that get re-proposed, and should not be:

**The token prefix stays `--cy-`.** A rename is a breaking change for every
consumer, and the author's portfolio pins an exact version over CDN.

**A new colour token needs nothing but itself.** Glows are
`color-mix(in srgb, var(--cy-token) α%, transparent)`, mixed from the colour
token. This read the other way until 0.8.0, when `color-mix()` being Baseline
2023 removed the reason for the `-rgb` twins.

**The current item in a nav is styled from `aria-current`, never a modifier
class.** A class lets you build a nav whose current item looks current and
announces as ordinary.

**`package.json` is in the `exports` map on purpose.** Once a package declares
`exports`, anything absent is unreachable — including `package.json`, which
tools routinely read.

**The release workflow filename is part of the release contract.** npm's
trusted-publisher configuration names `release.yml`; renaming it breaks
publishing until npmjs.com is updated to match.

## Parked — type of our own

Wanted eventually: type that belongs to the kit rather than three families
borrowed from Google Fonts. Parked rather than scheduled, and worth writing
down because the shape of the problem is already clear.

**The seam exists and is the right one.** `tokens.css` names three stacks —
`--cy-font-display`, `--cy-font-body`, `--cy-font-mono` — each with a system
fallback, and the file already says the consumer loads the fonts. **No font
file ships**: `files` is `["*.css", "README.md", "LICENSE"]`, and the whole
package is 42.0 kB packed. Only the demo pulls Orbitron / Rajdhani / Share Tech Mono,
through one `<link>` to Google Fonts. Swapping in a different face is three
token values and nothing else.

Three constraints bind whatever comes next:

Installing a font locally does nothing for anyone else
: A face on the author's machine is invisible to every consumer of the
  package. Either they load it, or the kit ships the file.

Shipping files ends the size story
: A single Nerd Font is 2–8 MB, fifty to two hundred times the entire kit.
  If font files ever ship they belong in a separate package or an opt-in
  subpath, never in the base import.

Licences travel with the font, not the patcher
: Nerd Fonts are patched builds of other people's typefaces, and the original
  licence governs redistribution. Each family has to be checked before any
  file is republished. Canonical source is `ryanoasis/nerd-fonts`.

### Licensing, before anyone reaches for a file

None of this is legal advice, and none of it is urgent — **the kit is at zero
exposure today and stays there while no font file ships.** `tokens.css` only
*names* families, which is a reference rather than a copy, and the demo's
Google Fonts `<link>` means Google serves the bytes. `files` is
`["*.css", "README.md", "LICENSE"]`. There is nothing to infringe.

The traps all sit on the other side of that line, and two of them are easy to
walk into:

**A repository's licence does not cover the fonts bundled inside it.** Tegaki
is MIT, and that MIT covers Tegaki's own code. The ten faces it ships —
Caveat, Italianno, Tangerine, Parisienne, Suez One, Amiri, Tillana, Klee One,
Nanum Pen Script, Atma — each keep their own licence, mostly OFL 1.1. Reading
a repo's top-level licence as covering its third-party assets is the most
common mistake in this area.

**Nerd Fonts is not one licence either.** The project has its own, but every
patched font retains the licence of the typeface it was built from. The repo
carries a `license-audit.md` for exactly this, and marks **Reserved Font Name**
status per family — Anonymous Pro and Bitstream Vera Sans Mono among the RFN
ones. Under OFL, a reserved name may not be used for a modified version, which
is why every patched face is renamed to `… Nerd Font`.

**OFL cannot be relicensed to MIT.** If an OFL file ever ships here it stays
OFL, its licence text has to travel with it, and this repository's blanket
`LICENSE` stops being accurate — an attribution section would be required
alongside it.

**Output is not the font.** OFL explicitly does not restrict documents
*produced with* a font, so a wordmark pre-rendered to SVG is a document, not a
font file. That is what makes the Tegaki plan above clean, provided the face it
renders is OFL or Apache.

So the low-risk shape of this is: use Nerd Fonts **locally** to design how the
terminal component should look and ship no file, and treat Tegaki as a
build-time tool whose SVG is the only thing committed. All of the aesthetic,
none of the exposure.

If a face is ever shipped regardless: one font, licence checked individually,
RFN status verified, the font's licence file shipped beside it, an attribution
section added so `LICENSE` no longer implies MIT covers everything, and the
file kept in a separate package or opt-in subpath.

Two things have been installed locally, and they are not the same kind of
thing:

**Nerd Fonts** are real font files, patched to add developer and powerline
glyphs. That makes them a poor fit for display or body text and a *good* one
for exactly one component — the **terminal / code window**. That was tried and
shipped in 0.6.0: `--cy-font-terminal` names Nerd Fonts first and falls through
to `--cy-font-mono`, so a machine that has one gets the glyphs and nothing is
packaged. The open half is unchanged — no font file ships, and none should
without the licence work below.

**Tegaki** (`gkurt/tegaki`, MIT) is not a typeface at all. It is a JavaScript
library that animates handwriting stroke by stroke and emits SVG, PNG, GIF or
WebM. As a runtime dependency it is disqualified by the first constraint — no
JavaScript ships, ever. But its *output* is not JavaScript: a pre-rendered SVG
is a static asset, and an animated hand-drawn wordmark rendered once at build
time could sit in the README or the demo without the package gaining a
dependency. That is the only version of this worth pursuing.

## Deliberately not doing

**Tabs.** Real tabs need `role="tablist"`, roving `tabindex` and arrow-key
navigation between tabs. None of that is expressible in CSS, and the CSS-only
imitations — hidden radio inputs, `:target` — produce a control that announces
itself as something it is not. `<details name>` is documented in
`docs/components/containers.md` as the substitute: a shared name makes a group
exclusive, which is what most people reach for tabs to get.

**Hover tooltips.** `.cy-popover` is a toggle-tip and stays one. A
hover-triggered version needs interest invokers, which are Chrome-only, and a
hover-only affordance is the failure the toggle-tip was built to avoid.


**Framework packages** (`-react`, `-svelte`, `-vue`). A CSS kit needs no
wrapper to be used in React — `@import` works there today. A wrapper's only
real payload is JS behaviour: modal open state, a toast queue, tab selection.
That is worth building when those components exist and consumers ask for the
state management, not before. The original note said "revisit after v0.3";
v0.3 came and went, the components it was waiting for now exist, and nobody
has asked. Revisit when someone does.

**Unit tests.** There is no unit. The equivalents that do carry weight are
already listed above — Firefox verification, visual regression, and pairing
contrast.

**Avatar.** It is `border-radius: 50%` on an `<img>`. A class that wraps one
declaration earns nothing and adds a name to remember.

**Performance testing.** 1910 lines of CSS, zero dependencies, zero JavaScript.
There is nothing to measure that the bundle-size badge does not already say —
and the one real performance defect the kit had was found by reading the CDN
request waterfall, not by a benchmark: eight `@import`s costing nine
serialised round trips, fixed in 0.6.3.

## How to use this file

Additive changes are preferred and the kit is pre-1.0, but the exact-version
CDN pin means breaking changes cost a coordinated update. When a phase here
lands, move what it produced into `docs/STATE.md` — that file is the one people
read before building, and a roadmap item that shipped belongs in the record of
what *is*.
