import { memo, useMemo, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Hand } from "lucide-react"
import { usePlayerState, usePlayerActions } from "../../player/context/player.context"
import "../styles/musiclayout.scss"
import "../styles/mood.responsive.scss"

// ─── Module-level constants & helpers ───────────────────────────────────────
const IMG_ERROR = (e) => {
  e.target.onerror = null
  e.target.style.display = "none"
}

const onImgLoad = (e) => {
  e.currentTarget.classList.add('is-loaded')
}

const onImgRef = (img) => {
  if (img?.complete && img.naturalWidth) img.classList.add('is-loaded')
}

const IMG_LAZY = { loading: 'lazy', decoding: 'async', draggable: 'false' }
const IMG_EAGER = { loading: 'eager', decoding: 'async', draggable: 'false' }
const NOOP = () => {}
const EMPTY = []

const getUpNext = (queue, currentIndex, count = 8) => {
  if (!queue || queue.length <= 1) return EMPTY
  const result = []
  const len = queue.length
  for (let i = 1; i <= count && i < len; i++) {
    result.push({ song: queue[(currentIndex + i) % len], index: (currentIndex + i) % len })
  }
  return result.length ? result : EMPTY
}

const formatDuration = (dur) =>
  dur ? `${Math.floor(dur / 60)}:${String(dur % 60).padStart(2, "0")}` : "—"

// ─── Hoisted Skeletons ───────────────────────────────────────────────────────
const CURRENT_SKELETON = (
  <div className="music-layout__current">
    <div className="music-layout__cover-wrap music-layout__skeleton-cover" />
    <div className="music-layout__current-info">
      <div className="music-layout__skeleton-line music-layout__skeleton-line--title" />
      <div className="music-layout__skeleton-line music-layout__skeleton-line--artist" />
    </div>
  </div>
)

const SONG_LIST_SKELETON = (
  <div className="music-layout__songs">
    <div className="music-layout__songs-col">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={`L-${i}`} className="music-layout__song-row music-layout__song-row--skeleton">
          <span className="music-layout__song-num" />
          <div className="music-layout__song-cover music-layout__skeleton-cover" />
          <div className="music-layout__song-meta">
            <div className="music-layout__skeleton-line music-layout__skeleton-line--name" />
            <div className="music-layout__skeleton-line music-layout__skeleton-line--artist" />
          </div>
          <span className="music-layout__song-dur" />
        </div>
      ))}
    </div>
    <div className="music-layout__songs-col">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={`R-${i}`} className="music-layout__song-row music-layout__song-row--skeleton">
          <span className="music-layout__song-num" />
          <div className="music-layout__song-cover music-layout__skeleton-cover" />
          <div className="music-layout__song-meta">
            <div className="music-layout__skeleton-line music-layout__skeleton-line--name" />
            <div className="music-layout__skeleton-line music-layout__skeleton-line--artist" />
          </div>
          <span className="music-layout__song-dur" />
        </div>
      ))}
    </div>
  </div>
)

const QUEUE_SKELETON = (
  <div className="music-layout__queue">
    <span className="music-layout__list-label">UP NEXT</span>
    <div className="music-layout__queue-row">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="music-layout__queue-item music-layout__queue-item--skeleton">
          <div className="music-layout__queue-placeholder music-layout__skeleton-cover" />
          <div className="music-layout__skeleton-line music-layout__skeleton-line--name" />
          <div className="music-layout__skeleton-line music-layout__skeleton-line--artist" />
        </div>
      ))}
    </div>
  </div>
)

// ─── Sub-Components (Extracted & Memoized) ─────────────────────────────────
const Toolbar = memo(function Toolbar({ detectedMood, onDetectAgain }) {
  const navigate = useNavigate()
  const { pause } = usePlayerActions()

  const goGesture = () => {
    if (typeof pause === 'function') pause()
    navigate('/gesture')
  }

  return (
    <div className="music-layout__toolbar">
      <div className="music-layout__toolbar-left">
        <button
          type="button"
          className="music-layout__gesture-btn"
          onClick={goGesture}
        >
          <Hand size={16} strokeWidth={2.25} aria-hidden="true" />
          <span>TRY GESTURE CONTROL</span>
        </button>
      </div>

      <span className="music-layout__mood-tag">
        {detectedMood?.emoji} {detectedMood?.label?.toUpperCase()} MOOD
      </span>

      <button
        type="button"
        className="music-layout__detect-btn"
        onClick={onDetectAgain}
      >
        ↺ DETECT AGAIN
      </button>
    </div>
  )
})
Toolbar.displayName = "Toolbar"

const CurrentSong = memo(function CurrentSong({ song }) {
  if (!song) return CURRENT_SKELETON

  return (
    <div className="music-layout__current">
      <div className="music-layout__cover-wrap">
        {song.cover
          ? <img src={song.cover} alt={song.name} className="music-layout__cover" onError={IMG_ERROR} onLoad={onImgLoad} ref={onImgRef} {...IMG_EAGER} fetchPriority="high" />
          : <div className="music-layout__cover-placeholder" />
        }
      </div>
      <div className="music-layout__current-info">
        <h2 className="music-layout__song-name">{song.name}</h2>
        <p className="music-layout__artist">{song.artist}</p>
      </div>
    </div>
  )
})
CurrentSong.displayName = "CurrentSong"

const SongRow = memo(function SongRow({ song, index, isActive, onPlay, rowRef }) {
  return (
    <div
      ref={rowRef}
      className={`music-layout__song-row${isActive ? " music-layout__song-row--active" : ""}`}
      onClick={onPlay}
    >
      <span className="music-layout__song-num">
        {isActive ? "▶" : String(index + 1).padStart(2, "0")}
      </span>
      <div className="music-layout__song-cover">
        {song.cover
          ? <img src={song.cover} alt={song.name} onError={IMG_ERROR} onLoad={onImgLoad} ref={onImgRef} {...IMG_LAZY} />
          : <div className="music-layout__song-cover-placeholder" />
        }
      </div>
      <div className="music-layout__song-meta">
        <span className="music-layout__song-title">{song.name}</span>
        <span className="music-layout__song-artist">{song.artist}</span>
      </div>
      <span className="music-layout__song-dur">{formatDuration(song.duration)}</span>
    </div>
  )
}, (prev, next) => (
  prev.isActive === next.isActive &&
  prev.index === next.index &&
  prev.onPlay === next.onPlay &&
  prev.rowRef === next.rowRef &&
  prev.song?.id === next.song?.id &&
  prev.song?.cover === next.song?.cover &&
  prev.song?.name === next.song?.name &&
  prev.song?.artist === next.song?.artist &&
  prev.song?.duration === next.song?.duration
))
SongRow.displayName = "SongRow"

const SongsList = memo(function SongsList({ leftCol, rightCol, mid, currentIndex, playHandlers, activeRowRef }) {
  return (
    <div className="music-layout__songs">
      <div className="music-layout__songs-col">
        {leftCol.map((song, i) => {
          const isActive = i === currentIndex
          return (
            <SongRow
              key={`${song.id}-${i}`}
              song={song}
              index={i}
              isActive={isActive}
              onPlay={playHandlers[i] || NOOP}
              rowRef={isActive ? activeRowRef : null}
            />
          )
        })}
      </div>
      <div className="music-layout__songs-col">
        {rightCol.map((song, i) => {
          const actualIndex = mid + i
          const isActive = actualIndex === currentIndex
          return (
            <SongRow
              key={`${song.id}-${actualIndex}`}
              song={song}
              index={actualIndex}
              isActive={isActive}
              onPlay={playHandlers[actualIndex] || NOOP}
              rowRef={isActive ? activeRowRef : null}
            />
          )
        })}
      </div>
    </div>
  )
})
SongsList.displayName = "SongsList"

const QueueItem = memo(function QueueItem({ song, index, onPlay }) {
  return (
    <div className="music-layout__queue-item" onClick={onPlay}>
      {song.cover
        ? <img src={song.cover} alt={song.name} onError={IMG_ERROR} onLoad={onImgLoad} ref={onImgRef} {...IMG_LAZY} />
        : <div className="music-layout__queue-placeholder" />
      }
      <span className="music-layout__queue-name">{song.name}</span>
      <span className="music-layout__queue-artist">{song.artist}</span>
    </div>
  )
}, (prev, next) => (
  prev.index === next.index &&
  prev.onPlay === next.onPlay &&
  prev.song?.id === next.song?.id &&
  prev.song?.cover === next.song?.cover &&
  prev.song?.name === next.song?.name &&
  prev.song?.artist === next.song?.artist
))
QueueItem.displayName = "QueueItem"

const UpNextStrip = memo(function UpNextStrip({ items, playHandlers }) {
  if (!items?.length) return null
  return (
    <div className="music-layout__queue">
      <span className="music-layout__list-label">UP NEXT</span>
      <div className="music-layout__queue-row">
        {items.map(({ song, index }) => (
          <QueueItem
            key={`${song.id}-${index}`}
            song={song}
            index={index}
            onPlay={playHandlers[index] || NOOP}
          />
        ))}
      </div>
    </div>
  )
})
UpNextStrip.displayName = "UpNextStrip"

// ─── Main Component ────────────────────────────────────────────────────────
const MusicLayout = memo(function MusicLayout({ detectedMood, onDetectAgain }) {
  const { currentSong, queue, currentIndex, isMoodLoading } = usePlayerState()
  const { playSongAtIndex } = usePlayerActions()
  const activeRowRef = useRef(null)

  useEffect(() => {
    if (activeRowRef.current) {
      activeRowRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [currentIndex])

  const playHandlers = useMemo(() => {
    if (!queue?.length) return EMPTY
    const arr = new Array(queue.length)
    for (let i = 0; i < queue.length; i++) {
      arr[i] = () => playSongAtIndex(i)
    }
    return arr
  }, [queue, playSongAtIndex])

  const upNextList = useMemo(() => {
    if (!queue || queue.length <= 1) return EMPTY
    return getUpNext(queue, currentIndex, 8)
  }, [queue, currentIndex])

  const { leftCol, rightCol, mid } = useMemo(() => {
    if (!queue?.length) return { leftCol: EMPTY, rightCol: EMPTY, mid: 0 }
    const mid = Math.ceil(queue.length / 2)
    return { mid, leftCol: queue.slice(0, mid), rightCol: queue.slice(mid) }
  }, [queue])

  const showSkeleton = isMoodLoading || (!queue?.length && !currentSong)

  return (
    <div className={`music-layout${showSkeleton ? " music-layout--loading" : ""}`}>

      {/* TOP ─────────────────────────────────────────────────────── */}
      <div className="music-layout__top">
        {showSkeleton ? CURRENT_SKELETON : <CurrentSong song={currentSong} />}

        {/* RIGHT: song list */}
        <div className="music-layout__list">
          <Toolbar detectedMood={detectedMood} onDetectAgain={onDetectAgain} />

          <div className="music-layout__divider" />
          <div className="music-layout__list-header">
            <span className="music-layout__list-label">SONGS FOR YOU</span>
          </div>

          {showSkeleton ? SONG_LIST_SKELETON : (
            <SongsList
              leftCol={leftCol}
              rightCol={rightCol}
              mid={mid}
              currentIndex={currentIndex}
              playHandlers={playHandlers}
              activeRowRef={activeRowRef}
            />
          )}
        </div>
      </div>

      {/* BOTTOM: Up Next ───────────────────────────────────────────── */}
      {showSkeleton ? QUEUE_SKELETON : (
        <UpNextStrip items={upNextList} playHandlers={playHandlers} />
      )}

    </div>
  )
})

MusicLayout.displayName = "MusicLayout"
export default MusicLayout