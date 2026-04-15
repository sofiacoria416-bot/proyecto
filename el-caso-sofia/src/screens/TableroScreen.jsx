import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MuteButton from '../components/MuteButton'
import DialogueBox from '../components/DialogueBox'
import { useDialogue } from '../hooks/useDialogue'
import { supabase } from '../lib/supabase'
import {
  F04_ZONA1,
  F05_ZONA2,
  F06_ZONA3,
  F07_CIERRE_FASE1,
  RB_RESPONSES,
  FREUD_QUIZ_FAIL,
  FREUD_CASETE_LOCKED,
  FREUD_HIDDEN_OBJECT_FOUND,
  LINEAS_ESPERA,
} from '../data/freudDialogues'
import { NOTA_Z3, TIMELINE } from '../data/content'

/**
 * TableroScreen — Tablero de investigación con Zona 1 funcional
 */

// ============================================================
// TEXTOS DEL CREADOR
// ============================================================
const T01_FOTO = 'Una de las primeras fotos de Sofía y Thiago. Ellos no lo sabían, pero ese día de ñoquis marcaba el comienzo de su relación (la única vez que comieron ñoquis juntos xD).'

const T02_CASETE = 'A Thiago siempre le gustó Michelle de Los Beatles, desde que la tocó con su profe de bajo en 2024. Pero el 19 de septiembre de 2025 la canción tomó un sentido diferente: Michelle había tomado la forma de Sofía en su psique. Ese día Thiago se la dedicó.'

const HITO06_SOBRE = 'Salimos de la escuela y fuimos al parque cívico.\nDespués volvimos caminando y te acompañé hasta tu puerta.\nEn la puerta te pregunté: ¿Nos besamos?\nY nos besamos.\n\nEse fue el primer beso de mi vida.\nHabías comido el chupetin de arandanos con chicle de Arcor.\nNo se me va a olvidar nunca.'

const T03_DOCUMENTO = 'Esta etapa fue complicada. Hablabamos muy poco, pero reiamos mucho. Nos veiamos solamente en la escuela, pero la pasabamos muy zarpado. Vos estabas en otra (alto mecanismo de forclusión sufrías KJASJKS) pero fue lindo estar siempre y sentir que tenia una verdadera amiga. A pesar de las macanas que después nos mandamos, y de la traición que pude haber sentido, lo hermoso es que el perdón fue una variable importante siempre en nuestra relación. Entender que así como Jesús nos perdonó, te puedo perdonar y elegir descartar la parte de vos que realmente nunca fue tuya. Te amo.'

const Z2_LABELS = ['pausa', 'espera', 'ruido', 'distancia', 'latencia', 'necesario', 'injusto']

// ============================================================
// QUIZ CONFIG
// ============================================================
const QUIZ_QUESTIONS = [
  {
    text: '¿En qué mes y año se conocieron?',
    validate: (answer) => {
      const a = answer.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
      return (
        a === 'octubre 2021' ||
        a === 'octubre de 2021' ||
        a === 'oct 2021' ||
        a === '10/2021' ||
        a === '10-2021' ||
        a === 'octubre del 2021'
      )
    },
  },
  {
    text: '¿Quién le pidió el número a quién?',
    validate: (answer) => {
      const a = answer.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
      // Aceptar si contiene "sofia" y no es solo "thiago"
      if (a === 'thiago' || a === 'el' || a === 'él') return false
      if (a.includes('sofia') || a.includes('ella')) return true
      return false
    },
  },
  {
    text: '¿Qué comieron la primera vez que él fue a tu casa?',
    validate: (answer) => {
      const a = answer.toLowerCase().trim()
      return a.includes('ñoqui') || a.includes('noqui')
    },
  },
]

export default function TableroScreen({ session, onPhase1Complete }) {
  const sessionId = session?.id

  // ---- Estado de Zona 1 ----
  const [introPlayed, setIntroPlayed] = useState(false)
  const [quizActive, setQuizActive] = useState(false)
  const [quizQuestionIndex, setQuizQuestionIndex] = useState(0)
  const [quizInput, setQuizInput] = useState('')
  const [quizFeedback, setQuizFeedback] = useState(null) // null | 'correct' | 'wrong'
  const [attemptCounts, setAttemptCounts] = useState([0, 0, 0])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [photoRevealed, setPhotoRevealed] = useState(false)
  const [showT01, setShowT01] = useState(false)
  const [hiloConnected, setHiloConnected] = useState(false)
  const [showT02, setShowT02] = useState(false)
  const [caseteAudioPlaying, setCaseteAudioPlaying] = useState(false)
  const [sobreFound, setsobreFound] = useState(false)
  const [sobreHover, setSobreHover] = useState(false)
  const [showSobreModal, setShowSobreModal] = useState(false)
  const [zoneCompleted, setZoneCompleted] = useState(false)
  const [showStamp, setShowStamp] = useState(false)
  const [zone2Unlocked, setZone2Unlocked] = useState(false)
  const [michelleReproducedTracked, setMichelleReproducedTracked] = useState(false)
  const [michelleDownloadedTracked, setMichelleDownloadedTracked] = useState(false)

  // ---- Estado de Zona 3 ----
  const [z3IntroPlayed, setZ3IntroPlayed] = useState(false)
  const [z3Interactable, setZ3Interactable] = useState(false)
  const [z3TimelineVisible, setZ3TimelineVisible] = useState(false)
  const [openedHits, setOpenedHits] = useState(new Set())
  const [z3SelectedHit, setZ3SelectedHit] = useState(null)
  const [z3Completed, setZ3Completed] = useState(false)
  const [z3Illuminated, setZ3Illuminated] = useState(false)

  // ---- Estado de Zona 2 ----
  const [z2IntroPlayed, setZ2IntroPlayed] = useState(false)
  const [z2Interactable, setZ2Interactable] = useState(false)
  const [z2DocumentOpen, setZ2DocumentOpen] = useState(false)
  const [z2LabelChosen, setZ2LabelChosen] = useState(null)
  const [z2Completed, setZ2Completed] = useState(false)
  const [z2ShowStamp, setZ2ShowStamp] = useState(false)
  const [zone3Unlocked, setZone3Unlocked] = useState(false)

  // ---- Objeto escondido: palabra subrayada en T-03 ----
  const [palabraFound, setPalabraFound] = useState(false)
  const [palabraParpadeo, setPalabraParpadeo] = useState(false)
  const [hiddenDialogue, setHiddenDialogue] = useState(null) // { lines }

  // ---- Freud icon ----
  const [waitLineIndex, setWaitLineIndex] = useState(0)

  // ---- Secuencia de cierre Fase 1 ----
  const [closingBrightnessActive, setClosingBrightnessActive] = useState(false)
  const [closingFreudVisible, setClosingFreudVisible] = useState(false)
  const [phase1FadeOut, setPhase1FadeOut] = useState(false)

  const dialogue = useDialogue()
  const caseteAudioRef = useRef(null)

  // ============================================================
  // RECUPERAR PROGRESO
  // ============================================================
  useEffect(() => {
    if (!sessionId || sessionId === 'dev-mock') return

    const loadProgress = async () => {
      // zone_progress
      const { data: zones } = await supabase
        .from('zone_progress')
        .select('*')
        .eq('session_id', sessionId)
      const z1 = zones?.find((z) => z.zone_key === 'zona_1_origen')
      if (z1) {
        if (z1.quiz_completed) {
          setQuizCompleted(true)
          setPhotoRevealed(true)
          setShowT01(true)
          setIntroPlayed(true)
        }
        if (z1.hilo_connected) {
          setHiloConnected(true)
          setShowT02(true)
        }
        if (z1.is_completed) {
          setZoneCompleted(true)
          setShowStamp(true)
          setZone2Unlocked(true)
        }
      }
      const z2 = zones?.find((z) => z.zone_key === 'zona_2_parentesis')
      if (z2?.is_unlocked) setZone2Unlocked(true)
      if (z2?.label_chosen) {
        setZ2LabelChosen(z2.label_chosen)
        setZ2IntroPlayed(true)
        setZ2Interactable(true)
      }
      if (z2?.is_completed) {
        setZ2Completed(true)
        setZ2ShowStamp(true)
      }

      const z3 = zones?.find((z) => z.zone_key === 'zona_3_reencuentro')
      if (z3?.is_unlocked) setZone3Unlocked(true)
      if (z3?.is_completed) setZ3Completed(true)

      // Si las tres zonas ya estaban completas al cargar, ir directo a InterPhaseWaitingScreen
      if (z1?.is_completed && z2?.is_completed && z3?.is_completed) {
        onPhase1Complete?.()
        return
      }

      // timeline_hits
      const { data: hitData } = await supabase
        .from('timeline_hits')
        .select('hit_key')
        .eq('session_id', sessionId)
      if (hitData && hitData.length > 0) {
        setOpenedHits(new Set(hitData.map((h) => h.hit_key)))
        setZ3IntroPlayed(true)
        setZ3Interactable(true)
        setZ3TimelineVisible(true)
      }

      // hidden_objects
      const { data: hidden } = await supabase
        .from('hidden_objects')
        .select('*')
        .eq('session_id', sessionId)
      if (hidden?.find((h) => h.object_key === 'sobre_rincon_zona1')) {
        setsobreFound(true)
      }
      if (hidden?.find((h) => h.object_key === 'palabra_subrayada_zona2')) {
        setPalabraFound(true)
      }

      // quiz_answers — check which already correct
      const { data: qa } = await supabase
        .from('quiz_answers')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_correct', true)
      if (qa && qa.length > 0) {
        const maxCorrect = Math.max(...qa.map((r) => r.question_index))
        if (maxCorrect >= QUIZ_QUESTIONS.length) {
          setQuizQuestionIndex(QUIZ_QUESTIONS.length)
        } else {
          setQuizQuestionIndex(maxCorrect)
        }
        // Load attempt counts
        const { data: allAttempts } = await supabase
          .from('quiz_answers')
          .select('question_index, attempt_number')
          .eq('session_id', sessionId)
        if (allAttempts) {
          const counts = [0, 0, 0]
          allAttempts.forEach((a) => {
            const idx = a.question_index - 1
            if (idx >= 0 && idx < 3) {
              counts[idx] = Math.max(counts[idx], a.attempt_number)
            }
          })
          setAttemptCounts(counts)
        }
      }
    }
    loadProgress()
  }, [sessionId])

  // ============================================================
  // F-04 INTRO (solo la primera vez)
  // ============================================================
  useEffect(() => {
    if (introPlayed || quizCompleted) return
    // Esperar un momento antes de mostrar F-04
    const timer = setTimeout(() => {
      dialogue.startDialogue(F04_ZONA1, null, () => {
        setIntroPlayed(true)
      })
    }, 800)
    return () => clearTimeout(timer)
  }, [introPlayed, quizCompleted])

  // ============================================================
  // GUARDAR EN SUPABASE
  // ============================================================
  const saveQuizAnswer = useCallback(async (qIndex, answer, isCorrect, attempt) => {
    if (!sessionId || sessionId === 'dev-mock') return
    await supabase.from('quiz_answers').insert({
      session_id: sessionId,
      question_index: qIndex + 1,
      answer_given: answer,
      is_correct: isCorrect,
      attempt_number: attempt,
    })
  }, [sessionId])

  const saveZoneProgress = useCallback(async (updates) => {
    if (!sessionId || sessionId === 'dev-mock') return
    await supabase.from('zone_progress').upsert({
      session_id: sessionId,
      zone_key: 'zona_1_origen',
      ...updates,
    }, { onConflict: 'session_id,zone_key' })
  }, [sessionId])

  const saveEvent = useCallback(async (type, detail = {}) => {
    if (!sessionId || sessionId === 'dev-mock') return
    await supabase.from('session_events').insert({
      session_id: sessionId,
      event_type: type,
      event_detail: detail,
    })
  }, [sessionId])

  const saveHiddenObject = useCallback(async (key) => {
    if (!sessionId || sessionId === 'dev-mock') return
    await supabase.from('hidden_objects').upsert({
      session_id: sessionId,
      object_key: key,
    }, { onConflict: 'session_id,object_key' })
  }, [sessionId])

  const saveReward = useCallback(async (key) => {
    if (!sessionId || sessionId === 'dev-mock') return
    await supabase.from('rewards_unlocked').upsert({
      session_id: sessionId,
      reward_key: key,
    }, { onConflict: 'session_id,reward_key' })
  }, [sessionId])

  // ============================================================
  // HANDLERS
  // ============================================================

  // ---- Clic en foto borrosa → iniciar quiz ----
  const handlePhotoClick = () => {
    if (!introPlayed || quizCompleted || dialogue.isActive) return
    setQuizActive(true)
  }

  // ---- Enviar respuesta del quiz ----
  const handleQuizSubmit = async () => {
    if (quizFeedback === 'correct') return
    const q = QUIZ_QUESTIONS[quizQuestionIndex]
    if (!q) return

    const answer = quizInput.trim()
    if (!answer) return

    const newAttempt = attemptCounts[quizQuestionIndex] + 1
    setAttemptCounts((prev) => {
      const n = [...prev]
      n[quizQuestionIndex] = newAttempt
      return n
    })

    if (q.validate(answer)) {
      // Correcto
      setQuizFeedback('correct')
      saveQuizAnswer(quizQuestionIndex, answer, true, newAttempt)

      setTimeout(() => {
        const nextIdx = quizQuestionIndex + 1
        if (nextIdx >= QUIZ_QUESTIONS.length) {
          // Todas correctas → revelar foto
          setQuizActive(false)
          setQuizCompleted(true)
          saveZoneProgress({ quiz_completed: true })
          saveEvent('quiz_passed')

          // Reproducir sonido de reveal
          const reveal = new Audio('/sound_reveal.mp3')
          reveal.volume = 0.5
          const isMuted = localStorage.getItem('sfx_muted') === 'true'
          reveal.muted = isMuted
          reveal.play().catch(() => { })

          // Animación: foto se revela
          setTimeout(() => setPhotoRevealed(true), 100)
          // T-01 aparece después
          setTimeout(() => setShowT01(true), 1700)

          // Check completado
          if (hiloConnected) {
            triggerZoneComplete()
          }
        } else {
          setQuizQuestionIndex(nextIdx)
          setQuizInput('')
          setQuizFeedback(null)
        }
      }, 800)
    } else {
      // Incorrecto
      setQuizFeedback('wrong')
      saveQuizAnswer(quizQuestionIndex, answer, false, newAttempt)

      // Freud comenta
      dialogue.startDialogue(FREUD_QUIZ_FAIL, null, () => {
        setQuizFeedback(null)
      })
    }
  }

  // ---- Clic en casete ----
  const handleCaseteClick = () => {
    if (dialogue.isActive) return

    if (!quizCompleted) {
      dialogue.startDialogue(FREUD_CASETE_LOCKED)
      return
    }

    if (hiloConnected) return // Ya conectado

    setHiloConnected(true)
    saveZoneProgress({ hilo_connected: true })
    saveReward('audio_michelle_guitarra')
    saveEvent('hilo_connected')

    // Audio Michelle
    const audio = new Audio('/michelle_guitarra.mp3')
    audio.volume = 0.4
    audio.loop = true
    const isMuted = localStorage.getItem('sfx_muted') === 'true'
    audio.muted = isMuted
    caseteAudioRef.current = audio

    const handleMuteChange = (e) => { audio.muted = e.detail.muted }
    window.addEventListener('mutechange', handleMuteChange)

    // Panel T-02 después del hilo (1.2s para la animación)
    setTimeout(() => {
      audio.play().catch(() => { })
      setCaseteAudioPlaying(true)
      setShowT02(true)
      trackMichelleReproduced()
      // Pausar audio ambiente del tablero mientras suena Michelle
      window.dispatchEvent(new CustomEvent('michelle_ambient_pause'))
    }, 1200)

    // Check completado
    if (quizCompleted) {
      setTimeout(() => triggerZoneComplete(), 2500)
    }
  }

  // ---- Sobre escondido ----
  const handleSobreClick = () => {
    if (quizActive || dialogue.isActive) return
    if (sobreFound && showSobreModal) {
      setShowSobreModal(false)
      return
    }
    if (!sobreFound) {
      setsobreFound(true)
      saveHiddenObject('sobre_rincon_zona1')
      saveEvent('hidden_object_found', { object_key: 'sobre_rincon_zona1' })
      dialogue.startDialogue(FREUD_HIDDEN_OBJECT_FOUND)
    }
    setShowSobreModal(true)
  }

  // ---- Completar zona 1 ----
  const triggerZoneComplete = () => {
    if (zoneCompleted) return
    setZoneCompleted(true)

    // Sello
    const stamp = new Audio('/sound_stamp.mp3')
    stamp.volume = 0.8
    const isMuted = localStorage.getItem('sfx_muted') === 'true'
    stamp.muted = isMuted
    stamp.play().catch(() => { })

    setShowStamp(true)

    // Desbloquear zona 2
    setTimeout(() => {
      setZone2Unlocked(true)
      saveZoneProgress({ is_completed: true })
      saveEvent('zone_completed', { zone_key: 'zona_1_origen' })

      // Desbloquear zona 2 en DB
      if (sessionId && sessionId !== 'dev-mock') {
        supabase.from('zone_progress').upsert({
          session_id: sessionId,
          zone_key: 'zona_2_parentesis',
          is_unlocked: true,
        }, { onConflict: 'session_id,zone_key' })
      }
    }, 600)
  }

  // ---- Freud icon ----
  const handleFreudIconClick = () => {
    if (dialogue.isActive) return
    const lines = LINEAS_ESPERA[waitLineIndex % LINEAS_ESPERA.length]
    setWaitLineIndex((prev) => prev + 1)
    dialogue.startDialogue(lines)
  }

  // ---- Registrar reproducción (primera vez) ----
  const trackMichelleReproduced = useCallback(() => {
    if (michelleReproducedTracked) return
    setMichelleReproducedTracked(true)
    if (!sessionId || sessionId === 'dev-mock') return
    supabase.from('rewards_unlocked').update({ reproduced_at: new Date().toISOString() })
      .eq('session_id', sessionId).eq('reward_key', 'audio_michelle_guitarra')
      .then(() => { })
    saveEvent('reward_reproduced', { reward_key: 'audio_michelle_guitarra' })
  }, [michelleReproducedTracked, sessionId, saveEvent])

  // ---- Descargar Michelle ----
  const handleDownloadMichelle = () => {
    const a = document.createElement('a')
    a.href = '/michelle_guitarra.mp3'
    a.download = 'Michelle - Guitarra.mp3'
    a.click()
    if (michelleDownloadedTracked) return
    setMichelleDownloadedTracked(true)
    if (sessionId && sessionId !== 'dev-mock') {
      supabase.from('rewards_unlocked').update({ downloaded_at: new Date().toISOString() })
        .eq('session_id', sessionId).eq('reward_key', 'audio_michelle_guitarra')
        .then(() => { })
    }
    saveEvent('reward_downloaded', { reward_key: 'audio_michelle_guitarra' })
  }

  // ---- Cleanup audio casete ----
  useEffect(() => {
    return () => {
      if (caseteAudioRef.current) {
        caseteAudioRef.current.pause()
        caseteAudioRef.current.src = ''
      }
    }
  }, [])

  // ============================================================
  // ZONA 2 — HELPERS, INTRO Y HANDLERS
  // ============================================================

  const saveZone2Progress = useCallback(async (updates) => {
    if (!sessionId || sessionId === 'dev-mock') return
    await supabase.from('zone_progress').upsert({
      session_id: sessionId,
      zone_key: 'zona_2_parentesis',
      ...updates,
    }, { onConflict: 'session_id,zone_key' })
  }, [sessionId])

  // F-05 intro — se dispara una sola vez cuando zona 2 se desbloquea
  useEffect(() => {
    if (!zone2Unlocked || z2IntroPlayed || z2LabelChosen !== null) return
    const timer = setTimeout(() => {
      dialogue.startDialogue(F05_ZONA2, null, () => {
        setZ2IntroPlayed(true)
        setZ2Interactable(true)
      })
    }, 600)
    return () => clearTimeout(timer)
  }, [zone2Unlocked, z2IntroPlayed, z2LabelChosen])

  // ---- Abrir documento doblado ----
  const handleDocumentClick = () => {
    if (!z2Interactable || z2LabelChosen !== null || dialogue.isActive) return
    setZ2DocumentOpen(true)
  }

  // ---- Elegir etiqueta ----
  const handleLabelChoice = useCallback((label) => {
    setZ2DocumentOpen(false)
    setZ2LabelChosen(label)
    saveZone2Progress({ label_chosen: label })
    saveEvent('label_chosen', { zone: 'zona_2', label })

    setTimeout(() => {
      const response = RB_RESPONSES[label] || ['Interesante.']
      dialogue.startDialogue(response, null, () => {
        triggerZone2Complete()
      })
    }, 350)
  }, [saveZone2Progress, saveEvent])

  // ---- Completar zona 2 ----
  const triggerZone2Complete = useCallback(() => {
    if (z2Completed) return
    setZ2Completed(true)
    setZ2ShowStamp(true)

    const stamp = new Audio('/sound_stamp.mp3')
    stamp.volume = 0.6
    stamp.muted = localStorage.getItem('sfx_muted') === 'true'
    stamp.play().catch(() => { })

    setTimeout(() => {
      setZone3Unlocked(true)
      saveZone2Progress({ is_completed: true })
      saveReward('carta_informe_clinico')
      saveEvent('zone_completed', { zone_key: 'zona_2_parentesis' })

      if (sessionId && sessionId !== 'dev-mock') {
        supabase.from('zone_progress').upsert({
          session_id: sessionId,
          zone_key: 'zona_3_reencuentro',
          is_unlocked: true,
        }, { onConflict: 'session_id,zone_key' })
      }
    }, 600)
  }, [z2Completed, saveZone2Progress, saveReward, saveEvent, sessionId])

  // ---- Descargar carta PDF ----
  const handleDownloadCarta = () => {
    const a = document.createElement('a')
    a.href = '/carta_informe_clinico.pdf'
    a.download = 'Informe Clínico — El Caso Sofía.pdf'
    a.click()
    saveEvent('reward_downloaded', { reward_key: 'carta_informe_clinico' })
  }

  // ============================================================
  // ZONA 3 — HELPERS, INTRO Y HANDLERS
  // ============================================================

  const saveZone3Progress = useCallback(async (updates) => {
    if (!sessionId || sessionId === 'dev-mock') return
    await supabase.from('zone_progress').upsert({
      session_id: sessionId,
      zone_key: 'zona_3_reencuentro',
      ...updates,
    }, { onConflict: 'session_id,zone_key' })
  }, [sessionId])

  // F-06 intro
  useEffect(() => {
    if (!zone3Unlocked || z3IntroPlayed || openedHits.size > 0) return
    const timer = setTimeout(() => {
      dialogue.startDialogue(F06_ZONA3, null, () => {
        setZ3IntroPlayed(true)
        setZ3Interactable(true)
      })
    }, 600)
    return () => clearTimeout(timer)
  }, [zone3Unlocked, z3IntroPlayed, openedHits.size])

  // ---- Determinar si un hito es clickeable ----
  const isHitClickable = useCallback((hit, index) => {
    if (openedHits.has(hit.key)) return true        // ya abierto — puede rever
    if (index === 0) return true                     // el primero siempre
    const prev = TIMELINE[index - 1]
    return openedHits.has(prev.key)                  // siguiente en secuencia
  }, [openedHits])

  // ---- Clic en un punto de la línea ----
  const handleHitClick = useCallback((hit, index) => {
    if (!z3Interactable || !isHitClickable(hit, index)) return

    if (openedHits.has(hit.key)) {
      // Solo reabrir modal
      setZ3SelectedHit(hit.key)
      return
    }

    // Desbloquear
    const newSet = new Set([...openedHits, hit.key])
    setOpenedHits(newSet)
    setZ3SelectedHit(hit.key)

    // Sonido unlock
    const sound = new Audio('/sound_unlock.mp3')
    sound.volume = 0.5
    sound.muted = localStorage.getItem('sfx_muted') === 'true'
    sound.play().catch(() => { })

    // Guardar en Supabase
    if (sessionId && sessionId !== 'dev-mock') {
      supabase.from('timeline_hits').upsert({
        session_id: sessionId,
        hit_key: hit.key,
      }, { onConflict: 'session_id,hit_key' })
      saveZone3Progress({ timeline_hits_opened: newSet.size })
      saveEvent('timeline_hit_opened', { hit_key: hit.key, hit_number: index + 1 })
    }

    // Comprobar completado
    if (newSet.size >= TIMELINE.length) {
      setTimeout(() => triggerZone3Complete(), 400)
    }
  }, [z3Interactable, isHitClickable, openedHits, sessionId, saveZone3Progress, saveEvent])

  // ---- Secuencia de cierre de Fase 1 ----
  const triggerPhase1Closing = useCallback(() => {
    // Paso 1: iluminar el tablero completo
    setClosingBrightnessActive(true)

    // Paso 2: después de que la transición de brillo se establece (1.2s),
    // mostrar Freud y disparar el diálogo F-07
    setTimeout(() => {
      setClosingFreudVisible(true)
      dialogue.startDialogue(F07_CIERRE_FASE1, null, async () => {
        // Paso 3: guardar en Supabase
        if (sessionId && sessionId !== 'dev-mock') {
          supabase.from('sessions').update({ phase_1_completed: true }).eq('id', sessionId).then(() => { })
          saveEvent('zone_completed', { phase: 'phase1' })
        }
        // Paso 4: fade a negro y llamar al callback
        setPhase1FadeOut(true)
        setTimeout(() => {
          onPhase1Complete?.()
        }, 1000)
      })
    }, 1200)
  }, [dialogue, sessionId, saveEvent, onPhase1Complete])

  // ---- Completar zona 3 ----
  const triggerZone3Complete = useCallback(() => {
    if (z3Completed) return
    setZ3Completed(true)
    setZ3Illuminated(true)
    saveZone3Progress({ is_completed: true })
    saveReward('video_anecdota_reencuentro')
    saveEvent('zone_completed', { zone_key: 'zona_3_reencuentro' })
    setTimeout(() => {
      setZ3Illuminated(false)
      setTimeout(() => triggerPhase1Closing(), 500)
    }, 2200)
  }, [z3Completed, saveZone3Progress, saveReward, saveEvent, triggerPhase1Closing])

  // ---- Descargar / Ver video reencuentro ----
  const handleDownloadVideo = () => {
    const a = document.createElement('a')
    a.href = '/video_reencuentro.mp4'
    a.download = 'Video Reencuentro — El Caso Sofía.mp4'
    a.click()
    saveEvent('reward_downloaded', { reward_key: 'video_anecdota_reencuentro' })
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="relative w-screen h-screen overflow-hidden select-none"
      style={{ backgroundColor: '#0a0805' }}>

      {/* Fondo tablero */}
      <img
        src="/fondo_tablero.png"
        alt="Tablero de investigación"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Overlay oscuro */}
      <div className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.52)' }} />

      {/* Título del caso */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-center px-4">
        <h1
          style={{
            color: '#e03020',
            fontFamily: "'Georgia', serif",
            fontStyle: 'italic',
            fontSize: 'clamp(1.4rem, 3vw, 2.4rem)',
            fontWeight: 'bold',
            letterSpacing: '0.08em',
            textShadow: '0 0 12px rgba(0,0,0,1), 0 2px 16px rgba(0,0,0,0.9), 2px 2px 0 rgba(0,0,0,0.8)',
          }}
        >
          CASO SIN RESOLVER
        </h1>
        <p
          style={{
            color: '#f0e4cc',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(0.7rem, 1.4vw, 1rem)',
            marginTop: '4px',
            letterSpacing: '0.06em',
            backgroundColor: 'rgba(5,3,1,0.62)',
            padding: '3px 10px 4px',
            borderRadius: '2px',
            display: 'inline-block',
          }}
        >
          ¿Cómo dos personas terminan siendo tan importantes la una para la otra?
        </p>
      </div>

      {/* ============================================================ */}
      {/* ZONA 1 — EL ORIGEN */}
      {/* ============================================================ */}
      <div className="absolute z-10"
        style={{
          left: '5%', top: '24%', width: '28%', height: '66%',
          overflowY: 'auto', overflowX: 'hidden',
          paddingRight: '4px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(138,117,96,0.4) transparent',
          filter: closingBrightnessActive ? 'brightness(1.3)' : 'none',
          transition: 'filter 1s ease',
        }}>

        {/* Etiqueta de zona */}
        <p className="text-xs tracking-[0.3em] uppercase mb-2"
          style={{
            color: '#f0e4cc',
            fontFamily: "'Georgia', serif",
            backgroundColor: 'rgba(5,3,1,0.62)',
            padding: '2px 6px',
            borderRadius: '2px',
            display: 'inline-block',
          }}>
          Zona 1 — El Origen
        </p>

        {/* Foto */}
        <div className="relative cursor-pointer" onClick={handlePhotoClick}
          style={{ width: '100%', maxWidth: '300px' }}>
          <img
            src="/foto_zona1.jpg"
            alt="Foto del caso"
            className="w-full rounded-sm"
            style={{
              filter: photoRevealed
                ? 'blur(0px) grayscale(0%)'
                : 'blur(8px) grayscale(100%)',
              transition: 'filter 1.5s ease-out',
            }}
            draggable={false}
          />
          {/* Overlay "Identifique al sujeto" */}
          {!quizCompleted && !quizActive && introPlayed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <span
                className="px-4 py-2 text-sm tracking-widest uppercase"
                style={{
                  color: '#d4c5a9',
                  fontFamily: "'Courier New', monospace",
                  backgroundColor: 'rgba(10,8,5,0.6)',
                  border: '1px solid rgba(138,117,96,0.4)',
                }}
              >
                Identifique al sujeto
              </span>
            </motion.div>
          )}
        </div>

        {/* QUIZ */}
        <AnimatePresence>
          {quizActive && !quizCompleted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 p-3 rounded"
              style={{
                backgroundColor: 'rgba(10,8,5,0.85)',
                border: '1px solid rgba(138,117,96,0.3)',
                maxWidth: '300px',
              }}
            >
              <p className="text-xs mb-2" style={{
                color: '#8a7560',
                fontFamily: "'Georgia', serif",
              }}>
                Pregunta {quizQuestionIndex + 1} de {QUIZ_QUESTIONS.length}
              </p>
              <p className="text-sm mb-3" style={{
                color: '#d4c5a9',
                fontFamily: "'Courier New', monospace",
                lineHeight: 1.5,
              }}>
                {QUIZ_QUESTIONS[quizQuestionIndex]?.text}
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={quizInput}
                  onChange={(e) => setQuizInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleQuizSubmit() }}
                  placeholder="Tu respuesta..."
                  className="flex-1 px-2 py-1 text-sm rounded outline-none"
                  style={{
                    backgroundColor: 'rgba(212,197,169,0.1)',
                    border: '1px solid rgba(138,117,96,0.4)',
                    color: '#d4c5a9',
                    fontFamily: "'Courier New', monospace",
                  }}
                  autoFocus
                />
                <button
                  onClick={handleQuizSubmit}
                  className="px-3 py-1 text-xs rounded cursor-pointer transition-colors"
                  style={{
                    backgroundColor: 'rgba(138,117,96,0.3)',
                    border: '1px solid #8a7560',
                    color: '#d4c5a9',
                    fontFamily: "'Courier New', monospace",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(138,117,96,0.5)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(138,117,96,0.3)'}
                >
                  Responder
                </button>
              </div>

              {/* Feedback */}
              {quizFeedback === 'correct' && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-xs"
                  style={{ color: '#7dae7d', fontFamily: "'Courier New', monospace" }}
                >
                  Correcto.
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* T-01 — Texto al pie de la foto */}
        <AnimatePresence>
          {showT01 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mt-2 text-xs leading-relaxed"
              style={{
                color: '#f0e4cc',
                fontFamily: "'Courier New', monospace",
                fontStyle: 'italic',
                maxWidth: '300px',
                backgroundColor: 'rgba(5,3,1,0.68)',
                padding: '6px 8px',
                borderRadius: '2px',
              }}
            >
              {T01_FOTO}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Casete + Sobre en fila */}
        <div className="flex items-center gap-4 mt-4">

          {/* Casete */}
          <div
            className="relative cursor-pointer flex-shrink-0"
            style={{ width: '110px' }}
            onClick={handleCaseteClick}
            onMouseEnter={(e) => {
              const img = e.currentTarget.querySelector('img')
              if (img) img.style.filter = 'brightness(1.25) drop-shadow(0 2px 8px rgba(201,168,76,0.5))'
            }}
            onMouseLeave={(e) => {
              const img = e.currentTarget.querySelector('img')
              if (img) img.style.filter = 'brightness(1.05) drop-shadow(0 2px 6px rgba(0,0,0,0.7))'
            }}
          >
            <img
              src="/casete.png"
              alt="Casete"
              className="w-full transition-all duration-300"
              style={{
                filter: 'brightness(1.05) drop-shadow(0 2px 6px rgba(0,0,0,0.7))',
                pointerEvents: 'none',
              }}
              draggable={false}
            />
          </div>

          {/* Sobre escondido — a la derecha del casete */}
          <div
            className="flex-shrink-0 cursor-pointer"
            style={{
              pointerEvents: quizActive ? 'none' : 'auto',
            }}
            onMouseEnter={() => !quizActive && setSobreHover(true)}
            onMouseLeave={() => setSobreHover(false)}
            onClick={handleSobreClick}
          >
            <img
              src="/sobre_pequeno.png"
              alt=""
              style={{
                width: '52px',
                opacity: sobreFound ? 1 : (sobreHover ? 0.9 : 0.35),
                transition: 'opacity 0.4s ease',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))',
                pointerEvents: 'none',
              }}
              draggable={false}
            />
          </div>

        </div>


        {/* T-02 panel — texto del casete */}
        <AnimatePresence>
          {showT02 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-3 p-3 rounded"
              style={{
                backgroundColor: 'rgba(10,8,5,0.85)',
                border: '1px solid rgba(201,168,76,0.3)',
                maxWidth: '300px',
              }}
            >
              <p className="text-xs leading-relaxed mb-3" style={{
                color: '#ede0c4',
                fontFamily: "'Courier New', monospace",
                fontStyle: 'italic',
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
              }}>
                {T02_CASETE}
              </p>

              {/* Botones de reward */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!caseteAudioRef.current) {
                      // Restaurado desde reload — crear el audio ahora
                      const audio = new Audio('/michelle_guitarra.mp3')
                      audio.volume = 0.4
                      audio.loop = true
                      const isMuted = localStorage.getItem('sfx_muted') === 'true'
                      audio.muted = isMuted
                      caseteAudioRef.current = audio
                      const handleMuteChange = (e) => { audio.muted = e.detail.muted }
                      window.addEventListener('mutechange', handleMuteChange)
                    }
                    if (caseteAudioPlaying) {
                      caseteAudioRef.current.pause()
                      setCaseteAudioPlaying(false)
                      window.dispatchEvent(new CustomEvent('michelle_ambient_resume'))
                    } else {
                      caseteAudioRef.current.play().catch(() => { })
                      setCaseteAudioPlaying(true)
                      trackMichelleReproduced()
                      window.dispatchEvent(new CustomEvent('michelle_ambient_pause'))
                    }
                  }}
                  className="px-3 py-1 text-xs rounded cursor-pointer transition-colors"
                  style={{
                    backgroundColor: 'rgba(201,168,76,0.2)',
                    border: '1px solid rgba(201,168,76,0.4)',
                    color: '#c9a84c',
                    fontFamily: "'Courier New', monospace",
                  }}
                >
                  {caseteAudioPlaying ? '⏸ Pausar' : '▶ Escuchar'}
                </button>
                <button
                  onClick={handleDownloadMichelle}
                  className="px-3 py-1 text-xs rounded cursor-pointer transition-colors"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(201,168,76,0.3)',
                    color: '#c9a84c',
                    fontFamily: "'Courier New', monospace",
                  }}
                >
                  ⬇ Descargar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Sello rojo de completado */}
        <AnimatePresence>
          {showStamp && (
            <motion.img
              src="/sello_rojo.png"
              alt="Zona completada"
              initial={{ scale: 2, rotate: -15, opacity: 0 }}
              animate={{ scale: 2, rotate: -8, opacity: 0.9 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute pointer-events-none"
              style={{ top: '10%', right: '5%', width: '90px' }}
              draggable={false}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ============================================================ */}
      {/* ZONA 2 — EL PARÉNTESIS */}
      {/* ============================================================ */}
      <div className="absolute z-10"
        style={{
          left: '36%', top: '24%', width: '28%', height: '66%',
          filter: closingBrightnessActive
            ? 'brightness(1.3)'
            : zone2Unlocked ? 'none' : 'blur(4px)',
          opacity: zone2Unlocked ? 1 : 0.4,
          transition: 'filter 1s ease, opacity 1s ease',
          pointerEvents: (zone2Unlocked && z2Interactable) ? 'auto' : 'none',
        }}>

        {/* Overlay azul-gris sutil */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: 'rgba(60,60,80,0.08)', zIndex: 0 }} />

        {/* Contenido con sepia */}
        <div style={{ filter: 'sepia(40%)', position: 'relative', zIndex: 1 }}>

          {/* Etiqueta de zona */}
          <p className="text-xs tracking-[0.3em] uppercase mb-4"
            style={{
              color: '#f0e4cc',
              fontFamily: "'Georgia', serif",
              backgroundColor: 'rgba(5,3,1,0.62)',
              padding: '2px 6px',
              borderRadius: '2px',
              display: 'inline-block',
            }}>
            Zona 2 — El Paréntesis
          </p>

          {/* Documento doblado */}
          <div className="relative flex justify-center">
            <div
              className="relative cursor-pointer"
              style={{ width: '70%', maxWidth: '220px' }}
              onClick={handleDocumentClick}
            >
              <img
                src="/documento_doblado.png"
                alt="Documento clasificado"
                className="w-full transition-all duration-300"
                style={{
                  mixBlendMode: 'multiply',
                  filter: z2LabelChosen ? 'brightness(1)' : 'brightness(0.95)',
                }}
                onMouseEnter={(e) => { if (!z2LabelChosen) e.currentTarget.style.filter = 'brightness(1.1)' }}
                onMouseLeave={(e) => { e.currentTarget.style.filter = z2LabelChosen ? 'brightness(1)' : 'brightness(0.95)' }}
                draggable={false}
              />

              {/* Indicador de clic cuando interactable y no completado */}
              {z2Interactable && !z2LabelChosen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <span className="text-xs tracking-widest uppercase px-2 py-1"
                    style={{
                      color: '#f0e4cc',
                      fontFamily: "'Courier New', monospace",
                      backgroundColor: 'rgba(5,3,1,0.65)',
                      border: '1px solid rgba(136,136,128,0.4)',
                    }}>
                    Desplegar
                  </span>
                </motion.div>
              )}

              {/* Etiqueta elegida — sello de texto sobre el documento */}
              <AnimatePresence>
                {z2LabelChosen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 1.3 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <span
                      style={{
                        fontFamily: "'Courier New', monospace",
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        color: '#4a5568',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        transform: 'rotate(-12deg)',
                        display: 'inline-block',
                        textShadow: '1px 1px 0 rgba(255,255,255,0.4)',
                        border: '2px solid #4a5568',
                        padding: '2px 8px',
                        backgroundColor: 'rgba(255,255,255,0.15)',
                      }}
                    >
                      {z2LabelChosen}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sello azul de completado */}
              <AnimatePresence>
                {z2ShowStamp && (
                  <motion.img
                    src="/sello_azul.png"
                    alt="Zona completada"
                    initial={{ scale: 2, rotate: -15, opacity: 0 }}
                    animate={{ scale: 2, rotate: -10, opacity: 0.9 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="absolute pointer-events-none"
                    style={{ top: '-10%', right: '-15%', width: '70px' }}
                    draggable={false}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Recompensa — carta PDF */}
          <AnimatePresence>
            {z2Completed && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="mt-4 flex justify-center"
              >
                <button
                  onClick={handleDownloadCarta}
                  className="px-3 py-2 text-xs rounded cursor-pointer transition-colors"
                  style={{
                    backgroundColor: 'rgba(74,85,104,0.2)',
                    border: '1px solid rgba(74,85,104,0.5)',
                    color: '#c8d0dc',
                    fontFamily: "'Courier New', monospace",
                    letterSpacing: '0.05em',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(74,85,104,0.4)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(74,85,104,0.2)'}
                >
                  📄 Leer / Descargar informe
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL — DOCUMENTO DOBLADO ZONA 2 */}
      {/* ============================================================ */}
      <AnimatePresence>
        {z2DocumentOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="p-7 rounded max-w-lg w-[90vw] max-h-[85vh] overflow-y-auto"
              style={{
                backgroundColor: 'rgba(245,238,220,0.97)',
                border: '1px solid rgba(138,117,96,0.3)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Encabezado */}
              <p className="text-xs tracking-[0.25em] uppercase mb-4"
                style={{
                  color: '#8a7560',
                  fontFamily: "'Georgia', serif",
                  borderBottom: '1px solid rgba(138,117,96,0.3)',
                  paddingBottom: '8px',
                }}>
                Archivo clasificado — 2022–2024
              </p>

              {/* T-03 — "perdón" es la palabra subrayada (objeto escondido) */}
              <p className="text-sm leading-relaxed"
                style={{
                  color: '#3a3228',
                  fontFamily: "'Courier New', monospace",
                  lineHeight: 1.75,
                }}>
                {(() => {
                  // Subrayar la primera ocurrencia de "perdón" en el texto
                  const target = 'perdón'
                  const idx = T03_DOCUMENTO.indexOf(target)
                  if (idx === -1) return T03_DOCUMENTO
                  const before = T03_DOCUMENTO.slice(0, idx)
                  const after = T03_DOCUMENTO.slice(idx + target.length)
                  return (
                    <>
                      {before}
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          // Parpadeo de 400ms
                          setPalabraParpadeo(true)
                          setTimeout(() => setPalabraParpadeo(false), 400)
                          // Mini-diálogo
                          setHiddenDialogue({
                            lines: ['Esa palabra en particular. Interesante que la haya notado.'],
                          })
                          if (!palabraFound) {
                            setPalabraFound(true)
                            saveHiddenObject('palabra_subrayada_zona2')
                            saveEvent('hidden_object_found', { object_key: 'palabra_subrayada_zona2' })
                          }
                        }}
                        style={{
                          borderBottom: '1px solid #8a7560',
                          cursor: 'default',
                          animation: palabraParpadeo ? 'palabraFlash 400ms ease' : 'none',
                          display: 'inline',
                        }}
                      >
                        {target}
                      </span>
                      {after}
                    </>
                  )
                })()}
              </p>
              <style>{`
                @keyframes palabraFlash {
                  0% { opacity: 1; }
                  25% { opacity: 0; }
                  75% { opacity: 0; }
                  100% { opacity: 1; }
                }
              `}</style>

              {/* Separador */}
              <div className="my-5" style={{ borderTop: '1px solid rgba(138,117,96,0.35)' }} />

              {/* Pregunta de Freud */}
              <p className="text-xs mb-3"
                style={{
                  color: '#5a4a3a',
                  fontFamily: "'Georgia', serif",
                  fontStyle: 'italic',
                }}>
                "¿Cómo llamarías a este período?"
              </p>

              {/* Etiquetas */}
              <div className="flex flex-wrap gap-2">
                {Z2_LABELS.map((label) => (
                  <button
                    key={label}
                    onClick={() => handleLabelChoice(label)}
                    className="px-3 py-1 text-xs rounded cursor-pointer transition-all duration-200"
                    style={{
                      border: '1px solid #8a7560',
                      backgroundColor: 'transparent',
                      color: '#3a3228',
                      fontFamily: "'Courier New', monospace",
                      letterSpacing: '0.05em',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#8a7560'
                      e.currentTarget.style.color = '#ffffff'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = '#3a3228'
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* ZONA 3 — EL REENCUENTRO */}
      {/* ============================================================ */}
      <div className="absolute z-10"
        style={{
          left: '67%', top: '24%', width: '28%', height: '66%',
          filter: closingBrightnessActive
            ? 'brightness(1.3)'
            : zone3Unlocked ? 'none' : 'blur(4px)',
          opacity: zone3Unlocked ? 1 : 0.4,
          transition: 'filter 1s ease, opacity 1s ease',
          pointerEvents: (zone3Unlocked && z3Interactable) ? 'auto' : 'none',
        }}>

        <style>{`
          @keyframes hitPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.7); }
            50% { box-shadow: 0 0 0 7px rgba(201,168,76,0); transform: scale(1.25); }
          }
        `}</style>

        {/* Etiqueta zona */}
        <p className="text-xs tracking-[0.3em] uppercase mb-3"
          style={{
            color: '#f0e4cc',
            fontFamily: "'Georgia', serif",
            backgroundColor: 'rgba(5,3,1,0.62)',
            padding: '2px 6px',
            borderRadius: '2px',
            display: 'inline-block',
          }}>
          Zona 3 — El Reencuentro
        </p>

        {/* NOTA INTRODUCTORIA */}
        <AnimatePresence>
          {z3Interactable && !z3TimelineVisible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="flex flex-col items-center text-center"
              style={{ padding: '0 4px' }}
            >
              <p
                className="text-xs leading-relaxed whitespace-pre-line mb-5"
                style={{
                  color: '#d4c5a9',
                  fontFamily: "'Courier New', monospace",
                  fontStyle: 'italic',
                  textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                }}
              >
                {NOTA_Z3}
              </p>
              <button
                onClick={() => setZ3TimelineVisible(true)}
                className="px-4 py-2 text-xs rounded cursor-pointer transition-all duration-200"
                style={{
                  backgroundColor: 'rgba(201,168,76,0.15)',
                  border: '1px solid rgba(201,168,76,0.5)',
                  color: '#c9a84c',
                  fontFamily: "'Courier New', monospace",
                  letterSpacing: '0.06em',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(201,168,76,0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(201,168,76,0.15)'}
              >
                Ver la línea de tiempo →
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* LÍNEA DE TIEMPO */}
        <AnimatePresence>
          {z3TimelineVisible && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Contenedor scrollable horizontal */}
              <div style={{ overflowX: 'auto', paddingBottom: '8px', paddingTop: '36px' }}>
                <div style={{ position: 'relative', minWidth: '580px', height: '60px' }}>

                  {/* Línea dorada horizontal */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '14px',
                    right: '14px',
                    height: '2px',
                    backgroundColor: '#c9a84c',
                    transform: 'translateY(-50%)',
                  }} />

                  {/* Puntos — distribuidos con space-between */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '14px',
                    right: '14px',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    {TIMELINE.map((hit, i) => {
                      const isOpen = openedHits.has(hit.key)
                      const clickable = isHitClickable(hit, i)
                      const dotSize = hit.isEnCurso ? 20 : 14

                      return (
                        <div
                          key={hit.key}
                          style={{
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                          }}
                        >
                          {/* Candado */}
                          <div style={{ height: '26px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '3px' }}>
                            {!isOpen && !hit.isEnCurso && (
                              <img
                                src="/candado.png"
                                alt=""
                                style={{
                                  height: '18px',
                                  mixBlendMode: 'multiply',
                                  opacity: clickable ? 0.9 : 0.45,
                                  filter: 'brightness(1.8)',
                                  pointerEvents: 'none',
                                }}
                              />
                            )}
                          </div>

                          {/* Punto */}
                          <div
                            onClick={() => handleHitClick(hit, i)}
                            title={hit.fecha || 'En curso'}
                            style={{
                              width: `${dotSize}px`,
                              height: `${dotSize}px`,
                              borderRadius: '50%',
                              border: hit.isEnCurso
                                ? '2px dashed #c9a84c'
                                : '2px solid #c9a84c',
                              backgroundColor: isOpen ? '#c9a84c' : 'rgba(10,8,5,0.85)',
                              cursor: clickable ? 'pointer' : 'default',
                              transition: 'background-color 0.3s, transform 0.2s',
                              flexShrink: 0,
                              animation: (z3Illuminated && isOpen)
                                ? 'hitPulse 0.45s ease-out 5'
                                : 'none',
                            }}
                            onMouseEnter={(e) => {
                              if (clickable) e.currentTarget.style.transform = 'scale(1.3)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)'
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Progreso textual */}
              <p className="text-xs mt-2"
                style={{
                  color: 'rgba(201,168,76,0.7)',
                  fontFamily: "'Courier New', monospace",
                  textAlign: 'center',
                }}>
                {openedHits.size} / {TIMELINE.length} momentos
              </p>

              {/* Recompensa — video */}
              <AnimatePresence>
                {z3Completed && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="mt-4 flex justify-center"
                  >
                    <button
                      onClick={handleDownloadVideo}
                      className="px-3 py-2 text-xs rounded cursor-pointer transition-colors"
                      style={{
                        backgroundColor: 'rgba(201,168,76,0.15)',
                        border: '1px solid rgba(201,168,76,0.5)',
                        color: '#c9a84c',
                        fontFamily: "'Courier New', monospace",
                        letterSpacing: '0.05em',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(201,168,76,0.3)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(201,168,76,0.15)'}
                    >
                      🎥 Ver / Descargar video
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ============================================================ */}
      {/* MODAL — HITO DE LÍNEA DE TIEMPO (ZONA 3) */}
      {/* ============================================================ */}
      <AnimatePresence>
        {z3SelectedHit && (() => {
          const hit = TIMELINE.find((h) => h.key === z3SelectedHit)
          if (!hit) return null
          return (
            <motion.div
              key={z3SelectedHit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-50 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
              onClick={() => setZ3SelectedHit(null)}
            >
              <motion.div
                initial={{ scale: 0.94, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.94, y: 16 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="p-6 rounded max-w-md w-[88vw] max-h-[80vh] overflow-y-auto relative"
                style={{
                  backgroundColor: 'rgba(245,238,220,0.97)',
                  border: '1px solid rgba(201,168,76,0.4)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Cerrar */}
                <button
                  onClick={() => setZ3SelectedHit(null)}
                  className="absolute top-3 right-4 text-xs cursor-pointer"
                  style={{ color: '#8a7560', fontFamily: "'Georgia', serif" }}
                >
                  ✕
                </button>

                {hit.isEnCurso ? (
                  /* Hito en curso — solo la frase */
                  <div className="flex items-center justify-center" style={{ minHeight: '120px' }}>
                    <p style={{
                      fontFamily: "'Georgia', serif",
                      fontSize: '1.1rem',
                      color: '#3a3228',
                      textAlign: 'center',
                      fontStyle: 'italic',
                      lineHeight: 1.7,
                    }}>
                      {hit.texto}
                    </p>
                  </div>
                ) : (
                  /* Hito normal */
                  <>
                    {hit.fecha && (
                      <p className="text-xs uppercase tracking-widest mb-1"
                        style={{ color: '#8a7560', fontFamily: "'Georgia', serif", filter: 'sepia(60%)' }}>
                        {hit.fecha}
                      </p>
                    )}
                    {hit.titulo && (
                      <p className="text-xs mb-3"
                        style={{
                          color: '#5a4a3a',
                          fontFamily: "'Courier New', monospace",
                          fontStyle: 'italic',
                          borderBottom: '1px solid rgba(138,117,96,0.25)',
                          paddingBottom: '8px',
                        }}>
                        {hit.titulo}
                      </p>
                    )}
                    <p className="text-sm leading-relaxed"
                      style={{
                        color: '#3a3228',
                        fontFamily: "'Courier New', monospace",
                        lineHeight: 1.75,
                      }}>
                      {hit.texto}
                    </p>
                    {hit.tieneFoto && hit.fotoFile && (
                      <img
                        src={`/${hit.fotoFile}`}
                        alt=""
                        className="mt-4 w-full rounded"
                        style={{
                          borderRadius: '4px',
                          border: '1px solid rgba(138,117,96,0.3)',
                          filter: 'sepia(20%)',
                        }}
                        draggable={false}
                      />
                    )}
                  </>
                )}
              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MODAL DEL SOBRE */}
      {/* ============================================================ */}
      <AnimatePresence>
        {showSobreModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
            onClick={() => setShowSobreModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="p-6 rounded max-w-md"
              style={{
                backgroundColor: 'rgba(10,8,5,0.95)',
                border: '1px solid #c9a84c',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-xs uppercase tracking-widest mb-3"
                style={{ color: '#c9a84c', fontFamily: "'Georgia', serif" }}>
                3 de diciembre de 2021
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-line"
                style={{
                  color: '#d4c5a9',
                  fontFamily: "'Courier New', monospace",
                }}>
                {HITO06_SOBRE}
              </p>
              <button
                onClick={() => setShowSobreModal(false)}
                className="mt-4 text-xs cursor-pointer"
                style={{ color: '#8a7560' }}
              >
                Cerrar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* ÍCONO DE FREUD */}
      {/* ============================================================ */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        onClick={handleFreudIconClick}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-3 py-2
                   rounded-lg cursor-pointer border transition-all duration-300"
        style={{
          backgroundColor: 'rgba(10, 8, 5, 0.7)',
          borderColor: 'rgba(138, 117, 96, 0.3)',
          color: '#8a7560',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#8a7560'
          e.currentTarget.style.backgroundColor = 'rgba(10, 8, 5, 0.9)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(138, 117, 96, 0.3)'
          e.currentTarget.style.backgroundColor = 'rgba(10, 8, 5, 0.7)'
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        </svg>
        <span className="text-xs tracking-widest uppercase"
          style={{ fontFamily: "'Georgia', serif" }}>
          Freud
        </span>
      </motion.button>

      {/* ============================================================ */}
      {/* CIERRE FASE 1 — Freud mirando (Pose 2) */}
      {/* Aparece en el borde izquierdo durante el diálogo F-07 */}
      {/* ============================================================ */}
      <AnimatePresence>
        {closingFreudVisible && (
          <motion.img
            src="/freud_mirando.png"
            alt="Freud"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            draggable={false}
            style={{
              position: 'fixed',
              left: 0,
              bottom: 0,
              height: '35vh',
              width: 'auto',
              zIndex: 30,
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* CIERRE FASE 1 — Fade a negro */}
      {/* ============================================================ */}
      <AnimatePresence>
        {phase1FadeOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: 'easeIn' }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: '#000',
              zIndex: 60,
              pointerEvents: 'all',
            }}
          />
        )}
      </AnimatePresence>

      {/* Diálogo de Freud */}
      {dialogue.isActive && (
        <DialogueBox
          key={dialogue.dialogueId}
          lines={dialogue.lines}
          options={dialogue.options}
          onComplete={dialogue.handleComplete}
          onOptionSelect={dialogue.handleOptionSelect}
          placement="center"
        />
      )}

      {/* Mini-diálogo para objetos escondidos */}
      {hiddenDialogue && (
        <DialogueBox
          key={hiddenDialogue.lines[0]}
          lines={hiddenDialogue.lines}
          onComplete={() => setHiddenDialogue(null)}
          placement="center"
        />
      )}

      {/* Mute */}
      <MuteButton />
    </div>
  )
}
