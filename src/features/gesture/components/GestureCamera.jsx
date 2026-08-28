import { memo } from 'react'

const GestureCamera = memo(({ videoRef, isActive, isLoading, error }) => (
  <div className="gesture-camera">
    <video
      ref={videoRef}
      className="gesture-camera__video"
      playsInline
      muted
      autoPlay
      aria-label="Gesture control camera feed"
      style={{ display: isActive ? 'block' : 'none' }}
    />

    {!isActive && !isLoading && !error && (
      <div className="gesture-camera__vinyl-wrap" aria-hidden="true">
        <div className="gesture-camera__vinyl">
          <span className="gesture-camera__note">♪</span>
        </div>
      </div>
    )}

    {isLoading && <div className="gesture-camera__msg">Starting…</div>}
    {error && !isActive && <div className="gesture-camera__msg">{error}</div>}
  </div>
))

GestureCamera.displayName = 'GestureCamera'
export default GestureCamera