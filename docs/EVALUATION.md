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
