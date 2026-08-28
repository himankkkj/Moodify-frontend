import { memo, useCallback } from "react"
import { DETECTION_STATE } from "../hooks/useMoodDetection"
import Dither from "./Dither"
import "../styles/webcamfeed.scss"

const DITHER_WAVE_COLOR = [0.5, 0.02, 0.08]

const ScanLine = memo(() => (
  <div className="webcam__scanline" aria-hidden="true" />
))
ScanLine.displayName = "ScanLine"

const CornerBrackets = memo(() => (
  <div className="webcam__brackets" aria-hidden="true">
    <span className="webcam__bracket webcam__bracket--tl" />
    <span className="webcam__bracket webcam__bracket--tr" />
    <span className="webcam__bracket webcam__bracket--bl" />
    <span className="webcam__bracket webcam__bracket--br" />
  </div>
))
CornerBrackets.displayName = "CornerBrackets"

const WebcamFeed = memo(({ videoRef, state, scanProgress, liveMood }) => {
  const isDetecting = state === DETECTION_STATE.DETECTING
  const isDone = state === DETECTION_STATE.DONE
  const isIdle =
    state === DETECTION_STATE.IDLE ||
    state === DETECTION_STATE.READY ||
    state === DETECTION_STATE.LOADING

  // Dither background is active on IDLE and DONE states
  const showDither = isIdle || isDone

  const handleMouseEnter = useCallback(() => {
    window.dispatchEvent(new CustomEvent("moodify:cursor-hide"))
  }, [])

  const handleMouseLeave = useCallback(() => {
    window.dispatchEvent(new CustomEvent("moodify:cursor-show"))
  }, [])

  return (
    <div
      className={`webcam ${isDetecting ? "webcam--active" : ""} ${isDone ? "webcam--done" : ""} ${isIdle ? "webcam--idle" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="webcam__video"
        autoPlay
        muted
        playsInline
        aria-label="Webcam feed for mood detection"
        style={{
          opacity: isDetecting ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      />

      {/* ── DITHER BACKGROUND ─────────────────────────────────────────── */}
      <div
        className="webcam__dither-bg"
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          width: "100%",
          height: "100%",
          opacity: showDither ? 1 : 0,
          pointerEvents: showDither ? "auto" : "none",
          transition: "opacity 0.35s ease",
        }}
      >
        <Dither
          waveColor={DITHER_WAVE_COLOR}
          waveSpeed={0.1}
          waveFrequency={0}
          waveAmplitude={1}
          colorNum={4}
          pixelSize={isDone ? 3 : 2}
          enableMouseInteraction={showDither}
          mouseRadius={0.3}
          disableAnimation={!showDither} // Pauses WebGL render loop when hidden
        />
      </div>

      {/* ── IDLE UI ─────────────────────────────────────────────────── */}
      {isIdle && (
        <div className="webcam__placeholder">
          <div className="webcam__placeholder-content">
            <div className="webcam__placeholder-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <p>READY TO SCAN</p>
          </div>
        </div>
      )}

      {/* ── DETECTING UI ────────────────────────────────────────────── */}
      {isDetecting && (
        <>
          <ScanLine />
          <CornerBrackets />

          {liveMood && liveMood.label !== "uncertain" && (
            <div className="webcam__live-mood">
              <span className="webcam__live-label">
                {liveMood.label.toUpperCase()}
              </span>
              <span className="webcam__live-confidence">
                {Math.round(liveMood.confidence * 100)}%
              </span>
            </div>
          )}

          <div className="webcam__progress">
            <div
              className="webcam__progress-fill"
              style={{ width: `${scanProgress * 100}%` }}
            />
          </div>

          <div className="webcam__scanning-label">SCANNING...</div>
        </>
      )}

      {/* ── DONE UI ─────────────────────────────────────────────────── */}
      {isDone && (
        <div
          className="webcam__done-overlay"
          role="status"
          aria-label="Scan complete"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            className="webcam__done-icon"
            aria-hidden="true"
            style={{
              fontSize: "3.5rem",
              color: "var(--color-accent)",
              fontWeight: 900,
            }}
          >
            ✓
          </div>
        </div>
      )}
    </div>
  )
})

WebcamFeed.displayName = "WebcamFeed"
export default WebcamFeed