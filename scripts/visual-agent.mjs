// Runs inside ego-browser's Node runtime, which preloads the browser helpers.
// Not started directly — `scripts/check-visual.js` composes ROOT, PORT and
// UPDATE on top of this file and pipes the result in, because that runtime
// gets no argv, no environment and a cwd of `/`.
//
// It also cannot listen on a socket: inside this runtime `server.listen()`
// never fires its callback, so the wrapper owns the HTTP server and passes the
// port down. That is the better split anyway — the wrapper is ordinary Node.
//
// What this half does: opens the demo, freezes everything that moves, and
// captures one PNG per section. Each is compared against docs/baselines/ by
// diffing in the page through a canvas, so the Node side never decodes an
// image and the kit's tools stay dependency-free.

const fsp = await import('node:fs/promises')
const fss = await import('node:fs')
const path = await import('node:path')

const BASELINES = path.join(ROOT, 'docs', 'baselines')

// One region per demo section. The slug names the baseline file, so renaming a
// section renames its baseline — deliberate, since a section that changed
// identity should not silently keep an old picture.
const REGIONS = [
  ['buttons', 'Buttons'],
  ['text-glow', 'Text glow'],
  ['cards', 'Holo cards'],
  ['navigation', 'Navigation'],
  ['containers', 'Containers'],
  ['forms', 'Forms'],
  ['feedback', 'Feedback'],
  ['content', 'Content'],
]

// Measured, not guessed. With animations frozen and the device pixel ratio
// pinned, two captures of an unchanged page differ by 1 pixel in 1,020,000 at
// a maximum channel delta of 2. The square-edge progress regression this check
// exists to catch showed 13 pixels at delta 230. Ignoring deltas of 2 or less
// therefore removes the noise without touching the signal.
const CHANNEL_TOLERANCE = 2
// Everything that moves, plus the two things that float. The sticky topbar and
// the fixed toast container both render over whatever section is beneath them,
// which would make a region's picture depend on scroll position.
//
// The sticky topbar and the fixed toast container are also taken out of the
// compositing path, not merely hidden, and that part is not cosmetic. A sticky
// element gets its own layer the moment the page is actually scrolled, and
// that changed how the glow halos in the neighbouring section rasterised: the
// buttons region was stable to the byte for weeks at scroll 0, then began
// alternating between two states — 10124 pixels, diffuse, deltas of 3 to 6
// spread across 108 rows — as soon as capture() started scrolling. Giving the
// topbar `position: static` keeps its box in normal flow, so no layout moves,
// and takes the layer away. The toast container is `position: fixed` and
// therefore out of flow already, so it can simply be removed.
//
// Nothing inside the template below may contain a backtick: it is a template
// literal, and a stray one in a comment silently truncates the page source.
//
// This is the one template here that needs String.raw, and it needs it: the
// `\n` below has to reach the page as two characters. Untagged, the template
// would interpolate a real newline inside a single-quoted string literal and
// the page would fail to parse it. The other templates in this file carry no
// backslash and are therefore untagged.
const FREEZE = String.raw`(() => {
  let s = document.getElementById('vr-freeze');
  if (!s) { s = document.createElement('style'); s.id = 'vr-freeze'; document.head.appendChild(s); }
  s.textContent = [
    '*, *::before, *::after { animation: none !important; transition: none !important; }',
    // Hidden because both render over whatever section is beneath them, and
    // de-promoted because both would otherwise own a compositing layer once
    // the page is scrolled. See the note above this template.
    '.topbar { visibility: hidden !important; position: static !important; }',
    '.cy-toast-container { display: none !important; }',
    // --cy-font-terminal names Nerd Fonts, which are installed on some
    // machines and not others. Left alone, a baseline recorded on a machine
    // with Hack cannot be compared on one without it. The web fonts are
    // required and checked for; local fonts are exactly the machine variance
    // this pinning exists to remove.
    ':root { --cy-font-terminal: var(--cy-font-mono) !important; }',
    // Text rasterisation is the other machine variance, and the subtler one.
    // Whether a box gets its own compositing layer decides whether its text is
    // drawn with subpixel or grayscale antialiasing, and layer promotion is
    // not stable between captures — which is what produced the ~1180-pixel
    // second state the settle loop kept catching in the feedback region.
    // Forcing grayscale everywhere removes the choice.
    '* { -webkit-font-smoothing: antialiased !important; }',
  ].join('\n');
  return true;
})()`

const rectOf = (heading) => `(() => {
  const h2 = [...document.querySelectorAll('h2')].find((el) => el.textContent.trim() === ${JSON.stringify(heading)});
  if (!h2) return null;
  const section = h2.closest('section');
  const r = section.getBoundingClientRect();
  return { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY),
           width: Math.round(r.width), height: Math.round(r.height) };
})()`

// Scroll the region into view before photographing it.
//
// This one line is what made the check trustworthy, and it took hashing the
// captures to find. `captureBeyondViewport` will happily photograph content far
// below the viewport, but it rasterises those tiles off the fast path, and that
// path is not deterministic. The symptom was that only the two deepest regions
// ever failed — forms at document y=2034 and feedback at y=2764, against a
// 900px viewport — while the five regions above them were stable to the byte
// across sessions and days.
//
// The giveaway was that `--update` and the comparison run disagreed about the
// same unchanged page: re-recording produced bytes identical to a baseline
// taken two days earlier, yet the comparison captured something 32 pixels
// different, every attempt, with the clip rectangle and scroll offset
// identical in both. Hashing each capture showed three distinct rasterisations
// of those two regions, with the comparison loop alternating between two of
// them on a period of two. The differing pixels were all antialiasing: one row
// of each alert's left accent border, and the rounded corners of <progress> and
// <meter>.
//
// Scrolling first means the region is live viewport content, which rasterises
// the same way every time. All three runs after this change passed with one
// capture per region and no retries.
//
// The clip stays in document coordinates — that is what CDP wants, and it does
// not change when the page scrolls. `captureBeyondViewport` stays on as a
// backstop: a region taller than the 900px viewport would hang off the bottom
// and reintroduce exactly this problem, so keep the emulated height above the
// tallest section (forms is currently the tallest at 690).
// The offset is forced to a whole number, and that is not a detail.
//
// Scrolling to a region near the end of the document gets clamped to
// `scrollHeight - innerHeight`, which is fractional whenever the document
// height is. The last section used to land on 2316.5 instead of its own 2764,
// and a half-pixel offset rasterises the whole region differently from an
// integer one.
//
// That made every baseline for the final section depend on the total height of
// the page. Appending an unrelated section below it moved the clamp, the
// offset became integral, and `feedback` reported 22850 changed pixels for a
// change that added no CSS to it. Flooring the offset removes the dependency:
// the clip is in document coordinates, so the content captured is identical
// either way — only the subpixel grid moves.
async function capture(clip) {
  await js(`(() => {
    window.scrollTo(0, ${clip.y});
    if (!Number.isInteger(window.scrollY)) window.scrollTo(0, Math.floor(window.scrollY));
    return window.scrollY;
  })()`)
  await wait(0.3)
  const shot = await cdp('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    clip: { ...clip, scale: 1 },
  })
  return shot.data
}

// How many captures a region gets before it is called changed.
//
// Lowered from 6 to 2 once `capture()` started scrolling the region into view.
// Retries were never the cure for what was wrong, and six of them hid how
// broken the check was: the loop would report the same pixel count six times
// and the honest conclusion — that the captures were deterministic and the
// comparison was simply photographing the page a different way than the
// recording did — was never drawn. Read the comment on `capture()` for what it
// actually was.
//
// Two is kept rather than one because comparing each capture against the
// baseline is strictly stronger than requiring a quiet page: passing needs one
// exact match, failing needs every attempt to differ, and a real regression
// changes the content so it cannot pass by luck. One spare attempt costs about
// a second and covers a genuine transient. If a region ever needs more than
// two again, that is a bug in the capture conditions, not a number to raise.
const ATTEMPTS = 2

// The comparison happens in the page: two data URLs go in, a summary comes
// back. A bounding box is included because "something changed" is a worse
// report than "the progress bar changed".
async function diff(baselineB64, actualB64) {
  await js(`window.__vrA=${JSON.stringify('data:image/png;base64,' + baselineB64)};` +
           `window.__vrB=${JSON.stringify('data:image/png;base64,' + actualB64)};true`)
  return js(`(async () => {
    const load = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
    const [a, b] = await Promise.all([load(window.__vrA), load(window.__vrB)]);
    if (a.width !== b.width || a.height !== b.height) {
      return { resized: { was: [a.width, a.height], now: [b.width, b.height] } };
    }
    const c = document.createElement('canvas');
    c.width = a.width; c.height = a.height;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(a, 0, 0); const da = x.getImageData(0, 0, c.width, c.height).data;
    x.clearRect(0, 0, c.width, c.height);
    x.drawImage(b, 0, 0); const db = x.getImageData(0, 0, c.width, c.height).data;
    let n = 0, maxDelta = 0, minX = 1e9, minY = 1e9, maxX = -1, maxY = -1;
    for (let i = 0; i < da.length; i += 4) {
      const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i+1] - db[i+1]), Math.abs(da[i+2] - db[i+2]));
      if (d > ${CHANNEL_TOLERANCE}) {
        n += 1;
        if (d > maxDelta) maxDelta = d;
        const px = (i / 4) % c.width, py = Math.floor((i / 4) / c.width);
        if (px < minX) minX = px; if (px > maxX) maxX = px;
        if (py < minY) minY = py; if (py > maxY) maxY = py;
      }
    }
    return { differing: n, maxDelta, total: c.width * c.height,
             box: maxX < 0 ? null : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 } };
  })()`)
}

const failures = []
const written = []

// The task space is closed in a finally, not at the end of the happy path.
//
// The space is looked up by name, so a run that dies partway leaves its tabs
// behind for the next run to inherit — and those tabs point at the previous
// run's port, which is dead. Two aborted runs were enough to make every
// following run hang in `Page.captureScreenshot` until the space was closed by
// hand. Cleaning up on the way out keeps a single failure from poisoning
// everything after it.
const task = await useOrCreateTaskSpace('cyberpunk visual regression')
try {
  await openOrReuseTab(`http://127.0.0.1:${PORT}/demo/index.html`, { wait: true, timeout: 30 })

  // Pinning the ratio is what makes a baseline portable: this machine captures
  // at 2x by default, so an unpinned picture could never be compared anywhere
  // else.
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1200, height: 900, deviceScaleFactor: 1, mobile: false })
  await js(FREEZE)

  // Web fonts arrive over the network and shift metrics when they land. A
  // capture taken before then is a different picture of the same CSS.
  const fonts = await js(`(async () => {
    await document.fonts.ready;
    const probe = (family) => {
      const s = document.createElement('span');
      s.textContent = 'CYBERPUNK-UI';
      s.style.cssText = 'position:absolute;visibility:hidden;font-size:64px;white-space:nowrap;font-family:' + family;
      document.body.appendChild(s); const w = s.getBoundingClientRect().width; s.remove(); return Math.round(w);
    };
    return { display: probe("'Orbitron', system-ui") !== probe('system-ui') };
  })()`)
  if (!fonts.display) {
    throw new Error('Web fonts did not load — every capture would differ from its baseline for that reason alone.')
  }
  await wait(1)

  await fsp.mkdir(BASELINES, { recursive: true })

  for (const [slug, heading] of REGIONS) {
    const clip = await js(rectOf(heading))
    if (!clip) { failures.push(`${slug}: no section titled "${heading}" in the demo`); continue }

    const file = path.join(BASELINES, `${slug}.png`)

    if (UPDATE || !fss.existsSync(file)) {
      await fsp.writeFile(file, Buffer.from(await capture(clip), 'base64'))
      written.push(`${slug} (${clip.width}x${clip.height})`)
      continue
    }

    // Up to ATTEMPTS captures, each compared against the baseline. The first
    // exact match wins; only a region that differs every time is reported, and
    // the last attempt's diff is what gets reported.
    const baseline = (await fsp.readFile(file)).toString('base64')
    let actual
    let d
    for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
      actual = await capture(clip)
      d = await diff(baseline, actual)
      if (!d.resized && d.differing === 0) break
      if (attempt < ATTEMPTS) {
        const why = d.resized ? 'size changed' : `${d.differing} px`
        cliLog(`  retry    ${slug} (attempt ${attempt}: ${why})`)
        await wait(1)
      }
    }

    if (REPORT) {
      cliLog(`  report   ${slug}: differing=${d.differing ?? '-'} maxDelta=${d.maxDelta ?? '-'} ` +
             `pct=${d.total ? (100 * d.differing / d.total).toFixed(4) : '-'}`)
      continue
    }

    if (d.resized) {
      failures.push(`${slug}: size changed ${d.resized.was.join('x')} -> ${d.resized.now.join('x')}`)
    } else if (d.differing > 0) {
      const where = d.box ? ` at ${d.box.w}x${d.box.h}+${d.box.x}+${d.box.y}` : ''
      failures.push(`${slug}: ${d.differing} px differ (max delta ${d.maxDelta})${where}`)
      // The actual capture is kept beside the baseline so the two can be
      // opened side by side; a number alone does not show what moved.
      await fsp.writeFile(path.join(BASELINES, `${slug}.actual.png`), Buffer.from(actual, 'base64'))
    } else {
      cliLog(`  ok       ${slug}`)
    }
  }

  await cdp('Emulation.clearDeviceMetricsOverride', {})
} finally {
  await completeTaskSpace(task.id, { keep: false })
}

for (const w of written) cliLog(`  written  ${w}`)

if (failures.length) {
  cliLog('')
  for (const f of failures) cliLog(`  CHANGED  ${f}`)
  cliLog('')
  cliLog('If the change was intended, re-record with: npm run check:visual -- --update')
  throw new Error(`${failures.length} region(s) differ from their baseline`)
}

cliLog(written.length ? 'Baselines written.' : 'Visual check passed.')
