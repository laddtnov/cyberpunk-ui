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
// `captureBeyondViewport` is now off, and that is the other half of the fix.
//
// It is what lets CDP photograph content below the fold, and with the region
// scrolled into view it is not needed. Leaving it on was not harmless: the
// same unchanged region alternated between two rasterisations on a strict
// period of two, and turning it off made six consecutive captures identical.
// Measured on the content region, same scroll, same page:
//
//   beyondViewport, scrolling each time      A B A B A B
//   beyondViewport, no scroll in between     A B A B A B
//   no beyondViewport, viewport-relative     A A A A A A
//
// That alternation is what the retry loop had been papering over since this
// check was written, and what ATTEMPTS was once raised to 6 for.
//
// The cost is that the clip must be viewport-relative, and a region taller
// than the viewport can no longer be photographed. That is asserted rather
// than silently cropped — a cropped baseline passes forever while testing
// less than it claims.
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
const VIEWPORT = { width: 1200, height: 900 }

async function capture(clip) {
  const at = await js(`(() => {
    window.scrollTo(0, ${clip.y});
    if (!Number.isInteger(window.scrollY)) window.scrollTo(0, Math.floor(window.scrollY));
    return { x: window.scrollX, y: window.scrollY };
  })()`)
  await wait(0.3)

  // The clip below stays in DOCUMENT coordinates — that is what CDP wants, and
  // getting this wrong is not loud. Converting it to viewport coordinates
  // pointed it at the top of the document, far above the scrolled viewport,
  // and with captureBeyondViewport off that returns a black frame. Every
  // baseline was re-recorded blank, six consecutive runs passed comparing
  // blank against blank, and only a mutation probe found it.
  //
  // This rectangle is the same clip expressed against the viewport, and it is
  // used for one thing: checking the region is actually on screen. Without
  // captureBeyondViewport, anything outside the viewport comes back black.
  const view = {
    x: clip.x - at.x,
    y: clip.y - at.y,
    width: clip.width,
    height: clip.height,
  }

  if (view.x < 0 || view.y < 0
      || view.x + view.width > VIEWPORT.width
      || view.y + view.height > VIEWPORT.height) {
    throw new Error(
      `a ${clip.width}x${clip.height} region at ${clip.x},${clip.y} does not fit the `
      + `${VIEWPORT.width}x${VIEWPORT.height} viewport once scrolled to — it lands at ${view.x},${view.y}. `
      + 'Raise the emulated viewport and re-record every baseline rather than cropping.',
    )
  }

  const shot = await cdp('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
    clip: { ...clip, scale: 1 },
  })
  return shot.data
}

// Is that a picture of anything?
//
// A blank frame is perfectly stable and compares equal to another blank frame,
// so a broken capture looks exactly like a passing check. That is how the
// viewport-coordinate bug above survived a full re-record and six green runs.
// Every baseline is now checked for content before it is written: a region of
// this kit is a styled component on a dark background, never one flat colour.
async function assertNotBlank(slug, b64) {
  await js(`window.__vrBlank=${JSON.stringify('data:image/png;base64,' + b64)};true`)
  const seen = await js(`(async () => {
    const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = window.__vrBlank; });
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    const colours = new Set();
    for (let i = 0; i < d.length; i += 4) colours.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
    return colours.size;
  })()`)
  if (seen < 8) {
    throw new Error(
      `${slug}: the capture holds ${seen} distinct colour(s), so it is a blank frame rather than a picture `
      + 'of the section. The clip is almost certainly outside the viewport — see capture().',
    )
  }
}

// Phases: the several byte-identical pictures an unchanged region produces.
//
// This is the thing the retry loop was hiding. The content region alternates
// between exactly two rasterisations on a strict period of two — capture,
// capture, capture gives A, B, A, B — and nothing observable in the page
// differs between them. Measured at the moment of capture: identical
// `scrollY` (2808), identical `document.scrollHeight` (3708), identical
// `getBoundingClientRect()` on the section (top 384.6796875, height
// 451.15625), identical device pixel ratio. The six pixels that move are
// antialiasing on two rows of keycap edges, at a maximum channel delta of 7.
//
// Things that were measured and ruled out, so nobody pays for them twice:
//   - `captureBeyondViewport` — a real cause of a different instability, now
//     off, but the alternation outlives it;
//   - the canvas `diff()` runs in the page under test — captures alternate
//     identically with no diff between them;
//   - region order, the web-font probe, a fractional scroll offset, and the
//     sticky topbar's compositing layer — each fixed or excluded earlier.
//
// So the rasteriser has more than one correct answer and the DOM cannot see
// which one it will give. Rather than retry until the recorded answer turns
// up, record every answer. A phase is a legitimate picture of an unchanged
// page; a regression changes the content and therefore matches none of them.
//
// Four captures at record time is enough to see both phases of a two-phase
// region many times over, and the cap keeps a genuinely unstable region from
// quietly recording a new "phase" every run — that would be a check that
// passes against anything, which is worse than one that cries wolf.
const MAX_PHASES = 3
const PHASE_SAMPLES = 4

const phaseFile = (slug, i) => path.join(BASELINES, i === 0 ? `${slug}.png` : `${slug}.phase${i + 1}.png`)

async function recordPhases(slug, clip) {
  const seen = []
  for (let i = 0; i < PHASE_SAMPLES; i += 1) {
    const shot = await capture(clip)
    await assertNotBlank(slug, shot)
    if (!seen.includes(shot)) seen.push(shot)
    if (seen.length === MAX_PHASES) break
  }
  return seen
}

// How many captures a region gets before it is called changed.
//
// This was 3, then 6, then 2, and every one of those numbers was a way of
// living with a capture that is not deterministic. Retrying is the wrong tool
// and it hid a real bug for two releases: at 6 the loop printed the same pixel
// count six times, and nobody read that as "the captures are deterministic and
// the comparison is photographing the page differently", which is what it
// meant.
//
// What the page actually does is measured in PHASES below. Two captures is
// enough to see both of a two-phase region; it is not a retry budget, and
// raising it is not the answer to a failure.
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
  await cdp('Emulation.setDeviceMetricsOverride', { ...VIEWPORT, deviceScaleFactor: 1, mobile: false })
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
      const phases = await recordPhases(slug, clip)
      for (let i = 0; i < MAX_PHASES; i += 1) {
        const at = phaseFile(slug, i)
        if (i < phases.length) await fsp.writeFile(at, Buffer.from(phases[i], 'base64'))
        else if (fss.existsSync(at)) await fsp.rm(at)      // a region that settled down
      }
      written.push(`${slug} (${clip.width}x${clip.height}, ${phases.length} phase${phases.length > 1 ? 's' : ''})`)
      continue
    }

    // Every recorded phase is a legitimate picture of an unchanged page, so a
    // capture matching any of them is a pass. A real regression changes the
    // content, so it matches none.
    const baselines = []
    for (let i = 0; i < MAX_PHASES; i += 1) {
      const at = phaseFile(slug, i)
      if (fss.existsSync(at)) baselines.push((await fsp.readFile(at)).toString('base64'))
    }

    let actual
    let best = null
    let matched = false
    for (let attempt = 1; attempt <= ATTEMPTS && !matched; attempt += 1) {
      actual = await capture(clip)
      for (const b of baselines) {
        const d = await diff(b, actual)
        if (!d.resized && d.differing === 0) { matched = true; best = d; break }
        // Report the closest phase, not the first — "6 px differ" is a more
        // useful thing to read than whichever file happened to be tried first.
        if (!best || d.resized || (best.differing ?? Infinity) > (d.differing ?? Infinity)) best = d
      }
      if (!matched && attempt < ATTEMPTS) await wait(1)
    }

    if (REPORT) {
      cliLog(`  report   ${slug}: phases=${baselines.length} differing=${best.differing ?? '-'} ` +
             `maxDelta=${best.maxDelta ?? '-'} pct=${best.total ? (100 * best.differing / best.total).toFixed(4) : '-'}`)
      continue
    }

    if (matched) {
      cliLog(`  ok       ${slug}${baselines.length > 1 ? ` (${baselines.length} phases)` : ''}`)
    } else if (best.resized) {
      failures.push(`${slug}: size changed ${best.resized.was.join('x')} -> ${best.resized.now.join('x')}`)
    } else {
      const where = best.box ? ` at ${best.box.w}x${best.box.h}+${best.box.x}+${best.box.y}` : ''
      failures.push(`${slug}: ${best.differing} px differ from every one of ${baselines.length} phase(s) ` +
                    `(max delta ${best.maxDelta})${where}`)
      // The actual capture is kept beside the baseline so the two can be
      // opened side by side; a number alone does not show what moved.
      await fsp.writeFile(path.join(BASELINES, `${slug}.actual.png`), Buffer.from(actual, 'base64'))
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
