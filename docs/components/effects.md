# Effects

```css
@import "@laddtnov/cyberpunk-ui/effects";
```

Six decorative classes. They compose onto anything — a button, a card, a
terminal — rather than being components of their own, which is why the glow is
not baked into `.cy-btn`: a button should be able to be quiet.

Everything here is decoration, and it is treated as such: all of it is removed
under `forced-colors: active`, and the animated ones stop under
`prefers-reduced-motion: reduce`.

---

## `.cy-glow` — box glow

A neon halo, as a `box-shadow`.

```html
<button class="cy-btn cy-glow">&gt;_ ENTER</button>
<div class="cy-card cy-glow--purple">…</div>
```

| Class | Colour |
| --- | --- |
| `.cy-glow` | cyan |
| `.cy-glow--pink` | pink |
| `.cy-glow--purple` | purple |
| `.cy-glow--gold` | brass gold |

**Tokens** — `--cy-cyan-rgb` `--cy-pink-rgb` `--cy-purple-rgb` `--cy-gold-rgb`

These are the `-rgb` twins, not the colour tokens: a glow is
`rgba(var(--cy-*-rgb), α)` because it needs to fade. Override the twin and the
glow follows; override only `--cy-neon-cyan` and it will not.

---

## `.cy-text-glow` — text glow

The same idea as `text-shadow`.

```html
<span class="cy-text-glow">NEON CYAN</span>
<span class="cy-text-glow--pink">NEON PINK</span>
<span class="cy-text-glow--gold" style="color: var(--cy-neon-gold)">NEON GOLD</span>
```

These classes set the halo, not the text colour — pair them with a `color` so
the two agree. `--cy-neon-gold` (`#d4af37` dark, `#7d5800` light) is the one
meant for the gold variant, and it is contrast-checked as text in both themes.

**Gold is a different register**, and the halo reflects it. The neon pair use a
10px near-shadow; gold uses 6px at higher opacity and a dimmer far shadow,
because a warm low-saturation hue smears at the radius that makes cyan look
lit. It reads as a machined edge catching light rather than a tube glowing —
the Deus Ex look rather than the *Blade Runner* one.

Do not reach for `--cy-warning` to get a yellow. It is a pale caution colour
with a meaning attached, and a heading painted in it announces nothing but
looks like a problem. Gold carries no meaning, which is what makes it safe as
decoration.

**Accessibility** — a heavy glow reduces the effective contrast of the text
underneath it. The kit's contrast floors are enforced on the *token*, not on
the token plus a halo, so keep it for display type and away from body copy.

---

## `.cy-glitch` — RGB split

Animated chromatic aberration on text. Built entirely from `text-shadow`, so
it costs no layout and shifts nothing on the page.

```html
<h1 class="cy-glitch">CYBERPUNK-UI</h1>
```

Stops under reduced motion. Under `forced-colors` the shadow is removed, which
leaves the animation with nothing to move — so it is turned off too.

**Accessibility** — this is a flicker effect on text. Keep it to short display
strings; do not apply it to anything the user has to read carefully, and never
to a whole paragraph.

---

## `.cy-scanlines` — CRT veil

A repeating translucent overlay, painted via `::after`.

```html
<div class="cy-terminal cy-scanlines">…</div>
```

Sets `position: relative` on the element and `pointer-events: none` on the
overlay, so it never intercepts clicks. Because it is an `::after`, it does not
work on elements that cannot have generated content — replaced elements like
`<img>` or `<input>`. Wrap those instead.

**Accessibility** — it darkens whatever is under it. Under `forced-colors` it
is removed entirely: a translucent black wash over recoloured text is a
contrast *reduction* applied to someone who asked for more.

---

## `.cy-grid-bg` — animated grid

A perspective grid that drifts slowly, as a `background-image`.

```html
<section class="cy-grid-bg">…</section>
```

Animates `background-position` rather than `transform`, so it can sit on any
element without hijacking its transform. Stops under reduced motion; removed
under forced colours.

---

## `.cy-cursor` — blinking cursor

A terminal caret, as an `::after` on an empty inline element.

```html
<p class="mono">deep space observatory <span class="cy-cursor"></span></p>
```

**Accessibility** — the caret is generated content, so it is not real text and
most screen readers will skip it. That is the intent. Do not use it to stand in
for content that matters.
