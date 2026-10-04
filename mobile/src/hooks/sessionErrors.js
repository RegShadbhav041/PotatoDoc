// Pure predicates for "this session can never work again".
// Kept free of React / expo / axios imports so the decision that signs a
// farmer out can be unit-tested under plain node.

// Endpoints where a 401/403 is part of the *attempt*, not the session: a
// failed or rejected login must never wipe a session that already exists.
const ANON_AUTH_PATHS = /\/auth\/(login|register|logout)(\?|$)/;

/**
 * The token is gone: expired, revoked, or the account was suspended mid-
 * session (the server drops the session row, so `_resolve_session` → 401).
 */
export function isDeadSession(error) {
  if (error?.response?.status !== 401) return false;
  const url = String(error?.config?.url || error?.response?.config?.url || "");
  return !ANON_AUTH_PATHS.test(url);
}

/** The account is suspended: the server answers 403 with an explanatory message. */
export function isSuspension(error) {
  if (error?.response?.status !== 403) return false;
  const detail = String(error.response.data?.detail || "");
  return /suspend/i.test(detail);
}

/** Either proof that this session can never work again. */
export function isSignedOutError(error) {
  return isDeadSession(error) || isSuspension(error);
}
