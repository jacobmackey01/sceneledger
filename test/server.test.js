import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { providers, request } from "./fixtures.js";
import { createRequestGuard } from "../src/guard.js";
process.env.NODE_ENV = "test";
const { createApp } = await import("../src/server.js");

async function withApp(options, run) {
  const services = providers();
  const app = createApp({ config: { ready: true, GEMINI_MODEL: "test" }, geminiFactory: () => services.gemini, parallelFactory: () => services.parallel, ...options });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((resolve) => server.close(resolve)); }
}
const post = (url, body = request, streaming = false) => fetch(`${url}/api/research`, {
  method: "POST", headers: { "Content-Type": "application/json", ...(streaming ? { Accept: "application/x-ndjson" } : {}) }, body: JSON.stringify(body),
});

test("HTTP JSON and streaming responses return checked ledgers", async () => {
  await withApp({}, async (url) => {
    assert.equal((await (await post(url)).json()).audit.passed, true);
    const response = await post(url, request, true);
    assert.match(response.headers.get("content-type"), /application\/x-ndjson/);
    const events = (await response.text()).trim().split("\n").map(JSON.parse);
    assert.deepEqual(events.filter((event) => event.type === "progress").map((event) => event.stage), ["plan", "parallel-search", "synthesize", "citation-audit", "complete"]);
    assert.equal(events.at(-1).data.audit.passed, true);
  });
});

test("HTTP validates configuration, input and rate limits", async () => {
  await withApp({ config: { ready: false } }, async (url) => assert.equal((await post(url)).status, 503));
  await withApp({ researchGuard: createRequestGuard({ maxRequests: 1 }) }, async (url) => {
    assert.equal((await post(url, {})).status, 400);
    assert.equal((await post(url)).status, 200);
    const response = await post(url);
    assert.equal(response.status, 429);
    assert.ok(response.headers.get("retry-after"));
  });
});

test("HTTP failures release slots, expose no provider secrets and produce no ledger", async () => {
  await withApp({
    geminiFactory: () => ({ async plan() { throw new Error("SECRET_PROVIDER_DETAIL"); } }),
    researchGuard: createRequestGuard({ maxConcurrent: 1, maxRequests: 10 }),
  }, async (url) => {
    for (const streaming of [false, true, false]) {
      const response = await post(url, request, streaming);
      assert.equal(response.status, streaming ? 200 : 502);
      const text = await response.text();
      assert.doesNotMatch(text, /SECRET_PROVIDER_DETAIL|"type":"result"/);
      assert.match(text, /No ledger was generated/);
    }
  });
});
