export const navigation = [
  { label: 'HOME', href: '/' },
  { label: 'EL CLUB', href: '/index.php/about/' },
  { label: 'MAESTROS', href: '/index.php/maestros/' },
  { label: 'TAEKWONDO', href: '/index.php/taekwondo/' },
  { label: 'ALUMNOS', href: '/index.php/patrocinadores/' },
  { label: 'GALERIA', href: '/index.php/zona-club/' },
  { label: 'ACADEMIA', href: '/index.php/category/academia/' },
];

export const categories = ['02 Corea', 'academia', 'alumnos', 'avisos', 'campeonatos', 'club', 'combate', 'Coreano', 'crónica', 'Cultura', 'curiosidades', 'entrenamiento', 'exámenes', 'festivos', 'fotografías', 'fotos', 'historia', 'información', 'noticias', 'opinión', 'premios', 'salud', 'técnica', 'Uncategorized', 'videos'];

export const clubLinks = [
  ['Azarri Barakaldo', 'https://www.facebook.com/Azarri-Barakaldo-197010300721261/'],
  ['Chong Do Lee', 'https://www.chongdolee.com/'],
  ['Club Deportivo PIAAM Paiporta', 'https://www.facebook.com/Club-Deportivo-PIAAM-Paiporta-Taekwondo-Paiporta-1527337254154788/'],
  ['Deportivo Cano', 'https://www.deportivocanotorrefiel.es/'],
  ['El Templo Taekwondo Almela', 'https://www.facebook.com/clubtaekwondoeltemplo/'],
  ['Taekwondo Kyoto', 'https://taekwondokyoto.blogspot.com.es/'],
  ['Taekwondo La Safor', 'https://taekwondolasafor.blogspot.com.es/'],
];

export const taekwondoLinks = [
  ['European Taekwondo Union', 'https://www.taekwondoetu.org/'], ['Federación Española de Taekwondo', 'https://www.fetaekwondo.net/'], ['Federación Valenciana de Taekwondo', 'https://www.cvtaekwondo.es/'], ['Kukkiwon', 'https://www.kukkiwon.or.kr/'], ['Mastaekwondo', 'https://mastkd.com/'], ['World Federation', 'https://worldtaekwondo.org/'],
];

export const archiveMonths = ['Mayo 2026', 'Abril 2026', 'Marzo 2026', 'Diciembre 2025', 'Febrero 2025', 'Enero 2025', 'Diciembre 2023'];

export function toSlug(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }
