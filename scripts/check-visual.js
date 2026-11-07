#!/usr/bin/env node
// Runs the visual regression check. Zero dependencies by design: this package
// ships none, and neither do its tools.
//
//   npm run check:visual              compare against docs/baselines/
//   npm run check:visual -- --update  re-record them
//
// The browser half lives in scripts/visual-agent.mjs and runs inside
// ego-browser's Node runtime. That runtime gets no argv, no environment and a
// cwd of `/`, and it cannot listen on a socket — `server.listen()` never fires
// its callback there. So this half does the things ordinary Node can do: serve
// the repo, work out where it is, read the flag, and hand all three down as
// constants prepended to the agent source.
//
// Unlike the other checks this one is NOT in CI. ego-browser is a desktop
// browser and GitHub's runners cannot start it. docs/STATE.md says where it
// sits in the release routine instead.

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createRepoServer } = require('./repo-server.js');

// The one way past this check, and it is deliberately loud.
//
// `npm version` runs it through the preversion hook, so a failing visual check
// blocks a release. That is the point: 0.9.0 was tagged seconds after this
// check failed, because the tag push was chained onto a grep whose exit code
// said nothing about the check. The flake was harmless and two re-runs passed,
// but the gate had never actually held.
//
// It needs an escape because the browser itself is a dependency that has
// broken before — ego-browser's capture pipeline hung for an entire working
// session, which would have blocked a documentation-only release for a reason
// that had nothing to do with the package.
if (process.env.CY_SKIP_VISUAL === '1') {
  console.warn('CY_SKIP_VISUAL=1 — visual regression SKIPPED, not passed.');
  console.warn('Only legitimate when the browser is broken, never to get past a real diff.');
  process.exit(0);
}

const ROOT = path.join(__dirname, '..');
const AGENT = path.join(__dirname, 'visual-agent.mjs');
const update = process.argv.slice(2).includes('--update');
// --report prints each region's diff without failing, which is how the
// tolerances below were chosen rather than guessed.
const report = process.argv.slice(2).includes('--report');

// Where ego-browser is looked for, in order. Spawning it by bare name would
// hand the decision to PATH, and a developer PATH is long, mostly writable and
// mostly forgotten — plugin caches, version managers, per-project bin dirs. Any
// one of them could shadow the real binary, and this script pipes generated
// source into whatever it starts.
//
// Pinning the search does not defend against someone who already has write
// access to the home directory; nothing here could. It removes the ordering
// surprise, which is the part that happens by accident.
const BIN_DIRS = [
  path.join(os.homedir(), '.local', 'bin'),
  '/opt/homebrew/bin',
  '/usr/local/bin',
  '/usr/bin',
];

// The repository on localhost, so the browser loads the demo with its real
// stylesheets. The server, and the reason it serves from a closed table
// rather than joining paths, live in scripts/repo-server.js — check-forced-
// colors.js needs exactly the same thing.
const server = createRepoServer(ROOT);

const binary = BIN_DIRS.map((dir) => path.join(dir, 'ego-browser')).find((candidate) => {
  try {
    fs.accessSync(candidate, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
});

if (!binary) {
  console.error('ego-browser was not found, so the visual check cannot run. Looked in:');
  for (const dir of BIN_DIRS) console.error(`  ${dir}`);
  console.error('It is a local check by design — `npm run check` covers what CI enforces.');
  process.exit(127);
}

server.listen(0, '127.0.0.1', () => {
  const { port } = server.address();

  const source = [
    `const ROOT = ${JSON.stringify(ROOT)};`,
    `const PORT = ${port};`,
    `const UPDATE = ${update};`,
    `const REPORT = ${report};`,
    fs.readFileSync(AGENT, 'utf8'),
  ].join('\n');

  const child = spawn(binary, ['nodejs'], { stdio: ['pipe', 'inherit', 'inherit'] });

  child.on('error', (err) => {
    server.close();
    throw err;
  });

  child.on('exit', (code) => {
    server.close();
    process.exit(code ?? 1);
  });

  child.stdin.end(source);
});
