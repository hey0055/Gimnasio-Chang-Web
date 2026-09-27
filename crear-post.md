# Cómo crear un post del blog de Gimnasio Chang

## 1. Preparar el archivo y las imágenes

1. Elige un nombre corto, en minúsculas, sin espacios ni tildes, con palabras separadas por guiones. Ejemplo: `inicio-de-temporada-2026`.
2. Crea el archivo `src/content/posts/inicio-de-temporada-2026.md` y guárdalo con codificación UTF-8.
3. Guarda las nuevas imágenes **directamente en `src/assets/posts/`**, sin subcarpetas. Por ejemplo: `inicio-de-temporada-2026.jpg`.
4. Usa nombres únicos y reutiliza imágenes existentes cuando corresponda. No sobrescribas archivos de otros artículos.

## 2. Copiar esta plantilla

Sustituye los textos, la fecha, los nombres de archivo y la URL por los del nuevo artículo. La imagen del ejemplo debe existir antes de publicar.

```md
---
title: "Inicio de temporada 2026"
description: "Horarios y novedades para el inicio de temporada en el Gimnasio Chang."
publishedAt: "2026-09-27T10:00:00+02:00"
categories: ["club", "noticias"]
tags: ["taekwondo"]
categorySlugs: ["club", "noticias"]
tagSlugs: ["taekwondo"]
cover: "/assets/posts/inicio-de-temporada-2026.jpg"
legacyPath: "/index.php/2026/09/27/inicio-de-temporada-2026/"
bodyFormat: "html"
---

<p>Comenzamos una nueva temporada en el <strong>Gimnasio Chang</strong>.</p>

<figure class="wp-block-image">
  <img src="/assets/posts/inicio-de-temporada-2026.jpg" alt="Alumnos del Gimnasio Chang durante un entrenamiento de taekwondo" />
  <figcaption>Entrenamiento de inicio de temporada.</figcaption>
</figure>

<h2>Horarios de entrenamiento</h2>

<p>Escribe aquí la información del artículo.</p>

<ul>
  <li>Primer punto.</li>
  <li>Segundo punto.</li>
</ul>

<p><a href="/index.php/about/">Información y contacto del gimnasio</a>.</p>
```

## 3. Rellenar los campos

| Campo | Qué escribir |
| --- | --- |
| `title` | Título visible. La web ya lo muestra; no lo repitas con un `<h1>` en el cuerpo. |
| `description` | Resumen breve para la descripción de la página. |
| `publishedAt` | Fecha y hora de publicación en formato ISO, con zona horaria. En Madrid, usa `+02:00` durante el horario de verano y `+01:00` durante el de invierno. |
| `categories` | Nombres visibles de las categorías. Reutiliza los existentes cuando sea posible. |
| `categorySlugs` | Identificadores de esas categorías, en el mismo orden. Ejemplo: `"Corea"` corresponde a `"corea"`; `"exámenes"`, a `"examenes"`. |
| `tags` | Nombres visibles de las etiquetas. Si no hay, escribe `[]`. |
| `tagSlugs` | Identificadores de las etiquetas, en el mismo orden. Si no hay, escribe `[]`. |
| `cover` | Ruta de la imagen principal. Si el artículo no tiene imagen, escribe `""`. Este campo no inserta la imagen automáticamente: añádela también en el cuerpo. |
| `legacyPath` | URL única del artículo, con el formato `/index.php/AAAA/MM/DD/nombre-del-post/`. Usa la misma fecha local que en `publishedAt` y termina la ruta con `/`. |
| `bodyFormat` | Para esta plantilla, usa `"html"`. |

No añadas `wordpressId` a un artículo nuevo: ese campo identifica las entradas importadas de WordPress.

Mantén cada campo en una sola línea. Usa comillas dobles para los textos y listas como `["club", "noticias"]`. Si un texto incluye comillas dobles, escápalas como `\"`.

## 4. Escribir el contenido

**Actualmente el blog utiliza archivos `.md` cuyo cuerpo se muestra como HTML.** Sigue el formato de la plantilla: `<p>` para párrafos, `<h2>` para subtítulos, `<strong>` para negrita, `<a>` para enlaces y `<ul><li>` para listas. La sintaxis Markdown como `## Subtítulo` o `![imagen](ruta)` no se convierte en esta vista del blog.

Para las imágenes, utiliza rutas como `/assets/posts/nombre-de-imagen.jpg`, con barras `/`. Escribe un texto `alt` que describa lo que se ve. Puedes repetir el bloque `<figure>` para añadir más fotos y omitir `<figcaption>` cuando no necesites un pie de foto.

Para un vídeo de YouTube, sustituye `ID_DEL_VIDEO` por su identificador:

```html
<iframe src="https://www.youtube.com/embed/ID_DEL_VIDEO" title="Descripción del vídeo" loading="lazy" allowfullscreen></iframe>
```

## 5. Revisar y publicar

1. Comprueba que el nombre del archivo y `legacyPath` no coincidan con los de otro artículo.
2. Revisa que los nombres y los slugs de categorías y etiquetas tengan la misma cantidad de elementos y el mismo orden.
3. Abre la vista previa del proyecto. Si necesitas iniciarla, ejecuta `npm run dev -- --background`.
4. Revisa la portada, la URL del artículo, las fotos y el aspecto en móvil.
5. Ejecuta `npm run build`. La compilación debe terminar correctamente y actualizará el sitemap.
6. Publica la nueva compilación mediante el procedimiento de despliegue habitual.

El artículo aparecerá **primero si `publishedAt` es la fecha más reciente**. El blog actualiza automáticamente la paginación de diez entradas, los posts recientes y los archivos de categorías, etiquetas y meses.

Guardar un archivo en `src/content/posts/` lo incluye en la web que se genere. No hay una opción de borrador ni publicación programada: prepara los borradores fuera de esa carpeta y no uses una fecha futura para programar su publicación.
