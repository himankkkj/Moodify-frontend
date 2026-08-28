const BASE_URL = (import.meta.env.VITE_JIOSAAVN_URL || '').replace(/\/$/, '')

const DEBUG = import.meta.env.DEV
const log = (...args) => { if (DEBUG) console.log(...args) }

if (!BASE_URL && DEBUG) {
  console.warn('[GestureService] VITE_JIOSAAVN_URL is not set. All API calls will fail.')
}

const isMobile =
  typeof navigator !== 'undefined' &&
  /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)

// ─── Safe String Encoder ──────────────────────────────────────────────────────
const safeEncode = (str) => {
  try {
    return encodeURIComponent(str)
  } catch {
    return encodeURIComponent(String(str).replace(/[^\w\s]/g, ''))
  }
}

// ─── Network Wrappers (Timeout + In-flight Deduping) ──────────────────────────
const fetchWithTimeout = (url, options = {}, timeoutMs = 8000) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  const externalSignal = options.signal
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort()
    } else {
      externalSignal.addEventListener('abort', () => controller.abort(), { once: true })
    }
  }

  if (controller.signal.aborted) {
    return Promise.reject(new DOMException('Aborted', 'AbortError'))
  }

  return fetch(url, { ...options, signal: controller.signal }).finally(() => {
    clearTimeout(timeout)
  })
}

const fetchWithRetry = async (url, options = {}, retries = 1) => {
  try {
    const res = await fetchWithTimeout(url, options)
    // Retry on rate-limit or server errors
    if ((res.status === 429 || res.status >= 500) && retries > 0) {
      await new Promise(r => setTimeout(r, 1000))
      return fetchWithRetry(url, options, retries - 1)
    }
    return res
  } catch (err) {
    if (err.name === 'AbortError') throw err // don't retry aborts
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1000))
      return fetchWithRetry(url, options, retries - 1)
    }
    throw err
  }
}

const _inflight = new Map()

const dedupedFetch = async (url, options = {}) => {
  const key = url
  if (_inflight.has(key)) return _inflight.get(key)

  // Strip caller signal so one abort doesn't kill the shared request
  const { signal: _callerSignal, ...restOptions } = options

  const promise = fetchWithTimeout(url, restOptions)
    .then(r => (r.ok ? r.json() : null))
    .finally(() => _inflight.delete(key))

  _inflight.set(key, promise)

  // If caller aborted, throw for them but keep the shared request alive
  if (_callerSignal?.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }

  return promise
}

// ─── Stream & Cover Pickers ──────────────────────────────────────────────────
export const pickStreamUrl = (downloadUrl = []) => {
  // Handle object map variations: { "160kbps": "url", "320kbps": "url" }
  if (downloadUrl && typeof downloadUrl === 'object' && !Array.isArray(downloadUrl)) {
    const order = isMobile ? ['160kbps', '320kbps', '96kbps'] : ['320kbps', '160kbps', '96kbps']
    for (const q of order) {
      if (downloadUrl[q]) return downloadUrl[q]
    }
    return Object.values(downloadUrl)[0] || null
  }
  if (!Array.isArray(downloadUrl) || !downloadUrl.length) return null

  const order = isMobile
    ? ['160kbps', '320kbps', '96kbps']
    : ['320kbps', '160kbps', '96kbps']
  for (const q of order) {
    const url = downloadUrl.find(d => d.quality === q)?.url
    if (url) return url
  }
  return downloadUrl.at(-1)?.url || null
}

export const pickCoverUrl = (images = []) => {
  if (images && typeof images === 'object' && !Array.isArray(images)) {
    const order = isMobile ? ['150x150', '500x500', '50x50'] : ['500x500', '150x150', '50x50']
    for (const q of order) {
      if (images[q]) return images[q]
    }
    return Object.values(images)[0] || null
  }
  if (!Array.isArray(images) || !images.length) return null
  const order = isMobile
    ? ['150x150', '500x500', '50x50']
    : ['500x500', '150x150', '50x50']
  for (const q of order) {
    const url = images.find(img => img.quality === q)?.url
    if (url) return url
  }
  return images.at(-1)?.url || null
}

// ─── Utilities ────────────────────────────────────────────────────────────────
const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Spotify-style shuffle: never place two songs by the same artist adjacent.
 * O(n) scan with index-based splice.
 */
const shuffleNoAdjacentArtist = (songs) => {
  if (songs.length <= 2) return shuffle(songs)

  const pool = [...songs]
  const result = []
  let lastArtist = ''

  while (pool.length > 0) {
    let pickIdx = -1

    // Scan from random start to avoid position bias
    const start = Math.floor(Math.random() * pool.length)
    for (let i = 0; i < pool.length; i++) {
      const idx = (start + i) % pool.length
      if (pool[idx].artist.toLowerCase() !== lastArtist) {
        pickIdx = idx
        break
      }
    }

    // Fallback if all remaining songs are by the same artist
    if (pickIdx === -1) pickIdx = 0

    const pick = pool[pickIdx]
    result.push(pick)
    lastArtist = pick.artist.toLowerCase()
    pool.splice(pickIdx, 1)
  }

  return result
}

const HARD_JUNK = /(slowed|reverb|sped up|karaoke|cover|8d audio|instrumental|nightcore)/i

const decodeHtml = (html = '') => {
  if (typeof document === 'undefined') {
    return html
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
  }
  const txt = document.createElement('textarea')
  txt.innerHTML = html
  return txt.value
}

const formatSong = (raw, skipFilters = false) => {
  if (!raw || !raw.name) return null
  if (!skipFilters && HARD_JUNK.test(raw.name)) return null

  const url = pickStreamUrl(raw.downloadUrl) || raw.url || raw.media_url || null
  if (!url) return null

  const primaryArtist =
    raw.artists?.primary?.[0]?.name ||
    (typeof raw.artist === 'string' ? raw.artist : null) ||
    raw.primaryArtists ||
    raw.subtitle ||
    'Unknown Artist'

  const cover = pickCoverUrl(raw.image) || raw.cover || (Array.isArray(raw.image) ? raw.image[0]?.url : null)

  const duration = (() => {
    const d = raw.duration
    if (typeof d === 'number') return d
    if (typeof d === 'string' && d.includes(':')) {
      const [m, s] = d.split(':').map(Number)
      return (m || 0) * 60 + (s || 0)
    }
    return Number(d) || 0
  })()

  return Object.freeze({
    id: raw.id || String(Math.random()),
    name: decodeHtml(raw.name),
    artist: decodeHtml(primaryArtist),
    cover,
    url,
    duration,
    language: raw.language || 'hindi',
    year: Number(raw.year) || null,
    playCount: Number(raw.playCount) || 0,
  })
}

const unwrapSong = (data) => {
  if (!data) return null
  if (Array.isArray(data?.data?.results) && data.data.results[0]) return data.data.results[0]
  if (Array.isArray(data?.data) && data.data[0]) return data.data[0]
  if (Array.isArray(data?.results) && data.results[0]) return data.results[0]
  if (data?.data?.id && data?.data?.name) return data.data
  if (data?.id && data?.name) return data
  return null
}

// ─── Playlist helper ──────────────────────────────────────────────────────────
const fetchPlaylistSongs = async (query, limit = 15, signal) => {
  try {
    const searchRes = await fetchWithRetry(
      `${BASE_URL}/search/playlists?query=${safeEncode(query)}&limit=5`,
      { signal }
    )
    if (!searchRes.ok) return []
    const searchData = await searchRes.json()
    const playlists = searchData?.data?.results || searchData?.data || []
    if (!playlists.length) return []

    // ⚡ Score playlists: prefer broad/official, penalize artist-specific & lofi
    const scored = playlists
      .map(pl => {
        const name = (pl.name || '').toLowerCase()
        let score = 0
        if (/official|hits|top|hot|charts|viral|trending|202[0-9]|201[8-9]/i.test(name)) score += 4
        if (/lofi|slowed|old|classic|retro|90s|80s|ghazal|devotional/i.test(name)) score -= 5
        if (/(arijit|pritam|diljit|karan aujla|vilen|anuv jain|ritviz)/i.test(name)) score -= 3
        if (name.includes(query.toLowerCase().split(' ')[0])) score += 2
        return { pl, score }
      })
      .sort((a, b) => b.score - a.score)

    const topPlaylists = scored.slice(0, 2).map(s => s.pl?.id).filter(Boolean)
    if (!topPlaylists.length) return []

    // ⚡ Parallelize playlist detail fetches
    const detailResults = await Promise.allSettled(
      topPlaylists.map(plId =>
        fetchWithRetry(`${BASE_URL}/playlists?id=${plId}&limit=${Math.ceil(limit / 2) + 5}`, { signal })
          .then(r => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    )

    const allSongs = []
    for (const result of detailResults) {
      if (result.status !== 'fulfilled' || !result.value) continue
      const data = result.value
      const songs = data?.data?.songs || data?.data?.results || []
      allSongs.push(...songs)
    }
    return allSongs
  } catch {
    return []
  }
}

// ─── Curated Songs ───────────────────────────────────────────────────────────
const CURATED_TRACKS = [
  { id: 'OOHupOY9', query: 'Jahaan Lost Stories' },
  { id: 'XaTVJ46j', query: 'Aasmani Samad Khan' },
  { id: 'tfslPNdD', query: 'Parshawan Harnoor' },
  { id: '0n55hALC', query: 'Jiyein Kyun Pritam' },
  { id: 'jUiN6O6M', query: 'Guitar Sikhda Jassie Gill' },
  { id: 'AuenB64o', query: 'Chalo Chalein Ritviz' },
  { id: 'CNFlNaEe', query: 'Kaise Keh Dein Khwaab' },
  { id: 'ZNznCfJM', query: 'Saibo Sachin Jigar' },
  { id: '4Wmo5mbb', query: 'Gumshuda Vishesh Malik' },
  { id: 'aS8xzV3P', query: 'Mausam Rahul Vaidya' },
  { id: 'z3pO-YKm', query: 'Aa Mil Zaeden' },
  { id: 'ajXOOYx0', query: 'Tujhse Naraz Nahi Zindagi Sanam' },
  { id: 'zujE-loc', query: 'Marudaani Sanah Moidutty' },
  { id: 'B05VpElV', query: 'Urf Zakir Naalayak' },
  { id: 'XEwppweN', query: 'Haaye Oye Qaran' },
  { id: '6Pbr7tva', query: 'Lalkara Diljit Dosanjh' },
  { id: 'w40TL-Cm', query: 'Ek Raat Vilen' },
  { id: 'F9Jl_E_E', query: 'Waade Riar Saab' },
  { id: 'C1DrCLKY', query: 'Manchala Shekhar' },
  { id: '5-dq391s', query: 'Jiya Lage Na Sona Mohapatra' },
  { id: 'AddWo0lb', query: 'LAAVAN Jasmine Sandlas' },
  {id: 'AiaEw6j1', query: 'Inaam'},
  {id: 'W3ZAWX5t', query: 'Nadaan Parindey'}
]

let _curatedCache = null
const _similarCache = new Map()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes
const MAX_CACHE_SIZE = 30

const cacheSet = (key, value) => {
  if (_similarCache.size >= MAX_CACHE_SIZE) {
    const oldest = _similarCache.keys().next().value
    _similarCache.delete(oldest)
  }
  _similarCache.set(key, value)
}

// ─── Trending / Popular Tracks ─────────────────────────────────────────────────
const TRENDING_TRACKS = [
  { id: '7pwl-uA1', query: 'Makeen Salem Sandhu' },
  { id: 'OS8d3tNR', query: 'Yeh Duniya Jala Do Janisht Joshi' },
  { id: 'Q3o186fj', query: 'Sunday Aditya A NAALAYAK' },
  { id: 'zIPKC8PK', query: 'Tum Se Hi Pritam' },
  { id: 'HrzRGNij', query: 'Teri Meri Kahaani Arijit Singh' },
  { id: '8SmtfVfd', query: 'Phir Bhi Tumko Chaahunga' },
  { id: 'AWr2L-Y-', query: 'Bawara Mann Shubha Mudgal' },
  { id: 'ync2DZw3', query: 'Bade Achhe Lagte Hain Amit Kumar' },
  { id: 'lhqxyJtv', query: 'Kagaz Priyansh Srivastava' },
  { id: 'MBAeAkci', query: 'Abhi Kuch Dino Se Pritam' },
  { id: 'lULDgPcz', query: 'Main Hoon Na Sonu Nigam' },
  { id: 'ySPccj9S', query: 'Pyari Amaanat Arpit Bala' },
  { id: 'uUh_x8Vg', query: 'Mitwa A.R. Rahman' },
  { id: 'a5d4-kXE', query: 'Abhi Na Jao Chhod Kar' },
  { id: 'YPDqTn3x', query: 'Ehsaas Acoustic Faheem Abdullah' },
  { id: 'cli-P2pu', query: 'Arz Kiya Hai Anuv Jain Coke Studio' },
  { id: 'vYtqAAi-', query: 'Aarzu Madhurxo' },
  { id: 'tM7QIScN', query: 'Samjho Na'},
  {id: 'RMnHyp2C', query: 'Tum Ho Toh'},
  {id: 'SWu3cDHH', query: 'Tose Naina'},
]

let _trendingCache = null

export const getCuratedSongs = async (signal) => {
  if (!BASE_URL) return []
  if (_curatedCache?.length) return _curatedCache

  const settled = await Promise.allSettled(
    CURATED_TRACKS.map(async (item) => {
      try {
        const res = await fetchWithTimeout(
          `${BASE_URL}/search/songs?query=${safeEncode(item.query)}&limit=1`,
          { signal }
        )
        if (!res.ok) return null
        const data = await res.json()
        const results = data?.data?.results || data?.data || data?.results || []
        return formatSong(Array.isArray(results) ? results[0] : results)
      } catch { return null }
    })
  )

  const songs = settled
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value)

  if (songs.length > 0) _curatedCache = shuffle(songs)
  console.log(`[curated] loaded ${_curatedCache?.length || 0}/${CURATED_TRACKS.length} songs`)
  return _curatedCache || []
}

// ─── Trending / Popular Songs ─────────────────────────────────────────────────
// Hand-picked list — no year/playCount filters applied (classics must survive)
export const getTrendingSongs = async (signal, limit = 6) => {
  if (!BASE_URL) return []
  if (_trendingCache?.length) return _trendingCache.slice(0, limit)

  const settled = await Promise.allSettled(
    TRENDING_TRACKS.map(async (item) => {
      try {
        const res = await fetchWithTimeout(
          `${BASE_URL}/search/songs?query=${safeEncode(item.query)}&limit=1`,
          { signal }
        )
        if (!res.ok) return null
        const data = await res.json()
        const results = data?.data?.results || data?.data || data?.results || []
        return formatSong(Array.isArray(results) ? results[0] : results, /* skipFilters */ true)
      } catch { return null }
    })
  )

  const songs = settled
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value)

  if (songs.length > 0) _trendingCache = shuffle(songs)
  console.log(`[trending] loaded ${_trendingCache?.length || 0}/${TRENDING_TRACKS.length} songs`)
  return (_trendingCache || []).slice(0, limit)
}

// ─── Song Search ──────────────────────────────────────────────────────────────
export const searchSongs = async (query, limit = 8, signal) => {
  if (!BASE_URL || signal?.aborted || !query?.trim()) return []
  try {
    const data = await dedupedFetch(
      `${BASE_URL}/search/songs?query=${safeEncode(query.trim())}&limit=${limit}`,
      { signal }
    ).catch(() => null)
    if (!data) return []
    const results = data?.data?.results || data?.data || []
    return results.map(formatSong).filter(Boolean)
  } catch {
    return []
  }
}

// ─── 🎯 SPOTIFY-STYLE GENRE + SIMILAR SONGS ──────────────────────────────────
const ARTIST_GENRE_MAP = {
  'arijit singh':     { primary: 'Bollywood Romantic Hits',     blend: ['Hindi Love Songs', 'Bollywood Sad Songs'] },
  'pritam':           { primary: 'Bollywood Soundtrack Hits',   blend: ['Hindi Film Songs', 'Bollywood Party Songs'] },
  'sachin-jigar':     { primary: 'Bollywood Indie Pop',         blend: ['Hindi Feel Good Songs', 'Bollywood Fresh'] },
  'sanam':            { primary: 'Bollywood Romantic Hits',     blend: ['Hindi Love Songs', 'Bollywood Unplugged'] },
  'sona mohapatra':   { primary: 'Hindi Powerful Vocals',       blend: ['Bollywood Female Hits', 'Hindi Rock Songs'] },
  'rahul vaidya':     { primary: 'Hindi Romantic Hits',         blend: ['Bollywood Love Songs', 'Hindi Pop Songs'] },
  'ritviz':           { primary: 'Hindi Electronic Pop',        blend: ['Indian Indie Electronic', 'Hindi Party Songs'] },
  'zaeden':           { primary: 'Hindi Indie Pop',             blend: ['Indian Electronic Hits', 'Hindi Chill Pop'] },
  'anuv jain':        { primary: 'Hindi Indie Songs',           blend: ['Indian Indie Acoustic', 'Hindi Singer Songwriter'] },
  'prateek kuhad':    { primary: 'Hindi Indie Acoustic',        blend: ['Indian Indie Folk', 'Hindi Singer Songwriter'] },
  'mitraz':           { primary: 'Hindi Indie Pop',             blend: ['Indian Indie Hits', 'Hindi Lo-fi Pop'] },
  'vilen':            { primary: 'Hindi Indie Pop',             blend: ['Hindi Dark Pop', 'Indian Indie Hits'] },
  'riar saab':        { primary: 'Punjabi Indie Hits',          blend: ['Punjabi Pop Songs', 'Hindi Punjabi Mix'] },
  'harnoor':          { primary: 'Punjabi Love Songs',          blend: ['Punjabi Pop Hits', 'Latest Punjabi Songs'] },
  'jassie gill':      { primary: 'Punjabi Pop Hits',            blend: ['Punjabi Romantic Songs', 'Latest Punjabi'] },
  'diljit dosanjh':   { primary: 'Punjabi Hits Songs',          blend: ['Punjabi Party Songs', 'Latest Punjabi 2024'] },
  'jasmine sandlas':  { primary: 'Punjabi Pop Songs',           blend: ['Punjabi Female Hits', 'Latest Punjabi'] },
  'karan aujla':      { primary: 'Punjabi Hits Songs',          blend: ['Punjabi Rap Songs', 'Latest Punjabi 2024'] },
  'b praak':          { primary: 'Punjabi Emotional Hits',      blend: ['Punjabi Sad Songs', 'Hindi Punjabi Mix'] },
  'divine':           { primary: 'Desi Hip Hop Hits',           blend: ['Indian Rap Songs', 'Hindi Hip Hop'] },
  'seedhe maut':      { primary: 'Desi Hip Hop',                blend: ['Indian Underground Rap', 'Hindi Rap Songs'] },
  'lost stories':     { primary: 'Indian Electronic Hits',      blend: ['EDM Hindi Remix', 'Bollywood Electronic'] },
  'qaran':            { primary: 'Hindi Pop Songs',             blend: ['Bollywood Pop Hits', 'Hindi Dance Songs'] },
  'naalayak':         { primary: 'Hindi Indie Songs',           blend: ['Indian Indie Pop', 'Hindi Underground'] },
  'khwaab':           { primary: 'Hindi Indie Songs',           blend: ['Indian Indie Pop', 'Hindi Dreamy Songs'] },
  'shekhar':          { primary: 'Bollywood Pop Hits',          blend: ['Hindi Film Songs', 'Bollywood Dance'] },
}

const LANGUAGE_GENRE_MAP = {
  punjabi: { primary: 'Punjabi Hits Songs',    blend: ['Latest Punjabi 2024', 'Punjabi Pop Songs'] },
  tamil:   { primary: 'Tamil Hits Songs',      blend: ['Tamil Melody Songs', 'Latest Tamil'] },
  hindi:   { primary: 'Hindi Indie Hits',      blend: ['Bollywood Romantic', 'Hindi Pop Songs'] },
  english: { primary: 'English Pop Hits',      blend: ['English Top Hits', 'Pop Songs 2024'] },
}

// Build once at module load
const _genreMap = new Map(
  Object.entries(ARTIST_GENRE_MAP).map(([k, v]) => [k.toLowerCase(), v])
)

const getGenreQueries = (artistName = '', language = 'hindi') => {
  const lower = (artistName || '').toLowerCase().trim()
  if (!lower) {
    const langGenre = LANGUAGE_GENRE_MAP[language] || LANGUAGE_GENRE_MAP.hindi
    return [langGenre.primary, ...langGenre.blend.slice(0, 1)]
  }

  // O(1) exact match
  const exact = _genreMap.get(lower)
  if (exact) return [exact.primary, ...exact.blend.slice(0, 2)]

  // O(n) partial match fallback
  for (const [key, genre] of _genreMap) {
    if (lower.includes(key) || key.includes(lower)) {
      return [genre.primary, ...genre.blend.slice(0, 2)]
    }
  }

  const langGenre = LANGUAGE_GENRE_MAP[language] || LANGUAGE_GENRE_MAP.hindi
  return [langGenre.primary, ...langGenre.blend.slice(0, 1)]
}

export const fetchSimilarSongs = async (
  artistName,
  language = 'hindi',
  page = 0,
  limit = 10,
  signal,
  excludeIds = []
) => {
  if (!BASE_URL || signal?.aborted) return []

  const queries = getGenreQueries(artistName, language)
  const seedArtistLower = (artistName || '').toLowerCase().trim()
  const excludeSet = new Set(excludeIds)

  console.log(`[similar] seed: "${artistName}" → queries:`, queries)

  // ── Step 0: Check genre cache ──
  const cacheKey = queries[0] + '|' + page
  const cached = _similarCache.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    const unexcluded = excludeSet.size
      ? cached.songs.filter(s => !excludeSet.has(s.id))
      : cached.songs
    if (unexcluded.length >= limit) {
      console.log(`[similar] returned from cache for "${cacheKey}"`)
      return shuffleNoAdjacentArtist(unexcluded).slice(0, limit)
    }
  }

  // ── Step 1: Fetch from multiple genre playlists ──
  const fetchPromises = queries.map(q =>
    fetchPlaylistSongs(q, limit * 3, signal)
  )

  // Also do a direct song search for the primary genre
  const directSearchPromise = (async () => {
    try {
      const res = await fetchWithRetry(
        `${BASE_URL}/search/songs?query=${safeEncode(queries[0])}&limit=${limit * 2}`,
        { signal }
      )
      if (!res.ok) return []
      const data = await res.json()
      return data?.data?.results || data?.data || []
    } catch {
      return []
    }
  })()

  const [playlistResults, directResults] = await Promise.all([
    Promise.allSettled(fetchPromises),
    directSearchPromise,
  ])

  // Merge all raw songs
  const allRaw = []
  for (const result of playlistResults) {
    if (result.status === 'fulfilled') allRaw.push(...result.value)
  }
  allRaw.push(...directResults)

  // ── Step 2: Format, filter, deduplicate & soft-score ──
  const seen = new Set()
  const candidates = []

  for (const raw of allRaw) {
    const song = formatSong(raw)
    if (!song) continue

    // O(1) Exclude IDs already in queue
    if (excludeSet.has(song.id)) continue

    // Soft popularity floor
    if (song.playCount > 0 && song.playCount < 50_000) continue

    const key = `${song.name.toLowerCase()}|||${song.artist.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)

    // Recency-weighted scoring
    const recencyBoost = song.year
      ? Math.max(0, (song.year - 2010) * 0.05)
      : 0.2
    const score = Math.log10(Math.max(song.playCount, 1)) + recencyBoost

    candidates.push({ song, score })
  }

  // ── Step 3: Enforce artist diversity & sort by recency-weighted score ──
  candidates.sort((a, b) => b.score - a.score)

  const artistCount = {}
  const diverse = []

  for (const { song } of candidates) {
    if (diverse.length >= limit * 2) break

    const artistKey = song.artist.toLowerCase()
    const isSeedArtist =
      seedArtistLower &&
      (artistKey.includes(seedArtistLower) || seedArtistLower.includes(artistKey))

    // ⚡ SPOTIFY RULE: max 1 song from the seed artist, max 2 from any other
    const maxAllowed = isSeedArtist ? 1 : 2
    if ((artistCount[artistKey] || 0) >= maxAllowed) continue

    artistCount[artistKey] = (artistCount[artistKey] || 0) + 1
    diverse.push(song)
  }

  // ── Step 4: If we don't have enough, relax filters (O(n) with Set) ──
  if (diverse.length < limit) {
    const diverseIds = new Set(diverse.map(d => d.id))
    for (const { song } of candidates) {
      if (diverse.length >= limit) break
      if (!diverseIds.has(song.id)) {
        diverseIds.add(song.id)
        diverse.push(song)
      }
    }
  }

  // ── Step 5: Cache diverse pool with LRU eviction, trim to limit & shuffle ──
  if (diverse.length > 0) {
    cacheSet(cacheKey, { songs: diverse, ts: Date.now() })
  }

  const finalPool = diverse.slice(0, limit * 2)
  const finalResults = shuffleNoAdjacentArtist(finalPool).slice(0, limit)

  log(
    `[similar] raw: ${allRaw.length}, filtered: ${candidates.length}, ` +
    `diverse: ${diverse.length}, returned: ${finalResults.length}`
  )

  return finalResults
}

export const detectGenreQuery = (artistName = '', language = 'hindi') => {
  const queries = getGenreQueries(artistName, language)
  return queries[0]
}