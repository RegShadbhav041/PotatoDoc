// Notice feed state. Owned ONCE in App.js (same rule as useAuth): the bell
// badge on Home/History and the News screen must share one unread counter.
//
// Backend contract (see backend-standalone/notices.py):
//   GET  /notices              public -> {items:[{id,category,title,body,author_name,created_at,read?}], unread}
//   GET  /notices/unread-count auth   -> {unread}
//   POST /notices/{id}/read    auth   -> {ok, unread}
//   POST /notices/read-all     auth   -> {marked, unread}
// The list is public — anonymous callers simply get no read flags.
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE } from "./useApi";

export const NOTICE_CATEGORIES = ["update", "announcement", "crop_alert"];

const LIST_TIMEOUT_MS = 15000;

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function errorMessage(e) {
  if (!e?.response) return "Can't reach the server. Check your connection.";
  const detail = e.response.data?.detail;
  if (typeof detail === "string" && detail) return detail;
  return "Something went wrong. Please try again.";
}

export function useNotices(token) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setRefreshing(true);
      try {
        const res = await axios.get(`${API_BASE}/notices`, {
          headers: authHeaders(token),
          timeout: LIST_TIMEOUT_MS,
        });
        if (!mounted.current) return;
        const data = res.data || {};
        setItems(Array.isArray(data.items) ? data.items : []);
        setUnread(Number(data.unread) || 0);
        setError(null);
      } catch (e) {
        // Keep the last good feed on a flaky connection.
        if (mounted.current) setError(errorMessage(e));
      } finally {
        if (mounted.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [token]
  );

  useEffect(() => {
    load();
  }, [load]);

  const markRead = useCallback(
    async (noticeId) => {
      if (!token) return false;
      const already = items.find((n) => n.id === noticeId)?.read;
      if (already) return true;
      // Optimistic: flip the dot immediately, reconcile with the server count.
      setItems((prev) =>
        prev.map((n) => (n.id === noticeId ? { ...n, read: true } : n))
      );
      setUnread((prev) => Math.max(0, prev - 1));
      try {
        const res = await axios.post(
          `${API_BASE}/notices/${noticeId}/read`,
          null,
          { headers: authHeaders(token), timeout: LIST_TIMEOUT_MS }
        );
        if (mounted.current && Number.isFinite(res.data?.unread)) {
          setUnread(res.data.unread);
        }
        return true;
      } catch (e) {
        if (mounted.current) {
          setItems((prev) =>
            prev.map((n) => (n.id === noticeId ? { ...n, read: false } : n))
          );
          setUnread((prev) => prev + 1);
          setError(errorMessage(e));
        }
        return false;
      }
    },
    [items, token]
  );

  const markAllRead = useCallback(async () => {
    if (!token) return 0;
    const previouslyUnread = items.filter((n) => !n.read).length;
    if (!previouslyUnread) return 0;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    try {
      const res = await axios.post(
        `${API_BASE}/notices/read-all`,
        null,
        { headers: authHeaders(token), timeout: LIST_TIMEOUT_MS }
      );
      return Number(res.data?.marked) || previouslyUnread;
    } catch (e) {
      if (mounted.current) {
        setItems((prev) => prev.map((n) => ({ ...n, read: false })));
        setUnread(previouslyUnread);
        setError(errorMessage(e));
      }
      return 0;
    }
  }, [items, token]);

  return {
    items,
    unread,
    loading,
    refreshing,
    error,
    refresh: load,
    markRead,
    markAllRead,
  };
}
