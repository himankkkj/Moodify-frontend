import { memo } from 'react'
import { Loader2 } from 'lucide-react'

const GestureCamera = memo(({
  videoRef,
  isActive,
  isLoading,
  error,
  loadingMessage = 'Loading AI Model…',
}) => (
  <div
    className={
      'gesture-camera' +
      (isLoading ? ' gesture-camera--loading' : '')
    }
    aria-busy={isLoading}
  >
    {/* Camera feed */}
    <video
      ref={videoRef}
      className={
        'gesture-camera__video' +
        (isActive ? ' gesture-camera__video--active' : '')
      }
      playsInline
      muted
      autoPlay
      aria-label="Gesture control camera feed"
      style={{ display: isActive ? 'block' : 'none' }}
    />

    {/* Standby vinyl — shown when idle, not loading, no error */}
    {!isActive && !isLoading && !error && (
      <div className="gesture-camera__vinyl-wrap" aria-hidden="true">
        <div className="gesture-camera__vinyl">
          <span className="gesture-camera__note">♪</span>
        </div>
      </div>
    )}

    {/* ★ PRODUCTION LOADING OVERLAY ★ */}
    {isLoading && (
      <div
        className="gesture-camera__overlay gesture-camera__overlay--loading"
        role="status"
        aria-live="polite"
      >
        <div className="gesture-camera__scan-line" aria-hidden="true" />
        <Loader2
          className="gesture-camera__spinner-icon"
          size={32}
          strokeWidth={2}
        />
        <p className="gesture-camera__loading-title">{loadingMessage}</p>
        <span className="gesture-camera__loading-sub">
          Preparing hand tracking
        </span>
      </div>
    )}

    {/* Error overlay */}
    {error && !isActive && !isLoading && (
      <div
        className="gesture-camera__overlay gesture-camera__overlay--error"
        role="alert"
      >
        <p className="gesture-camera__error-msg">{error}</p>
      </div>
    )}
  </div>
))

GestureCamera.displayName = 'GestureCamera'
export default GestureCamera