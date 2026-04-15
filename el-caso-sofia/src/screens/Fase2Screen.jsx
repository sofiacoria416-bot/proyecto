import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MuteButton from '../components/MuteButton'
import DialogueBox from '../components/DialogueBox'
import { useDialogue } from '../hooks/useDialogue'
import { supabase } from '../lib/supabase'
import { F08_BIENVENIDA, F09_ARCHIVO004, F10_ARCHIVO005, F11_ARCHIVO006, F12_DIAGNOSTICO_FINAL, LINEAS_ESPERA } from '../data/freudDialogues'
import { FICHAS, ETIQUETAS, getReaccionFreud, T07_DIAGNOSTICO, T08_CAJA, TIMELINE } from '../data/content'

/**
 * Fase2Screen — Experiencia completa de la Fase 2 (Diagnóstico)
 *
 * Flujo:
 * 1. Consultorio con luz cálida (sepia 15%) + Freud de pie
 * 2. Clic en Freud → F-08 (bienvenida cumpleaños)
 * 3. F-08 completa → transición al tablero (fade negro + puerta)
 * 4. Tablero: izquierda = zonas Fase 1 completadas (no interactivas)
 *             derecha = 3 archivos de Fase 2 en columna
 * 5. F-09 se reproduce automáticamente la primera vez en el tablero
 * 6. Archivo 004: sobre → modal carta T-05 + boleto descargable
 */

const SCENE_CONSULTORIO = 'consultorio'
const SCENE_TRANSITIONING = 'transitioning'
const SCENE_TABLERO = 'tablero'

// ============================================================
// T-05 — TEXTO DEL SOBRE SELLADO CON CERA (Archivo 004)
// Fuente: MIS_TEXTOS_template.md — sección T-05
// ============================================================
const T05_TEXTO = [
  'Fua. Es 16 de abril de 2026. Tenes 18 años. I cant believe it wacho.',
  'ES TU CUMPLEAÑOS; y no podría estar más feliz y emocionado. Y, por cierto, es el primer cumpleaños en el que estoy presente. Es re loco decir eso, pero considerando que te conozco desde hace casi 5 años, no es un dato menor.',
  'Pero, a pesar de los 5 años que puedan exponer las fechas, siento que te conozco hace poco, pero que formaste parte de mí toda la vida. Y me encanta vivir esa vida, la mia, disfrutandote.',
  'Pasaste de ser la persona a la que menos confianza le tuve en mi existencia, a ser uno de los pilares de mi futuro. Y sobre tu "ser" podría decir la típica: "sos tantas cosas que no podría describir", pero estaría errado. No sos muchas cosas.',
  'De hecho todo lo que sos y serás en el futuro se podría describir en una sola palabra (sí, así de poderosa es): hermosa.',
  'Ser hermosa implica una sola cosa encima: la entrega del alma.',
  'La belleza exterior se desgasta y considerarla una variable que defina si alguien es hermosa o no, como hace unos días hacía, es un error. Reflexionando, me dí cuenta de que la entrega del alma es lo que define si alguien es hermosa o no. Y vos sin dudas lo sos. La entrega constante a superarte, a morir a tus formas de ser y hacer, a cuidar a tu cuerpo, a entender que dependes de Dios, a abandonar el pasado y dejar que Él haga todo nuevo. Tal vez no lo decis o entendes con estas palabras, pero estoy seguro de que tu espíritu comprende cada día más que la hermosura de tu ser depende de entender y vivir el valor que Dios le puso a tu alma: el mismo valor de Jesús.',
  'Dejarás de ser hermosa el día que tu entrega desaparezca.',
  'Pero, un secreto: cuanto más tiempo pasás con Dios, más imposible se hace alejarse. Te lo digo por experiencia propia.',
  'Feliz cumpleaños hermosa, te amo.',
]

export default function Fase2Screen({ session }) {
  const sessionId = session?.id

  // ---- Escena ----
  const [scene, setScene] = useState(SCENE_CONSULTORIO)
  const [sceneLoaded, setSceneLoaded] = useState(false)
  const [overlayOpacity, setOverlayOpacity] = useState(0.15)

  // ---- Consultorio ----
  const [freudClicked, setFreudClicked] = useState(false)
  const [freudLoaded, setFreudLoaded] = useState(false)

  // ---- Tablero — Archivo 004 ----
  const [f09Played, setF09Played] = useState(false)
  const [sobreOpened, setSobreOpened] = useState(false)
  const [sobreAnimating, setSobreAnimating] = useState(false)
  const [archivo005Unlocked, setArchivo005Unlocked] = useState(false)
  const [connectionLineVisible, setConnectionLineVisible] = useState(false)
  const [showSobreModal, setShowSobreModal] = useState(false)
  const [waitLineIndex, setWaitLineIndex] = useState(0)

  // ---- Tablero — Archivo 005 ----
  const [f10Played, setF10Played] = useState(false)
  const [fichaLabels, setFichaLabels] = useState({}) // { ficha_01: 'sintoma', ... }
  const [selectedFicha, setSelectedFicha] = useState(null) // ficha abierta en modal
  const [fichasOrdenadas, setFichasOrdenadas] = useState(false) // animacion de ordenado
  const [archivo005Completed, setArchivo005Completed] = useState(false)
  const [fotoArchivoRevealed, setFotoArchivoRevealed] = useState(false)
  const [archivo006Unlocked, setArchivo006Unlocked] = useState(false)
  const [connectionLine005Visible, setConnectionLine005Visible] = useState(false)

  // ---- Tablero — Archivo 006 ----
  const [f11Played, setF11Played] = useState(false)
  const [audioPlayed, setAudioPlayed] = useState(false)
  const [showCajaModal, setShowCajaModal] = useState(false)
  const [cajaFound, setCajaFound] = useState(false)
  const [archivo006Completed, setArchivo006Completed] = useState(false)
  // Secuencia final
  const [finalSequenceStarted, setFinalSequenceStarted] = useState(false)
  const [boardIlluminated, setBoardIlluminated] = useState(false)
  const [freudSenalando, setFreudSenalando] = useState(false)
  const [finalScreenVisible, setFinalScreenVisible] = useState(false)
  const [freudFadingOut, setFreudFadingOut] = useState(false)
  const [playingTrack, setPlayingTrack] = useState('none') // 'none' | 'risk' | 'michelle'
  const michelleAudioRef = useRef(null)

  const audioConsultorioRef = useRef(null)
  const audioTableroRef = useRef(null)
  const dialogue = useDialogue()

  // ============================================================
  // CARGAR PROGRESO DE SUPABASE
  // ============================================================
  useEffect(() => {
    const loadProgress = async () => {
      if (!sessionId || sessionId === 'dev-mock') {
        setSceneLoaded(true)
        return
      }

      const { data: archives } = await supabase
        .from('archive_progress')
        .select('*')
        .eq('session_id', sessionId)

      const a004 = archives?.find((a) => a.archive_key === 'archivo_004_nunca_fue')
      const a005 = archives?.find((a) => a.archive_key === 'archivo_005_sintomas')
      const a006 = archives?.find((a) => a.archive_key === 'archivo_006_caso_cerrado')

      if (a004) {
        if (a004.sobre_opened) {
          setSobreOpened(true)
          setConnectionLineVisible(true)
        }
        if (a004.is_unlocked) {
          setScene(SCENE_TABLERO)
          setF09Played(true)
        }
      }

      if (a005?.is_unlocked) {
        setArchivo005Unlocked(true)
        if (a005.fichas_all_labeled) {
          setArchivo005Completed(true)
          setFichasOrdenadas(true)
          setFotoArchivoRevealed(true)
          setConnectionLine005Visible(true)
          setF10Played(true)
        }
      }

      if (a006?.is_unlocked) {
        setArchivo006Unlocked(true)
      }

      // Cargar etiquetas de fichas guardadas
      const { data: labels } = await supabase
        .from('ficha_labels')
        .select('*')
        .eq('session_id', sessionId)
      if (labels && labels.length > 0) {
        const labelsMap = {}
        labels.forEach((l) => { labelsMap[l.ficha_key] = l.label_chosen })
        setFichaLabels(labelsMap)
      }

      setSceneLoaded(true)
    }

    loadProgress()
  }, [sessionId])

  // ============================================================
  // AUDIO — Consultorio (Fase 2)
  // ============================================================
  useEffect(() => {
    if (scene === SCENE_TABLERO || !sceneLoaded) return

    const audio = new Audio()
    audio.preload = 'auto'
    audio.loop = true
    audio.volume = 0.2
    audio.src = '/sound_consultorio_ambiente.mp3'
    audioConsultorioRef.current = audio

    const isMuted = localStorage.getItem('sfx_muted') === 'true'
    audio.muted = isMuted

    let started = false
    const tryPlay = () => {
      if (started) return
      audio.play().then(() => {
        started = true
        document.removeEventListener('click', tryPlay, true)
        document.removeEventListener('touchstart', tryPlay, true)
      }).catch(() => { })
    }

    document.addEventListener('click', tryPlay, true)
    document.addEventListener('touchstart', tryPlay, true)
    tryPlay()

    const handleMuteChange = (e) => { audio.muted = e.detail.muted }
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
  }, [scene, sceneLoaded])

  // ============================================================
  // AUDIO — Tablero
  // ============================================================
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

    const handleMuteChange = (e) => { audio.muted = e.detail.muted }
    window.addEventListener('mutechange', handleMuteChange)

    return () => {
      started = true
      audio.pause()
      audio.src = ''
      audioTableroRef.current = null
      document.removeEventListener('click', tryPlay, true)
      window.removeEventListener('mutechange', handleMuteChange)
    }
  }, [scene])

  // ============================================================
  // F-09 — Auto-play al entrar al tablero por primera vez
  // ============================================================
  useEffect(() => {
    if (scene !== SCENE_TABLERO || f09Played || !sceneLoaded) return

    const timer = setTimeout(() => {
      dialogue.startDialogue(F09_ARCHIVO004, null, () => {
        setF09Played(true)
      })
    }, 800)
    return () => clearTimeout(timer)
  }, [scene, f09Played, sceneLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================================
  // F-10 — Auto-play cuando se desbloquea Archivo 005
  // ============================================================
  useEffect(() => {
    if (!archivo005Unlocked || f10Played || !sceneLoaded || dialogue.isActive) return
    const timer = setTimeout(() => {
      dialogue.startDialogue(F10_ARCHIVO005, null, () => setF10Played(true))
    }, 600)
    return () => clearTimeout(timer)
  }, [archivo005Unlocked, f10Played, sceneLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================================
  // F-11 — Auto-play cuando se desbloquea Archivo 006
  // ============================================================
  useEffect(() => {
    if (!archivo006Unlocked || f11Played || !sceneLoaded || dialogue.isActive) return
    const timer = setTimeout(() => {
      dialogue.startDialogue(F11_ARCHIVO006, null, () => setF11Played(true))
    }, 800)
    return () => clearTimeout(timer)
  }, [archivo006Unlocked, f11Played, sceneLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================================
  // GUARDAR EN SUPABASE
  // ============================================================
  const saveEvent = useCallback(async (type, detail = {}) => {
    if (!sessionId || sessionId === 'dev-mock') return
    await supabase.from('session_events').insert({
      session_id: sessionId,
      event_type: type,
      event_detail: detail,
    })
  }, [sessionId])

  // ---- Guardar etiqueta de ficha ----
  const saveFichaLabel = useCallback(async (fichaKey, labelKey) => {
    if (!sessionId || sessionId === 'dev-mock') return
    await supabase.from('ficha_labels').upsert({
      session_id: sessionId,
      ficha_key: fichaKey,
      label_chosen: labelKey,
    }, { onConflict: 'session_id,ficha_key' })
  }, [sessionId])

  const saveArchiveProgress = useCallback(async (archiveKey, updates) => {
    if (!sessionId || sessionId === 'dev-mock') return
    await supabase.from('archive_progress').upsert({
      session_id: sessionId,
      archive_key: archiveKey,
      ...updates,
    }, { onConflict: 'session_id,archive_key' })
  }, [sessionId])

  // ============================================================
  // HANDLER — Audio Archivo 006 reproducido
  // ============================================================
  const handleAudio006Played = useCallback(async () => {
    if (audioPlayed) return
    setAudioPlayed(true)

    if (sessionId && sessionId !== 'dev-mock') {
      await supabase.from('rewards_unlocked').upsert({
        session_id: sessionId,
        reward_key: 'audio_risk_it_all_guitarra',
        reproduced_at: new Date().toISOString(),
      }, { onConflict: 'session_id,reward_key' })
    }

    saveEvent('audio_played', { reward_key: 'audio_risk_it_all_guitarra' })
    saveArchiveProgress('archivo_006_caso_cerrado', {
      is_completed: true,
      completed_at: new Date().toISOString(),
    })
    setArchivo006Completed(true)
    // La secuencia final se inicia cuando Risk It All termina (evento 'ended')
    // No se auto-dispara aquí para dejar que el usuario escuche la canción completa
  }, [audioPlayed, sessionId, saveEvent, saveArchiveProgress]) // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================================
  // SECUENCIA FINAL
  // ============================================================
  const triggerFinalSequence = useCallback(async () => {
    if (finalSequenceStarted) return
    setFinalSequenceStarted(true)

    // 1. Iluminar todo el tablero (brightness)
    setBoardIlluminated(true)
    await new Promise((r) => setTimeout(r, 1500))

    // 2. Freud aparece al centro
    setFreudSenalando(true)
    await new Promise((r) => setTimeout(r, 1000))

    // 3. Arrancar michelle_guitarra — Risk It All sigue sonando

    const michelle = new Audio('/michelle_guitarra.mp3')
    michelle.volume = 0
    michelle.loop = true
    const isMuted = localStorage.getItem('sfx_muted') === 'true'
    michelle.muted = isMuted
    michelleAudioRef.current = michelle
    michelle.play().catch(() => { })
    setPlayingTrack('michelle')

    // Fade in del volumen en 3s
    let vol = 0
    const fadeIn = setInterval(() => {
      vol = Math.min(0.3, vol + 0.01)
      michelle.volume = vol
      if (vol >= 0.3) clearInterval(fadeIn)
    }, 100)

    // F-12 dialogue
    dialogue.startDialogue(F12_DIAGNOSTICO_FINAL, null, () => {
      // 4. Freud fade out
      setFreudFadingOut(true)
      setTimeout(() => {
        setFreudSenalando(false)
        setFreudFadingOut(false)
        // 5. Pantalla final quieta
        setFinalScreenVisible(true)
      }, 2000)
    })

    // 7. Guardar completado en Supabase
    if (sessionId && sessionId !== 'dev-mock') {
      await supabase.from('sessions').update({
        phase_2_completed: true,
        phase_2_completed_at: new Date().toISOString(),
      }).eq('id', sessionId)

      // Verificar si todos los hidden_objects fueron encontrados
      const { data: hidden } = await supabase
        .from('hidden_objects')
        .select('object_key')
        .eq('session_id', sessionId)

      const allObjects = ['sobre_rincon_zona1', 'libro_estante_consultorio', 'reloj_consultorio', 'palabra_subrayada_zona2', 'caja_archivo006']
      const foundKeys = (hidden || []).map((h) => h.object_key)
      const allFound = allObjects.every((k) => foundKeys.includes(k))

      await supabase.from('sessions').update({
        experience_fully_completed: allFound,
        ...(allFound ? { experience_completed_at: new Date().toISOString() } : {}),
      }).eq('id', sessionId)

      saveEvent('experience_completed', { all_hidden_found: allFound })
    }
  }, [finalSequenceStarted, dialogue, sessionId, saveEvent]) // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================================
  // TOGGLE DE AUDIO (Risk It All ⇄ Michelle) en pantalla final
  // ============================================================
  const toggleAudio = useCallback(() => {
    const isMuted = localStorage.getItem('sfx_muted') === 'true'

    if (playingTrack === 'michelle') {
      // Pasar a Risk It All
      const michelle = michelleAudioRef.current
      if (michelle) {
        // Fade out Michelle
        const fadeOut = setInterval(() => {
          if (michelle.volume > 0.02) michelle.volume = Math.max(0, michelle.volume - 0.02)
          else { michelle.volume = 0; michelle.pause(); clearInterval(fadeOut) }
        }, 50)
      }
      // Crear / reproducir Risk It All
      let risk = document.getElementById('audio-risk')
      if (!risk) {
        risk = document.createElement('audio')
        risk.id = 'audio-risk'
        risk.src = '/risk_it_all_guitarra.mp3'
        risk.loop = true
        risk.volume = 0
        risk.muted = isMuted
        document.body.appendChild(risk)
      }
      risk.play().catch(() => { })
      // Fade in Risk It All
      const fadeIn = setInterval(() => {
        if (risk.volume < 0.78) risk.volume = Math.min(0.8, risk.volume + 0.02)
        else { risk.volume = 0.8; clearInterval(fadeIn) }
      }, 50)
      setPlayingTrack('risk')
    } else {
      // Pasar a Michelle
      const risk = document.getElementById('audio-risk')
      if (risk) {
        const fadeOut = setInterval(() => {
          if (risk.volume > 0.02) risk.volume = Math.max(0, risk.volume - 0.02)
          else { risk.volume = 0; risk.pause(); clearInterval(fadeOut) }
        }, 50)
      }
      let michelle = michelleAudioRef.current
      if (!michelle || michelle.ended) {
        michelle = new Audio('/michelle_guitarra.mp3')
        michelle.loop = true
        michelle.volume = 0
        michelle.muted = isMuted
        michelleAudioRef.current = michelle
      }
      michelle.volume = 0
      michelle.play().catch(() => { })
      const fadeIn = setInterval(() => {
        if (michelle.volume < 0.28) michelle.volume = Math.min(0.3, michelle.volume + 0.02)
        else { michelle.volume = 0.3; clearInterval(fadeIn) }
      }, 50)
      setPlayingTrack('michelle')
    }
  }, [playingTrack])
  // ============================================================
  const startTransition = useCallback(() => {
    setScene(SCENE_TRANSITIONING)
    setOverlayOpacity(1)

    // Fade out audio del consultorio
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
      }, 50)
    }

    setTimeout(() => {
      // Sonido de puerta
      const puerta = new Audio('/sound_puerta.mp3')
      puerta.volume = 0.6
      const isMuted = localStorage.getItem('sfx_muted') === 'true'
      puerta.muted = isMuted
      const handleMuteChange = (e) => { puerta.muted = e.detail.muted }
      window.addEventListener('mutechange', handleMuteChange)
      puerta.play().catch(() => { })

      // Marcar que el tablero fue alcanzado (para skipear el consultorio en reload)
      saveArchiveProgress('archivo_004_nunca_fue', { is_unlocked: true })

      setTimeout(() => {
        setScene(SCENE_TABLERO)
        setOverlayOpacity(0)
        setTimeout(() => window.removeEventListener('mutechange', handleMuteChange), 3000)
      }, 400)
    }, 800)
  }, [saveArchiveProgress])

  // ============================================================
  // HANDLERS — Consultorio
  // ============================================================
  const handleFreudClick = useCallback(() => {
    if (freudClicked || dialogue.isActive) return
    setFreudClicked(true)

    if (sessionId && sessionId !== 'dev-mock') {
      supabase.from('session_events').insert({
        session_id: sessionId,
        event_type: 'freud_dialogue_started',
        event_detail: { phase: 'phase2', dialogue: 'F08' },
      }).then(() => { })
    }

    dialogue.startDialogue(F08_BIENVENIDA, null, () => {
      startTransition()
    })
  }, [freudClicked, dialogue, sessionId, startTransition])

  // ============================================================
  // HANDLERS — Sobre (Archivo 004)
  // ============================================================
  const handleSobreClick = useCallback(() => {
    // Si ya está abierto, permitir re-leer
    if (sobreOpened) {
      setShowSobreModal(true)
      return
    }

    // Primera apertura: requiere que F-09 haya terminado
    if (!f09Played) return

    // Animación de apertura
    setSobreAnimating(true)
    setTimeout(() => setSobreAnimating(false), 300)

    // Sonido
    const sound = new Audio('/sound_sobre.mp3')
    const isMuted = localStorage.getItem('sfx_muted') === 'true'
    sound.muted = isMuted
    const handleMuteChange = (e) => { sound.muted = e.detail.muted }
    window.addEventListener('mutechange', handleMuteChange)
    sound.play().catch(() => { })
    setTimeout(() => window.removeEventListener('mutechange', handleMuteChange), 5000)

    // Actualizar estado local
    setSobreOpened(true)
    setConnectionLineVisible(true)
    setArchivo005Unlocked(true)
    setTimeout(() => setShowSobreModal(true), 250)

    // Guardar en Supabase
    saveArchiveProgress('archivo_004_nunca_fue', {
      sobre_opened: true,
      is_completed: true,
      is_unlocked: true,
      completed_at: new Date().toISOString(),
    })
    saveArchiveProgress('archivo_005_sintomas', {
      is_unlocked: true,
      unlocked_at: new Date().toISOString(),
    })
    saveEvent('archive_completed', { archive_key: 'archivo_004_nunca_fue' })

    // Registrar recompensa
    if (sessionId && sessionId !== 'dev-mock') {
      supabase.from('rewards_unlocked').upsert({
        session_id: sessionId,
        reward_key: 'boleto_merienda',
      }, { onConflict: 'session_id,reward_key' }).then(() => { })
    }
  }, [f09Played, sobreOpened, saveArchiveProgress, saveEvent, sessionId])

  const handleDownloadBoleto = useCallback(() => {
    const link = document.createElement('a')
    link.href = '/boleto_merienda.png'
    link.download = 'boleto_merienda.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    if (sessionId && sessionId !== 'dev-mock') {
      supabase.from('rewards_unlocked').upsert({
        session_id: sessionId,
        reward_key: 'boleto_merienda',
        downloaded_at: new Date().toISOString(),
      }, { onConflict: 'session_id,reward_key' }).then(() => { })
      saveEvent('reward_downloaded', { reward_key: 'boleto_merienda' })
    }
  }, [sessionId, saveEvent])

  const handleFreudIconClick = useCallback(() => {
    if (dialogue.isActive) return
    const lines = LINEAS_ESPERA[waitLineIndex % LINEAS_ESPERA.length]
    setWaitLineIndex((prev) => prev + 1)
    dialogue.startDialogue(lines)
  }, [dialogue, waitLineIndex])

  // ============================================================
  // HANDLER — Etiquetar ficha (Archivo 005)
  // ============================================================
  const handleEtiquetaElegida = useCallback((fichaKey, etiquetaKey) => {
    // Actualizar estado local
    const newLabels = { ...fichaLabels, [fichaKey]: etiquetaKey }
    setFichaLabels(newLabels)
    setSelectedFicha(null)

    // Guardar en Supabase
    saveFichaLabel(fichaKey, etiquetaKey)
    saveEvent('label_chosen', { ficha: fichaKey, label: etiquetaKey })

    // Respuesta reactiva de Freud (R-C)
    const lines = getReaccionFreud(fichaKey, etiquetaKey)
    dialogue.startDialogue(lines)

    // Verificar si las 5 fichas están etiquetadas
    const todosLabeled = FICHAS.every((f) => newLabels[f.key])
    if (todosLabeled && !archivo005Completed) {
      // Esperar que Freud termine para ordenar
      const onFreudDone = () => {
        setTimeout(() => {
          setFichasOrdenadas(true)
          // Revelar foto con sonido
          setTimeout(() => {
            setFotoArchivoRevealed(true)
            const rev = new Audio('/sound_reveal.mp3')
            rev.volume = 0.6
            const isMuted = localStorage.getItem('sfx_muted') === 'true'
            rev.muted = isMuted
            rev.play().catch(() => { })
          }, 900)
          setArchivo005Completed(true)
          setConnectionLine005Visible(true)

          // Guardar completado en Supabase
          saveArchiveProgress('archivo_005_sintomas', {
            fichas_all_labeled: true,
            is_completed: true,
            completed_at: new Date().toISOString(),
          })
          saveArchiveProgress('archivo_006_caso_cerrado', {
            is_unlocked: true,
            unlocked_at: new Date().toISOString(),
          })
          saveEvent('archive_completed', { archive_key: 'archivo_005_sintomas' })
          if (sessionId && sessionId !== 'dev-mock') {
            supabase.from('rewards_unlocked').upsert({
              session_id: sessionId,
              reward_key: 'foto_archivo_005',
            }, { onConflict: 'session_id,reward_key' }).then(() => { })
          }
          setTimeout(() => setArchivo006Unlocked(true), 1200)
        }, 400)
      }
      // Encadenar al final del diálogo
      dialogue.startDialogue(lines, null, onFreudDone)
    }
  }, [fichaLabels, selectedFicha, archivo005Completed, dialogue, saveFichaLabel, saveEvent, saveArchiveProgress, sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================================
  // RENDER — Pantalla negra mientras carga
  // ============================================================
  if (!sceneLoaded) {
    return <div className="w-screen h-screen bg-black" />
  }

  // ============================================================
  // RENDER — TABLERO (Fase 2)
  // ============================================================
  if (scene === SCENE_TABLERO) {
    return (
      <div className="relative w-screen h-screen overflow-hidden select-none">
        {/* Fondo tablero */}
        <img
          src="/fondo_tablero.png"
          alt="Tablero de investigación"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Overlay leve para dar contraste al contenido */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
        />

        {/* Layout: izquierda = zonas Fase 1, derecha = archivos Fase 2 */}
        <div
          className="absolute inset-0 flex"
          style={{ padding: '4vh 3vw', overflowY: 'auto', alignItems: 'flex-start' }}
        >
          {/* ── MITAD IZQUIERDA: Zonas Anamnesis completadas ── */}
          <div
            className="flex flex-col gap-3"
            style={{
              width: '42%',
              paddingRight: '2vw',
              pointerEvents: 'none',
              opacity: 0.6,
              alignSelf: 'flex-start',
              position: 'sticky',
              top: 0,
            }}
          >
            {[
              { num: 'I', title: 'El Origen', sello: '/sello_rojo.png' },
              { num: 'II', title: 'El Paréntesis', sello: '/sello_rojo.png' },
              { num: 'III', title: 'El Reencuentro', sello: '/sello_rojo.png' },
            ].map((zona) => (
              <div
                key={zona.num}
                style={{
                  background: 'rgba(10, 8, 5, 0.7)',
                  border: '1px solid rgba(201, 168, 76, 0.35)',
                  borderRadius: '6px',
                  padding: '14px 18px',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    color: '#c9a84c',
                    fontSize: '9px',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                    fontFamily: 'monospace',
                  }}
                >
                  Zona {zona.num}
                </div>
                <div
                  style={{
                    color: '#e8d9b8',
                    fontSize: '13px',
                    fontFamily: 'Georgia, serif',
                  }}
                >
                  {zona.title}
                </div>
                <img
                  src={zona.sello}
                  alt="Completado"
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '12px',
                    height: '34px',
                    width: 'auto',
                    opacity: 0.85,
                  }}
                />
              </div>
            ))}
          </div>

          {/* ── SEPARADOR VERTICAL ── */}
          <div
            style={{
              width: '1px',
              background: 'rgba(201, 168, 76, 0.2)',
              margin: '6vh 0',
              flexShrink: 0,
            }}
          />

          {/* ── MITAD DERECHA: Archivos Fase 2 ── */}
          <div
            className="flex flex-col"
            style={{ flex: 1, paddingLeft: '2vw', gap: 0, paddingBottom: '4vh', alignSelf: 'flex-start' }}
          >
            {/* ── ARCHIVO 004 ── */}
            <div
              style={{
                background: 'rgba(10, 8, 5, 0.75)',
                border: '1px solid rgba(201, 168, 76, 0.5)',
                borderRadius: '8px',
                padding: '20px 24px',
              }}
            >
              <div
                style={{
                  color: '#c9a84c',
                  fontSize: '9px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                  fontFamily: 'monospace',
                }}
              >
                Archivo 004
              </div>
              <div
                style={{
                  color: '#e8d9b8',
                  fontSize: '14px',
                  fontFamily: 'Georgia, serif',
                  marginBottom: '18px',
                }}
              >
                Lo que nunca fue y ahora es
              </div>

              {/* Sobre — sin mixBlendMode para que sea visible sobre fondo oscuro */}
              <div className="flex flex-col items-center">
                <motion.img
                  src={sobreOpened ? '/sobre_grande_abierto.png' : '/sobre_grande.png'}
                  alt="Sobre sellado con cera"
                  animate={sobreAnimating ? { scale: 1.05 } : { scale: 1 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  onClick={handleSobreClick}
                  draggable={false}
                  style={{
                    height: '280px',
                    width: 'auto',
                    cursor: f09Played ? 'pointer' : 'default',
                    opacity: f09Played ? 1 : 0.55,
                    transition: 'opacity 0.6s ease',
                    filter: 'brightness(1) drop-shadow(0 4px 16px rgba(0,0,0,0.5))',
                    objectFit: 'contain',
                  }}
                  onMouseEnter={(e) => {
                    if (f09Played) e.currentTarget.style.filter = 'brightness(1.1) drop-shadow(0 4px 16px rgba(0,0,0,0.5))'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'brightness(1) drop-shadow(0 4px 16px rgba(0,0,0,0.5))'
                  }}
                />
                <p
                  style={{
                    color: '#b8a88a',
                    fontSize: '12px',
                    fontStyle: 'italic',
                    marginTop: '10px',
                    textAlign: 'center',
                    maxWidth: '300px',
                    lineHeight: 1.5,
                  }}
                >
                  "Este archivo lo preparó alguien que no soy yo."
                </p>
              </div>
            </div>

            {/* ── LÍNEA DORADA CONECTOR 004 → 005 ── */}
            <div style={{ padding: '0 24px', height: '20px', display: 'flex', alignItems: 'center' }}>
              <AnimatePresence>
                {connectionLineVisible && (
                  <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
                    style={{
                      flex: 1,
                      height: '1px',
                      background: 'linear-gradient(90deg, rgba(201,168,76,0.6), rgba(201,168,76,0.2))',
                      transformOrigin: 'left',
                    }}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* ── ARCHIVO 005 ── */}
            <motion.div
              animate={{
                opacity: archivo005Unlocked ? 1 : 0.35,
                filter: archivo005Unlocked ? 'blur(0px)' : 'blur(2px)',
              }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                background: 'rgba(10, 8, 5, 0.75)',
                border: `1px solid ${archivo005Unlocked ? 'rgba(201, 168, 76, 0.5)' : 'rgba(201, 168, 76, 0.15)'}`,
                borderRadius: '8px',
                padding: '20px 24px',
                transition: 'border-color 0.8s ease',
                pointerEvents: archivo005Unlocked ? 'auto' : 'none',
              }}
            >
              <div style={{ color: archivo005Unlocked ? '#c9a84c' : '#6a5a3a', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '4px', fontFamily: 'monospace' }}>
                Archivo 005
              </div>
              <div style={{ color: archivo005Unlocked ? '#e8d9b8' : '#6a5e48', fontSize: '14px', fontFamily: 'Georgia, serif', marginBottom: archivo005Unlocked ? '16px' : '0' }}>
                Síntomas seleccionados
              </div>

              {/* Fichas en abanico o columna */}
              {archivo005Unlocked && (
                <>
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: fichasOrdenadas ? 'column' : 'row',
                      justifyContent: fichasOrdenadas ? 'flex-start' : 'center',
                      alignItems: fichasOrdenadas ? 'stretch' : 'flex-end',
                      gap: fichasOrdenadas ? '8px' : '6px',
                      minHeight: fichasOrdenadas ? 'auto' : '130px',
                      transition: 'all 0.8s ease',
                      flexWrap: fichasOrdenadas ? 'nowrap' : 'nowrap',
                    }}
                  >
                    {FICHAS.map((ficha, i) => {
                      const rotations = [-6, -3, 0, 3, 6]
                      const labeled = fichaLabels[ficha.key]
                      return (
                        <motion.div
                          key={ficha.key}
                          onClick={() => {
                            if (!labeled && f10Played) setSelectedFicha(ficha)
                          }}
                          animate={fichasOrdenadas
                            ? { rotate: 0, x: 0, zIndex: 1 }
                            : { rotate: rotations[i], x: (i - 2) * 4, y: Math.abs(i - 2) * -3, zIndex: i }
                          }
                          transition={{ duration: 0.8, ease: 'easeOut', delay: fichasOrdenadas ? i * 0.1 : 0 }}
                          style={{
                            background: 'rgba(245, 238, 220, 0.97)',
                            border: `1px solid ${labeled ? '#8a7560' : '#c9a84c'}`,
                            borderRadius: '4px',
                            padding: '12px 14px',
                            cursor: labeled ? 'default' : (f10Played ? 'pointer' : 'default'),
                            position: 'relative',
                            width: fichasOrdenadas ? '100%' : '130px',
                            flexShrink: 0,
                            transformOrigin: 'bottom center',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
                          }}
                        >
                          {labeled && (
                            <div style={{
                              position: 'absolute', top: '6px', right: '6px',
                              background: '#8a7560', color: '#fff',
                              fontSize: '9px', padding: '2px 6px', borderRadius: '3px',
                              fontFamily: 'monospace', textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}>
                              {ETIQUETAS.find(e => e.key === labeled)?.label || labeled}
                            </div>
                          )}
                          <div style={{ color: '#8a7560', fontSize: '8px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px', fontFamily: 'monospace', paddingRight: labeled ? '60px' : '0' }}>
                            {ficha.titulo}
                          </div>
                          {fichasOrdenadas && labeled && (
                            <div style={{ color: '#8a7560', fontSize: '9px', fontFamily: 'monospace', marginTop: '2px' }}>
                              → {ETIQUETAS.find(e => e.key === labeled)?.label || labeled}
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Diagnóstico al completar las 5 fichas */}
                  <AnimatePresence>
                    {archivo005Completed && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.5 }}
                      >
                        <div style={{ height: '1px', background: 'rgba(201,168,76,0.3)', marginBottom: '10px' }} />
                        <p style={{ color: '#c9a84c', fontSize: '9px', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Diagnóstico · Sofía · {new Date().toLocaleDateString('es-AR')}
                        </p>
                        {FICHAS.map((f) => (
                          <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px', gap: '8px' }}>
                            <span style={{ color: '#b8a88a', fontSize: '8px', fontFamily: 'monospace', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{f.titulo}</span>
                            <span style={{ color: '#c9a84c', fontSize: '8px', fontFamily: 'monospace', textTransform: 'uppercase', flexShrink: 0 }}>
                              {ETIQUETAS.find(e => e.key === fichaLabels[f.key])?.label || '—'}
                            </span>
                          </div>
                        ))}

                        {/* Foto revelada — tamaño controlado */}
                        <div style={{ marginTop: '12px' }}>
                          <img
                            src="/foto_archivo_005.jpg"
                            alt="Foto Archivo 005"
                            style={{
                              width: '100%',
                              maxHeight: '160px',
                              objectFit: 'cover',
                              objectPosition: 'center top',
                              borderRadius: '3px',
                              display: 'block',
                              filter: fotoArchivoRevealed ? 'grayscale(0%)' : 'grayscale(100%)',
                              transition: 'filter 1.5s ease-out',
                            }}
                            draggable={false}
                          />
                          <button
                            onClick={() => {
                              const a = document.createElement('a')
                              a.href = '/foto_archivo_005.jpg'
                              a.download = 'foto_archivo_005.jpg'
                              a.click()
                              if (sessionId && sessionId !== 'dev-mock') {
                                supabase.from('rewards_unlocked').upsert({ session_id: sessionId, reward_key: 'foto_archivo_005', downloaded_at: new Date().toISOString() }, { onConflict: 'session_id,reward_key' })
                              }
                            }}
                            style={{ marginTop: '6px', background: 'rgba(201,168,76,0.2)', border: '1px solid rgba(201,168,76,0.4)', color: '#c9a84c', fontSize: '10px', fontFamily: 'monospace', padding: '5px 12px', borderRadius: '3px', cursor: 'pointer', width: '100%' }}
                          >
                            ⬇ Descargar foto
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!archivo005Unlocked && (
                    <p style={{ color: '#6a5a3a', fontSize: '11px', marginTop: '8px', fontStyle: 'italic' }}>
                      — Completá el Archivo 004 para continuar
                    </p>
                  )}
                </>
              )}
            </motion.div>

            {/* ── ESPACIADO ── */}
            <div style={{ height: '12px' }} />

            {/* ── ARCHIVO 006 ── */}
            <motion.div
              animate={{
                opacity: archivo006Unlocked ? 1 : 0.35,
                filter: archivo006Unlocked
                  ? `blur(0px) brightness(${boardIlluminated ? 1.4 : 1})`
                  : 'blur(2px)',
              }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{
                background: 'rgba(10, 8, 5, 0.75)',
                border: `1px solid ${archivo006Unlocked ? 'rgba(201,168,76,0.5)' : 'rgba(201,168,76,0.12)'}`,
                borderRadius: '8px',
                padding: '20px 24px',
                position: 'relative',
                transition: 'border-color 1s ease',
                pointerEvents: archivo006Unlocked && !finalSequenceStarted ? 'auto' : 'none',
              }}
            >
              <div style={{ color: archivo006Unlocked ? '#c9a84c' : '#6a5a3a', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '4px', fontFamily: 'monospace' }}>
                Archivo 006
              </div>
              <div style={{ color: archivo006Unlocked ? '#e8d9b8' : '#6a5e48', fontSize: '14px', fontFamily: 'Georgia, serif', marginBottom: '14px' }}>
                El caso cerrado
              </div>

              {archivo006Unlocked && (
                <>
                  {/* ELEMENTO 1: Línea de tiempo compacta */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ color: '#8a7560', fontSize: '8px', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: '6px' }}>2008 — 2026</div>
                    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {TIMELINE.filter(h => !h.isEnCurso).map((hito) => (
                        <div
                          key={hito.key}
                          title={hito.titulo || hito.texto}
                          style={{
                            width: '8px', height: '8px',
                            borderRadius: '50%',
                            background: '#c9a84c',
                            opacity: 0.8,
                            flexShrink: 0,
                          }}
                        />
                      ))}
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(201,168,76,0.35)', border: '1px dashed #c9a84c', flexShrink: 0 }} />
                    </div>
                  </div>

                  {/* ELEMENTO 2: Reproductor de audio */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '4px', padding: '10px 12px' }}>
                    <img src="/casete.png" alt="casete" style={{ width: '40px', height: '40px', objectFit: 'contain', opacity: 0.85 }} draggable={false} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#c9a84c', fontSize: '9px', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Risk It All — guitarra</div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          id="btn-play-risk"
                          onClick={() => {
                            const existing = document.getElementById('audio-risk')
                            if (existing) {
                              if (existing.paused) {
                                const tablero = audioTableroRef.current
                                if (tablero && !tablero.paused) {
                                  const fade = setInterval(() => {
                                    if (tablero.volume > 0.02) tablero.volume = Math.max(0, tablero.volume - 0.03)
                                    else { tablero.volume = 0; tablero.pause(); clearInterval(fade) }
                                  }, 50)
                                }
                                existing.play()
                                handleAudio006Played()
                                triggerFinalSequence()
                              } else {
                                existing.pause()
                              }
                              return
                            }
                            // Mutear ambiente del tablero
                            const tablero = audioTableroRef.current
                            if (tablero && !tablero.paused) {
                              const fade = setInterval(() => {
                                if (tablero.volume > 0.02) tablero.volume = Math.max(0, tablero.volume - 0.03)
                                else { tablero.volume = 0; tablero.pause(); clearInterval(fade) }
                              }, 50)
                            }
                            const audio = document.createElement('audio')
                            audio.id = 'audio-risk'
                            audio.src = '/risk_it_all_guitarra.mp3'
                            audio.volume = 0.8
                            const isMuted = localStorage.getItem('sfx_muted') === 'true'
                            audio.muted = isMuted
                            document.body.appendChild(audio)
                            audio.play().then(() => {
                              handleAudio006Played()
                              // La secuencia arranca mientras la canción suena
                              triggerFinalSequence()
                            }).catch(() => { })
                          }}
                          style={{ background: audioPlayed ? 'rgba(201,168,76,0.3)' : 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.5)', color: '#c9a84c', fontSize: '10px', fontFamily: 'monospace', padding: '4px 10px', borderRadius: '3px', cursor: 'pointer' }}
                        >
                          {audioPlayed ? '▶ Reproducir otro' : '▶ Play'}
                        </button>
                        <button
                          onClick={() => {
                            const a = document.createElement('a'); a.href = '/risk_it_all_guitarra.mp3'; a.download = 'risk_it_all_guitarra.mp3'; a.click()
                            if (sessionId && sessionId !== 'dev-mock') supabase.from('rewards_unlocked').upsert({ session_id: sessionId, reward_key: 'audio_risk_it_all_guitarra', downloaded_at: new Date().toISOString() }, { onConflict: 'session_id,reward_key' })
                          }}
                          style={{ background: 'transparent', border: '1px solid rgba(201,168,76,0.3)', color: '#8a7560', fontSize: '10px', fontFamily: 'monospace', padding: '4px 10px', borderRadius: '3px', cursor: 'pointer' }}
                        >
                          ⬇
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ELEMENTO 3: T-07 Diagnóstico oficial */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.3 }}
                    style={{ textAlign: 'center', borderTop: '1px solid rgba(201,168,76,0.2)', paddingTop: '12px', marginBottom: '12px' }}
                  >
                    <p style={{ color: '#d4c5a9', fontFamily: 'Georgia, serif', fontSize: '14px', lineHeight: 1.7, fontStyle: 'italic' }}>
                      {T07_DIAGNOSTICO}
                    </p>
                  </motion.div>

                  {/* ELEMENTO 4: Caja escondida (rincón inferior derecho) */}
                  <div
                    style={{ position: 'absolute', bottom: '160px', right: '120px', width: '100px', height: '100px', cursor: 'pointer' }}
                    onMouseEnter={(e) => {
                      const img = e.currentTarget.querySelector('img')
                      img.style.opacity = '1'
                      img.style.filter = 'drop-shadow(0 0 12px rgba(201,168,76,0.75)) brightness(1.3)'
                    }}
                    onMouseLeave={(e) => {
                      const img = e.currentTarget.querySelector('img')
                      img.style.opacity = '1'
                      img.style.filter = 'none'
                    }}
                    onClick={() => {
                      if (!cajaFound) {
                        setCajaFound(true)
                        if (sessionId && sessionId !== 'dev-mock') {
                          supabase.from('hidden_objects').upsert({ session_id: sessionId, object_key: 'caja_archivo006' }, { onConflict: 'session_id,object_key' })
                          saveEvent('hidden_object_found', { object_key: 'caja_archivo006' })
                        }
                      }
                      setShowCajaModal(true)
                    }}
                  >
                    <img
                      src="/caja_pequena.png"
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        opacity: 0,
                        filter: 'none',
                        transition: 'opacity 0.3s ease, filter 0.3s ease',
                        mixBlendMode: 'multiply',
                      }}
                      draggable={false}
                    />
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </div>

        {/* ── ÍCONO DE FREUD (para líneas sueltas) ── */}
        <button
          onClick={handleFreudIconClick}
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '24px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            opacity: 0.65,
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.65' }}
        >
          <img
            src="/freud_de_pie.png"
            alt="Freud"
            style={{ height: '64px', width: 'auto' }}
            draggable={false}
          />
        </button>

        {/* ── DIALOGUE BOX ── */}
        {dialogue.isActive && (
          <DialogueBox
            key={dialogue.dialogueId}
            lines={dialogue.lines}
            options={dialogue.options}
            onComplete={dialogue.handleComplete}
            onOptionSelect={dialogue.handleOptionSelect}
          />
        )}

        {/* ── MODAL: CAJA ESCONDIDA (Archivo 006) ── */}
        <AnimatePresence>
          {showCajaModal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,15,10,0.95)', padding: '24px' }}
              onClick={(e) => { if (e.target === e.currentTarget) setShowCajaModal(false) }}
            >
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{ maxWidth: '420px', width: '100%', padding: '44px 48px', background: 'rgba(20,15,10,0.98)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '4px', position: 'relative' }}
              >
                <button onClick={() => setShowCajaModal(false)} style={{ position: 'absolute', top: '12px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#8a6a3a', fontSize: '20px' }}>×</button>
                <div style={{ color: '#8a7560', fontSize: '8px', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: '20px' }}>Objeto encontrado</div>
                <p style={{ color: '#d4c5a9', fontFamily: 'Georgia, serif', fontSize: '15px', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{T08_CAJA}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SECUENCIA FINAL: Freud señalando al centro ── */}
        <AnimatePresence>
          {freudSenalando && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: freudFadingOut ? 0 : 1 }} exit={{ opacity: 0 }}
              transition={{ duration: freudFadingOut ? 2 : 1, ease: 'easeInOut' }}
              style={{ position: 'fixed', inset: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}
            >
              <img src="/freud_senalando.png" alt="Freud" style={{ height: '50vh', objectFit: 'contain', filter: 'drop-shadow(0 0 40px rgba(201,168,76,0.3))' }} draggable={false} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── PANTALLA FINAL QUIETA (T-07 al centro + boton swap) ── */}
        <AnimatePresence>
          {finalScreenVisible && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 1.5, ease: 'easeIn' }}
              style={{ position: 'fixed', inset: 0, zIndex: 35, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(5,3,2,0.6)', padding: '48px' }}
            >
              {/* T-07 — no interactivo */}
              <p style={{ color: '#d4c5a9', fontFamily: 'Georgia, serif', fontSize: 'clamp(16px, 2.2vw, 24px)', lineHeight: 1.9, textAlign: 'center', maxWidth: '580px', fontStyle: 'italic', pointerEvents: 'none' }}>
                {T07_DIAGNOSTICO}
              </p>
              {/* Botón de intercambio de música */}
              <button
                onClick={toggleAudio}
                style={{
                  marginTop: '32px',
                  background: 'rgba(10,8,5,0.7)',
                  border: '1px solid rgba(201,168,76,0.35)',
                  color: '#c9a84c',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  letterSpacing: '0.1em',
                  padding: '8px 20px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  opacity: 0.7,
                  transition: 'opacity 0.2s ease',
                  pointerEvents: 'auto',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7' }}
              >
                {playingTrack === 'michelle' ? '♫ Cambiar a Risk It All' : '♫ Cambiar a Michelle'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── MODAL: FICHA CLÍNICA (Archivo 005) ── */}
        <AnimatePresence>
          {selectedFicha && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.82)', padding: '24px' }}
              onClick={(e) => { if (e.target === e.currentTarget) setSelectedFicha(null) }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.96 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                style={{ background: 'rgba(245, 238, 220, 0.98)', border: '1px solid #c9a84c', borderRadius: '4px', maxWidth: '560px', width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '40px 44px', position: 'relative' }}
              >
                {/* Cerrar */}
                <button onClick={() => setSelectedFicha(null)} style={{ position: 'absolute', top: '12px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#8a6a3a', fontSize: '20px', lineHeight: 1 }}>×</button>

                {/* Encabezado */}
                <div style={{ color: '#8a7560', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: '6px' }}>
                  Escuela Freudiana de Buenos Aires · Archivo 005
                </div>
                <h2 style={{ color: '#2a1f14', fontFamily: 'monospace', fontSize: '14px', fontWeight: 'bold', marginBottom: '20px', lineHeight: 1.4 }}>
                  {selectedFicha.titulo}
                </h2>

                {/* Contenido */}
                <p style={{ color: '#2a1f14', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.75', marginBottom: '28px', whiteSpace: 'pre-line' }}>
                  {selectedFicha.contenido}
                </p>

                {/* Separador */}
                <hr style={{ border: 'none', borderTop: '1px solid rgba(201,168,76,0.35)', marginBottom: '20px' }} />

                {/* Pregunta de Freud */}
                <p style={{ color: '#6a5040', fontFamily: 'Georgia, serif', fontSize: '13px', fontStyle: 'italic', marginBottom: '14px' }}>
                  ¿Cómo clasificarías este caso?
                </p>

                {/* Botones de etiqueta */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {ETIQUETAS.map((et) => (
                    <button
                      key={et.key}
                      onClick={() => handleEtiquetaElegida(selectedFicha.key, et.key)}
                      style={{
                        border: '1px solid #8a7560',
                        background: 'transparent',
                        color: '#2a1f14',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        padding: '6px 14px',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease, color 0.2s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#8a7560'; e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#2a1f14' }}
                    >
                      {et.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── MODAL: CARTA DEL SOBRE ── */}
        <AnimatePresence>
          {showSobreModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.78)',
                padding: '24px',
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowSobreModal(false)
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.97 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{
                  background: 'rgba(245, 238, 220, 0.98)',
                  border: '1px solid #c9a84c',
                  borderRadius: '4px',
                  maxWidth: '640px',
                  width: '100%',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  padding: '52px 56px',
                  position: 'relative',
                }}
              >
                {/* Botón cerrar */}
                <button
                  onClick={() => setShowSobreModal(false)}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '20px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#8a6a3a',
                    fontSize: '22px',
                    lineHeight: 1,
                    padding: '4px 8px',
                  }}
                >
                  ×
                </button>

                {/* Texto de la carta */}
                {T05_TEXTO.map((paragraph, i) => (
                  <p
                    key={i}
                    style={{
                      fontFamily: 'Georgia, serif',
                      color: '#2a1f14',
                      fontSize: '15px',
                      lineHeight: '1.9',
                      marginBottom: i < T05_TEXTO.length - 1 ? '1.3em' : 0,
                    }}
                  >
                    {paragraph}
                  </p>
                ))}

                {/* Separador */}
                <hr
                  style={{
                    margin: '36px 0 28px',
                    border: 'none',
                    borderTop: '1px solid rgba(201, 168, 76, 0.35)',
                  }}
                />

                {/* Boleto */}
                <div
                  className="flex flex-col items-center"
                  style={{ gap: '16px' }}
                >
                  <img
                    src="/boleto_merienda.png"
                    alt="Boleto de merienda"
                    style={{
                      maxWidth: '500px',
                      width: '100%',
                      display: 'block',
                    }}
                  />
                  <button
                    onClick={handleDownloadBoleto}
                    style={{
                      background: '#c9a84c',
                      color: '#1a1408',
                      border: 'none',
                      borderRadius: '3px',
                      padding: '11px 30px',
                      fontSize: '13px',
                      letterSpacing: '0.08em',
                      cursor: 'pointer',
                      fontFamily: 'Georgia, serif',
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#d4b55e' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#c9a84c' }}
                  >
                    Descargar boleto
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <MuteButton />
      </div>
    )
  }

  // ============================================================
  // RENDER — CONSULTORIO (Fase 2)
  // Igual que Fase 1 pero con: sepia(15%) en el fondo, Freud de pie
  // ============================================================
  return (
    <div className="relative w-screen h-screen overflow-hidden select-none">
      {/* Fondo — levemente más cálido */}
      <img
        src="/fondo_consultorio.png"
        alt="Consultorio de Freud"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: 'sepia(15%)' }}
        draggable={false}
      />

      {/* Overlay de transición */}
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

      {/* Freud — de pie (Pose 4) */}
      <AnimatePresence mode="wait">
        <motion.img
          key="freud_de_pie_fase2"
          src="/freud_de_pie.png"
          alt="Sigmund Freud"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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

      {/* Indicador pulsante */}
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

      {/* Dialogue Box */}
      {dialogue.isActive && (
        <DialogueBox
          key={dialogue.dialogueId}
          lines={dialogue.lines}
          options={dialogue.options}
          onComplete={dialogue.handleComplete}
          onOptionSelect={dialogue.handleOptionSelect}
        />
      )}

      <MuteButton />
    </div>
  )
}
