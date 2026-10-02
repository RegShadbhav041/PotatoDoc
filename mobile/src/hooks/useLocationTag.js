// Field-location tagging — powers the Location tab and stamps every saved
// diagnosis with WHERE it was taken (see DiagnoseScreen.handleSave).
//
// Two ways to tag, both optional:
//   1. GPS (auto): foreground coordinates captured on save, while granted.
//   2. Label: a field/village name typed once — works with no permission.
// State persists in AsyncStorage (same pattern as theme / language), so the
// toggle and label survive restarts. Everything degrades gracefully: no
// permission -> label-only tag; GPS failure -> last known fix or label.
import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

const STORAGE_KEY = "potatoDocLocationTag";
const GPS_TIMEOUT_MS = 8000;

const EMPTY = { enabled: false, label: "", coords: null, updatedAt: null };

function round(n, dp) {
  if (typeof n !== "number" || !isFinite(n)) return null;
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

export function useLocationTag() {
  const [tag, setTag] = useState(EMPTY);
  // unknown | granted | denied — probed on mount so the screen renders truth.
  const [permission, setPermission] = useState("unknown");
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);
  const tagRef = useRef(tag);
  tagRef.current = tag;
  const permRef = useRef(permission);
  permRef.current = permission;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const persist = useCallback(async (next) => {
    tagRef.current = next; // async readers (captureTag) must not wait a render
    if (mounted.current) setTag(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn("location tag save failed", e?.message);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            const next = { ...EMPTY, ...parsed };
            if (mounted.current) setTag(next);
            // A toggle that lost its permission must not silently stay on.
            if (next.enabled) {
              const cur = await Location.getForegroundPermissionsAsync();
              if (cur.status !== "granted") {
                persist({ ...next, enabled: false });
              }
            }
          }
        }
      } catch (e) {
        console.warn("location tag load failed", e?.message);
      }
      try {
        const cur = await Location.getForegroundPermissionsAsync();
        if (mounted.current) {
          setPermission(cur.status === "granted" ? "granted" : "denied");
        }
      } catch (e) {
        console.warn("location permission probe failed", e?.message);
      }
    })();
  }, [persist]);

  /** Ask for foreground permission -> true when granted. */
  const requestPermission = useCallback(async () => {
    try {
      const res = await Location.requestForegroundPermissionsAsync();
      const granted = res.status === "granted";
      permRef.current = granted ? "granted" : "denied"; // sync truth for refresh()
      if (mounted.current) setPermission(permRef.current);
      return granted;
    } catch (e) {
      console.warn("location permission request failed", e?.message);
      permRef.current = "denied";
      if (mounted.current) setPermission("denied");
      return false;
    }
  }, []);

  /** Capture a fresh GPS fix (requests permission if needed). -> coords | null */
  const refresh = useCallback(async () => {
    let granted = permRef.current === "granted";
    if (!granted) granted = await requestPermission();
    if (!granted) return null;
    setBusy(true);
    try {
      const pos = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("GPS timeout")), GPS_TIMEOUT_MS)
        ),
      ]);
      const coords = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy ?? null,
      };
      await persist({ ...tagRef.current, enabled: true, coords, updatedAt: new Date().toISOString() });
      return coords;
    } catch (e) {
      console.warn("location refresh failed", e?.message);
      return tagRef.current.coords; // fall back to the last known fix
    } finally {
      if (mounted.current) setBusy(false);
    }
  }, [persist, requestPermission]);

  /** Toggle auto-tagging; turning it on requires (and requests) permission. */
  const setEnabled = useCallback(
    async (value) => {
      if (value) {
        const granted = await refresh();
        if (!granted && permRef.current !== "granted") {
          // Permission refused — stay off so scans are never silently untagged.
          await persist({ ...tagRef.current, enabled: false });
          return false;
        }
        return true;
      }
      await persist({ ...tagRef.current, enabled: false });
      return false;
    },
    [persist, refresh]
  );

  const setLabel = useCallback(
    (text) => persist({ ...tagRef.current, label: (text || "").slice(0, 80) }),
    [persist]
  );

  /**
   * The tag to store on a saved diagnosis (DiagnoseScreen.handleSave).
   * Refreshes the fix first while auto-tagging is on; returns null when the
   * farmer turned everything off, so no `location` key is written at all.
   */
  const captureTag = useCallback(async () => {
    const current = tagRef.current;
    if (current.enabled && permRef.current === "granted") {
      await refresh();
    }
    const t = tagRef.current;
    const hasCoords = !!t.coords;
    if (!hasCoords && !(t.label || "").trim()) return null;
    return {
      lat: t.coords ? round(t.coords.latitude, 6) : null,
      lon: t.coords ? round(t.coords.longitude, 6) : null,
      accuracy: t.coords && t.coords.accuracy != null ? Math.round(t.coords.accuracy) : null,
      label: (t.label || "").trim(),
      at: new Date().toISOString(),
    };
  }, [refresh]);

  return {
    enabled: tag.enabled,
    label: tag.label,
    coords: tag.coords,
    updatedAt: tag.updatedAt,
    permission,
    busy,
    requestPermission,
    refresh,
    setEnabled,
    setLabel,
    captureTag,
  };
}
