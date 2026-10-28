# Service Request Assistant

Billora’s first service-delivery feature helps people prepare an issue, gather supporting records, use an official submission channel and keep their own follow-up history. It works locally and offline after the PWA has cached this version. It has no municipal submission API, background sending, provider status feed or automatic push notification.

## Entry points and preparation

The assistant is available under Properties, in the Overview service-request panel, from property/statement details, through Settings, and at `/?requests=1`. Existing four-item navigation is preserved. A statement entry preselects its property and statement; sample statements remain clearly labelled.

A new draft is saved immediately, then changes are saved as the user edits. Three steps cover the issue/property and desired assistance, general evidence checklist, and letter review. Billing, meter, water, electricity, refuse and other issue types have different general prompts. These are not advertised as official municipality-specific application requirements. Users must confirm their authority and review the draft before marking it ready.

The case stores a snapshot of the selected property and reviewed statement figures. Linked original PDFs are retained while referenced by a library statement or saved request. Removing a statement from the library preserves its PDF when a request still needs it. If an expected original is missing from browser storage, ZIP generation stops instead of silently omitting it. A draft can unlink or select a different statement. Files attached directly to the request have their own storage and can be downloaded or removed separately.

## Evidence and request packs

Evidence supports PDF, JPG, PNG and WebP, with up to six files, 10 MB per file and 30 MB total. Files are saved only in the `billora-request-evidence` IndexedDB database, `files` store. Request metadata and timeline entries are saved in the existing `billora-workspace` record. Attachments are not uploaded, rendered as executable content, or scanned for malware by this app.

`Download request pack` creates a local ZIP containing `request-draft.txt`, `request-record.json`, `READ-ME.txt`, the linked original PDF where applicable, and the request’s attached evidence. Queries started from a comparison also include `comparison.json`, both reviewed month/amount snapshots, and both original PDFs when attached. Manually entered bills are represented by figures without claiming a PDF exists. Missing expected files stop generation and show a clear error. ZIP filenames strip path separators and control characters. Fflate 0.8.3 generates stored ZIP entries without expensive image/PDF recompression. The case JSON explicitly records `municipalityVerified: false`.

The letter is editable text and asks the user to add their name/contact details before sending it. Pack preparation does not count as submission. The app opens the municipality’s existing official portal, or the government municipal-contact directory for an unknown municipality, with a note to confirm the right service/query channel.

Hide balances masks the structured statement amount in the on-screen letter preview. It does not redact downloaded files, free-text descriptions or original documents; the review step explains this.

## Status and follow-up

| Status                     | Meaning                                                                                                        |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Draft · not submitted      | Local preparation is in progress.                                                                              |
| Ready · not submitted      | Authority and details have been reviewed; nothing has been sent by Billora.                                    |
| Submission recorded by you | The user entered an official-channel reference, channel and date and acknowledged that it is their own record. |
| Resolved · recorded by you | The user recorded their own resolution update.                                                                 |

There is no municipality-verified status. Timeline notes, reference numbers and submission/resolution records are user-entered. Completed cases can be reopened for further personal follow-up. General checklists and a review confirmation are not a provider authorisation agreement.

A chosen follow-up date is a personal reminder, not a promised response deadline. Due dates appear in the case, request-list filter, Overview/Properties counts and the existing Reminders dialog. A follow-up letter and an ICS calendar reminder can be downloaded; the user must send/import them. Follow-up downloads are logged as local preparation, never as sent messages.

## Data lifecycle

- Older workspaces without a `requests` field initialise it as an empty list without losing properties or statements.
- Account JSON exports include request metadata, notes and attachment names/IDs, but not attachment binaries. Request ZIPs provide the relevant file copies. Account JSON and request ZIP packs are not directly restorable; Settings full backups provide replacement restore, including PDFs, request evidence and comparison links.
- Deleting a request removes its local record, timeline and directly attached evidence; it preserves originals in the statement library or linked to other requests. Originals retained solely for the deleted request are removed.
- Clear workspace removes all properties, statements, service requests, original PDFs and request evidence. Preferences and demo records remain; the separate demo reset still applies.
- Browser site-data removal can erase all local records and offline files. Downloaded ZIPs, PDFs, calendar files, operating-system backups and municipal source records are outside the app’s deletion controls.
- The privacy/data/storage/terms/POPIA policy drafts and LLM descriptions include these new records and boundaries. Operator/contact and infrastructure details remain pending.

## Verification

The request journeys cover offline ZIP export and exact evidence bytes, user-recorded submission, personal due dates, follow-up/calendar downloads, timeline notes, resolution, deletion of IndexedDB evidence, legacy data, JSON exports and workspace reset. Responsive dialog widths are checked at 320/390/768/1024/1440 pixels, with light/dark Axe scans and no external requests in the offline workflow. Full application checks also exercise existing property/statement, theme, demo, Anatomy and legal journeys.

Browser verification is Chromium-based. No real municipal submission or messaging service is exercised, and no third party is contacted on the resident’s behalf.

Review captures: [desktop draft](screenshots/10-request-desktop.png), [mobile evidence checklist](screenshots/11-request-evidence-mobile.png), [dark mobile follow-up record](screenshots/12-request-tracking-dark.png). Long request dialogs keep the close/header controls visible while scrolling. The statement-to-request entry point was also checked manually with the property and statement preselected.
