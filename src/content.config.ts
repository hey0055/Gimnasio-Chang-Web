import { readdir, readFile } from 'node:fs/promises';
import { basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineCollection, z } from 'astro:content';

async function markdownFiles(directory: URL): Promise<URL[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const url = new URL(entry.isDirectory() ? `${encodeURIComponent(entry.name)}/` : encodeURIComponent(entry.name), directory);
    return entry.isDirectory() ? markdownFiles(url) : entry.name.endsWith('.md') ? [url] : [];
  }));
  return files.flat();
}

function parseFrontmatter(source: string) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error('Cada entrada debe comenzar con frontmatter YAML.');
  const data = Object.fromEntries(match[1].split(/\r?\n/).filter(Boolean).map((line) => {
    const [key, ...rest] = line.split(':');
    const value = rest.join(':').trim();
    if (value.startsWith('"') || value.startsWith('[')) {
      try { return [key.trim(), JSON.parse(value)]; } catch { /* Frontmatter anterior. */ }
    }
    if (value.startsWith('[') && value.endsWith(']')) return [key.trim(), value.slice(1, -1).split(',').map((item) => item.trim()).filter(Boolean)];
    return [key.trim(), value.replace(/^['"]|['"]$/g, '')];
  }));
  return { data, body: match[2] };
}

const posts = defineCollection({
  loader: {
    name: 'chang-markdown-loader',
    async load({ config, store, parseData, renderMarkdown, generateDigest, watcher, logger }) {
      const directory = new URL('./content/posts/', import.meta.url);
      async function syncPosts() {
        const entries = [];
        for (const fileURL of await markdownFiles(directory)) {
          const source = await readFile(fileURL, 'utf8');
          const { data, body } = parseFrontmatter(source);
          const id = basename(fileURLToPath(fileURL), '.md');
          const parsedData = await parseData({ id, data });
          const rendered = await renderMarkdown(body, { fileURL });
          // Astro exige una ruta relativa a la raíz del proyecto (en Linux falla con rutas absolutas).
          const filePath = relative(fileURLToPath(config.root), fileURLToPath(fileURL)).replaceAll('\\', '/');
          entries.push({ id, data: parsedData, body, rendered, filePath, digest: generateDigest(source) });
        }
        store.clear();
        for (const entry of entries) store.set(entry);
      }
      await syncPosts();
      if (watcher) {
        const contentPath = fileURLToPath(directory).replaceAll('\\', '/');
        watcher.add(fileURLToPath(directory));
        let timer: ReturnType<typeof setTimeout>;
        let pending = Promise.resolve();
        watcher.on('all', (event, file) => {
          if (!['add', 'change', 'unlink'].includes(event) || !file.replaceAll('\\', '/').startsWith(contentPath) || !file.endsWith('.md')) return;
          clearTimeout(timer);
          timer = setTimeout(() => {
            pending = pending.then(syncPosts).catch((error) => { logger.error(String(error)); });
          }, 150);
        });
      }
    },
  },
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    categories: z.array(z.string()),
    tags: z.array(z.string()),
    cover: z.string(),
    legacyPath: z.string(),
    wordpressId: z.string().optional(),
    bodyFormat: z.enum(['html', 'markdown']).default('markdown'),
    categorySlugs: z.array(z.string()).default([]),
    tagSlugs: z.array(z.string()).default([]),
  }),
});

export const collections = { posts };
