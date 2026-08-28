import { memo, useCallback, useMemo, useRef, useState, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Compass, Zap, ScanFace, Camera } from 'lucide-react'
import { usePlayerState, usePlayerActions } from '../../player/context/player.context'
import { useGestureQueue } from '../hooks/useGestureQueue'
import GestureCamera from './GestureCamera'
import '../styles/gesturelayout.scss'

const GestureDisplay = lazy(() => import('./GestureDisplay'))

const IMG_ERROR = (e) => { e.target.onerror = null; e.target.style.display = 'none' }
const formatDur = (s) => s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '—'

const NOOP = () => {}
const EMPTY_ARR = []
const IMG_LAZY = { loading: 'lazy', decoding: 'async' }

const POPULAR_SKELETON = (
  <>
    <div className="g-layout__list-header">
      <p className="g-layout__list-label">POPULAR</p>
    </div>
    <div className="g-layout__popular-list">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="g-song-row g-song-row--skeleton">
          <span className="g-song-row__num" />
          <div className="g-song-row__cover g-song-row__cover--skeleton" />
          <div className="g-song-row__meta">
            <div className="g-song-row__skeleton-line g-song-row__skeleton-line--name" />
            <div className="g-song-row__skeleton-line g-song-row__skeleton-line--artist" />
          </div>
          <span className="g-song-row__dur" />
        </div>
      ))}
    </div>
  </>
)

const IDLE_TILES = [
  { icon: Compass,  label: 'Discover', sub: 'new music' },
  { icon: Zap,      label: 'Trending', sub: 'now' },
  { icon: ScanFace, label: 'Scan',     sub: 'for gesture' },
]

const IDLE_TILES_EL = (
  <div className="g-idle__tiles">
    {IDLE_TILES.map(({ icon: Icon, label, sub }) => (
      <div key={label} className="g-idle-tile">
        <Icon size={26} strokeWidth={2.2} className="g-idle-tile__icon" />
        <p className="g-idle-tile__label">{label}</p>
        <p className="g-idle-tile__sub">{sub}</p>
      </div>
    ))}
  </div>
)

const warmedSet = new Set()

export function prefetchSongMedia(song) {
  if (!song?.id || warmedSet.has(song.id)) return
  warmedSet.add(song.id)

  if (song.cover) {
    const img = new Image()
    img.decoding = 'async'
    img.src = song.cover
  }

  if (song.url) {
    try {
      fetch(song.url, { method: 'GET', headers: { Range: 'bytes=0-1' }, mode: 'cors' }).catch(() => {})
    } catch {}
  }
}

function useSongPickHandlers(songs, onPick) {
  return useMemo(() => {
    const map = new Map()
    for (const song of songs) {
      if (song?.id) {
        map.set(song.id, () => onPick(song))
      }
    }
    return map
  }, [songs, onPick])
}

const SearchResult = memo(({ song, onPick }) => {
  const handleClick = useCallback(() => onPick(song), [song, onPick])
  return (
    <div className="g-search__result" onClick={handleClick} role="option" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleClick()}>
      {song.cover ? <img src={song.cover} alt="" className="g-search__result-img" onError={IMG_ERROR} {...IMG_LAZY} /> : <div className="g-search__result-img g-search__result-img--empty" />}
      <div className="g-search__result-meta">
        <span className="g-search__result-name">{song.name}</span>
        <span className="g-search__result-artist">{song.artist}</span>
      </div>
      <span className="g-search__result-dur">{formatDur(song.duration)}</span>
    </div>
  )
})
SearchResult.displayName = 'SearchResult'

// B5: Isolated Top Search Island Component
const TopSearch = memo(({ onPick, handleSearch, searchResults, isSearching, showResults, dismissSearch }) => {
  const [topQuery, setTopQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef(null)

  const handleChange = useCallback((e) => {
    const v = e.target.value
    setTopQuery(v)
    handleSearch(v)
  }, [handleSearch])

  const handleFocus = useCallback(() => {
    setIsFocused(true)
    if (topQuery.trim()) handleSearch(topQuery)
  }, [topQuery, handleSearch])

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setIsFocused(false)
      dismissSearch()
    }, 160)
  }, [dismissSearch])

  const handleSelect = useCallback((song) => {
    setTopQuery('')
    setIsFocused(false)
    onPick(song)
  }, [onPick])

  const isExpanded = showResults && isFocused

  return (
    <div className="g-search" role="combobox" aria-expanded={isExpanded} aria-haspopup="listbox">
      <Search size={16} className="g-search__icon" strokeWidth={2.2} />
      <input
        ref={inputRef}
        type="text"
        className="g-search__input"
        placeholder="Search songs, artists..."
        value={topQuery}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
      />
      {isSearching && isFocused && (
        <span className="g-search__spinner" aria-hidden="true" />
      )}
      {isExpanded && (
        <div className="g-search__dropdown" role="listbox">
          {!isSearching && searchResults.length === 0 && (
            <p className="g-search__no-results">No songs found</p>
          )}
          {searchResults.map(song => (
            <SearchResult key={song.id} song={song} onPick={handleSelect} />
          ))}
        </div>
      )}
    </div>
  )
})
TopSearch.displayName = 'TopSearch'

// B5: Isolated Idle Panel Search Island Component
const IdlePanel = memo(({ onPick, handleSearch, searchResults, isSearching, showResults, dismissSearch }) => {
  const [idleQuery, setIdleQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const handleChange = useCallback((e) => {
    const v = e.target.value
    setIdleQuery(v)
    handleSearch(v)
  }, [handleSearch])

  const handleFocus = useCallback(() => {
    setIsFocused(true)
    if (idleQuery.trim()) handleSearch(idleQuery)
  }, [idleQuery, handleSearch])

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setIsFocused(false)
      dismissSearch()
    }, 160)
  }, [dismissSearch])

  const handleSelect = useCallback((song) => {
    setIdleQuery('')
    setIsFocused(false)
    onPick(song)
  }, [onPick])

  const isExpanded = showResults && isFocused

  return (
    <div className="g-idle">
      <div className="g-idle__content">
        <h1 className="g-idle__heading">
          Find your next<br />
          <span className="g-idle__heading-accent">favorite track</span>
        </h1>
        <p className="g-idle__subtitle">
          Search for songs, artists or<br />browse our recommendations.
        </p>

        <div className="g-idle__search" role="combobox" aria-expanded={isExpanded} aria-haspopup="listbox">
          <Search size={16} className="g-idle__search-icon" strokeWidth={2.2} />
          <input
            type="text"
            className="g-idle__search-input"
            placeholder="Search songs, artists..."
            value={idleQuery}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          {isSearching && isFocused && (
            <span className="g-idle__search-spinner" aria-hidden="true" />
          )}
          {isExpanded && (
            <div className="g-idle__dropdown" role="listbox">
              {!isSearching && searchResults.length === 0 && (
                <p className="g-idle__no-results">No songs found</p>
              )}
              {searchResults.map(song => (
                <SearchResult key={song.id} song={song} onPick={handleSelect} />
              ))}
            </div>
          )}
        </div>
      </div>

      {IDLE_TILES_EL}
    </div>
  )
})
IdlePanel.displayName = 'IdlePanel'

const ActiveSong = memo(({ song, isLoading }) => {
  if (!song && isLoading) {
    return (
      <div className="g-active g-active--skeleton">
        <div className="g-active__skeleton-cover" />
      </div>
    )
  }
  if (!song) return null
  return (
    <div className="g-active">
      <div className="g-active__cover-wrap">
        {song.cover ? <img src={song.cover} alt={song.name} className="g-active__cover" onError={IMG_ERROR} loading="eager" decoding="async" /> : <div className="g-active__cover-placeholder" />}
      </div>
      <div className="g-active__info">
        <p className="g-active__eyebrow">NOW PLAYING</p>
        <h2 className="g-active__name">{song.name}</h2>
        <p className="g-active__artist">{song.artist}</p>
      </div>
    </div>
  )
})
ActiveSong.displayName = 'ActiveSong'

// B3: Custom compare function to eliminate shallow object identity re-renders
const SongRow = memo(function SongRow({ song, displayNum, isActive, onPlay }) {
  const hoverTimer = useRef(null)
  const handleMouseEnter = useCallback(() => {
    hoverTimer.current = setTimeout(() => prefetchSongMedia(song), 150)
  }, [song])
  const handleMouseLeave = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
  }, [])

  return (
    <div
      className={`g-song-row${isActive ? ' g-song-row--active' : ''}`}
      onClick={onPlay}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onPlay()}
    >
      <span className="g-song-row__num">
        {isActive ? '▶' : String(displayNum).padStart(2, '0')}
      </span>
      <div className="g-song-row__cover">
        {song.cover
          ? <img src={song.cover} alt="" onError={IMG_ERROR} {...IMG_LAZY} />
          : <div className="g-song-row__cover-placeholder" />}
      </div>
      <div className="g-song-row__meta">
        <span className="g-song-row__name">{song.name}</span>
        <span className="g-song-row__artist">{song.artist}</span>
      </div>
      <span className="g-song-row__dur">{formatDur(song.duration)}</span>
    </div>
  )
}, (prev, next) => (
  prev.isActive === next.isActive &&
  prev.displayNum === next.displayNum &&
  prev.onPlay === next.onPlay &&
  prev.song?.id === next.song?.id &&
  prev.song?.cover === next.song?.cover &&
  prev.song?.name === next.song?.name
))
SongRow.displayName = 'SongRow'

const RecommendedCard = memo(({ song, onPick }) => {
  const hoverTimer = useRef(null)
  const handleClick = useCallback(() => onPick(song), [song, onPick])
  const handleMouseEnter = useCallback(() => {
    hoverTimer.current = setTimeout(() => prefetchSongMedia(song), 150)
  }, [song])
  const handleMouseLeave = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
  }, [])

  return (
    <div
      className="g-rec-card"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <div className="g-rec-card__cover">
        {song.cover
          ? <img src={song.cover} alt="" onError={IMG_ERROR} {...IMG_LAZY} />
          : <div className="g-rec-card__cover-placeholder" />}
      </div>
      <p className="g-rec-card__name">{song.name}</p>
      <p className="g-rec-card__artist">{song.artist}</p>
    </div>
  )
})
RecommendedCard.displayName = 'RecommendedCard'

const RecommendedSkeleton = memo(() => (
  <>
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="g-rec-card g-rec-card--skeleton">
        <div className="g-rec-card__cover g-rec-card__cover--skeleton" />
        <div className="g-rec-card__skeleton-line g-rec-card__skeleton-line--name" />
        <div className="g-rec-card__skeleton-line g-rec-card__skeleton-line--artist" />
      </div>
    ))}
  </>
))
RecommendedSkeleton.displayName = 'RecommendedSkeleton'

const CameraSection = memo(function CameraSection({
  videoRef, isActive, cameraLoading, cameraError,
  detectedGesture, lastAction, onStart, onStop, isReady, hasTrack,
}) {
  const camBtnLabel = cameraLoading
    ? (isReady ? 'STARTING CAMERA…' : 'LOADING MODEL…')
    : isActive
      ? 'STOP CAMERA'
      : 'START CAMERA'

  return (
    <aside className="g-layout__cam-col">
      <div className={`g-layout__cam-shell ${isActive ? 'is-live' : 'is-idle'}`}>
        <div className="g-layout__cam-feed">
          <GestureCamera
            videoRef={videoRef}
            isActive={isActive}
            isLoading={cameraLoading}
            error={cameraError}
          />
        </div>

        {!isActive && (
          <div className="g-layout__cam-guide">
            <Suspense fallback={null}>
              <GestureDisplay
                detectedGesture={detectedGesture}
                isActive={isActive}
                lastAction={lastAction}
                hasTrack={hasTrack}
              />
            </Suspense>
            <p className="g-layout__cam-hint">
              Start the camera to control music with gestures
            </p>
          </div>
        )}

        <div className="g-layout__cam-action">
          <button
            type="button"
            className={`g-layout__cam-btn${isActive ? ' g-layout__cam-btn--stop' : ''}`}
            onClick={isActive ? onStop : onStart}
            disabled={cameraLoading}
          >
            <Camera size={16} strokeWidth={2.25} className="g-layout__cam-btn-icon" />
            {camBtnLabel}
          </button>
        </div>
      </div>
    </aside>
  )
})

const PopularSection = memo(function PopularSection({
  trending,
  isTrendingLoading,
  pickHandlers,
}) {
  if (isTrendingLoading) return POPULAR_SKELETON

  return (
    <>
      <div className="g-layout__list-header">
        <p className="g-layout__list-label">POPULAR</p>
      </div>
      <div className="g-layout__popular-list">
        {trending.map((song, i) => (
          <SongRow
            key={song.id}
            song={song}
            displayNum={i + 1}
            isActive={false}
            onPlay={pickHandlers.get(song.id) || NOOP}
          />
        ))}
      </div>
    </>
  )
})

const QueueSection = memo(function QueueSection({
  leftCol,
  rightCol,
  startIndex,
  mid,
  currentIndex,
  playHandlers,
  isQueueLoading,
  hasSongs,
}) {
  if (!hasSongs) {
    return !isQueueLoading ? (
      <div className="g-layout__list-empty"><p>QUEUE BUILDING...</p></div>
    ) : null
  }

  return (
    <>
      <div className="g-layout__list-header">
        <p className="g-layout__list-label">UP NEXT</p>
        {isQueueLoading && (
          <span className="g-layout__queue-loading">Loading more...</span>
        )}
      </div>
      <div className="g-layout__song-cols">
        <div className="g-layout__song-col">
          {leftCol.map((song, i) => {
            const actualIdx = startIndex + i
            return (
              <SongRow
                key={song.id || actualIdx}
                song={song}
                displayNum={actualIdx + 1}
                isActive={actualIdx === currentIndex}
                onPlay={playHandlers[actualIdx] || NOOP}
              />
            )
          })}
        </div>
        <div className="g-layout__song-col">
          {rightCol.map((song, i) => {
            const actualIdx = startIndex + mid + i
            return (
              <SongRow
                key={song.id || actualIdx}
                song={song}
                displayNum={actualIdx + 1}
                isActive={actualIdx === currentIndex}
                onPlay={playHandlers[actualIdx] || NOOP}
              />
            )
          })}
        </div>
      </div>
    </>
  )
})

const RecommendedSection = memo(function RecommendedSection({
  songs,
  isLoading,
  pickHandlers,
}) {
  return (
    <div className="g-layout__recommended">
      <p className="g-layout__rec-label">RECOMMENDED FOR YOU</p>
      <div className="g-layout__rec-row">
        {isLoading
          ? <RecommendedSkeleton />
          : songs.map(song => (
              <RecommendedCard
                key={song.id}
                song={song}
                onPick={pickHandlers.get(song.id) || NOOP}
              />
            ))}
      </div>
    </div>
  )
})

const GestureLayout = memo(({ videoRef, isActive, isLoading: cameraLoading, error: cameraError, detectedGesture, lastAction, onStart, onStop, isReady }) => {
  const navigate = useNavigate()
  const playerState = usePlayerState()
  const { currentSong, queue, currentIndex } = playerState
  const { playSongAtIndex } = usePlayerActions()

  const {
    recommended, isRecommendedLoading,
    trending, isTrendingLoading,
    searchResults, isSearching, isQueueLoading,
    showResults, handleSearch, pickSong, dismissSearch,
  } = useGestureQueue(playerState)

  const handleMoodPage = useCallback(() => navigate('/mood'), [navigate])

  const playHandlers = useMemo(() => {
    return queue.map((_, i) => () => playSongAtIndex(i))
  }, [queue, playSongAtIndex])

  const { startIndex, leftCol, rightCol, mid } = useMemo(() => {
    const start = currentIndex >= 10 ? currentIndex - 2 : 0
    const display = queue.slice(start, start + 10)
    const m = Math.ceil(display.length / 2)
    return {
      startIndex: start,
      leftCol: display.slice(0, m),
      rightCol: display.slice(m),
      mid: m,
    }
  }, [queue, currentIndex])

  const trendingPickHandlers = useSongPickHandlers(trending, pickSong)
  const recommendedPickHandlers = useSongPickHandlers(recommended, pickSong)

  return (
    <div
      className={`g-layout${currentSong ? ' g-layout--playing' : ' g-layout--idle'}`}
      data-theme="app"
    >
      
      {/* ── TOPBAR: Full-width search + mood page button ── */}
      <div className="g-layout__topbar">
        <TopSearch
          onPick={pickSong}
          handleSearch={handleSearch}
          searchResults={searchResults}
          isSearching={isSearching}
          showResults={showResults}
          dismissSearch={dismissSearch}
        />
        <button type="button" className="g-layout__mood-btn" onClick={handleMoodPage}>↗ MOOD PAGE</button>
      </div>

      {/* ── MAIN 3-COLUMN ROW: [ Active Song (Left) ] | [ Camera + Guide (Center) ] | [ Up Next Queue (Right) ] ── */}
      <div className="g-layout__main-row">

        {/* LEFT COLUMN: Active Song or Idle Panel */}
        <div className="g-layout__active-col">
          <div className="g-layout__active-wrap">
            {currentSong || isQueueLoading
              ? <ActiveSong song={currentSong} isLoading={isQueueLoading} />
              : (
                <IdlePanel
                  onPick={pickSong}
                  handleSearch={handleSearch}
                  searchResults={searchResults}
                  isSearching={isSearching}
                  showResults={showResults}
                  dismissSearch={dismissSearch}
                />
              )
            }
          </div>
        </div>

        {/* CENTER COLUMN: Camera & Guide */}
        <CameraSection
          videoRef={videoRef}
          isActive={isActive}
          cameraLoading={cameraLoading}
          cameraError={cameraError}
          detectedGesture={detectedGesture}
          lastAction={lastAction}
          onStart={onStart}
          onStop={onStop}
          isReady={isReady}
          hasTrack={!!currentSong}
        />

        {/* RIGHT COLUMN: Popular (idle) or Up Next (playing) */}
        <div className="g-layout__queue-col">
          <div className="g-layout__queue-wrap">
            {!currentSong ? (
              <PopularSection
                trending={trending}
                isTrendingLoading={isTrendingLoading}
                pickHandlers={trendingPickHandlers}
              />
            ) : (
              <QueueSection
                leftCol={leftCol}
                rightCol={rightCol}
                startIndex={startIndex}
                mid={mid}
                currentIndex={currentIndex}
                playHandlers={playHandlers}
                isQueueLoading={isQueueLoading}
                hasSongs={leftCol.length + rightCol.length > 0}
              />
            )}
          </div>
        </div>

      </div>

      {/* ── BOTTOM HALF: Recommended Row (Spans FULL 100% Width) ── */}
      <RecommendedSection
        songs={recommended}
        isLoading={isRecommendedLoading}
        pickHandlers={recommendedPickHandlers}
      />

    </div>
  )
})

GestureLayout.displayName = 'GestureLayout'
export default GestureLayout