import test from "node:test";
import assert from "node:assert/strict";
import {
  isDeadSession,
  isSuspension,
  isSignedOutError,
} from "../src/hooks/sessionErrors.js";

const err = (status, url, detail) => ({
  config: { url },
  response: { status, data: detail === undefined ? {} : { detail } },
});

test("401 from a protected endpoint means the session is dead", () => {
  assert.equal(isDeadSession(err(401, "http://x/api/history")), true);
  assert.equal(isSignedOutError(err(401, "http://x/api/history")), true);
});

test("401 without a url still counts (defensive)", () => {
  assert.equal(isDeadSession({ response: { status: 401 } }), true);
});

test("a failed login is not a sign-out", () => {
  assert.equal(isDeadSession(err(401, "http://x/auth/login", "Invalid credentials")), false);
  assert.equal(isDeadSession(err(401, "/auth/login", "Invalid credentials")), false);
});

test("register and logout 401s are attempts, not sign-outs", () => {
  assert.equal(isDeadSession(err(401, "/auth/register")), false);
  assert.equal(isDeadSession(err(401, "/auth/logout")), false);
});

test("query strings on auth endpoints are still excluded", () => {
  assert.equal(isDeadSession(err(401, "/auth/login?next=/home")), false);
});

test("suspension 403 signs out", () => {
  const e = err(403, "/auth/login", "This account has been suspended. Contact support.");
  assert.equal(isSuspension(e), true);
  assert.equal(isSignedOutError(e), true);
});

test("the superadmin 403 is not a suspension", () => {
  const e = err(403, "/admin/users", "Superadmin access required");
  assert.equal(isSuspension(e), false);
  assert.equal(isSignedOutError(e), false);
});

test("403 with no detail is not treated as suspension", () => {
  assert.equal(isSuspension(err(403, "/x")), false);
});

test("network failures never sign the farmer out", () => {
  // Offline / timeout / server down: no response object at all.
  assert.equal(isDeadSession({ request: {} }), false);
  assert.equal(isSuspension({ request: {} }), false);
  assert.equal(isSignedOutError({ message: "Network Error" }), false);
});

test("other statuses are ignored", () => {
  for (const status of [200, 400, 404, 429, 500]) {
    assert.equal(isDeadSession(err(status, "/x")), false, `status ${status}`);
    assert.equal(isSuspension(err(status, "/x")), false, `status ${status}`);
    assert.equal(isSignedOutError(err(status, "/x")), false, `status ${status}`);
  }
});
