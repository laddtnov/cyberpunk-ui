# Roadmap

Where the kit goes next, and why in that order.
Written against **0.2.1**.

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
| Design tokens | `tokens.css`, 94 lines, every value a custom property |
| Accessibility | contrast enforced in CI, shared focus rings, reduced-motion, `:user-invalid`, `.cy-sr-only`, WCAG-aware light theme |
| Components | button, card, input, select, textarea, checkbox, radio, alert, toast, badge, spinner, progress |

Two notes on that table, because both get proposed again:

**The token prefix stays `--cy-`.** A rename to anything else is a breaking
change for every consumer, and the author's own portfolio pins an exact version
over CDN. The cost is a coordinated update for a cosmetic gain.

**A new colour token needs its `-rgb` twin.** Every translucent glow in the kit
is `rgba(var(--cy-*-rgb), α)`; `color-mix()` is deliberately unused, for reach.
A colour token without its twin cannot be faded, which means it cannot glow,
which means it is not usable by half the kit.

## Next

### 1. Finish the Firefox check

Mostly done, and it went better than expected. Firefox on macOS was run against
the demo at 0.2.1: `appearance: none`, the custom select arrow, the checkbox
tick, the radio dot, the native `<progress>`, `[aria-invalid="true"]` and the
feedback components all render correctly. Details in STATE.md.

The sweep's main result was **retiring a wrong assumption**. The kit believed
Gecko could not generate pseudo-elements on `<input>`, and had flagged the
checkbox tick as likely broken. It renders fine — `appearance: none` makes the
input non-replaced. That belief had already driven a code change in 0.2.1, and
would have driven more.

What is left is small and worth doing before it is forgotten:

- **`:user-invalid`** — the last real unknown, and the only one that could
  still bite. The demo cannot answer it: its red email field is a hardcoded
  `aria-invalid="true"`, a different selector entirely. Needs someone to type
  into a required field, clear it, and tab away.
- **The light theme**, and the **glitch / scanline / grid** effects — neither
  was in frame during the pass.
- **Give the demo a `.cy-progress__fill` example**, so the div-based progress
  path stops being the one component no browser has ever rendered.

The lesson generalises past Firefox: two of the kit's engine assumptions were
written from reasoning rather than observation, and one of them was wrong. That
is the argument for item 7's visual regression, not for more reasoning.

### 2. Package managers and badges

The kit is pure CSS with no postinstall and no build step, so pnpm, Yarn and
Bun already work — there is nothing to make compatible, only something to
write down. A tabbed install block in the README, and a smoke install per
manager to confirm the claim before making it.

Badges worth adding: downloads, CI status, bundle size (gzip). Not a TypeScript
badge — there is no TypeScript. Not a hand-drawn "Bun compatible" or
"Accessible" shield either; a badge nobody computes is decoration.

### 3. v0.3 — containers

Already scoped in STATE.md, unchanged here:

Modal
: `<dialog>`. The element brings focus trapping, `Esc`, and the top layer for
  free — everything that makes a hand-rolled modal an accessibility liability.
  `::backdrop` takes the blur.

Accordion
: `<details>` / `<summary>`. Native disclosure semantics, keyboard included.

Terminal / code window
: The strongest differentiator of the three, and the one nobody else's kit
  has. Reuses `.cy-cursor` and the scanline effect.

### 4. Per-component documentation

The README class table says a component exists. It does not say how to vary it
or what breaks it.

The usual template — description, props, examples, best practices,
accessibility — needs one substitution to mean anything here. **A CSS kit has
no props.** The analogue is *modifier classes and the tokens that restyle
them*:

```html
<button class="cy-btn cy-btn--danger cy-btn--lg cy-glow">DELETE</button>
```

So each component page carries: what it is, the modifier classes it accepts,
the tokens that change its appearance, the markup it expects, and the
accessibility contract it assumes the consumer keeps. That last section is the
one worth the effort — `.cy-error` is inert without `aria-describedby`, and
nothing in CSS can enforce it.

### 5. High-contrast support

The one real gap in an otherwise strong accessibility story. Neither
`prefers-contrast: more` nor `forced-colors` is handled, and a kit built on
glow is exactly the kind that Windows High Contrast Mode flattens into
unreadability. Expect this to mean `forced-color-adjust` in places and losing
the glow deliberately rather than losing it by accident.

### 6. Playground

`demo/index.html` already exercises every component and doubles as the OG image
source. What is missing is not the page — it is that the page is not hosted and
not editable.

Two steps, in order: publish it, then add live token editing so a visitor can
drag `--cy-neon-cyan` and watch the whole kit reskin. The second one is the
demo, because token substrate *is* the pitch.

### 7. Stylelint and visual regression

Stylelint first — it is an afternoon, and it enforces the `cy-` prefix and the
`--variant` modifier convention mechanically instead of by review.

Then visual regression, which is the only automated check that can see a broken
glow gradient. Note what it also covers: the existing contrast script checks
**tokens against backgrounds only** and is blind to component colour pairings —
a hardcoded `color: #000` on `.cy-btn:hover` sat at 3.62:1 and shipped, because
no token was involved. Pairing coverage is a real hole; a snapshot diff is the
cheapest thing that would have caught it.

## Waiting on a decision

**Tabs.** No JavaScript means the radio-input hack or `:target`. Both produce a
control that a screen reader announces as something it is not. Constraint two
beats constraint six: tabs wait until there is an approach that survives a
screen-reader pass, or until the kit is willing to ship the pattern as
markup-plus-your-own-JS and say so plainly.

**Tooltip.** Same shape of problem. A CSS-only tooltip is hover-only, which
means keyboard users and touch users never see it. Usable as decoration for
non-essential text, not as the carrier of anything a user needs.

Neither is blocked on effort. Both are blocked on being willing to ship
something worse than the rest of the kit.

## Deliberately not doing

**Framework packages** (`-react`, `-svelte`, `-vue`). A CSS kit needs no
wrapper to be used in React — `@import` works there today. A wrapper's only
real payload is JS behaviour: modal open state, a toast queue, tab selection.
That is worth building when those components exist and consumers ask for the
state management, not before. Revisit after v0.3.

**Unit tests.** There is no unit. The equivalents that do carry weight are
already listed above — Firefox verification, visual regression, and pairing
contrast.

**Performance testing.** 741 lines of CSS, zero dependencies, zero JavaScript.
There is nothing to measure that the bundle-size badge does not already say.

## How to use this file

Additive changes are preferred and the kit is pre-1.0, but the exact-version
CDN pin means breaking changes cost a coordinated update. When a phase here
lands, move what it produced into `docs/STATE.md` — that file is the one people
read before building, and a roadmap item that shipped belongs in the record of
what *is*.
