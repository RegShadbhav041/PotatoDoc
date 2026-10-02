// Location Suitability state machine — powers the Location tab.
//
//   idle (no cache) ── analyze() ──► loading ──► ready
//   ready (cache)    on mount: stale=true, renders "Analyzed X ago"
//   error: message + Retry, previous data kept (stale banner)
//
// GPS + GET + AsyncStorage follow useLocationTag / useNotices patterns.
// Backend contract (backend-standalone/location.py):
//   GET /location/analyze?lat=&lon= -> full analysis payload
//   400 Invalid coordinates · 502 Location service unavailable ·
//   504 Location service timeout (plain-string detail, shown via t()).
import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import axios from "axios";
import { API_BASE } from "./useApi";

const STORAGE_KEY = "potatoDocLocationAnalysis";
const GPS_TIMEOUT_MS = 8000;
const ANALYZE_TIMEOUT_MS = 20000;

function errorMessage(e) {
  if (!e?.response) return "Can't reach the server. Check your connection.";
  const detail = e.response.data?.detail;
  if (typeof detail === "string" && detail) return detail;
  return "Something went wrong. Please try again.";
}

export function useLocationAnalysis() {
  const [status, setStatus] = useState("idle");
  const [data, setData] = useState(null);
  const [analyzedAt, setAnalyzedAt] = useState(null);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Re-show the last analysis (offline-friendly) before any GPS work.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed && parsed.data && mounted.current) {
          setData(parsed.data);
          setAnalyzedAt(parsed.analyzedAt || null);
          setStale(true);
          setStatus("ready");
        }
      } catch (e) {
        console.warn("location analysis load failed", e?.message);
      }
    })();
  }, []);

  const analyze = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      let perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        perm = await Location.requestForegroundPermissionsAsync();
      }
      if (perm.status !== "granted") {
        throw new Error("Location permission is needed to analyze your area.");
      }
      const pos = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Couldn't get a GPS fix. Try again outside.")),
            GPS_TIMEOUT_MS
          )
        ),
      ]);
      const res = await axios.get(`${API_BASE}/location/analyze`, {
        params: { lat: pos.coords.latitude, lon: pos.coords.longitude },
        timeout: ANALYZE_TIMEOUT_MS,
      });
      const analyzedAt = new Date().toISOString();
      if (!mounted.current) return;
      setData(res.data);
      setAnalyzedAt(analyzedAt);
      setStale(false);
      setStatus("ready");
      setError(null);
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ data: res.data, analyzedAt })
        );
      } catch (e) {
        console.warn("location analysis save failed", e?.message);
      }
    } catch (e) {
      if (!mounted.current) return;
      setError(axios.isAxiosError(e) ? errorMessage(e) : (e?.message || errorMessage(e)));
      setStatus("error");
    }
  }, []);

  return { status, data, analyzedAt, stale, error, analyze };
}
