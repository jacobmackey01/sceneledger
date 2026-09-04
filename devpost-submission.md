# Title

SceneLedger

## One-line Summary

A source-first production research agent that turns a film or media brief into an auditable claim ledger using Gemini 3.8 Flash and Parallel Search.

## Problem

Film, documentary and editorial teams often move from research to script under severe time pressure. A plausible sentence can become narration before the team has established where it came from, whether sources agree, or how confidently it can be stated. Conventional search leaves producers to reconcile pages manually; generic chat tools tend to hide uncertainty inside a fluent answer.

## Solution

SceneLedger converts a production brief into a structured research run. Gemini 3.8 Flash identifies the factual dependencies, Parallel Search retrieves current web evidence for each question, and Gemini synthesizes a claim ledger for the production team. Deterministic application code then checks that every citation points to a source actually returned by Parallel. If a supposedly supported claim loses all valid evidence, SceneLedger automatically downgrades it to unverified.

The result is organized around production decisions: supported, contested and unverified claims; short evidence excerpts; source links; production-use notes; risks; and open questions. The interface also exposes the completed workflow and citation-audit status instead of presenting the output as an unqualified answer.

## Why This Matters

Research quality is not just an academic concern in screen production. Weak provenance can create editorial corrections, reputational damage, clearance problems and avoidable legal review. SceneLedger gives small teams a practical evidence boundary: it helps them decide what can be said now, what needs more research, and which lines should remain cautious.

## How We Used AI

Gemini 3.8 Flash runs on Google Cloud Agent Platform through the official `@google/genai` SDK with Vertex AI authentication. It performs two bounded tasks:

1. Planning: decompose a production brief into three or four concrete factual questions.
2. Synthesis: produce an evidence ledger using only the source bundle returned by Parallel.

Parallel's official `parallel-web` SDK performs the live retrieval step. Each planned question generates a runtime `client.search(...)` call. Results are deduplicated, filtered against the user's information cutoff and assigned internal source IDs before Gemini sees them.

Ordinary application code enforces the final trust boundary. Unknown source IDs are removed; claims with no surviving evidence cannot remain marked supported. No non-Google AI model, API or agent framework is used in the submitted runtime.

## How We Used Codex

Codex helped turn the hackathon rules into an implementation boundary, designed the four-stage workflow, built the Node.js application and wrote the automated tests and deployment documentation. It also ran live browser checks against the local and Cloud Run versions. That testing found a real CSS state bug: the layout rules overrode the HTML `hidden` attribute, leaving empty and loading panels visible beside the final ledger. Codex corrected the rule and repeated the clicked end-to-end test before release.

Codex was a development tool only. It is not called by the deployed application.

## Key Features

- Production-specific briefs for documentary, scripted, branded and newsroom work
- Optional information cutoff applied before evidence reaches synthesis
- Gemini-generated research planning rather than a single undifferentiated prompt
- Parallel Search called at runtime for every research question
- Supported, contested and unverified claim states
- Deterministic rejection of invented source IDs
- Automatic downgrading of unsupported claims
- Source roll with direct links and publication dates when available
- Production risks, unresolved questions and concrete production-use notes
- Responsive, keyboard-accessible interface with reduced-motion support
- Health endpoint that reports provider readiness without exposing credentials

## Architecture

```text
Production brief
    -> Gemini 3.8 Flash: research plan
    -> Parallel Search API: evidence retrieval
    -> Gemini 3.8 Flash: bounded synthesis
    -> deterministic citation audit
    -> production evidence ledger
```

One Node.js container serves the static interface and Express API on Cloud Run. Google credentials come from the Cloud Run service identity. The Parallel credential is stored in Google Secret Manager and injected at runtime. Cloud Build creates the container and Artifact Registry stores it. The service is configured with zero minimum instances and one maximum instance.

## Testing Instructions

### Public test

1. Open the public demo URL below.
2. Select **Load example**.
3. Select **Build evidence ledger**.
4. Wait for the four stages to finish. Live web retrieval can take one to three minutes.
5. Confirm that a completed ledger appears and that the badge reads **Citation audit passed**.
6. Open any link in the source roll and compare it with the corresponding source ID in the claim ledger.

### Repository test

```bash
npm install
npm test
```

The automated suite checks URL deduplication, information-cutoff filtering, invented-citation removal, claim downgrading and the complete orchestration contract using deterministic provider doubles.

## Public Demo Link

https://sceneledger-1021005568486.europe-west1.run.app

## Public Repository Link

https://github.com/jacobmackey01/sceneledger

## Demo Video

TODO: Add the public YouTube or Vimeo URL after recording the three-minute walkthrough in `docs/DEMO_SCRIPT.md`.

## Screenshot Shot List

1. `docs/screenshots/01-home.png` — product proposition and empty research desk
2. `docs/screenshots/02-result-summary.png` — completed run, headline and audit badge
3. `docs/screenshots/03-claim-ledger.png` — supported/contested/unverified evidence cards
4. `docs/screenshots/04-mobile.png` — responsive mobile layout

## Submission Readiness Notes

- Public application: deployed and verified
- Public repository: available with MIT license at repository root
- Google Cloud runtime: verified with Gemini 3.8 Flash
- Parallel runtime: verified with live Search API calls
- Browser QA: completed locally and against Cloud Run with no page or console errors
- Billing safeguards: £10 monthly alert budget and £15 monthly Vertex AI spend cap
- Remaining material asset: public three-minute demo video

## Known Limitations

- Search excerpts and model synthesis can vary between runs.
- The citation audit validates provenance and structural support, not the ultimate truth of every source.
- Sources without a machine-readable publication date are retained and labeled as undated.
- A complete live run can take several minutes because multiple searches execute before synthesis.
- SceneLedger does not replace primary-document checks, editorial judgment, source consent or legal review.

## TODO Official Form Fields

- Submitter Type: Individual
- Organization name: N/A
- Government employee: TODO — participant confirmation required
- Country of residence: TODO — participant confirmation required
- Canadian province: N/A unless participant confirms Canadian residence
- Project status before 27 July 2026: New
- Partner track: Parallel
- Team size: 1
- Open-source repository: https://github.com/jacobmackey01/sceneledger
- Hosted project: https://sceneledger-1021005568486.europe-west1.run.app
- Google Cloud products: Gemini 3.8 Flash, Google Cloud Agent Platform / Vertex AI, Cloud Run, Secret Manager, Cloud Build, Artifact Registry and Cloud Billing
- Other tools/products: Parallel Search API, `parallel-web`, Node.js, Express and Zod
- First time using IBM tools: N/A, not submitting to IBM
- First time using Grafana tools: N/A, not submitting to Grafana
- First time using Parallel tools: Yes
- First time using ClickHouse tools: N/A, not submitting to ClickHouse
- First time using Replit tools: N/A, not submitting to Replit
- Demo video URL: TODO
