// Keeps the local session honest after the server revokes it — and keeps the
// displayed profile truthful.
//
// Suspending a farmer deletes their session rows, so every future call would
// 401 — but a farmer sitting on the Home screen makes no calls at all, so the
// 401 never happened and the app kept acting signed in. This hook makes the
// check happen on its own: on mount, on a slow timer, and whenever the app
// comes back to the foreground.
//
// The same call re-reads the profile (`onCheck` is `refreshUser`), so whatever
// account the stored token actually belongs to is what the Profile card shows.
// That is why signing in on a second device can never display a stale or
// wrong identity. The axios interceptor in useAuth turns a 401/403-suspension
// into an automatic sign-out; this is what guarantees the request is made.
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { isSignedOutError } from "./useApi";

const CHECK_MS = 60000;

export function useSessionWatch(token, onCheck, onUnauthorized) {
  const checkRef = useRef(onCheck);
  checkRef.current = onCheck;
  const cbRef = useRef(onUnauthorized);
  cbRef.current = onUnauthorized;

  useEffect(() => {
    if (!token) return undefined;
    let alive = true;

    const run = async () => {
      try {
        await checkRef.current?.();
      } catch (e) {
        // Offline / timeout / server down → no response object → leave the
        // session and profile alone. Only an explicit 401 or "suspended" 403
        // signs out.
        if (!alive) return;
        if (isSignedOutError(e)) cbRef.current?.();
      }
    };

    run();
    const timer = setInterval(run, CHECK_MS);
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") run();
    });

    return () => {
      alive = false;
      clearInterval(timer);
      sub.remove();
    };
  }, [token]);
}
