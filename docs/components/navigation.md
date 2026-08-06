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
