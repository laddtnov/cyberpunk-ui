# Form controls

```css
@import "@laddtnov/cyberpunk-ui/forms";
```

Every control here is the **real native element** with `appearance: none` and
paint on top — never a hidden input beside a styled `<span>`. The input stays
the thing that takes focus and gets announced; the kit only changes how it
looks. That is what makes the keyboard and screen-reader behaviour correct by
default rather than something you have to rebuild.

---

## `.cy-field`, `.cy-label`, `.cy-hint`, `.cy-error`

The wrapper and its text. `.cy-field` is a column with consistent spacing;
the rest are type styles.

```html
<div class="cy-field">
  <label class="cy-label" for="callsign">Callsign</label>
  <input class="cy-input" id="callsign" type="text" aria-describedby="callsign-hint">
  <span class="cy-hint" id="callsign-hint">As it should appear publicly.</span>
</div>
```

**Accessibility — the part CSS cannot do for you:**

- **`for` on the label must match `id` on the input.** Without it the label is
  loose text: clicking it does not focus the field, and a screen reader
  announces the input as unlabelled. Nothing about the styling will look wrong.
- **`.cy-hint` and `.cy-error` are inert without `aria-describedby`.** They are
  styled text and nothing more. Point the input at them by `id` or they are
  invisible to assistive technology — the user hears a field with no
  explanation of why it was rejected.
- Never use the placeholder as the label. It disappears on typing, and it is
  not an accessible name.

---

## `.cy-input`

One class for text inputs, `<select>` and `<textarea>`.

```html
<input class="cy-input" type="email">
<select class="cy-input"><option>Night City</option></select>
<textarea class="cy-input"></textarea>
```

| Modifier | Effect |
| --- | --- |
| `--sm` | Smaller padding and type |
| `--lg` | Larger padding and type |

`<select>` gets a custom arrow — native dropdown arrows cannot be styled
consistently, so the kit draws its own as a background SVG. **Its colour is
baked in per theme**, so if you override `--cy-neon-cyan` the arrow will not
follow. That is a known limitation, recorded in [`../STATE.md`](../STATE.md).

`<textarea>` is `resize: vertical` — horizontal resizing breaks layouts and
gains nothing.

### Validation

Two independent paths, and they are easy to confuse:

| Selector | Driven by | Fires |
| --- | --- | --- |
| `:user-invalid` | the browser | only after the user has interacted |
| `[aria-invalid="true"]` | your JavaScript | the moment you set it |

**The kit uses `:user-invalid`, never `:invalid`.** `:invalid` matches an empty
required field before the user has typed anything, so a form built on it loads
pre-shouting in red at someone who has done nothing wrong.

```html
<!-- browser-driven: quiet on load, red once it has been left invalid -->
<input class="cy-input" type="email" required>

<!-- JS-driven: red immediately, because you said so -->
<input class="cy-input" aria-invalid="true" aria-describedby="mail-error">
<span class="cy-error" id="mail-error">Enter a valid address.</span>
```

Setting `aria-invalid` on a field is what announces it as invalid. The red
border is for people who can see it; the attribute is for everyone else.

---

## `.cy-checkbox` and `.cy-radio`

```html
<label><input class="cy-checkbox" type="checkbox"> Encrypt</label>
<label><input class="cy-radio" type="radio" name="route"> Primary</label>
```

Checked states signal by fill: the checkbox fills solid with a knocked-out
tick, the radio fills with a dot. Both then read as "selected" the same way,
which is why they look consistent side by side.

**Tokens** — `--cy-neon-cyan` `--cy-cyan-rgb` `--cy-bg` `--cy-surface`
`--cy-radius-sm` `--cy-border-width` `--cy-focus-*` `--cy-disabled-opacity`

**Accessibility**

- **Wrap in a `<label>` or use `for`/`id`.** A bare checkbox has no name.
- **Radios need a shared `name`.** Without it they are not a group: arrow keys
  will not move between them and more than one can be selected.
- The controls are real inputs, so Space toggles and arrow keys move within a
  radio group with no help from the kit.
- Under `forced-colors`, both switch to the system `Highlight` pair — the
  checkbox's knocked-out tick and the radio's background-image dot would
  otherwise disappear. See [`../STATE.md`](../STATE.md#accessibility-floors).

---

## Disabled controls

`:disabled` dims via `--cy-disabled-opacity` and drops the focus ring, because
a disabled control is out of the tab order anyway.

If you need the control to stay reachable — so a screen-reader user can find
out it exists — use `aria-disabled="true"` instead. It **keeps its focus
ring**, deliberately. Do not remove it.
