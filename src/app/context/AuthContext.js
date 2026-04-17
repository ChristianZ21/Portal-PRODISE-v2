'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const s = sessionStorage.getItem('prodise_user')
      if (s) setUser(JSON.parse(s))
    } catch {}
    setLoading(false)
  }, [])

  async function login(username, password) {
    const uUp = username.trim().toUpperCase()

    try {
      // Busca el usuario comparando la contraseña tal cual está guardada
      const { data: usr, error } = await supabase
        .from('usuarios_sistema')
        .select('username, password_hash, nivel_acceso, dni_asociado, estado')
        .eq('username', uUp)
        .eq('estado', 'ACTIVO')
        .single()

      if (error || !usr) {
        return { success: false, error: 'Usuario no encontrado' }
      }

      // Comparación directa — sin hash, sin encriptación
      if (usr.password_hash !== password) {
        return { success: false, error: 'Contraseña incorrecta' }
      }

      // Obtener nombre del trabajador vinculado
      let nombre = uUp
      if (usr.dni_asociado) {
        const { data: trab } = await supabase
          .from('trabajadores')
          .select('nombres_completos')
          .eq('dni', usr.dni_asociado)
          .single()
        if (trab?.nombres_completos) nombre = trab.nombres_completos
      }

      const userData = {
        username: usr.username,
        nombre,
        nivel: usr.nivel_acceso,
        dni:   usr.dni_asociado,
      }

      // Actualizar último login
      supabase.from('usuarios_sistema')
        .update({ ultimo_login: new Date().toISOString(), intentos_fallidos: 0 })
        .eq('username', uUp)
        .then(() => {})

      sessionStorage.setItem('prodise_user', JSON.stringify(userData))
      setUser(userData)
      return { success: true }

    } catch (err) {
      console.error('Login error:', err)
      return { success: false, error: 'Error de conexión' }
    }
  }

  function logout() {
    sessionStorage.removeItem('prodise_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
