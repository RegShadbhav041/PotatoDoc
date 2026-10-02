// The single owner of session state. Screens receive signIn/signUp/signOut as
// props from App.js — calling useAuth() in more than one place would give each
// caller an independent, unsynchronised copy of the session.
import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE, apiGet, apiPost, apiPut, uploadAuthed } from "./useApi";

const TOKEN_KEY = "potatoDocAuth";
const REMEMBER_KEY = "potatoDocAuthRemember";

export function authErrorMessage(error) {
  if (!error?.response) return "Can't reach the server. Check your connection.";
  const detail = error.response.data?.detail;
  if (typeof detail === "string" && detail) return detail;
  return "Something went wrong. Please try again.";
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(TOKEN_KEY);
        const remember = await AsyncStorage.getItem(REMEMBER_KEY);
        if (stored && remember === "1") {
          const res = await apiGet("/auth/me", {
            headers: { Authorization: `Bearer ${stored}` },
            timeout: 15000,
          });
          if (!alive) return;
          setToken(stored);
          setUser(res.data);
        } else {
          await AsyncStorage.multiRemove([TOKEN_KEY, REMEMBER_KEY]);
        }
      } catch (e) {
        // Stale, expired or revoked token: start signed out, keep local history.
        await AsyncStorage.multiRemove([TOKEN_KEY, REMEMBER_KEY]).catch(() => {});
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const persist = useCallback(async (value, remember) => {
    if (remember) {
      await AsyncStorage.multiSet([
        [TOKEN_KEY, value],
        [REMEMBER_KEY, "1"],
      ]).catch(() => {});
    } else {
      await AsyncStorage.multiRemove([TOKEN_KEY, REMEMBER_KEY]).catch(() => {});
    }
  }, []);

  const signIn = useCallback(
    async (contact, password, options = {}) => {
      const remember = options.remember !== false;
      const res = await apiPost(
        "/auth/login",
        { contact, password },
        { timeout: 20000 }
      );
      setToken(res.data.token);
      setUser(res.data.user);
      await persist(res.data.token, remember);
      return res.data.user;
    },
    [persist]
  );

  const signUp = useCallback(
    async (contact, name, password, options = {}) => {
      const remember = options.remember !== false;
      const res = await apiPost(
        "/auth/register",
        { contact, name, password },
        { timeout: 20000 }
      );
      setToken(res.data.token);
      setUser(res.data.user);
      await persist(res.data.token, remember);
      return res.data.user;
    },
    [persist]
  );

  /** Persist the Profile tab's "Your details" edits (PUT /auth/me). */
  const updateProfile = useCallback(
    async ({ name, contact }) => {
      const res = await apiPut(
        "/auth/me",
        { name, contact },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 20000 }
      );
      setUser(res.data);
      return res.data;
    },
    [token]
  );

  /** Replace the profile picture from a local file:// uri (expo-image-picker). */
  const uploadPhoto = useCallback(
    async (uri) => {
      const data = await uploadAuthed(uri, "/auth/me/photo", token);
      setUser(data);
      return data;
    },
    [token]
  );

  /** Remove the profile picture. */
  const removePhoto = useCallback(async () => {
    const res = await axios.delete(`${API_BASE}/auth/me/photo`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 20000,
    });
    setUser(res.data);
    return res.data;
  }, [token]);

  /** Drop a dead session (401) without touching local history. */
  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    AsyncStorage.multiRemove([TOKEN_KEY, REMEMBER_KEY]).catch(() => {});
  }, []);

  const signOut = useCallback(() => {
    const dead = token;
    setToken(null);
    setUser(null);
    AsyncStorage.multiRemove([TOKEN_KEY, REMEMBER_KEY]).catch(() => {});
    // Fire-and-forget: local sign-out must never depend on the network.
    if (dead) {
      apiPost("/auth/logout", null, {
        headers: { Authorization: `Bearer ${dead}` },
        timeout: 10000,
      }).catch(() => {});
    }
  }, [token]);

  return {
    user,
    token,
    ready,
    signIn,
    signUp,
    signOut,
    clearSession,
    updateProfile,
    uploadPhoto,
    removePhoto,
  };
}
