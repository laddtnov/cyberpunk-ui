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
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

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

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
};

// The set of files this server will ever hand out, decided before it starts
// listening.
//
// The obvious way to write a static server is to join the request path onto a
// root and check the result did not escape. That works until someone edits the
// check. This one cannot escape because it never builds a path from the
// request at all: the URL is a key, and a key that is not in the table is a
// 404. Directories that could never be part of a demo render are skipped, so
// they are not reachable even by exact name.
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

const server = http.createServer((req, res) => {
  let key;
  try {
    key = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }
  const file = FILES.get(key);
  if (!file) {
    res.writeHead(404).end();
    return;
  }
  fs.readFile(file, (err, body) => {
    if (err) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] });
    res.end(body);
  });
});

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
