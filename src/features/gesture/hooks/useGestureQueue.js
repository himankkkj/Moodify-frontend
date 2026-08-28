import { useState, useCallback, useRef, useEffect, startTransition } from 'react'
import { getCuratedSongs, getTrendingSongs, searchSongs, fetchSimilarSongs } from '../services/gestureMusic.service'
import { usePlayerApi, usePlayerState } from '../../player/context/player.context'

const REFILL_THRESHOLD = 3
const CACHE_TTL = 10 * 60 * 1000

export const useGestureQueue = (playerStateOverride) => {
  const [recommended, setRecommended] = useState([])
  const [isRecommendedLoading, setIsRecommendedLoading] = useState(true)
  const [trending, setTrending] = useState([])
  const [isTrendingLoading, setIsTrendingLoading] = useState(true)
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [isQueueLoading, setIsQueueLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const { loadCustomSongs, appendToQueue } = usePlayerApi()
  const fallbackPlayerState = usePlayerState()
  const { currentSong, queue, currentIndex } = playerStateOverride || fallbackPlayerState

  const searchAbortRef  = useRef(null)
  const queueAbortRef   = useRef(null)
  const refillAbortRef  = useRef(null)
  const refillGenRef    = useRef(0)
  const debounceRef     = useRef(null)
  const searchCache     = useRef(new Map()) // query → { results, ts }

  const currentSongMetaRef = useRef(null)
  const refillPageRef      = useRef(0)
  const isRefillingRef     = useRef(false)
  const excludeRef         = useRef([])

  // 1. STAGGERED MOUNT FETCH (Popular visible first, Recommended on idle)
  useEffect(() => {
    const ac = new AbortController()

    // 1) Popular first (above the fold, right column)
    ;(async () => {
      setIsTrendingLoading(true)
      try {
        const t = await getTrendingSongs(ac.signal, 6)
        if (!ac.signal.aborted) {
          startTransition(() => setTrending(t))
        }
      } catch {
      } finally {
        if (!ac.signal.aborted) setIsTrendingLoading(false)
      }
    })()

    // 2) Recommended after idle / initial paint (skip redundant setIsRecommendedLoading(true))
    const loadRecommended = async (signal) => {
      try {
        const r = await getCuratedSongs(signal)
        if (!signal.aborted) {
          startTransition(() => setRecommended(r.slice(0, 8)))
        }
      } catch {
      } finally {
        if (!signal.aborted) setIsRecommendedLoading(false)
      }
    }

    const idleId = typeof window !== 'undefined' && window.requestIdleCallback
      ? window.requestIdleCallback(() => loadRecommended(ac.signal), { timeout: 1200 })
      : setTimeout(() => loadRecommended(ac.signal), 400)

    return () => {
      ac.abort()
      if (typeof window !== 'undefined') {
        if (window.cancelIdleCallback) window.cancelIdleCallback(idleId)
        else clearTimeout(idleId)
      }
    }
  }, [])

  // 2. AUTO REFILL (Generational race protection + Set lookup)
  const currentSongId = currentSong?.id
  useEffect(() => {
    excludeRef.current = queue.map(s => s.id)

    const remaining = queue.length - currentIndex - 1
    if (
      !currentSongMetaRef.current ||
      remaining > REFILL_THRESHOLD ||
      isRefillingRef.current ||
      queue.length === 0
    ) return

    isRefillingRef.current = true
    refillAbortRef.current?.abort()
    const ac = new AbortController()
    refillAbortRef.current = ac
    const gen = ++refillGenRef.current
    refillPageRef.current += 1

    const { artist, language } = currentSongMetaRef.current
    const existingSet = new Set(excludeRef.current)

    fetchSimilarSongs(
      artist,
      language,
      refillPageRef.current,
      10,
      ac.signal,
      [...existingSet]
    )
      .then(songs => {
        if (ac.signal.aborted || gen !== refillGenRef.current) return
        const fresh = songs.filter(s => !existingSet.has(s.id))
        if (fresh.length) {
          startTransition(() => appendToQueue(fresh))
        }
      })
      .catch(() => {})
      .finally(() => {
        if (gen === refillGenRef.current) isRefillingRef.current = false
      })

    return () => {
      ac.abort()
    }
  }, [queue.length, currentIndex, currentSongId, appendToQueue])

  // 3. SEARCH (Delayed spinner, TTL cache, no empty result caching)
  const handleSearch = useCallback((raw) => {
    const q = (raw || '').trim()

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (searchAbortRef.current) searchAbortRef.current.abort()

    if (q.length < 2) {
      setSearchResults([])
      setShowResults(false)
      setIsSearching(false)
      return
    }

    const cached = searchCache.current.get(q.toLowerCase())
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setSearchResults(cached.results)
      setShowResults(true)
      setIsSearching(false)
      return
    }

    setShowResults(true)

    debounceRef.current = setTimeout(async () => {
      const ac = new AbortController()
      searchAbortRef.current = ac
      setIsSearching(true)

      try {
        const results = await searchSongs(q, 8, ac.signal)
        if (ac.signal.aborted) return

        if (results.length) {
          searchCache.current.set(q.toLowerCase(), { results, ts: Date.now() })
          if (searchCache.current.size > 40) {
            const firstKey = searchCache.current.keys().next().value
            searchCache.current.delete(firstKey)
          }
        }
        startTransition(() => setSearchResults(results))
      } catch {
      } finally {
        if (!ac.signal.aborted) setIsSearching(false)
      }
    }, 400)
  }, [])

  // 4. PICK SONG (Generational bump + immediate refill abort)
  const pickSongImpl = useCallback(async (song) => {
    setSearchResults([])
    setShowResults(false)
    setIsSearching(false)

    currentSongMetaRef.current = {
      artist: song.artist,
      language: song.language || 'hindi',
    }
    refillPageRef.current = 0
    isRefillingRef.current = false
    refillGenRef.current += 1
    refillAbortRef.current?.abort()

    loadCustomSongs([song])

    queueAbortRef.current?.abort()
    const ac = new AbortController()
    queueAbortRef.current = ac
    setIsQueueLoading(true)

    try {
      const similar = await fetchSimilarSongs(
        song.artist,
        song.language || 'hindi',
        0,
        10,
        ac.signal,
        [song.id]
      )
      if (ac.signal.aborted) return

      const filtered = similar.filter(s => s.id !== song.id).slice(0, 9)
      if (filtered.length) {
        startTransition(() => appendToQueue(filtered))
      }
    } catch {
    } finally {
      if (!ac.signal.aborted) setIsQueueLoading(false)
    }
  }, [loadCustomSongs, appendToQueue])

  const pickSongRef = useRef(pickSongImpl)
  pickSongRef.current = pickSongImpl

  const pickSong = useCallback((song) => {
    pickSongRef.current(song)
  }, [])

  const dismissSearch = useCallback(() => setShowResults(false), [])

  useEffect(() => {
    return () => {
      searchAbortRef.current?.abort()
      queueAbortRef.current?.abort()
      refillAbortRef.current?.abort()
      refillGenRef.current += 1
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const isBootLoading = isRecommendedLoading || isTrendingLoading

  return {
    recommended, isRecommendedLoading,
    trending, isTrendingLoading, isBootLoading,
    searchResults, isSearching,
    isQueueLoading, showResults,
    handleSearch, pickSong, dismissSearch,
  }
}