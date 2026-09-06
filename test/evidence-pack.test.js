import test from "node:test";
import assert from "node:assert/strict";
import { evidencePackText, packFilename } from "../public/evidence-pack.js";
import { runResearchWorkflow } from "../src/workflow.js";
import { request, providers } from "./fixtures.js";
test("export includes frozen request, original script, limitations, source excerpts and runtime", async () => {
  const data = await runResearchWorkflow({ request: { ...request, mode: "script", script: "  Original line.\n\nAnother." }, ...providers() });
  const text = evidencePackText(data);
  for (const expected of ["  Original line.\n\nAnother.", "unassessed", "not publication clearance", "https://example.com/report", "Attendance fell by 2 percent.", "test-model"]) assert.ok(text.includes(expected), expected);
  assert.equal(packFilename({ ...data, request: { title: "../../:<>" } }, "txt"), `sceneledger-evidence-${data.workflow.completedAt.slice(0, 10)}.txt`);
});
