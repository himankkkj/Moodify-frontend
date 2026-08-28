import { useState, useRef, useCallback, useEffect } from "react";
import {
  loadModels,
  detectMood,
  getMood,
  collectStableMood,
  isModelsLoaded,
  moodToTag,
  moodToColor,
  moodToEmoji,
} from "../services/faceapi.service";

// ─── DETECTION STATES ─────────────────────────────────────────────────────────
export const DETECTION_STATE = {
  IDLE:      "idle",
  LOADING:   "loading",
  READY:     "ready",
  DETECTING: "detecting",
  DONE:      "done",
  ERROR:     "error",
};

// ─── HOOK ─────────────────────────────────────────────────────────────────────
const useMoodDetection = () => {

  // ── STATE ──────────────────────────────────────────────────────────────────
  const [state,           setState]           = useState(DETECTION_STATE.IDLE);
  const [loadProgress,    setLoadProgress]    = useState(0);
  const [detectedMood,    setDetectedMood]    = useState(null);
  const [liveExpressions, setLiveExpressions] = useState(null);
  const [liveMood,        setLiveMood]        = useState(null);
  const [scanProgress,    setScanProgress]    = useState(0);
  const [error,           setError]           = useState(null);

  // ── REFS ───────────────────────────────────────────────────────────────────
  const videoRef   = useRef(null);
  const streamRef  = useRef(null);
  const cleanupRef = useRef(null);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // ── STOP WEBCAM ────────────────────────────────────────────────────────────
  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Stable ref for cleanup (avoids useEffect dep warning)
  const stopWebcamRef = useRef(stopWebcam);
  stopWebcamRef.current = stopWebcam;

  // ── CLEANUP ON UNMOUNT ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopWebcamRef.current();
      cleanupRef.current?.();
    };
  }, []);

  // ── LOAD MODELS ────────────────────────────────────────────────────────────
  const initModels = useCallback(async () => {
    if (isModelsLoaded()) {
      setLoadProgress(100);
      setState(DETECTION_STATE.READY);
      return;
    }

    setState(DETECTION_STATE.LOADING);
    setError(null);
    setLoadProgress(2); // immediate feedback

    try {
      await loadModels("/models", (progress) => {
        setLoadProgress((prev) => Math.max(prev, progress.percent || 0));
      });
      setLoadProgress(100);
      setState(DETECTION_STATE.READY);
    } catch (err) {
      setError("Failed to load AI models. Please refresh and try again.");
      setState(DETECTION_STATE.ERROR);
    }
  }, []);

  // ── START WEBCAM ───────────────────────────────────────────────────────────
  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width:      { ideal: 640 },
          height:     { ideal: 480 },
          facingMode: "user",
          frameRate:  { ideal: 30 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {
          // Retry once after short delay (iOS Safari autoplay quirk)
          await new Promise(r => setTimeout(r, 100));
          await videoRef.current.play();
        }
      }

      return true;
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setError("Camera access denied. Please allow camera access and try again.");
      } else if (err.name === "NotFoundError") {
        setError("No camera found. Please connect a camera and try again.");
      } else {
        setError("Failed to start camera. Please try again.");
      }
      setState(DETECTION_STATE.ERROR);
      return false;
    }
  }, []);

  // ── START DETECTION ────────────────────────────────────────────────────────
  const startDetection = useCallback(async () => {
    // ✅ Fix 1: prevent double-click / overlapping detections
    if (stateRef.current === DETECTION_STATE.DETECTING || stateRef.current === DETECTION_STATE.LOADING) {
      return;
    }

    setError(null);
    setDetectedMood(null);
    setLiveMood(null);
    setLiveExpressions(null);
    setScanProgress(0);

    // Load models if not loaded
    if (!isModelsLoaded()) {
      await initModels();
    }

    // ✅ Fix 2: bail out if models failed to load
    if (!isModelsLoaded()) {
      return;
    }

    // Start webcam
    const webcamStarted = await startWebcam();
    if (!webcamStarted) return;

    setState(DETECTION_STATE.DETECTING);

    // ✅ Fix 3: wait for real video data instead of arbitrary 500ms
    await new Promise((resolve) => {
      const video = videoRef.current;
      if (!video) return resolve();

      if (video.readyState >= 2) {
        resolve();
        return;
      }

      const onReady = () => {
        video.removeEventListener("loadeddata", onReady);
        resolve();
      };
      video.addEventListener("loadeddata", onReady);

      // Fallback in case event never fires
      setTimeout(() => {
        video.removeEventListener("loadeddata", onReady);
        resolve();
      }, 2000);
    });

    // Start 3-second mood collection
    let lastUiTime = 0;
    const cleanup = collectStableMood(
      videoRef.current,

      // onUpdate — live updates throttled to ~10fps (~100ms) to prevent React setState storms
      ({ currentMood, progress, allExpressions }) => {
        const now = performance.now();
        if (now - lastUiTime >= 100 || progress >= 1) {
          lastUiTime = now;
          setLiveMood(currentMood);
          setLiveExpressions(allExpressions);
          setScanProgress(progress);
        }
      },

      // onComplete — final result after 3 seconds
      (result) => {
        setDetectedMood({
          ...result,
          tag:   moodToTag[result.label]   || "chill",
          color: moodToColor[result.label] || "#6B7280",
          emoji: moodToEmoji[result.label] || "😐",
        });
        setScanProgress(1);
        setState(DETECTION_STATE.DONE);
        stopWebcam();
      }
    );

    cleanupRef.current = cleanup;
  }, [initModels, startWebcam, stopWebcam]);

  // ── RESET ──────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    stopWebcam();
    setDetectedMood(null);
    setLiveMood(null);
    setLiveExpressions(null);
    setScanProgress(0);
    setError(null);
    setState(DETECTION_STATE.READY);
  }, [stopWebcam]);

  // ── RETURN ─────────────────────────────────────────────────────────────────
  return {
    // state flags
    state,
    isLoading:   state === DETECTION_STATE.LOADING,
    isDetecting: state === DETECTION_STATE.DETECTING,
    isDone:      state === DETECTION_STATE.DONE,
    isReady:     state === DETECTION_STATE.READY,
    hasError:    state === DETECTION_STATE.ERROR,

    // data
    detectedMood,
    liveMood,
    liveExpressions,
    scanProgress,
    loadProgress,
    error,

    // refs
    videoRef,

    // actions
    initModels,
    startDetection,
    reset,
    stopWebcam,
  };
};

export default useMoodDetection;    