# Billora local verification evidence

Verified on 28 October 2026 against the local production build for this change. Hosted deployment and release verification were skipped at the user's request.

Environment: Node.js 24.19.0, npm 11.9.0 and Chromium 154.0.8037.57 on Linux. Browser tests used `http://127.0.0.1:3102`, a strict preview port and one worker.

| Check                                                                 | Result                                                                                |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `npm run lint`                                                        | Passed with warnings denied.                                                          |
| `npm run format:check`                                                | Passed.                                                                               |
| `npm run build`                                                       | Passed: legal-page generation, TypeScript, Vite production output and PWA generation. |
| `BILLORA_TEST_PORT=3102 npm test -- --workers=1 --reporter=line,json` | 23 passed, 0 failed, 0 skipped, 0 flaky; 3 minutes 49.6 seconds.                      |
| `git diff --check`                                                    | Passed.                                                                               |

The build reports large JavaScript chunks and an ineffective dynamic import because `fflate` is also statically imported. These warnings remain; this run does not claim a bundle-size or performance improvement.

## What the tests prove

The five tests in [launch.spec.ts](../tests/launch.spec.ts) exercise the new journey and recovery controls:

- Two actual text PDFs are imported and reviewed through the UI. A consecutive-month comparison creates a query whose downloaded ZIP contains byte-identical current and previous originals plus the comparison figures. The ZIP is prepared offline.
- Removing a library statement preserves its original while a query references it. A simulated metadata-save failure leaves the library record and original intact. A complete backup and confirmed restore preserve both PDFs and the query comparison. Removing expected evidence blocks request-pack export with an error.
- Replacing a PDF clears previous figures and review confirmation; editing a figure requires review again. An invalid PDF leaves manual entry available, and category totals cannot exceed the bill total.
- Unreadable saved records remain unchanged while edits are paused and can be downloaded exactly. A simulated restore commit failure rolls back the exact previous localStorage string and all existing original/evidence files, including unreferenced files. A confirmed retry succeeds. Invalid backup records are rejected before replacement.
- Help opens directly at `/?help=1`, fits the tested 320/768/1024/1440-pixel widths, supports keyboard access to data controls and passes the selected Axe WCAG A/AA rules.

The other 18 tests cover encrypted archive round trips and tampering/wrong-password failures; full encrypted UI restore; sample/personal separation; reviewed suggestions and category alerts; original/evidence backup; property/PDF/reminder/payment-note persistence; settings, keyboard search and onboarding; offline reload and legal pages; map search/geolocation consent; and offline service-request preparation, export, follow-up and deletion. Map search and geolocation tests use controlled fixtures.

Existing screen and request checks cover 320/390/768/1024/1440-pixel layouts. Axe scans cover the tested overview, settings, demo, map, request, Help and legal surfaces. These are automated checks of selected rules and states, not an accessibility certification or a substitute for device testing.

## Boundaries

No hosted site, deployment status, real municipal account, payment service or submission endpoint was checked. No request was sent on a resident's behalf. This run did not exercise real-device Safari/PWA installation or a scanned-document OCR recognition job. There is no claim of user-research outcomes, billing accuracy, dispute resolution, savings or municipal approval.

Billora remains a browser-local portfolio preview with labelled demo integrations. Operator details and final legal policies remain pending as described in the [legal launch checklist](LEGAL_LAUNCH_CHECKLIST.md). The [case study](CASE_STUDY.md) explains the product decisions and intended research next step.
