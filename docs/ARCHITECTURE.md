# SceneLedger architecture

## Decision

Use a deliberately small four-stage workflow rather than an open-ended chat agent.

```text
Production brief
    ↓
Gemini 3.8 Flash: research plan
    ↓
Parallel Search: source retrieval
    ↓
Gemini 3.8 Flash: bounded synthesis
    ↓
Application code: citation audit
    ↓
Evidence ledger
```

## Why this is agentic

The system decomposes a goal, issues multiple searches, incorporates tool results and checks its output against a deterministic policy. Each stage produces inspectable state. The final answer is not accepted merely because a model emitted it.

## Trust boundary

Only URLs returned by Parallel receive source IDs. The synthesis prompt may cite those IDs, but `enforceEvidence` removes any unknown citation and downgrades a supposedly supported claim when no valid evidence remains. A user-selected information cutoff is applied before synthesis.

## Deployment

One Node.js container serves the static product UI and API. Cloud Run supplies the Google service identity. Parallel credentials are injected from Secret Manager. The application makes no client-side provider calls and exposes no credentials to the browser.
