# Data table

```css
@import "@laddtnov/cyberpunk-ui/table";
```

The component where the markup carries the most meaning and CSS can supply
none of it. A table with no `scope`, no `<caption>` and no `<thead>` looks
**exactly** like one that has all three.

## `.cy-table`

```html
<table class="cy-table">
  <caption>Reactor readings</caption>
  <thead>
    <tr>
      <th scope="col">Node</th>
      <th scope="col">Output</th>
      <th scope="col">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Core A</th>
      <td>982 TW</td>
      <td>Live</td>
    </tr>
  </tbody>
</table>
```

Cells are styled through the wrapper (`.cy-table th`, `.cy-table td`), so a
table elsewhere on the page is untouched.

| Modifier | Effect |
| --- | --- |
| `--striped` | Alternating row tint |
| `--compact` | Tighter cell padding |

**Tokens** — `--cy-text` `--cy-heading` `--cy-neon-cyan` `--cy-cyan-rgb`
`--cy-font-mono` `--cy-border-width` `--cy-space-*`

## The three things only your markup can do

**`scope` on every header.** This is what lets a screen reader announce
"Output: 982 TW" while moving through a row, instead of reading a wall of
numbers with no idea which column they belong to. `scope="col"` on column
headers, `scope="row"` on the cell that labels each row. Without it the
association is guesswork.

**`<caption>` names the table.** It is the table's accessible name and the
thing announced when a user lands on it. Styled here as a small uppercase
label above the table, so it earns its place visually too — a `<div>` above
the table looks the same and names nothing.

**`<thead>` makes a header row a header row.** Bold text in the first `<tr>`
is not a header; it is bold text.

## Wide tables

```html
<div class="cy-table-scroll" tabindex="0" role="region"
     aria-label="Reactor readings">
  <table class="cy-table">…</table>
</div>
```

`.cy-table-scroll` gives horizontal overflow. The three attributes are not
optional decoration:

- **`tabindex="0"`** makes the box reachable by keyboard. A scrollable region
  that only responds to a mouse or a trackpad fails WCAG 2.1.1 — there is
  content the keyboard user simply cannot reach.
- **`role="region"` and a name** are required *because* it is focusable.
  Something the user can tab to must announce what it is; an unnamed focusable
  `<div>` announces nothing.

Skip the wrapper entirely when the table fits. A focusable element that never
needs to scroll is one more stop in the tab order for no reason.

## Accessibility notes

- **Striping is decoration.** It helps the eye track a row across a wide table
  and carries no meaning. Under `forced-colors` it is dropped, since a
  background tint is rewritten to the page background and striped rows would
  become indistinguishable from plain ones anyway — the borders do the work
  there.
- **Do not use a table for layout.** It announces as a data table, and a
  screen-reader user gets row and column counts for something that has neither.
- Row hover is a pointer affordance only; it has no keyboard equivalent and
  conveys nothing, so nothing is lost when it does not apply.
