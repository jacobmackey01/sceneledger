# SceneLedger evaluation protocol

Status: one preliminary live model comparison completed on 6 September 2026; independent human review remains pending. No general accuracy percentage is claimed. See [results and limitations](../docs/EVALUATION.md) and [the full original run](results/2026-09-06-provisional.json). It found no measured acceptance/rejection benefit from the guard on these simple probes.

The question is narrow: does the citation guard reduce acceptance of unsupported narration while retaining supported claims, when applied to exactly the same model output and source excerpts? The unchecked arm is the raw synthesis, not a separately prompted model. This isolates the deterministic guard; it does not evaluate retrieval or compare SceneLedger with another product.

## Review set

`dataset.js` contains 24 atomic narration probes, grouped into four frozen NASA source excerpts inspected on 6 September 2026. Each group has two provisionally supported, two contradicted and two insufficient-evidence probes. Cases within a group are correlated. The set deliberately includes number swaps, negation and unjustified certainty; it is not representative of documentary production or a statistically independent sample.

Source URLs are embedded beside each excerpt. Labels and reasons were authored by Codex and remain provisional. A label means support in the frozen excerpt, not truth in the world. Do not give the proposed labels or model output to an independent reviewer before they annotate the claim/excerpt pairs. Reviewers should use `supported`, `contradicted` or `insufficient`, enter their name and review date, and resolve disagreements explicitly. Never fill reviewer fields with invented people or dates.

## Commands

All output paths must be new; files are not overwritten. Create the output directory first if needed.

```powershell
node eval/run.js --out=work/evaluation-input.json
node eval/run.js --review-template --out=work/reviews.json
# After genuine independent review, enter its labels and provenance in reviews.json:
node eval/run.js --live --reviews=work/reviews.json --out=work/evaluation-run.json
# Optional preliminary run without human review; labelled provisional:
node eval/run.js --live --provisional --out=work/evaluation-provisional.json
```

Only `--live` contacts Gemini. It makes four sequential synthesis calls using the existing configured Google model and ADC; there are no Parallel calls. Provider SDK retries may add network attempts. Per-group checkpoints preserve outputs if a later call fails. A successful run writes `*.complete.json`; the initial file remains a run-start manifest, not evidence of completion. Keep run outputs private until reviewed for accidental disclosure.

## Measures

- False acceptance: unsupported probes returned as supported / all contradicted or insufficient probes (16 in the starter set).
- False rejection: supported probes not returned as exactly one supported assessment / all supported probes (8).
- Useful coverage: correctly accepted supported probes / all 24 probes.
- Output coverage: probes with exactly one mapped assessment / all 24. Missing and duplicate mappings remain in denominators.
- Scoring follows the model's line-ID mapping, not an independent semantic comparison of the returned claim text. Reviewers must inspect returned claims for meaning changes before trusting counts; a corrected or substituted claim can otherwise mask a failure. Original and returned claim text are included in new score outputs for that review.
- Runtime: per-group wall time including synthesis and guard. Model token usage is reported if available; missing metadata and monetary cost remain null, never zero by assumption.

Retain every raw and checked output, source-bundle hash, model ID, commit, dirty-worktree flag, timing and per-case errors. Do not selectively drop poor runs. Publish both false-acceptance and false-rejection counts, failures and label provenance. A later independent test set is needed before generalising.

To replay the original raw outputs against the current citation guard without paid calls:

```powershell
node eval/replay.js eval/results/2026-09-06-provisional.json work/guard-replay.json
```

The replay rejects a changed dataset hash. It tests only the current deterministic guard, not a newer prompt or a fresh model response. Its labels remain provisional.

## Known failure, deliberately tested

An exact quotation can accompany a claim that says the opposite. The guard will accept the quotation and can leave the model's incorrect supported status unchanged. `test/evaluation.test.js` preserves this limitation as a test. Quote fidelity is not semantic entailment or publication clearance. This evaluation is not ready to support a real-world accuracy claim until reviewed labels and a completed model run exist.
