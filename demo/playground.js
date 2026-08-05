// Theme playground — demo only, never published.
//
// The kit itself ships no JavaScript; `files` in package.json is
// ["*.css", "README.md", "LICENSE"], so nothing in demo/ reaches consumers.
// This file exists to make one argument visible: the token substrate is the
// product, and you should be able to reskin the whole kit without touching a
// single component rule.

const root = document.documentElement;
const colours = [...document.querySelectorAll('#pg [data-var]')];
const radius = document.getElementById('pg-radius');
const border = document.getElementById('pg-border');
const radiusOut = document.getElementById('pg-radius-out');
const borderOut = document.getElementById('pg-border-out');
const status = document.getElementById('pg-status');
const out = document.getElementById('pg-out');
const outCss = document.getElementById('pg-out-css');

// Everything the user has actually overridden, so COPY CSS emits only the
// deltas rather than a dump of every token at its default.
const overrides = new Map();

const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16)).join(', ');
};

// getComputedStyle returns whatever the cascade resolved, which is what the
// colour input needs — but it can come back as `rgb(0, 242, 255)` rather than
// a hex, and <input type="color"> only accepts hex.
const toHex = (value) => {
  const v = value.trim();
  if (v.startsWith('#')) return v.length === 4 ? '#' + [...v.slice(1)].map((c) => c + c).join('') : v;
  const m = v.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return '#000000';
  return '#' + m.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, '0')).join('');
};

const readToken = (name) => getComputedStyle(root).getPropertyValue(name);

const setToken = (name, value) => {
  root.style.setProperty(name, value);
  overrides.set(name, value);
};

const say = (msg) => {
  status.textContent = msg;
  clearTimeout(say.t);
  say.t = setTimeout(() => { status.textContent = ''; }, 2400);
};

// ── Colours ───────────────────────────────────────────────────────
// A colour token and its -rgb twin are written together, always. Every
// translucent glow in the kit is rgba(var(--cy-*-rgb), α), so setting the hue
// alone recolours borders and text and leaves every glow on the old hue — the
// single most visible way to get this wrong.
for (const input of colours) {
  input.addEventListener('input', () => {
    const token = input.dataset.var;
    const twin = input.dataset.rgb;
    setToken(token, input.value);
    if (twin) setToken(twin, hexToRgb(input.value));
  });
}

// ── Geometry ──────────────────────────────────────────────────────
// One slider drives all three radius tokens proportionally, which keeps their
// relationship intact; at the default of 4 it reproduces the shipped 2/4/8.
const applyRadius = (px) => {
  setToken('--cy-radius-sm', Math.round(px / 2) + 'px');
  setToken('--cy-radius', px + 'px');
  setToken('--cy-radius-lg', px * 2 + 'px');
  radiusOut.textContent = px + 'px';
};

radius.addEventListener('input', () => applyRadius(Number(radius.value)));

border.addEventListener('input', () => {
  setToken('--cy-border-width', border.value + 'px');
  borderOut.textContent = border.value + 'px';
});

// ── Sync the controls to whatever the theme currently resolves to ──
// Called on load and after a theme switch. Inline styles on :root outrank both
// the base :root rule and :root[data-theme="light"], so an edit made in one
// theme would otherwise survive into the other and look broken — a dark
// background pinned over the light theme, for instance. Switching themes
// therefore clears the overrides and starts from that theme's own values.
const sync = () => {
  root.removeAttribute('style');
  out.hidden = true;
  overrides.clear();
  for (const input of colours) input.value = toHex(readToken(input.dataset.var));
  const r = Number.parseInt(readToken('--cy-radius'), 10) || 4;
  const b = Number.parseInt(readToken('--cy-border-width'), 10) || 1;
  radius.value = r; radiusOut.textContent = r + 'px';
  border.value = b; borderOut.textContent = b + 'px';
};

// ── Copy / reset ──────────────────────────────────────────────────
const toCss = () => {
  if (!overrides.size) return null;
  const body = [...overrides].map(([k, v]) => `  ${k}: ${v};`).join('\n');
  return `:root {\n${body}\n}`;
};

document.getElementById('pg-copy').addEventListener('click', async () => {
  const css = toCss();
  if (!css) return say('Nothing changed yet.');

  // Shown as well as copied. Seeing the block is the point — it is what you
  // paste into your own project — and it doubles as the fallback path.
  out.hidden = false;
  outCss.textContent = css;

  try {
    await navigator.clipboard.writeText(css);
    say(`Copied ${overrides.size} overrides.`);
  } catch {
    // A clipboard write needs a secure context and permission, and a static
    // demo guarantees neither. Select the text so Cmd/Ctrl+C still works —
    // the same fallback the install button in the topbar uses.
    const range = document.createRange();
    range.selectNodeContents(outCss);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    say('Clipboard blocked — press ⌘C.');
  }
});

document.getElementById('pg-reset').addEventListener('click', () => {
  sync();
  out.hidden = true;
  say('Reset to theme defaults.');
});

document.addEventListener('cy-theme-change', sync);
sync();
