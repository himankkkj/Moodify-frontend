import * as faceapi from "@vladmandic/face-api";
// Keep the model path in one place so it is easy to update later.
const MODEL_URL = "/models";

//state variables to track model loading and detection status
let modelsLoaded = false;
let isDetecting = false;

// device detection logic
const isClient = typeof window !== "undefined";
const isMobile = isClient
  ? /Mobi|Android|iPad|iPhone/i.test(navigator.userAgent) ||
    window.innerWidth < 768 ||
    ("ontouchstart" in window && navigator.maxTouchPoints > 1)
  : false;

//detector options based on device type
const detectorOptions = isMobile
  ? new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 })
  : new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });

// gpu warmup function to prevent lag spike on first detection
/**
 * Warm up the WebGL shaders on a tiny offscreen canvas.
 * This prevents the 1-2 second "lag spike" on the first real detection.
 */
const warmupModel = async () => {
  if (typeof document === "undefined") return;
  try {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 1;
    tempCanvas.height = 1;

    // Execute a fast dummy detection to compile shaders
    await faceapi
      .detectSingleFace(tempCanvas, detectorOptions)
      .withFaceLandmarks()
      .withFaceExpressions();
  } catch (e) {
    // Warmup failed or was skipped; fail silently so it doesn't break startup
    console.warn("⚠️ face-api warmup skipped:", e);
  }
};

const yieldToMain = () =>
  new Promise((resolve) => {
    if (typeof requestAnimationFrame !== "undefined") {
      requestAnimationFrame(() => setTimeout(resolve, 0));
    } else {
      setTimeout(resolve, 0);
    }
  });

export const loadModels = async (
  modelUrl = MODEL_URL,
  onProgress,
  retries = 2,
) => {
  if (modelsLoaded) {
    onProgress?.({ loaded: 3, total: 3, percent: 100, currentModel: null });
    return;
  }

  if (isClient && faceapi.tf?.env) {
    faceapi.tf.env().set("DEBUG", false);
  }

  const models = isMobile
    ? ["tinyFaceDetector", "faceLandmark68Net", "faceExpressionNet"]
    : ["ssdMobilenetv1", "faceLandmark68Net", "faceExpressionNet"];

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      // Sequential — NOT Promise.all — so UI can update between models
      for (let i = 0; i < models.length; i++) {
        const model = models[i];

        onProgress?.({
          loaded: i,
          total: models.length,
          percent: Math.round((i / models.length) * 100),
          currentModel: model,
        });
        await yieldToMain(); // paint starting model i

        await faceapi.nets[model].loadFromUri(modelUrl);

        onProgress?.({
          loaded: i + 1,
          total: models.length,
          percent: Math.round(((i + 1) / models.length) * 100),
          currentModel: model,
        });
        await yieldToMain(); // paint after each model
      }

      modelsLoaded = true;
      console.log("✅ face-api models loaded");
      return;
    } catch (error) {
      console.warn(`⚠️ Load attempt ${attempt} failed`, error);
      if (attempt > retries) {
        modelsLoaded = false;
        throw error;
      }
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
};

export const warmupModels = async () => {
  if (!modelsLoaded) return;
  await yieldToMain();
  await warmupModel();
};

// detect mood from a video element using face-api
export const detectMood = async (videoElement) => {
  if (!modelsLoaded)
    throw new Error("Models not loaded yet. Call loadModels() first.");
  if (!videoElement) throw new Error("No video element provided");

  if (
    videoElement.readyState < 2 ||
    videoElement.paused ||
    videoElement.ended
  ) {
    return null;
  }

  if (isDetecting) return null;

  isDetecting = true;

  try {
    const result = await faceapi
      .detectSingleFace(videoElement, detectorOptions)
      .withFaceLandmarks()
      .withFaceExpressions();

    if (!result) return null;

    // Deep copy to raw objects instantly prevents TF.js memory leak crashes
    return {
      happy: result.expressions.happy,
      sad: result.expressions.sad,
      neutral: result.expressions.neutral,
      surprised: result.expressions.surprised,
      angry: result.expressions.angry,
      fearful: result.expressions.fearful,
      disgusted: result.expressions.disgusted,
    };
  } catch (error) {
    console.error("❌ Detection error:", error);
    return null;
  } finally {
    isDetecting = false;
  }
};

// get the dominant mood from expressions with a minimum confidence threshold
export const getMood = (expressions, minConfidence = 0.3) => {
  if (!expressions) return null;

  const scores = {
    happy: expressions.happy * 1.1,
    sad:
      expressions.sad * 1.7 +
      expressions.fearful * 0.4 +
      expressions.disgusted * 0.2,
    angry: expressions.angry * 1.5 + expressions.disgusted * 0.5,
    neutral: expressions.neutral * 0.6,
    surprised: expressions.surprised * 1.2,
  };

  const [label, confidence] = Object.entries(scores).sort(
    (a, b) => b[1] - a[1],
  )[0];

  const normalizedConfidence = Math.min(confidence, 1.0);

  if (normalizedConfidence < minConfidence) {
    return {
      label: "uncertain",
      confidence: normalizedConfidence,
      all: scores,
    };
  }

  return { label, confidence: normalizedConfidence, all: scores };
};

// collect stable mood readings over a specified duration and interval, then return the dominant mood
export const collectStableMood = (
  videoElement,
  onUpdate,
  onComplete,
  durationMs = 3000,
  intervalMs = 150,
) => {
  const readings = [];
  const startTime = Date.now();
  let timerId = null;
  let isCancelled = false;

  const processFinish = () => {
    if (isCancelled) return;

    if (readings.length === 0) {
      onComplete?.({ label: "neutral", confidence: 0, readings: 0 });
      return;
    }

    const moodScores = readings.reduce((acc, r) => {
      acc[r.label] = (acc[r.label] || 0) + r.confidence;
      return acc;
    }, {});

    const dominantMood = Object.entries(moodScores).sort(
      (a, b) => b[1] - a[1],
    )[0][0];

    const dominantReadings = readings.filter((r) => r.label === dominantMood);
    const avgConfidence =
      dominantReadings.reduce((sum, r) => sum + r.confidence, 0) /
      dominantReadings.length;

    onComplete?.({
      label: dominantMood,
      confidence: avgConfidence,
      readings: readings.length,
    });
  };

  const tick = async () => {
    if (isCancelled) return;

    if (Date.now() - startTime >= durationMs) {
      processFinish();
      return;
    }

    const expressions = await detectMood(videoElement);

    if (expressions && !isCancelled) {
      const mood = getMood(expressions);

      if (mood && mood.label !== "uncertain") {
        readings.push(mood);

        onUpdate?.({
          currentMood: mood,
          progress: Math.min((Date.now() - startTime) / durationMs, 1),
          allExpressions: expressions,
        });
      }
    }

    if (!isCancelled) {
      timerId = setTimeout(tick, intervalMs);
    }
  };

  timerId = setTimeout(tick, 0);

  return () => {
    isCancelled = true;
    if (timerId) clearTimeout(timerId);
  };
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
export const isModelsLoaded = () => modelsLoaded;

export const moodToTag = {
  happy: "happy",
  sad: "sad",
  angry: "angry",
  neutral: "chill",
  surprised: "energetic",
  uncertain: "chill",
};

export const moodToColor = {
  happy:     "#E8870A", // ← richer amber instead of bright yellow
  sad:       "#4A90D9",
  angry:     "#C8102E",
  neutral:   "#0A0A0A", // ← just use black, grey is unreadable
  surprised: "#9B59B6",
  fearful:   "#27AE60",
  disgusted: "#8B4513",
  uncertain: "#0A0A0A",
};

export const moodToEmoji = {
  happy: "😊",
  sad: "😢",
  angry:  "😠",
  neutral: "😐",
  surprised: "😮",
  uncertain: "🤔",
};
