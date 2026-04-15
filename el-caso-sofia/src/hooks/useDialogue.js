import { useState, useCallback } from 'react'

/**
 * useDialogue — Maneja el estado del sistema de diálogos de Freud
 *
 * Controla qué secuencia de diálogo está activa, y provee métodos
 * para iniciar, cerrar y responder a diálogos con opciones.
 *
 * @returns {{
 *   isActive: boolean,
 *   lines: string[],
 *   options: Array<{key: string, label: string}> | null,
 *   startDialogue: (lines: string[], options?: Array, onComplete?: Function, onOptionSelect?: Function) => void,
 *   closeDialogue: () => void,
 *   handleComplete: () => void,
 *   handleOptionSelect: (key: string) => void,
 * }}
 */
export function useDialogue() {
  const [isActive, setIsActive] = useState(false)
  const [dialogueId, setDialogueId] = useState(0)
  const [lines, setLines] = useState([])
  const [options, setOptions] = useState(null)
  const [onCompleteCallback, setOnCompleteCallback] = useState(null)
  const [onOptionSelectCallback, setOnOptionSelectCallback] = useState(null)

  const startDialogue = useCallback((dialogueLines, dialogueOptions = null, onComplete = null, onOptionSelect = null) => {
    setDialogueId((prev) => prev + 1)
    setLines(dialogueLines)
    setOptions(dialogueOptions)
    // Wrapping in arrow functions to avoid React calling them as state initializers
    setOnCompleteCallback(() => onComplete)
    setOnOptionSelectCallback(() => onOptionSelect)
    setIsActive(true)
  }, [])

  const closeDialogue = useCallback(() => {
    setIsActive(false)
    setLines([])
    setOptions(null)
    setOnCompleteCallback(null)
    setOnOptionSelectCallback(null)
  }, [])

  const handleComplete = useCallback(() => {
    const callback = onCompleteCallback
    // Cerrar ANTES de llamar el callback, para que si el callback
    // llama a startDialogue, el nuevo estado no sea pisado por closeDialogue
    if (!options) {
      closeDialogue()
    }
    if (callback) {
      callback()
    }
  }, [onCompleteCallback, options, closeDialogue])

  const handleOptionSelect = useCallback((key) => {
    const callback = onOptionSelectCallback
    closeDialogue()
    if (callback) {
      callback(key)
    }
  }, [onOptionSelectCallback, closeDialogue])

  return {
    isActive,
    dialogueId,
    lines,
    options,
    startDialogue,
    closeDialogue,
    handleComplete,
    handleOptionSelect,
  }
}
