import { MARCA } from '@/config/marca'

// Permite "Añadir a pantalla de inicio" y abrir el portal como una app.
export default function manifest() {
  return {
    name: `${MARCA.nombre} — ${MARCA.producto}`,
    short_name: MARCA.nombre,
    description: MARCA.descripcion,
    start_url: '/',
    display: 'standalone',
    background_color: '#111113',
    theme_color: '#111113',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
