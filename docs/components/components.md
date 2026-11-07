# Button, card, and content

```css
@import "@laddtnov/cyberpunk-ui/components";
```

Needs `/tokens` — every value below comes from a custom property.

---

## `.cy-btn`

A button. Works on `<button>` and on `<a>`, which is the point: use whichever
the action actually is. A thing that navigates is a link; a thing that acts is
a button. The kit styles both identically so that choice stays free.

```html
<button class="cy-btn">CONFIRM</button>
<a href="/docs" class="cy-btn">READ THE DOCS</a>
```

| Modifier | Effect |
| --- | --- |
| `--secondary` | Muted fill, for the lesser of two actions |
| `--danger` | Red border and text, for destructive actions |
| `--pink` | Pink accent instead of cyan |
| `--sm` | Smaller padding and type |
| `--lg` | Larger padding and type |

Combine with `.cy-glow` or `.cy-glow--pink` from `/effects` for the neon halo —
it is a separate class so a button can be quiet when it needs to be.

```html
<button class="cy-btn cy-btn--danger cy-btn--lg">DELETE EVERYTHING</button>
```

**Tokens** — `--cy-neon-cyan` `--cy-neon-pink` `--cy-danger` `--cy-bg`
`--cy-text` `--cy-font-mono` `--cy-radius` `--cy-border-width`
`--cy-space-sm` `--cy-space-md` `--cy-space-xl` `--cy-disabled-opacity`
`--cy-focus-width` `--cy-focus-offset` `--cy-focus-color`

**Accessibility**

- **`:disabled` and `[aria-disabled="true"]` are not the same thing, and the
  kit treats them differently on purpose.** A real `:disabled` button is
  removed from the tab order, so it gets no focus ring. An
  `[aria-disabled="true"]` button is still focusable — a screen-reader user can
  land on it — so it **keeps its ring**. If you use the ARIA form to keep the
  control reachable, do not add `outline: none` on top; that is the WCAG 2.4.7
  failure the kit is avoiding.
- An `<a class="cy-btn">` with no `href` is not focusable and not announced as
  anything. If it must look like a button and act like one, use a `<button>`.
- The label is your text. An icon-only button needs `aria-label`; nothing in
  CSS can supply one.

---

## `.cy-card`

A surface panel. No internal structure imposed — put whatever you like inside.

```html
<div class="cy-card">
  <h3>Galaxy Map</h3>
  <p>Click-to-travel navigation across a spinning canvas universe.</p>
</div>
```

Takes glow classes the same way the button does:

```html
<div class="cy-card cy-glow--purple">…</div>
```

**Tokens** — `--cy-surface` `--cy-text` `--cy-radius-lg`
`--cy-border-width` `--cy-space-*`

**Accessibility**

- A card is a `<div>` and means nothing to a screen reader. If the card is a
  list item, put it in a `<li>`; if it is an article, use `<article>`; if it
  is a region worth navigating to, give it a heading. The class paints a box —
  the semantics are yours.
- **A whole card is not a link.** Wrapping the entire card in an `<a>` gives
  screen-reader users one enormous link whose accessible name is every word
  inside it. Link the heading instead.

---

## `.cy-kbd`

A keycap, on `<kbd>`. The element already means "the user presses this"; the
class only makes it look pressable.

```html
<p>Press <kbd class="cy-kbd">⌘</kbd><kbd class="cy-kbd">K</kbd> for the console,
   <kbd class="cy-kbd">Esc</kbd> to drop out.</p>
```

Sized in `em`, not from the spacing scale, so a keycap tracks the type around
it instead of standing at one fixed size inside a heading and inside body text
alike. `min-inline-size: 1.6em` stops a single letter collapsing to a sliver
while `Esc` keeps its own width.

**Tokens** — `--cy-neon-cyan` `--cy-surface` `--cy-font-mono`
`--cy-radius-sm` `--cy-border-width`

**Accessibility**

- One `<kbd>` per key. `<kbd class="cy-kbd">⌘K</kbd>` is one cap with two
  glyphs on it; two elements are two caps, which is what a reader expects and
  what the styling is built for.
- Spell the key the way the user's keyboard does. `Esc` and `⌘` are legible;
  `U+001B` is not.

---

## `.cy-dl`

A term/value readout, on `<dl>`. Gold monospace labels in a column that sizes
itself to the longest one, values aligned against them — a HUD stat block.

```html
<dl class="cy-dl">
  <dt>Callsign</dt>
  <dd>NIGHTJAR</dd>
  <dt>Clearance</dt>
  <dd>Tier 2 — district</dd>
  <dd>Tier 4 — arcology, revoked</dd>
</dl>
```

The two columns are assigned explicitly rather than left to auto-placement, so
a term with several `<dd>` values stacks them in the value column instead of
pushing the second one under the label.

**Tokens** — `--cy-neon-gold` `--cy-text` `--cy-heading` `--cy-font-mono`
`--cy-space-sm` `--cy-space-lg`

**Accessibility**

- A `<dl>` is for name/value pairs, not for layout. If the left column is not
  naming the right one, a two-column grid is the honest markup.
- The kit styles `.cy-dl > dt` and `.cy-dl > dd` — direct children. Wrapping
  pairs in `<div>`, which the HTML spec allows, opts out of the grid; style
  the wrapper yourself if you need it.

---

## `.cy-figure`

A framed figure, on `<figure>`. The UA margin is `1em 40px`, which indents a
figure out of alignment with everything around it; the frame replaces it.

```html
<figure class="cy-figure">
  <img src="uplink.png" alt="Signal strength rising over 24 hours">
  <figcaption>FIG. 01 — District uplink, 24h</figcaption>
</figure>
```

`<svg>` and `<video>` are styled beside `<img>`, because a diagram and a clip
are the same kind of content here — leaving them out would mean a figure that
frames a picture but lets a video overflow it.

**Tokens** — `--cy-neon-cyan` `--cy-text` `--cy-font-mono` `--cy-radius`
`--cy-radius-sm` `--cy-border-width` `--cy-space-xs` `--cy-space-sm`
`--cy-space-lg`

**Accessibility**

- **A `<figcaption>` is not an `alt`.** The caption is read to everyone; the
  alt text describes the image to someone who cannot see it. An image whose
  only description is its caption is an image with no description.
- A caption is dimmed below body text at rest, and
  `prefers-contrast: more` brings it back to full `--cy-text`.

---

## `.cy-quote`

A pull quote, on `<blockquote>`.

```html
<blockquote class="cy-quote">
  <p>The grid remembers every door you ever opened. Walk quietly.</p>
  <cite>Netrunner's almanac</cite>
</blockquote>
```

No decorative `"` from `::before`: generated content is announced by some
screen readers and not others, and a quotation already announces itself. The
accent rule is `calc(var(--cy-border-width) * 3)` rather than a flat `3px`, so
`prefers-contrast: more` thickens it along with every other border in the kit.

`<cite>` is reset to upright — monospace and italic together read as a mistake
rather than as an attribution.

**Tokens** — `--cy-neon-pink` `--cy-text` `--cy-font-mono`
`--cy-border-width` `--cy-space-sm` `--cy-space-md` `--cy-space-lg`

**Accessibility**

- `<cite>` names a *work*, not a person. For a quoted speaker the spec wants
  the name in plain text; the kit styles `<cite>` because that is what most
  pull quotes use, and the distinction is yours to make.
- Use `cite="https://…"` on the `<blockquote>` for the source URL. It is
  machine-readable and invisible, so give the reader a real link too if the
  source matters to them.
