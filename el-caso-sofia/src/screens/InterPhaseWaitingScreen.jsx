import { useState, useEffect, useRef } from 'react'
import MuteButton, { useMuteState } from '../components/MuteButton'
import { supabase } from '../lib/supabase'

/**
 * InterPhaseWaitingScreen — Pantalla entre Fase 1 y el día del cumpleaños
 *
 * Aparece cuando phase_1_completed = true y la fecha es anterior al phase_2_unlock_date.
 * Fondo negro. Texto de Freud con efecto máquina de escribir. Contador al timestamp
 * exacto de phase_2_unlock_date que viene de la sesión en Supabase.
 * Nota al margen que aparece al final.
 */

// Última línea del F-07 — lo que Sofía ve en pantalla
const FREUD_TEXT =
  'Mañana, el día de tu cumpleaños, este consultorio va a tener algo nuevo para vos.'

// Nota al margen que aparece después
const FOOTNOTE = '— Ya sabés dónde encontrarme.'

const TYPING_SPEED_MS = 48

export default function InterPhaseWaitingScreen({ session }) {
  const [displayedText, setDisplayedText] = useState('')
  const [typingDone, setTypingDone] = useState(false)
  const targetDate = session?.phase_2_unlock_date
    ? new Date(session.phase_2_unlock_date)
    : new Date(2026, 3, 16, 0, 0, 0) // fallback: 16 abr 2026 00:00 local
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate))
  const [footnoteVisible, setFootnoteVisible] = useState(false)
  const [videoUnlocked, setVideoUnlocked] = useState(false)
  const audioRef = useRef(null)
  // eslint-disable-next-line no-unused-vars
  const muted = useMuteState()

  const sessionId = session?.id

  // --- Verificar si el video fue desbloqueado ---
  useEffect(() => {
    if (!sessionId || sessionId === 'dev-mock') return
    const check = async () => {
      const { data } = await supabase
        .from('rewards_unlocked')
        .select('reward_key')
        .eq('session_id', sessionId)
        .eq('reward_key', 'video_anecdota_reencuentro')
        .maybeSingle()
      if (data) setVideoUnlocked(true)
    }
    check()
  }, [sessionId])

  // --- Descargar / Ver video ---
  const handleDownloadVideo = () => {
    const a = document.createElement('a')
    a.href = '/video_reencuentro.mp4'
    a.download = 'Video Reencuentro — El Caso Sofía.mp4'
    a.click()
    if (sessionId && sessionId !== 'dev-mock') {
      supabase.from('session_events').insert({
        session_id: sessionId,
        event_type: 'reward_downloaded',
        event_detail: { reward_key: 'video_anecdota_reencuentro' },
      }).then(() => { })
    }
  }

  // --- Efecto máquina de escribir ---
  useEffect(() => {
    let charIndex = 0
    const interval = setInterval(() => {
      charIndex++
      setDisplayedText(FREUD_TEXT.slice(0, charIndex))
      if (charIndex >= FREUD_TEXT.length) {
        clearInterval(interval)
        setTypingDone(true)
      }
    }, TYPING_SPEED_MS)
    return () => clearInterval(interval)
  }, [])

  // --- Mostrar nota al terminar de escribir ---
  useEffect(() => {
    if (!typingDone) return
    const timeout = setTimeout(() => setFootnoteVisible(true), 900)
    return () => clearTimeout(timeout)
  }, [typingDone])

  // --- Contador regresivo ---
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate))
    }, 1000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- Audio tic-tac ---
  useEffect(() => {
    const audio = new Audio('/sound_tictac.mp3')
    audio.loop = true
    audio.volume = 0.5
    audioRef.current = audio

    const isMuted = localStorage.getItem('sfx_muted') === 'true'
    audio.muted = isMuted

    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        const resumeAudio = () => {
          audio.play().catch(() => { })
          document.removeEventListener('click', resumeAudio)
          document.removeEventListener('touchstart', resumeAudio)
        }
        document.addEventListener('click', resumeAudio)
        document.addEventListener('touchstart', resumeAudio)
      })
    }

    const handleMuteChange = (e) => { audio.muted = e.detail.muted }
    window.addEventListener('mutechange', handleMuteChange)

    return () => {
      audio.pause()
      audio.src = ''
      audioRef.current = null
      window.removeEventListener('mutechange', handleMuteChange)
    }
  }, [])

  return (
    <div
      className="min-h-screen bg-black flex flex-col items-center justify-center px-6 select-none"
      style={{ backgroundColor: '#000' }}
    >
      {/* Texto con efecto máquina de escribir */}
      <div className="max-w-2xl w-full text-center">
        <p
          className="font-mono text-lg md:text-xl leading-relaxed tracking-wide"
          style={{
            color: '#d4c5a9',
            fontFamily: "'Courier New', Courier, monospace",
            minHeight: '4em',
          }}
        >
          {displayedText}
          {!typingDone && (
            <span
              className="inline-block w-[2px] h-[1.1em] ml-[2px] align-middle"
              style={{
                backgroundColor: '#d4c5a9',
                animation: 'blink 0.7s step-end infinite',
              }}
            />
          )}
        </p>
      </div>

      {/* Contador regresivo */}
      <div
        className="mt-12 font-mono text-sm md:text-base tracking-[0.3em] uppercase"
        style={{
          color: '#8a7d6b',
          fontFamily: "'Courier New', Courier, monospace",
        }}
      >
        {timeLeft.expired ? (
          <span>00 días 00 horas 00 minutos 00 segundos</span>
        ) : (
          <span>
            {pad(timeLeft.days)} días {pad(timeLeft.hours)} horas{' '}
            {pad(timeLeft.minutes)} minutos {pad(timeLeft.seconds)} segundos
          </span>
        )}
      </div>

      {/* Nota al margen */}
      <p
        className="mt-10 font-mono text-xs md:text-sm italic transition-opacity duration-[2000ms]"
        style={{
          color: '#5a5042',
          fontFamily: "'Courier New', Courier, monospace",
          opacity: footnoteVisible ? 1 : 0,
        }}
      >
        {FOOTNOTE}
      </p>

      {/* Botón de video — solo si fue desbloqueado al completar Zona 3 */}
      {videoUnlocked && (
        <div className="mt-10">
          <button
            onClick={handleDownloadVideo}
            className="px-4 py-2 text-xs rounded cursor-pointer transition-colors"
            style={{
              backgroundColor: 'rgba(201,168,76,0.15)',
              border: '1px solid rgba(201,168,76,0.5)',
              color: '#c9a84c',
              fontFamily: "'Courier New', Courier, monospace",
              letterSpacing: '0.05em',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(201,168,76,0.3)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(201,168,76,0.15)' }}
          >
            🎥 Descargar video de la fase 1
          </button>
        </div>
      )}

      {/* Botón de silencio */}
      <MuteButton />

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}

/**
 * Calcula el tiempo restante hasta el timestamp objetivo.
 * @param {Date} targetDate - Timestamp exacto de apertura de Fase 2
 */
function calculateTimeLeft(targetDate) {
  const now = new Date()
  const diff = targetDate - now

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  }
}

function pad(n) {
  return String(n).padStart(2, '0')
}
