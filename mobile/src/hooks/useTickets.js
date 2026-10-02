// Support tickets — the farmer's half of the two-way chat with the
// superadmin. Owned ONCE in App.js (same rule as useAuth/useNotices), so the
// Profile row, the ticket list and an open thread all share one state.
//
// Backend contract (see backend-standalone/tickets.py):
//   GET    /tickets               auth -> {items:[{id,subject,status,created_at,
//                                      updated_at,message_count,last_body}]}
//   POST   /tickets               auth -> 201 ticket {..., messages:[...]}
//   GET    /tickets/{id}          auth -> ticket + messages (owner only)
//   POST   /tickets/{id}/messages auth -> 201 ticket + messages (reopens resolved)
// Every call needs a bearer token; signed-out callers get a stable empty
// state instead of a 401 storm.
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE } from "./useApi";

const TIMEOUT_MS = 15000;

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function errorMessage(e) {
  if (!e?.response) return "Can't reach the server. Check your connection.";
  const detail = e.response.data?.detail;
  if (typeof detail === "string" && detail) return detail;
  return "Something went wrong. Please try again.";
}

export function useTickets(token) {
  const [items, setItems] = useState([]);
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
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
      if (!token) {
        setItems([]);
        setLoading(false);
        return;
      }
      if (!silent) setRefreshing(true);
      try {
        const res = await axios.get(`${API_BASE}/tickets`, {
          headers: authHeaders(token),
          timeout: TIMEOUT_MS,
        });
        if (!mounted.current) return;
        setItems(Array.isArray(res.data?.items) ? res.data.items : []);
        setError(null);
      } catch (e) {
        // Keep the last good list on a flaky connection.
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

  /** Load one ticket's thread. Throws so the caller can render the error. */
  const open = useCallback(
    async (ticketId) => {
      const res = await axios.get(`${API_BASE}/tickets/${ticketId}`, {
        headers: authHeaders(token),
        timeout: TIMEOUT_MS,
      });
      if (mounted.current) {
        setThread(res.data);
        setError(null);
      }
      return res.data;
    },
    [token]
  );

  const close = useCallback(() => setThread(null), []);

  /** Open a new ticket (subject + first message). Throws on failure. */
  const create = useCallback(
    async ({ subject, message }) => {
      setSending(true);
      try {
        const res = await axios.post(
          `${API_BASE}/tickets`,
          { subject, message },
          { headers: authHeaders(token), timeout: TIMEOUT_MS }
        );
        if (mounted.current) {
          setItems((prev) => [res.data, ...prev.filter((t) => t.id !== res.data.id)]);
          setThread(res.data);
          setError(null);
        }
        return res.data;
      } finally {
        if (mounted.current) setSending(false);
      }
    },
    [token]
  );

  /** Reply to the open thread. Throws on failure. */
  const reply = useCallback(
    async (body) => {
      if (!thread) throw new Error("No ticket open.");
      setSending(true);
      try {
        const res = await axios.post(
          `${API_BASE}/tickets/${thread.id}/messages`,
          { body },
          { headers: authHeaders(token), timeout: TIMEOUT_MS }
        );
        if (mounted.current) {
          setThread(res.data);
          // Bump the list summary (and its position) to match the server.
          setItems((prev) => [res.data, ...prev.filter((t) => t.id !== res.data.id)]);
          setError(null);
        }
        return res.data;
      } finally {
        if (mounted.current) setSending(false);
      }
    },
    [thread, token]
  );

  return {
    items,
    thread,
    loading,
    refreshing,
    sending,
    error,
    refresh: load,
    open,
    close,
    create,
    reply,
  };
}
