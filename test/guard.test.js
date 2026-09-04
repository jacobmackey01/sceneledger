import test from "node:test";
import assert from "node:assert/strict";
import { createRequestGuard } from "../src/guard.js";

test("guard limits concurrent research and releases exactly once", () => {
  const guard = createRequestGuard({ maxConcurrent: 1, maxRequests: 5 });
  const first = guard.tryEnter("visitor-a");
  const blocked = guard.tryEnter("visitor-b");
  assert.equal(first.ok, true);
  assert.deepEqual(blocked, { ok: false, status: 503, retryAfterSeconds: 10 });

  first.release();
  first.release();
  assert.equal(guard.tryEnter("visitor-b").ok, true);
});

test("guard enforces and resets the per-visitor window", () => {
  let timestamp = 1000;
  const guard = createRequestGuard({
    maxConcurrent: 2,
    maxRequests: 2,
    windowMs: 100,
    now: () => timestamp,
  });

  guard.tryEnter("visitor").release();
  timestamp += 10;
  guard.tryEnter("visitor").release();
  const limited = guard.tryEnter("visitor");
  assert.equal(limited.ok, false);
  assert.equal(limited.status, 429);

  timestamp += 101;
  assert.equal(guard.tryEnter("visitor").ok, true);
});
