import { useEffect, useRef, useCallback } from 'react'
import { useAppState } from './hooks/useAppState'
import { useMusic } from './hooks/useMusic'
import { initAudioOnGesture } from './hooks/useSound'
import HomeScreen from './components/HomeScreen'
import ActiveRoutineScreen from './components/ActiveRoutineScreen'
import ParentPanel from './components/ParentPanel'
import GalleryScreen from './components/GalleryScreen'
import TimerSetupScreen from './components/TimerSetupScreen'
import RoutineListScreen from './components/RoutineListScreen'
import RoutineEditorScreen from './components/RoutineEditorScreen'
import ChildEditorScreen from './components/ChildEditorScreen'
import OnboardingScreen from './components/OnboardingScreen'
import UniverseSelectScreen from './components/UniverseSelectScreen'

export default function App() {
  const appState = useAppState()
  const music = useMusic()
  const { currentScreen, setCurrentScreen } = appState
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    if (currentScreen === 'gallery') {
      inactivityTimer.current = setTimeout(() => {
        setCurrentScreen('home')
      }, 2 * 60 * 1000)
    }
  }, [currentScreen, setCurrentScreen])

  useEffect(() => {
    const handleActivity = () => resetInactivityTimer()
    window.addEventListener('touchstart', handleActivity)
    window.addEventListener('mousedown', handleActivity)
    resetInactivityTimer()
    return () => {
      window.removeEventListener('touchstart', handleActivity)
      window.removeEventListener('mousedown', handleActivity)
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    }
  }, [resetInactivityTimer])

  // Initialize AudioContext on first user gesture (mobile requirement)
  useEffect(() => {
    return initAudioOnGesture()
  }, [])

  // Retire l'écran interstitiel (index.html) en fondu — durée minimale pour
  // éviter le flash de marque quand l'app est déjà en cache.
  useEffect(() => {
    const splash = document.getElementById('splash')
    if (!splash) return
    const hide = setTimeout(() => {
      splash.classList.add('splash-hide')
      setTimeout(() => splash.remove(), 450)
    }, 900)
    return () => clearTimeout(hide)
  }, [])

  if (!appState.onboardingCompleted) {
    return (
      <div className="h-full bg-warm-100 no-select">
        <OnboardingScreen {...appState} />
      </div>
    )
  }

  return (
    <div className="h-full bg-warm-100 no-select">
      {currentScreen === 'home' && <HomeScreen {...appState} />}
      {currentScreen === 'routine' && <ActiveRoutineScreen {...appState} musicPlay={music.play} />}
      {currentScreen === 'parent' && <ParentPanel {...appState} />}
      {currentScreen === 'gallery' && <GalleryScreen {...appState} />}
      {currentScreen === 'timer' && <TimerSetupScreen {...appState} />}
      {currentScreen === 'routine-list' && <RoutineListScreen {...appState} />}
      {currentScreen === 'routine-editor' && <RoutineEditorScreen {...appState} />}
      {currentScreen === 'child-editor' && <ChildEditorScreen {...appState} />}
      {currentScreen === 'universe-select' && <UniverseSelectScreen {...appState} />}

      {/* Bouton global stop musique — visible sur toutes les pages */}
      {music.isPlaying && (
        <button
          onClick={music.stop}
          className="fixed bottom-4 left-4 z-toast min-h-12 px-5 py-2 rounded-full bg-ink text-warm-50 text-sm font-display font-semibold shadow-overlay active:scale-95 transition-transform"
        >
          🔇 Stop musique
        </button>
      )}
    </div>
  )
}
