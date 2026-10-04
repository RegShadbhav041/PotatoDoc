// Persistent state for the "has this farmer already been told?" baseline.
//
// The baseline used to live in a useRef, which meant every Android background
// of the app threw it away — and with it any chance of announcing something
// that arrived while the app was closed. It now lives in AsyncStorage so the
// 30s foreground poll and the OS-scheduled background task read and write the
// SAME record: they can never double-announce, and neither can forget.
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  deserializeBaseline,
  serializeBaseline,
} from "../hooks/notificationDiff";

export const NOTIF_BASELINE_KEY = "potatodocNotifBaseline";

// One cycle at a time. The foreground poll fires every 30s and the background
// task roughly every 15min, so a collision is rare — but if both read the
// baseline before either writes, the farmer gets the same ping twice.
const LOCK_KEY = "potatodocNotifLock";
const LOCK_TTL_MS = 20000;

export async function loadBaseline(userId) {
  try {
    const raw = await AsyncStorage.getItem(NOTIF_BASELINE_KEY);
    return deserializeBaseline(raw, userId);
  } catch (e) {
    return null;
  }
}

export async function saveBaseline(baseline, userId) {
  try {
    const payload = serializeBaseline(baseline, userId);
    if (payload) {
      await AsyncStorage.setItem(NOTIF_BASELINE_KEY, JSON.stringify(payload));
    }
  } catch (e) {
    // Losing the record only means one extra baseline cycle, never a crash.
  }
}

export async function acquireCycleLock() {
  try {
    const raw = await AsyncStorage.getItem(LOCK_KEY);
    const at = Number(raw) || 0;
    if (Date.now() - at < LOCK_TTL_MS) return false;
    await AsyncStorage.setItem(LOCK_KEY, String(Date.now()));
    return true;
  } catch (e) {
    // Storage unusable: still run, rather than silently never notify.
    return true;
  }
}

export async function releaseCycleLock() {
  try {
    await AsyncStorage.removeItem(LOCK_KEY);
  } catch (e) {
    // A stale lock self-heals after LOCK_TTL_MS anyway.
  }
}
