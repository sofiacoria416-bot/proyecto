import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// ============================================================
// 🔧 OVERRIDE DE DESARROLLO
// Cambiá este valor para forzar una fase sin depender de Supabase ni de la fecha.
//   null      → comportamiento normal (lee token de URL, consulta Supabase)
//   'waiting' → pantalla de espera
//   'phase1'  → consultorio / Fase 1 Anamnesis
//   'phase2'  → consultorio / Fase 2 Diagnóstico
//
// ⚠️  ACORDATE DE DEJARLO EN null ANTES DE HACER DEPLOY
// ============================================================
const DEV_PHASE_OVERRIDE = null

/**
 * useSession — Hook principal de autenticación por token
 *
 * Lee el token de la URL (?token=...), valida contra Supabase,
 * y calcula en qué fase de la experiencia estamos según la fecha actual.
 *
 * @returns {{ session: object|null, phase: string|null, loading: boolean, error: string|null }}
 */
export function useSession() {
  const [searchParams] = useSearchParams()
  const [session, setSession] = useState(null)
  const [phase, setPhase] = useState(null)
  const [phase1Completed, setPhase1Completed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // --- Override de desarrollo ---
    if (DEV_PHASE_OVERRIDE) {
      setSession({ id: 'dev-mock', token: 'dev' })
      setPhase(DEV_PHASE_OVERRIDE)
      setLoading(false)
      return
    }

    const token = searchParams.get('token')

    if (!token) {
      setError('no_token')
      setLoading(false)
      return
    }

    async function initSession() {
      try {
        // Llamar a la función RPC de Supabase que busca la sesión por token
        const { data, error: rpcError } = await supabase.rpc(
          'get_or_create_session',
          { p_token: token }
        )

        if (rpcError) {
          console.error('Error en get_or_create_session:', rpcError)
          setError('invalid_token')
          setLoading(false)
          return
        }

        // La función retorna NULL si el token no existe
        if (!data || (Array.isArray(data) && data.length === 0)) {
          setError('invalid_token')
          setLoading(false)
          return
        }

        // Si retorna un array, tomar el primer elemento; si es objeto, usarlo directo
        const sessionData = Array.isArray(data) ? data[0] : data

        setSession(sessionData)

        // Calcular la fase actual comparando la fecha de hoy con las fechas de desbloqueo
        const currentPhase = calculatePhase(
          sessionData.phase_1_unlock_date,
          sessionData.phase_2_unlock_date
        )
        setPhase(currentPhase)

        // Marcar si la Fase 1 ya fue completada (columna phase_1_completed en sessions)
        if (sessionData.phase_1_completed) {
          setPhase1Completed(true)
        }
      } catch (err) {
        console.error('Error inesperado al iniciar sesión:', err)
        setError('invalid_token')
      } finally {
        setLoading(false)
      }
    }

    initSession()
  }, [searchParams])

  return { session, phase, phase1Completed, setPhase1Completed, loading, error }
}

/**
 * Calcula la fase actual de la experiencia.
 *
 * @param {string} phase1Timestamp - Timestamp de desbloqueo de Fase 1 (ISO 8601 con timezone, ej: '2026-04-15T15:00:00-03:00')
 * @param {string} phase2Timestamp - Timestamp de desbloqueo de Fase 2 (ISO 8601 con timezone, ej: '2026-04-16T00:00:00-03:00')
 * @returns {'waiting' | 'phase1' | 'phase2'}
 */
function calculatePhase(phase1Timestamp, phase2Timestamp) {
  const now = new Date()
  const phase1Opens = new Date(phase1Timestamp)
  const phase2Opens = new Date(phase2Timestamp)

  if (now >= phase2Opens) {
    return 'phase2'
  }

  if (now >= phase1Opens) {
    return 'phase1'
  }

  return 'waiting'
}
