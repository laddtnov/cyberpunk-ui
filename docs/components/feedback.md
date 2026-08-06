# Alerts, toasts, badges, spinner, progress

```css
@import "@laddtnov/cyberpunk-ui/feedback";
```

Everything here tells the user something. The kit can make that visible; only
your markup can make it *announced*, and this page is mostly about that gap.

---

## `.cy-alert`

An inline message that stays on the page.

```html
<div class="cy-alert cy-alert--success">Upload complete.</div>
```

| Modifier | Meaning |
| --- | --- |
| *(none)* | informational — same as `--info` |
| `--info` | neutral information |
| `--success` | something worked |
| `--warning` | something needs attention |
| `--danger` | something failed |

**Tokens** — `--cy-info` `--cy-success` `--cy-warning` `--cy-danger` and their
`-rgb` twins, `--cy-text` `--cy-font-mono` `--cy-radius` `--cy-space-*`

**Accessibility**

- **Colour is not the message.** The variants differ only by hue, so the text
  has to carry the meaning on its own — "Upload complete", not "Done" in green.
  This is WCAG 1.4.1, and it is the one that gets missed.
- **An alert already on the page at load needs no ARIA.** Add
  `role="alert"` *only* if it appears in response to something and must
  interrupt — it is assertive and rude by design. For a message that can wait,
  use `<output>` or `role="status"`.

---

## `.cy-toast` and `.cy-toast-container`

A transient message, stacked in a fixed corner.

```html
<div class="cy-toast-container">
  <output class="cy-toast cy-toast--success">Package published.</output>
</div>
```

| Class | Effect |
| --- | --- |
| `.cy-toast-container` | fixed, top-right |
| `.cy-toast-container--bottom` | fixed, bottom-right |
| `.cy-toast--success` / `--warning` / `--danger` | accent colour |

**Accessibility**

- **`<output>` is doing real work here** — it is a live region by default, so
  the text is announced when it appears. A `<div class="cy-toast">` is silent:
  it looks identical and tells a screen-reader user nothing.
- **Do not auto-dismiss anything the user must act on.** A toast that vanishes
  on a timer is unreadable to anyone who needs longer, and WCAG 2.2.1 expects
  the timing to be adjustable. Dismissable beats timed.
- The container is `pointer-events: none` so it never blocks the page; the
  toasts themselves re-enable pointer events. Keep any close button inside a
  toast, not on the container.

---

## `.cy-badge`

A small status pill.

```html
<span class="cy-badge cy-badge--success">LIVE</span>
<span class="cy-badge cy-badge--outline">v0.4</span>
```

| Modifier | Effect |
| --- | --- |
| `--success` / `--warning` / `--danger` | status colour |
| `--outline` | transparent fill, coloured border — stacks with the above |

**Accessibility**

- A badge is decorative text. If it conveys status that is not obvious from
  its surroundings, say so in the text or in nearby content — "Build: passing",
  not a green pill on its own.
- Under `forced-colors` badges gain a border, because a filled shape with no
  border dissolves into the forced background.

---

## `.cy-spinner`

An indeterminate loading indicator.

```html
<output class="cy-spinner"><span class="cy-sr-only">Loading…</span></output>
```

**Accessibility**

- **A spinner is silent without text.** The `.cy-sr-only` label is not
  optional — on its own the element is a spinning ring that no screen reader
  can describe.
- Under reduced motion it **keeps spinning**, deliberately, and only slows: a
  frozen spinner reads as a hung page. It is essential feedback, not
  decoration.
- Its animation reads because three borders are faint and one is bright, which
  is why `forced-colors` gives it two distinct system colours — otherwise it
  becomes a static ring that still looks fine and no longer means anything.

---

## `.cy-progress`

Determinate progress, on the native element.

```html
<progress class="cy-progress" value="66" max="100"></progress>
```

Announced, keyboard-inspectable, and it needs nothing else from you. Drop
`value` for an indeterminate bar — the element handles that state itself.

**Accessibility**

- Give it a name if the surrounding text does not already supply one:
  `aria-label`, or a `<label for>` pointing at it.
- Do not reach for `role="progressbar"` on a `<div>`. That was the second code
  path this component used to ship, and it was **removed in 0.5.0**: a bare div
  announces nothing, so correct use needed the role, all three `aria-value*`
  attributes *and* a name — four things the kit could not enforce and that were
  easy to omit, leaving a bar that looked finished and told a screen reader
  nothing. The migration note is in CHANGELOG 0.5.0.

---

## `.cy-sr-only`

Visually hidden, still announced. For text that a screen reader needs and the
design does not.

```html
<button class="cy-btn">
  <span aria-hidden="true">✕</span>
  <span class="cy-sr-only">Close</span>
</button>
```

Do not use it to hide things from everyone — that is `display: none`. This
class is specifically "hidden from eyes, present for assistive technology".
