import './globals.css'
import { AuthProvider } from '../context/AuthContext'
import { MARCA } from '@/config/marca'

export const metadata = { title: `${MARCA.nombre} — ${MARCA.producto}`, description: MARCA.descripcion }

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f5f7' },
    { media: '(prefers-color-scheme: dark)', color: '#111113' },
  ],
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
