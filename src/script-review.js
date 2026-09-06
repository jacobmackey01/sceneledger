// Physical lines are author-controlled units; text and blank-line positions are retained.
export function scriptLines(script = "") {
  return script.split(/\r\n|\n|\r/u).flatMap((original, index) =>
    original.trim() ? [{ id: `l${index + 1}`, number: index + 1, original }] : []);
}

export function buildScriptReview(request, claims) {
  if (request.mode !== "script") return null;
  const lines = scriptLines(request.script).map((line) => {
    const assessments = claims.filter((claim) => claim.lineId === line.id);
    const status = !assessments.length ? "unassessed"
      : assessments.some((claim) => claim.status === "unverified") ? "unverified"
      : assessments.some((claim) => claim.status === "contested") ? "contested" : "supported";
    return { ...line, status, assessments, note: !assessments.length
      ? "No assessment returned for this line. Do not treat it as checked."
      : "Model assessment of extracted claims, not a guarantee that every factual assertion was identified. Proposed wording needs editorial review." };
  });
  const ids = new Set(lines.map((line) => line.id));
  return { originalScript: request.script, lines,
    unassignedClaims: claims.filter((claim) => !ids.has(claim.lineId)),
    assessedLines: lines.filter((line) => line.assessments.length).length };
}
