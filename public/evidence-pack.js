// Plain text keeps submitted text inert; JSON retains the complete structured source trail.
export function evidencePackText(data) {
  const output = ["SCENELEDGER — PRODUCTION EVIDENCE PACK", "",
    "EDITORIAL REVIEW REQUIRED. Model statuses and proposed wording are not publication clearance.",
    data.audit.scope, "", `Production: ${data.request?.title || "Untitled"}`,
    `Format: ${data.request?.productionType || "Not recorded"}`, `Audience: ${data.request?.audience || "Not recorded"}`,
    `Information cutoff: ${data.request?.cutoffDate || "Not specified"}`,
    "Cutoff uses publication metadata, not archived page versions. Undated sources may be included.",
    `Run completed: ${data.workflow.completedAt}`, `Model: ${data.workflow.planner}`, `Retrieval: ${data.workflow.searchProvider}`,
    "", "BRIEF", data.request?.brief || "Not recorded", "", data.headline, data.summary];
  const claimText = (claim) => {
    output.push("", `Claim: ${claim.claim}`, `Assessment: ${claim.status} / ${claim.confidence}`, `Production use: ${claim.productionUse}`);
    if (claim.rationale) output.push(`Reason: ${claim.rationale}`);
    output.push(`Proposed wording (requires review): ${claim.suggestedWording || "None offered"}`);
    for (const issue of claim.citationIssues || []) output.push(`Citation rejected: ${issue.sourceId} — ${issue.reason}`);
    for (const evidence of claim.evidence) output.push(`  [${evidence.sourceId}] ${evidence.excerpt}`);
  };
  if (data.scriptReview) {
    output.push("", "ORIGINAL SCRIPT (UNCHANGED)", data.scriptReview.originalScript, "", "LINE REVIEW");
    for (const line of data.scriptReview.lines) {
      output.push("", `LINE ${line.number} — ${line.status}`, line.original, line.note);
      line.assessments.forEach(claimText);
    }
    output.push("", "ADDITIONAL / UNMAPPED CLAIMS");
    data.scriptReview.unassignedClaims.forEach(claimText);
  } else data.claims.forEach(claimText);
  output.push("", "PRODUCTION RISKS", ...data.risks, "", "OPEN QUESTIONS", ...data.openQuestions);
  if (data.followUp) output.push("", "BOUNDED FOLLOW-UP", JSON.stringify(data.followUp, null, 2));
  output.push("", "SOURCES AND RETRIEVED EXCERPTS");
  for (const source of data.sources) output.push("", `[${source.id}] ${source.title}`, source.url, `Publication date: ${source.publishDate || "Unavailable"}`, ...source.excerpts);
  output.push("", "AUDIT AND RUNTIME", JSON.stringify({ audit: data.audit, workflow: data.workflow }, null, 2));
  return output.join("\n");
}

export function packFilename(data, extension) {
  const title = (data.request?.title || "sceneledger").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 60) || "sceneledger";
  return `${title}-evidence-${data.workflow.completedAt.slice(0, 10)}.${extension}`;
}
