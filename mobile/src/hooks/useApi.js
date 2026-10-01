// Backend API layer.
// - axios for GET /ping and GET /models
// - expo-file-system native File.upload(MULTIPART) for POST /predict and POST /gradcam
//   (deliberately bypasses React Native FormData/Blob which is unreliable for binaries).
//
// Backend contract (keep when retraining):
//   GET  /ping            -> text "Hello, I am alive"
//   GET  /models          -> { models:[id], modelNames:{id:label}, default?:id }
//   POST /predict?model_id=<id> multipart file -> success {class, confidence 0-1, probabilities, is_unknown:false, individual?}
//                                              or unknown {class:"Unknown", confidence, is_unknown:true, entropy, probabilities:{}, message}
//   POST /gradcam?model_id=<id> multipart file -> single {overlay|heatmap: base64-data-uri}
//                                              or ensemble {heatmaps:{id:{overlay}}}
//   Limits: JPEG/PNG/WebP, 10MB. 30s client timeout. 429 rate-limit possible.
//   Class strings must stay exactly: Early Blight | Late Blight | Healthy | Unknown
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import * as FileSystemLegacy from "expo-file-system/legacy";

export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:8000";

// Network-level failover: if the active base becomes unreachable (dropped adb
// reverse tunnel, changed host IP, ...), transparently rotate through the known
// alternatives and remember the one that works. 10.0.2.2 is the Android
// emulator's alias for the host loopback and needs NO adb reverse tunnel, so
// API calls survive adb-server/emulator restarts.
const API_CANDIDATES = [
  ...new Set([
    API_BASE,
    "http://10.0.2.2:8010",
    "http://192.168.18.3:8010",
    "http://127.0.0.1:8010",
  ]),
];
let activeBaseIdx = 0;

async function callWithFailover(fn) {
  let lastErr = null;
  for (let i = 0; i < API_CANDIDATES.length; i++) {
    const idx = (activeBaseIdx + i) % API_CANDIDATES.length;
    try {
      const result = await fn(API_CANDIDATES[idx]);
      activeBaseIdx = idx;
      return result;
    } catch (e) {
      if (e?.response) throw e; // server answered -> base is reachable, don't rotate
      lastErr = e;
    }
  }
  throw lastErr;
}

// Client fallback if GET /models is unreachable. Overwritten by server response.
export const MODEL_IDS = ["ensemble", "small_cnn", "mobilenetv2", "efficientnetb0"];
export const FALLBACK_MODELS = ["ensemble", "small_cnn", "mobilenetv2", "efficientnetb0"];
export const FALLBACK_MODEL_NAMES = {
  ensemble: "Ensemble (All Models)",
  small_cnn: "Small CNN (from scratch)",
  mobilenetv2: "MobileNetV2 (transfer)",
  efficientnetb0: "EfficientNet-B0 (transfer)",
  convnext_plantvillage: "EfficientNet-B0 (transfer)",
};
export const FALLBACK_DEFAULT_MODEL = "ensemble";

const PREDICT_TIMEOUT_MS = 30000;
const PING_TIMEOUT_MS = 15000;

function filenameOf(uri) {
  const parts = uri.split("/");
  const last = parts[parts.length - 1].split("?")[0] || "leaf.jpg";
  return last.includes(".") ? last : "leaf.jpg";
}

function mimeOf(filename) {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

/**
 * Native multipart upload. Tries expo-file-system v57 `File.upload` first,
 * falls back to legacy `FileSystem.uploadAsync` on older runtimes.
 */
export async function uploadNative(uri, endpoint, { model_id, timeoutMs = PREDICT_TIMEOUT_MS } = {}) {
  const filename = filenameOf(uri);
  const mimeType = mimeOf(filename);

  const doUpload = async (url) => {
    // New File API (expo-file-system ^57)
    if (FileSystem.File && FileSystem.UploadType) {
      const src = new FileSystem.File(uri);
      const res = await src.upload(url, {
        uploadType: FileSystem.UploadType.MULTIPART,
        fieldName: "file",
        mimeType,
        parameters: {},
      });
      try {
        return JSON.parse(res.body ?? "");
      } catch {
        return { raw: res.body, status: res.status };
      }
    }
    // Legacy fallback
    const res = await FileSystemLegacy.uploadAsync(url, uri, {
      httpMethod: "POST",
      uploadType: FileSystemLegacy.FileSystemUploadType.MULTIPART,
      fieldName: "file",
      mimeType,
    });
    try {
      return JSON.parse(res.body);
    } catch {
      return { raw: res.body, status: res.status };
    }
  };

  return await callWithFailover((base) => {
    const url = `${base}${endpoint}?model_id=${encodeURIComponent(model_id)}`;
    return Promise.race([
      doUpload(url),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out (30s). Check backend / network.")), timeoutMs)
      ),
    ]);
  });
}

/** Startup warmup: GET /ping up to 3x, then pre-load server with bundled icon.png probe. Non-fatal on fail. */
export function useWakeUp() {
  const [wakeStatus, setWakeStatus] = useState("idle"); // idle | Connecting... | Retrying... | Ready | error
  const [warmupProgress, setWarmupProgress] = useState(null); // {done, total} e.g. n/1

  const wakeUp = useCallback(async (modelId = FALLBACK_DEFAULT_MODEL) => {
    setWakeStatus("Connecting...");
    let alive = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await callWithFailover((base) => axios.get(`${base}/ping`, { timeout: PING_TIMEOUT_MS }));
        alive = true;
        break;
      } catch (e) {
        if (attempt < 3) {
          setWakeStatus("Retrying...");
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
    }
    if (!alive) {
      setWakeStatus("Backend unreachable — you can still pick an image.");
      return false;
    }
    // Pre-load server: parallel POST /predict with bundled assets/icon.png
    try {
      setWarmupProgress({ done: 0, total: 1 });
      const asset = Asset.fromModule(require("../../assets/icon.png"));
      await asset.downloadAsync();
      const probeUri = asset.localUri || asset.uri;
      setWakeStatus("Loading models...");
      await uploadNative(probeUri, "/predict", { model_id: modelId });
      setWarmupProgress({ done: 1, total: 1 });
      setWakeStatus("Ready");
    } catch (e) {
      console.warn("warmup probe failed (non-fatal)", e?.message);
      setWakeStatus("Ready");
    }
    return true;
  }, []);

  return { wakeStatus, warmupProgress, wakeUp };
}

/** Fetch available models. Falls back to convnext_plantvillage defaults when unreachable. */
export function useModels() {
  const [models, setModels] = useState(FALLBACK_MODELS);
  const [modelNames, setModelNames] = useState(FALLBACK_MODEL_NAMES);
  const [defaultModel, setDefaultModel] = useState(FALLBACK_DEFAULT_MODEL);
  const [loadingModels, setLoadingModels] = useState(true);

  const refresh = useCallback(async () => {
    setLoadingModels(true);
    // Retry: transient drops (e.g. adb reverse tunnel re-establishing) must not surface as
    // an immediate console warning — same 3-attempt pattern as useWakeUp.
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await callWithFailover((base) => axios.get(`${base}/models`, { timeout: PING_TIMEOUT_MS }));
        const data = res.data || {};
        if (Array.isArray(data.models) && data.models.length > 0) {
          setModels(data.models);
          setModelNames(data.modelNames || FALLBACK_MODEL_NAMES);
          setDefaultModel(data.default || data.models[0]);
        }
        break;
      } catch (e) {
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 800 * attempt));
        } else {
          console.warn("GET /models failed (all API endpoints unreachable), using fallback", e?.message);
        }
      }
    }
    setLoadingModels(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { models, modelNames, defaultModel, loadingModels, refresh };
}

/** Prediction hook: native upload to POST /predict. */
export function usePrediction() {
  const [processing, setProcessing] = useState(false);
  const [heatmapsLoading, setHeatmapsLoading] = useState(false);
  const [error, setError] = useState(null);

  const predict = useCallback(async (imageUri, modelId) => {
    setProcessing(true);
    setError(null);
    try {
      const data = await uploadNative(imageUri, "/predict", { model_id: modelId });
      return data;
    } catch (e) {
      const msg =
        e?.response?.status === 429
          ? "Rate limited (429). Please wait a moment and retry."
          : e?.message || "Prediction failed. Check backend connection.";
      setError(msg);
      throw new Error(msg);
    } finally {
      setProcessing(false);
    }
  }, []);

  return { processing, setProcessing, heatmapsLoading, setHeatmapsLoading, error, setError, predict };
}

/** Grad-CAM fetch: POST /gradcam native upload. Returns single or ensemble shape untouched. */
export async function fetchGradcam(imageUri, modelId) {
  return await uploadNative(imageUri, "/gradcam", { model_id: modelId });
}
