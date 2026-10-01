import test from "node:test";
import assert from "node:assert/strict";
import {
  mergeHistory,
  stripLocalKeys,
  historyEquals,
  MAX_HISTORY_ITEMS,
} from "../src/hooks/historyMerge.js";

const entry = (id, extra = {}) => ({
  id: String(id),
  class: "Healthy",
  timestamp: "10/1/2026, 3:00 PM",
  ...extra,
});

test("union keeps entries found on only one side", () => {
  const merged = mergeHistory([entry(2)], [entry(1), entry(3)]);
  assert.deepEqual(
    merged.map((x) => x.id),
    ["3", "2", "1"]
  );
});

test("on an id collision the device copy wins", () => {
  const merged = mergeHistory(
    [entry(2, { imageUri: "file://a.jpg" })],
    [entry(2, { class: "Late Blight" })]
  );
  assert.equal(merged.length, 1);
  assert.equal(merged[0].class, "Healthy");
  assert.equal(merged[0].imageUri, "file://a.jpg");
});

test("server-only entries never carry a device-local imageUri", () => {
  const merged = mergeHistory([], [entry(7, { imageUri: "file://elsewhere.jpg" })]);
  assert.equal("imageUri" in merged[0], false);
});

test("ordering is newest first by numeric id", () => {
  const merged = mergeHistory([entry(1000), entry(3000), entry(2000)], []);
  assert.deepEqual(
    merged.map((x) => x.id),
    ["3000", "2000", "1000"]
  );
});

test("the merge is capped at 50 entries", () => {
  const local = Array.from({ length: 40 }, (_, i) => entry(1000 + i));
  const server = Array.from({ length: 30 }, (_, i) => entry(5000 + i));
  assert.equal(mergeHistory(local, server).length, MAX_HISTORY_ITEMS);
});

test("junk entries without an id are dropped", () => {
  const merged = mergeHistory([null, {}, { id: "" }, entry(5)], []);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].id, "5");
});

test("stripLocalKeys removes only device-local paths", () => {
  const out = stripLocalKeys(entry(1, { imageUri: "file://x.jpg" }));
  assert.equal("imageUri" in out, false);
  assert.equal(out.class, "Healthy");
});

test("historyEquals compares by id only", () => {
  assert.equal(historyEquals([entry(1)], [entry(1, { imageUri: "x" })]), true);
  assert.equal(historyEquals([entry(1)], [entry(2)]), false);
  assert.equal(historyEquals([], []), true);
  assert.equal(historyEquals(undefined, []), true);
});
