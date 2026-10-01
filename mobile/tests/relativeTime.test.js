import test from "node:test";
import assert from "node:assert/strict";
import {
  parseTimestamp,
  relativeTime,
  greeting,
} from "../src/utils/relativeTime.js";

const NOW = Date.parse("2026-10-01T12:00:00Z");

test("SQLite UTC timestamps parse as UTC", () => {
  const d = parseTimestamp("2026-10-01 10:00:00");
  assert.ok(d instanceof Date);
  assert.equal(d.toISOString(), "2026-10-01T10:00:00.000Z");
});

test("ISO strings with an explicit zone are honoured", () => {
  assert.equal(
    parseTimestamp("2026-10-01T12:00:00.000Z").getTime(),
    Date.parse("2026-10-01T12:00:00Z")
  );
});

test("junk returns null and renders as an empty string", () => {
  assert.equal(parseTimestamp(""), null);
  assert.equal(parseTimestamp(null), null);
  assert.equal(parseTimestamp("not a date"), null);
  assert.equal(relativeTime("not a date", NOW), "");
});

test("fresh timestamps read as 'just now'", () => {
  assert.equal(relativeTime("2026-10-01 11:59:30Z", NOW), "just now");
});

test("minutes, hours and days scale correctly", () => {
  assert.equal(relativeTime("2026-10-01 11:45:00", NOW), "15m ago");
  assert.equal(relativeTime("2026-10-01 07:00:00", NOW), "5h ago");
  assert.equal(relativeTime("2026-09-28 12:00:00", NOW), "3d ago");
});

test("older than a week falls back to a date", () => {
  const out = relativeTime("2026-09-01 12:00:00", NOW);
  assert.match(out, /\d{4}/);
  assert.equal(out.includes("ago"), false);
});

test("a Date instance and epoch millis are accepted", () => {
  assert.equal(relativeTime(new Date(NOW - 120_000), NOW), "2m ago");
  assert.equal(relativeTime(NOW - 3 * 3600 * 1000, NOW), "3h ago");
});

test("greeting follows the local hour", () => {
  const at = (h) => greeting(new Date(2026, 0, 1, h, 0, 0));
  assert.equal(at(7), "Good morning");
  assert.equal(at(11), "Good morning");
  assert.equal(at(13), "Good afternoon");
  assert.equal(at(17), "Good afternoon");
  assert.equal(at(21), "Good evening");
  assert.equal(at(2), "Good evening");
});
