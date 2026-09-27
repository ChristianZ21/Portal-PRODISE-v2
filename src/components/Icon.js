// Iconos dibujados para el portal: una sola retícula de 24 px, trazo 1.75,
// extremos redondeados. Heredan el color del texto (currentColor).
const P = {
  // Navegación
  evaluar:   <><path d="M9 4.5H7.5A1.5 1.5 0 0 0 6 6v13.5A1.5 1.5 0 0 0 7.5 21h9a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H15" /><rect x="9" y="3" width="6" height="3" rx="1" /><path d="m9.5 13.5 2 2 3.5-4" /></>,
  historial: <><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" /><path d="M3.5 4.5v4h4" /><path d="M12 7.5V12l3 2" /></>,
  bitacora:  <><path d="M6 3.5h11A1.5 1.5 0 0 1 18.5 5v14a1.5 1.5 0 0 1-1.5 1.5H6" /><path d="M6 3.5v17" /><path d="M4 7.5h4M4 12h4M4 16.5h4" /><path d="M11 8h4.5M11 11.5h4.5" /></>,
  dashboard: <><path d="M4 20.5h16" /><rect x="5.5" y="11" width="3" height="6.5" rx="1" /><rect x="10.5" y="6" width="3" height="11.5" rx="1" /><rect x="15.5" y="13.5" width="3" height="4" rx="1" /></>,
  ranking:   <><path d="M9 20.5v-9h6v9" /><path d="M3.5 20.5v-5.5H9M15 17h5.5v3.5" /><path d="M2.5 20.5h19" /><path d="m12 3.5.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z" /></>,
  perfiles:  <><circle cx="12" cy="8.5" r="3.75" /><path d="M4.5 20.5c.8-3.8 3.8-6 7.5-6s6.7 2.2 7.5 6" /></>,
  buscador:  <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></>,
  predictor: <><circle cx="6" cy="17" r="2.5" /><circle cx="18" cy="17" r="2.5" /><circle cx="12" cy="6" r="2.5" /><path d="m7.3 14.8 3.4-6.5M16.7 14.8l-3.4-6.5M8.5 17h7" /></>,
  admin:     <><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></>,

  // Acciones
  menu:      <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  close:     <><path d="M6 6l12 12M18 6 6 18" /></>,
  back:      <><path d="M15 5.5 8.5 12l6.5 6.5" /></>,
  chevron:   <><path d="m9 5.5 6.5 6.5L9 18.5" /></>,
  down:      <><path d="m5.5 9 6.5 6.5L18.5 9" /></>,
  up:        <><path d="m5.5 15 6.5-6.5 6.5 6.5" /></>,
  check:     <><path d="m5 12.5 4.5 4.5L19 7.5" /></>,
  plus:      <><path d="M12 5v14M5 12h14" /></>,
  edit:      <><path d="M14.5 5.5l4 4L9 19H5v-4z" /><path d="m12.5 7.5 4 4" /></>,
  trash:     <><path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" /></>,
  refresh:   <><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" /><path d="M19.5 4.5v4h-4" /></>,
  download:  <><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" /><path d="M4.5 19.5h15" /></>,
  upload:    <><path d="M12 15.5V4.5M7.5 9 12 4.5 16.5 9" /><path d="M4.5 19.5h15" /></>,
  pause:     <><path d="M9 6v12M15 6v12" /></>,
  play:      <><path d="M8 5.5v13l10-6.5z" /></>,
  logout:    <><path d="M14 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H14" /><path d="M10 12h10M16.5 8.5 20 12l-3.5 3.5" /></>,
  swap:      <><path d="M4.5 8.5h14M15 5l3.5 3.5L15 12" /><path d="M19.5 15.5h-14M9 12l-3.5 3.5L9 19" /></>,
  dice:      <><rect x="4" y="4" width="16" height="16" rx="3.5" /><circle cx="9" cy="9" r=".6" fill="currentColor" /><circle cx="15" cy="15" r=".6" fill="currentColor" /><circle cx="12" cy="12" r=".6" fill="currentColor" /></>,
  eye:       <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff:    <><path d="M4 4l16 16" /><path d="M9.9 5.8A9.8 9.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.8 3.6M6.5 7.6A16.6 16.6 0 0 0 2.5 12S6 18.5 12 18.5a9.6 9.6 0 0 0 4.1-.9" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,

  // Estado y objetos
  lock:      <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
  alert:     <><path d="M12 4 2.8 19.5h18.4z" /><path d="M12 10v4" /><circle cx="12" cy="17" r=".6" fill="currentColor" /></>,
  info:      <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5" /><circle cx="12" cy="8" r=".6" fill="currentColor" /></>,
  wrench:    <><path d="M14.5 4.5a4.5 4.5 0 0 0-4 6.5l-6 6a1.8 1.8 0 0 0 2.5 2.5l6-6a4.5 4.5 0 0 0 6.5-4l-2.8 2.8-2.8-.7-.7-2.8z" /></>,
  helmet:    <><path d="M4.5 15.5a7.5 7.5 0 0 1 15 0" /><path d="M3 15.5h18a1 1 0 0 1 1 1V18H2v-1.5a1 1 0 0 1 1-1z" /><path d="M9.5 8.9V6.5M14.5 8.9V6.5" /></>,
  planta:    <><path d="M3.5 20.5V11l5 3v-3l5 3v-3l3 1.8V4.5h3v16z" /><path d="M2.5 20.5h19" /><path d="M7 17.5h1.5M11.5 17.5H13" /></>,
  folder:    <><path d="M3.5 7A1.5 1.5 0 0 1 5 5.5h4l2 2h8A1.5 1.5 0 0 1 20.5 9v9a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18z" /></>,
  file:      <><path d="M13.5 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8.5z" /><path d="M13.5 3.5v5h5" /></>,
  star:      <><path d="m12 3.8 2.5 5.1 5.6.8-4 4 .9 5.6-5-2.7-5 2.7.9-5.6-4-4 5.6-.8z" /></>,
  flame:     <><path d="M12 20.5c3.3 0 5.5-2.3 5.5-5.4 0-3.9-3.4-5.6-3.9-9.6-2.3 1.4-3.5 3.8-3.4 6-1-.6-1.6-1.6-1.8-2.7-1.4 1.4-1.9 3.3-1.9 5.2 0 3.1 2.2 5.5 5.5 6.5z" /></>,
  repeat:    <><path d="M5 11V9.5A2.5 2.5 0 0 1 7.5 7H19M16 4l3 3-3 3" /><path d="M19 13v1.5a2.5 2.5 0 0 1-2.5 2.5H5M8 20l-3-3 3-3" /></>,
  trophy:    <><path d="M8 4.5h8v5a4 4 0 0 1-8 0z" /><path d="M8 6.5H5.5a2.5 2.5 0 0 0 2.6 3.5M16 6.5h2.5a2.5 2.5 0 0 1-2.6 3.5" /><path d="M12 13.5v3M8.5 20h7M9.5 20l.5-3.5h4l.5 3.5" /></>,
  spark:     <><path d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></>,
  target:    <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r=".8" fill="currentColor" /></>,
  link:      <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  users:     <><circle cx="9" cy="8.5" r="3.25" /><path d="M3 19.5c.6-3.2 3-5 6-5s5.4 1.8 6 5" /><path d="M15.5 5.6a3.2 3.2 0 0 1 0 5.8M17.5 14.8c1.8.7 3 2.3 3.5 4.7" /></>,
  scale:     <><path d="M12 4v16M7.5 20h9M5 7.5h14" /><path d="M5 7.5 2.8 13a2.3 2.3 0 0 0 4.4 0zM19 7.5 16.8 13a2.3 2.3 0 0 0 4.4 0z" /></>,
  clock:     <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  calendar:  <><rect x="4" y="5.5" width="16" height="15" rx="2" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></>,
}

export default function Icon({ name, size = 20, strokeWidth = 1.75, title, style, className }) {
  const d = P[name]
  if (!d) return null
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}
      style={{ flexShrink: 0, ...style }} className={className}
    >
      {title && <title>{title}</title>}
      {d}
    </svg>
  )
}

// Medalla numérica para podios y rankings (sustituye 🥇🥈🥉).
export function Medalla({ pos, size = 24 }) {
  const color = pos === 1 ? 'var(--gold)' : pos === 2 ? 'var(--silver)' : pos === 3 ? 'var(--bronze)' : 'var(--text3)'
  return (
    <span
      aria-label={`Puesto ${pos}`}
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: Math.round(size * 0.46), fontWeight: 700, fontVariantNumeric: 'tabular-nums',
        color, background: `color-mix(in srgb, ${color} 14%, transparent)`,
        boxShadow: `inset 0 0 0 1.5px color-mix(in srgb, ${color} 55%, transparent)`,
      }}
    >
      {pos}
    </span>
  )
}
