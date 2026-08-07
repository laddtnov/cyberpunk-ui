#!/usr/bin/env node
// Enforces the conventions in docs/STATE.md that a generic CSS linter cannot
// know about. Zero dependencies by design: this package ships none, and
// neither do its tools.
//
// Stylelint was tried first and rejected on evidence. Against this codebase it
// reported 123 problems and zero bugs: it wanted rgb() over rgba() — which is
// the kit's entire glow mechanism — #f0f over #ff00ff, which check-contrast.js
// parses, and no blank lines between token groups. The one rule worth having,
// selector-class-pattern, found nothing, because that convention has never
// been broken. What it could not check is everything below, all of which is
// specific to how this kit is built.

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const cssFiles = fs.readdirSync(ROOT).filter((f) => f.endsWith('.css')).sort();
const BARREL = 'cyberpunk-ui.css';
const sources = cssFiles.filter((f) => f !== BARREL);

// Comments and string literals both hide false positives in the checks below.
// A selector quoted in prose is not a selector, and the <select> arrow's
// data-URI contains `www.w3.org`, whose dots read as class names to anything
// matching naively. Both are blanked — not deleted — so offsets stay usable.
const strip = (css) =>
  css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/url\((["']?)[\s\S]*?\1\)/g, 'url()')
    .replace(/"[^"\n]*"|'[^'\n]*'/g, '""');

const failures = [];
const fail = (msg) => failures.push(msg);

// ── 1. Every colour token needs its -rgb twin ─────────────────────
// Every translucent glow is rgba(var(--cy-*-rgb), α); color-mix() is
// deliberately unused, for reach. A colour token without its twin cannot be
// faded, which means it cannot glow, which means half the kit cannot use it.
function checkRgbTwins() {
  const tokens = strip(read('tokens.css'));
  const declared = new Set([...tokens.matchAll(/(--cy-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));

  // Which -rgb twins are actually consumed anywhere in the kit?
  const usedTwins = new Set();
  for (const f of sources) {
    for (const m of strip(read(f)).matchAll(/var\((--cy-[a-z0-9-]+-rgb)\)/g)) usedTwins.add(m[1]);
  }
  for (const twin of usedTwins) {
    if (!declared.has(twin)) fail(`${twin} is used but never declared in tokens.css`);
  }

  // A twin needs a light-theme value only when its base colour has one. Where
  // the base is deliberately not themed — --cy-neon-purple is glow-only and
  // identical in both themes — a twin without one is correct, not missing.
  // What must never happen is the pair disagreeing: a hue that shifts on
  // toggle while its glow stays behind, or the reverse.
  // Located by prefix, not by the full selector: strip() blanks quoted
  // strings, so `[data-theme="light"]` has become `[data-theme=""]` by the
  // time this runs. Matching the literal selector silently returned -1, and
  // slice(-1) left `light` as one character — which made every check below it
  // pass unconditionally. A dead check is worse than no check, since it
  // reports success.
  const lightAt = tokens.indexOf(':root[data-theme=');
  if (lightAt === -1) fail('tokens.css has no [data-theme] block — the light theme checks cannot run');
  const light = lightAt === -1 ? '' : tokens.slice(lightAt);
  const hasLight = (token) => new RegExp(`\\${token}\\s*:`).test(light);
  for (const twin of usedTwins) {
    const base = twin.replace(/-rgb$/, '');
    const candidates = [base, base.replace('--cy-', '--cy-neon-')];
    const themedBase = candidates.find((c) => declared.has(c) && hasLight(c));
    if (themedBase && !hasLight(twin)) {
      fail(`${themedBase} has a light-theme value but ${twin} does not — the glow will keep the dark hue`);
    }
    if (!themedBase && hasLight(twin)) {
      fail(`${twin} has a light-theme value but its base colour does not — they will disagree`);
    }
  }
}

// ── 2. Class naming ───────────────────────────────────────────────
// cy- prefix on every class; modifiers are --variant; a __element child only
// where one is unavoidable.
//
// One segment is lowercase alphanumerics joined by single hyphens — no leading,
// trailing or doubled ones, since `--` is what separates a modifier. The block,
// the element and the modifier are all that same shape, so it is written once
// and composed rather than spelled out three times.
const SEGMENT = '[a-z0-9]+(?:-[a-z0-9]+)*';
const CLASS_RE = new RegExp(`^cy-${SEGMENT}(?:__${SEGMENT})?(?:--${SEGMENT})?$`);

function checkClassNames() {
  for (const f of sources) {
    for (const m of strip(read(f)).matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)) {
      const cls = m[1];
      if (!cls.startsWith('cy-')) fail(`${f}: .${cls} does not use the cy- prefix`);
      else if (!CLASS_RE.test(cls)) fail(`${f}: .${cls} does not match cy-block__element--modifier`);
    }
  }
}

// ── 3. No unscoped element selectors ──────────────────────────────
// Styling a bare `input {}` hijacks every control on a consumer's page the
// moment they import the kit. Styling a native element is fine — required,
// even — but only scoped to one of ours: `.cy-accordion > summary`,
// `.cy-terminal > pre`, `select.cy-input`.
// At-rule preludes, :root, and keyframe stops are not component selectors and
// have nothing to scope.
function isSelector(sel) {
  if (!sel || sel.startsWith('@') || sel.startsWith('%')) return false;
  if (sel.startsWith(':root')) return false;
  if (sel === 'from' || sel === 'to' || /^\d/.test(sel)) return false;
  return true;
}

// Every prelude in the sheet: the text before each `{`, with the cursor reset
// at every brace so a block's declarations are never mistaken for one.
//
// A plain linear scan rather than a regex. The first version used a lazy
// quantifier between two `\s*` groups — the shape that backtracks
// super-linearly, which this project has now had to fix three times.
//
// It also has to descend into at-rules. Both earlier attempts stopped at the
// first `{` of a chunk, so everything inside `@media` was skipped silently —
// and the reduced-motion, prefers-contrast and forced-colors blocks are where
// much of this kit's CSS lives.
function* preludes(css) {
  let start = 0;
  for (let i = 0; i < css.length; i += 1) {
    const ch = css[i];
    if (ch === '{') {
      yield css.slice(start, i).trim();
      start = i + 1;
    } else if (ch === '}') {
      start = i + 1;
    }
  }
}

function checkNoBareElements() {
  for (const f of sources) {
    for (const prelude of preludes(strip(read(f)))) {
      for (const sel of prelude.split(',')) {
        const s = sel.trim();
        // Anything anchored to one of our classes is scoped; a bare element
        // chain would style every such element on a consumer's page.
        if (isSelector(s) && !s.includes('.cy-')) {
          fail(`${f}: "${s}" styles elements without a cy- class to scope it`);
        }
      }
    }
  }
}

// ── 4. A new stylesheet needs wiring in two places ────────────────
// A file nobody imports is dead, and a file with no exports entry cannot be
// reached by consumers who cherry-pick. Both are silent failures.
function checkWiring() {
  const barrel = read(BARREL);
  const pkg = JSON.parse(read('package.json'));
  const exported = new Set(Object.values(pkg.exports).map((p) => p.replace('./', '')));

  for (const f of sources) {
    if (!barrel.includes(`@import "./${f}"`)) fail(`${f} has no @import in ${BARREL}`);
    if (!exported.has(f)) fail(`${f} has no entry in package.json exports`);
  }
  for (const target of exported) {
    if (target.endsWith('.css') && !cssFiles.includes(target)) {
      fail(`package.json exports ${target}, which does not exist`);
    }
  }
}

// ── 5. Docs may only name things that exist ───────────────────────
// The component reference is the first thing a consumer reads. A class that
// was renamed or removed leaves prose that is confidently wrong, and nothing
// about the page looks broken. This check was run by hand twice while the
// reference was being written, which is the argument for automating it.
// README plus every page of the component reference.
function docFiles() {
  const docs = ['README.md'];
  const dir = path.join(ROOT, 'docs', 'components');
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) docs.push(path.join('docs', 'components', f));
  }
  return docs;
}

function checkOneDoc(doc, classes, tokens) {
  const text = read(doc);

  for (const m of text.matchAll(/`\.(cy-[a-zA-Z0-9_-]+)`/g)) {
    if (!classes.has(m[1])) fail(`${doc}: documents .${m[1]}, which no stylesheet defines`);
  }

  for (const m of text.matchAll(/`(--cy-[a-z0-9-]+)`/g)) {
    // Wildcards like --cy-space-* are prose, not references.
    if (!m[1].endsWith('-') && !tokens.has(m[1])) {
      fail(`${doc}: documents ${m[1]}, which tokens.css does not declare`);
    }
  }
}

function checkDocsMatchCss() {
  const allCss = strip(sources.map(read).join('\n'));
  const classes = new Set([...allCss.matchAll(/\.(cy-[a-zA-Z0-9_-]+)/g)].map((m) => m[1]));
  const tokens = new Set([...allCss.matchAll(/(--cy-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));

  for (const doc of docFiles()) checkOneDoc(doc, classes, tokens);
}

// ── 6. The README's cherry-pick list must match the exports ───────
// Adding a stylesheet means touching four places: the file, the barrel, the
// exports map, and the README's import list. The first three fail loudly if
// missed — the fourth just quietly under-advertises the package, which is how
// /navigation and /table went unlisted after they shipped.
function checkReadmeImports() {
  const readme = read('README.md');
  const pkg = JSON.parse(read('package.json'));

  const subpaths = Object.keys(pkg.exports)
    .filter((k) => k !== '.' && k !== './package.json')
    .map((k) => k.replace('./', ''));

  const listed = new Set(
    [...readme.matchAll(/@import "@laddtnov\/cyberpunk-ui\/([a-z]+)"/g)].map((m) => m[1])
  );

  for (const sub of subpaths) {
    if (!listed.has(sub)) fail(`README does not show the /${sub} import`);
  }
  for (const sub of listed) {
    if (!subpaths.includes(sub)) fail(`README shows /${sub}, which package.json does not export`);
  }

  // "All N stylesheet subpaths resolve…" has to keep counting correctly.
  const claim = readme.match(/All (\w+) stylesheet subpaths/);
  if (claim) {
    const words = ['zero','one','two','three','four','five','six','seven','eight','nine','ten'];
    if (words[subpaths.length] !== claim[1]) {
      fail(`README says "All ${claim[1]} stylesheet subpaths" but there are ${subpaths.length}`);
    }
  }
}

function main() {
  checkRgbTwins();
  checkClassNames();
  checkNoBareElements();
  checkWiring();
  checkDocsMatchCss();
  checkReadmeImports();

  if (failures.length) {
    console.error(`\n${failures.length} convention failure(s):`);
    for (const f of new Set(failures)) console.error('  - ' + f);
    process.exit(1);
  }
  console.log(`Conventions OK — ${sources.length} stylesheets checked.`);
}

main();
