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
const bundle = [];
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
  bundle.push({ slug, meta, body: fill(fill(body.replace(/<!--\s*include:([\w-]+)\s*-->/g, (all, name) => partial(name)), vars), vars) });
}

// Preview: every page bundled into one file that switches pages without navigating.
// Used for the claude.ai preview link, where links between separate files don't work.
// The real site is site/; this file is never hosted.
const previewPages = bundle
  .filter((p) => p.slug !== '404')
  .map((p) => `<div class="tb-page" data-slug="${p.slug}" data-title="${fill(p.meta.title, {})}" data-cta="${p.meta.cta === 'no' ? 'no' : 'yes'}" hidden>\n` +
    p.body.replace('<main id="main">', '<main>') + '\n</div>')
  .join('\n');
const preview = [
  '<title>TradeBooked Website</title>',
  '<meta name="description" content="Preview of the TradeBooked website">',
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=DM+Mono:wght@400;500&display=swap">',
  '<style>' + read(path.join(SRC, 'assets', 'styles.css')) + '</style>',
  "<script>document.documentElement.classList.add('js');</script>",
  fill(fill(partial('header'), {}), {}),
  previewPages,
  '<div id="tb-cta">' + fill(partial('cta'), {}) + '</div>',
  fill(fill(partial('footer'), { year: String(new Date().getFullYear()) }), {})
    .replace(/<script[^>]*><\/script>/, '').replace('</body>', '').replace('</html>', ''),
  '<script>' + read(path.join(SRC, 'preview-router.js')) + '</script>',
  '<script>' + read(path.join(SRC, 'assets', 'main.js')) + '</script>',
].join('\n');
fs.mkdirSync(path.join(ROOT, 'preview'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'preview', 'index.html'), preview);

console.log(`Built ${pages.length} pages into site/`);
