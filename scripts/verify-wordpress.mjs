import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { XMLParser } from 'fast-xml-parser';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = JSON.parse(await readFile(path.join(root, 'import/wordpress-report.json'), 'utf8'));
const xml = new XMLParser({ parseTagValue: false }).parse(await readFile(path.join(root, 'import/gimnasiochangtaekwondo.WordPress.2026-09-26.xml'), 'utf8'));
const published = xml.rss.channel.item.filter((item) => item['wp:post_type'] === 'post' && item['wp:status'] === 'publish');
const content = path.join(root, 'src/content/posts');
const posts = await Promise.all((await readdir(content)).filter((f) => f.endsWith('.md')).map(async (file) => {
  const source = await readFile(path.join(content, file), 'utf8');
  const [, frontmatter, body] = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  const data = Object.fromEntries(frontmatter.split(/\r?\n/).map((line) => { const colon = line.indexOf(':'); return [line.slice(0, colon), JSON.parse(line.slice(colon + 1))]; }));
  return { data, body };
}));
assert.equal(posts.length, published.length);
assert.equal(new Set(posts.map((post) => post.data.wordpressId)).size, published.length);
assert.equal(new Set(posts.map((post) => post.data.legacyPath)).size, published.length);
for (const item of published) {
  const post = posts.find((p) => p.data.wordpressId === String(item['wp:post_id']));
  assert.ok(post, `Falta WordPress ID ${item['wp:post_id']}`);
  assert.equal(post.data.title, item.title);
  assert.equal(post.data.legacyPath, new URL(item.link).pathname);
  const route = path.join(root, 'dist', decodeURIComponent(post.data.legacyPath), 'index.html');
  await access(route);
}
for (const post of posts) {
  assert.ok(post.body.trim());
  assert.ok(!/https:https:|application\/x-shockwave-flash/.test(post.body));
  assert.ok(!/<img\b[^>]*\bsrc=["']https?:/i.test(post.body), `Imagen remota: ${post.data.legacyPath}`);
  for (const match of post.body.matchAll(/\/assets\/posts\/[^"'()\s?]+/g)) await access(path.join(root, 'src', match[0]));
}
const ordered = posts.sort((a, b) => new Date(b.data.publishedAt) - new Date(a.data.publishedAt));
const seen = [];
for (let page = 1; page <= Math.ceil(posts.length / 10); page++) {
  const html = await readFile(path.join(root, 'dist', page === 1 ? '' : `page/${page}`, 'index.html'), 'utf8');
  const headings = [...html.matchAll(/<h1 class="entry-title"><a href="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(headings, ordered.slice((page - 1) * 10, page * 10).map((p) => p.data.legacyPath));
  seen.push(...headings);
}
assert.equal(new Set(seen).size, posts.length);
console.log(`Verificados ${posts.length} artículos, rutas, imágenes locales y ${Math.ceil(posts.length / 10)} páginas en orden.`);
console.log(`Recuperación de imágenes: ${report.images - report.errors.length}/${report.images}; pendientes: ${report.errors.length} (ver import/wordpress-report.json).`);
