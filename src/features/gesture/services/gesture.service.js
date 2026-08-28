import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision"

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task"
const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"

// ─── Gesture → Action mapping ────────────────────────────────────────────────
export const GESTURE_ACTION_MAP = {
  Open_Palm:   'togglePlay',
  Closed_Fist: 'next',
  Victory:     'prev',
  Pointing_Up: 'volumeUp',   // continuous
  Thumb_Down:  'volumeDown', // continuous, strict
  Thumb_Up:    null,
  ILoveYou:    null,
  None:        null,
}

export const GESTURE_LABELS = {
  togglePlay: { emoji: '✋', label: 'PLAY / PAUSE' },
  next:       { emoji: '✊', label: 'NEXT SONG' },
  prev:       { emoji: '✌️', label: 'PREVIOUS SONG' },
  volumeUp:   { emoji: '👆', label: 'VOLUME UP' },
  volumeDown: { emoji: '👎', label: 'VOLUME DOWN' },
}

// ─── Per-gesture confidence thresholds ──────────────────────────────────────
const CONFIDENCE_THRESHOLDS = {
  Open_Palm:   0.75,
  Closed_Fist: 0.75,
  Victory:     0.80,
  Pointing_Up: 0.80,
  Thumb_Down:  0.85,
}

// ─── Smoothing config ───────────────────────────────────────────────────────
const REQUIRED_CONSECUTIVE_FRAMES = 4   // Must see same gesture N times in a row
const HISTORY_SIZE = 6                   // Rolling window for smoothing

// ─── Singleton state ────────────────────────────────────────────────────────
let recognizerInstance = null
let initPromise = null

// ─── Model initialization (20s timeout + GPU/CPU race) ──────────────────────
export const initGestureRecognizer = () => {
  if (recognizerInstance) return Promise.resolve(recognizerInstance)
  if (initPromise) return initPromise

  initPromise = (async () => {
    const timeout = new Promise((_, rej) =>
      setTimeout(() => rej(new Error('Model load timeout (20s)')), 20000)
    )
    const load = (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_URL)
      try {
        const instance = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.7,
          minHandPresenceConfidence: 0.7,
          minTrackingConfidence: 0.6,
        })
        console.log("[gesture] GPU delegate ready")
        return instance
      } catch (gpuErr) {
        console.warn("[gesture] GPU failed, falling back to CPU:", gpuErr.message)
        const instance = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.7,
          minHandPresenceConfidence: 0.7,
          minTrackingConfidence: 0.6,
        })
        console.log("[gesture] CPU delegate ready")
        return instance
      }
    })()

    recognizerInstance = await Promise.race([load, timeout])
    return recognizerInstance
  })().catch((e) => {
    initPromise = null // allow retry
    throw e
  })

  return initPromise
}

// ─── Smoother: keeps rolling window per session ─────────────────────────────
export const createGestureSmoother = () => {
  const history = []

  const push = (gesture) => {
    history.push(gesture)
    if (history.length > HISTORY_SIZE) history.shift()
  }

  const getStableGesture = () => {
    if (history.length < REQUIRED_CONSECUTIVE_FRAMES) return null

    const recent = history.slice(-REQUIRED_CONSECUTIVE_FRAMES)
    const first = recent[0]
    if (!first) return null

    for (const g of recent) {
      if (!g || g !== first) return null
    }
    return first
  }

  const reset = () => { history.length = 0 }

  return { push, getStableGesture, reset }
}

// ─── Raw frame recognition ──────────────────────────────────────────────────
export const recognizeFrame = (recognizer, videoElement, timestampMs) => {
  if (!recognizer || !videoElement) return null
  if (videoElement.readyState < 2) return null   // HAVE_CURRENT_DATA
  if (videoElement.videoWidth === 0) return null

  try {
    const result = recognizer.recognizeForVideo(videoElement, timestampMs)
    const gesture = result?.gestures?.[0]?.[0]

    if (!gesture) return null
    if (gesture.categoryName === "None") return null

    const threshold = CONFIDENCE_THRESHOLDS[gesture.categoryName]
    if (!threshold || gesture.score < threshold) return null

    const action = GESTURE_ACTION_MAP[gesture.categoryName]
    if (!action) return null

    return {
      gestureName: gesture.categoryName,
      action,
      score: gesture.score,
    }
  } catch (err) {
    console.warn("[gesture] recognizeForVideo error:", err)
    return null
  }
}

// ─── Destroy on unmount ─────────────────────────────────────────────────────
export const destroyGestureRecognizer = () => {
  if (recognizerInstance) {
    try { recognizerInstance.close() } catch { /* ignore */ }
    recognizerInstance = null
    initPromise = null
  }
}