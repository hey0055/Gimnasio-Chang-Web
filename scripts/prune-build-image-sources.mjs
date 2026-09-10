import { readdir, readFile, rm, stat } from 'node:fs/promises';
import { extname, relative, resolve, sep } from 'node:path';

const buildRoot = resolve(process.cwd(), 'dist');
const originalFormats = new Set(['.jpg', '.jpeg', '.png', '.gif', '.bmp']);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const file = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  }));
  return nested.flat();
}

function toPosix(path) {
  return path.split(sep).join('/');
}

const files = await walk(buildRoot);
const documents = files.filter((file) => ['.html', '.css', '.js'].includes(extname(file)));
const referencedAssets = new Set();

for (const document of documents) {
  const contents = await readFile(document, 'utf8');
  for (const match of contents.matchAll(/\/_astro\/[^"'()\s,?]+/g)) {
    referencedAssets.add(decodeURIComponent(match[0]));
  }
}

const candidates = files.filter((file) => {
  const outputPath = toPosix(relative(buildRoot, file));
  return outputPath.startsWith('_astro/') && originalFormats.has(extname(file).toLowerCase());
});

let removedBytes = 0;
let removedFiles = 0;
for (const file of candidates) {
  const outputUrl = `/${toPosix(relative(buildRoot, file))}`;
  if (referencedAssets.has(outputUrl)) continue;
  removedBytes += (await stat(file)).size;
  await rm(file);
  removedFiles += 1;
}

console.log(`Eliminadas ${removedFiles} copias originales sin referencias (${(removedBytes / 1024 / 1024).toFixed(2)} MiB).`);
