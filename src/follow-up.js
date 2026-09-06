import { enforceEvidence, normalizeSources } from "./evidence.js";

function appendSources(original, groups, cutoffDate) {
  const merged = structuredClone(original);
  for (const source of normalizeSources(groups, cutoffDate)) {
    const existing = merged.find((item) => item.url === source.url);
    if (existing) {
      existing.excerpts = [...new Set([...existing.excerpts, ...source.excerpts])];
      existing.queryIds = [...new Set([...existing.queryIds, ...source.queryIds])];
    } else if (merged.length < 30) merged.push({ ...source, id: `s${merged.length + 1}` });
  }
  return merged;
}

export async function runFollowUp({ request, checked, sources, gemini, parallel, progress, calls }) {
  const targets = checked.claims.flatMap((claim, index) => claim.status === "unverified" ? [{ claim, index }] : []).slice(0, 2);
  const followUp = { enabled: true, status: "not-needed", searchCalls: 0, reassessmentCalls: 0, targets: [], note: "One round only; at most two unresolved claims. A changed status remains a model assessment." };
  if (!targets.length) return { checked, sources, followUp };
  followUp.targets = targets.map(({ claim, index }, i) => ({ claimIndex: index, claim: claim.claim, before: claim.status, after: claim.status, query: claim.claim.slice(0, 500), applied: false, key: `l${i + 1}` }));
  progress("follow-up-search");
  calls.search += targets.length;
  followUp.searchCalls = targets.length;
  const outcomes = await Promise.allSettled(followUp.targets.map((target, i) => parallel.search({
    id: `follow-up-${i + 1}`, label: target.claim, query: target.query,
    reason: "Seek primary evidence that supports or contradicts this unresolved claim. Do not assume it is true",
  })));
  const groups = outcomes.filter((item) => item.status === "fulfilled").map((item) => item.value);
  const merged = appendSources(sources, groups, request.cutoffDate);
  followUp.failedSearches = outcomes.filter((item) => item.status === "rejected").length;
  // Reassessment must receive some additional excerpt, not simply recycle unchanged evidence.
  const changed = merged.some((source) => {
    const old = sources.find((item) => item.id === source.id);
    return !old || source.excerpts.some((excerpt) => !old.excerpts.includes(excerpt));
  });
  if (!changed) {
    followUp.status = followUp.failedSearches ? "search-failed-or-empty" : "no-new-evidence";
    return { checked, sources, followUp };
  }
  progress("follow-up-assess");
  followUp.reassessmentCalls = 1;
  calls.gemini++;
  try {
    const followRequest = { ...request, mode: "script", followUp: false,
      script: targets.map(({ claim }) => claim.claim.replace(/\r\n|\n|\r/gu, " ")).join("\n"),
      brief: "Reassess only the supplied atomic claims using the supplied sources. Return exactly one claim for each lineId. Copy each claim exactly from its narration line; do not substitute a different or narrower claim. Explain whether the new evidence resolves the gap. Unresolved claims must remain unverified. Proposed wording must not go beyond the evidence.",
    };
    const raw = await gemini.synthesize(followRequest, [], merged);
    progress("follow-up-audit");
    const reassessed = enforceEvidence(raw, merged);
    const claims = [...checked.claims];
    for (const target of followUp.targets) {
      const matches = reassessed.claims.filter((claim) => claim.lineId === target.key);
      const expected = target.claim.replace(/\r\n|\n|\r/gu, " ");
      if (matches.length !== 1 || matches[0].claim !== expected) {
        target.reason = "Reassessment omitted, duplicated or changed the original claim; original assessment retained.";
        continue;
      }
      const candidate = matches[0];
      const previous = claims[target.claimIndex];
      claims[target.claimIndex] = { ...candidate, claim: previous.claim, lineId: previous.lineId,
        previousAssessment: { status: previous.status, rationale: previous.rationale, citationIssues: previous.citationIssues, evidence: previous.evidence } };
      target.after = candidate.status;
      target.applied = true;
      target.reason = candidate.rationale || candidate.productionUse;
    }
    followUp.status = followUp.failedSearches ? "completed-with-search-failure" : "completed";
    return { sources: merged, followUp, checked: { ...checked, claims,
      headline: "Follow-up evidence requires editorial review",
      summary: "One bounded research round reassessed up to two unresolved claims. See the before/after trail and line-level evidence. The earlier narrative summary is withheld because evidence changed; no revised wording is automatically cleared for publication.",
      risks: [...new Set([...checked.risks, "Additional research does not guarantee the claim is settled. Review the cited sources and any remaining unverified claims."])],
      openQuestions: claims.filter((claim) => claim.status === "unverified").map((claim) => `What evidence would establish: ${claim.claim}`),
      audit: { ...checked.audit, sourceCount: merged.length,
        removedCitations: checked.audit.removedCitations + reassessed.audit.removedCitations,
        unknownSources: checked.audit.unknownSources + reassessed.audit.unknownSources,
        unmatchedExcerpts: checked.audit.unmatchedExcerpts + reassessed.audit.unmatchedExcerpts,
        downgradedClaims: checked.audit.downgradedClaims + reassessed.audit.downgradedClaims,
        passed: checked.audit.passed && reassessed.audit.passed,
        countingScope: "Cumulative checks across initial synthesis and follow-up; counters are not unique final claims.",
      },
    } };
  } catch {
    followUp.status = "reassessment-failed";
    followUp.note = "Additional evidence was retrieved but reassessment failed. The original checked ledger is retained; no status upgrades were applied.";
    return { checked, sources, followUp };
  }
}
