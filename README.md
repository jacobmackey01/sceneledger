# SceneLedger

SceneLedger is a source-first research desk for documentary, scripted and editorial teams. It turns a production brief into an evidence ledger: factual claims are marked supported, contested or unverified; every accepted citation must resolve to a source returned by Parallel Search; and unresolved questions remain visible instead of being smoothed over.

Built for the **Parallel track** of Google Cloud's Agentic Cinema hackathon.

**Live application:** https://sceneledger-1021005568486.europe-west1.run.app

## Product loop

1. Gemini 3.8 Flash converts the production brief into concrete research questions.
2. The Parallel Search API retrieves current, traceable web evidence for each question.
3. Gemini synthesizes an evidence-bounded claim ledger for the production team.
4. Deterministic application code rejects unknown source IDs and quotations absent from the retrieved excerpts. Affected claims become unverified, their production advice is replaced, and narrative conclusions are withheld for review.

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

## Evidence boundary

SceneLedger is a production-research aid. It does not replace editorial judgment, legal review, source consent or primary-document verification. Search excerpts are leads and supporting evidence, not automatic permission to publish a claim.

The citation check matches source IDs and contiguous quoted text, ignoring whitespace differences only. A match does not prove that a quote supports the model's interpretation or that the source is accurate. Claim statuses remain model assessments. The cutoff filters publication metadata, not archived page versions; undated sources are retained and labelled.

## Licence

MIT — see [LICENSE](LICENSE).
