export function scoreCases(cases, claims, { provisional = false } = {}) {
  let positives = 0, negatives = 0, falseAcceptances = 0, falseRejections = 0, trueAcceptances = 0, covered = 0;
  const rows = cases.map((item) => {
    const label = provisional ? item.proposedLabel : item.review?.label;
    if (!["supported", "contradicted", "insufficient"].includes(label)) throw new Error(`Missing valid label: ${item.id}`);
    if (!provisional && (!item.review.reviewer?.trim() || !item.review.reviewedAt)) throw new Error(`Missing reviewer provenance: ${item.id}`);
    const matches = claims.filter((claim) => claim.lineId === item.lineId);
    // Each evaluation line is one atomic assertion. Missing/duplicate outputs are not silently excluded.
    const accepted = matches.length === 1 && matches[0].status === "supported";
    if (matches.length === 1) covered++;
    if (label === "supported") { positives++; if (accepted) trueAcceptances++; else falseRejections++; }
    else { negatives++; if (accepted) falseAcceptances++; }
    return { id: item.id, originalClaim: item.claim, returnedClaimTexts: matches.map((claim) => claim.claim), label, returnedClaims: matches.length, statuses: matches.map((claim) => claim.status), accepted,
      error: accepted && label !== "supported" ? "false-acceptance" : !accepted && label === "supported" ? "false-rejection" : null };
  });
  const ratio = (n, d) => ({ numerator: n, denominator: d, rate: d ? n / d : null });
  return { labelBasis: provisional ? "provisional assistant labels" : "reviewer-supplied labels",
    falseAcceptance: ratio(falseAcceptances, negatives), falseRejection: ratio(falseRejections, positives),
    usefulCoverage: ratio(trueAcceptances, cases.length), outputCoverage: ratio(covered, cases.length), rows };
}
