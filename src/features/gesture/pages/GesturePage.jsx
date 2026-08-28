import { useGesture } from "../hooks/useGesture"
import GestureLayout from "../components/GestureLayout"

// GesturePage is deliberately thin — gesture detection lives in useGesture,
// music queue logic lives in useGestureQueue (inside GestureLayout),
// so this page component has zero state of its own.

const GesturePage = () => {
  const {
    videoRef,
    isReady,
    isActive,
    isLoading,
    error,
    detectedGesture,
    lastAction,
    start,
    stop,
  } = useGesture()

  return (
    <GestureLayout
      videoRef={videoRef}
      isReady={isReady}
      isActive={isActive}
      isLoading={isLoading}
      error={error}
      detectedGesture={detectedGesture}
      lastAction={lastAction}
      onStart={start}
      onStop={stop}
    />
  )
}

export default GesturePage