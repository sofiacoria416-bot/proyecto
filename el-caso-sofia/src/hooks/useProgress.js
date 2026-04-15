import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * useProgress — Carga el progreso completo de la sesión desde Supabase
 *
 * Llama al RPC get_complete_progress con el session_id y expone
 * todo el estado de la experiencia en un solo objeto.
 *
 * @param {string|null} sessionId - UUID de la sesión activa
 * @returns {{ progress: object|null, loading: boolean, error: string|null, refetch: () => void }}
 */
export function useProgress(sessionId) {
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProgress = useCallback(async () => {
    if (!sessionId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: rpcError } = await supabase.rpc(
        'get_complete_progress',
        { p_session_id: sessionId }
      )

      if (rpcError) {
        console.error('Error en get_complete_progress:', rpcError)
        setError('progress_load_failed')
        setLoading(false)
        return
      }

      setProgress(data)
    } catch (err) {
      console.error('Error inesperado al cargar progreso:', err)
      setError('progress_load_failed')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  // Cargar al montar y cuando cambie el sessionId
  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  return { progress, loading, error, refetch: fetchProgress }
}
