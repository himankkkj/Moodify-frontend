import { useCallback, useRef, useState } from "react";
import { getTracksByMood } from "../services/jiosaavn.service";

const warmCovers = async (songs, n = 8) => {
  if (!songs || !songs.length) return;
  const slice = songs.slice(0, n);
  await Promise.all(
    slice.map(
      (s) =>
        new Promise((resolve) => {
          if (!s.cover) return resolve();
          const img = new Image();
          img.onload = img.onerror = resolve;
          img.src = s.cover;
        })
    )
  );
};

export const useQueue = ({ onFirstSongReady, onQueueUpdated }) => {
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // ⚡️ New States for UI
  const [isShuffled, setIsShuffled] = useState(false);
  const [loopMode, setLoopMode] = useState("none"); // "none" | "all" | "one"

  const abortRef = useRef(null);
  const queueRef = useRef([]);
  const indexRef = useRef(0);
  
  // ⚡️ New Refs for Logic (no re-renders during playback)
  const originalQueueRef = useRef([]); 
  const loopModeRef = useRef("none");
  const isShuffledRef = useRef(false);

  // Sync state & refs
  const syncQueue = useCallback((q) => {
    if (q === queueRef.current) return;
    queueRef.current = q;
    setQueue(q);
  }, []);

  const syncIndex = useCallback((i) => {
    indexRef.current = i;
    setCurrentIndex(i);
  }, []);

  // ── Shuffle & Loop Actions ────────────────────────────────────────────────
  const cycleLoop = useCallback(() => {
    const next = loopModeRef.current === "none" ? "all" 
               : loopModeRef.current === "all" ? "one" 
               : "none";
    loopModeRef.current = next;
    setLoopMode(next);
  }, []);

  const toggleShuffle = useCallback(() => {
    const orig = originalQueueRef.current;
    if (!orig.length) return;

    if (isShuffledRef.current) {
      // Turn OFF Shuffle: restore original order, find where current song is now
      const currentSong = queueRef.current[indexRef.current];
      const origIdx = orig.findIndex(s => s.id === currentSong?.id);
      syncQueue(orig);
      syncIndex(Math.max(0, origIdx));
      isShuffledRef.current = false;
      setIsShuffled(false);
    } else {
      // Turn ON Shuffle: Keep current at index 0, randomize the rest
      const currentSong = queueRef.current[indexRef.current];
      const others = orig.filter(s => s.id !== currentSong?.id);
      
      // Fast Fisher-Yates shuffle
      for (let i = others.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [others[i], others[j]] = [others[j], others[i]];
      }
      
      syncQueue([currentSong, ...others]);
      syncIndex(0);
      isShuffledRef.current = true;
      setIsShuffled(true);
    }
  }, [syncQueue, syncIndex]);

  // ── Load mood ─────────────────────────────────────────────────────────────
  const loadMood = useCallback(
    async (mood) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);
      syncQueue([]);
      syncIndex(0);

      try {
        const songs = await getTracksByMood(mood, 20, controller.signal);
        if (controller.signal.aborted) return;

        if (!songs || songs.length === 0) {
          setError("No trending songs found for this mood");
          return;
        }

        originalQueueRef.current = songs;
        let initialQueue = songs;

        // Persist shuffle state if user already had it turned on
        if (isShuffledRef.current) {
           const [first, ...rest] = songs;
           for (let i = rest.length - 1; i > 0; i--) {
             const j = Math.floor(Math.random() * (i + 1));
             [rest[i], rest[j]] = [rest[j], rest[i]];
           }
           initialQueue = [first, ...rest];
        }

        // Pre-warm top 8 cover artwork images before turning off skeleton
        await warmCovers(initialQueue, 8);

        if (controller.signal.aborted) return;

        syncQueue(initialQueue);
        syncIndex(0);
        setIsLoading(false);

        onFirstSongReady?.(initialQueue[0]);
        onQueueUpdated?.(initialQueue);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err.message || "Failed to load trending songs");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    },
    [onFirstSongReady, onQueueUpdated, syncQueue, syncIndex]
  );

  // ── Queue actions ─────────────────────────────────────────────────────────
  const goToIndex = useCallback((index) => {
    if (index < 0 || index >= queueRef.current.length) return null;
    syncIndex(index);
    return queueRef.current[index];
  }, [syncIndex]);

  const goNext = useCallback(() => {
    const q = queueRef.current;
    if (!q.length) return null;

    let next = indexRef.current + 1;

    if (next >= q.length) {
      if (loopModeRef.current === "all") {
        next = 0;
      } else {
        return null;
      }
    }

    syncIndex(next);
    return q[next];
  }, [syncIndex]);

  const goPrev = useCallback(() => {
    let prev = indexRef.current - 1;
    if (prev < 0) {
      if (loopModeRef.current === "all" && queueRef.current.length > 0) {
         prev = queueRef.current.length - 1; // Wrap around to end
      } else {
         return null;
      }
    }
    syncIndex(prev);
    return queueRef.current[prev];
  }, [syncIndex]);

  const removeSong = useCallback((id) => {
    originalQueueRef.current = originalQueueRef.current.filter(s => s.id !== id);
    
    const q = queueRef.current;
    const removedIdx = q.findIndex((s) => s.id === id);
    if (removedIdx === -1) return;

    const updated = q.filter((s) => s.id !== id);
    syncQueue(updated);

    if (removedIdx < indexRef.current) {
      syncIndex(indexRef.current - 1);
    } else if (removedIdx === indexRef.current && indexRef.current >= updated.length) {
      syncIndex(Math.max(0, updated.length - 1));
    }
  }, [syncQueue, syncIndex]);

  const clearQueue = useCallback(() => {
    abortRef.current?.abort();
    originalQueueRef.current = [];
    syncQueue([]);
    syncIndex(0);
    setError(null);
  }, [syncQueue, syncIndex]);

  //Added while working on gesture
  const loadCustomSongs = useCallback((songs) => {
    if (!songs?.length) return;
    abortRef.current?.abort();               // cancel any in-flight mood fetch
    const q = [...songs];
    originalQueueRef.current = q;
    syncQueue(q);
    syncIndex(0);
    setError(null);
    onFirstSongReady?.(q[0]);               // triggers audio playback immediately
  }, [syncQueue, syncIndex, onFirstSongReady]);

  const appendToQueue = useCallback((songs) => {
    if (!songs?.length) return;
    const seen = new Set(queueRef.current.map(s => s.id));
    const fresh = songs.filter(s => s?.id && !seen.has(s.id));
    if (!fresh.length) return;

    const updated = [...queueRef.current, ...fresh];
    originalQueueRef.current = [...originalQueueRef.current, ...fresh];
    syncQueue(updated);
  }, [syncQueue]);

  const abort = useCallback(() => abortRef.current?.abort(), []);

  return {
    queue, currentIndex, currentSong: queue[currentIndex] || null,
    isLoading, error, queueRef, indexRef,
    
    // ⚡️ New exports
    isShuffled, loopMode, loopModeRef, toggleShuffle, cycleLoop,
    
    loadMood, loadCustomSongs, appendToQueue, goToIndex, goNext, goPrev, removeSong, clearQueue, abort,
  };
};