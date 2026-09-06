function isAfterCutoff(date, cutoffDate) {
  if (!date || !cutoffDate) return false;
  const parsed = new Date(date);
  const cutoff = new Date(`${cutoffDate}T23:59:59Z`);
  return Number.isFinite(parsed.valueOf()) && parsed > cutoff;
}

export function normalizeSources(groups, cutoffDate) {
  const byUrl = new Map();

  for (const group of groups) {
    for (const source of group) {
      if (!source.url || isAfterCutoff(source.publishDate, cutoffDate)) continue;
      const current = byUrl.get(source.url);
      if (current) {
        current.queryIds = [...new Set([...current.queryIds, source.queryId])];
        current.excerpts = [...new Set([...current.excerpts, ...source.excerpts])].slice(0, 4);
      } else {
        byUrl.set(source.url, {
          ...source,
          queryIds: [source.queryId],
        });
      }
    }
  }

  return [...byUrl.values()].slice(0, 18).map((source, index) => ({
    id: `s${index + 1}`,
    title: source.title,
    url: source.url,
    publishDate: source.publishDate,
    queryIds: source.queryIds,
    excerpts: source.excerpts,
  }));
}

export function enforceEvidence(synthesis, sources) {
  const byId = new Map(sources.map((source) => [source.id, source]));
  // Only whitespace is normalized: numbers, case, punctuation and negation must survive.
  const normalize = (text) => text.replace(/\s+/gu, " ").trim();
  let removedCitations = 0;
  let unknownSources = 0;
  let unmatchedExcerpts = 0;
  let downgradedClaims = 0;

  const claims = synthesis.claims.map((claim) => {
    const citationIssues = [];
    const evidence = claim.evidence.filter((item) => {
      const source = byId.get(item.sourceId);
      const quote = normalize(item.excerpt);
      const valid = Boolean(source && quote && source.excerpts?.some(
        (excerpt) => normalize(excerpt).includes(quote),
      ));
      if (!source) unknownSources += 1;
      else if (!valid) unmatchedExcerpts += 1;
      if (!valid) removedCitations += 1;
      if (!valid) citationIssues.push({ sourceId: item.sourceId, reason: !source ? "Unknown source ID" : "Quote is not a contiguous match in the retrieved excerpts" });
      return valid;
    });

    const needsReview = evidence.length !== claim.evidence.length || evidence.length === 0;
    if (needsReview || claim.status === "unverified") {
      if (claim.status !== "unverified") downgradedClaims += 1;
      return {
        ...claim, status: "unverified", confidence: "low", evidence, citationIssues,
        suggestedWording: null,
        rationale: needsReview ? "Insufficient matched evidence. The model's original explanation and proposed wording have been withheld for review." : claim.rationale,
        productionUse: "Do not present this claim as established fact. Check the original sources and obtain adequate evidence before using it in narration or a script.",
      };
    }
    return { ...claim, evidence, citationIssues,
      productionUse: claim.status === "contested"
        ? "Do not narrate this as a settled fact. Review the disagreement and original sources with an editor; any proposed wording still requires approval."
        : "Consider this claim for the edit only after checking the original sources and the model's interpretation. Matched quotations do not provide publication clearance.",
    };
  });

  const passed = removedCitations === 0 && downgradedClaims === 0;
  return {
    ...synthesis,
    ...(!passed ? {
      headline: "Evidence ledger requires editorial review",
      summary: `The citation check removed ${removedCitations} citation(s) and downgraded ${downgradedClaims} claim(s). The generated summary and production risks have been withheld because their supporting evidence changed. Review the labelled claims and original sources before publication.`,
      risks: ["The original synthesis relied on missing or mismatched evidence. Its narrative conclusions must not be treated as verified."],
      openQuestions: ["Can the unverified claims be established from the original sources or additional primary evidence?"],
    } : {}),
    claims,
    audit: {
      sourceCount: sources.length,
      claimCount: claims.length,
      removedCitations,
      unknownSources,
      unmatchedExcerpts,
      downgradedClaims,
      passed,
      scope: "Source IDs and quoted text checked against retrieved excerpts. This does not verify claim meaning, source accuracy or publication clearance.",
    },
  };
}
