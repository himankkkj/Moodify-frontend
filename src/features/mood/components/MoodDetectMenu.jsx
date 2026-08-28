import { useEffect, useRef, useMemo, memo } from "react"
import { gsap } from "gsap"
import WebcamFeed from "./WebcamFeed"
import { DETECTION_STATE } from "../hooks/useMoodDetection"
import { moodToColor, moodToEmoji } from "../services/faceapi.service"
import "../styles/mooddetectmenu.scss"

// ⚡️ Static tips array hoisted outside render
const SCAN_TIPS = [
  "Face a window or light source",
  "Remove sunglasses or hats",
  "Keep face centred in frame",
  "Hold expression for 3 seconds",
]

// ⚡️ Takes rounded `pct` integer -> skips render if pct hasn't changed!
const ConfidenceBar = memo(({ label, pct, isActive }) => {
  return (
    <div className={`detect-menu__bar ${isActive ? "detect-menu__bar--active" : ""}`}>
      <span className="detect-menu__bar-label">{label.toUpperCase()}</span>
      <div className="detect-menu__bar-track">
        <div className="detect-menu__bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="detect-menu__bar-value">{pct}%</span>
    </div>
  )
})
ConfidenceBar.displayName = "ConfidenceBar"

const MoodDetectMenu = ({
  isOpen, canClose, onClose,
  videoRef, state, scanProgress,
  liveMood, liveExpressions, loadProgress, error,
  buttonLabel, buttonDisabled,
  onDetect, detectedMood, onGetSongs,
}) => {
  const containerRef = useRef(null)

  const isLoading = state === DETECTION_STATE.LOADING
  const isDetecting = state === DETECTION_STATE.DETECTING
  const isDone = state === DETECTION_STATE.DONE
  const hasError = state === DETECTION_STATE.ERROR

  // ⚡️ Compute expressions & integer % only when detecting or done
  const sortedExpressions = useMemo(() => {
    if ((!isDetecting && !isDone) || !liveExpressions) return []
    return Object.entries(liveExpressions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, val]) => [label, Math.min(Math.round(val * 100), 100)])
  }, [isDetecting, isDone, liveExpressions])

  // ⚡️ GSAP Context with Memory Leak Revert Cleanup
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const ctx = gsap.context(() => {
      const animItems = container.querySelectorAll(
        ".detect-menu__eyebrow, .detect-menu__heading-wrap, .detect-menu__idle, .detect-menu__state, .detect-menu__result, .detect-menu__camera, .detect-menu__actions"
      )

      if (isOpen) {
        gsap.set(container, { display: "grid", visibility: "visible", pointerEvents: "auto" })
        gsap.fromTo(container,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: "power2.out" }
        )
        if (animItems.length) {
          gsap.fromTo(
            animItems,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, stagger: 0.06, duration: 0.45, ease: "power3.out", delay: 0.05 }
          )
        }
      } else {
        if (animItems.length) {
          gsap.to(animItems, {
            opacity: 0, y: -20,
            stagger: 0.03, duration: 0.2, ease: "power2.in"
          })
        }
        gsap.to(container, {
          opacity: 0, duration: 0.25, delay: 0.1, ease: "power2.in",
          onComplete: () => {
            gsap.set(container, { visibility: "hidden", pointerEvents: "none" })
          }
        })
      }
    }, container)

    return () => ctx.revert() // ⚡️ Prevents memory leaks on unmount
  }, [isOpen])

  return (
    <div ref={containerRef} className="detect-menu">
      {/* ── LEFT PANEL ─────────────────────────────── */}
      <div className="detect-menu__left">
        {canClose && (
          <button className="detect-menu__close" onClick={onClose} type="button">
            ✕
          </button>
        )}

        <p className="detect-menu__eyebrow">MOODIFY / DETECT</p>

        <div className="detect-menu__heading-wrap">
          <h1 className="detect-menu__heading">
            WHAT'S YOUR<br />
            <span className="detect-menu__heading-accent">MOOD?</span>
          </h1>
        </div>

        {/* IDLE */}
        {!isDetecting && !isDone && !hasError && (
          <div className="detect-menu__idle">
            <p className="detect-menu__idle-label">BEFORE YOU SCAN</p>
            {SCAN_TIPS.map((tip, i) => (
              <div key={i} className="detect-menu__tip">
                <span className="detect-menu__tip-num">0{i + 1}</span>
                <span className="detect-menu__tip-text">{tip}</span>
              </div>
            ))}
          </div>
        )}

        {/* DETECTING */}
        {isDetecting && (
          <div className="detect-menu__state">
            <p className="detect-menu__state-label">WE THINK YOU'RE FEELING</p>
            <p
              className="detect-menu__live-mood"
              style={{
                color: liveMood?.label && liveMood.label !== "uncertain"
                  ? moodToColor[liveMood.label]
                  : "rgba(10, 10, 10, 0.25)"
              }}
            >
              {!liveMood || liveMood.label === "uncertain" ? "READING..." : liveMood.label.toUpperCase()}
            </p>

            {sortedExpressions.length > 0 && (
              <div className="detect-menu__bars">
                {sortedExpressions.map(([label, pct]) => (
                  <ConfidenceBar
                    key={label}
                    label={label}
                    pct={pct}
                    isActive={liveMood?.label === label}
                  />
                ))}
              </div>
            )}

            <div className="detect-menu__scan">
              <div className="detect-menu__progress">
                <div className="detect-menu__progress-fill" style={{ width: `${scanProgress * 100}%` }} />
              </div>
              <p className="detect-menu__scan-time">{Math.round(scanProgress * 3)}s / 3s</p>
            </div>
          </div>
        )}

        {/* DONE */}
        {isDone && detectedMood && (
          <div className="detect-menu__result">
            <div className="detect-menu__result-heading">
              <p
                className="detect-menu__result-mood"
                style={{
                  color: detectedMood.confidence > 0.6
                    ? moodToColor[detectedMood.label]
                    : "var(--color-text)"
                }}
              >
                {detectedMood.label.toUpperCase()}
              </p>
              <span className="detect-menu__result-emoji">
                {moodToEmoji[detectedMood.label] || "😐"}
              </span>
            </div>

            <p className="detect-menu__result-meta">
              {Math.min(Math.round(detectedMood.confidence * 100), 100)}% confident · {detectedMood.readings} readings
            </p>

            {sortedExpressions.length > 0 && (
              <div className="detect-menu__bars" style={{ marginTop: "0.75rem" }}>
                {sortedExpressions.map(([label, pct]) => (
                  <ConfidenceBar
                    key={label}
                    label={label}
                    pct={pct}
                    isActive={detectedMood?.label === label}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ERROR */}
        {hasError && (
          <div className="detect-menu__state">
            <p className="detect-menu__state-label" style={{ color: "var(--color-accent)" }}>
              ⚠️ {error}
            </p>
          </div>
        )}

        <p className="detect-menu__privacy">
          No photos stored · Runs locally in your browser
        </p>
      </div>

      {/* ── RIGHT PANEL ───────────────────────────── */}
      <div className="detect-menu__right">
        <div className="detect-menu__camera">
          <WebcamFeed
            videoRef={videoRef}
            state={state}
            scanProgress={scanProgress}
            liveMood={liveMood}
            errorMessage={error}
          />
        </div>

        <div className="detect-menu__actions">
          <button
            className={`detect-menu__btn ${buttonDisabled ? "detect-menu__btn--disabled" : ""}`}
            onClick={onDetect}
            disabled={buttonDisabled}
            type="button"
          >
            {buttonLabel}
          </button>

          {isDone && detectedMood && (
            <button
              className="detect-menu__btn detect-menu__btn--primary"
              onClick={onGetSongs}
              type="button"
            >
              GET SONGS FOR {detectedMood.label.toUpperCase()} MOOD →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(MoodDetectMenu, (prev, next) => {
  return (
    prev.isOpen === next.isOpen &&
    prev.canClose === next.canClose &&
    prev.state === next.state &&
    prev.scanProgress === next.scanProgress &&
    prev.loadProgress === next.loadProgress &&
    prev.buttonLabel === next.buttonLabel &&
    prev.buttonDisabled === next.buttonDisabled &&
    prev.error === next.error &&
    prev.liveMood === next.liveMood &&
    prev.liveExpressions === next.liveExpressions &&
    prev.detectedMood === next.detectedMood
  )
})