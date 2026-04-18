import './globals.css'
import { AuthProvider } from '../context/AuthContext'

export const metadata = { title: 'PRODISE — Portal de Gestión', description: 'Plataforma de Evaluación de Personal' }

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  )
}
