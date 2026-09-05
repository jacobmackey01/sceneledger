import test from "node:test";
import assert from "node:assert/strict";
import { runResearchWorkflow } from "../src/workflow.js";
import { readResearchStream } from "../public/research-stream.js";
import { providers, request } from "./fixtures.js";

test("progress is emitted at actual stage boundaries", async () => {
  const services = providers();
  const events = [];
  services.gemini.plan = async () => {
    assert.deepEqual(events, ["plan"]);
    return { researchQuestions: [{ id: "q1" }] };
  };
  const originalSearch = services.parallel.search;
  services.parallel.search = async () => {
    assert.equal(events.at(-1), "parallel-search");
    return originalSearch();
  };
  const originalSynthesis = services.gemini.synthesize;
  services.gemini.synthesize = async () => {
    assert.equal(events.at(-1), "synthesize");
    return originalSynthesis();
  };
  const result = await runResearchWorkflow({ request, ...services, onProgress: ({ stage }) => events.push(stage) });
  assert.deepEqual(events, ["plan", "parallel-search", "synthesize", "citation-audit", "complete"]);
  assert.deepEqual(result.workflow.stages.map((item) => item.stage), events);
});

test("provider failures and empty retrieval never emit completion", async () => {
  for (const failure of ["plan", "search", "synthesize", "empty"]) {
    const services = providers();
    const fail = async () => { throw new Error("provider failed"); };
    if (failure === "plan") services.gemini.plan = fail;
    if (failure === "search") services.parallel.search = fail;
    if (failure === "synthesize") services.gemini.synthesize = fail;
    if (failure === "empty") services.parallel.search = async () => [];
    const events = [];
    await assert.rejects(runResearchWorkflow({ request, ...services, onProgress: ({ stage }) => events.push(stage) }));
    assert.equal(events.includes("complete"), false);
  }
});

function stream(text) {
  const bytes = new TextEncoder().encode(text);
  return new ReadableStream({ start(controller) {
    for (const byte of bytes) controller.enqueue(new Uint8Array([byte]));
    controller.close();
  } });
}

test("browser stream reader handles split JSON and multibyte text", async () => {
  const events = [];
  const result = await readResearchStream(stream('{"type":"progress","stage":"plan"}\n{"type":"result","data":{"headline":"Cinéma ✓"}}'), (event) => events.push(event.stage));
  assert.deepEqual(events, ["plan"]);
  assert.equal(result.headline, "Cinéma ✓");
});

test("browser reader rejects a failed or interrupted stream", async () => {
  await assert.rejects(readResearchStream(stream('{"type":"error","detail":"Unavailable"}\n'), () => {}), /Unavailable/);
  await assert.rejects(readResearchStream(stream('{"type":"progress","stage":"plan"}\n'), () => {}), /ended before/);
});
