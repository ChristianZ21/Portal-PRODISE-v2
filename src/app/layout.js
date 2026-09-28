import './globals.css'
import { AuthProvider } from '../context/AuthContext'
import { MARCA } from '@/config/marca'

export const metadata = {
  title: `${MARCA.nombre} — ${MARCA.producto}`,
  description: MARCA.descripcion,
  appleWebApp: { capable: true, title: MARCA.nombre, statusBarStyle: 'black' },
}

export const viewport = {
  viewportFit: 'cover',
  // El portal usa siempre el tema oscuro
  themeColor: '#111113',
  colorScheme: 'dark',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <a href="#contenido" className="skip-link">Saltar al contenido</a>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
