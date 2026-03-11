import { useEffect, useRef, useCallback } from 'react'
import { useAppState } from './hooks/useAppState'
import HomeScreen from './components/HomeScreen'
import ActiveRoutineScreen from './components/ActiveRoutineScreen'
import ParentPanel from './components/ParentPanel'
import GalleryScreen from './components/GalleryScreen'

export default function App() {
  const appState = useAppState()
  const { currentScreen, setCurrentScreen } = appState
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    if (currentScreen === 'routine' || currentScreen === 'gallery') {
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

  return (
    <div className="h-full bg-warm-100 no-select">
      {currentScreen === 'home' && <HomeScreen {...appState} />}
      {currentScreen === 'routine' && <ActiveRoutineScreen {...appState} />}
      {currentScreen === 'parent' && <ParentPanel {...appState} />}
      {currentScreen === 'gallery' && <GalleryScreen {...appState} />}
    </div>
  )
}
