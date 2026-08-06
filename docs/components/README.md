# Component reference

One page per stylesheet, because that is the boundary you actually import:

| Page | Subpath | Contains |
| --- | --- | --- |
| [effects.md](effects.md) | `/effects` | glow, text glow, glitch, scanlines, grid, cursor |
| [components.md](components.md) | `/components` | button, card |
| [containers.md](containers.md) | `/containers` | accordion, modal, terminal |
| [navigation.md](navigation.md) | `/navigation` | nav bar, breadcrumb |
| [table.md](table.md) | `/table` | data table |
| [forms.md](forms.md) | `/forms` | field, label, input, select, textarea, checkbox, radio, hint, error |
| [feedback.md](feedback.md) | `/feedback` | alert, toast, badge, spinner, progress, screen-reader utility |

Importing the package whole gets all of them:

```css
@import "@laddtnov/cyberpunk-ui";
```

## How to read these pages

A CSS kit has no props. The usual "description, props, examples" template needs
one substitution to mean anything here, so each component instead documents:

**Markup** — what the kit expects. Where a component styles a native element,
that element is part of the contract and cannot be swapped for a `<div>`.

**Modifiers** — the `--variant` classes it accepts. They stack with the base
class, never replace it: `class="cy-btn cy-btn--danger"`.

**Tokens** — the custom properties that restyle it. Override them anywhere in
the cascade; you never need to touch a component rule. This is the intended way
to reskin the kit.

**Accessibility** — the part worth reading. Most of these components are a
native element with paint on top, so the browser does the work. Where the kit
*cannot* enforce something — a label association, an `aria-describedby`, a
`showModal()` call — it is listed here, because CSS has no way to make you do
it and the component will look finished either way.

## Conventions that apply everywhere

- **Every class is opt-in.** The kit never styles a bare `input`, `button`,
  `details` or `dialog`. Importing it changes nothing until you add a class.
- **Focus rings are not negotiable.** Every interactive component uses the same
  `--cy-focus-*` tokens. Removing them breaks WCAG 2.4.7; the kit scopes its
  own `outline: none` to `:disabled` only, so `[aria-disabled]` elements — which
  are still focusable — keep their ring.
- **`prefers-reduced-motion: reduce`** drops transitions and decorative
  animation throughout. Motion that carries meaning (the spinner, the accordion
  chevron) is kept and only its tween removed.
- **`prefers-contrast: more`** raises text, borders and focus rings. See
  [`../STATE.md`](../STATE.md#accessibility-floors).
- **`forced-colors: active`** hands the palette to the user. Decoration is
  dropped and state signals move to the system palette.
