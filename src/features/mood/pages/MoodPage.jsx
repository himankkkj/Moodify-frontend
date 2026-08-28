import { useEffect, useCallback, useState } from "react"
import { usePlayerApi, usePlayerState } from "../../player/context/player.context"
import useMoodDetection from "../hooks/useMoodDetection"
import MoodOnboarding from "../components/MoodOnboarding"
import MoodDetectMenu from "../components/MoodDetectMenu"
import MusicLayout from "../components/MusicLayout"
import MoodBootLoader from "../components/MoodBootLoader"
import "../styles/mood.scss"

const MoodPage = () => {
  const { loadMood } = usePlayerApi()
  const { queue } = usePlayerState()

  const [showOnboarding] = useState(() => !localStorage.getItem("moodify_onboarding_done"))
  const [onboardingDone, setOnboardingDone] = useState(!showOnboarding)
  const [menuOpen, setMenuOpen] = useState(true)
  const [activeMood, setActiveMood] = useState(null)
  
  // ⚡️ State to lock the bootloader until AI is 100% ready
  const [isBooted, setIsBooted] = useState(false)

  const {
    state, isLoading, isDetecting, isDone, hasError,
    detectedMood, liveMood, scanProgress, error,
    videoRef, initModels, startDetection, reset,
    liveExpressions, loadProgress, isReady
  } = useMoodDetection()

  useEffect(() => { 
    initModels() 
  }, [initModels])

  // ⚡️ Unlock the UI only when loading hits 100% or is already ready
  useEffect(() => {
    if (loadProgress === 100 || isReady || isDone) {
      // Add a tiny 200ms delay so the user sees the bar hit 100% smoothly before layout swap
      const t = setTimeout(() => setIsBooted(true), 200)
      return () => clearTimeout(t)
    }
  }, [loadProgress, isReady, isDone])

  // ⚡️ Deferred GPU shader warmup after boot UI is gone
  useEffect(() => {
    if (!isBooted) return;
    let cancelled = false;
    (async () => {
      try {
        const { warmupModels } = await import("../services/faceapi.service");
        if (!cancelled) await warmupModels();
      } catch (_) {}
    })();
    return () => {
      cancelled = true;
    };
  }, [isBooted]);

  const buttonLabel = (() => {
    if (isDetecting) return "SCANNING..."
    if (isDone)      return "DETECT AGAIN"
    if (hasError)    return "TRY AGAIN"
    return "DETECT MY MOOD"
  })()

  const handleDetect = useCallback(async () => {
    if (isDone || hasError) {
      reset()
      await new Promise(r => setTimeout(r, 50))
      startDetection()
    } else {
      startDetection()
    }
  }, [isDone, hasError, reset, startDetection])

  const handleGetSongs = useCallback(() => {
    if (detectedMood) {
      setActiveMood(detectedMood)
      loadMood(detectedMood.label)
      setMenuOpen(false)
    }
  }, [detectedMood, loadMood])

  const handleDetectAgain = useCallback(() => {
    reset()
    setMenuOpen(true)
  }, [reset])

  const { isMoodLoading } = usePlayerState()
  const hasSongs = queue.length > 0
  const showMusic = hasSongs || isMoodLoading

  // ─── 🛑 BOOTLOADER GATE 🛑 ──────────────────────────────────────
  // Blocks WebGL, Video, and heavy CSS from mounting during network load
  if (!isBooted) {
    return (
      <MoodBootLoader 
        progress={loadProgress} 
        error={hasError ? error : null} 
        onRetry={initModels} 
      />
    )
  }

  // ─── ✅ ACTUAL PAGE (Runs smooth because models are cached) ───
  return (
    <main className="mood-page" data-theme="app">
      <div className={`mood-page__bg ${!onboardingDone ? "mood-page__bg--blurred" : ""}`}>
        {showMusic ? (
          <MusicLayout
            detectedMood={activeMood || detectedMood}
            onDetectAgain={handleDetectAgain}
          />
        ) : (
          <div className="mood-page__empty">
            <h1 className="mood-page__empty-title">
              WHAT'S YOUR <span className="accent">MOOD</span> TODAY?
            </h1>
            <p className="mood-page__empty-sub">
              Let us detect your mood and pick the perfect songs
            </p>
          </div>
        )}
      </div>

      {onboardingDone && (
        <MoodDetectMenu
          isOpen={menuOpen}
          canClose={hasSongs}
          onClose={() => setMenuOpen(false)}
          videoRef={videoRef}
          state={state}
          scanProgress={scanProgress}
          liveMood={liveMood}
          liveExpressions={liveExpressions}
          loadProgress={loadProgress}
          error={error}
          buttonLabel={buttonLabel}
          buttonDisabled={isDetecting}
          onDetect={handleDetect}
          detectedMood={isDone ? detectedMood : null}
          onGetSongs={handleGetSongs}
        />
      )}

      {!onboardingDone && (
        <MoodOnboarding onComplete={() => setOnboardingDone(true)} />
      )}
    </main>
  )
}

export default MoodPage