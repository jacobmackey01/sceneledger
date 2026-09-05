# Title

SceneLedger

## One-line Summary

A source-first production research agent that turns a film or media brief into an auditable claim ledger using Gemini 3.8 Flash and Parallel Search.

## Problem

Film, documentary and editorial teams often move from research to script under severe time pressure. A plausible sentence can become narration before the team has established where it came from, whether sources agree, or how confidently it can be stated. Conventional search leaves producers to reconcile pages manually; generic chat tools tend to hide uncertainty inside a fluent answer.

## Solution

SceneLedger converts a production brief into a structured research run. Gemini 3.8 Flash identifies the factual dependencies, Parallel Search retrieves web evidence for each question, and Gemini synthesizes a claim ledger for the production team. Deterministic code checks source IDs and matches quoted text against retrieved excerpts. Any rejected citation makes the affected claim unverified, replaces its production advice and withholds the original narrative conclusions for review.

The result is organized around production decisions: supported, contested and unverified claims; short evidence excerpts; source links; production-use notes; risks; and open questions. The interface also exposes the completed workflow and citation-audit status instead of presenting the output as an unqualified answer.

## Why This Matters

Research quality is not just an academic concern in screen production. Weak provenance can create editorial corrections, reputational damage, clearance problems and avoidable legal review. SceneLedger gives small teams a practical evidence boundary: it helps them decide what can be said now, what needs more research, and which lines should remain cautious.

## How We Used AI

Gemini 3.8 Flash runs on Google Cloud Agent Platform through the official `@google/genai` SDK with Vertex AI authentication. It performs two bounded tasks:

1. Planning: decompose a production brief into three or four concrete factual questions.
2. Synthesis: produce an evidence ledger using only the source bundle returned by Parallel.

Parallel's official `parallel-web` SDK performs the live retrieval step. Each planned question generates a runtime `client.search(...)` call. Results are deduplicated, filtered against the user's information cutoff and assigned internal source IDs before Gemini sees them.

Ordinary code enforces this limited quotation boundary. Matching text does not establish that a quotation supports the model's interpretation. No non-Google AI model, API or agent framework is called by the application.

## How We Used Codex

Codex helped turn the hackathon rules into an implementation boundary, designed the four-stage workflow, built the Node.js application and wrote the automated tests and deployment documentation. It also ran live browser checks against the local and Cloud Run versions. That testing found a real CSS state bug: the layout rules overrode the HTML `hidden` attribute, leaving empty and loading panels visible beside the final ledger. Codex corrected the rule and repeated the clicked end-to-end test before release.

Codex was a development tool only. It is not called by the deployed application.

## Findings and Learnings

The first citation check validated source IDs but could accept a fabricated quotation attached to a real ID. Regression tests now reproduce that failure and require the quote to occur in the retrieved source text. Another test found that downgrading a claim could leave unsafe narration advice and a confident summary intact. An intervention now replaces those outputs with explicit review instructions.

The live verification on 5 September 2026 returned five claims and 18 sources. The revised check rejected one citation and downgraded one claim. That is a visible review outcome, not a factual-accuracy score. Separating quotation matching from semantic interpretation proved important both in the interface and in the demonstration script.

## Key Features

- Production-specific briefs for documentary, scripted, branded and newsroom work
- Optional information cutoff applied before evidence reaches synthesis
- Gemini-generated research planning rather than a single undifferentiated prompt
- Parallel Search called at runtime for every research question
- Supported, contested and unverified claim states
- Deterministic rejection of invented source IDs and mismatched quotations
- Automatic downgrading of unsupported claims
- Source roll with direct links and publication dates when available
- Production risks, unresolved questions and concrete production-use notes
- Responsive, keyboard-accessible interface with reduced-motion support
- Server-driven progress updates and a health endpoint that reports configuration presence without exposing credentials

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
4. Wait for the workflow to finish. The final code check can be too quick to hold visibly on screen.
5. Inspect the actual badge: **Source IDs & quotes matched** or **Citation check: review needed**. A review outcome is expected when a quotation fails. Neither badge verifies semantic truth.
6. Open any link in the source roll and compare it with the corresponding source ID in the claim ledger.

### Repository test

```bash
npm install
npm test
```

The automated suite checks source filtering, quotation fidelity, narrative withdrawal, local startup configuration, progress ordering, streaming and HTTP failure/rate-limit handling using deterministic provider doubles. See `docs/EVALUATION.md` and `docs/VERIFICATION.md` for coverage and live evidence.

## Public Demo Link

https://sceneledger-1021005568486.europe-west1.run.app

## Public Repository Link

https://github.com/jacobmackey01/sceneledger

## Demo Video

Record an actual live demonstration using `outputs/SceneLedger_Recording_Guide_Checked.pptx`. Slides 3–9 provide narration and click instructions. The existing `outputs/sceneledger-demo.mp4` is a 40-second screenshot montage, not the finished functioning-app demonstration.

TODO: Record the app with English narration, keep the final cut below three minutes, upload publicly to YouTube or Vimeo and add the URL here.

## Screenshot Shot List

1. `docs/screenshots/reviewed-home.jpg` — product proposition and research desk
2. `docs/screenshots/reviewed-result.jpg` — completed run and citation-check intervention
3. `docs/screenshots/reviewed-claims.jpg` — model-assessed claim statuses and cautious advice
4. `docs/screenshots/reviewed-risks.jpg` — risks, open questions and source links

## Submission Readiness Notes

- Public application: deployed and verified
- Public repository: available with MIT license at repository root
- Google Cloud runtime: verified with Gemini 3.8 Flash
- Parallel runtime: verified with live Search API calls
- Browser QA: live workflow, form validation, source navigation and responsive layout checked on 5 September 2026; details in `docs/VERIFICATION.md`
- Public-demo protection: three runs per visitor per 15 minutes, two concurrent runs per instance, one maximum Cloud Run instance
- GitHub CI: check the latest release run; local tests pass
- Devpost draft project: https://devpost.com/software/sceneledger-4asryb
- Devpost thumbnail: previously uploaded; current processing status not verified
- Billing safeguards: app request limits and one maximum Cloud Run instance reduce exposure but do not cap the total bill. Previously reported budget/spend settings are not a verified all-services spending limit.
- Remaining material asset: record and upload the actual live demonstration, then finish the personal form fields and final Devpost review

## Known Limitations

- Search excerpts and model synthesis can vary between runs.
- The citation check matches quoted text and source IDs, not semantic entailment or source accuracy. Claim statuses remain model assessments.
- Sources without a machine-readable publication date are retained and labeled as undated.
- A complete live run can take several minutes because multiple searches execute before synthesis.
- The public demo intentionally rate-limits repeated research runs to protect the sponsor credits and the project owner’s billing account.
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
