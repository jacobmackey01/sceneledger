# Verification record

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
