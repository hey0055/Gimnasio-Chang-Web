import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, relative, resolve, sep } from 'node:path';

const projectRoot = process.cwd();
const sourceRoot = resolve(projectRoot, 'public/assets/legacy');
const buildRoot = resolve(projectRoot, 'dist');
const assetsRoot = resolve(projectRoot, 'src/assets');
const imageMapOutput = resolve(projectRoot, 'src/data/legacy-image-map.ts');
const staticPages = new Map([
  ['index.php/about/index.html', 'club'],
  ['index.php/maestros/index.html', 'maestros'],
  ['index.php/taekwondo/index.html', 'taekwondo'],
  ['index.php/patrocinadores/index.html', 'alumnos'],
]);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  }));
  return nested.flat();
}

function toPosix(path) {
  return path.split(sep).join('/');
}

function assetReferences(html) {
  return [...html.matchAll(/\/assets\/legacy\/[^"'()\s?]+/g)].map((match) => match[0]);
}

function destinationFolder(relativePath, routes) {
  const routeList = [...routes];
  if (relativePath === '2015/07/bandalogo2.jpg' || routeList.length > 30) return 'site/chrome';

  const staticPage = routeList.map((route) => staticPages.get(route)).find(Boolean);
  if (staticPage) return `site/pages/${staticPage}`;

  if (routeList.some((route) => route === 'index.php/zona-club/index.html')) return 'site/gallery';

  const date = relativePath.match(/^(\d{4})\/(\d{2})\//);
  return date ? `posts/${date[1]}/${date[2]}` : 'posts/sin-fecha';
}

await mkdir(sourceRoot, { recursive: true });
const buildFiles = (await walk(buildRoot)).filter((file) => extname(file) === '.html');
const routeUsage = new Map();
for (const file of buildFiles) {
  const route = toPosix(relative(buildRoot, file));
  const html = await readFile(file, 'utf8');
  for (const assetUrl of assetReferences(html)) {
    const current = routeUsage.get(assetUrl) ?? new Set();
    current.add(route);
    routeUsage.set(assetUrl, current);
  }
}

const existingMapSource = await readFile(imageMapOutput, 'utf8');
const pathsMarker = 'export const legacyImagePaths = ';
const mapStart = existingMapSource.indexOf(pathsMarker);
const mapJson = mapStart >= 0
  ? existingMapSource.slice(mapStart + pathsMarker.length, existingMapSource.indexOf(' as const;', mapStart) + 1)
  : existingMapSource.slice(existingMapSource.indexOf('{'), existingMapSource.lastIndexOf('} as const') + 1);
const imageMap = JSON.parse(mapJson);
const files = (await walk(sourceRoot)).filter((file) => extname(file) && !file.endsWith('manifest.json'));
for (const file of files) {
  const relativePath = toPosix(relative(sourceRoot, file));
  const legacyUrl = `/assets/legacy/${relativePath}`;
  const routes = routeUsage.get(legacyUrl);
  if (!routes) continue;

  const destination = destinationFolder(relativePath, routes);
  const flatDestination = destination.startsWith('posts/')
    ? 'posts'
    : ['site/chrome', 'site/gallery', 'site/pages/alumnos', 'site/pages/club', 'site/pages/maestros', 'site/pages/taekwondo'].includes(destination)
      ? destination
      : undefined;
  const target = flatDestination
    ? resolve(assetsRoot, flatDestination, relativePath.split('/').at(-1))
    : resolve(assetsRoot, destination, 'legacy', relativePath);
  await mkdir(dirname(target), { recursive: true });
  await rename(file, target);
  imageMap[legacyUrl] = `../${toPosix(relative(resolve(projectRoot, 'src'), target))}`;
}

await rm(resolve(sourceRoot, 'manifest.json'), { force: true });
const sortedMap = Object.fromEntries(Object.entries(imageMap).sort(([a], [b]) => a.localeCompare(b)));
const imports = Object.entries(sortedMap)
  .map(([, assetPath], index) => `import image${index} from '${assetPath}';`)
  .join('\n');
const references = Object.keys(sortedMap)
  .map((legacyUrl, index) => `  ${JSON.stringify(legacyUrl)}: image${index},`)
  .join('\n');
const mapSource = `// Archivo generado por scripts/organize-legacy-assets.mjs.\n// Relaciona rutas heredadas de WordPress con recursos locales de Astro.\n\nexport const legacyImagePaths = ${JSON.stringify(sortedMap, null, 2)} as const;\n\n${imports}\n\nexport const legacyImageImports = {\n${references}\n} as const;\n`;
await mkdir(dirname(imageMapOutput), { recursive: true });
await writeFile(imageMapOutput, mapSource, 'utf8');

console.log(`Organizadas ${Object.keys(imageMap).length} imágenes en src/assets.`);
