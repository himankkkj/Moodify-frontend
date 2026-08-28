import { memo, useMemo } from "react"
import { DETECTION_STATE } from "../hooks/useMoodDetection"
import { moodToColor, moodToEmoji } from "../services/faceapi.service"
import "../styles/mooddisplay.scss"
// ─── CONFIDENCE BAR ───────────────────────────────────────────────────────────
const ConfidenceBar = memo(({ label, value, isActive }) => {
  const roundedValue = Math.round(value * 100)

  return (
    <div 
      className={`mood-display__bar ${isActive ? "mood-display__bar--active" : ""}`}
      role="progressbar"
      aria-valuenow={roundedValue}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label={`${label} expression level`}
    >
      <span className="mood-display__bar-label">{label.toUpperCase()}</span>
      <div className="mood-display__bar-track">
        <div
          className="mood-display__bar-fill"
          style={{ width: `${roundedValue}%` }}
        />
      </div>
      <span className="mood-display__bar-value">
        {roundedValue}%
      </span>
    </div>
  )
})
ConfidenceBar.displayName = "ConfidenceBar"

// ─── MOOD DISPLAY ─────────────────────────────────────────────────────────────
const MoodDisplay = memo(({
  state,
  detectedMood,
  liveMood,
  liveExpressions,
  scanProgress,
  loadProgress,
  error,
}) => {

  const isLoading   = state === DETECTION_STATE.LOADING
  const isDetecting = state === DETECTION_STATE.DETECTING
  const isDone      = state === DETECTION_STATE.DONE
  const isIdle      = state === DETECTION_STATE.IDLE
  const isReady     = state === DETECTION_STATE.READY
  const hasError    = state === DETECTION_STATE.ERROR

  // Sorted expression bars for live view
  const sortedExpressions = useMemo(() => {
    if (!liveExpressions) return []
    return Object.entries(liveExpressions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)  // Show top 4 only
  }, [liveExpressions])

  // ── LOADING STATE ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div 
        className="mood-display mood-display--loading"
        role="progressbar"
        aria-valuenow={loadProgress}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="Loading AI Models"
      >
        <p className="mood-display__status">LOADING AI MODELS</p>
        <div className="mood-display__load-track">
          <div
            className="mood-display__load-fill"
            style={{ width: `${loadProgress}%` }}
          />
        </div>
        <p className="mood-display__load-percent">{loadProgress}%</p>
      </div>
    )
  }

  // ── ERROR STATE ──────────────────────────────────────────────────────────
  if (hasError) {
    return (
      <div className="mood-display mood-display--error" role="alert">
        <p className="mood-display__error-icon" aria-hidden="true">⚠️</p>
        <p className="mood-display__error-msg">{error}</p>
      </div>
    )
  }

  // ── IDLE / READY STATE ───────────────────────────────────────────────────
  if (isIdle || isReady) {
    return (
      <div className="mood-display mood-display--idle">
        <div className="mood-display__intro">
          <span className="mood-display__section-label">Ready</span>
          <p className="mood-display__hint">
            Click <strong>DETECT MY MOOD</strong> to start
          </p>
          <p className="mood-display__sub">
            Our AI scans your facial expressions in real time.
          </p>
        </div>

        <div className="mood-display__idle-steps">
          {[
            "Face a window or light source",
            "Keep your face centred in frame",
            "Hold a natural expression for 3s",
            "No photos saved — runs locally",
          ].map((tip, index) => (
            <div key={index} className="mood-display__idle-step">
              <span className="mood-display__idle-step-num">0{index + 1}</span>
              <span className="mood-display__idle-step-text">{tip}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── DETECTING STATE ──────────────────────────────────────────────────────
  if (isDetecting) {
    const isUncertain = !liveMood || liveMood.label === "uncertain"
    const displayLabel = isUncertain ? "READING..." : liveMood.label.toUpperCase()

    return (
      <div className="mood-display mood-display--detecting">

        {/* Current live mood */}
        <div className="mood-display__live" aria-live="polite">
          <p className="mood-display__live-label">WE THINK YOU'RE FEELING</p>
          <h2
            className="mood-display__live-mood"
            style={{ color: !isUncertain ? moodToColor[liveMood.label] : "inherit" }}
          >
            {displayLabel}
          </h2>
        </div>

        {/* Expression confidence bars */}
        {sortedExpressions.length > 0 && (
          <div className="mood-display__bars" aria-label="Live microexpression readings">
            {sortedExpressions.map(([label, value]) => (
              <ConfidenceBar
                key={label}
                label={label}
                value={value}
                isActive={liveMood?.label === label}
              />
            ))}
          </div>
        )}

        {/* Scan progress bar */}
        <div 
          className="mood-display__scan-progress"
          role="progressbar"
          aria-valuenow={Math.round(scanProgress * 100)}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Scanning process time elapsed"
        >
          <div
            className="mood-display__scan-fill"
            style={{ width: `${scanProgress * 100}%` }}
          />
        </div>
        <p className="mood-display__scan-label">
          {Math.round(scanProgress * 3)}s / 3s
        </p>

      </div>
    )
  }

  // ── DONE STATE ───────────────────────────────────────────────────────────
  if (isDone && detectedMood) {
    return (
      <div className="mood-display mood-display--done" role="status">

        {/* Big mood result */}
        <div className="mood-display__result">
          <span 
            className="mood-display__result-emoji" 
            role="img" 
            aria-label={`${detectedMood.label} emoji`}
          >
            {moodToEmoji[detectedMood.label] || "😐"}
          </span>
          <h2
            className="mood-display__result-mood"
            style={{ color: moodToColor[detectedMood.label] }}
          >
            {detectedMood.label.toUpperCase()}
          </h2>
          <p className="mood-display__result-confidence">
            {Math.round(detectedMood.confidence * 100)}% confident
          </p>
        </div>

        {/* Readings info */}
        <p className="mood-display__readings">
          Based on {detectedMood.readings} readings
        </p>

      </div>
    )
  }

  return null
})

MoodDisplay.displayName = "MoodDisplay"
export default MoodDisplay