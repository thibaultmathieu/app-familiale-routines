import { useCallback, useEffect, useRef, useState } from 'react'
import { musicTracks } from '../data/musicManifest'
import { assetUrl } from '../utils/assetUrl'

/**
 * Pre-pick a random track and pre-load it into an Audio element so that on iOS,
 * calling audio.play() inside a user gesture works without needing to create a
 * new Audio element at that moment (iOS blocks new Audio().play() unless the
 * audio subsystem has been unlocked first via a prior user gesture).
 *
 * Strategy:
 *  1. On mount, pick a random track and call audio.load() — this pre-buffers
 *     the file so .play() can start instantly from within a gesture.
 *  2. When play() is called (from a user-gesture handler), we call .play()
 *     on the already-loaded element.  If for any reason it fails, we do NOT
 *     silently swallow the error — we log it so it's visible in Safari console.
 *  3. After a track ends (or stop() is called) we pre-load the next random
 *     track so the hook is always "ready".
 */
export function useMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Pre-load a random track into audioRef so it is ready before play() is called.
  const preloadNextTrack = useCallback(() => {
    if (musicTracks.length === 0) return
    const track = musicTracks[Math.floor(Math.random() * musicTracks.length)]
    const audio = new Audio()
    audio.src = assetUrl(track.src)
    audio.volume = 0.3
    audio.loop = true
    // preload="auto" tells the browser to fetch the file eagerly
    audio.preload = 'auto'
    audio.load()
    audio.onended = () => {
      // Should not fire because loop=true, but guard anyway
      setIsPlaying(false)
      preloadNextTrack()
    }
    audioRef.current = audio
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-load on mount
  useEffect(() => {
    preloadNextTrack()
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [preloadNextTrack])

  const play = useCallback(() => {
    if (musicTracks.length === 0) return
    const audio = audioRef.current
    if (!audio) return

    const promise = audio.play()
    if (promise !== undefined) {
      promise
        .then(() => {
          setIsPlaying(true)
        })
        .catch((err) => {
          // Log so it's visible in Safari Web Inspector instead of silently failing
          console.warn('[useMusic] audio.play() rejected:', err)
        })
    } else {
      // Older browsers return undefined — assume it played
      setIsPlaying(true)
    }
  }, [])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
  }, [])

  return { isPlaying, play, stop }
}
