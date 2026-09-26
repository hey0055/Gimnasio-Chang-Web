import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
export const PAGE_SIZE = 10;
export function categoryName(name: string, slug: string) {
  return slug === 'corea' && name === '02 Corea' ? 'Corea' : name;
}
export const escapeHtml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
export async function allPosts() {
  return (await getCollection('posts')).sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime() || a.id.localeCompare(b.id));
}
export function monthKey(date: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit' }).format(date).replace('-', '/');
}
export function postDate(date: Date) {
  return new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}
export function blogArchives(posts: CollectionEntry<'posts'>[]) {
  const archives = new Map<string, { title: string; posts: CollectionEntry<'posts'>[] }>();
  for (const post of posts) {
    const entries: [string, string][] = [
      ...post.data.categorySlugs.map((slug, i): [string, string] => [`/index.php/category/${slug}/`, categoryName(post.data.categories[i], slug)]),
      ...post.data.tagSlugs.map((slug, i): [string, string] => [`/index.php/tag/${slug}/`, `Etiqueta: ${post.data.tags[i]}`]),
      [`/index.php/${monthKey(post.data.publishedAt)}/`, new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', year: 'numeric', month: 'long' }).format(post.data.publishedAt)],
    ];
    for (const [path, title] of entries) {
      if (!archives.has(path)) archives.set(path, { title, posts: [] });
      const archive = archives.get(path)!;
      if (!archive.posts.includes(post)) archive.posts.push(post);
    }
  }
  return archives;
}
