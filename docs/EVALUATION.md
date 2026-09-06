# Evaluation

## What must be true

1. Every displayed source URL came from the Parallel Search response.
2. A claim marked supported has at least one surviving source reference.
3. Sources dated after the selected cutoff are not sent to synthesis.
4. Duplicate URLs appear once in the source roll.
5. A failed provider call produces an honest error rather than a fabricated ledger.

## Automated coverage

Run `npm test`. The suite makes no paid provider calls. It covers the source-boundary cases above and additionally checks:

- Fabricated, altered and stitched quotations are rejected. Whitespace differences in contiguous quotations are accepted.
- A rejected citation downgrades the affected claim even if another citation survives. Contested claims without evidence also become unverified.
- After an intervention, the original headline, summary, risks and open questions are withheld and unsafe production advice is replaced.
- Progress follows actual stage boundaries and stops on provider failure or empty retrieval.
- The browser stream reader handles split JSON, multibyte text, service errors and interrupted connections.
- HTTP JSON and streaming success, invalid inputs, incomplete configuration, rate limits, failure responses and concurrency-slot release.
- Local `.env` loading without overriding deployment environment variables.
- Exact script-line preservation, blank-line positions, missing/duplicate/unknown mappings and bounded input validation.
- Withholding proposed wording and unsafe model-authored production clearance.
- Opt-in follow-up call limits, stable source IDs, original claim identity, no-new-evidence outcomes and provider-failure fallback.
- Evidence-pack contents and safe filenames; explicit evaluation denominators, label provenance checks and a known semantic failure case.

## Preliminary source-grounded evaluation: 6 September 2026

Four Gemini 3.8 Flash synthesis calls assessed 24 hand-selected narration probes against four frozen NASA excerpt bundles. Both arms use the same raw synthesis and sources; one arm applies the citation guard. Labels were authored by Codex and have not been independently human-reviewed.

| Measure | Without checks | With checks |
| --- | --- | --- |
| False acceptance / unsupported probes | 0 / 16 | 0 / 16 |
| False rejection / supported probes | 0 / 8 | 0 / 8 |
| Useful coverage: correctly accepted supported probes / all probes | 8 / 24 | 8 / 24 |
| Output coverage: one mapped assessment / all probes | 24 / 24 | 24 / 24 |

There was no measured guard benefit on this simple set. All citations already matched. These are binary acceptance measures, not three-way label accuracy, and correlated probes from four pages do not establish general accuracy. Do not present the result as “100% accurate.”

The four measured group runtimes were approximately 6.31, 7.80, 5.61 and 5.59 seconds. Gemini reported 3,438 input tokens and 4,123 output tokens (7,561 total). No Parallel searches were used. Monetary cost was not measured.

Qualitative inspection found two problems hidden by the acceptance counts: some supported claims received “clear for narration” advice, and one group used contested for a script assertion contradicted by a single source. The application now replaces all model-authored production-use advice with deterministic review requirements, and the prompt distinguishes source disagreement from a contradicted script. The saved run predates those changes. Replaying its raw outputs through the updated guard confirms the clearance wording is removed; no second paid model run was used to suggest the revised prompt is verified.

The complete original output, including failures in wording, is retained in [the provisional run](../eval/results/2026-09-06-provisional.json). It was produced from a dirty working tree before runtime-file hashes were added to the runner. Do not attribute it to the clean base commit alone. Subsequent runs record runtime-file hashes. See [the protocol](../eval/README.md) for independent review, reproducible commands and denominator definitions.

## Manual judging script

- Load the included independent-cinema example.
- Run the brief and observe server-driven progress. The final deterministic check may finish too quickly to hold on screen.
- Open one source from the final source roll.
- Read an actual claim status and its production advice. Different runs may produce different combinations of statuses.
- Show the actual badge (matched quotes or review needed) and runtime metadata. Neither badge independently verifies facts.
- Open the repository lines that call Gemini and Parallel.

## Limits

Search results and model synthesis can vary. A matching quote establishes its presence in a retrieved excerpt, not that it entails the claim or that the source is accurate. Cutoff filtering uses publication metadata, not historical page reconstruction. Human review of original sources and publication clearance is still required.

Passing mocked tests does not prove live provider availability. Deployment-specific checks are recorded separately in `docs/VERIFICATION.md` after verification.
