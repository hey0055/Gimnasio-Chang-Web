# Astro Starter Kit: Minimal

## Importación del blog de WordPress

`node scripts/import-wordpress.mjs --dry-run` muestra las entradas que se importarán sin modificar archivos ni descargar imágenes.

`node scripts/import-wordpress.mjs` importa el XML de `import/`, actualiza las entradas por ID/URL de WordPress y guarda las imágenes en `src/assets/posts`. Se puede seleccionar otro export con `--file ruta.xml`. El cuerpo conserva el HTML original, incluyendo galerías; los vídeos antiguos de Flash se convierten a iframes de YouTube.

Las imágenes existentes se reutilizan mediante un manifiesto. Si una imagen no se puede recuperar, el artículo muestra «Imagen original no disponible», el detalle queda en `import/wordpress-report.json` y el comando devuelve código 1. Una nueva ejecución vuelve a intentar esas imágenes. No se considera completa la recuperación de imágenes mientras el informe contenga errores.

El blog usa diez artículos por página, ordenados por fecha descendente. Conserva las URLs históricas y genera archivos de categorías, etiquetas y meses. Después de importar: `npm run build` y `node scripts/verify-wordpress.mjs`.

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
