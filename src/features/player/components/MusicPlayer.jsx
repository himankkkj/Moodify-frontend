import { memo, useCallback } from "react"
import {
  Shuffle, SkipBack, SkipForward, Play, Pause,
  Repeat, Repeat1, Volume2, Volume1, VolumeX,
} from "lucide-react"
import { usePlayerState, usePlayerProgress, usePlayerVolume, usePlayerApi } from "../context/player.context"
import "../styles/player.scss"

// ── helpers ──────────────────────────────────────────────────────────────────

const formatTime = (seconds) => {
  if (!seconds || Number.isNaN(seconds)) return "0:00"
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

// ── sub-components (all memo — parent progress ticks won't re-render them) ───

const CoverArt = memo(({ cover, name }) => (
  <div className="player__cover">
    {cover
      ? (
        <img
          src={cover}
          alt={name}
          className="player__cover-img"
          decoding="async"
          loading="eager"
          fetchPriority="high"
          draggable="false"
          onError={(e) => {
            e.target.onerror = null
            e.target.style.display = "none"
          }}
        />
      )
      : <div className="player__cover-placeholder">♪</div>
    }
  </div>
))
CoverArt.displayName = "CoverArt"

const TrackInfo = memo(({ name, artist }) => (
  <div className="player__track-info">
    <p className="player__track-name" title={name}>{name}</p>
    <p className="player__track-artist" title={artist}>{artist}</p>
  </div>
))
TrackInfo.displayName = "TrackInfo"

const ProgressBar = memo(({ progress, currentTime, duration, onSeek }) => (
  <div className="player__progress-wrap">
    <span className="player__time player__time--current">{formatTime(currentTime)}</span>
    <input
      type="range"
      className="player__progress-slider"
      min="0"
      max="1"
      step="0.001"
      value={progress || 0}
      onChange={(e) => onSeek(parseFloat(e.target.value))}
      aria-label="Seek track"
      style={{ "--progress": `${((progress || 0) * 100).toFixed(2)}%` }}
    />
    <span className="player__time player__time--duration">{formatTime(duration)}</span>
  </div>
))
ProgressBar.displayName = "ProgressBar"

const Controls = memo(({
  isPlaying, onPrev, onToggle, onNext, hasNext, hasPrev,
  isShuffled, loopMode, onShuffle, onLoop,
}) => (
  <div className="player__controls">
    {/* Shuffle */}
    <button
      type="button"
      className={`player__btn player__btn--icon ${isShuffled ? "player__btn--active" : ""}`}
      onClick={onShuffle}
      aria-label={isShuffled ? "Disable shuffle" : "Enable shuffle"}
      aria-pressed={isShuffled}
      title="Shuffle"
    >
      <Shuffle size={16} strokeWidth={2} />
    </button>

    {/* Prev */}
    <button
      type="button"
      className="player__btn player__btn--prev"
      onClick={onPrev}
      disabled={!hasPrev}
      aria-label="Previous track"
    >
      <SkipBack size={16} strokeWidth={2} fill="currentColor" />
    </button>

    {/* Play / Pause */}
    <button
      type="button"
      className="player__btn player__btn--play"
      onClick={onToggle}
      aria-label={isPlaying ? "Pause track" : "Play track"}
    >
      {isPlaying
        ? <Pause size={15} strokeWidth={2} fill="currentColor" />
        : <Play  size={15} strokeWidth={2} fill="currentColor" />
      }
    </button>

    {/* Next */}
    <button
      type="button"
      className="player__btn player__btn--next"
      onClick={onNext}
      disabled={!hasNext}
      aria-label="Next track"
    >
      <SkipForward size={16} strokeWidth={2} fill="currentColor" />
    </button>

    {/* Loop: none → all → one */}
    <button
      type="button"
      className={`player__btn player__btn--icon ${loopMode !== "none" ? "player__btn--active" : ""}`}
      onClick={onLoop}
      aria-label={`Loop mode: ${loopMode}`}
      title={
        loopMode === "none" ? "Loop off"
          : loopMode === "all" ? "Loop all"
          : "Loop one"
      }
    >
      {loopMode === "one"
        ? <Repeat1 size={16} strokeWidth={2} />
        : <Repeat  size={16} strokeWidth={2} />
      }
    </button>
  </div>
))
Controls.displayName = "Controls"

// Volume isolated — only this node re-renders on drag
const VolumeControl = memo(() => {
  const { volume } = usePlayerVolume()
  const { setVolume } = usePlayerApi()
  const handleChange = useCallback((e) => {
    setVolume(parseFloat(e.target.value))
  }, [setVolume])

  const isMuted = volume === 0

  return (
    <div className="player__volume">
      <button
        type="button"
        className="player__btn player__btn--icon"
        onClick={() => setVolume(isMuted ? 0.7 : 0)}
        aria-label={isMuted ? "Unmute" : "Mute"}
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted || volume === 0 ? (
          <VolumeX size={16} />
        ) : volume < 0.5 ? (
          <Volume1 size={16} />
        ) : (
          <Volume2 size={16} />
        )}
      </button>
      <input
        type="range"
        className="player__volume-slider"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={handleChange}
        aria-label="Volume"
        style={{ "--vol": `${(volume * 100).toFixed(0)}%` }}
      />
    </div>
  )
})
VolumeControl.displayName = "VolumeControl"

// ── main ─────────────────────────────────────────────────────────────────────

const MusicPlayer = () => {
  const {
    queue, currentSong, currentIndex,
    isPlaying, isLoading, error,
    isShuffled, loopMode,
  } = usePlayerState()

  // ⚡️ Progress lives in its own context — only ProgressBar re-renders on ticks
  const { progress, currentTime } = usePlayerProgress()

  const {
    togglePlay, nextSong, prevSong, seek,
    toggleShuffle, cycleLoop,
  } = usePlayerApi()

  if (!currentSong && !isLoading && !error) return null

  // loop "all" → next never disabled; loop "one" still allows manual next
  const hasNext = loopMode === "all" || currentIndex < queue.length - 1
  const hasPrev = loopMode === "all" || currentIndex > 0 || currentTime > 3

  return (
    <div className="player">

      {isLoading && !currentSong && (
        <div className="player__loading">
          <div className="player__spinner" />
          <span>FINDING SONGS...</span>
        </div>
      )}

      {error && !currentSong && (
        <div className="player__error" role="alert">
          <span>{error}</span>
        </div>
      )}

      {currentSong && (
        <>
          {/* LEFT */}
          <div className="player__left">
            <CoverArt cover={currentSong.cover} name={currentSong.name} />
            <TrackInfo name={currentSong.name} artist={currentSong.artist} />
          </div>

          {/* CENTER = controls on top, progress under */}
          <div className="player__center">
            <Controls
              isPlaying={isPlaying}
              onPrev={prevSong}
              onToggle={togglePlay}
              onNext={nextSong}
              hasPrev={hasPrev}
              hasNext={hasNext}
              isShuffled={isShuffled}
              loopMode={loopMode}
              onShuffle={toggleShuffle}
              onLoop={cycleLoop}
            />
            <ProgressBar
              progress={progress}
              currentTime={currentTime}
              duration={currentSong.duration}
              onSeek={seek}
            />
          </div>

          {/* RIGHT */}
          <div className="player__right">
            {isLoading && (
              <span className="player__loading-more">Loading...</span>
            )}
            <VolumeControl />
          </div>
        </>
      )}
    </div>
  )
}

export default memo(MusicPlayer)