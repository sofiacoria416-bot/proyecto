import { Routes, Route } from 'react-router-dom'
import { useSession } from './hooks/useSession'
import WaitingScreen from './screens/WaitingScreen'
import ConsultorioScreen from './screens/ConsultorioScreen'
import InterPhaseWaitingScreen from './screens/InterPhaseWaitingScreen'
import Fase2Screen from './screens/Fase2Screen'



function Experience() {
  const { session, phase, phase1Completed, setPhase1Completed, loading, error } = useSession()

  // --- Estado de carga ---
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-neutral-500 font-mono text-sm tracking-widest">
          Cargando...
        </p>
      </div>
    )
  }

  // --- Errores de token ---
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-neutral-500 font-mono text-sm tracking-widest">
          {error === 'no_token'
            ? 'Este link necesita un código de acceso.'
            : 'Link inválido.'}
        </p>
      </div>
    )
  }

  // --- Pantalla de espera (antes de Fase 1) ---
  if (phase === 'waiting') {
    return <WaitingScreen session={session} />
  }

  // --- Pantalla de espera entre Fase 1 y el cumpleaños ---
  // Se muestra cuando: Fase 1 completada + todavía no llegó la Fase 2
  if (phase === 'phase1' && phase1Completed) {
    return <InterPhaseWaitingScreen session={session} />
  }

  // --- Fase 2: Diagnóstico ---
  if (phase === 'phase2') {
    return <Fase2Screen session={session} />
  }

  // --- Fase 1: Anamnesis ---
  if (phase === 'phase1') {
    return (
      <ConsultorioScreen
        session={session}
        phase={phase}
        onPhase1Complete={() => setPhase1Completed(true)}
      />
    )
  }

  return null
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Experience />} />
    </Routes>
  )
}

export default App
