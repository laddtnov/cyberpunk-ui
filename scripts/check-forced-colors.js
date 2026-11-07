#!/usr/bin/env node
// Audits every component under a real forced-colors implementation, against
// the palettes Windows actually ships. Zero dependencies by design: this
// package ships none, and neither do its tools.
//
//   npm run check:forced-colors
//
// Why this exists, and what it is not
// ───────────────────────────────────
// The kit has carried `forced-colors: active` rules since 0.4.0, verified
// only by Chromium's emulation — which approximates one theme, in one engine.
// The two things that made that weak evidence are exactly what this covers:
// a second engine, and more than one palette.
//
// It is still not Windows. Nobody has run this kit on Windows High Contrast,
// and until someone does, that sentence stays in the docs. What this does is
// drive **Gecko's own forced-colors code path** — not an emulation of it —
// with the colour values of the four contrast themes Windows 11 ships.
//
// Firefox enters that path when `ui.useAccessibilityTheme` is 1, and every
// system colour is then taken from a `ui.*` pref. Measured, not assumed: with
// the Night Sky values set, `Canvas` resolves to #000000, `ButtonFace` to
// #FFEE32, `Highlight` to #D6B4FD, a `#00f2ff` border comes back as #FFFFFF,
// and `box-shadow` comes back `none`. Gecko also reports
// `prefers-contrast: more` as matching, so both of the kit's media blocks
// apply at once — which is the real condition on Windows and the reason this
// checks the combination rather than forced colours alone.
//
// How it runs
// ───────────
// Firefox is launched through `open`, not spawned directly. Spawned, macOS
// refuses its content-process sandbox — `sandbox_extension_issue_file_to_
// process failed ... Operation not permitted` — and no page ever loads. Going
// through LaunchServices gives it the entitlements it needs.
//
// Because of that there is no debugging protocol to talk to. The audit runs
// inside the page: a harness document frames the demo, inspects it, and POSTs
// its findings back to this server. One browser, one profile per palette, no
// automation dependency.
//
// Like check-visual.js this is NOT in CI — it needs a desktop Firefox.

const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const FIREFOX = '/Applications/Firefox.app';

// The four contrast themes Windows 11 ships, as colour values.
//
// Sourced from the travis-jeans/High-Contrast-Windows-11-Themes tables on
// Codeberg, which documents each theme's palette. They are a community
// transcription, not Microsoft's own theme files, and that is worth knowing
// before treating an exact hex here as authoritative.
//
// It matters less than it looks. The kit must survive *any* palette a user
// picks — that is what forced colours means — so what these buy is spread:
// a pure-black theme, a cream light theme, and two different greys. The grey
// ones are the useful part, because they catch anything that assumes the
// background is pure black or pure white.
const PALETTES = {
  'night-sky': {
    text: '#FFFFFF', bg: '#000000', link: '#8080FF', visited: '#80FF80',
    gray: '#A6A6A6', buttonFace: '#FFEE32', buttonText: '#000000',
    highlight: '#D6B4FD', highlightText: '#2B2B2B',
  },
  aquatic: {
    text: '#FFFFFF', bg: '#202020', link: '#75E9FC', visited: '#80FF80',
    gray: '#90FF90', buttonFace: '#FFFFFF', buttonText: '#202020',
    highlight: '#8EE3F0', highlightText: '#263B50',
  },
  desert: {
    text: '#3D3D3D', bg: '#FFFAEF', link: '#1C5E75', visited: '#9E3D96',
    gray: '#676767', buttonFace: '#202020', buttonText: '#FFFAEF',
    highlight: '#903909', highlightText: '#FFF5E3',
  },
  dusk: {
    text: '#FFFFFF', bg: '#2D3236', link: '#70EBDE', visited: '#96FF9B',
    gray: '#A6A6A6', buttonFace: '#B6F6F0', buttonText: '#2D3236',
    highlight: '#A1BFDE', highlightText: '#212D3B',
  },
};

// 3:1 — WCAG 1.4.11, the floor for a UI component's boundary and for the
// large text these palettes are generally used at. Not 4.5: a forced palette
// is the user's choice, and holding their colours to the body-text ratio
// would report their theme rather than this kit.
const MIN_CONTRAST = 3;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
};

// Same closed table as check-visual.js: the URL is a key, not a path to join,
// so a request cannot name a file this server did not already decide to serve.
const SKIP = new Set(['.git', 'node_modules', '.github', '.claude']);

function serveable(dir, prefix, table) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || SKIP.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    const url = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) serveable(abs, url, table);
    else if (MIME[path.extname(entry.name)]) table.set(url, abs);
  }
  return table;
}

const FILES = serveable(ROOT, '', new Map());

// The audit. Runs in the browser, against the demo in a same-origin frame.
//
// The inventory is collected from the page rather than hand-listed, so a
// component added to the demo is audited without anyone remembering to add it
// here. Elements are grouped by their full class list and one of each group is
// examined — enough to cover every distinct painted thing without checking the
// same badge forty times.
const AUDIT = `<!doctype html>
<meta charset="utf-8">
<title>forced-colors audit</title>
<style>html,body{margin:0;background:#fff}iframe{width:1200px;height:900px;border:0}</style>
<iframe id="f" src="/demo/index.html"></iframe>
<script>
const PALETTE = new URLSearchParams(location.search).get('palette');

const parse = (c) => {
  const m = /rgba?\\(([^)]+)\\)/.exec(c);
  if (!m) return null;
  const p = m[1].split(/[,\\/]+/).map((v) => parseFloat(v));
  if (p.length > 3 && p[3] === 0) return null;   // transparent
  return [p[0], p[1], p[2]];
};

const lum = ([r, g, b]) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

// The painted background behind an element: its own, or the first ancestor
// that paints one. A component whose own background is transparent is sitting
// on its parent's, and that is what its text has to be legible against.
//
// 'from' lets the walk start at the parent instead. A border is judged against
// what is OUTSIDE it — it exists to separate the element from its surroundings
// — and judging it against the element's own fill reports every filled control
// whose border matches its fill as invisible, which was wrong about
// .cy-checkbox and .cy-radio on all four palettes.
const bgOf = (el, win, from) => {
  for (let n = from || el; n && n.nodeType === 1; n = n.parentElement) {
    const c = parse(win.getComputedStyle(n).backgroundColor);
    if (c) return c;
  }
  return parse(win.getComputedStyle(win.document.body).backgroundColor) || [255, 255, 255];
};

// A control the platform still themes — 'appearance' is anything but 'none' —
// has its fill painted by the widget, not by CSS, and 'backgroundColor' keeps
// reporting whatever the stylesheet asked for. Nothing in the DOM can see the
// painted colour, so judging that control's text against a walked-up
// background is measuring the wrong pair: Gecko gives it ButtonText, and the
// widget paints ButtonFace behind it.
//
// Rather than assume what the widget paints, compare against a bare control of
// the same kind inserted into the same document. If the kit's control resolves
// exactly as an unstyled one does, it is getting the platform's own pairing,
// whose legibility is the platform's guarantee and not this kit's to prove.
// If it differs, the kit has changed something the theme was relying on, and
// that is worth failing.
function nativeReference(doc, win) {
  const host = doc.createElement('div');
  host.style.cssText = 'position:absolute;left:-9999px;top:0';
  host.innerHTML = '<button>b</button><input type="checkbox" checked><input type="radio" checked>'
                 + '<input type="text" value="t"><select><option>o</option></select><textarea>t</textarea>'
                 + '<progress value="0.5"></progress><meter value="0.5"></meter>';
  doc.body.appendChild(host);
  const read = (el) => {
    const cs = win.getComputedStyle(el);
    return { color: cs.color, appearance: cs.appearance };
  };
  const ref = {
    BUTTON: read(host.querySelector('button')),
    checkbox: read(host.querySelector('input[type=checkbox]')),
    radio: read(host.querySelector('input[type=radio]')),
    INPUT: read(host.querySelector('input[type=text]')),
    SELECT: read(host.querySelector('select')),
    TEXTAREA: read(host.querySelector('textarea')),
    PROGRESS: read(host.querySelector('progress')),
    METER: read(host.querySelector('meter')),
  };
  host.remove();
  return ref;
}

const refKey = (el) =>
  el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio') ? el.type : el.tagName;

// Direct text only. A wrapper's colour says nothing about anything if all its
// text lives in children that set their own.
const hasOwnText = (el) =>
  [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);

function audit(doc, win) {
  const findings = [];
  const seen = new Set();
  const note = (level, cls, msg) => findings.push({ level, cls, msg });
  const native = nativeReference(doc, win);

  for (const el of doc.querySelectorAll('[class*="cy-"]')) {
    const classes = [...el.classList].filter((c) => c.startsWith('cy-'));
    if (!classes.length) continue;
    const key = classes.join(' ');
    if (seen.has(key)) continue;
    seen.add(key);

    const cs = win.getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const box = el.getBoundingClientRect();
    if (box.width < 2 || box.height < 2) continue;

    const bg = bgOf(el, win);
    const ref = native[refKey(el)];
    const themed = cs.appearance !== 'none' && !!ref;

    // 1. Text that cannot be read.
    if (themed) {
      // Judge it against an unstyled control of the same kind rather than
      // against a background nothing can see.
      if (ref.color !== cs.color) {
        note('FAIL', key, 'themed control takes ' + cs.color + ' where a bare ' + refKey(el).toLowerCase() + ' takes ' + ref.color);
      }
    } else if (hasOwnText(el)) {
      const fg = parse(cs.color);
      if (fg) {
        const r = ratio(fg, bg);
        if (r < ${MIN_CONTRAST}) note('FAIL', key, 'text ' + cs.color + ' on ' + JSON.stringify(bg) + ' = ' + r.toFixed(2) + ':1');
      }
    }

    // 2. A border that is the component's shape, rendered invisible. Only
    //    borders the element actually declares are judged — a component with
    //    no border is not required to grow one.
    const bw = parseFloat(cs.borderTopWidth) || parseFloat(cs.borderInlineStartWidth) || 0;
    if (bw > 0 && !themed) {
      const side = parseFloat(cs.borderTopWidth) > 0 ? cs.borderTopColor : cs.borderInlineStartColor;
      const bc = parse(side);
      const outside = bgOf(el, win, el.parentElement);
      if (!bc) note('FAIL', key, 'declares a ' + bw + 'px border that is transparent');
      else if (ratio(bc, outside) < ${MIN_CONTRAST}) {
        note('FAIL', key, 'border ' + side + ' is ' + ratio(bc, outside).toFixed(2) + ':1 against what is outside it');
      }
    }

    // 3. The checks that can actually fail.
    //
    // Gecko overrides author colours in forced colours, so a rule that sets a
    // colour here -- the kit's own included -- cannot make anything invisible
    // and cannot be caught by looking at colours. Verified by mutation: giving
    // .cy-card a transparent border and .cy-quote's cite the Canvas colour
    // inside a forced-colors block changed nothing the DOM could see. The
    // colour assertions above are therefore a backstop for an engine that
    // forces less, not the working part of this check.
    //
    // What forced colours does NOT touch is background-image and opacity.
    // Those stay exactly as the author left them, they paint over or wash out
    // the user's palette, and the kit has rules that exist only to suppress
    // them -- which makes these the assertions with something to catch.
    if (cs.backgroundImage !== 'none') {
      note('FAIL', key, 'still paints a background-image, which forced colours does not remove: ' + cs.backgroundImage.slice(0, 60));
    }

    // The one way to opt out of the user's palette entirely. Measured: with
    // forced-color-adjust: none, Gecko leaves #00f2ff on #112233 exactly as
    // authored. The kit does not use it anywhere and must not start by
    // accident.
    if (cs.forcedColorAdjust && cs.forcedColorAdjust !== 'auto') {
      note('FAIL', key, 'sets forced-color-adjust: ' + cs.forcedColorAdjust + ', opting out of the palette the user chose');
    }

    const op = parseFloat(cs.opacity);
    if (op < 1 && op > 0) {
      note('FAIL', key, 'is dimmed to opacity ' + op + ', which washes out the palette the user chose');
    }

    // Kept as a backstop for engines that do not strip shadows themselves.
    // Gecko does: a bare div with a box-shadow reports none here.
    if (cs.boxShadow !== 'none') note('FAIL', key, 'keeps a box-shadow: ' + cs.boxShadow);
  }

  // 4. The spinner reads as spinning only because its border sides differ. If
  //    forced colours flattens them to one colour the animation is invisible
  //    and the component says nothing.
  const sp = doc.querySelector('.cy-spinner');
  if (sp) {
    const s = win.getComputedStyle(sp);
    const sides = new Set([s.borderTopColor, s.borderRightColor, s.borderBottomColor, s.borderLeftColor]);
    if (sides.size < 2) note('FAIL', '.cy-spinner', 'all four border sides are ' + s.borderTopColor + ' — rotation is invisible');
  }

  // 5. Status colour is meaning, and forced colours takes it away. This is not
  //    a defect the kit can fix with CSS — it is the thing an author has to
  //    know — so it is reported rather than failed.
  const variants = ['info', 'success', 'warning', 'danger'];
  const alerts = variants
    .map((v) => doc.querySelector('.cy-alert--' + v))
    .filter(Boolean);
  if (alerts.length > 1) {
    const sig = new Set(alerts.map((a) => {
      const s = win.getComputedStyle(a);
      return s.color + '|' + s.backgroundColor + '|' + s.borderInlineStartColor;
    }));
    if (sig.size === 1) {
      note('NOTE', '.cy-alert--*', alerts.length + ' status variants render identically — meaning must come from the text');
    }
  }

  return findings;
}

addEventListener('load', async () => {
  const f = document.getElementById('f');
  const win = f.contentWindow;
  const doc = f.contentDocument;
  try { await doc.fonts.ready; } catch {}
  await new Promise((r) => setTimeout(r, 600));

  let body;
  try {
    body = {
      palette: PALETTE,
      forcedColors: win.matchMedia('(forced-colors: active)').matches,
      prefersContrast: win.matchMedia('(prefers-contrast: more)').matches,
      findings: audit(doc, win),
    };
  } catch (e) {
    body = { palette: PALETTE, error: String(e && e.message || e) + ' @ ' + String(e && e.stack || '') };
  }
  await fetch('/result', { method: 'POST', body: JSON.stringify(body) });
});
</script>`;

let pending = null;

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/result') {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      res.writeHead(204).end();
      const resolve = pending;
      pending = null;
      resolve?.(JSON.parse(body));
    });
    return;
  }

  let key;
  try {
    key = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }

  if (key === '/audit') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(AUDIT);
    return;
  }

  const file = FILES.get(key);
  if (!file) {
    res.writeHead(404).end();
    return;
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] }).end(data);
  });
});

function profileFor(name, palette) {
  // Under the home directory rather than the system temp dir, which is where
  // Firefox is reliably allowed to read a profile from on macOS.
  const dir = fs.mkdtempSync(path.join(os.homedir(), `.cy-fc-${name}-`));
  fs.writeFileSync(path.join(dir, 'user.js'), [
    // The switch. Everything else is just which colours it uses.
    'user_pref("ui.useAccessibilityTheme", 1);',
    'user_pref("browser.display.document_color_use", 2);',
    `user_pref("browser.display.foreground_color", "${palette.text}");`,
    `user_pref("browser.display.background_color", "${palette.bg}");`,
    `user_pref("browser.anchor_color", "${palette.link}");`,
    `user_pref("browser.visited_color", "${palette.visited}");`,
    `user_pref("ui.graytext", "${palette.gray}");`,
    `user_pref("ui.buttonface", "${palette.buttonFace}");`,
    `user_pref("ui.buttontext", "${palette.buttonText}");`,
    `user_pref("ui.highlight", "${palette.highlight}");`,
    `user_pref("ui.highlighttext", "${palette.highlightText}");`,
    'user_pref("browser.shell.checkDefaultBrowser", false);',
    'user_pref("browser.startup.homepage_override.mstone", "ignore");',
    'user_pref("datareporting.policy.dataSubmissionEnabled", false);',
    'user_pref("toolkit.telemetry.reportingpolicy.firstRun", false);',
  ].join('\n'));
  return dir;
}

function killProfile(dir) {
  // `open` returns immediately, so the child handle is the launcher and not
  // the browser. The profile path is unique per run, which makes it the
  // handle for the process that actually needs stopping.
  try { execFileSync('pkill', ['-f', dir], { stdio: 'ignore' }); } catch { /* none running */ }
  fs.rmSync(dir, { recursive: true, force: true });
}

async function run(name, palette, port) {
  const dir = profileFor(name, palette);
  const result = new Promise((resolve, reject) => {
    pending = resolve;
    setTimeout(() => reject(new Error(`${name}: no result after 90s`)), 90000).unref?.();
  });

  // `-g` keeps the window from stealing focus; four of these open in a row.
  spawn('open', ['-n', '-g', '-a', FIREFOX, '--args',
    '-profile', dir, '-no-remote', `http://127.0.0.1:${port}/audit?palette=${name}`],
  { stdio: ['ignore', 'ignore', 'inherit'] });

  try {
    return await result;
  } finally {
    killProfile(dir);
  }
}

if (!fs.existsSync(FIREFOX)) {
  console.error(`Firefox was not found at ${FIREFOX}, so this check cannot run.`);
  console.error('It is a local check by design — `npm run check` covers what CI enforces.');
  process.exit(127);
}

server.listen(0, '127.0.0.1', '', async () => {
  const { port } = server.address();
  let failures = 0;
  let notes = 0;

  try {
    for (const [name, palette] of Object.entries(PALETTES).filter(([n]) => !process.env.CY_FC_ONLY || n === process.env.CY_FC_ONLY)) {
      const r = await run(name, palette, port);

      if (r.error) {
        console.error(`  ERROR    ${name}: ${r.error}`);
        failures += 1;
        continue;
      }

      // If the engine is not actually in forced colours, every pass below is
      // meaningless. A green run that proved nothing is the failure mode this
      // project keeps rediscovering, so it is an error, not a warning.
      if (!r.forcedColors) {
        console.error(`  ERROR    ${name}: Firefox did not enter forced-colors — nothing was verified`);
        failures += 1;
        continue;
      }

      const fail = r.findings.filter((f) => f.level === 'FAIL');
      const note = r.findings.filter((f) => f.level === 'NOTE');
      notes += note.length;
      failures += fail.length;

      const contrast = r.prefersContrast ? ' + prefers-contrast' : '';
      console.log(fail.length === 0
        ? `  ok       ${name} (forced-colors${contrast})`
        : `  CHANGED  ${name} (forced-colors${contrast})`);
      for (const f of fail) console.log(`    FAIL   ${f.cls}: ${f.msg}`);
      for (const f of note) console.log(`    note   ${f.cls}: ${f.msg}`);
    }
  } catch (err) {
    console.error(`  ERROR    ${err.message}`);
    failures += 1;
  }

  server.close();

  if (failures) {
    console.error(`\n${failures} forced-colors problem(s) across ${Object.keys(PALETTES).length} palettes.`);
    process.exit(1);
  }
  console.log(`\nForced colours OK — ${Object.keys(PALETTES).length} Windows palettes, real Gecko${notes ? `, ${notes} note(s)` : ''}.`);
  console.log('Live assertions here are opacity and forced-color-adjust. Gecko strips shadows,');
  console.log('background-images and author colours itself, so those are backstops for other engines.');
  process.exit(0);
});
