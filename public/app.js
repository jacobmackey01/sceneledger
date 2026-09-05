import { readResearchStream } from "./research-stream.js";

const form = document.querySelector("#research-form");
const brief = form.elements.brief;
const count = document.querySelector("#brief-count");
const submitButton = form.querySelector("button[type='submit']");
const errorBox = document.querySelector("#form-error");
const panel = document.querySelector(".result-panel");
const emptyState = document.querySelector("#empty-state");
const loadingState = document.querySelector("#loading-state");
const result = document.querySelector("#result");

const example = {
  title: "The Last Independent Cinema",
  productionType: "documentary",
  audience: "UK cinema audiences and cultural-policy stakeholders",
  cutoffDate: new Date().toISOString().slice(0, 10),
  brief: "A documentary sequence argues that independent cinemas in the United Kingdom face a sharper financial squeeze than major chains. Establish the latest evidence on venue closures, audience recovery, operating costs and public support. Separate national trends from isolated anecdotes, identify claims that need cautious wording, and recommend sources or interview targets for anything the current evidence cannot settle.",
};

document.querySelector("#load-example").addEventListener("click", () => {
  for (const [key, value] of Object.entries(example)) form.elements[key].value = value;
  count.textContent = String(example.brief.length);
  brief.focus();
});

brief.addEventListener("input", () => { count.textContent = String(brief.value.length); });

function setView(view) {
  emptyState.hidden = view !== "empty";
  loadingState.hidden = view !== "loading";
  result.hidden = view !== "result";
  panel.setAttribute("aria-busy", view === "loading" ? "true" : "false");
}

function renderProgress({ stage }) {
  const stages = ["plan", "parallel-search", "synthesize", "citation-audit", "complete"];
  const labels = ["Planning questions", "Searching with Parallel", "Synthesizing with Gemini", "Checking source IDs and quotes", "Research complete"];
  const index = stages.indexOf(stage);
  if (index < 0) return;
  document.querySelector("#loading-title").textContent = labels[index];
  document.querySelectorAll(".progress-list li").forEach((item, itemIndex) => {
    item.classList.toggle("active", itemIndex === index);
    item.classList.toggle("complete", itemIndex < index);
    if (itemIndex === index) item.setAttribute("aria-current", "step");
    else item.removeAttribute("aria-current");
  });
}

function appendList(target, items, fallback) {
  target.replaceChildren();
  for (const item of items.length ? items : [fallback]) {
    const li = document.createElement("li");
    li.textContent = item;
    target.append(li);
  }
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "#";
  } catch { return "#"; }
}

function renderClaim(claim) {
  const card = document.createElement("article");
  card.className = "claim";

  const top = document.createElement("div");
  top.className = "claim-top";
  const status = document.createElement("span");
  status.className = `status ${claim.status}`;
  status.textContent = `${claim.status} · ${claim.confidence}`;
  const copy = document.createElement("div");
  const statement = document.createElement("p");
  statement.className = "claim-text";
  statement.textContent = claim.claim;
  const use = document.createElement("p");
  use.className = "claim-use";
  use.textContent = claim.productionUse;
  copy.append(statement, use);
  top.append(status, copy);
  card.append(top);

  if (claim.evidence.length) {
    const evidence = document.createElement("div");
    evidence.className = "claim-evidence";
    for (const item of claim.evidence) {
      const row = document.createElement("p");
      const label = document.createElement("a");
      label.href = `#source-${item.sourceId}`;
      label.textContent = `${item.sourceId.toUpperCase()} `;
      row.append(label, document.createTextNode(`“${item.excerpt}”`));
      evidence.append(row);
    }
    card.append(evidence);
  }
  return card;
}

function renderRun(data) {
  document.querySelector("#result-headline").textContent = data.headline;
  document.querySelector("#result-summary").textContent = data.summary;
  document.querySelector("#claim-count").textContent = `${data.claims.length} assessed`;
  document.querySelector("#source-count").textContent = `${data.sources.length} retrieved`;

  const badge = document.querySelector("#audit-badge");
  badge.textContent = data.audit.passed ? "Source IDs & quotes matched" : "Citation check: review needed";
  badge.classList.toggle("fail", !data.audit.passed);
  document.querySelector("#audit-scope").textContent = data.audit.scope;

  const claims = document.querySelector("#claims");
  claims.replaceChildren(...data.claims.map(renderClaim));
  appendList(document.querySelector("#risks"), data.risks, "No additional risks identified in this run.");
  appendList(document.querySelector("#questions"), data.openQuestions, "No open questions recorded.");

  const sources = document.querySelector("#sources");
  sources.replaceChildren();
  for (const source of data.sources) {
    const li = document.createElement("li");
    li.className = "source";
    li.id = `source-${source.id}`;
    const link = document.createElement("a");
    link.href = safeUrl(source.url);
    link.target = "_blank";
    link.rel = "noreferrer noopener";
    link.textContent = source.title;
    const date = document.createElement("time");
    date.textContent = source.publishDate || "Date unavailable";
    li.append(link, date);
    sources.append(li);
  }

  document.querySelector("#run-metadata").textContent = [
    `Planner: ${data.workflow.planner}`,
    `Retrieval: ${data.workflow.searchProvider}`,
    `Checks: ${data.workflow.steps.join(" → ")}`,
    `Completed: ${new Date(data.workflow.completedAt).toLocaleString()}`,
  ].join("  ·  ");
  setView("result");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorBox.hidden = true;
  if (!form.reportValidity()) return;

  const payload = Object.fromEntries(new FormData(form));
  if (!payload.cutoffDate) delete payload.cutoffDate;
  submitButton.disabled = true;
  setView("loading");
  document.querySelector("#loading-title").textContent = "Connecting to research desk";
  document.querySelectorAll(".progress-list li").forEach((item) => {
    item.classList.remove("active", "complete");
    item.removeAttribute("aria-current");
  });

  try {
    const response = await fetch("/api/research", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/x-ndjson" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || data.error || "Research run failed");
    }
    const data = await readResearchStream(response.body, renderProgress);
    renderRun(data);
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.hidden = false;
    setView("empty");
  } finally {
    submitButton.disabled = false;
  }
});

async function checkRuntime() {
  const runtime = document.querySelector(".runtime");
  const label = document.querySelector("#runtime-label");
  try {
    const response = await fetch("/api/health");
    const data = await response.json();
    runtime.classList.add(data.status === "ready" ? "ready" : "error");
    label.textContent = data.status === "ready" ? `${data.model} configured` : "Configuration required";
  } catch {
    runtime.classList.add("error");
    label.textContent = "Runtime unavailable";
  }
}

checkRuntime();
