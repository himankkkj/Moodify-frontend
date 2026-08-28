import { useCallback, useEffect, useRef, useState } from "react"
import {
  initGestureRecognizer,
  recognizeFrame,
  createGestureSmoother,
  GESTURE_LABELS,
} from "../services/gesture.service"
import { usePlayerApi, usePlayerVolume } from "../../player/context/player.context"

const TARGET_FPS = 15 // 15 recognitions/sec is plenty
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS
const DISCRETE_COOLDOWN_MS = 1500 // Discrete actions (play/pause, next, prev)
const VOLUME_TICK_MS = 250        // Continuous volume adjustment tick
const VOLUME_STEP = 0.05

export const useGesture = () => {
  const [isReady, setIsReady] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [detectedGesture, setDetectedGesture] = useState(null)
  const [lastAction, setLastAction] = useState(null)

  const videoRef = useRef(null)
  const recognizerRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const activeRef = useRef(false)
  const timeoutRef = useRef(null)

  const smootherRef = useRef(createGestureSmoother())
  const lastFrameTimeRef = useRef(0)
  const lastActionRef = useRef({ action: null, ts: 0 })
  const lastVolumeTickRef = useRef(0)

  const { volume } = usePlayerVolume()
  const volumeRef = useRef(volume)
  volumeRef.current = volume

  const { togglePlay, nextSong, prevSong, setVolume } = usePlayerApi()

  // ── Fire discrete action ──────────────────────────────────────────────────
  const fireAction = useCallback((action, gestureInfo) => {
    setDetectedGesture(gestureInfo)
    setLastAction({ action, ...gestureInfo, firedAt: Date.now() })

    switch (action) {
      case "next":       nextSong();   break
      case "prev":       prevSong();   break
      case "togglePlay": togglePlay(); break
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(() => {
      setDetectedGesture(null)
      setLastAction(null)
    }, 1500)
  }, [nextSong, prevSong, togglePlay])

  // ── Detection loop (15 FPS max + smoother + discrete/continuous logic) ───
  const detect = useCallback((now) => {
    if (!activeRef.current) return

    rafRef.current = requestAnimationFrame(detect)

    // Throttle to 15 FPS
    if (now - lastFrameTimeRef.current < FRAME_INTERVAL_MS) return
    lastFrameTimeRef.current = now

    const video = videoRef.current
    const recognizer = recognizerRef.current
    if (!video || !recognizer) return

    const result = recognizeFrame(recognizer, video, performance.now())
    const gestureName = result?.gestureName || null

    smootherRef.current.push(gestureName)
    const stable = smootherRef.current.getStableGesture()
    if (!stable) return

    const action = result?.action
    if (!action) return

    // ── Continuous Volume Handling ──────────────────────────────────────────
    if (action === "volumeUp" || action === "volumeDown") {
      if (now - lastVolumeTickRef.current < VOLUME_TICK_MS) return
      lastVolumeTickRef.current = now

      const currentVol = volumeRef.current || 0
      const nextVol = action === "volumeUp"
        ? Math.min(1, currentVol + VOLUME_STEP)
        : Math.max(0, currentVol - VOLUME_STEP)

      setVolume(Math.round(nextVol * 100) / 100)

      const gestureInfo = GESTURE_LABELS[action]
      setDetectedGesture(gestureInfo)
      setLastAction({ action, ...gestureInfo, firedAt: Date.now() })

      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        setDetectedGesture(null)
        setLastAction(null)
      }, 1500)
      return
    }

    // ── Discrete Action Handling ────────────────────────────────────────────
    const last = lastActionRef.current
    if (last.action === action && now - last.ts < DISCRETE_COOLDOWN_MS) return

    lastActionRef.current = { action, ts: now }
    smootherRef.current.reset() // Clear history so next gesture starts fresh
    fireAction(action, GESTURE_LABELS[action])
  }, [fireAction, setVolume])

  // ── Start camera + detection ──────────────────────────────────────────────
  const start = useCallback(async () => {
    if (activeRef.current) return

    setIsLoading(true)
    setError(null)
    smootherRef.current.reset()

    try {
      if (!recognizerRef.current) {
        console.log('[gesture] init start')
        recognizerRef.current = await initGestureRecognizer()
        console.log('[gesture] init done')
      }
      setIsReady(true)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        try {
          await videoRef.current.play()
        } catch {
          await new Promise((r) => setTimeout(r, 100))
          await videoRef.current.play()
        }
      }

      activeRef.current = true
      setIsActive(true)
      setIsLoading(false)

      rafRef.current = requestAnimationFrame(detect)
    } catch (err) {
      console.error("[gesture] Start failed:", err)
      activeRef.current = false
      setIsActive(false)
      setIsLoading(false)
      setError(
        err.name === "NotAllowedError"
          ? "Camera permission denied"
          : err.message || "Failed to start gesture detection"
      )
    }
  }, [detect])

  // ── Stop camera + detection ───────────────────────────────────────────────
  const stop = useCallback(() => {
    activeRef.current = false
    setIsActive(false)
    setDetectedGesture(null)

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    smootherRef.current.reset()
  }, [])

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => { stop() }
  }, [stop])

  return {
    videoRef,
    isReady,
    isActive,
    isLoading,
    error,
    detectedGesture,
    lastAction,
    start,
    stop,
  }
}