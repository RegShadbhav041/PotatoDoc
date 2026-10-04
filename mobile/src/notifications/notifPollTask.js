// The background half of the notification system.
//
// A JS `setInterval` dies the moment Android backgrounds the app, which is why
// notifications only ever appeared while PotatoDoc was open. This registers an
// OS-scheduled background task that runs the SAME cycle from
// notifications/notifCycle — Android wakes the app roughly every 15 minutes
// (its floor), the task fetches notices and support replies, and anything new
// is posted as a real notification.
//
// Limits worth knowing: the interval is a minimum, not a schedule; Android
// defers it under battery optimisation, and force-stopping the app (swiping it
// away on some launchers) stops the task until the app is opened again.
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";
import { TOKEN_KEY } from "../hooks/useAuth";
import { apiGet } from "../hooks/useApi";
import { ensureChannel, readPermission, runNotifCycle } from "./notifCycle";

export const NOTIF_POLL_TASK = "potatodoc-notif-poll";

/** Android's floor is 15 minutes; the system still treats it as a minimum. */
export const NOTIF_POLL_MINUTES = 15;

// Must be registered at global scope, synchronously, before React mounts —
// TaskManager refuses a task defined later. Importing this module from the
// top of App.js is what makes that true.
TaskManager.defineTask(NOTIF_POLL_TASK, async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) return BackgroundTask.BackgroundTaskResult.Success;

    const auth = { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 };
    let userId = null;
    try {
      // Also doubles as a liveness check: a revoked token 401s here and the
      // task quietly does nothing instead of waking the farmer for nothing.
      const me = await apiGet("/auth/me", auth);
      userId = me?.data?.id ?? null;
    } catch (e) {
      return BackgroundTask.BackgroundTaskResult.Success;
    }
    if (userId == null) return BackgroundTask.BackgroundTaskResult.Success;

    await ensureChannel();
    const granted = await readPermission(); // never prompt from the background
    const result = await runNotifCycle({ token, userId, granted });
    console.log(`[notif] background cycle done reason=${result.reason} announced=${result.announced}`);
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (e) {
    console.log(`[notif] background cycle FAILED: ${e?.message}`);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerNotifPollTask() {
  try {
    if ((await BackgroundTask.getStatusAsync()) === BackgroundTask.BackgroundTaskStatus.Restricted) {
      return false;
    }
    await BackgroundTask.registerTaskAsync(NOTIF_POLL_TASK, {
      minimumInterval: NOTIF_POLL_MINUTES,
    });
    return true;
  } catch (e) {
    // Scheduling is best-effort: the foreground 30s poll still covers the
    // app-foreground case even if the OS refuses to schedule anything.
    return false;
  }
}

export async function unregisterNotifPollTask() {
  try {
    await BackgroundTask.unregisterTaskAsync(NOTIF_POLL_TASK);
  } catch (e) {
    // Not registered — nothing to undo.
  }
}
