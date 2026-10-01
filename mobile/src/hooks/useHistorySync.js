// Local-first sync: the device is the source of truth for writes, the server
// copy is unioned in at sign-in and pushed back up afterwards.
import { useCallback, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE } from "./useApi";
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
    if (!current || inFlightRef.current) return;
    if (!Array.isArray(items) || items.length === 0) return;
    inFlightRef.current = true;
    try {
      await axios.put(
        `${API_BASE}/history`,
        { items: items.slice(0, MAX_HISTORY_ITEMS).map(stripLocalKeys) },
        { headers: { Authorization: `Bearer ${current}` }, timeout: 20000 }
      );
    } catch (e) {
      // Stale session: re-lock the history tab, keep every local row.
      if (e?.response?.status === 401) {
        onUnauthorizedRef.current?.();
        return;
      }
      // Local-first: a failed push never rolls back or blocks the local write.
      console.warn("history push failed", e?.message);
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  // Debounced push whenever the local list changes while signed in.
  useEffect(() => {
    if (!token || storageBlocked) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => push(historyRef.current), PUSH_DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [history, token, storageBlocked, push]);

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
        const res = await axios.get(`${API_BASE}/history`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 20000,
        });
        const server = Array.isArray(res.data?.items) ? res.data.items : [];
        const merged = mergeHistory(historyRef.current, server);
        if (!blockedRef.current && !historyEquals(historyRef.current, merged)) {
          replaceHistory(merged);
        }
        await push(merged);
      } catch (e) {
        if (e?.response?.status === 401) {
          onUnauthorizedRef.current?.();
          return;
        }
        // Offline at sign-in: keep the local list, retry on the next change.
        console.warn("history merge failed", e?.message);
      }
    })();
  }, [token, replaceHistory, push]);
}

/** Explicit account wipe — the only path that deletes server rows. */
export async function deleteServerHistory(token) {
  if (!token) return;
  try {
    await axios.delete(`${API_BASE}/history`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 20000,
    });
  } catch (e) {
    console.warn("history delete failed", e?.message);
  }
}
