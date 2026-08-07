# Roadmap

Where the kit goes next, and why in that order.
Written against **0.5.0**.

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

## Done, for the record

So nobody plans it twice:

| Area | State |
| --- | --- |
| Publishing | npm with `--provenance`, GitHub Releases, SemVer, MIT, CHANGELOG |
| CI | contrast check + `npm pack --dry-run` on every PR; tag-triggered publish |
| Design tokens | `tokens.css`, 104 lines, every value a custom property |
| Accessibility | contrast enforced in CI, shared focus rings, reduced-motion, `:user-invalid`, `.cy-sr-only`, WCAG-aware light theme |
| Components | button, card, input, select, textarea, checkbox, radio, alert, toast, badge, spinner, progress, accordion, modal, terminal |

Two notes on that table, because both get proposed again:

**The token prefix stays `--cy-`.** A rename to anything else is a breaking
change for every consumer, and the author's own portfolio pins an exact version
over CDN. The cost is a coordinated update for a cosmetic gain.

**A new colour token needs its `-rgb` twin.** Every translucent glow in the kit
is `rgba(var(--cy-*-rgb), α)`; `color-mix()` is deliberately unused, for reach.
A colour token without its twin cannot be faded, which means it cannot glow,
which means it is not usable by half the kit.

## Next

### Closed: the Firefox check

This was the first item on the list, on the grounds that nothing should be
built on an unverified base. It has been done — Firefox on macOS, against the
demo at 0.2.1 — and it is recorded here rather than deleted, because how it
resolved is the useful part.

Everything renders: `appearance: none` on input / select / textarea, the custom
select arrow, the checkbox tick, the radio dot, the native `<progress>` with
`::-moz-progress-bar`, `[aria-invalid="true"]`, `:user-invalid` (quiet on load,
red after blur — exactly the behaviour the selector is chosen for), and the
feedback components. Nothing had to be fixed.

Two things came out of it that were worth more than the pass itself.

**A wrong assumption was retired.** The kit believed Gecko could not generate
pseudo-elements on `<input>`, and had flagged the checkbox tick as likely
broken. It renders — `appearance: none` makes the input non-replaced, so the
rule never applied to these controls. That belief had already driven a code
change in 0.2.1 and would have driven more.

**The demo was hiding two paths.** `:user-invalid` could not be tested from the
page at all: the only validation example hardcoded `aria-invalid="true"`, which
renders red on load and never matches the selector. The div + `.cy-progress__fill`
path was not present either. Both are in the demo now.

A second pass at 0.2.2 closed the remainder: the **light theme** and the
**glitch / scanline / grid** effects, neither of which had been in frame the
first time. Both correct. The one item there with real risk was the `select`
arrow, whose colour is baked into a per-theme data-URI and would show as a cyan
arrow on a light background if the two SVGs ever drifted. It renders teal.

So **all three engines are now verified**, and nothing about the kit is
unknown in Gecko. A regression from here would be new work rather than an
unknown, which is an argument for item 1 and not for another manual sweep.

The lesson generalises past Firefox. Two of the kit's engine assumptions were
written from reasoning rather than observation; one was wrong, and the demo
could not have caught it. That is the argument for item 1, not for more
reasoning.

### Closed: package managers and badges

The prediction was that pnpm, Yarn and Bun already worked and only needed
writing down. That held — nothing had to change for any manager — but the
smoke installs were still worth running, because two things turned up that no
amount of reasoning would have.

All five configurations install and resolve all six subpaths, **including Yarn
Plug'n'Play with no `node_modules` on disk**, which was the one genuine risk in
an `exports`-only package. The matrix is in STATE.md.

**`package.json` was unreachable.** Once a package declares `exports`, anything
absent from the map cannot be imported — and `package.json` was absent, so
tools that read it were locked out. It is mapped now.

**pnpm 11 and Yarn 4 refuse versions younger than 24 hours.** Both default to a
supply-chain cooldown, and neither errors: they quietly install the previous
release instead. A bare `pnpm add` right after publishing therefore looks like
a failed release. This is documented in the README and, more importantly, in
STATE.md's release section, where the mistake would actually be made.

Badges added: downloads, CI status, unpacked size. No TypeScript badge — there
is no TypeScript — and no hand-drawn "Bun compatible" or "Accessible" shield,
since a badge nobody computes is decoration.

### Closed: v0.3 containers

All three shipped, in `containers.css`, each on the native element that already
owns the behaviour:

Accordion
: `<details>` / `<summary>`. Keyboard and open state are the browser's.

Modal
: `<dialog>`, with a blurred `::backdrop`. Focus trapping, `Esc` and the top
  layer come from `showModal()` — which is the consumer's call to make; the kit
  only paints the result.

Terminal / code window
: The differentiator. Composes with `.cy-scanlines` and `.cy-cursor` rather
  than reimplementing them.

Two things came out of building them.

**A scrim must not follow the theme.** The backdrop was first derived from
`--cy-bg`, which meant the light theme painted a near-white wash over a
near-white page and separated nothing. `--cy-backdrop` is now a finished
`rgba()` that stays dark in both themes. Only measuring it in light mode caught
that; it looks perfectly fine in the dark theme everything gets built in.

**`::backdrop` may not inherit custom properties**, so `var(--cy-backdrop)`
carries a literal fallback. Without one, a failure there is not a wrong colour
but *no* backdrop at all, leaving the page fully legible behind an open modal.

The rest of the original v0.3 scope — **navigation and data** — followed in
`navigation.css` and `table.css`. The prediction that none of them would get a
native element to stand on was right, and it changed what the batch was: a
`<nav>` is a landmark and a `<table>` is a structure, so neither hands over
behaviour the way `<details>` and `<dialog>` did. There was nothing to trap
focus or toggle. What there was instead is markup that carries meaning CSS
cannot supply, and the work went there.

Two things worth keeping.

**The current item is styled from `aria-current`, not from a modifier class.**
A `--active` class would let someone build a nav whose current item looks
current and announces as ordinary — the failure mode the whole component
reference exists to warn about. Styling the attribute makes the appearance and
the announcement the same declaration, so they cannot drift.

**A table looks identical whether or not it is accessible.** `scope` on the
headers, a `<caption>`, a real `<thead>` — all three are invisible when absent
and all three are the difference between "Output: 982 TW" and a wall of
numbers. The same is true of the scroll wrapper: a box that scrolls only under
a mouse fails WCAG 2.1.1, and the `tabindex` that fixes it then requires a name
because it is focusable. Documented rather than assumed.

### Closed: per-component documentation

`docs/components/`, one page per subpath rather than per component — the
subpath is the boundary a consumer actually imports, so `/forms` and
`forms.md` describe the same thing, and fifteen fragments do not have to be
navigated.

Each component carries what it is, the markup the kit expects, its modifier
classes, the tokens that restyle it, and its accessibility contract.

That last section turned out to be most of the value, and it is worth saying
why: **everything in it is a way to build something that looks completely
finished and is not.** A `.cy-error` with no `aria-describedby` styles
perfectly and is invisible to a screen reader. A `.cy-spinner` with no
`.cy-sr-only` label spins beautifully and announces nothing. A `<div>` in
place of `<output>` for a toast is pixel-identical and silent. A modal opened
with `show()` instead of `showModal()` renders without its backdrop and traps
nothing. None of these produce a visual symptom, so none of them get caught by
looking — which is exactly why they had to be written down.

Writing the pages also surfaced that the `<select>` arrow's baked-in colour is
a consumer-facing limitation and not only internal debt: override
`--cy-neon-cyan` and the arrow does not follow. Documented where someone
retheming will hit it.

### Closed: high-contrast support

Both `prefers-contrast: more` and `forced-colors: active` are handled now, per
file, following the `prefers-reduced-motion` precedent rather than adding a
seventh stylesheet. Details in STATE.md; the shape of it is that the first is a
lift the token substrate mostly absorbs on its own, and the second is a
surrender where the only real work is making sure nothing was signalling with
colour alone.

The prediction was that this would mean "losing the glow deliberately rather
than by accident", and that part held. What it missed is that **removing the
glow was the easy half**. Three components were signalling state through colour
that forced colours would have flattened without appearing broken — the
spinner's arc, the checked checkbox and radio, and the progress fill. A static
ring that used to spin still looks like a perfectly fine ring. That is the
failure mode worth remembering: in forced colours, things do not break
visibly, they stop meaning what they meant.

One caveat carried forward: **`forced-colors` has not been seen on a real
display.** It needs Windows High Contrast Mode. What was verified is that both
blocks parse and are live, that every selector matches a real element, and that
every system colour used is supported — which is a long way from having looked
at it. Written down in STATE.md rather than quietly assumed, and a good
candidate for whoever next has a Windows machine in reach.

### Closed: playground

This item used to say the demo was not hosted. It is — GitHub Pages serves it
at **https://laddtnov.github.io/cyberpunk-ui/demo/**, deploying from `main`, and
the live copy tracks merges without anyone doing anything. The OG tags have
pointed there all along.

What was actually missing was a link to it: the README never mentioned the demo
at all, so the page existed and nothing led anyone to it. Fixed.

**Live token editing** is now in, as `demo/playground.js` — five colours, a
radius slider and a border-width slider, plus a COPY CSS button that emits only
what was actually changed, so a visitor leaves with a `:root` block they can
paste. The script lives in `demo/`, which `files` has never published, so the
package still ships no JavaScript.

Three things it forced into the open, all of them arguments the kit already
makes but could not previously *show*:

**A colour and its `-rgb` twin have to move together.** The editor writes both
on every change. Writing only the hue recolours borders and text and leaves
every glow on the old colour — the rule is documented, and this is the first
place it is demonstrable in one drag.

**Inline styles on `:root` outrank the theme.** An override set in dark mode
survives into `:root[data-theme="light"]` and pins, say, a near-black
background over the light theme. Switching themes therefore clears the
overrides and re-reads that theme's own values, which is the only behaviour
that is not confusing.

**The kit does not style every input.** `type="color"` and `type="range"` are
not `.cy-input` — the kit covers text inputs, `<select>` and `<textarea>`, and
putting its class on controls it does not support would advertise support that
is not there. The playground styles those two locally and says why.

Still open here: nothing blocking. Persisting a theme across reloads and
sharing one by URL are both obvious next steps and neither is needed for the
page to make its point.

### Closed: linting and visual regression

Both halves landed, and neither is what the item described.

**Stylelint was rejected on evidence** — 123 problems, zero bugs, almost all of
it house style contradicting deliberate choices. `scripts/check-conventions.js`
enforces what only this project knows instead, dependency-free, and found real
README drift on its first run.

**Visual regression is region-based and local**, driven by ego-browser:
`scripts/check-visual.js`, one PNG per demo section, compared through a canvas
in the page so nothing on the Node side decodes an image. It catches the
square-edge progress defect that motivated the item — 1154 px at delta 150,
located to the fill.

The part the roadmap got wrong was assuming this could be a CI gate. ego-browser
is a desktop browser and GitHub's runners cannot start it, so it is a release-time
check documented in STATE.md rather than an automated one. That is a real
limitation and worth stating plainly: it runs when someone runs it.

Two findings worth keeping. Reproducibility needs three things together —
frozen animations, a pinned `deviceScaleFactor`, and fonts confirmed applied —
and missing any one produces a diff that has nothing to do with the CSS. And
captures have to **settle**: 27 of 28 region-runs were pixel-identical, while
the odd one out repeated the *same* 1181 pixels later. That is a second
discrete state, not noise, so the answer was shooting each region twice rather
than widening the tolerance and going blind to a real 1181-pixel change.

### Closed: sidebar, gold, and a terminal font

The last component from the original Phase 6 list worth building, plus two
things that came out of the same pass.

**`.cy-sidebar`** completes navigation. It requires a `<ul>` and takes its
current item from `[aria-current]`, both for reasons the rest of
`/navigation` already establishes. What it deliberately does *not* do is more
interesting: it sets no width, no sticky position and no scrolling. Each of
those is a page decision, and the scrolling one carries an accessibility bill —
a scroll container owes the keyboard a `tabindex` and a label, which is not a
cost to impose on every sidebar for the sake of the tall ones.

**`--cy-neon-gold`** adds the Deus Ex register to a kit that only had the
*Blade Runner* one. The halo is not the neon one recoloured — 6px at higher
opacity rather than 10px, because a warm low-saturation hue smears at the
radius that makes cyan look lit. It is kept away from `--cy-warning`, which is
a caution colour with a meaning attached; decoration painted in a status hue
looks like a problem and announces nothing.

**`--cy-font-terminal`** names Nerd Fonts for `.cy-terminal` only, and ships
none of them. The patched builds are tens of megabytes against a kit measured
in kilobytes, so the token asks for what a machine may already have and falls
through to `--cy-font-mono`. It is kept out of the shared mono stack because
Hack is widely installed and would otherwise repaint half the kit on a
developer's machine without being asked.

Two things this taught the visual check, both about machine variance rather
than about CSS: locally installed fonts have to be pinned during capture or a
baseline is only comparable on the machine that recorded it, and text
rasterisation has to be forced to grayscale, because whether a box gets its own
compositing layer decides its antialiasing and layer promotion is not stable
between captures. That second one was the ~1180-pixel "second state" the settle
loop had been absorbing since the check was built.

## Waiting on a decision

**Tabs.** No JavaScript means the radio-input hack or `:target`. Both produce a
control that a screen reader announces as something it is not. This is exactly
the collision the second constraint exists to settle: tabs wait until there is
an approach that survives a screen-reader pass, or until the kit is willing to
ship the pattern as markup-plus-your-own-JS and say so plainly.

**Tooltip.** Same shape of problem. A CSS-only tooltip is hover-only, which
means keyboard users and touch users never see it. Usable as decoration for
non-essential text, not as the carrier of anything a user needs.

Neither is blocked on effort. Both are blocked on being willing to ship
something worse than the rest of the kit.

## Parked — type of our own

Wanted eventually: type that belongs to the kit rather than three families
borrowed from Google Fonts. Parked rather than scheduled, and worth writing
down because the shape of the problem is already clear.

**The seam exists and is the right one.** `tokens.css` names three stacks —
`--cy-font-display`, `--cy-font-body`, `--cy-font-mono` — each with a system
fallback, and the file already says the consumer loads the fonts. **No font
file ships**: `files` is `["*.css", "README.md", "LICENSE"]`, and the whole
package is 40.8 kB. Only the demo pulls Orbitron / Rajdhani / Share Tech Mono,
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
for exactly one component — the **terminal / code window**, which now exists
and is the place a kit would legitimately want box-drawing and prompt glyphs.
Worth trying there first, at demo scale, before anything is packaged.

**Tegaki** (`gkurt/tegaki`, MIT) is not a typeface at all. It is a JavaScript
library that animates handwriting stroke by stroke and emits SVG, PNG, GIF or
WebM. As a runtime dependency it is disqualified by the first constraint — no
JavaScript ships, ever. But its *output* is not JavaScript: a pre-rendered SVG
is a static asset, and an animated hand-drawn wordmark rendered once at build
time could sit in the README or the demo without the package gaining a
dependency. That is the only version of this worth pursuing.

## Deliberately not doing

**Framework packages** (`-react`, `-svelte`, `-vue`). A CSS kit needs no
wrapper to be used in React — `@import` works there today. A wrapper's only
real payload is JS behaviour: modal open state, a toast queue, tab selection.
That is worth building when those components exist and consumers ask for the
state management, not before. Revisit after v0.3.

**Unit tests.** There is no unit. The equivalents that do carry weight are
already listed above — Firefox verification, visual regression, and pairing
contrast.

**Avatar.** It is `border-radius: 50%` on an `<img>`. A class that wraps one
declaration earns nothing and adds a name to remember.

**Performance testing.** 1,592 lines of CSS, zero dependencies, zero JavaScript.
There is nothing to measure that the bundle-size badge does not already say.

## How to use this file

Additive changes are preferred and the kit is pre-1.0, but the exact-version
CDN pin means breaking changes cost a coordinated update. When a phase here
lands, move what it produced into `docs/STATE.md` — that file is the one people
read before building, and a roadmap item that shipped belongs in the record of
what *is*.
