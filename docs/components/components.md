# Button and card

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

**Tokens** — `--cy-surface` `--cy-text` `--cy-cyan-rgb` `--cy-radius-lg`
`--cy-border-width` `--cy-space-*`

**Accessibility**

- A card is a `<div>` and means nothing to a screen reader. If the card is a
  list item, put it in a `<li>`; if it is an article, use `<article>`; if it
  is a region worth navigating to, give it a heading. The class paints a box —
  the semantics are yours.
- **A whole card is not a link.** Wrapping the entire card in an `<a>` gives
  screen-reader users one enormous link whose accessible name is every word
  inside it. Link the heading instead.
