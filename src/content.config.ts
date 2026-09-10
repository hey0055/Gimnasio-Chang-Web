import { readdir, readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineCollection, z } from 'astro:content';

async function markdownFiles(directory: URL): Promise<URL[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const url = new URL(entry.isDirectory() ? `${entry.name}/` : entry.name, directory);
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
    if (value.startsWith('[') && value.endsWith(']')) return [key.trim(), value.slice(1, -1).split(',').map((item) => item.trim()).filter(Boolean)];
    return [key.trim(), value.replace(/^['"]|['"]$/g, '')];
  }));
  return { data, body: match[2] };
}

const posts = defineCollection({
  loader: {
    name: 'chang-markdown-loader',
    async load({ store, parseData, renderMarkdown, generateDigest }) {
      store.clear();
      const directory = new URL('./content/posts/', import.meta.url);
      for (const fileURL of await markdownFiles(directory)) {
        const source = await readFile(fileURL, 'utf8');
        const { data, body } = parseFrontmatter(source);
        const id = basename(fileURL.pathname, '.md');
        const parsedData = await parseData({ id, data });
        const rendered = await renderMarkdown(body, { fileURL });
        store.set({ id, data: parsedData, body, rendered, filePath: fileURLToPath(fileURL), digest: generateDigest(source) });
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
  }),
});

export const collections = { posts };
