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
  const allowed = new Set(sources.map((source) => source.id));
  let removedCitations = 0;
  let downgradedClaims = 0;

  const claims = synthesis.claims.map((claim) => {
    const evidence = claim.evidence.filter((item) => {
      const valid = allowed.has(item.sourceId);
      if (!valid) removedCitations += 1;
      return valid;
    });

    if (claim.status === "supported" && evidence.length === 0) {
      downgradedClaims += 1;
      return { ...claim, status: "unverified", confidence: "low", evidence };
    }
    return { ...claim, evidence };
  });

  return {
    ...synthesis,
    claims,
    audit: {
      sourceCount: sources.length,
      claimCount: claims.length,
      removedCitations,
      downgradedClaims,
      passed: removedCitations === 0 && downgradedClaims === 0,
    },
  };
}
