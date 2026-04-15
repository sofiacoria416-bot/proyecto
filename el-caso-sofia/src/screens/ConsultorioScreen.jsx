import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MuteButton, { useMuteState } from '../components/MuteButton'
import DialogueBox from '../components/DialogueBox'
import { useDialogue } from '../hooks/useDialogue'
import { useProgress } from '../hooks/useProgress'
import { supabase } from '../lib/supabase'
import TableroScreen from './TableroScreen'

// Líneas escondidas — objetos del consultorio
const LINEA_RELOJ = [
  'El tiempo en análisis funciona distinto al tiempo del reloj.',
  'Acá adentro, todo lo que importó, todavía importa.',
]
const LINEA_RELOJ_YA_VISTO = ['Sigue sin cambiar.']
const LINEA_LIBRO = [
  '"La interpretación de los sueños", 1899.',
  'Mi mejor trabajo, si me permite la inmodestia.',
  'Aunque este caso tampoco está mal.',
]
const LINEA_LIBRO_YA_VISTO = ['Hay textos que mejoran con cada lectura.']
import {
  F01_BIENVENIDA,
  F02_TRANSICION,
  F03_TABLERO,
  QUESTIONS,
  LINEAS_ESPERA,
} from '../data/freudDialogues'

/**
 * ConsultorioScreen — Escena completa del consultorio + transición al tablero
 *
 * Flujo:
 * 1. Freud leyendo → clic → mirando + F-01
 * 2. 3 preguntas con cambios de pose mirando ↔ escribiendo
 * 3. de_pie + F-02
 * 4. señalando + F-03
 * 5. Transición animada al tablero (fade negro + puerta + crossfade audio)
 * 6. Tablero con ícono de Freud para líneas sueltas
 */

const FREUD_POSES = {
  leyendo: '/freud_leyendo.png',
  mirando: '/freud_mirando.png',
  escribiendo: '/freud_escribiendo.png',
  de_pie: '/freud_de_pie.png',
  senalando: '/freud_senalando.png',
}

// Escenas posibles
const SCENE_CONSULTORIO = 'consultorio'
const SCENE_TRANSITIONING = 'transitioning'
const SCENE_TABLERO = 'tablero'

export default function ConsultorioScreen({ session, phase, onPhase1Complete }) {
  const [freudPose, setFreudPose] = useState('leyendo')
  const [freudLoaded, setFreudLoaded] = useState(false)
  const [freudClicked, setFreudClicked] = useState(false)
  const [dialogueCompleted, setDialogueCompleted] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answeredQuestions, setAnsweredQuestions] = useState({})
  const [scene, setScene] = useState(SCENE_CONSULTORIO)
  const [overlayOpacity, setOverlayOpacity] = useState(0.15)
  const [waitLineIndex, setWaitLineIndex] = useState(0)

  const [relojFound, setRelojFound] = useState(false)
  const [libroFound, setLibroFound] = useState(false)
  const [hiddenDialogue, setHiddenDialogue] = useState(null) // { lines } para mini-diálogos

  const audioConsultorioRef = useRef(null)
  const audioTableroRef = useRef(null)
  const muted = useMuteState()
  const dialogue = useDialogue()

  const sessionId = session?.id
  const { progress } = useProgress(sessionId)

  // --- Verificar progreso al cargar ---
  useEffect(() => {
    if (!progress) return

    const choices = progress.dialogue_choices || []

    if (choices.length >= 3) {
      // Ya completó todo — ir directo al tablero
      setFreudClicked(true)
      setDialogueCompleted(true)
      setScene(SCENE_TABLERO)
      setOverlayOpacity(0)
      const answered = {}
      choices.forEach((c) => {
        answered[c.question_key] = c.chosen_option_key
      })
      setAnsweredQuestions(answered)
      return
    }

    if (choices.length > 0) {
      const answered = {}
      choices.forEach((c) => {
        answered[c.question_key] = c.chosen_option_key
      })
      setAnsweredQuestions(answered)
      setCurrentQuestionIndex(choices.length)
    }
  }, [progress])

  // --- Cargar objetos escondidos del consultorio desde Supabase ---
  useEffect(() => {
    if (!sessionId || sessionId === 'dev-mock') return
    const loadHidden = async () => {
      const { data } = await supabase
        .from('hidden_objects')
        .select('object_key')
        .eq('session_id', sessionId)
      if (data?.find((h) => h.object_key === 'reloj_consultorio')) setRelojFound(true)
      if (data?.find((h) => h.object_key === 'libro_estante_consultorio')) setLibroFound(true)
    }
    loadHidden()
  }, [sessionId])

  // --- Guardar objeto escondido ---
  const saveHiddenConsultorio = useCallback(async (key) => {
    if (!sessionId || sessionId === 'dev-mock') return
    await supabase.from('hidden_objects').upsert(
      { session_id: sessionId, object_key: key },
      { onConflict: 'session_id,object_key' }
    )
    await supabase.from('session_events').insert({
      session_id: sessionId,
      event_type: 'hidden_object_found',
      event_detail: { object_key: key },
    })
  }, [sessionId])

  // --- Handler: clic en el reloj ---
  const handleRelojClick = useCallback((e) => {
    e.stopPropagation()
    const isMuted = localStorage.getItem('sfx_muted') === 'true'
    const sfx = new Audio('/sound_tictac.mp3')
    sfx.volume = 0.6
    sfx.muted = isMuted
    sfx.play().catch(() => { })
    const handleMuteChange = (ev) => { sfx.muted = ev.detail.muted }
    window.addEventListener('mutechange', handleMuteChange)
    sfx.addEventListener('ended', () => window.removeEventListener('mutechange', handleMuteChange))

    if (!relojFound) {
      setRelojFound(true)
      saveHiddenConsultorio('reloj_consultorio')
      setHiddenDialogue({ lines: LINEA_RELOJ })
    } else {
      setHiddenDialogue({ lines: LINEA_RELOJ_YA_VISTO })
    }
  }, [relojFound, saveHiddenConsultorio])

  // --- Handler: clic en el libro ---
  const handleLibroClick = useCallback((e) => {
    e.stopPropagation()
    const isMuted = localStorage.getItem('sfx_muted') === 'true'
    const sfx = new Audio('/sound_sobre.mp3')
    sfx.volume = 0.6
    sfx.muted = isMuted
    sfx.play().catch(() => { })
    const handleMuteChange = (ev) => { sfx.muted = ev.detail.muted }
    window.addEventListener('mutechange', handleMuteChange)
    sfx.addEventListener('ended', () => window.removeEventListener('mutechange', handleMuteChange))

    if (!libroFound) {
      setLibroFound(true)
      saveHiddenConsultorio('libro_estante_consultorio')
      setHiddenDialogue({ lines: LINEA_LIBRO })
    } else {
      setHiddenDialogue({ lines: LINEA_LIBRO_YA_VISTO })
    }
  }, [libroFound, saveHiddenConsultorio])

  // --- Audio ambiente del consultorio ---
  useEffect(() => {
    if (scene === SCENE_TABLERO) return

    const audio = new Audio()
    audio.preload = 'auto'
    audio.loop = true
    audio.volume = 0.2
    audio.src = '/sound_consultorio_ambiente.mp3'
    audioConsultorioRef.current = audio

    const isMuted = localStorage.getItem('sfx_muted') === 'true'
    audio.muted = isMuted

    // Listener que persiste hasta que el audio logre reproducirse
    let started = false
    const tryPlay = () => {
      if (started) return
      audio.play().then(() => {
        started = true
        document.removeEventListener('click', tryPlay, true)
        document.removeEventListener('touchstart', tryPlay, true)
      }).catch(() => { })
    }

    // Registrar ANTES de intentar play, para no perder el primer clic
    document.addEventListener('click', tryPlay, true)
    document.addEventListener('touchstart', tryPlay, true)

    // Intentar autoplay (funciona si ya hubo interacción previa)
    tryPlay()

    const handleMuteChange = (e) => {
      audio.muted = e.detail.muted
    }
    window.addEventListener('mutechange', handleMuteChange)

    return () => {
      started = true
      audio.pause()
      audio.src = ''
      audioConsultorioRef.current = null
      document.removeEventListener('click', tryPlay, true)
      document.removeEventListener('touchstart', tryPlay, true)
      window.removeEventListener('mutechange', handleMuteChange)
    }
  }, [scene])

  // --- Audio ambiente del tablero (solo cuando escena = tablero) ---
  useEffect(() => {
    if (scene !== SCENE_TABLERO) return

    const audio = new Audio()
    audio.preload = 'auto'
    audio.loop = true
    audio.volume = 0.2
    audio.src = '/sound_tablero_ambiente.mp3'
    audioTableroRef.current = audio

    const isMuted = localStorage.getItem('sfx_muted') === 'true'
    audio.muted = isMuted

    let started = false
    const tryPlay = () => {
      if (started) return
      audio.play().then(() => {
        started = true
        document.removeEventListener('click', tryPlay, true)
      }).catch(() => { })
    }

    document.addEventListener('click', tryPlay, true)
    tryPlay()

    const handleMuteChange = (e) => {
      audio.muted = e.detail.muted
    }
    window.addEventListener('mutechange', handleMuteChange)

    // Pausar/reanudar cuando Michelle suena en el tablero
    const handleMichellePause = () => {
      audio.pause()
    }
    const handleMichelleResume = () => {
      if (!audio.muted) audio.play().catch(() => { })
    }
    window.addEventListener('michelle_ambient_pause', handleMichellePause)
    window.addEventListener('michelle_ambient_resume', handleMichelleResume)

    return () => {
      started = true
      audio.pause()
      audio.src = ''
      audioTableroRef.current = null
      document.removeEventListener('click', tryPlay, true)
      window.removeEventListener('mutechange', handleMuteChange)
      window.removeEventListener('michelle_ambient_pause', handleMichellePause)
      window.removeEventListener('michelle_ambient_resume', handleMichelleResume)
    }
  }, [scene])

  // --- Guardar respuesta en Supabase ---
  const saveChoice = useCallback(async (questionKey, chosenOptionKey, chosenOptionLabel) => {
    if (!sessionId || sessionId === 'dev-mock') return

    try {
      await supabase.from('dialogue_choices').upsert({
        session_id: sessionId,
        question_key: questionKey,
        chosen_option: chosenOptionLabel,
        chosen_option_key: chosenOptionKey,
      }, { onConflict: 'session_id,question_key' })

      await supabase.from('session_events').insert({
        session_id: sessionId,
        event_type: 'dialogue_question_answered',
        event_detail: { question_key: questionKey, chosen_option_key: chosenOptionKey },
      })
    } catch (err) {
      console.error('Error guardando respuesta:', err)
    }
  }, [sessionId])

  // --- Transición animada consultorio → tablero ---
  const startTransition = useCallback(() => {
    setScene(SCENE_TRANSITIONING)

    // Fase 1: Fade out del consultorio (0.15 → 1)
    setOverlayOpacity(1)

    // Fade out audio consultorio
    const consultorioAudio = audioConsultorioRef.current
    if (consultorioAudio) {
      const fadeOut = setInterval(() => {
        if (consultorioAudio.volume > 0.02) {
          consultorioAudio.volume = Math.max(0, consultorioAudio.volume - 0.02)
        } else {
          consultorioAudio.volume = 0
          consultorioAudio.pause()
          clearInterval(fadeOut)
        }
      }, 50) // 50ms * ~10 steps ≈ 500ms fade
    }

    // Tras 800ms (overlay llega a negro total):
    setTimeout(() => {
      // Reproducir sonido de puerta
      const puerta = new Audio('/sound_puerta.mp3')
      puerta.volume = 0.6
      const isMuted = localStorage.getItem('sfx_muted') === 'true'
      puerta.muted = isMuted

      const handleMuteChange = (e) => { puerta.muted = e.detail.muted }
      window.addEventListener('mutechange', handleMuteChange)
      puerta.play().catch(() => { })

      // Esperar 400ms con pantalla negra
      setTimeout(() => {
        // Cambiar escena a tablero y hacer fade in
        setScene(SCENE_TABLERO)
        setOverlayOpacity(0)

        // Cleanup puerta listener
        setTimeout(() => {
          window.removeEventListener('mutechange', handleMuteChange)
        }, 3000)
      }, 400)
    }, 800)
  }, [])

  // --- Iniciar pregunta por índice ---
  const startQuestion = useCallback((qIndex) => {
    if (qIndex >= QUESTIONS.length) {
      // Las 3 preguntas respondidas → F-02
      setFreudPose('de_pie')
      dialogue.startDialogue(F02_TRANSICION, null, () => {
        // F-02 terminó → Pose señalando + F-03
        setFreudPose('senalando')
        dialogue.startDialogue(F03_TABLERO, null, () => {
          // F-03 terminó → iniciar transición
          setDialogueCompleted(true)
          startTransition()
        })
      })
      return
    }

    const q = QUESTIONS[qIndex]
    setFreudPose('mirando')

    dialogue.startDialogue(
      q.lines,
      q.options,
      null,
      (key) => {
        setFreudPose('escribiendo')
        const selectedOption = q.options.find((o) => o.key === key)
        const label = selectedOption ? selectedOption.label : key

        saveChoice(q.questionKey, key, label)
        setAnsweredQuestions((prev) => ({ ...prev, [q.questionKey]: key }))

        const responseLines = q.responses[key] || ['Interesante. Seguimos.']
        dialogue.startDialogue(responseLines, null, () => {
          const nextIndex = qIndex + 1
          setCurrentQuestionIndex(nextIndex)
          startQuestion(nextIndex)
        })
      }
    )
  }, [dialogue, saveChoice, startTransition])

  // --- Clic en Freud (solo en consultorio) ---
  const handleFreudClick = useCallback(() => {
    if (freudClicked || dialogue.isActive) return
    setFreudClicked(true)
    setFreudPose('mirando')

    if (sessionId && sessionId !== 'dev-mock') {
      supabase.from('session_events').insert({
        session_id: sessionId,
        event_type: 'freud_dialogue_started',
      }).then(() => { })
    }

    const startIndex = currentQuestionIndex

    dialogue.startDialogue(F01_BIENVENIDA, null, () => {
      startQuestion(startIndex)
    })
  }, [freudClicked, dialogue, sessionId, currentQuestionIndex, startQuestion])

  // --- Clic en ícono de Freud (en el tablero) ---
  const handleFreudIconClick = () => {
    if (dialogue.isActive) return
    const lines = LINEAS_ESPERA[waitLineIndex % LINEAS_ESPERA.length]
    setWaitLineIndex((prev) => prev + 1)
    dialogue.startDialogue(lines)
  }

  // --- Fondo actual según la escena ---
  const backgroundImage = scene === SCENE_TABLERO
    ? '/fondo_tablero.png'
    : '/fondo_consultorio.png'

  const showFreud = scene === SCENE_CONSULTORIO
  const showFreudIcon = scene === SCENE_TABLERO

  // Si la escena es tablero, renderizar TableroScreen directamente
  if (scene === SCENE_TABLERO) {
    return <TableroScreen session={session} onPhase1Complete={onPhase1Complete} />
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none">
      {/* Fondo del consultorio */}
      <img
        src="/fondo_consultorio.png"
        alt="Consultorio de Freud"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* ── OBJETO ESCONDIDO: Reloj del consultorio ── */}
      {/* Área clickeable 60×60px — posición ajustable */}
      <div
        onClick={handleRelojClick}
        title=""
        style={{
          position: 'absolute',
          left: '69%',
          top: '30%',
          width: '60px',
          height: '60px',
          cursor: 'pointer',
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!relojFound && (
          <div className="relative w-10 h-10 flex items-center justify-center pointer-events-none" style={{ opacity: 0.8 }}>
            <span className="absolute inset-0 rounded-full" style={{ border: '2px solid #d4c5a9', animation: 'pulseRing 2s ease-out infinite' }} />
            <span className="absolute inset-0 rounded-full" style={{ border: '2px solid #dfa945ff', animation: 'pulseRing 2s ease-out infinite 0.6s' }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#fade41ff', animation: 'pulseDot 2s ease-in-out infinite' }} />
          </div>
        )}
      </div>

      {/* ── OBJETO ESCONDIDO: Libro del estante ── */}
      {/* Área clickeable 50×70px — posición ajustable */}
      <div
        onClick={handleLibroClick}
        title=""
        style={{
          position: 'absolute',
          left: '46%',
          top: '55%',
          width: '50px',
          height: '70px',
          cursor: 'pointer',
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!libroFound && (
          <div className="relative w-10 h-10 flex items-center justify-center pointer-events-none" style={{ opacity: 0.8 }}>
            <span className="absolute inset-0 rounded-full" style={{ border: '2px solid #d4c5a9', animation: 'pulseRing 2s ease-out infinite' }} />
            <span className="absolute inset-0 rounded-full" style={{ border: '2px solid #dfa945ff', animation: 'pulseRing 2s ease-out infinite 0.6s' }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#fade41ff', animation: 'pulseDot 2s ease-in-out infinite' }} />
          </div>
        )}
      </div>

      {/* Overlay con opacidad animada */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundColor: '#000',
          opacity: overlayOpacity,
          transition: scene === SCENE_TRANSITIONING
            ? 'opacity 800ms ease-in-out'
            : 'none',
        }}
      />

      {/* Freud — solo en el consultorio */}
      {showFreud && (
        <AnimatePresence mode="wait">
          <motion.img
            key={freudPose}
            src={FREUD_POSES[freudPose]}
            alt="Sigmund Freud"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            onLoad={() => setFreudLoaded(true)}
            onClick={!freudClicked ? handleFreudClick : undefined}
            draggable={false}
            className={`absolute ${!freudClicked ? 'cursor-pointer' : ''}`}
            style={{
              height: '65vh',
              right: '70%',
              bottom: '0%',
              filter: 'brightness(1)',
              transition: 'filter 0.3s ease',
            }}
            onMouseEnter={(e) => {
              if (!freudClicked) e.currentTarget.style.filter = 'brightness(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(1)'
            }}
          />
        </AnimatePresence>
      )}

      {/* Indicador pulsante sobre Freud */}
      {!freudClicked && freudLoaded && scene === SCENE_CONSULTORIO && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="absolute pointer-events-none"
          style={{
            right: 'calc(75% + 95px)',
            bottom: 'calc(31vh - 10px)',
          }}
        >
          <div className="relative w-10 h-10 flex items-center justify-center">
            <span
              className="absolute inset-0 rounded-full"
              style={{
                border: '2px solid #d4c5a9',
                animation: 'pulseRing 2s ease-out infinite',
              }}
            />
            <span
              className="absolute inset-0 rounded-full"
              style={{
                border: '2px solid #dfa945ff',
                animation: 'pulseRing 2s ease-out infinite 0.6s',
              }}
            />
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: '#fade41ff',
                animation: 'pulseDot 2s ease-in-out infinite',
              }}
            />
          </div>
          <style>{`
            @keyframes pulseRing {
              0% { transform: scale(0.8); opacity: 0.8; }
              100% { transform: scale(2.2); opacity: 0; }
            }
            @keyframes pulseDot {
              0%, 100% { opacity: 0.9; transform: scale(1); }
              50% { opacity: 0.5; transform: scale(0.8); }
            }
          `}</style>
        </motion.div>
      )}

      {/* Diálogo de Freud */}
      {dialogue.isActive && (
        <DialogueBox
          key={dialogue.dialogueId}
          lines={dialogue.lines}
          options={dialogue.options}
          onComplete={dialogue.handleComplete}
          onOptionSelect={dialogue.handleOptionSelect}
        />
      )}

      {/* Botón de silencio */}
      <MuteButton />

      {/* Mini-diálogo para objetos escondidos (z-50, sobre todo) */}
      {hiddenDialogue && (
        <DialogueBox
          key={hiddenDialogue.lines[0]}
          lines={hiddenDialogue.lines}
          onComplete={() => setHiddenDialogue(null)}
          placement="center"
        />
      )}
    </div>
  )
}
