/**
 * Archivos que WordPress publicó con varios nombres aunque sus bytes son idénticos.
 * Todas las referencias se resuelven a la copia canónica para conservar el aspecto
 * sin almacenar más de un archivo por imagen.
 */
const legacyAssetAliases = {
  '/assets/legacy/2009/12/Gimnasio-chang-07301.jpg': '/assets/legacy/2009/12/Gimnasio-chang-0730.jpg',
  '/assets/legacy/2009/12/Gimnasio-chang-07302.jpg': '/assets/legacy/2009/12/Gimnasio-chang-0730.jpg',
  '/assets/legacy/2009/12/Gimnasio-chang-07301-150x150.jpg': '/assets/legacy/2009/12/Gimnasio-chang-0730-150x150.jpg',
  '/assets/legacy/2009/12/Gimnasio-chang-07302-150x150.jpg': '/assets/legacy/2009/12/Gimnasio-chang-0730-150x150.jpg',
  '/assets/legacy/2009/12/Gimnasio-Chang-Infantil1.jpg': '/assets/legacy/2009/12/Gimnasio-Chang-Infantil.jpg',
  '/assets/legacy/2009/12/Gimnasio-Chang-Infantil1-150x150.jpg': '/assets/legacy/2009/12/Gimnasio-Chang-Infantil-150x150.jpg',
  '/assets/legacy/2009/12/Gimnasio-chang-08301.jpg': '/assets/legacy/2009/12/Gimnasio-chang-0830.jpg',
  '/assets/legacy/2009/12/Gimnasio-chang-08301-150x150.jpg': '/assets/legacy/2009/12/Gimnasio-chang-0830-150x150.jpg',
} as const;

export function canonicalizeLegacyAssetUrls(content: string) {
  return Object.entries(legacyAssetAliases).reduce(
    (normalized, [alias, canonical]) => normalized.replaceAll(alias, canonical),
    content,
  );
}

/** Conserva la imagen elegida por la página original y descarta variantes srcset de WordPress. */
export function normalizeLegacyImageMarkup(content: string) {
  return canonicalizeLegacyAssetUrls(content)
    .replace(/\s+srcset=("[^"]*"|'[^']*')/gi, '')
    .replace(/\s+sizes=("[^"]*"|'[^']*')/gi, '');
}
