// Builds the site: combines src/partials + src/pages into public/*.html
// Run with:  node build.mjs   (nothing to install)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const root = path.dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'site.config.json'), 'utf8'));
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const partials = {};
for (const f of fs.readdirSync(path.join(root, 'src/partials'))) partials[path.basename(f, '.html')] = read(`src/partials/${f}`);

// Values every page can use as {{name}}. Images are {{img_<key>}}.
const globals = {
  name: esc(cfg.name), url: cfg.url, topbar: esc(cfg.topbar),
  phone: cfg.phone, phoneTel: cfg.phoneTel, telHref: `tel:${cfg.phoneTel}`,
  landline: cfg.landline, landlineTel: cfg.landlineTel, landlineHref: `tel:${cfg.landlineTel}`,
  email: cfg.email, emailHref: `mailto:${cfg.email}`, formsubmitAddress: cfg.formsubmitAddress,
  locality: cfg.locality, region: cfg.region, postcode: cfg.postcode, addressLine: cfg.addressLine,
  footerText: esc(cfg.footerText),
};
for (const [k, v] of Object.entries(cfg.images)) globals[`img_${k}`] = v;
// Google reviews panel: shows the rating only when real figures are filled in site.config.json
{
  const g = cfg.google || {};
  const searchUrl = 'https://www.google.com/search?q=' + encodeURIComponent(`${cfg.name} ${cfg.locality}`);
  const readUrl = g.reviewsUrl || searchUrl;
  const score = g.rating
    ? `<div class="h-gscore"><span class="h-gnum">${esc(g.rating)}</span><span class="h-gstars" aria-label="${esc(g.rating)} out of 5 stars">★★★★★</span></div>` +
      (g.reviewCount ? `<p class="h-gcount">Based on ${esc(g.reviewCount)} Google reviews</p>` : '')
    : '';
  const write = g.writeReviewUrl ? `<a class="h-btn h-btn--ghost" href="${esc(g.writeReviewUrl)}" target="_blank" rel="noopener">Leave us a review</a>` : '';
  globals.googleSummary = `${score}<p class="h-gnote">Customers rate us on Google for turning up on time, fixed prices and tidy work.</p>` +
    `<div class="h-gbtns"><a class="h-btn h-btn--gold" href="${esc(readUrl)}" target="_blank" rel="noopener">Read all reviews on Google</a>${write}</div>`;
  globals.reviewSource = g.reviewsAreFromGoogle ? 'Google review' : 'Customer review';
  globals.reviewsHeading = g.reviewsAreFromGoogle ? 'What our customers say on Google' : 'What our customers say';
}
// WhatsApp chat link
{
  const w = cfg.whatsapp || {};
  globals.whatsappHref = `https://wa.me/${w.number}?text=${encodeURIComponent(w.message || '')}`;
}


function parsePage(src) {
  const m = src.match(/^<!--([\s\S]*?)-->\s*/);
  const meta = {};
  if (m) for (const line of m[1].split('\n')) { const i = line.indexOf(':'); if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim(); }
  return { meta, body: m ? src.slice(m[0].length) : src };
}

function render(tpl, vars, depth = 0) {
  if (depth > 6) throw new Error('Partial nesting too deep');
  return tpl
    .replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, n) => { if (!(n in partials)) throw new Error(`Missing partial: ${n}`); return render(partials[n], vars, depth + 1); })
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => { if (!(k in vars)) throw new Error(`Unknown placeholder {{${k}}}`); return vars[k]; });
}

const pages = fs.readdirSync(path.join(root, 'src/pages')).filter((f) => f.endsWith('.html'));
const sitemap = [];

// Cache-busting: add a short content hash to CSS/JS links so browsers fetch new versions
const assetVersion = {};
for (const a of ['assets/css/styles.css', 'assets/css/home.css', 'assets/js/main.js']) {
  const f = path.join(root, 'public', a);
  if (fs.existsSync(f)) assetVersion['/' + a] = crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex').slice(0, 8);
}
const versionAssets = (html) => html.replace(/(href|src)="(\/assets\/(?:css|js)\/[\w.-]+\.(?:css|js))"/g,
  (m, attr, url) => assetVersion[url] ? `${attr}="${url}?v=${assetVersion[url]}"` : m);

for (const file of pages) {
  const { meta, body } = parsePage(read(`src/pages/${file}`));
  const slug = path.basename(file, '.html');
  const urlPath = slug === 'index' ? '/' : `/${slug}/`;
  const isService = cfg.services.some(([k]) => k === slug);
  const cur = (k) => (k === slug ? ' aria-current="page"' : '');

  const serviceLinks = cfg.services.map(([k, label, href]) => `<li><a href="${href}"${cur(k)}>${esc(label)}</a></li>`).join('');
  const navItems = cfg.nav.map(([k, label, href]) => {
    if (k === 'services') {
      return `<li class="has-dropdown"><button type="button" aria-expanded="false"${isService ? ' aria-current="page"' : ''}>${label}</button><ul class="dropdown">${serviceLinks}</ul></li>`;
    }
    return `<li><a href="${href}"${cur(k === 'home' ? 'index' : k)}>${esc(label)}</a></li>`;
  }).join('');

  const vars = {
    ...globals,
    title: esc(meta.title || cfg.name),
    description: esc(meta.description || ''),
    canonical: cfg.url + urlPath,
    ogImage: (() => { const i = globals[`img_${meta.ogImage || 'ogImage'}`]; return i.startsWith('/') ? cfg.url + i : i; })(),
    navItems,
    serviceLinks,
  };
  vars.content = render(body, vars);
  const layout = partials[meta.layout ? `layout-${meta.layout}` : 'layout'];
  if (!layout) throw new Error(`Missing layout: layout-${meta.layout}`);
  fs.writeFileSync(path.join(root, 'public', `${slug}.html`), versionAssets(render(layout, vars)));
  if (slug !== '404') sitemap.push(vars.canonical);
  console.log(`  built ${slug}.html  →  ${urlPath}`);
}

fs.writeFileSync(path.join(root, 'public/sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(root, 'public/robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${cfg.url}/sitemap.xml\n`);
console.log(`Done — ${pages.length} pages built into public/`);
