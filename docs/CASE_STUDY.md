# Billora: from municipal statement to a prepared question

Billora is a browser-local municipal account organiser for South African households and property managers. Its central promise is concrete: import a bill, check its figures, compare consecutive months and prepare an evidence pack for a question you submit yourself.

[Open Billora](https://billora.themba.dev/) · [In-app help and project notes](https://billora.themba.dev/?help=1) · [Source](https://github.com/thembaxx/billora) · [Verification and limits](LAUNCH_EVIDENCE.md)

## The problem and scope

A household may have statements, account references, payment notes and supporting documents spread across files and messages. The product hypothesis is that keeping these together makes it easier to ask a precise billing question. This is a hypothesis, not a measured research finding: no user-study outcomes, reduced-bill claims or adoption metrics are asserted.

The scope is an organisational layer around documents a person already has authority to use. Billora does not retrieve private municipal accounts, process payments, authenticate owners or submit queries. Its cloud and municipal connection screens are labelled local simulations.

## The product decisions

- **Review before trust.** PDF extraction and optional scanned-PDF OCR run locally. Pattern-based suggestions include quoted evidence and require explicit application and human review. Replacing a PDF clears figures and confirmation; opening the original is possible before saving.
- **Separate examples from personal records.** Illustrative sample accounts explain the interface. Creating a personal property removes sample bills from the personal workflow and comparisons.
- **Conservative comparisons.** Consecutive months for the same property can be compared. Category comparisons require reviewed breakdowns for both bills. Numerical increase thresholds prompt a question; they do not diagnose a billing error.
- **Carry the evidence forward.** A comparison-created query retains the previous and current figures and both saved originals. Its downloadable ZIP includes an unsent letter, readable case record and evidence. Missing expected files block export. A manually entered bill has figures but no PDF.
- **Portable local storage.** Records use localStorage; PDFs and evidence use IndexedDB. Password-encrypted full backups support confirmed replacement restore. Records-only JSON and request ZIPs have distinct purposes. Unreadable records trigger an explicit recovery state; failed restore attempts restore exact prior stored bytes and files when rollback succeeds.

The existing warm surfaces, orange accents, four-screen navigation and property illustrations are preserved. The primary setup steps now follow the useful journey: property, reviewed import, comparison and query pack. Help is available from the footer and Settings, with practical support and data controls.

## What can be evaluated

A visitor can explore illustrative accounts or start a personal workspace, import two consecutive PDF bills, open Insights, inspect a notable increase and export a reviewed query. The ZIP can be inspected without relying on a municipal service. A full backup can restore the same documents and query on the same origin/browser profile.

The release evidence documents actual automated browser checks and failures tested. It is engineering verification, not proof that the product resolves disputes or is ready for a regulated production service. The next research step is observing first-time users complete this journey and return with a second statement. Operator details, final legal policies, real-device browser testing and any authorised integrations remain separate work.
