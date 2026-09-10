import { getImage } from 'astro:assets';
import { legacyImageImports } from '../data/legacy-image-map';
import { normalizeLegacyImageMarkup } from '../data/legacy-asset-aliases';

type ImageMetadata = { src: string; width: number; height: number };
type ResolvedImage = { src: string; link: string; srcset?: string };

const localAssets = legacyImageImports as Record<string, ImageMetadata | string>;

function responsiveWidths(width: number) {
  return [...new Set([480, 768, 1280].filter((candidate) => candidate < width).concat(width))];
}

async function resolveImages(content: string) {
  const legacyUrls = [...new Set(content.match(/\/assets\/legacy\/[^"'()\s?]+/g) ?? [])];
  const resolved = new Map<string, ResolvedImage>();

  await Promise.all(legacyUrls.map(async (legacyUrl) => {
    const source = localAssets[legacyUrl];
    if (!source) return;

    if (typeof source !== 'string') {
      const optimized = await getImage({
        src: source,
        widths: responsiveWidths(source.width),
        sizes: '(max-width: 760px) calc(100vw - 48px), 650px',
        format: 'webp',
        quality: 'high',
      });
      resolved.set(legacyUrl, {
        src: optimized.src,
        link: optimized.srcSet.values.at(-1)?.url ?? optimized.src,
        srcset: optimized.srcSet.attribute,
      });
      return;
    }

    if (typeof source === 'string') resolved.set(legacyUrl, { src: source, link: source });
  }));

  return resolved;
}

function addResponsiveSources(content: string, resolved: Map<string, ResolvedImage>) {
  const withOptimizedImages = content.replace(/<img\b[^>]*>/gi, (tag) => {
    const source = tag.match(/\ssrc=("|')(\/assets\/legacy\/[^"']+)\1/i)?.[2];
    if (!source) return tag;
    const image = resolved.get(source);
    if (!image) return tag;

    const updated = tag.replace(source, image.src);
    return image.srcset
      ? updated.replace('<img', `<img srcset="${image.srcset}" sizes="(max-width: 760px) calc(100vw - 48px), 650px"`)
      : updated;
  });

  return [...resolved.entries()].reduce(
    (html, [legacyUrl, image]) => html.replaceAll(legacyUrl, image.link),
    withOptimizedImages,
  );
}

export async function renderLegacyHtml(content: string) {
  const normalized = normalizeLegacyImageMarkup(content)
    .replace(/\s+data-full-url=("[^"]*"|'[^']*')/gi, '')
    .replace(/\s+data-link=("[^"]*"|'[^']*')/gi, '')
    .replace(/\s+data-id=("[^"]*"|'[^']*')/gi, '');
  return addResponsiveSources(normalized, await resolveImages(normalized));
}
