import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const site = 'https://www.gimnasiochang.com';
const output = resolve(process.cwd(), 'src/data/legacy-content.ts');

const staticPages = [
  { key: 'about', title: 'EL CLUB', path: '/index.php/about/' },
  { key: 'maestros', title: 'MAESTROS', path: '/index.php/maestros/' },
  { key: 'taekwondo', title: 'TAEKWONDO', path: '/index.php/taekwondo/' },
  { key: 'alumnos', title: 'ALUMNOS', path: '/index.php/patrocinadores/' },
  { key: 'galeria', title: 'GALERIA', path: '/index.php/zona-club/' },
];

const posts = [
  { title: 'Breve Análisis del Campeonato de Europa de Kyorugi 2026', path: '/index.php/2026/05/21/breve-analisis-del-campeonato-de-europa-de-kyorugi-2026/' },
  { title: 'Mas sobre numeros', path: '/index.php/2026/04/13/mas-sobre-numeros6/' },
  { title: 'Guía para atarse el cinturón de Taekwondo', path: '/index.php/2026/04/06/guia-para-atarse-el-cinturon-de-taekwondo/' },
  { title: 'Are maki, técnica básica', path: '/index.php/2026/03/23/are-maki-tecnica-basica/' },
  { title: 'Horario de Fallas 2026', path: '/index.php/2026/03/18/horario-de-fallas-2026/' },
  { title: 'Aprendiendo coreano Cap. 2: del 1 al 10', path: '/index.php/2026/03/09/aprendiendo-coreano-cap-2-del-1-al-10/' },
  { title: 'Básicos del Apchagui', path: '/index.php/2026/03/02/basicos-del-apchagui/' },
  { title: 'Un examen de grados en el Chang', path: '/index.php/2025/12/05/un-examen-de-grados-en-el-chang/' },
  { title: 'Club Oficial desde 1978', path: '/index.php/2025/02/01/club-oficial-desde-1978/' },
  { title: 'EMPEZAMOS ESTE 2025', path: '/index.php/2025/01/08/empezamos-este-2025/' },
];

const duplicateAssetAliases = {
  '/assets/legacy/2009/12/Gimnasio-chang-07301.jpg': '/assets/legacy/2009/12/Gimnasio-chang-0730.jpg',
  '/assets/legacy/2009/12/Gimnasio-chang-07302.jpg': '/assets/legacy/2009/12/Gimnasio-chang-0730.jpg',
  '/assets/legacy/2009/12/Gimnasio-chang-07301-150x150.jpg': '/assets/legacy/2009/12/Gimnasio-chang-0730-150x150.jpg',
  '/assets/legacy/2009/12/Gimnasio-chang-07302-150x150.jpg': '/assets/legacy/2009/12/Gimnasio-chang-0730-150x150.jpg',
  '/assets/legacy/2009/12/Gimnasio-Chang-Infantil1.jpg': '/assets/legacy/2009/12/Gimnasio-Chang-Infantil.jpg',
  '/assets/legacy/2009/12/Gimnasio-Chang-Infantil1-150x150.jpg': '/assets/legacy/2009/12/Gimnasio-Chang-Infantil-150x150.jpg',
  '/assets/legacy/2009/12/Gimnasio-chang-08301.jpg': '/assets/legacy/2009/12/Gimnasio-chang-0830.jpg',
  '/assets/legacy/2009/12/Gimnasio-chang-08301-150x150.jpg': '/assets/legacy/2009/12/Gimnasio-chang-0830-150x150.jpg',
};

function canonicalizeDuplicateAssets(content) {
  return Object.entries(duplicateAssetAliases).reduce(
    (normalized, [alias, canonical]) => normalized.replaceAll(alias, canonical),
    content,
  );
}

function stripResponsiveImageAttributes(content) {
  return content
    .replace(/\s+srcset=("[^"]*"|'[^']*')/gi, '')
    .replace(/\s+sizes=("[^"]*"|'[^']*')/gi, '');
}

function localize(html) {
  const localized = html
    .replaceAll('https://www.gimnasiochang.com/wp-content/uploads/', '/assets/legacy/')
    .replaceAll('http://www.gimnasiochang.com/wp-content/uploads/', '/assets/legacy/')
    .replaceAll('https://www.gimnasiochang.com/index.php/', '/index.php/')
    .replaceAll('http://www.gimnasiochang.com/index.php/', '/index.php/')
    .replaceAll('https://www.gimnasiochang.com/', '/')
    .replaceAll('http://www.gimnasiochang.com/', '/');
  return stripResponsiveImageAttributes(canonicalizeDuplicateAssets(localized));
}

function entryContent(html, path) {
  const start = html.indexOf('<div class="entry-content">');
  const end = html.indexOf('</div><!-- .entry-content -->', start);
  if (start === -1 || end === -1) throw new Error(`No se encontró el contenido de ${path}`);
  return localize(html.slice(start + '<div class="entry-content">'.length, end).trim());
}

function listingContent(html, path) {
  const articles = html.match(/<article\b[\s\S]*?<\/article><!-- #post -->/g) ?? [];
  if (!articles.length) throw new Error(`No se encontraron entradas en ${path}`);
  const archiveHeader = html.match(/<header class="archive-header">[\s\S]*?<\/header><!-- \.archive-header -->/);
  const navigation = html.match(/<nav id="nav-below"[\s\S]*?<\/nav><!-- \.navigation -->/);
  return localize([archiveHeader?.[0], ...articles, navigation?.[0]].filter(Boolean).join('\n').trim());
}

function postContent(html, path) {
  const article = html.match(/<article\b[\s\S]*?<\/article><!-- #post -->/);
  if (!article) throw new Error(`No se encontró la entrada de ${path}`);
  return localize(article[0]);
}

function sidebarContent(html) {
  const startTag = '<div id="secondary" class="widget-area" role="complementary">';
  const start = html.indexOf(startTag);
  const end = html.indexOf('</div><!-- #secondary -->', start);
  if (start === -1 || end === -1) throw new Error('No se encontró la barra lateral');
  return localize(html.slice(start + startTag.length, end).trim());
}

async function getHtml(path) {
  const response = await fetch(`${site}${path}`);
  if (!response.ok) throw new Error(`No se pudo descargar ${path}: ${response.status}`);
  return response.text();
}

const home = await getHtml('/');
const academia = await getHtml('/index.php/category/academia/');
const pageEntries = await Promise.all(staticPages.map(async (page) => [page.key, entryContent(await getHtml(page.path), page.path)]));
const postEntries = await Promise.all(posts.map(async (post) => ({ ...post, content: postContent(await getHtml(post.path), post.path) })));

const source = `// Archivo generado desde las páginas públicas de Gimnasio Chang.\n// Actualízalo con: node scripts/import-legacy-content.mjs\n\nexport const legacyPages = ${JSON.stringify(Object.fromEntries(pageEntries), null, 2)} as const;\n\nexport const legacyListings = ${JSON.stringify({ home: listingContent(home, '/'), academia: listingContent(academia, '/index.php/category/academia/') }, null, 2)} as const;\n\nexport const legacyPosts = ${JSON.stringify(postEntries, null, 2)} as const;\n\nexport const legacySidebar = ${JSON.stringify(sidebarContent(home), null, 2)} as const;\n`;

await mkdir(dirname(output), { recursive: true });
await writeFile(output, source, 'utf8');
console.log(`Contenido actualizado: ${staticPages.length} páginas y ${posts.length} entradas.`);
