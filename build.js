#!/usr/bin/env node
// Builds the TradeBooked site from src/ into site/.
// No dependencies: run `node build.js`.
//
// - src/pages/*.html start with a front-matter block (title, description, nav, ...)
// - src/partials/*.html are shared across every page (header, footer, Book a chat strip).
//   Pages can also pull one in with <!-- include:name -->
// - site.config.json holds details used everywhere (phone, email, ABN). Use {{site.key}} in any file.

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'site');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));

const read = (p) => fs.readFileSync(p, 'utf8');
const partial = (name) => read(path.join(SRC, 'partials', name + '.html'));

function parsePage(file) {
  const raw = read(file);
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  const meta = {};
  if (m) {
    m[1].split('\n').forEach((line) => {
      const i = line.indexOf(':');
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    });
  }
  return { meta, body: m ? raw.slice(m[0].length) : raw };
}

function fill(html, vars) {
  return html.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (all, key) => {
    if (key.startsWith('site.')) {
      const v = config[key.slice(5)];
      return v === undefined ? all : v;
    }
    return vars[key] === undefined ? '' : vars[key];
  });
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, entry.name);
    const b = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(a, b);
    else fs.copyFileSync(a, b);
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
copyDir(path.join(SRC, 'assets'), path.join(OUT, 'assets'));
for (const f of fs.readdirSync(path.join(SRC, 'static'))) {
  fs.writeFileSync(path.join(OUT, f), fill(read(path.join(SRC, 'static', f)), {}));
}

const pages = fs.readdirSync(path.join(SRC, 'pages')).filter((f) => f.endsWith('.html'));
for (const f of pages) {
  const { meta, body } = parsePage(path.join(SRC, 'pages', f));
  const slug = f.replace(/\.html$/, '');
  const vars = {
    ...meta,
    slug,
    canonical: config.siteUrl + (slug === 'index' ? '/' : '/' + slug),
    year: String(new Date().getFullYear()),
    ['nav_' + (meta.nav || slug)]: ' aria-current="page"',
  };
  const html = [
    partial('head'),
    partial('header'),
    body.replace(/<!--\s*include:([\w-]+)\s*-->/g, (all, name) => partial(name)),
    meta.cta === 'no' ? '' : partial('cta'),
    partial('footer'),
  ].join('\n');
  // Two passes so partials can use page variables and site config.
  fs.writeFileSync(path.join(OUT, f), fill(fill(html, vars), vars));
}

console.log(`Built ${pages.length} pages into site/`);
