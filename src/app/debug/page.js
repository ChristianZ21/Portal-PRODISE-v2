'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

// MD5 simple para probar el hash
function md5(input) {
  function safeAdd(x,y){const l=(x&0xFFFF)+(y&0xFFFF);return((x>>16)+(y>>16)+(l>>16)<<16)|(l&0xFFFF)}
  function rol(n,c){return(n<<c)|(n>>>(32-c))}
  function cmn(q,a,b,x,s,t){return safeAdd(rol(safeAdd(safeAdd(a,q),safeAdd(x,t)),s),b)}
  function ff(a,b,c,d,x,s,t){return cmn((b&c)|((~b)&d),a,b,x,s,t)}
  function gg(a,b,c,d,x,s,t){return cmn((b&d)|(c&(~d)),a,b,x,s,t)}
  function hh(a,b,c,d,x,s,t){return cmn(b^c^d,a,b,x,s,t)}
  function ii(a,b,c,d,x,s,t){return cmn(c^(b|(~d)),a,b,x,s,t)}
  const s8=unescape(encodeURIComponent(input));const x=[]
  for(let i=0;i<s8.length;i+=4)x[i>>2]=s8.charCodeAt(i)+(s8.charCodeAt(i+1)<<8)+(s8.charCodeAt(i+2)<<16)+(s8.charCodeAt(i+3)<<24)
  const l=s8.length;x[l>>2]|=0x80<<((l%4)*8);x[(((l+64)>>>9)<<4)+14]=l*8
  let [a,b,c,d]=[0x67452301,0xEFCDAB89,0x98BADCFE,0x10325476]
  for(let i=0;i<x.length;i+=16){
    const[A,B,C,D]=[a,b,c,d]
    a=ff(a,b,c,d,x[i],7,-680876936);d=ff(d,a,b,c,x[i+1],12,-389564586);c=ff(c,d,a,b,x[i+2],17,606105819);b=ff(b,c,d,a,x[i+3],22,-1044525330)
    a=ff(a,b,c,d,x[i+4],7,-176418897);d=ff(d,a,b,c,x[i+5],12,1200080426);c=ff(c,d,a,b,x[i+6],17,-1473231341);b=ff(b,c,d,a,x[i+7],22,-45705983)
    a=ff(a,b,c,d,x[i+8],7,1770035416);d=ff(d,a,b,c,x[i+9],12,-1958414417);c=ff(c,d,a,b,x[i+10],17,-42063);b=ff(b,c,d,a,x[i+11],22,-1990404162)
    a=ff(a,b,c,d,x[i+12],7,1804603682);d=ff(d,a,b,c,x[i+13],12,-40341101);c=ff(c,d,a,b,x[i+14],17,-1502002290);b=ff(b,c,d,a,x[i+15],22,1236535329)
    a=gg(a,b,c,d,x[i+1],5,-165796510);d=gg(d,a,b,c,x[i+6],9,-1069501632);c=gg(c,d,a,b,x[i+11],14,643717713);b=gg(b,c,d,a,x[i],20,-373897302)
    a=gg(a,b,c,d,x[i+5],5,-701558691);d=gg(d,a,b,c,x[i+10],9,38016083);c=gg(c,d,a,b,x[i+15],14,-660478335);b=gg(b,c,d,a,x[i+4],20,-405537848)
    a=gg(a,b,c,d,x[i+9],5,568446438);d=gg(d,a,b,c,x[i+14],9,-1019803690);c=gg(c,d,a,b,x[i+3],14,-187363961);b=gg(b,c,d,a,x[i+8],20,1163531501)
    a=gg(a,b,c,d,x[i+13],5,-1444681467);d=gg(d,a,b,c,x[i+2],9,-51403784);c=gg(c,d,a,b,x[i+7],14,1735328473);b=gg(b,c,d,a,x[i+12],20,-1926607734)
    a=hh(a,b,c,d,x[i+5],4,-378558);d=hh(d,a,b,c,x[i+8],11,-2022574463);c=hh(c,d,a,b,x[i+11],16,1839030562);b=hh(b,c,d,a,x[i+14],23,-35309556)
    a=hh(a,b,c,d,x[i+1],4,-1530992060);d=hh(d,a,b,c,x[i+4],11,1272893353);c=hh(c,d,a,b,x[i+7],16,-155497632);b=hh(b,c,d,a,x[i+10],23,-1094730640)
    a=hh(a,b,c,d,x[i+13],4,681279174);d=hh(d,a,b,c,x[i],11,-358537222);c=hh(c,d,a,b,x[i+3],16,-722521979);b=hh(b,c,d,a,x[i+6],23,76029189)
    a=hh(a,b,c,d,x[i+9],4,-640364487);d=hh(d,a,b,c,x[i+12],11,-421815835);c=hh(c,d,a,b,x[i+15],16,530742520);b=hh(b,c,d,a,x[i+2],23,-995338651)
    a=ii(a,b,c,d,x[i],6,-198630844);d=ii(d,a,b,c,x[i+7],10,1126891415);c=ii(c,d,a,b,x[i+14],15,-1416354905);b=ii(b,c,d,a,x[i+5],21,-57434055)
    a=ii(a,b,c,d,x[i+12],6,1700485571);d=ii(d,a,b,c,x[i+3],10,-1894986606);c=ii(c,d,a,b,x[i+10],15,-1051523);b=ii(b,c,d,a,x[i+1],21,-2054922799)
    a=ii(a,b,c,d,x[i+8],6,1873313359);d=ii(d,a,b,c,x[i+15],10,-30611744);c=ii(c,d,a,b,x[i+6],15,-1560198380);b=ii(b,c,d,a,x[i+13],21,1309151649)
    a=ii(a,b,c,d,x[i+4],6,-145523070);d=ii(d,a,b,c,x[i+11],10,-1120210379);c=ii(c,d,a,b,x[i+2],15,718787259);b=ii(b,c,d,a,x[i+9],21,-343485551)
    a=safeAdd(a,A);b=safeAdd(b,B);c=safeAdd(c,C);d=safeAdd(d,D)
  }
  return[a,b,c,d].map(n=>('00000000'+((n<0?n+0x100000000:n)).toString(16)).slice(-8).match(/../g).reverse().join('')).join('')
}

export default function DebugPage() {
  const [results, setResults] = useState([])
  const [running, setRunning] = useState(false)

  function log(msg, ok, detail = '') {
    setResults(prev => [...prev, { msg, ok, detail, time: new Date().toLocaleTimeString() }])
  }

  async function runTests() {
    setResults([])
    setRunning(true)

    // Test 1: Conexión básica a Supabase
    try {
      const { data, error } = await supabase.from('config_sistema').select('clave').limit(1)
      if (error) log('Conexión Supabase', false, error.message)
      else log('Conexión Supabase', true, 'OK')
    } catch (e) {
      log('Conexión Supabase', false, e.message)
    }

    // Test 2: Leer tabla usuarios_sistema
    try {
      const { data, error } = await supabase
        .from('usuarios_sistema')
        .select('username, password_hash, estado')
        .limit(5)
      if (error) log('Leer usuarios_sistema', false, error.message)
      else {
        log('Leer usuarios_sistema', true, `${data.length} usuarios encontrados`)
        data.forEach(u => {
          log(`  Usuario: ${u.username}`, u.estado === 'ACTIVO',
            `hash: ${u.password_hash?.substring(0,16)}... | estado: ${u.estado}`)
        })
      }
    } catch (e) {
      log('Leer usuarios_sistema', false, e.message)
    }

    // Test 3: Verificar hash MD5
    const testPwd = 'prodise2025'
    const hash = md5(testPwd)
    const expectedHash = '7b47dc59c9fd79c00192a615ada934c7'
    log(
      `MD5("${testPwd}")`,
      hash === expectedHash,
      `Calculado: ${hash}\nEsperado:  ${expectedHash}`
    )

    // Test 4: Login real de JPCONDORI
    try {
      const { data, error } = await supabase
        .from('usuarios_sistema')
        .select('username, password_hash, nivel_acceso, estado')
        .eq('username', 'JPCONDORI')
        .single()

      if (error) {
        log('Buscar JPCONDORI', false, error.message)
      } else {
        log('Buscar JPCONDORI', true, `Encontrado | hash BD: ${data.password_hash}`)
        const hashCalc = md5('prodise2025')
        const match = data.password_hash === hashCalc
        log('Hash JPCONDORI coincide con "prodise2025"', match,
          match ? '✓ Login debería funcionar' : `BD tiene: ${data.password_hash} | Calculado: ${hashCalc}`)
      }
    } catch (e) {
      log('Buscar JPCONDORI', false, e.message)
    }

    // Test 5: Leer servicios
    try {
      const { data, error } = await supabase.from('servicios').select('id_servicio, nombre_descriptivo, estado')
      if (error) log('Leer servicios', false, error.message)
      else {
        data.forEach(s => log(`Servicio: ${s.nombre_descriptivo}`, s.estado === 'ACTIVO', `estado: ${s.estado}`))
      }
    } catch (e) {
      log('Leer servicios', false, e.message)
    }

    setRunning(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#060608', color: '#E8E8E8', fontFamily: 'monospace', padding: 30 }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: '#E67E22' }}>PRODISE — Diagnóstico</h1>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 24 }}>Página temporal de prueba — eliminar después</p>

      <button
        onClick={runTests}
        disabled={running}
        style={{ padding: '10px 24px', background: '#E67E22', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 700, cursor: running ? 'not-allowed' : 'pointer', marginBottom: 24, opacity: running ? 0.6 : 1 }}>
        {running ? 'Ejecutando pruebas...' : '▶ Ejecutar diagnóstico'}
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {results.map((r, i) => (
          <div key={i} style={{
            padding: '8px 14px', borderRadius: 7, fontSize: 12,
            background: r.ok ? 'rgba(39,174,96,0.08)' : 'rgba(192,57,43,0.08)',
            border: `1px solid ${r.ok ? 'rgba(39,174,96,0.2)' : 'rgba(192,57,43,0.2)'}`,
          }}>
            <span style={{ color: r.ok ? '#27AE60' : '#E74C3C', fontWeight: 700 }}>{r.ok ? '✓' : '✗'}</span>
            {' '}<span style={{ color: '#E8E8E8' }}>{r.msg}</span>
            {r.detail && <div style={{ color: 'rgba(255,255,255,0.4)', marginTop: 3, fontSize: 11, whiteSpace: 'pre' }}>{r.detail}</div>}
          </div>
        ))}
      </div>

      {results.length > 0 && !running && (
        <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
          Diagnóstico completo. Comparte esta pantalla para identificar el problema.
        </div>
      )}
    </div>
  )
}
