# Billora legal publication notes

The legal hub at `/legal/` contains six policy drafts for the current browser-local preview. The content describes the inspected implementation, not a planned cloud service. These documents do not certify compliance. They are marked as drafts because the operator and operational details below have not been supplied or verified.

## Information needed from the operator

- Full legal operating name, business form/registration details where applicable, and physical/contact address.
- Monitored privacy and support email addresses, the responsible Information Officer and appropriate request-handling contacts.
- Information Officer registration and the operator-specific PAIA section 51 manual/access procedure, as applicable. The POPIA rights guide is not that manual.
- Confirmed hosting/access providers and their roles, technical-data inventory, log and backup retention, processing locations, contractual terms and any cross-border safeguards.
- Purpose-by-purpose lawful processing grounds; any support correspondence or additional data practices outside the inspected app code.
- An implemented process for access/correction/deletion/objection requests, proportionate verification, statutory response requirements and security-compromise handling.
- Operator-specific legal review, final terms, effective date and a process for notice/version changes before production launch.

There are no invented email addresses, registration numbers, data-residency guarantees, retention periods or compliance badges in the policy pages. Do not remove the visible draft status until the required details and processes are confirmed. Publish any real contact details consistently across the policies and product.

## Scope verified against source

- `src/App.tsx`: metadata/settings in localStorage; account JSON export; workspace reset clears properties, statements and original PDFs, while preferences and demo state remain.
- `src/lib/documents.ts`: original PDFs in the `billora-documents` IndexedDB database, `originals` store; PDF text extraction runs in a local worker and examines at most 20 pages.
- `src/lib/demo.ts` and `src/components/DemoConnections.tsx`: local demo profile/authorisation timestamps, fixed sync fixtures, separate reset; no real provider account or permissions.
- `src/components/DetailDialogs.tsx`: statement deletion, original downloads, personal payment notes, official payment links and unsubmitted query drafts.
- `vite.config.ts`: public app-shell/asset precache. No statement-upload endpoint, analytics SDK, advertising tags or cloud-document backend exists in this release.
- Downloaded JSON contains metadata and extracted text, not PDF binaries. JSON restore is not implemented. Logical browser deletion does not guarantee forensic erasure, remove exports/backups, or change municipal source records.

Hosting and sign-in are separate from browser-local account records. App-source inspection does not prove the infrastructure has no cookies or logs. Those details remain explicitly pending in the published drafts.

## Updating the legal pages

Edit `scripts/legal-content.mjs` for the policy text, sources and review date. `scripts/build-legal.mjs` generates the static HTML, font copies and sitemap. Run `npm run legal` after editing; `npm run build` also regenerates them. Generated HTML is intentionally excluded from Oxfmt; edit the source content rather than the generated pages.

Shared styling and the read-only theme script are in `public/legal/styles.css` and `public/legal/theme.js`. The pages have direct canonical URLs, render without JavaScript, print/save-to-PDF styles, and join the PWA's public precache. They read the app’s appearance preference without writing account records. The footer's data-control link opens Settings via `/?settings=1`.

## Official sources reviewed on 22 October 2026

- [POPIA, Act 4 of 2013](https://inforegulator.org.za/wp-content/uploads/2025/08/PROTECTION-OF-PERSONAL-INFORMATION-ACT-4-OF-2013.pdf): especially sections 5, 11, 14, 18–24 and 72.
- [Information Regulator POPIA guidance and forms](https://inforegulator.org.za/popia/): information-officer duties, Form 1 objections, Form 2 correction/deletion, Form 5 complaints, and current complaint instructions.
- [Information Regulator e-Services](https://eservices.inforegulator.org.za/): official portal; follow the Regulator's current requirements.

No messages or privacy requests were sent to any third party while preparing these drafts. A regulator link is informational, not a complaint submitted on a user’s behalf.

## Verification

Production build, Oxlint, Oxfmt and the seven Playwright journeys passed locally. The legal journey checks all seven direct canonical URLs, theme inheritance, policy readability at 320/390/1440 px, Axe A/AA checks in light/dark, offline legal navigation and the return-to-Settings data-control link. Account records remain unchanged by legal-page navigation. The static privacy page was also checked with JavaScript disabled and the data policy exported through the print layout. This is browser verification, not a legal compliance audit or real-device Safari verification.

Review captures: [legal hub](screenshots/08-legal-desktop.png), [mobile privacy policy](screenshots/09-privacy-mobile.png).
