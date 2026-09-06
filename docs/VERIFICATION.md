# Verification record

## Local upgrade checked 6 September 2026

The script-review, export and opt-in follow-up upgrade is not yet deployed. The 5 September deployment record below describes the previous release, not these changes.

- Automated suite: 36 tests pass, including the original regression tests and new script mapping, evaluation scoring, export, Unicode input, follow-up budget/identity and publication-advice tests. No paid calls in the test suite.
- Local browser QA used `node test/preview.js`, a loopback-only server with visibly labelled synthetic providers. It is excluded from the Docker runtime. Browser success does not prove live retrieval accuracy.
- Empty required fields and a 21-line script were rejected without research. Switching to brief mode cleared script-only validation and allowed a run.
- Load example, script mode, optional follow-up, disabled submit while running, and completed line review were exercised. Blank-line numbering and original leading spaces survived into the displayed result and export.
- The follow-up result displayed its target, initial/final status and call counts. Source-ID links navigated to the correct source roll row.
- Both download buttons produced actual `.txt` and `.json` files in Downloads. Their contents were read back and checked for original input, source excerpts, scope notes and provider metadata. The browser download-event waiter timed out even though the files were successfully saved; filesystem read-back established the outcome.
- The result layout was inspected at 390px width: document width 375px inside a 390px viewport, with no page-level horizontal overflow. The temporary viewport override was reset.
- No warning/error console entries were captured. Observed browser progress included planning and completion; automated tests verify stage ordering.
- Four real Gemini synthesis calls ran the provisional frozen-source evaluation; no Parallel calls. See `docs/EVALUATION.md` and `eval/results/2026-09-06-provisional.json`. The output exposed overconfident production-use wording, subsequently replaced by a deterministic review requirement and covered by tests. An offline replay confirmed replacement without another paid model run.

Outstanding: independent label review; live end-to-end verification of the upgraded workflow after release; updated recording-guide screenshots once the deployed interface changes. The existing PowerPoint still describes the previous deployed interface. No Devpost submission was performed during this upgrade.

## Previous deployed release

Checked 5 September 2026. This is a point-in-time result, not an availability guarantee.

## Code and automated tests

`node --test test/*.test.js` passed 20 tests. Coverage includes the review regressions, environment loading, workflow progress, browser stream parsing and HTTP failure handling. These tests use provider doubles and do not measure model accuracy.

## Deployed run

- Service: `sceneledger`, project `peppy-answer-391323`, region `europe-west1`.
- Revision: `sceneledger-00004-h86`, serving 100% of traffic after deployment.
- One live research run used the included independent-cinema brief and a cutoff of 2026-09-05.
- Cloud Run request log: `2026-09-05T08:28:17.231411Z`, HTTP 200, latency 14.601969283 seconds, revision `sceneledger-00004-h86`.
- The browser rendered five claims and 18 sources. One citation was removed and one claim downgraded. The original summary was withheld and the affected advice required additional evidence.
- Runtime footer reported `gemini-3.8-flash` and `Parallel Search API`. A configuration-only health check was not used as proof of the provider run.

## Browser checks

The in-app browser was used because Chrome was not connected to the session.

- Empty-form submission displayed native validation and did not start research.
- The format selector worked and Load example reset the form to the documentary example.
- Clicking Build evidence ledger disabled the button and displayed planning; the completed result replaced loading and empty states.
- The source-ID link navigated to and highlighted its source-roll row. Its source-title link opened the original Parliament evidence page in a new tab.
- No warning/error console entries were captured during the run.
- Desktop and narrow-layout checks were performed without a second paid run. No claim is made that every external source is permanently accessible.

Server stage ordering and streamed transitions are covered by automated tests. The live browser observation captured planning and completion, not a screenshot of every intermediate stage.

## Remaining boundaries

The demo video still needs to be recorded and uploaded. Devpost remains a draft with no video URL or final submission timestamp. Previously reported monetary budget settings have not been revalidated as a fixed bill cap; request limits do not provide one. Quotation matching does not verify source truth or the model's interpretation.
