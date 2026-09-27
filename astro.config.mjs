// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const postsDirectory = fileURLToPath(new URL('./src/content/posts/', import.meta.url));
const normalizePath = (pathname) => `${decodeURI(pathname).replace(/\/+$/, '')}/`;
const postPaths = new Set(readdirSync(postsDirectory, { recursive: true })
  .filter((file) => file.endsWith('.md'))
  .map((file) => readFileSync(join(postsDirectory, file), 'utf8').match(/^legacyPath:\s*(.+)$/m)?.[1].trim().replace(/^["']|["']$/g, ''))
  .filter(Boolean)
  .map(normalizePath));
const mainPages = new Set(['/', '/index.php/about/', '/index.php/maestros/', '/index.php/taekwondo/', '/index.php/patrocinadores/', '/index.php/zona-club/']);

export default defineConfig({
  site: 'https://www.gimnasiochang.com',
  integrations: [sitemap({
    // Incluir las páginas completas y omitir los marcadores de archivo en preparación.
    filter: (page) => {
      const pathname = normalizePath(new URL(page).pathname);
      return mainPages.has(pathname) || postPaths.has(pathname)
        || /^\/page\/\d+\/$/.test(pathname)
        || /^\/index\.php\/(?:category|tag)\/[^/]+\/(?:page\/\d+\/)?$/.test(pathname)
        || /^\/index\.php\/\d{4}\/\d{2}\/(?:page\/\d+\/)?$/.test(pathname);
    },
  })],
});
