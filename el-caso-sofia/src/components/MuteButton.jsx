import { useState, useEffect } from 'react'

/**
 * MuteButton — Botón global de silencio
 *
 * Posicionado en la esquina inferior derecha. Togglea el estado de mute
 * y lo persiste en localStorage bajo la key 'sfx_muted'.
 * Emite un CustomEvent 'mutechange' para que cualquier componente
 * de audio pueda reaccionar al cambio.
 */

const STORAGE_KEY = 'sfx_muted'

export function useMuteState() {
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    const handleMuteChange = (e) => {
      setMuted(e.detail.muted)
    }
    window.addEventListener('mutechange', handleMuteChange)
    return () => window.removeEventListener('mutechange', handleMuteChange)
  }, [])

  return muted
}

export default function MuteButton() {
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  const toggle = () => {
    const next = !muted
    setMuted(next)
    try {
      localStorage.setItem(STORAGE_KEY, String(next))
    } catch {
      // localStorage no disponible, no pasa nada
    }
    // Notificar a todos los componentes de audio
    window.dispatchEvent(
      new CustomEvent('mutechange', { detail: { muted: next } })
    )
  }

  return (
    <button
      id="mute-button"
      onClick={toggle}
      aria-label={muted ? 'Activar sonido' : 'Silenciar'}
      className="fixed bottom-6 right-6 z-50 w-10 h-10 flex items-center justify-center
                 text-xl opacity-40 hover:opacity-80 transition-opacity duration-300
                 cursor-pointer select-none bg-transparent border-none"
      style={{ color: '#d4c5a9' }}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}
