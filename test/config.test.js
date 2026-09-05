import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { loadConfig } from "../src/config.js";

test("blank example credentials report incomplete configuration", () => {
  assert.equal(loadConfig({ GOOGLE_CLOUD_PROJECT: "demo", PARALLEL_API_KEY: "" }).ready, false);
});

test("local .env is loaded without overriding deployment environment", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "sceneledger-config-"));
  try {
    await writeFile(path.join(directory, ".env"), "GOOGLE_CLOUD_PROJECT=fixture-project\nPARALLEL_API_KEY=fixture-only\nGEMINI_MODEL=fixture-model\n");
    const env = { ...process.env, GEMINI_MODEL: "external-model" };
    delete env.GOOGLE_CLOUD_PROJECT;
    delete env.PARALLEL_API_KEY;
    const moduleUrl = new URL("../src/config.js", import.meta.url).href;
    const output = execFileSync(process.execPath, ["--input-type=module", "-e", `import {loadConfig} from ${JSON.stringify(moduleUrl)}; const c=loadConfig(); console.log(JSON.stringify({ready:c.ready,project:c.GOOGLE_CLOUD_PROJECT,model:c.GEMINI_MODEL}));`], { cwd: directory, env, encoding: "utf8" });
    assert.deepEqual(JSON.parse(output), { ready: true, project: "fixture-project", model: "external-model" });
  } finally { await rm(directory, { recursive: true, force: true }); }
});
