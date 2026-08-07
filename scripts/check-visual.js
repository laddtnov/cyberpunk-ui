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
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const AGENT = path.join(__dirname, 'visual-agent.mjs');
const update = process.argv.slice(2).includes('--update');
// --report prints each region's diff without failing, which is how the
// tolerances below were chosen rather than guessed.
const report = process.argv.slice(2).includes('--report');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
};

const server = http.createServer((req, res) => {
  let file;
  try {
    file = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  } catch {
    res.writeHead(400).end();
    return;
  }
  // Loopback-only and short-lived, but a traversal out of the repo is still
  // not something to serve.
  if (!file.startsWith(ROOT + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  fs.readFile(file, (err, body) => {
    if (err) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  });
});

server.listen(0, '127.0.0.1', () => {
  const { port } = server.address();

  const source = [
    `const ROOT = ${JSON.stringify(ROOT)};`,
    `const PORT = ${port};`,
    `const UPDATE = ${update};`,
    `const REPORT = ${report};`,
    fs.readFileSync(AGENT, 'utf8'),
  ].join('\n');

  const child = spawn('ego-browser', ['nodejs'], { stdio: ['pipe', 'inherit', 'inherit'] });

  child.on('error', (err) => {
    server.close();
    if (err.code === 'ENOENT') {
      console.error('ego-browser is not installed, so the visual check cannot run.');
      console.error('It is a local check by design — `npm run check` covers what CI enforces.');
      process.exit(127);
    }
    throw err;
  });

  child.on('exit', (code) => {
    server.close();
    process.exit(code ?? 1);
  });

  child.stdin.end(source);
});
