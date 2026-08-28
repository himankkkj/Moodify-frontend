const BASE_URL = import.meta.env.VITE_JIOSAAVN_URL || "https://saavn.dev/api";

const isMobile =
  typeof navigator !== "undefined" &&
  /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

// ─── MERGED ORIGINAL (STUDIO) POOLS ──────────────────────────────────────────
// Modern Indie + Gen-Z Viral + DHH + Contemporary Bollywood & Global Pop

const MOOD_ORIGINAL_POOLS = {
  sad: [
    // Modern Indie & Solo Artists
    "Anuv Jain",
    "Prateek Kuhad",
    "Mitraz Songs",
    "Abdul Hannan",
    "Osho Jain",
    "Vishal Mishra Emotional",
    "B Praak Emotional Songs",
    // Modern Bollywood & I-Pop Heartbreak
    "Hindi Indie Heartbreak",
    "I-Pop Sad",
    "Late Night Hindi Indie",
    "Modern Bollywood Sad Songs",
    "Arijit Singh Sad Songs",
    "Viral Sad Songs Hindi",
    "Sad Hindi Songs 2024",
  ],

  happy: [
    // Modern Upbeat & Pop
    "I-Pop Feel Good",
    "Hindi Indie Pop",
    "Bollywood Party Hits",
    "Feel Good Hindi",
    "Punjabi Party Songs",
    "Dance Hindi Hits",
    "Diljit Dosanjh",
    "King Songs",
    "Viral Hits India",
    "Desi Indie Chill",
    "Hindi Indie Acoustic",
    "I-Pop Chill",
    "Zaeden Hits",
    "Aditya Rikhari",
    "Taba Chake",
    "Soft Hindi Songs",
    "Chill Hindi Pop",
    // Global Pop Hits
    "The Weeknd",
    "Chris Brown",
    "Dua Lipa",
    "Central Cee",
  ],

  neutral: [
    // Cafe / Chill Acoustic / Indie Vibe
    "Anuv Jain",
    "Prateek Kuhad",
    "Desi Indie Chill",
    "Hindi Indie Acoustic",
    "I-Pop Chill",
    "Zaeden Hits",
    "Aditya Rikhari",
    "Taba Chake",
    "Soft Hindi Songs",
    "Chill Hindi Pop",
    "Acoustic Hindi Songs",
    "Naam Sujal",
  ],

  angry: [
    // DHH (Desi Hip Hop) & Hype Drill
    "Desi Hip Hop",
    "Punjabi Rap Hits",
    "Seedhe Maut",
    "KR$NA",
    "Talha Anjum",
    "Raftaar",
    "Divine Rap",
    "Punjabi Drill",
    "Karan Aujla Hard",
    "Gym Motivation DHH",
    // Global Hype
    "Central Cee",
    "Travis Scott",
  ],

  surprised: [
    // Trending Reels & Chartbusters
    "Trending Reels Hindi",
    "Viral Hits India 2024",
    "Hot Hits Hindi",
    "Weekly Top Songs India",
    "Talwiinder Hits",
    "AP Dhillon",
    "Karan Aujla",
    "Diljit Dosanjh",
    "Seedhe Maut",
    "Top Hindi Indie",
    // Global Hits
    "The Weeknd",
    "Chris Brown",
  ],
};


const MOOD_LOFI_POOLS = {
  sad: [
    "Lofi Hindi Heartbreak",
    "Bollywood Lofi Sad",
    "Arijit Singh Lofi",
  ],

  happy: [
    "Lofi Happy Hindi",
    "Bollywood Lofi Chill",
  ],

  neutral: [
    "Lofi Bollywood Chill",
    "Hindi Lofi Beats",
    "Study Lofi Hindi",
  ],

  // No lofi for angry — keep full energy
  angry: [],

  surprised: [
    "Bollywood Lofi Chill",
  ],
};

// Detect lofi-ish titles so we can place them sparsely
const LOFI_TITLE_REGEX = /(lofi|lo-fi|chill hop|chillhop|study beats)/i;

// Hard junk gets removed everywhere
const HARD_JUNK_REGEX =
  /(slowed|reverb|sped up|speed up|karaoke|cover|8d audio|instrumental|nightcore)/i;

// Soft junk is removed from originals but allowed in lofi tracks
const SOFT_JUNK_REGEX = /(lofi flip|remix)/i;

const playlistCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 Minutes

// ─── STREAM & COVER SELECTORS ───────────────────────────────────────────────
const pickStreamUrl = (downloadUrl = []) => {
  if (!Array.isArray(downloadUrl) || !downloadUrl.length) return null;
  const preferred = isMobile
    ? ["160kbps", "320kbps", "96kbps"]
    : ["320kbps", "160kbps", "96kbps"];

  for (const q of preferred) {
    const match = downloadUrl.find((d) => d.quality === q)?.url;
    if (match) return match;
  }
  return downloadUrl[downloadUrl.length - 1]?.url || null;
};

const pickCoverUrl = (images = []) => {
  if (!Array.isArray(images) || !images.length) return null;
  const preferred = isMobile
    ? ["150x150", "500x500", "50x50"]
    : ["500x500", "150x150", "50x50"];

  for (const q of preferred) {
    const match = images.find((img) => img.quality === q)?.url;
    if (match) return match;
  }
  return images[images.length - 1]?.url || null;
};

// ─── UTILITY: SHUFFLE & INTERLEAVE ARRAY ────────────────────────────────────
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Interleave originals + lofi with roughly one lofi track per three songs.
 */
const interleaveOriginalsAndLofi = (
  originals,
  lofiTracks,
  limit = 20,
  lofiEvery = 3
) => {
  const out = [];
  const shuffledOriginals = shuffleArray(originals);
  const shuffledLofi = shuffleArray(lofiTracks);

  let originalIndex = 0;
  let lofiIndex = 0;
  let sinceLofi = 0;

  while (
    out.length < limit &&
    (originalIndex < shuffledOriginals.length || lofiIndex < shuffledLofi.length)
  ) {
    const wantLofi =
      shuffledLofi.length > 0 &&
      lofiIndex < shuffledLofi.length &&
      sinceLofi >= lofiEvery - 1 &&
      !(out.length === 0 && shuffledOriginals.length > 0);

    if (wantLofi) {
      const track = shuffledLofi[lofiIndex++];
      out.push({
        ...track,
        metadata: { ...(track.metadata || {}), isLofi: true },
      });
      sinceLofi = 0;
    } else if (originalIndex < shuffledOriginals.length) {
      const track = shuffledOriginals[originalIndex++];
      out.push({
        ...track,
        metadata: { ...(track.metadata || {}), isLofi: false },
      });
      sinceLofi++;
    } else if (lofiIndex < shuffledLofi.length) {
      const track = shuffledLofi[lofiIndex++];
      out.push({ ...track, metadata: { ...(track.metadata || {}), isLofi: true } });
      sinceLofi = 0;
    } else {
      break;
    }
  }

  return out;
};

/**
 * Fetch tracks from a single playlist query
 */
const fetchPlaylistTracks = async (cleanBaseUrl, searchQuery, signal) => {
  try {
    const searchUrl = `${cleanBaseUrl}/search/playlists?query=${encodeURIComponent(
      searchQuery
    )}&limit=5`;
    const searchRes = await fetch(searchUrl, { signal });
    if (!searchRes.ok) return [];

    const searchData = await searchRes.json();
    const playlists = searchData?.data?.results || searchData?.data || [];
    if (!playlists.length) return [];

    const scorePlaylist = (playlist) => {
      const name = (playlist.name || "").toLowerCase();
      const query = searchQuery.toLowerCase();
      let score = 0;
      if (name.includes(query.split(" ")[0])) score += 2;
      if (/official|hits|top|radio|essentials/i.test(name)) score += 2;

      const isLofiSearch = /lofi/i.test(query);
      const isLofiName = /lofi|lo-fi|slowed|reverb/i.test(name);
      if (isLofiName) score += isLofiSearch ? 3 : -3;

      return score;
    };

    const ranked = [...playlists].sort(
      (first, second) => scorePlaylist(second) - scorePlaylist(first)
    );
    const playlistId = ranked[0]?.id;
    if (!playlistId) return [];

    const detailsUrl = `${cleanBaseUrl}/playlists?id=${playlistId}&limit=20`;
    const detailsRes = await fetch(detailsUrl, { signal });
    if (!detailsRes.ok) return [];

    const detailsData = await detailsRes.json();
    return detailsData?.data?.songs || detailsData?.data?.results || [];
  } catch {
    return [];
  }
};

const fetchMoodTagTracks = async (mood, limit = 15, signal) => {
  if (!BASE_URL) return [];

  const cleanBaseUrl = BASE_URL.replace(/\/$/, "");
  const normalizedMood = mood?.toLowerCase() || "neutral";
  const queries = MOOD_ORIGINAL_POOLS[normalizedMood] || MOOD_ORIGINAL_POOLS.neutral;
  const rawSongs = (
    await Promise.all(
      shuffleArray(queries)
        .slice(0, 3)
        .map((query) => fetchPlaylistTracks(cleanBaseUrl, query, signal))
    )
  ).flat();

  const seen = new Set();
  return shuffleArray(rawSongs)
    .map((song) => ({
      name: song?.name,
      artist: song?.artists?.primary?.[0]?.name || song?.artist || "Unknown Artist",
    }))
    .filter((track) => {
      if (!track.name || HARD_JUNK_REGEX.test(track.name)) return false;
      const key = `${track.name.toLowerCase()}|||${track.artist.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
};

// ─── MAIN EXPORT: GET TRACKS BY MOOD ────────────────────────────────────────
export const getTracksByMood = async (mood, limit = 20, signal) => {
  if (!BASE_URL) {
    throw new Error("Missing VITE_JIOSAAVN_URL in .env file");
  }

  const cleanBaseUrl = BASE_URL.replace(/\/$/, "");
  const normalizedMood = mood?.toLowerCase() || "neutral";

  // Check 30-min cache
  const cached = playlistCache.get(normalizedMood);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return interleaveOriginalsAndLofi(
      cached.originals || cached.tracks || [],
      cached.lofi || [],
      limit,
      3
    );
  }

  const originalPool =
    MOOD_ORIGINAL_POOLS[normalizedMood] || MOOD_ORIGINAL_POOLS.neutral;
  const lofiPool = MOOD_LOFI_POOLS[normalizedMood] || [];
  const originalQueries = shuffleArray(originalPool).slice(0, 2);
  const lofiQuery = lofiPool.length ? shuffleArray(lofiPool)[0] : null;

  try {
    const tasks = originalQueries.map((query) =>
      fetchPlaylistTracks(cleanBaseUrl, query, signal)
    );
    if (lofiQuery) {
      tasks.push(fetchPlaylistTracks(cleanBaseUrl, lofiQuery, signal));
    }

    const results = await Promise.all(tasks);
    const originalRaw = results.slice(0, originalQueries.length).flat();
    const lofiRaw = lofiQuery ? results[results.length - 1] || [] : [];

    const formatSong = (song, forceLofiFlag = null) => {
      if (!song || !song.name) return null;
      if (HARD_JUNK_REGEX.test(song.name)) return null;
      if (forceLofiFlag === false && SOFT_JUNK_REGEX.test(song.name)) return null;

      const streamUrl = pickStreamUrl(song.downloadUrl);
      if (!streamUrl) return null;

      const primaryArtist =
        song.artists?.primary?.[0]?.name || song.artist || "Unknown Artist";

      const isLofi =
        forceLofiFlag !== null
          ? forceLofiFlag
          : LOFI_TITLE_REGEX.test(song.name) || LOFI_TITLE_REGEX.test(primaryArtist);

      return {
        id: song.id,
        name: song.name,
        artist: primaryArtist,
        cover: pickCoverUrl(song.image),
        url: streamUrl,
        duration: Number(song.duration) || 0,
        metadata: {
          isTrending: true,
          mood: normalizedMood,
          isLofi,
        },
      };
    };

    const buildCleanList = (rawSongs, preferLofi = null) => {
      const seen = new Set();
      const artistCounts = new Map();
      const list = [];

      for (const song of shuffleArray(rawSongs)) {
        const formatted = formatSong(song, preferLofi);
        if (!formatted) continue;
        if (preferLofi === false && formatted.metadata.isLofi) continue;
        if (preferLofi === true) formatted.metadata.isLofi = true;

        const songKey = `${formatted.name.toLowerCase()}|||${formatted.artist.toLowerCase()}`;
        const artistKey = formatted.artist.toLowerCase();
        const count = artistCounts.get(artistKey) || 0;
        if (seen.has(songKey) || count >= 2) continue;

        seen.add(songKey);
        artistCounts.set(artistKey, count + 1);
        list.push(formatted);
        if (list.length >= 40) break;
      }
      return list;
    };

    let originals = buildCleanList(originalRaw, false);
    let lofiTracks = buildCleanList(lofiRaw, true);

    if (originals.length < 8) {
      const fallback = await fetchChartFallback(cleanBaseUrl, 20, signal);
      originals = [...originals, ...fallback.map((song) => ({
        ...song,
        metadata: { ...(song.metadata || {}), isLofi: false, mood: normalizedMood },
      }))];
    }

    if (!originals.length && !lofiTracks.length) {
      return fetchChartFallback(cleanBaseUrl, limit, signal);
    }

    const maxLofi = Math.max(2, Math.floor(limit * 0.3));
    lofiTracks = lofiTracks.slice(0, maxLofi);
    const finalQueue = interleaveOriginalsAndLofi(originals, lofiTracks, limit, 3);

    playlistCache.set(normalizedMood, {
      ts: Date.now(),
      originals,
      lofi: lofiTracks,
      tracks: finalQueue,
    });

    return finalQueue;
  } catch (error) {
    console.warn(`JioSaavn multi-playlist fetch failed for "${mood}". Falling back to top chart...`, error);
    return fetchChartFallback(cleanBaseUrl, limit, signal);
  }
};

/**
 * Fallback to JioSaavn Official Weekly Top 20 India
 */
const fetchChartFallback = async (cleanBaseUrl, limit, signal) => {
  try {
    const rawSongs = await fetchPlaylistTracks(cleanBaseUrl, "Weekly Top 20 India", signal);
    
    return rawSongs
      .map((song) => {
        if (!song || HARD_JUNK_REGEX.test(song.name)) return null;
        const streamUrl = pickStreamUrl(song.downloadUrl);
        if (!streamUrl) return null;

        return {
          id: song.id,
          name: song.name,
          artist: song.artists?.primary?.[0]?.name || "Top Chart Artist",
          cover: pickCoverUrl(song.image),
          url: streamUrl,
          duration: Number(song.duration) || 0,
        };
      })
      .filter(Boolean)
      .slice(0, limit);
  } catch {
    return [];
  }
};

/**
 * Individual track search helper (for manual search if needed)
 */
export const searchSong = async (name, artist, signal) => {
  if (!BASE_URL || !name) return null;
  const cleanBaseUrl = BASE_URL.replace(/\/$/, "");

  try {
    const query = encodeURIComponent(`${name} ${artist || ""}`.trim());
    const res = await fetch(`${cleanBaseUrl}/search/songs?query=${query}&limit=1`, { signal });
    if (!res.ok) return null;

    const data = await res.json();
    const song = data?.data?.results?.[0];
    if (!song) return null;

    const streamUrl = pickStreamUrl(song.downloadUrl);
    if (!streamUrl) return null;

    return {
      id: song.id,
      name: song.name,
      artist: song.artists?.primary?.[0]?.name || artist || "Unknown",
      cover: pickCoverUrl(song.image),
      url: streamUrl,
      duration: Number(song.duration) || 0,
    };
  } catch {
    return null;
  }
};

export const getMoodTagTracks = fetchMoodTagTracks;