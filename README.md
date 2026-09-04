# SceneLedger

SceneLedger is a source-first research desk for documentary, scripted and editorial teams. It turns a production brief into an evidence ledger: factual claims are marked supported, contested or unverified; every accepted citation must resolve to a source returned by Parallel Search; and unresolved questions remain visible instead of being smoothed over.

Built for the **Parallel track** of Google Cloud's Agentic Cinema hackathon.

**Live application:** https://sceneledger-1021005568486.europe-west1.run.app

## Product loop

1. Gemini 3.8 Flash converts the production brief into concrete research questions.
2. The Parallel Search API retrieves current, traceable web evidence for each question.
3. Gemini synthesizes an evidence-bounded claim ledger for the production team.
4. Deterministic application code rejects unknown source IDs and downgrades unsupported claims.

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

```bash
npm install
copy .env.example .env
```

Set `GOOGLE_CLOUD_PROJECT` and `PARALLEL_API_KEY`, authenticate Google ADC, then run:

```bash
npm start
```

Open `http://localhost:8080`. The `/api/health` endpoint reports configuration readiness without exposing secrets.

## Test

```bash
npm test
```

The tests exercise URL deduplication, information-cutoff enforcement, invented-citation removal, claim downgrading and the full orchestration contract with deterministic service doubles.

## Deploy to Cloud Run

The repository includes a production Dockerfile. Deploy with the Parallel key stored in Secret Manager and Google credentials supplied by the Cloud Run service identity—never bake credentials into the image.

Recommended safeguards:

- maximum instance count: 1
- minimum instance count: 0
- at most two concurrent research runs per instance
- three research runs per visitor per 15-minute window
- request concurrency appropriate for the Parallel quota
- a Google Cloud budget and a Vertex AI spend cap
- delete or disable the deployed service after judging

## Evidence boundary

SceneLedger is a production-research aid. It does not replace editorial judgment, legal review, source consent or primary-document verification. Search excerpts are leads and supporting evidence, not automatic permission to publish a claim.

## Licence

MIT — see [LICENSE](LICENSE).
