import test from "node:test";
import assert from "node:assert/strict";
import { fmt } from "../src/utils/locationText.js";

test("substitutes simple placeholders", () => {
  assert.equal(fmt("{alt} m — optimum 800–3000 m", { alt: "855" }),
    "855 m — optimum 800–3000 m");
});

test("substitutes every placeholder in one pass", () => {
  assert.equal(
    fmt("{texture}, pH {ph} — loam drains best", { texture: "Loam", ph: "5.8" }),
    "Loam, pH 5.8 — loam drains best"
  );
});

test("unknown keys stay literal", () => {
  assert.equal(fmt("hello {name}", {}), "hello {name}");
});

test("null/undefined values stay literal", () => {
  assert.equal(fmt("{rain} mm", { rain: null }), "{rain} mm");
  assert.equal(fmt("{rain} mm", { rain: undefined }), "{rain} mm");
});

test("missing vars map returns the template unchanged", () => {
  assert.equal(fmt("{zone} regime", null), "{zone} regime");
});

test("non-string input renders empty", () => {
  assert.equal(fmt(null, {}), "");
  assert.equal(fmt(42, {}), "");
});

test("numbers and zero are stringified", () => {
  assert.equal(fmt("pH {ph}", { ph: 0 }), "pH 0");
});
