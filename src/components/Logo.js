import { MARCA } from '@/config/marca'

// El PNG tiene fondo transparente y letras negras: en modo oscuro se invierte
// la luminosidad (clase .logo-marca en globals.css) en lugar de ponerle una placa.
export default function Logo({ height = 32, style, className = '' }) {
  return (
    <img
      src={MARCA.logo}
      alt={MARCA.nombre}
      width={Math.round((MARCA.logoAncho / MARCA.logoAlto) * height)}
      height={height}
      className={`logo-marca ${className}`}
      style={{ height, width: 'auto', objectFit: 'contain', display: 'block', ...style }}
    />
  )
}
