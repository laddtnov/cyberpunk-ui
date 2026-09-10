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

**Tokens** — `--cy-surface` `--cy-neon-cyan` `--cy-text`
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

**Tokens** — `--cy-surface` `--cy-text` `--cy-backdrop` `--cy-neon-cyan` `--cy-radius-lg` `--cy-border-width` `--cy-space-lg`

`--cy-backdrop` is a finished `rgba()` rather than a hue mixed at some alpha,
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

## `.cy-popover` — toggle-tip

```html
<button class="cy-btn cy-btn--sm" popovertarget="tip">?</button>
<div class="cy-popover" popover id="tip">
  Visible to other operatives.
</div>
```

**A toggle-tip, not a tooltip**, and that distinction is the whole point. A
CSS-only tooltip fires on `:hover`, which means keyboard users never see it,
touch users never see it, and a screen reader is never told it exists. The kit
declined tooltips for four versions on exactly that basis.

The Popover API makes the trigger a real button: focusable, activatable by
Enter and Space, and announced with its state. Measured in the accessibility
tree — the invoker reports `expanded=false` closed and `expanded=true` open,
set by the browser, with no ARIA in your markup. The browser also handles
Escape, light-dismiss and the top layer. No JavaScript ships.

**Positioning.** The browser centres a popover in the viewport, which works
everywhere and is a reasonable place for a short explanation. Where CSS anchor
positioning exists, the kit pins it above the trigger instead — an enhancement
behind `@supports`, because anchor positioning is Chrome-only today. Anchoring
applies when the trigger carries `.cy-btn`.

**Tokens** — `--cy-surface` `--cy-text` `--cy-neon-cyan` `--cy-font-mono`
`--cy-radius` `--cy-border-width` `--cy-space-*`

**Accessibility**

- Requires `popover` support: Baseline since January 2025 (Chrome 116,
  Firefox 125, Safari 17). Older browsers show the panel inline, unstyled and
  always visible — degraded but not broken.
- **Not a hover affordance, deliberately.** Hover-triggered popovers need
  interest invokers, which are Chrome-only at the time of writing, and a
  hover-only tooltip is the failure this component was built to avoid.
- Give the trigger a real label. `?` alone reads as "question mark button".

---

## Tabs: use `<details name>`

The kit ships no tab component, and this is the recommended substitute rather
than a placeholder for one.

```html
<details class="cy-accordion" name="panels" open>
  <summary>Overview</summary>
  <div class="cy-accordion__body">…</div>
</details>
<details class="cy-accordion" name="panels">
  <summary>Reactor</summary>
  <div class="cy-accordion__body">…</div>
</details>
```

A shared `name` makes the group exclusive: opening one closes the others, which
is the behaviour people reach for tabs to get. Baseline since September 2024.

Real tabs need `role="tablist"`, roving `tabindex`, and arrow-key navigation
between tabs. None of that is expressible in CSS, and the CSS-only imitations —
hidden radio inputs, `:target` — produce a control that announces itself as
something it is not. That has not changed, and it is why the kit ships no tab
component at all.

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

**Tokens** — `--cy-surface` `--cy-text` `--cy-neon-cyan`
`--cy-font-terminal` `--cy-radius` `--cy-border-width` `--cy-space-*`

### Nerd Font glyphs

This is the one component with its own type token. `--cy-font-terminal` names
[Nerd Fonts](https://www.nerdfonts.com/) first — patched builds of ordinary
monospaces carrying a few thousand extra glyphs, the powerline separators and
file-type and branch icons that make a fake terminal look like a real one —
then falls through to `--cy-font-mono`:

```css
--cy-font-terminal: 'Hack Nerd Font Mono', 'JetBrainsMono Nerd Font',
                    'FiraCode Nerd Font', var(--cy-font-mono);
```

**Nothing is shipped and nothing is required.** The patched builds run to tens
of megabytes against a kit measured in kilobytes, so the token asks for what a
developer machine often already has. Without one the terminal renders in
`--cy-font-mono` exactly as before; the icons are simply absent. Point the
token at your own font to change that:

```css
:root { --cy-font-terminal: 'JetBrainsMono Nerd Font', monospace; }
```

If you put icon glyphs in the markup, remember they are **private-use
codepoints**: a screen reader will announce nothing useful and a machine
without the font shows a box. Treat them as decoration —
`aria-hidden="true"` — and never as the only carrier of meaning.

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
