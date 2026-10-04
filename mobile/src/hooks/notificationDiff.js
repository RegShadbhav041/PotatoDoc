// Pure "is this new?" logic for device notifications.
// Kept free of React / expo imports so the rule that decides whether a farmer
// gets buzzed can be unit-tested under plain node.

/** First successful poll: remember what already exists and announce none of it. */
export function makeBaseline(notices, tickets) {
  return {
    notices: new Set((notices || []).map((n) => n.id)),
    tickets: new Map(
      (tickets || []).map((t) => [t.id, Number(t.message_count) || 0])
    ),
  };
}

/**
 * Compare the latest poll against the baseline and return only the events
 * worth announcing: { notices: [...], tickets: [...] }.
 *
 * The baseline is advanced in place, so every event is reported exactly once.
 * Sources that failed to fetch (passed as null) are simply skipped — a flaky
 * network must never look like "everything is new".
 */
export function diffUpdates(baseline, notices, tickets) {
  const out = { notices: [], tickets: [] };

  if (Array.isArray(notices)) {
    for (const notice of notices) {
      if (baseline.notices.has(notice.id)) continue;
      baseline.notices.add(notice.id);
      // Already read on another device: no reason to buzz this one.
      if (notice.read) continue;
      out.notices.push(notice);
    }
  }

  if (Array.isArray(tickets)) {
    for (const ticket of tickets) {
      const seen = baseline.tickets.get(ticket.id);
      const count = Number(ticket.message_count) || 0;
      if (seen === undefined) {
        // Adopted silently: it's the farmer's own ticket, not a reply.
        baseline.tickets.set(ticket.id, count);
        continue;
      }
      // High-water mark: a flaky response with a missing/null count must never
      // lower it, or the next real message would fire a false "support replied".
      baseline.tickets.set(ticket.id, Math.max(seen, count));
      if (count > seen) out.tickets.push(ticket);
    }
  }

  return out;
}

/**
 * JSON-safe form of a baseline, stamped with the account it belongs to.
 * It has to outlive the JS runtime: Android kills the interval (and the
 * process) whenever the app is backgrounded, and the background task is what
 * picks the state back up on the next wake.
 */
export function serializeBaseline(baseline, userId) {
  if (!baseline || userId == null) return null;
  return {
    user: String(userId),
    notices: [...baseline.notices],
    tickets: [...baseline.tickets],
  };
}

/**
 * Inverse of serializeBaseline. Returns null — meaning "no usable baseline,
 * start fresh" — when the payload is corrupt OR belongs to a different
 * account, so a second farmer signing into this device can never be buzzed
 * about the first farmer's old notices.
 */
export function deserializeBaseline(raw, userId) {
  if (raw == null || userId == null) return null;
  let obj = raw;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!obj || !Array.isArray(obj.notices) || !Array.isArray(obj.tickets)) {
    return null;
  }
  if (obj.user == null || String(obj.user) !== String(userId)) return null;
  return {
    notices: new Set(obj.notices),
    tickets: new Map(obj.tickets),
  };
}
