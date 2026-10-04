// One shared "fetch → compare → announce → remember" cycle.
//
// It is deliberately not a hook: the 30s foreground poll AND the OS-scheduled
// Android background task both call it. Sharing the body is what keeps them
// honest — if the rules lived in two places, backgrounding the app would start
// re-announcing things the farmer had already been told about.
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { apiGet } from "../hooks/useApi";
import { makeBaseline, diffUpdates } from "../hooks/notificationDiff";
import {
  acquireCycleLock,
  loadBaseline,
  releaseCycleLock,
  saveBaseline,
} from "./notifStore";

const ANDROID_CHANNEL_ID = "default";
const ANDROID_SOUND = "chime"; // android/app/src/main/res/raw/chime.wav
const BRAND = "#1f9d4c";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function clip(text, max = 140) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

export async function ensureChannel() {
  if (Platform.OS !== "android") return;
  try {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: "PotatoDoc alerts",
      importance: Notifications.AndroidImportance.MAX,
      sound: ANDROID_SOUND,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: BRAND,
      enableVibrate: true,
      bypassDnd: false,
    });
  } catch (e) {
    // A channel problem must never take the app down.
  }
}

/** Read-only: safe to call from a background task, where a prompt can't show. */
export async function readPermission() {
  try {
    return !!(await Notifications.getPermissionsAsync()).granted;
  } catch (e) {
    return false;
  }
}

/** Foreground only — this is the one that may raise the OS permission dialog. */
export async function ensurePermission() {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const asked = await Notifications.requestPermissionsAsync();
    return !!asked.granted;
  } catch (e) {
    return false;
  }
}

async function show(granted, title, body, data) {
  if (!granted) return false;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        color: BRAND,
        autoDismiss: true,
      },
      // Android needs the channel named on the trigger: a plain `null` trigger
      // delivers immediately but tells it nothing about WHICH channel, so expo
      // falls back to its own generic one and the chime never plays.
      // ChannelAwareTriggerInput is the "deliver now, on this channel" form.
      trigger: Platform.OS === "android" ? { channelId: ANDROID_CHANNEL_ID } : null,
    });
    return true;
  } catch (e) {
    return false; // never let one failure interrupt the cycle
  }
}

// AsyncStorage read-then-write is not atomic, so two cycles on the same JS
// thread (poll interval + AppState + the background task) can both pass the
// lock and post the same notice twice. This flag is synchronous, so it can't
// be observed as false by both callers.
let cycleInFlight = false;

/**
 * Run one notification cycle.
 *
 * Returns { ran, announced }. `ran: false` means nothing happened (signed
 * out, another cycle in flight, or the network gave nothing to work with) —
 * the caller must treat that as "no data", not as an error.
 *
 * The FIRST cycle for a given account only records what already exists; it
 * never notifies. That is what stops a fresh sign-in from firing a
 * notification for every notice the farmer has ever received.
 */
export async function runNotifCycle({ token, userId, granted = true }) {
  if (!token || userId == null) return { ran: false, announced: 0, reason: "no-session" };
  if (cycleInFlight) return { ran: false, announced: 0, reason: "locked" };
  cycleInFlight = true;
  if (!(await acquireCycleLock())) {
    cycleInFlight = false;
    return { ran: false, announced: 0, reason: "locked" };
  }

  try {
    const auth = { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 };
    const [resNotices, resTickets] = await Promise.allSettled([
      apiGet("/notices", auth),
      apiGet("/tickets", auth),
    ]);
    const notices =
      resNotices.status === "fulfilled" ? resNotices.value?.data?.items : null;
    const tickets =
      resTickets.status === "fulfilled" ? resTickets.value?.data?.items : null;
    // Offline / timed out: leave the baseline exactly as it was.
    if (!Array.isArray(notices) && !Array.isArray(tickets)) {
      return { ran: false, announced: 0, reason: "offline" };
    }

    let base = await loadBaseline(userId);
    if (!base) {
      // One clean cycle from both sources, otherwise we can't tell
      // "not fetched yet" from "there are none".
      if (!Array.isArray(notices) || !Array.isArray(tickets)) {
        return { ran: false, announced: 0, reason: "first-partial" };
      }
      await saveBaseline(makeBaseline(notices, tickets), userId);
      console.log("[notif] baseline established for user", userId);
      return { ran: true, announced: 0, reason: "baseline" };
    }

    const fresh = diffUpdates(base, notices, tickets);
    let announced = 0;
    for (const notice of fresh.notices) {
      const ok = await show(
        granted,
        clip(notice.title || "New notice", 90),
        clip(notice.body),
        { type: "notice", id: notice.id }
      );
      if (ok) announced += 1;
    }
    for (const ticket of fresh.tickets) {
      const ok = await show(granted, "Support replied", clip(ticket.subject, 120), {
        type: "ticket",
        id: ticket.id,
      });
      if (ok) announced += 1;
    }

    await saveBaseline(base, userId); // diffUpdates advanced it in place
    if (announced > 0 || fresh.notices.length || fresh.tickets.length) {
      console.log(`[notif] announced=${announced} newNotices=${fresh.notices.length} newTickets=${fresh.tickets.length} granted=${granted}`);
    }
    return { ran: true, announced, reason: "diff" };
  } finally {
    cycleInFlight = false;
    await releaseCycleLock();
  }
}
