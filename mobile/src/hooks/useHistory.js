// AsyncStorage-backed prediction history (max 50 items).
import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { repairOversizedHistoryRow } from "./historyRepair";

const STORAGE_KEY = "potatoDocHistory";
const MAX_ITEMS = 50;

export function useHistory() {
  const [history, setHistory] = useState([]);
  const [storageBlocked, setStorageBlocked] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setHistory(JSON.parse(raw));
      } catch (e) {
        console.warn("history load failed", e?.message);
        // Oversized row (base64 heatmaps) -> repair in place, then retry.
        const ok = await repairOversizedHistoryRow();
        if (ok) {
          try {
            const raw2 = await AsyncStorage.getItem(STORAGE_KEY);
            if (raw2) {
              setHistory(JSON.parse(raw2));
              return;
            }
          } catch (e2) {
            console.warn("history reload after repair failed", e2?.message);
          }
        }
        // Unrecoverable: block writes so a new save cannot destroy unreadable data.
        setStorageBlocked(true);
      }
    })();
  }, []);

  const persist = async (next) => {
    setHistory(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn("history save failed", e?.message);
    }
  };

  const addEntry = useCallback(
    async (entry) => {
      if (storageBlocked) {
        console.warn("history save skipped: storage unreadable (protected)");
        return null;
      }
      const item = {
        ...entry,
        id: `${Date.now()}`,
        timestamp: new Date().toLocaleString(),
      };
      const next = [item, ...history].slice(0, MAX_ITEMS);
      await persist(next);
      return item;
    },
    [history, storageBlocked]
  );

  const clearHistory = useCallback(async () => {
    await persist([]);
  }, []);

  return { history, addEntry, clearHistory };
}
