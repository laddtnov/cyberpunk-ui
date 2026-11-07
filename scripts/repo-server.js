#!/usr/bin/env node
// The static server the two browser-driven checks share. Zero dependencies by
// design: this package ships none, and neither do its tools.
//
// Both `check-visual.js` and `check-forced-colors.js` need the repository on
// localhost so a browser can load `demo/index.html` with its real stylesheets.
// They had the same forty lines each, which is how the second one was written
// — by copying the first.
//
// The security property is the reason this is worth sharing rather than
// re-deriving. The obvious way to write a static server is to join the request
// path onto a root and check the result did not escape. That works until
// someone edits the check. This one cannot escape because it never builds a
// path from the request at all: the URL is a key into a table decided before
// the server starts listening, and a key that is not in the table is a 404.
// Directories that could never be part of a demo render are skipped, so they
// are not reachable even by exact name.

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
};

const SKIP = new Set(['.git', 'node_modules', '.github', '.claude']);

function fileTable(dir, prefix, table) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || SKIP.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    const url = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) fileTable(abs, url, table);
    else if (MIME[path.extname(entry.name)]) table.set(url, abs);
  }
  return table;
}

// `routes` maps a URL to a handler, for the things a caller serves itself —
// a generated audit page, a result endpoint. Anything not routed falls through
// to the file table, and anything not in that is a 404.
function createRepoServer(root, routes = {}) {
  const files = fileTable(root, '', new Map());

  return http.createServer((req, res) => {
    let key;
    try {
      key = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
      res.writeHead(400).end();
      return;
    }

    const route = routes[key];
    if (route) {
      route(req, res);
      return;
    }

    const file = files.get(key);
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
}

module.exports = { createRepoServer, MIME, SKIP };
