// Device-level notifications for the two things a farmer should hear about
// without opening the app:
//   · a new notice (crop alert, announcement, update, new product, medicine)
//   · a reply from support on one of their tickets
//
// Foreground this hook runs a quiet 30s poll; the background work lives in
// notifications/notifPollTask, which the OS schedules on its own. Both run
// notifications/notifCycle against one persisted baseline, so the farmer is
// told exactly once no matter which half of the system noticed first — and
// gets told at all when Android has the app backgrounded.
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { ensureChannel, ensurePermission, runNotifCycle } from "../notifications/notifCycle";
import {
  registerNotifPollTask,
  unregisterNotifPollTask,
} from "../notifications/notifPollTask";

const POLL_MS = 30000;

export function useAppNotifications(token, userId = null) {
  const grantedRef = useRef(false);

  // Permission is only worth asking for once the farmer is signed in —
  // that is who notices and ticket replies are addressed to.
  useEffect(() => {
    if (!token || userId == null) {
      unregisterNotifPollTask();
      return undefined;
    }
    let alive = true;
    (async () => {
      await ensureChannel();
      if (!alive) return;
      grantedRef.current = await ensurePermission();
      await registerNotifPollTask();
    })();
    return () => {
      alive = false;
    };
  }, [token, userId]);

  useEffect(() => {
    if (!token || userId == null) {
      console.log("[notif] foreground poll NOT armed", { hasToken: !!token, userId });
      return undefined;
    }
    let alive = true;
    console.log("[notif] foreground poll armed for user", userId);

    const run = () => {
      if (!alive) return undefined;
      return runNotifCycle({ token, userId, granted: grantedRef.current });
    };

    run();
    const timer = setInterval(run, POLL_MS);
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") run();
    });
    return () => {
      alive = false;
      clearInterval(timer);
      sub.remove();
    };
  }, [token, userId]);
}
