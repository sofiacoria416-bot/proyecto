import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMuteState } from './MuteButton'

const TYPING_SPEED_MS = 30
const SOUND_EVERY_N_CHARS = 4

export default function DialogueBox({ lines, onComplete, options = null, onOptionSelect = null, placement = 'bottom' }) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const [allLinesComplete, setAllLinesComplete] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const typingInterval = useRef(null)
  const charCount = useRef(0)
  const muted = useMuteState()
  const boxRef = useRef(null)
  const currentSourceRef = useRef(null)

  const currentLine = lines[currentLineIndex] || ''

  // --- Web Audio API para typewriter ---
  const audioCtxRef = useRef(null)
  const audioBufferRef = useRef(null)

  useEffect(() => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    audioCtxRef.current = ctx

    const unlock = () => {
      if (ctx.state === 'suspended') ctx.resume()
      document.removeEventListener('click', unlock, true)
      document.removeEventListener('touchstart', unlock, true)
    }
    document.addEventListener('click', unlock, true)
    document.addEventListener('touchstart', unlock, true)

    fetch('/sound_typewriter.mp3')
      .then((res) => res.arrayBuffer())
      .then((buf) => ctx.decodeAudioData(buf))
      .then((decoded) => { audioBufferRef.current = decoded })
      .catch((err) => { console.error('Audio load failed:', err) })

    return () => {
      ctx.close().catch(() => { })
      document.removeEventListener('click', unlock, true)
      document.removeEventListener('touchstart', unlock, true)
    }
  }, [])

  // --- Detener el source activo ---
  const stopAllPoolSounds = useCallback(() => {
    try { currentSourceRef.current?.stop() } catch { }
    currentSourceRef.current = null
  }, [])

  // --- Sonido typewriter ---
  const playTypewriterSound = useCallback(async () => {
    const ctx = audioCtxRef.current
    const buffer = audioBufferRef.current
    if (!ctx || !buffer) return
    if (ctx.state === 'suspended') await ctx.resume()
    if (ctx.state !== 'running') return

    // Detener el anterior si sigue sonando
    try { currentSourceRef.current?.stop() } catch { }

    const source = ctx.createBufferSource()
    const gain = ctx.createGain()
    source.buffer = buffer
    gain.gain.value = 0.5
    source.connect(gain)
    gain.connect(ctx.destination)
    source.start(0)
    currentSourceRef.current = source

    // Cortar después de 80ms
    setTimeout(() => {
      try { source.stop() } catch { }
    }, 1000)
  }, [])

  // --- Efecto de máquina de escribir ---
  useEffect(() => {
    if (allLinesComplete) return

    charCount.current = 0
    setDisplayedText('')
    setIsTyping(true)

    typingInterval.current = setInterval(() => {
      charCount.current++
      setDisplayedText(currentLine.slice(0, charCount.current))

      if (!muted && charCount.current % SOUND_EVERY_N_CHARS === 0) {
        playTypewriterSound()
      }

      if (charCount.current >= currentLine.length) {
        clearInterval(typingInterval.current)
        typingInterval.current = null
        setIsTyping(false)
        stopAllPoolSounds()
      }
    }, TYPING_SPEED_MS)

    return () => {
      if (typingInterval.current) {
        clearInterval(typingInterval.current)
        typingInterval.current = null
      }
      stopAllPoolSounds()
    }
  }, [currentLineIndex, allLinesComplete, currentLine, playTypewriterSound, stopAllPoolSounds, muted])

  // --- Avanzar diálogo (clic o tecla) ---
  const advance = useCallback(() => {
    if (allLinesComplete) return

    if (isTyping) {
      if (typingInterval.current) {
        clearInterval(typingInterval.current)
        typingInterval.current = null
      }
      setDisplayedText(currentLine)
      setIsTyping(false)
      stopAllPoolSounds()
      return
    }

    if (currentLineIndex < lines.length - 1) {
      setCurrentLineIndex((prev) => prev + 1)
    } else {
      setAllLinesComplete(true)
      stopAllPoolSounds()

      if (options && options.length > 0) {
        setTimeout(() => setShowOptions(true), 300)
      } else {
        if (onComplete) onComplete()
      }
    }
  }, [isTyping, currentLine, currentLineIndex, lines.length, allLinesComplete, options, onComplete, stopAllPoolSounds])

  // --- Escuchar teclas (espacio / enter) ---
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [advance])

  // --- Seleccionar opción ---
  const handleSelect = (key) => {
    if (onOptionSelect) onOptionSelect(key)
  }

  const isCenter = placement === 'center'

  return (
    <AnimatePresence>
      <motion.div
        ref={boxRef}
        initial={{ opacity: 0, y: isCenter ? -20 : 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: isCenter ? -20 : 30 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        onClick={!showOptions ? advance : undefined}
        className={`fixed z-40 cursor-pointer select-none ${
          isCenter
            ? ''
            : 'bottom-0 left-0 right-0'
        }`}
        style={
          isCenter
            ? {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '90vw',
                maxWidth: '560px',
                minHeight: '160px',
                backgroundColor: 'rgba(10, 8, 5, 0.95)',
                border: '1px solid #8a7560',
                borderRadius: '6px',
                padding: '20px 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
              }
            : {
                minHeight: '180px',
                backgroundColor: 'rgba(10, 8, 5, 0.88)',
                borderTop: '1px solid #8a7560',
                padding: '16px 24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
              }
        }
      >
        {/* Label — Dr. Freud */}
        <span
          className="text-xs tracking-widest uppercase mb-2"
          style={{
            color: '#8a7560',
            fontFamily: "'Georgia', 'Times New Roman', serif",
          }}
        >
          Dr. Freud
        </span>

        {/* Texto del diálogo */}
        {!showOptions && (
          <p
            className="flex-1"
            style={{
              fontFamily: "'Courier New', Courier, monospace",
              color: '#d4c5a9',
              fontSize: '16px',
              lineHeight: '1.6',
              margin: 0,
              minHeight: '80px',
            }}
          >
            {displayedText}
            {isTyping && (
              <span
                className="inline-block w-[2px] h-[1em] ml-[2px] align-middle"
                style={{
                  backgroundColor: '#d4c5a9',
                  animation: 'blink 0.7s step-end infinite',
                }}
              />
            )}
          </p>
        )}

        {/* Triángulo de "continuar" */}
        {!isTyping && !allLinesComplete && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-4 right-6 text-sm"
            style={{
              color: '#8a7560',
              animation: 'blink 1.2s step-end infinite',
            }}
          >
            ▼
          </motion.span>
        )}

        {/* Opciones de respuesta */}
        {showOptions && options && (
          <div className="flex flex-col gap-2 mt-1">
            {options.map((opt, i) => (
              <motion.button
                key={opt.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15, duration: 0.3 }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleSelect(opt.key)
                }}
                className="text-left px-4 py-2 rounded cursor-pointer transition-colors duration-200"
                style={{
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: '14px',
                  color: '#d4c5a9',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(138, 117, 96, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(138, 117, 96, 0.2)'
                  e.currentTarget.style.borderColor = '#8a7560'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.borderColor = 'rgba(138, 117, 96, 0.3)'
                }}
              >
                {opt.label}
              </motion.button>
            ))}
          </div>
        )}

        <style>{`
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  )
}