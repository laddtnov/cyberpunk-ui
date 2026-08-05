# Accordion, modal and terminal

```css
@import "@laddtnov/cyberpunk-ui/containers";
```

All three are built on a native element that already owns the behaviour, so
nothing here ships as JavaScript. That is also why the markup is part of the
contract: swap the element and you lose the behaviour, not just the styling.

---

## `.cy-accordion`

A disclosure, on `<details>` / `<summary>`.

```html
<details class="cy-accordion">
  <summary>Orbital mechanics</summary>
  <div class="cy-accordion__body">
    Delta-v budgets, transfer windows, and why nobody flies straight.
  </div>
</details>
```

Add `open` to start expanded:

```html
<details class="cy-accordion" open>…</details>
```

The `<summary>` is styled through the wrapper — `.cy-accordion > summary` — so
it needs no class of its own. The body does need `.cy-accordion__body`, because
there is no readable way to select "everything that is not the summary".

| Part | Required |
| --- | --- |
| `.cy-accordion` on `<details>` | yes |
| `<summary>` as first child | yes — it is the trigger |
| `.cy-accordion__body` | for padding; the accordion works without it |

**Tokens** — `--cy-surface` `--cy-neon-cyan` `--cy-cyan-rgb` `--cy-text`
`--cy-font-mono` `--cy-radius` `--cy-border-width` `--cy-space-*` `--cy-ease`

**Accessibility**

- **Keyboard support is the browser's, and it is complete.** Tab to the
  summary, Enter or Space to toggle. The open state lives on the element, so
  assistive technology reads it without any ARIA from you.
- **Do not add `role="button"` to the summary.** It already has the right role,
  and overriding it removes the expanded/collapsed state that comes free.
- The chevron is decorative — it duplicates state the element already
  announces. Under reduced motion it still turns, because it reports state;
  only the tween is dropped.

---

## `.cy-modal`

A modal dialog, on `<dialog>`.

```html
<dialog class="cy-modal" id="confirm" aria-labelledby="confirm-title">
  <h3 id="confirm-title">Confirm jack-in</h3>
  <p>This will route your neural traffic through Night City.</p>
  <button class="cy-btn cy-btn--danger" onclick="confirm.close()">ABORT</button>
  <button class="cy-btn" autofocus>CONFIRM</button>
</dialog>
```

```js
document.getElementById('confirm').showModal();
```

**`showModal()`, never `show()`.** This is the one thing to get right:

| | `showModal()` | `show()` |
| --- | --- | --- |
| Focus trapped inside | yes | no |
| `Esc` closes it | yes | no |
| Rendered in the top layer | yes | no |
| `::backdrop` exists | yes | **no** |

`show()` gives you a non-modal box with none of the behaviour and no backdrop
to style — so the kit's scrim silently does not appear, and the page behind
stays fully interactive. Everything this component paints assumes `showModal()`.

**Tokens** — `--cy-surface` `--cy-text` `--cy-backdrop` `--cy-neon-cyan`
`--cy-cyan-rgb` `--cy-radius-lg` `--cy-border-width` `--cy-space-lg`

`--cy-backdrop` is a finished `rgba()` rather than a hue plus an `-rgb` twin,
because the alpha *is* the value. It deliberately does not follow the theme: a
scrim derived from `--cy-bg` washed near-white over near-white in the light
theme and separated nothing.

**Accessibility**

- **Give the dialog an accessible name** — `aria-labelledby` pointing at its
  heading, or `aria-label`. Without one it is announced as an unnamed dialog.
- **Put `autofocus` on the safest control**, not the destructive one. Focus
  lands there when the dialog opens.
- A `<form method="dialog">` inside closes the dialog on submit and returns the
  button's value, with no JavaScript at all.
- Closing is the consumer's: `Esc` is wired for you, but a visible close
  control should exist too.

---

## `.cy-terminal`

A code or console window. The bar is optional.

```html
<div class="cy-terminal">
  <div class="cy-terminal__bar">~/night-city — ssh</div>
  <pre>$ npm i @laddtnov/cyberpunk-ui
+ @laddtnov/cyberpunk-ui@0.4.0</pre>
</div>
```

The `<pre>` is styled scoped to the frame, so a `<pre>` anywhere else on your
page is untouched. Compose with `/effects` for the full CRT treatment — they
are separate classes so the frame can also be used plain:

```html
<div class="cy-terminal cy-scanlines">
  <pre>$ deploy --prod <span class="cy-cursor"></span></pre>
</div>
```

**Tokens** — `--cy-surface` `--cy-text` `--cy-neon-cyan` `--cy-cyan-rgb`
`--cy-font-mono` `--cy-radius` `--cy-border-width` `--cy-space-*`

**Accessibility**

- **Decide whether the content is code or decoration.** Real code belongs in
  `<pre><code>`; ASCII art or a fake console transcript is decorative and
  should be `aria-hidden="true"`, or a screen reader will read every character
  of it aloud.
- A long transcript scrolls horizontally. A scrollable region needs to be
  reachable by keyboard — give the `<pre>` a `tabindex="0"` and a label if it
  can overflow, so a keyboard user can scroll it.
- The bar is a text label, not a control. If you put buttons in it, they are
  ordinary buttons and need their own names.
