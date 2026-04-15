import { useState, useEffect, useRef } from 'react'
import MuteButton, { useMuteState } from '../components/MuteButton'

/**
 * WaitingScreen — Pantalla de espera antes de que abra la Fase 1
 *
 * Fondo negro. Texto con efecto máquina de escribir. Contador regresivo.
 * Sonido de tic-tac en loop. Nota críptica que aparece al terminar de escribir.
 * El contador apunta al timestamp exacto de phase_1_unlock_date de la sesión.
 */

// Texto del sobre sellado (T-00 de MIS_TEXTOS_template.md)
const SEALED_TEXT =
  'Falta poco. Sos la única que puede recordar.\nDeuteronomio 5:15(a)'

// Nota críptica que aparece después del texto principal
const FOOTNOTE = '— Hay algo que necesita ser resuelto. Volvé cuando sea el momento.'

const TYPING_SPEED_MS = 45

export default function WaitingScreen({ session }) {
  const [displayedText, setDisplayedText] = useState('')
  const [typingDone, setTypingDone] = useState(false)
  const targetDate = session?.phase_1_unlock_date
    ? new Date(session.phase_1_unlock_date)
    : new Date(2026, 3, 15, 15, 0, 0) // fallback: 15 abr 2026 15:00 local
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate))
  const [footnoteVisible, setFootnoteVisible] = useState(false)
  const audioRef = useRef(null)
  const muted = useMuteState()

  // --- Efecto máquina de escribir ---
  useEffect(() => {
    let charIndex = 0
    const interval = setInterval(() => {
      charIndex++
      setDisplayedText(SEALED_TEXT.slice(0, charIndex))
      if (charIndex >= SEALED_TEXT.length) {
        clearInterval(interval)
        setTypingDone(true)
      }
    }, TYPING_SPEED_MS)

    return () => clearInterval(interval)
  }, [])

  // --- Mostrar nota después de terminar de escribir ---
  useEffect(() => {
    if (!typingDone) return
    const timeout = setTimeout(() => setFootnoteVisible(true), 800)
    return () => clearTimeout(timeout)
  }, [typingDone])

  // --- Contador regresivo ---
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // --- Audio tic-tac ---
  useEffect(() => {
    const audio = new Audio('/sound_tictac.mp3')
    audio.loop = true
    audio.volume = 0.5
    audioRef.current = audio

    // Respetar estado de mute guardado
    const isMuted = localStorage.getItem('sfx_muted') === 'true'
    audio.muted = isMuted

    // Intentar reproducir (puede fallar si no hubo interacción del usuario)
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay bloqueado — reproducir al primer clic/toque
        const resumeAudio = () => {
          audio.play().catch(() => { })
          document.removeEventListener('click', resumeAudio)
          document.removeEventListener('touchstart', resumeAudio)
        }
        document.addEventListener('click', resumeAudio)
        document.addEventListener('touchstart', resumeAudio)
      })
    }

    // Escuchar cambios de mute
    const handleMuteChange = (e) => {
      audio.muted = e.detail.muted
    }
    window.addEventListener('mutechange', handleMuteChange)

    return () => {
      audio.pause()
      audio.src = ''
      audioRef.current = null
      window.removeEventListener('mutechange', handleMuteChange)
      document.removeEventListener('click', () => { })
      document.removeEventListener('touchstart', () => { })
    }
  }, [])

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 select-none">
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

      {/* Nota críptica — aparece después del typewriter */}
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

      {/* Botón de silencio */}
      <MuteButton />

      {/* Keyframe para el cursor parpadeante */}
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
 * @param {Date} targetDate - Timestamp exacto de apertura de Fase 1
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

/**
 * Zero-pad un número a 2 dígitos
 */
function pad(n) {
  return String(n).padStart(2, '0')
}
