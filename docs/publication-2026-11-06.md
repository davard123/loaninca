# November 6 approved publication

Integrated on November 7 UTC (November 6 in Los Angeles), from remote main 6627ded4ab22265c721f3d876bab16c7fa8dda42.

## Scope and baseline
- Six existing HTML pages: loan finder; questions; Loan Estimate comparison; glossary; refinance guide; first-time buyer guide.
- Existing canonical URLs, titles, business links, consent wording, payload fields and API destination retained. Existing FAQPage answers updated only for PMI and APR.
- Questionnaire git blob adffc488a627ccbebeaed59d6fd131ac8ef9af20 exactly matches the archive baseline. Windows checkout CRLF caused the archive byte checker to say UNKNOWN_STOP; complete normalized text equality was independently asserted before integration. No unknown source was overwritten.
- Questionnaire lifecycle tests use the actual current inline script. Historical baseline/prior-income scripts are fixtures only.

## Verification
- node --test tests/*.test.mjs: 45 tests passed before adding five content assertions; final count recorded by the same command at publication.
- node scripts/validate-site.mjs: passed. git diff --check: passed.
- Six-page canonical, unique ID, JSON-LD, inline JS syntax, short-answer/schema equality and retained worksheet checks: passed.
- Official source reads: CFPB PMI removal, Fannie Mae B-8.1-04, CFPB mortgage interest rate versus APR, CFPB fixed versus adjustable mortgage, CFPB Loan Estimate explainer. Sources linked alongside the published copy. Fannie current-value scope and 75%/80% thresholds checked against its current guide.

## Actual Chrome browser QA
Executed using a localhost-only server serving these files. It rejected all server writes, blocked outbound connections with CSP, and replaced fetch and clipboard in the local document only. No harness code is in production files. Only synthetic LOCAL QA TEST and test@example.invalid contact text was used; no production lead or notification was generated.
- Empty questionnaire did not reveal a result.
- Native radio clicks generated the normal path; copying counted one mock clipboard operation.
- Changing income to no current income/job change disabled old-result copy and contact actions and displayed a stale-answer warning. Regeneration produced only manual review guidance.
- Mock clipboard rejection displayed a failure message, not a copied label.
- Native required consent blocked submission until checked with Space.
- First mock submission captured the no-income summary and contact values before disabling controls. In-flight income change to W2 kept that payload unchanged, showed the pending-old-summary explanation, disabled generation/copy/submit, and repeated clicks did not create a second mock request.
- Mock network rejection restored controls, displayed uncertain-result guidance, and did not retry. Because answers had changed, submit remained disabled.
- Explicit regeneration used W2, preserved contact text, cleared consent. After fresh consent, second mock submission contained the W2 summary. Mock success reset contact data and kept submit disabled; repeat click left request count at two.
- Back navigation and refresh made no automatic submission. Reload initialized zero mock requests and no result.
- Mobile viewport 390x844 (375px content width with scrollbar): manual-review result, PMI expanded answer and APR module visually inspected. Questions and article scrollWidth equaled clientWidth. Native Space expanded PMI details with visible focus, and both new content anchors were reachable. Viewport reset afterwards.

## Limits
- Clipboard success/failure used a mock, not operating-system clipboard permission testing. No real API delivery or email/SMS delivery test was performed. No physical phone or screen-reader session, cross-tab deduplication or full WCAG audit.
- Existing single-page request guard is not server idempotency. Refresh/another tab/manual retry after an uncertain response can still duplicate a consultation. A request that never settles remains pending. The UI tells the visitor to check receipt before retrying.
- No package/build manifest exists for the static front end. Existing Node tests and the repository site validator are the applicable automated checks, not an iOS build.
- Local Wrangler project-list request failed with OAuth error 10000/missing Pages scope. It was not retried or expanded. GitHub already showed both Cloudflare Pages projects successfully linked to the base main commit; authorized publication uses that existing Git integration.
