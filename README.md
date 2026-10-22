# Billora

A little clarity for everything home. An interactive municipal account organiser for South Africa, inspired by the supplied property dashboards and warm geometric branding.

## Run

Use Node.js 24 LTS and npm.

```sh
npm ci
npm run dev
```

```sh
npm run build
npm run preview
npm run lint
npm run format:check
npm test
```

The production output is `dist/`. Any HTTPS static host with an SPA fallback can serve it. The Sites deployment is configured in `.openai/hosting.json`. When moving to another domain, update the canonical and Open Graph URLs in `index.html`, `public/robots.txt` and `public/sitemap.xml`.

## What works

- Overview, properties, statements and insights, with a four-item spring navigation and mobile bottom bar.
- Original Three.js apartment model, pointer and keyboard rotation, visibility-aware rendering and a reset view.
- GSAP entrance and scroll motion, EasyUI-adapted animated tabs and rolling numbers, Phosphor icons, Geist and Geist Mono.
- Add properties, import PDF statements up to 15 MB, extract text locally, review figures and save original PDFs. Scanned PDFs support manual entry without OCR. The first 20 pages are inspected for text.
- Search properties, accounts, screens and statement months with `Ctrl/Cmd K`.
- Spending charts, category breakdowns, property histories, CSV/JSON exports, original PDF downloads, calendar reminders and downloadable municipal query drafts.
- Official municipal payment links. Personal payment notes are explicitly unverified.
- Guided onboarding, settings dialog, light/dark/system themes, reduced motion, balance privacy and a clean-slate workspace control.
- PWA manifest, offline shell and assets, install prompt, update prompt, safe areas, icons, install screenshots and a PDF file handler for supporting installed browsers.
- SEO metadata, social image, sitemap, `llms.txt` and `llm.txt`.

All direct dependencies were installed from npm's `latest` stable tags on 22 October 2026. `package-lock.json` pins the resolved dependency tree. Key versions include React 19.3.1, Three.js 0.186.1, Vite 8.3.5, Motion 14.6.0, GSAP 3.15.0, Oxfmt 0.74.0 and Oxlint 1.89.0.

## Data and integration boundaries

This release is a functional browser-local MVP. It has **no authentication, backend, cross-device sync, live municipal account retrieval, payment processing or automatic query submission**. It is not a private cloud vault. Initial data is illustrative sample data, dated May–October 2026 and labelled throughout the application. Clear the workspace in Settings before adding your own portfolio.

Account metadata is in `localStorage` under `billora-workspace`; preferences use `billora-settings`. Original PDFs are in the `billora-documents` IndexedDB database. PDFs and extracted text never leave the device through Billora. Do not upload sensitive documents into shared browser profiles. Clearing site data can remove every record. Export account data and download PDFs before resetting or changing devices. JSON exports contain account data and extracted text, but not binary PDF originals.

PDF text extraction does not automatically assert a balance or due date. The user explicitly enters and reviews those figures before saving. Optional category amounts are validated against the total; the remainder is labelled “Other / unallocated”. Insights are based on imported figures and do not confirm billing errors. Reminders are ICS downloads for a calendar application, not background push notifications. Browser PWA and native share/file-handling capabilities vary by browser.

Production municipal integrations require authorised agreements and verified reconciliation. Add authenticated server-side access controls, private encrypted object storage, retention policies and audit logs before introducing cloud document storage or shared property access.

## Verification

Playwright exercises a complete property → PDF extraction → original download → reminder → payment-note persistence journey. It also checks themes, privacy preferences, onboarding, keyboard search, offline reloads and all four screens at 320, 390, 768, 1024 and 1440 pixels. Axe checks the dashboard and settings against WCAG A/AA rules.

Tests use `/usr/bin/chromium` when present, otherwise Playwright's installed Chromium. On a fresh machine run `npx playwright install chromium`. This is automated Chromium verification; real-device Safari installation and notification behaviour require device testing.

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for asset and component attribution. Product research and design notes are in [docs/PRODUCT.md](docs/PRODUCT.md).
