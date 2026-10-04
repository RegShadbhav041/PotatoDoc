import test from "node:test";
import assert from "node:assert/strict";
import { makeBaseline, diffUpdates, serializeBaseline, deserializeBaseline } from "../src/hooks/notificationDiff.js";

const notice = (id, extra = {}) => ({ id, title: "N" + id, body: "b", ...extra });
const ticket = (id, message_count = 1, extra = {}) => ({
  id,
  subject: "T" + id,
  message_count,
  ...extra,
});

test("the baseline announces nothing that already existed", () => {
  const base = makeBaseline([notice(1), notice(2)], [ticket(10)]);
  const fresh = diffUpdates(base, [notice(1), notice(2)], [ticket(10)]);
  assert.deepEqual(fresh.notices, []);
  assert.deepEqual(fresh.tickets, []);
});

test("an empty baseline reports the first real load as new — baseline must be built first", () => {
  // Guard: if callers forgot to seed, everything fires. makeBaseline is the
  // documented way to seed, so this documents why seeding matters.
  const unseeded = makeBaseline([], []);
  const fresh = diffUpdates(unseeded, [notice(1)], [ticket(10)]);
  assert.equal(fresh.notices.length, 1);
  assert.equal(fresh.tickets.length, 0, "own ticket adopted silently, not announced");
});

test("a newly published notice is announced exactly once", () => {
  const base = makeBaseline([notice(1)], []);
  const first = diffUpdates(base, [notice(1), notice(2)], []);
  assert.deepEqual(first.notices.map((n) => n.id), [2]);

  const second = diffUpdates(base, [notice(1), notice(2)], []);
  assert.deepEqual(second.notices, [], "already announced last cycle");
});

test("a notice already read elsewhere is not announced", () => {
  const base = makeBaseline([notice(1)], []);
  const fresh = diffUpdates(base, [notice(1), notice(2, { read: true })], []);
  assert.deepEqual(fresh.notices, []);
  assert.equal(base.notices.has(2), true, "still recorded so it can't re-fire");
});

test("a support reply (message_count up) is announced", () => {
  const base = makeBaseline([], [ticket(10, 1)]);
  const fresh = diffUpdates(base, [], [ticket(10, 2)]);
  assert.deepEqual(fresh.tickets.map((t) => t.id), [10]);
});

test("a ticket with no new messages is not announced", () => {
  const base = makeBaseline([], [ticket(10, 3)]);
  const fresh = diffUpdates(base, [], [ticket(10, 3)]);
  assert.deepEqual(fresh.tickets, []);
});

test("a ticket created after the baseline is adopted silently", () => {
  const base = makeBaseline([], []);
  const fresh = diffUpdates(base, [], [ticket(10, 1)]);
  assert.deepEqual(fresh.tickets, []);
  // ...but its reply later still announces.
  const reply = diffUpdates(base, [], [ticket(10, 2)]);
  assert.deepEqual(reply.tickets.map((t) => t.id), [10]);
});

test("a failed fetch (null) leaves the baseline untouched", () => {
  const base = makeBaseline([notice(1)], [ticket(10, 1)]);
  const fresh = diffUpdates(base, null, null);
  assert.deepEqual(fresh.notices, []);
  assert.deepEqual(fresh.tickets, []);
  assert.equal(base.notices.size, 1);
  assert.equal(base.tickets.size, 1);

  // The source recovers later: only genuinely new items fire.
  const later = diffUpdates(base, [notice(1), notice(2)], [ticket(10, 1)]);
  assert.deepEqual(later.notices.map((n) => n.id), [2]);
  assert.deepEqual(later.tickets, []);
});

test("a missing message_count never poisons the baseline into a false reply", () => {
  const base = makeBaseline([], [ticket(10, 2)]);
  // Flaky response drops the count to null/zero.
  diffUpdates(base, [], [{ id: 10, subject: "T10", message_count: null }]);
  diffUpdates(base, [], [{ id: 10, subject: "T10" }]);
  // Next poll reports the same real count — must not look like a new reply.
  const fresh = diffUpdates(base, [], [ticket(10, 2)]);
  assert.deepEqual(fresh.tickets, [], "the high-water mark must not regress");
  // A genuine third message still announces.
  const reply = diffUpdates(base, [], [ticket(10, 3)]);
  assert.deepEqual(reply.tickets.map((t) => t.id), [10]);
});

// The baseline has to survive the process being killed — that is the whole
// point of moving it out of a ref and into storage for the background task.

test("a baseline survives a JSON round-trip and still announces only once", () => {
  const base = makeBaseline([notice(1)], [ticket(10, 2)]);
  const restored = deserializeBaseline(
    JSON.stringify(serializeBaseline(base, 5)),
    5
  );
  assert.ok(restored, "restored baseline must be usable");
  assert.equal(restored.notices.has(1), true, "Set must come back as a Set");
  assert.equal(restored.tickets.get(10), 2, "Map must come back as a Map");

  // The app was killed and relaunched between these two polls: the restored
  // baseline is what stops a notice that arrived while closed from firing
  // twice, or an old one from firing at all.
  const fresh = diffUpdates(restored, [notice(1), notice(2)], [ticket(10, 3)]);
  assert.deepEqual(fresh.notices.map((n) => n.id), [2]);
  assert.deepEqual(fresh.tickets.map((t) => t.id), [10]);

  const again = diffUpdates(restored, [notice(1), notice(2)], [ticket(10, 3)]);
  assert.deepEqual(again.notices, [], "second run must not re-announce");
  assert.deepEqual(again.tickets, [], "second run must not re-announce");
});

test("a baseline belonging to another account is refused", () => {
  const payload = JSON.stringify(serializeBaseline(makeBaseline([notice(1)], []), 5));
  assert.equal(deserializeBaseline(payload, 5).notices.has(1), true);
  assert.equal(deserializeBaseline(payload, 7), null, "farmer B must not inherit farmer A's state");
});

test("an account id is compared without caring about its type", () => {
  const payload = JSON.stringify(serializeBaseline(makeBaseline([], []), 5));
  assert.ok(deserializeBaseline(payload, "5"), "5 from the API, '5' from storage");
});

test("a corrupt or missing baseline degrades to 'start fresh', never a crash", () => {
  assert.equal(deserializeBaseline("not json", 5), null);
  assert.equal(deserializeBaseline(JSON.stringify({ hello: 1 }), 5), null);
  assert.equal(deserializeBaseline(null, 5), null);
  assert.equal(deserializeBaseline(JSON.stringify(serializeBaseline(makeBaseline([], []), 5)), null), null,
    "no signed-in user means no baseline to reuse");
});

test("serializeBaseline refuses to write an unowned baseline", () => {
  assert.equal(serializeBaseline(makeBaseline([notice(1)], []), null), null);
  assert.equal(serializeBaseline(null, 5), null);
});
