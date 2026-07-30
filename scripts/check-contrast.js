#!/usr/bin/env node
// Parses tokens.css and enforces WCAG contrast against each theme's --cy-bg.
// Zero dependencies by design: this package ships none, and neither do its tools.

const fs = require('node:fs');
const path = require('node:path');

// Role decides the floor. WCAG 1.4.3 requires 4.5 for normal text; 1.4.11
// requires 3.0 for non-text UI. --cy-neon-purple is only ever a box-shadow
// glow, and no single value clears 4.5 in both themes, so it is checked as UI.
// If a token's role changes, move it between these lists.
const TEXT_TOKENS = [
  '--cy-text',
  '--cy-heading',
  '--cy-neon-cyan',
  '--cy-neon-pink',
  '--cy-success',
  '--cy-warning',
  '--cy-danger',
];
const UI_TOKENS = ['--cy-neon-purple'];

const TEXT_FLOOR = 4.5;
const UI_FLOOR = 3.0;

function parseBlock(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(escaped + '\\s*\\{([^}]*)\\}'));
  if (!match) throw new Error('Block not found: ' + selector);

  const tokens = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/(--cy-[a-z0-9-]+)\s*:\s*([^;]+);/i);
    if (m) tokens[m[1]] = m[2].trim();
  }
  return tokens;
}

function relativeLuminance(hex) {
  const c = hex.replace('#', '');
  const full = c.length === 3 ? c.split('').map((x) => x + x).join('') : c;
  const [r, g, b] = [0, 2, 4]
    .map((i) => Number.parseInt(full.substr(i, 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(fg, bg) {
  const [hi, lo] = [relativeLuminance(fg), relativeLuminance(bg)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

function checkTheme(label, tokens, failures) {
  const bg = tokens['--cy-bg'];
  if (!bg?.startsWith('#')) throw new Error(label + ': --cy-bg missing or not a hex value');

  console.log('\n' + label + '  (background ' + bg + ')');

  for (const [list, floor, role] of [
    [TEXT_TOKENS, TEXT_FLOOR, 'text'],
    [UI_TOKENS, UI_FLOOR, 'ui'],
  ]) {
    for (const name of list) {
      const value = tokens[name];
      if (!value) {
        failures.push(label + ' ' + name + ' is not defined');
        console.log('  ' + name.padEnd(16) + ' MISSING');
        continue;
      }
      // var() aliases resolve to a token already checked on its own.
      if (!value.startsWith('#')) {
        console.log('  ' + name.padEnd(16) + ' ' + value + '  (alias, skipped)');
        continue;
      }
      const ratio = contrast(value, bg);
      const ok = ratio >= floor;
      if (!ok) failures.push(label + ' ' + name + ' ' + ratio.toFixed(2) + ' < ' + floor + ' (' + role + ')');
      console.log(
        '  ' + name.padEnd(16) + ' ' + value.padEnd(9) +
        ratio.toFixed(2).padStart(6) + '  need ' + floor + '  ' + (ok ? 'PASS' : 'FAIL')
      );
    }
  }
}

function main() {
  const css = fs.readFileSync(path.join(__dirname, '..', 'tokens.css'), 'utf8');
  const dark = parseBlock(css, ':root');
  const light = { ...dark, ...parseBlock(css, ':root[data-theme="light"]') };

  const failures = [];
  checkTheme('dark theme', dark, failures);
  checkTheme('light theme', light, failures);

  if (failures.length) {
    console.error('\n' + failures.length + ' contrast failure(s):');
    for (const f of failures) console.error('  - ' + f);
    process.exit(1);
  }
  console.log('\nAll contrast checks passed.');
}

main();
