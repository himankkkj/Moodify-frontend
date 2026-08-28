import { createContext, useContext, useMemo, useRef } from "react"
import { usePlayer } from "../hooks/usePlayer.js"

const PlayerStateContext = createContext(null)
const PlayerProgressContext = createContext(null)
const PlayerVolumeContext = createContext(null)
const PlayerApiContext = createContext(null)

const DUMMY_API = {
  loadMood: () => {},
  loadCustomSongs: () => {},
  appendToQueue: () => {},
  togglePlay: () => {},
  nextSong: () => {},
  prevSong: () => {},
  seek: () => {},
  toggleShuffle: () => {},
  cycleLoop: () => {},
  setVolume: () => {},
  playSongAtIndex: () => {},
}

export const PlayerProvider = ({ children }) => {
  const player = usePlayer()

  // Keep latest player in a ref so API fns never need new identities
  const playerRef = useRef(player)
  playerRef.current = player

  // 1. SONG / QUEUE state — rare updates only
  //    ⚠️ volume REMOVED (was re-rendering whole app on slider drag)
  const stateValue = useMemo(() => ({
    queue:        player.queue,
    currentSong:  player.currentSong,
    currentIndex: player.currentIndex,
    isPlaying:    player.isPlaying,
    isLoading:    player.isLoading,
    isMoodLoading: player.isLoading,
    error:        player.error,
    isShuffled:   player.isShuffled,
    loopMode:     player.loopMode,
  }), [
    player.queue,
    player.currentSong,
    player.currentIndex,
    player.isPlaying,
    player.isLoading,
    player.error,
    player.isShuffled,
    player.loopMode,
  ])

  // 2. PROGRESS — high frequency (seek bar only)
  const progressValue = useMemo(() => ({
    progress:    player.progress,
    currentTime: player.currentTime,
  }), [player.progress, player.currentTime])

  // 3. VOLUME — separate (slider / mute only)
  const volumeValue = useMemo(() => ({
    volume: player.volume,
  }), [player.volume])

  // 4. API — create ONCE; always call through playerRef
  const apiValue = useMemo(() => ({
    loadMood:        (...a) => playerRef.current.loadMood(...a),
    loadCustomSongs: (...a) => playerRef.current.loadCustomSongs(...a),
    appendToQueue:   (...a) => playerRef.current.appendToQueue(...a),
    togglePlay:      (...a) => playerRef.current.togglePlay(...a),
    pause:           (...a) => playerRef.current.pause(...a),
    stop:            (...a) => playerRef.current.stop(...a),
    nextSong:        (...a) => playerRef.current.nextSong(...a),
    prevSong:        (...a) => playerRef.current.prevSong(...a),
    seek:            (...a) => playerRef.current.seek(...a),
    toggleShuffle:   (...a) => playerRef.current.toggleShuffle(...a),
    cycleLoop:       (...a) => playerRef.current.cycleLoop(...a),
    setVolume:       (...a) => playerRef.current.setVolume(...a),
    playSongAtIndex: (index) => {
      const p = playerRef.current
      const song = p.goToIndex(index)
      if (song) p.playSong(song)
    },
  }), []) // 🔒 empty deps — stable forever

  return (
    <PlayerApiContext.Provider value={apiValue}>
      <PlayerStateContext.Provider value={stateValue}>
        <PlayerVolumeContext.Provider value={volumeValue}>
          <PlayerProgressContext.Provider value={progressValue}>
            {children}
          </PlayerProgressContext.Provider>
        </PlayerVolumeContext.Provider>
      </PlayerStateContext.Provider>
    </PlayerApiContext.Provider>
  )
}

export const usePlayerState = () => {
  const ctx = useContext(PlayerStateContext)
  return ctx || {}
}

export const usePlayerProgress = () => {
  const ctx = useContext(PlayerProgressContext)
  return ctx || { progress: 0, currentTime: 0 }
}

export const usePlayerVolume = () => {
  const ctx = useContext(PlayerVolumeContext)
  return ctx || { volume: 1 }
}

export const usePlayerApi = () => {
  const ctx = useContext(PlayerApiContext)
  return ctx || DUMMY_API
}

export const usePlayerActions = () => usePlayerApi()