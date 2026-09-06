# SceneLedger architecture

## Decision

Use a bounded research workflow with an optional, single follow-up round.

```text
Production brief + optional original narration lines
    ↓
Gemini 3.8 Flash: research plan
    ↓
Parallel Search: source retrieval
    ↓
Gemini 3.8 Flash: bounded synthesis
    ↓
Application code: citation audit
    ↓
Checked ledger + preserved script lines
    ↓ (opt-in; only if claims remain unverified)
Up to two targeted Parallel searches → one Gemini reassessment → citation check
    ↓
Before/after trail + downloadable evidence pack
```

## Why this is agentic

The system decomposes a goal, issues multiple searches, incorporates tool results and checks its output against a deterministic policy. Each stage produces inspectable state. The final answer is not accepted merely because a model emitted it.

## Trust boundary

Only URLs returned by Parallel receive source IDs. `enforceEvidence` removes unknown references and quotes that are not contiguous matches in the retrieved excerpts. Any rejected citation downgrades its claim, even when another citation survives. Unverified claims receive no proposed wording. All production-use advice is deterministic and requires editorial review; a model cannot grant publication clearance through that field.

Script line numbers and original text come from application code, not model reconstruction. One line can contain multiple assessed claims. Omitted lines are unassessed, and unknown line mappings remain in an additional-claims section. A supported line status describes the returned extracted claims, not a guarantee that the model identified every assertion.

Follow-up retains existing source IDs and quotations, adds sources without replacing the first set (maximum 30 total), and requires an exact claim-text and ID match before replacing a target assessment. Other claims are retained. A failed follow-up leaves the initial checked ledger intact with a failure note. Changed evidence withdraws the earlier narrative summary. Audit counters are cumulative across attempts, not unique final claims.

The information cutoff filters publication metadata before both syntheses; undated sources remain labelled. Matching a quotation does not establish entailment or source accuracy. Downloads are generated in the browser from the completed response, not mutable form contents. No database or persistent run store is introduced.

## Deployment

One Node.js container serves the static product UI and API. Cloud Run supplies the Google service identity. Parallel credentials are injected from Secret Manager. The application makes no client-side provider calls and exposes no credentials to the browser.
