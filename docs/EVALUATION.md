# Evaluation plan

## What must be true

1. Every displayed source URL came from the Parallel Search response.
2. A claim marked supported has at least one surviving source reference.
3. Sources dated after the selected cutoff are not sent to synthesis.
4. Duplicate URLs appear once in the source roll.
5. A failed provider call produces an honest error rather than a fabricated ledger.

## Automated coverage

`npm test` currently checks items 1–4 with deterministic service doubles. The deployed smoke test will cover item 5 and confirm that both live provider calls appear in runtime logs.

## Manual judging script

- Load the included independent-cinema example.
- Run the brief and show the four progress stages.
- Open one source from the final source roll.
- Point out a cautious or unverified claim.
- Show the audit badge and runtime metadata.
- Open the repository lines that call Gemini and Parallel.

## Limits

Search results and model synthesis can vary between runs. The citation audit checks provenance and structural support; it does not independently establish that every source is correct or that publication is legally safe.
