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
    '.topbar, .cy-toast-container { visibility: hidden !important; }',
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

async function capture(clip) {
  const shot = await cdp('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    clip: { ...clip, scale: 1 },
  })
  return shot.data
}

// Capture until two in a row agree.
//
// Across 28 region-runs while this was being built, 27 were pixel-identical
// and one was not — and the odd one out repeated the *same* 1181 pixels at the
// same delta on a later run. An identical repeat is not antialiasing noise, it
// is a second discrete state: the freeze occasionally lands a frame after the
// page has already painted something moving.
//
// Settling costs one extra capture and keeps the comparison exact, which is
// the right trade. Loosening the tolerance instead would have hidden a real
// 1181-pixel change to buy off a flake.
async function settledCapture(clip, slug) {
  let previous = await capture(clip)
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const next = await capture(clip)
    if (next === previous) return next
    cliLog(`  settling ${slug} (attempt ${attempt})`)
    await wait(1)
    previous = next
  }
  throw new Error(`${slug}: the page never stopped changing — something is still animating`)
}

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

    const actual = await settledCapture(clip, slug)
    const file = path.join(BASELINES, `${slug}.png`)

    if (UPDATE || !fss.existsSync(file)) {
      await fsp.writeFile(file, Buffer.from(actual, 'base64'))
      written.push(`${slug} (${clip.width}x${clip.height})`)
      continue
    }

    const baseline = (await fsp.readFile(file)).toString('base64')
    const d = await diff(baseline, actual)

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
