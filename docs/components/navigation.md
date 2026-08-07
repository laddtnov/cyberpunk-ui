# Nav bar and breadcrumb

```css
@import "@laddtnov/cyberpunk-ui/navigation";
```

Neither component gets *behaviour* from its element the way `<details>` and
`<dialog>` do — a `<nav>` is a landmark, not a widget. What the elements give
is **semantics**, and the markup contract exists to keep it: a breadcrumb that
is not a list announces as a run of loose links.

## There is no `--active` modifier, on purpose

The current item is marked with **`aria-current`**, and that attribute is what
the kit styles from.

A `--active` class would let you build a nav whose current item *looks* current
and announces as ordinary — the same shape of failure the rest of this
reference is written to prevent. Styling the attribute means the appearance and
the announcement cannot drift apart, because they are the same declaration.

```html
<a href="/api" aria-current="page">API</a>
```

Use `page` for the current page, `step` in a wizard, `location` in a
breadcrumb-as-map. Any value styles the same; the value is for the screen
reader.

---

## `.cy-nav`

```html
<nav class="cy-nav" aria-label="Main">
  <a class="cy-nav__brand" href="/">&gt;_ night.city</a>
  <a href="/sectors">Sectors</a>
  <a href="/reactor" aria-current="page">Reactor</a>
</nav>
```

Links are styled through the wrapper (`.cy-nav a`), so the markup contract is
one class on the `<nav>`. `.cy-nav__brand` pushes everything after it to the
right and takes the accent colour.

**Tokens** — `--cy-surface` `--cy-text` `--cy-neon-cyan` `--cy-cyan-rgb`
`--cy-font-mono` `--cy-border-width` `--cy-space-*` `--cy-focus-*`

**Accessibility**

- **Label the landmark** if the page has more than one `<nav>` — which it does
  the moment you add a breadcrumb. `aria-label="Main"` and
  `aria-label="Breadcrumb"` are what let someone tell them apart when jumping
  between landmarks.
- Mark the current page with `aria-current="page"`. Without it the nav has no
  current item at all, in either sense.
- The kit does not ship a mobile menu. A disclosure pattern needs a button, an
  expanded state and focus management; that is behaviour, and behaviour would
  mean JavaScript. Wrap the links in a `<details>` with `.cy-accordion` if you
  need one without writing any.

---

## `.cy-breadcrumb`

```html
<nav aria-label="Breadcrumb">
  <ol class="cy-breadcrumb">
    <li><a href="/">Home</a></li>
    <li><a href="/sector">Sector 7</a></li>
    <li><a href="/sector/reactor" aria-current="page">Reactor core</a></li>
  </ol>
</nav>
```

**The `<ol>` is not decoration.** It is what makes this a trail rather than a
row of unrelated links, and what tells a screen reader how many steps there are
and which one this is. The wrapping `<nav aria-label="Breadcrumb">` is what
lets someone jump to it. Neither can be supplied by CSS, and the component
looks identical without them.

**Tokens** — `--cy-text` `--cy-neon-cyan` `--cy-font-mono` `--cy-space-*`
`--cy-focus-*`

**Accessibility**

- **The separator is generated content and must not be read aloud.** The kit
  declares it as `content: "/" / ""` — the second half is the alternative text,
  and an empty string means "this glyph has no spoken equivalent". Do not put
  separators in the markup; a `<li>/</li>` is a list item that says "slash".
- The last crumb keeps its `href` rather than becoming plain text, so the trail
  stays navigable when a user arrives from elsewhere. `aria-current="page"` is
  what marks it as the destination.
- Under `forced-colors` the current crumb also gains weight, because colour
  alone is what distinguishes it and forced colours collapses every link to one
  value.

---

## `.cy-sidebar`

```html
<nav class="cy-sidebar" aria-labelledby="sectors">
  <h2 class="cy-sidebar__title" id="sectors">Sectors</h2>
  <ul>
    <li><a href="/overview">Overview</a></li>
    <li><a href="/reactor" aria-current="page">Reactor core</a></li>
    <li><a href="/archive">Archive</a></li>
  </ul>
</nav>
```

**The `<ul>` is required**, for the same reason the breadcrumb's `<ol>` is: it
is what makes a screen reader announce "list, 5 items" and count the way
through them. A column of bare links looks identical and announces as a run of
loose links.

**The title should be a heading.** It is a real section heading in the
document, so it belongs in the outline people use to skip around a page, and
`aria-labelledby` then names the landmark from it without repeating the text. A
`<span>` styles the same and announces nothing — that is the entire difference,
and none of it is visible. Pick the level that fits the page (`<h2>` under an
`<h1>`, `<h3>` inside an `<h2>` section); the class does not care.

**The sidebar sets no width.** Where it sits and how wide it is are the page's
decisions, not the component's — a kit that hardcodes `16rem` is a kit you
fight inside a grid. Give it a column:

```css
.layout { display: grid; grid-template-columns: 14rem 1fr; gap: 1.5rem; }
```

It is also **not sticky and not scrollable** by default. Making it a scroll
container would oblige it to be keyboard-reachable and labelled — the contract
`.cy-table-scroll` carries — and that is a real cost to impose on every sidebar
for the sake of the tall ones. Add `position: sticky; top: 0; align-self:
start;` in your own layout when you want it, or the `tabindex="0"` plus
`aria-label` pair if you also make it scroll.

**Tokens** — `--cy-surface` `--cy-text` `--cy-neon-cyan` `--cy-cyan-rgb`
`--cy-font-mono` `--cy-radius` `--cy-space-*` `--cy-focus-*`

**Accessibility**

- Label the landmark, with `aria-labelledby` pointing at the title when there
  is one and `aria-label` when there is not. A page with a nav bar, a
  breadcrumb and a sidebar has three `<nav>` landmarks, and unlabelled they are
  three identical entries in a jump list.
- Mark the current item with `aria-current="page"`. There is no `--active`
  class, deliberately — see the top of this page.
- The current item carries three signals: colour, a left marker and a faint
  tint. Under `forced-colors` two of them go — the cyan collapses to the one
  link colour and the tint to the page background — so the marker is pinned to
  `LinkText` and the label gains weight. Two signals again, neither of them
  hue.
- The marker sits on the left edge rather than under the label because in a
  vertical stack an underline reads as a separator between items rather than as
  a mark on one.
