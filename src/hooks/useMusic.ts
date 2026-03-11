import { useCallback, useEffect, useRef, useState } from 'react'
import { musicTracks } from '../data/musicManifest'

export function useMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const play = useCallback(() => {
    if (musicTracks.length === 0) return
    // Pick random track
    const track = musicTracks[Math.floor(Math.random() * musicTracks.length)]
    const audio = new Audio(track.src)
    audio.volume = 0.3
    audio.loop = true
    audio.play().catch(() => {
      // Autoplay blocked — ignore silently
    })
    audioRef.current = audio
    setIsPlaying(true)
  }, [])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    setIsPlaying(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  return { isPlaying, play, stop }
}
