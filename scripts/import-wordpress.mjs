/** Adaptado de Air-Cluster-Web/scripts/import-wordpress.mjs.
 * node scripts/import-wordpress.mjs [--file export.xml] [--dry-run]
 * Conserva el HTML de WordPress en Markdown para no perder galerías y vídeos.
 */
import { readFile, writeFile, mkdir, readdir, copyFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { XMLParser } from 'fast-xml-parser';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const source = args.includes('--file') ? args[args.indexOf('--file') + 1] : 'import/gimnasiochangtaekwondo.WordPress.2026-09-26.xml';
const contentDir = path.join(root, 'src/content/posts');
const assetsDir = path.join(root, 'src/assets/posts');
const manifestFile = path.join(assetsDir, 'wordpress-images.json');
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', parseTagValue: false, trimValues: false });
const items = [].concat(parser.parse(await readFile(path.resolve(root, source), 'utf8')).rss.channel.item ?? []);
const array = (v) => v == null ? [] : [].concat(v);
const text = (v) => String(v?.['#text'] ?? v ?? '');
const meta = (item) => new Map(array(item['wp:postmeta']).map((m) => [text(m['wp:meta_key']), text(m['wp:meta_value'])]));
const attachments = new Map(items.filter((i) => text(i['wp:post_type']) === 'attachment').map((i) => [text(i['wp:post_id']), text(i['wp:attachment_url'])]));
const published = items.filter((i) => text(i['wp:post_type']) === 'post' && text(i['wp:status']) === 'publish');
const normalizePath = (url) => `${new URL(url).pathname.replace(/\/+$/, '')}/`;
const posts = [];
const ids = new Set();
const paths = new Set();
for (const item of published) {
  const id = text(item['wp:post_id']);
  const permalink = normalizePath(text(item.link));
  if (ids.has(id) || paths.has(permalink)) continue;
  ids.add(id); paths.add(permalink);
  posts.push({ item, id, permalink, slug: text(item['wp:post_name']) || `post-${id}` });
}
const existing = (await readdir(contentDir)).filter((f) => f.endsWith('.md'));
const existingSources = await Promise.all(existing.map(async (file) => ({ file, source: await readFile(path.join(contentDir, file), 'utf8') })));
const existingFor = (p) => existingSources.filter((e) => {
  const frontmatter = e.source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  const field = (name) => frontmatter.split(/\r?\n/).find((line) => line.startsWith(`${name}:`))?.slice(name.length + 1).trim().replace(/^["']|["']$/g, '');
  return field('legacyPath') === p.permalink || field('wordpressId') === p.id;
});
console.log(`Publicados: ${published.length}; únicos: ${posts.length}; existentes: ${posts.filter((p) => existingFor(p).length).length}${dry ? ' [simulación]' : ''}`);
if (dry) {
  for (const p of posts) console.log(`${existingFor(p).length ? 'Actualizar' : 'Importar'}: ${p.permalink}`);
  process.exit(0);
}

await mkdir(assetsDir, { recursive: true });
const manifest = existsSync(manifestFile) ? JSON.parse(await readFile(manifestFile, 'utf8')) : {};
// Reutilizar también recursos descargados antes de esta importación.
const mapSource = await readFile(path.join(root, 'src/data/legacy-image-map.ts'), 'utf8');
const existingAssets = new Map([...mapSource.matchAll(/"(\/assets\/legacy\/[^"\n]+)": "([^"\n]+)"/g)].map((m) => [m[1], path.resolve(root, 'src/data', m[2])]));
const errors = [];
const imageUrls = new Map();
const decode = (s) => s.replaceAll('&amp;', '&');
function absoluteImage(value) {
  try { const url = new URL(decode(value), 'https://www.gimnasiochang.com'); return /^https?:$/.test(url.protocol) ? url.href : null; } catch { return null; }
}
const imageExtension = /\.(?:jpe?g|png|gif|webp|bmp|svg|avif)(?:[?#]|$)/i;
for (const p of posts) {
  const html = text(p.item['content:encoded']).replace(/<a\b[^>]*>\s*<\/a>/gi, '');
  const urls = [...html.matchAll(/<(?:img|a|source)\b[^>]*\b(?:src|href|data-src|poster)=["']([^"']+)["']/gi)].map((m) => m[1]);
  urls.push(...[...html.matchAll(/\b(?:src|data-src|poster)=["']([^"']+)["']/gi)].filter((m) => imageExtension.test(m[1])).map((m) => m[1]));
  urls.push(...[...html.matchAll(/url\(["']?([^)'"\s]+)["']?\)/gi)].map((m) => m[1]));
  const thumb = attachments.get(meta(p.item).get('_thumbnail_id'));
  if (thumb) urls.push(thumb);
  for (const value of urls.filter((u) => imageExtension.test(u))) {
    const url = absoluteImage(value);
    if (url) imageUrls.set(url, [...new Set([...(imageUrls.get(url) ?? []), p.slug])]);
  }
}
async function download(url) {
  if (manifest[url] && existsSync(path.join(assetsDir, manifest[url]))) return;
  const parsed = new URL(url);
  const uploadPath = parsed.pathname.match(/\/wp-content\/uploads\/(.+)/)?.[1];
  const filename = decodeURIComponent(parsed.pathname.split('/').pop()).replace(/[^a-zA-Z0-9._-]/g, '-');
  const suffix = createHash('sha256').update(url).digest('hex').slice(0, 10);
  const relative = `${suffix}-${filename}`;
  const target = path.join(assetsDir, relative);
  await mkdir(path.dirname(target), { recursive: true });
  const corrected = uploadPath === '2008/12/navidad2008.jpg' ? '2008/12/navidad2008.jpeg' : uploadPath;
  const local = corrected && existingAssets.get(`/assets/legacy/${corrected}`);
  if (local && existsSync(local)) {
    // Si el archivo ya está en posts, conservar su ruta sin crear otra copia.
    if (path.relative(assetsDir, local).startsWith('..')) await copyFile(local, target);
    manifest[url] = path.relative(assetsDir, local).startsWith('..') ? relative : path.relative(assetsDir, local).replaceAll('\\', '/');
    return;
  }
  const candidates = [...new Set([url.replace(/-\d+x\d+(\.[a-zA-Z0-9]+)(?=[?#]|$)/, '$1'), url])];
  for (const candidate of candidates) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(candidate, { signal: AbortSignal.timeout(20000) });
        if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) break;
        const bytes = Buffer.from(await response.arrayBuffer());
        if (!bytes.length) break;
        await writeFile(target, bytes);
        manifest[url] = relative;
        return;
      } catch { /* Reintentar y probar la URL original. */ }
    }
  }
  errors.push({ url, posts: imageUrls.get(url) });
}
const queue = [...imageUrls.keys()];
let completed = 0;
await Promise.all(Array.from({ length: 6 }, async () => {
  while (queue.length) {
    await download(queue.shift());
    completed++;
    if (completed % 40 === 0) console.log(`Imágenes comprobadas: ${completed}/${imageUrls.size}`);
  }
}));
await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(path.join(root, 'import/wordpress-report.json'), `${JSON.stringify({ published: published.length, unique: posts.length, images: imageUrls.size, errors }, null, 2)}\n`);
if (errors.length) {
  console.error(`Importación incompleta: ${errors.length} imágenes no recuperadas. Consulta import/wordpress-report.json.`);
}
const imagePath = (url) => {
  const absolute = absoluteImage(url);
  return absolute && manifest[absolute] ? `/assets/posts/${manifest[absolute]}` : url;
};
function internalLink(href) {
  try { const url = new URL(decode(href)); return /^(www\.)?gimnasiochang\.com$/.test(url.hostname) ? url.pathname + url.search + url.hash : href; } catch { return href; }
}
function localize(html) {
  return html.replace(/<a\b[^>]*>\s*<\/a>/gi, '')
    .replace(/<object\b[\s\S]*?<\/object>/gi, (object) => {
      const id = object.match(/youtube\.com\/v\/([\w-]+)/)?.[1];
      return id ? `<iframe src="https://www.youtube.com/embed/${id}" title="Vídeo de YouTube" loading="lazy" allowfullscreen></iframe>` : object;
    })
    .replace(/(?:https?:)?\/\/www\.youtube\.com\/embed\//g, 'https://www.youtube.com/embed/')
    .replace(/\s+(?:srcset|sizes|data-full-url|data-link|data-id)=("[^"]*"|'[^']*')/gi, '')
    .replace(/\b(src|href|data-src|poster)=("|')([^"']*)\2/gi, (_, attr, quote, value) => `${attr}=${quote}${imagePath(value) === value ? internalLink(value) : imagePath(value)}${quote}`)
    .replace(/url\((["']?)([^)'"\s]+)\1\)/gi, (_, quote, value) => `url(${quote}${imagePath(value)}${quote})`)
    .replace(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi, (tag, url) => errors.some((error) => error.url === absoluteImage(url)) ? '<span class="missing-image" role="note">Imagen original no disponible.</span>' : tag);
}
// WordPress aplica wpautop a las entradas antiguas al servirlas; el WXR no lo incluye.
function paragraphs(html) {
  if (!/<(?:p|div|figure|ul|ol|table|h[1-6])\b/i.test(html)) {
    return html.trim().split(/\r?\n\s*\r?\n/).map((part) => `<p>${part.replace(/\r?\n/g, '<br />')}</p>`).join('\n');
  }
  return html;
}
for (const p of posts) {
  const raw = text(p.item['content:encoded']);
  const html = paragraphs(localize(raw));
  const taxonomies = array(p.item.category);
  const tax = (domain) => taxonomies.filter((c) => c['@_domain'] === domain).map((c) => ({ name: text(c), slug: c['@_nicename'] }));
  const categories = tax('category'); const tags = tax('post_tag');
  const thumbnail = attachments.get(meta(p.item).get('_thumbnail_id'));
  const cover = thumbnail && manifest[absoluteImage(thumbnail)] ? imagePath(thumbnail) : html.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i)?.[1] ?? '';
  const description = (text(p.item['excerpt:encoded']) || raw).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180) || text(p.item.title);
  const dateGMT = text(p.item['wp:post_date_gmt']);
  const publishedAt = dateGMT && !dateGMT.startsWith('0000') ? `${dateGMT.replace(' ', 'T')}Z` : text(p.item['wp:post_date']).replace(' ', 'T');
  const data = { title: text(p.item.title), description, publishedAt, categories: categories.map((t) => t.name), tags: tags.map((t) => t.name), categorySlugs: categories.map((t) => t.slug), tagSlugs: tags.map((t) => t.slug), cover, legacyPath: p.permalink, wordpressId: p.id, bodyFormat: 'html' };
  const markdown = `---\n${Object.entries(data).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n')}\n---\n\n${html}\n`;
  const matches = existingFor(p);
  const filename = matches.find((entry) => entry.file === 'kyorugi-2026.md')?.file ?? `${p.slug}${posts.filter((other) => other.slug === p.slug).length > 1 ? `-${p.id}` : ''}.md`;
  const current = existsSync(path.join(contentDir, filename)) ? await readFile(path.join(contentDir, filename), 'utf8') : '';
  if (current !== markdown) await writeFile(path.join(contentDir, filename), markdown);
  for (const duplicate of matches.filter((entry) => entry.file !== filename)) {
    if (existsSync(path.join(contentDir, duplicate.file))) await unlink(path.join(contentDir, duplicate.file));
  }
}
console.log(`Artículos importados: ${posts.length}; imágenes comprobadas: ${imageUrls.size}; errores pendientes: ${errors.length}.`);
if (errors.length) process.exitCode = 1;
