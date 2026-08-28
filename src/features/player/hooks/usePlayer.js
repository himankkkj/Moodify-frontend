import { useCallback, useEffect, useRef, useState } from "react"
import { useQueue } from "./useQueue"

export const usePlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false)

  // One object = one setState per UI paint (throttled via rAF)
  const [progressState, setProgressState] = useState({
    progress: 0,
    currentTime: 0,
  })

  // Volume state
  const [volume, setVolumeState] = useState(1)
  const volumeRef = useRef(1)

  // Stable audio instance initialized once (survives re-renders)
  const audioRef = useRef(typeof window !== "undefined" ? new Audio() : null)

  // rAF throttle for timeupdate
  const rafRef = useRef(0)
  const pendingTimeRef = useRef(null)

  const flushProgress = useCallback(() => {
    rafRef.current = 0
    const t = pendingTimeRef.current
    if (t == null) return
    pendingTimeRef.current = null
    setProgressState(t)
  }, [])

  const resetProgress = useCallback(() => {
    pendingTimeRef.current = null
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
    setProgressState({ progress: 0, currentTime: 0 })
  }, [])

  const onFirstSongReady = useCallback((song) => {
    const audio = audioRef.current
    if (!audio || !song?.url) return
    audio.pause()
    audio.src = song.url
    resetProgress()
    audio.play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false))
  }, [resetProgress])

  const {
    queue, currentIndex, currentSong, isLoading, error,
    loadMood, loadCustomSongs, appendToQueue, goNext, goPrev, goToIndex,
    removeSong, clearQueue, abort,
    isShuffled, loopMode, loopModeRef, toggleShuffle, cycleLoop,
  } = useQueue({ onFirstSongReady })

  const setVolume = useCallback((val) => {
    const clamped = Math.min(Math.max(val, 0), 1)
    volumeRef.current = clamped
    setVolumeState(clamped)
    if (audioRef.current) {
      audioRef.current.volume = clamped
    }
  }, [])

  // ── Audio Element Setup (mount once; goNext/loop via refs) ─────────────
  const goNextRef = useRef(goNext)
  goNextRef.current = goNext

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.preload = "metadata"
    audio.volume = volumeRef.current

    const handleEnded = () => {
      if (loopModeRef.current === "one") {
        audio.currentTime = 0
        audio.play().catch(() => setIsPlaying(false))
        return
      }

      const next = goNextRef.current()
      if (next) {
        audio.src = next.url
        resetProgress()
        audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
      } else {
        setIsPlaying(false)
        resetProgress()
      }
    }

    const handleTimeUpdate = () => {
      if (!audio.duration || Number.isNaN(audio.duration)) return
      pendingTimeRef.current = {
        currentTime: audio.currentTime,
        progress: audio.currentTime / audio.duration,
      }
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(flushProgress)
      }
    }

    const handleError = () => {
      const next = goNextRef.current()
      if (next) {
        audio.src = next.url
        resetProgress()
        audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
      } else {
        setIsPlaying(false)
      }
    }

    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("error", handleError)

    return () => {
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("error", handleError)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [loopModeRef, flushProgress, resetProgress])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abort()
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.removeAttribute("src")
        audioRef.current.load()
      }
    }
  }, [abort])

  // ── Playback Actions ──────────────────────────────────────────────────────
  const playSong = useCallback(async (song) => {
    const audio = audioRef.current
    if (!audio || !song?.url) return
    audio.pause()
    audio.src = song.url
    resetProgress()
    try {
      await audio.play()
      setIsPlaying(true)
    } catch {
      setIsPlaying(false)
    }
  }, [resetProgress])

  const pause = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    setIsPlaying(false)
  }, [])

  const stop = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
    setIsPlaying(false)
    resetProgress()
  }, [resetProgress])

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current
    if (!audio?.src) return
    try {
      if (audio.paused) {
        await audio.play()
        setIsPlaying(true)
      } else {
        audio.pause()
        setIsPlaying(false)
      }
    } catch {
      setIsPlaying(false)
    }
  }, [])

  const nextSong = useCallback(async () => {
    const song = goNext()
    if (song) await playSong(song)
  }, [goNext, playSong])

  const prevSong = useCallback(async () => {
    const audio = audioRef.current
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0
      return
    }
    const song = goPrev()
    if (song) await playSong(song)
  }, [goPrev, playSong])

  const seek = useCallback((ratio) => {
    const audio = audioRef.current
    if (!audio?.duration) return
    const clamped = Math.min(Math.max(ratio, 0), 1)
    audio.currentTime = clamped * audio.duration
    setProgressState({ progress: clamped, currentTime: audio.currentTime })
  }, [])

  // ⚡️ Hardware Media Keys & OS Notification Controls
  useEffect(() => {
    if (!currentSong || typeof navigator === "undefined" || !("mediaSession" in navigator)) return

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.name,
      artist: currentSong.artist,
      artwork: currentSong.cover ? [{ src: currentSong.cover, sizes: "512x512", type: "image/jpeg" }] : [],
    })

    navigator.mediaSession.setActionHandler("play", togglePlay)
    navigator.mediaSession.setActionHandler("pause", togglePlay)
    navigator.mediaSession.setActionHandler("previoustrack", prevSong)
    navigator.mediaSession.setActionHandler("nexttrack", nextSong)

    return () => {
      navigator.mediaSession.setActionHandler("play", null)
      navigator.mediaSession.setActionHandler("pause", null)
      navigator.mediaSession.setActionHandler("previoustrack", null)
      navigator.mediaSession.setActionHandler("nexttrack", null)
    }
  }, [currentSong, togglePlay, prevSong, nextSong])

  // ⚡️ Prefetch Next Track (depend on URL string only)
  const nextUrl = queue[currentIndex + 1]?.url
  useEffect(() => {
    if (!nextUrl || typeof document === "undefined") return

    let link = document.getElementById("audio-prefetch-node")
    if (!link) {
      link = document.createElement("link")
      link.id = "audio-prefetch-node"
      link.rel = "prefetch"
      link.as = "audio"
      document.head.appendChild(link)
    }

    if (link.href !== nextUrl) link.href = nextUrl
  }, [nextUrl])

  return {
    queue,
    currentSong,
    currentIndex,
    isPlaying,
    isLoading,
    error,
    progress: progressState.progress,
    currentTime: progressState.currentTime,
    audioRef,
    volume,
    isShuffled,
    loopMode,
    setVolume,
    toggleShuffle,
    cycleLoop,
    loadMood,
    loadCustomSongs,
    appendToQueue,
    togglePlay,
    pause,
    stop,
    nextSong,
    prevSong,
    seek,
    removeSong,
    clearQueue,
    playSong,
    goToIndex,
  }
}