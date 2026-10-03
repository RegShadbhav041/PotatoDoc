// Local-first sync: the device is the source of truth for writes, the server
// copy is unioned in at sign-in and pushed back up afterwards.
import { useCallback, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE, apiDelete, apiGet, apiPut, uploadAuthed } from "./useApi";
import {
  mergeHistory,
  historyEquals,
  stripLocalKeys,
  MAX_HISTORY_ITEMS,
} from "./historyMerge";

const PUSH_DEBOUNCE_MS = 1500;

export function useHistorySync({
  token,
  history,
  replaceHistory,
  storageBlocked,
  onUnauthorized,
}) {
  const historyRef = useRef(history);
  historyRef.current = history;
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const blockedRef = useRef(storageBlocked);
  blockedRef.current = storageBlocked;
  const onUnauthorizedRef = useRef(onUnauthorized);
  onUnauthorizedRef.current = onUnauthorized;

  const timerRef = useRef(null);
  const inFlightRef = useRef(false);
  const mergedTokenRef = useRef(null);

  const push = useCallback(async (items) => {
    const current = tokenRef.current;
    if (!current || inFlightRef.current) return false;
    if (!Array.isArray(items) || items.length === 0) return false;
    inFlightRef.current = true;
    try {
      await apiPut(
        "/history",
        { items: items.slice(0, MAX_HISTORY_ITEMS).map(stripLocalKeys) },
        { headers: { Authorization: `Bearer ${current}` }, timeout: 20000 }
      );
      return true;
    } catch (e) {
      // Stale session: re-lock the history tab, keep every local row.
      if (e?.response?.status === 401) {
        onUnauthorizedRef.current?.();
        return false;
      }
      // Local-first: a failed push never rolls back or blocks the local write.
      console.warn("history push failed", e?.message);
      return false;
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  /**
   * Upload the scan photo for every local entry the server copy lacks
   * (has_photo from GET /history is the source of truth — a failed upload
   * self-heals on the next sync instead of leaving the panel photo-less).
   * Runs right after a successful push, so the history row definitely exists.
   */
  const uploadMissingPhotos = useCallback(async (items) => {
    const current = tokenRef.current;
    if (!current || !Array.isArray(items) || items.length === 0) return;
    let serverPhotos;
    try {
      const res = await axios.get(`${API_BASE}/history`, {
        headers: { Authorization: `Bearer ${current}` },
        timeout: 20000,
      });
      serverPhotos = new Set(
        (Array.isArray(res.data?.items) ? res.data.items : [])
          .filter((i) => i && i.has_photo && i.id != null)
          .map((i) => String(i.id))
      );
    } catch (e) {
      return; // offline: next sync retries
    }
    for (const item of items) {
      if (!item?.imageUri || serverPhotos.has(String(item.id))) continue;
      try {
        await uploadAuthed(
          item.imageUri,
          `/history/${encodeURIComponent(item.id)}/photo`,
          current
        );
        serverPhotos.add(String(item.id));
      } catch (e) {
        if (e?.response?.status === 401) {
          onUnauthorizedRef.current?.();
          return;
        }
        console.warn("history photo upload failed", e?.message);
        break; // most likely offline — retry on the next sync
      }
    }
  }, []);

  // Debounced push whenever the local list changes while signed in.
  useEffect(() => {
    if (!token || storageBlocked) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const ok = await push(historyRef.current);
      if (ok) await uploadMissingPhotos(historyRef.current);
    }, PUSH_DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [history, token, storageBlocked, push, uploadMissingPhotos]);

  // Once per sign-in: union the server copy into the device list, persist, push.
  useEffect(() => {
    if (!token) {
      mergedTokenRef.current = null;
      return;
    }
    if (mergedTokenRef.current === token) return;
    mergedTokenRef.current = token;

    (async () => {
      try {
        const res = await apiGet("/history", {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 20000,
        });
        const server = Array.isArray(res.data?.items) ? res.data.items : [];
        const merged = mergeHistory(historyRef.current, server);
        if (!blockedRef.current && !historyEquals(historyRef.current, merged)) {
          replaceHistory(merged);
        }
        const ok = await push(merged);
        if (ok) await uploadMissingPhotos(merged);
      } catch (e) {
        if (e?.response?.status === 401) {
          onUnauthorizedRef.current?.();
          return;
        }
        // Offline at sign-in: keep the local list, retry on the next change.
        console.warn("history merge failed", e?.message);
      }
    })();
  }, [token, replaceHistory, push, uploadMissingPhotos]);
}

/** Explicit account wipe — the only path that deletes server rows. */
export async function deleteServerHistory(token) {
  if (!token) return;
  try {
    await apiDelete("/history", {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 20000,
    });
  } catch (e) {
    console.warn("history delete failed", e?.message);
  }
}
