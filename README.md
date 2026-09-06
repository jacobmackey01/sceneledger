# SceneLedger

SceneLedger is a source-first research desk for documentary, scripted and editorial teams. It reviews a production brief or draft narration against retrieved evidence. Original script lines stay visible beside model assessments, source quotations, unresolved questions and proposed wording that requires editorial review.

Built for the **Parallel track** of Google Cloud's Agentic Cinema hackathon.

**Live application:** https://sceneledger-1021005568486.europe-west1.run.app

Upgrade deployed, 7 September 2026 (Europe/London): script review, exports and optional bounded follow-up are live. Runtime commit `be6b4f9` is deployed as Cloud Run revision `sceneledger-00005-79z`. A live narration run and both downloads were verified; see [the release record](docs/VERIFICATION.md). The existing recording guide still depicts the previous interface and needs refreshed screenshots before recording.

## Product loop

1. Gemini 3.8 Flash converts the production brief into concrete research questions.
2. The Parallel Search API retrieves current, traceable web evidence for each question.
3. Gemini synthesizes an evidence-bounded claim ledger for the production team.
4. Deterministic application code rejects unknown source IDs and quotations absent from the retrieved excerpts. Affected claims become unverified, their production advice is replaced, and narrative conclusions are withheld for review.
5. In script mode, the application maps assessments back to the original physical lines. Missing assessments and unknown line mappings stay visible; proposed clauses do not replace the original text.
6. If the user opts in, one follow-up round searches up to two unresolved claims and reassesses only those claims against additional evidence. A visible before/after trail records changes or failure. There is no recursive research loop.
7. Download the completed run as a plain-text production evidence pack or complete JSON, including the original request, source excerpts, cutoff caveat, audit and runtime metadata.

This division is intentional: the model performs planning and synthesis, Parallel performs retrieval, and ordinary code enforces the citation boundary.

## Runtime evidence

The submitted runtime imports and calls both required services:

- Google Cloud: `@google/genai`, configured with `vertexai: true` and `gemini-3.8-flash`
- Partner: `parallel-web`, calling `client.search(...)` during every research run

No non-Google AI model or agent API is used by the application.

## Run locally

Requirements:

- Node.js 22 or newer
- A Google Cloud project with billing and the Vertex AI / Agent Platform API enabled
- Google Application Default Credentials
- A Parallel API key

```powershell
npm ci
copy .env.example .env
```

On macOS/Linux, use `cp .env.example .env`. Set `GOOGLE_CLOUD_PROJECT` and `PARALLEL_API_KEY` in `.env`. The application loads this file automatically without overriding existing environment variables. Authenticate Google Application Default Credentials (a normal `gcloud auth login` alone is not sufficient), then start:

```bash
gcloud auth application-default login
npm start
```

Open `http://localhost:8080`. The `/api/health` endpoint checks configuration presence without exposing secrets; it does not test provider connectivity. Progress is streamed from actual server stage transitions, not estimated timers.

## Test

```bash
npm test
```

The tests cover quotation fidelity, citation rejection, narrative withdrawal, source filtering, local environment loading, stage ordering, streamed responses, provider failures and HTTP rate limits using deterministic service doubles. They make no paid provider calls. See [evaluation](docs/EVALUATION.md) for the verification boundary.

For a no-cost browser QA preview, run `node test/preview.js` and open `http://127.0.0.1:8081`. It uses visibly labelled synthetic fixtures, never live research. This entry point is not copied into the production image.

The [evaluation protocol](eval/README.md) includes 24 provisional source-grounded narration probes and a frozen-output comparison with and without citation checks. The first live run found no acceptance/rejection difference on these simple probes. Independent label review is pending; this is not a validated real-world accuracy benchmark.

## Deploy to Cloud Run

The repository includes a production Dockerfile. Deploy with the Parallel key stored in Secret Manager and Google credentials supplied by the Cloud Run service identity—never bake credentials into the image.

Recommended safeguards:

- maximum instance count: 1
- minimum instance count: 0
- at most two concurrent research runs per instance
- three research runs per visitor per 15-minute window
- request concurrency appropriate for the Parallel quota
- billing alerts and service-specific quotas or spending controls where available
- delete or disable the deployed service after judging

These controls do not establish a fixed total bill. Visitor limits are in-memory and reset on restart; multiple visitors can still create paid requests. Budget alerts are notifications, not a shutdown mechanism. Parallel billing and other Google Cloud services must be considered separately.

Each run makes two Gemini method calls and up to five initial Parallel searches. Optional follow-up adds at most two searches and one Gemini call. SDK retries may add network attempts. Follow-up is disabled by default. Token usage is reported when provided by Gemini; monetary cost is not inferred from missing metadata.

## Evidence boundary

SceneLedger is a production-research aid. It does not replace editorial judgment, legal review, source consent or primary-document verification. Search excerpts are leads and supporting evidence, not automatic permission to publish a claim.

The citation check matches source IDs and contiguous quoted text, ignoring whitespace differences only. A match does not prove that a quote supports the model's interpretation or that the source is accurate. Claim statuses remain model assessments. The cutoff filters publication metadata, not archived page versions; undated sources are retained and labelled.

## Licence

MIT — see [LICENSE](LICENSE).
