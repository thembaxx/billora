export const updated = '22 October 2026';
export const baseURL = 'https://billora-workspace.sillykoala8.chatgpt.site';
export const sources = [
  {
    label: 'Protection of Personal Information Act 4 of 2013',
    url: 'https://inforegulator.org.za/wp-content/uploads/2025/08/PROTECTION-OF-PERSONAL-INFORMATION-ACT-4-OF-2013.pdf',
  },
  {
    label: 'Information Regulator: POPIA guidance, forms and complaints',
    url: 'https://inforegulator.org.za/popia/',
  },
  { label: 'Information Regulator e-Services', url: 'https://eservices.inforegulator.org.za/' },
];

export const documents = [
  {
    id: 'privacy',
    label: 'Privacy policy',
    title: 'Your information, explained.',
    description: 'What Billora processes, why it is used, and where it stays in this preview.',
    summary: [
      'Statements stay in this browser.',
      'No advertising or analytics trackers are built in.',
      'Hosting and external portals have their own data practices.',
    ],
    sections: [
      {
        id: 'scope',
        title: '1. Who and what this covers',
        html: `<p>This privacy policy draft covers the current Billora web app and installed PWA: a municipal-account organiser for South Africa. “Billora” refers to this product. The legal operator, business address and privacy contact are <a href="/legal/#publication-details">pending confirmation</a>. This draft is not a statement that Billora has been certified as POPIA compliant.</p><p>The app has no production account login, cloud document store or live municipal connection. The cloud-account and authorisation screens are explicitly labelled local demonstrations. Access controls on this private website belong to the hosting service and do not create a Billora cloud account.</p>`,
      },
      {
        id: 'information',
        title: '2. Information you choose to use',
        html: `<ul><li><strong>Property and account records:</strong> property names, addresses, municipalities, account references and property types.</li><li><strong>Statements:</strong> PDFs you select, filenames, extracted text, amounts, periods, due dates, category figures and personal payment notes. Original bills may contain further personal or financial information.</li><li><strong>Service requests:</strong> issue descriptions, property/account snapshots, requested assistance, evidence checklists, photos or documents you attach, local activity notes, submission references and personal follow-up dates. These are user-recorded, not municipality-verified updates.</li><li><strong>Preferences:</strong> your chosen first name, appearance, balance visibility, motion preference and welcome-tour state.</li><li><strong>Demo information:</strong> a made-up display name and email, a local identifier, selected property, simulated permissions, authorisation and sync timestamps. Use fictional details.</li></ul><p><strong>Optional place maps and location:</strong> Opening the map loads visible map tiles from OpenStreetMap Foundation servers, which may receive IP address and approximate viewed area. Only pressing Find sends the entered place query to the public Nominatim search service; there is no automatic address lookup or autocomplete. Only pressing My location requests browser/device geolocation permission. Your precise device coordinates remain in memory until you explicitly choose to save a property pin; viewing nearby map tiles can nevertheless disclose the viewed geographic area to the tile provider. Chosen coordinates are then stored with your property in this browser, included in local exports and available until you delete the workspace. Map tiles and place search require internet, and the PWA does not download map regions for offline use. Do not enter municipal account numbers or confidential information in place-search queries. OpenStreetMap and Nominatim are external services with their own privacy practices and availability limits.</p><p>These records are stored in this browser profile. Billora does not send statement files, extracted text, service-request details, evidence files or demo-profile fields to an application server. Do not include unnecessary identity numbers, banking details, children’s information or special personal information.</p>`,
      },
      {
        id: 'purposes',
        title: '3. Purposes and lawful processing',
        html: `<p>The app uses the records you select to organise properties, display reviewed bills, calculate spending summaries, keep personal notes and produce downloads you request. Service-request ZIPs contain a draft letter, case JSON, linked statement PDF when available and attached evidence; you choose what to submit through the official channel. PDF text extraction runs locally; it is not sent to an AI service. Your preferences personalise the interface.</p><p>The intended grounds for operator-controlled processing are performance of the service you request where necessary for an agreement, and legitimate interests in secure, reliable website delivery, subject to POPIA’s requirements and your rights. A legal obligation may require specific processing. The operator must confirm the purpose-by-purpose lawful grounds before production launch. Opening this policy or continuing to use the preview is not blanket consent to unrelated uses, marketing or future integrations.</p><p>You can explore sample data without importing a real bill. Optional fields can be left blank. If you do not save property or statement details, the related organising features will not have those records to work with.</p>`,
      },
      {
        id: 'hosting',
        title: '4. Hosting, recipients and transfers',
        html: `<p>This preview is delivered through ChatGPT Sites. Website delivery and access services may receive technical request information such as your IP address, browser, requested URL and request time. Hosting sign-in may use session cookies or similar technology. These services are separate from Billora’s local statement store; see <a href="https://openai.com/policies/privacy-policy/" target="_blank" rel="noreferrer">OpenAI’s privacy policy (opens a new tab)</a>.</p><p>The operator has not yet confirmed the complete infrastructure-provider inventory, log-retention periods or processing locations. No South African data-residency guarantee is made. Before production, operator-controlled international transfers must be assessed under POPIA section 72, and applicable provider agreements and safeguards documented.</p><p>Billora has no built-in advertising, analytics SDK, data-sale feature or automated sharing of your account records. A download goes to the destination you choose. Calendar, share and municipal-portal services process information under their own policies when you choose to use them. Do not put account numbers or personal information in a page URL.</p>`,
      },
      {
        id: 'retention',
        title: '5. Retention, security and your control',
        html: `<p>Local records remain until you delete them, clear browser storage or the browser removes them. There is no automatic expiry or server recovery of your bills. <a href="/legal/data/">The data policy</a> explains exports, the separate workspace and demo resets, and how to clear all site data.</p><p>Browser storage is not a Billora-encrypted vault and has no per-user permissions within a shared browser profile. Hide balances changes the screen, not stored records. Use a trusted device, an appropriate screen lock and a separate browser profile; avoid real bills in shared or public profiles. HTTPS protects website delivery but does not encrypt your local records with a separate Billora key.</p><p>If a security compromise falls within the operator’s POPIA responsibilities, notification to the Regulator and affected people must follow section 22, including its requirement to notify as soon as reasonably possible after discovery, subject to the statutory conditions. This is not a promise of continuous local-device monitoring or a fixed response time.</p>`,
      },
      {
        id: 'rights',
        title: '6. Your rights and contact options',
        html: `<p>POPIA provides rights, subject to its conditions and lawful exceptions, to be informed, request access, request correction or deletion, object to qualifying processing, withdraw consent where processing relies on consent, and complain to the Information Regulator. Billora’s spending charts do not make credit, legal or eligibility decisions about you.</p><p>See <a href="/legal/popia/">POPIA rights &amp; requests</a> for practical steps and official forms. The operator/privacy email is pending; this preview has no privacy-request submission form. The operator cannot retrieve records that exist only in your browser through a remote support request. Do not post bills or account references in public repository issues.</p><p>Billora is intended for adults and people with authority to manage the relevant property. It does not offer child accounts. Only use another person’s records where you have a lawful basis and appropriate authority.</p>`,
      },
      {
        id: 'changes',
        title: '7. Changes to this notice',
        html: `<p>The review date appears on this page. The policy must be revised before adding cloud storage, real account login, tracking, payments or live municipal retrieval. Any required notice, choice or consent must be provided before the new processing starts. A later policy cannot retroactively turn this demo into a live authorisation.</p>`,
      },
    ],
  },
  {
    id: 'data',
    label: 'Data retention & deletion',
    title: 'Keep what matters. Clear the rest.',
    description:
      'A practical guide to storage, exports, retention and deleting your local records.',
    summary: [
      'There is no automatic cloud backup.',
      'Account JSON does not contain original PDFs.',
      'Workspace reset and demo reset are separate.',
    ],
    sections: [
      {
        id: 'inventory',
        title: '1. What is stored, and for how long',
        html: `<p>This inventory describes Billora’s current app storage. Local records have no automatic expiry and remain until removed by you or your browser. This does not create a legal requirement for you to retain a bill indefinitely.</p><div class="table-scroll" tabindex="0" role="region" aria-label="Local data storage inventory"><table><thead><tr><th>Record</th><th>Location</th><th>Removal</th></tr></thead><tbody><tr><td>Properties, statement figures, extracted text, payment notes, service requests and timelines</td><td><code>billora-workspace</code> in localStorage</td><td>Delete a statement/request or clear workspace</td></tr><tr><td>Original PDFs</td><td><code>billora-documents</code> IndexedDB, <code>originals</code> store</td><td>Delete that statement or clear workspace</td></tr><tr><td>Service-request evidence files</td><td><code>billora-request-evidence</code> IndexedDB, <code>files</code> store</td><td>Remove evidence, delete its request or clear workspace</td></tr><tr><td>First name, theme, privacy and motion preferences</td><td><code>billora-settings</code> in localStorage</td><td>Replace preferences or clear site data</td></tr><tr><td>Welcome-tour state</td><td><code>billora-welcomed</code> in localStorage</td><td>Clear site data</td></tr><tr><td>Demo profile, connections and simulated authorisation records</td><td><code>billora-demo</code> in localStorage</td><td>Reset the demo or clear site data</td></tr><tr><td>App shell, fonts and public assets</td><td>Service-worker Cache Storage</td><td>App cache updates or clear site data</td></tr></tbody></table></div><p>Downloaded files and any browser or device backups are outside these stores. Hosting delivery/access records are separate; their retention is pending provider confirmation and is not controlled by Clear workspace.</p>`,
      },
      {
        id: 'export',
        title: '2. Make a copy before deleting',
        html: `<ol><li>Open <a href="/?settings=1">Settings</a> and choose <strong>Export account data (JSON)</strong>. This includes property records, statement metadata, extracted text, personal payment notes, service-request details, timeline notes and attachment metadata.</li><li>Open each imported statement and choose <strong>Original PDF</strong> to save the source document separately. The JSON export does not include binary PDF files.</li><li>Save demo-response JSON separately if needed. Account exports do not include binary request-evidence files, demo-profile state, preferences or app caches. Download a reviewed request’s ZIP pack to keep its letter, case record and available attachments. Remove unnecessary personal details before sharing.</li></ol><p>Exports may contain personal and financial information. Store them securely and share them only with intended recipients. Billora has no JSON restore/import feature in this release; an export is a readable record, not a guaranteed one-click workspace backup.</p>`,
      },
      {
        id: 'delete',
        title: '3. Delete statements or clear the workspace',
        html: `<p>To remove one statement, open it and choose <strong>Remove statement</strong>, then confirm. This removes its saved metadata and original PDF from this app’s local stores.</p><p>For all property and statement records, go to <a href="/?settings=1">Settings → Your workspace → Clear workspace &amp; start fresh</a> and confirm <strong>Clear workspace</strong>. This removes sample and imported records, property records, saved original PDFs, service requests, timelines and request-evidence files. It does <strong>not</strong> remove your preferences, welcome-tour state, demo profile or demo connections.</p><p>To remove one service request, open it under <strong>Service requests</strong>, choose <strong>Delete this local request</strong> and confirm <strong>Delete request</strong>. This removes its record, timeline and attached request-evidence files. Linked statement PDFs remain in the statement library. You can also remove an evidence file while editing a draft. A linked statement is a reference to the original library file, not an independent backup: deleting that statement can make a later request ZIP unavailable until its link is corrected in a draft.</p><p>For the demo, open <strong>Explore cloud &amp; municipal demo</strong> in Settings. <strong>Disconnect demo</strong> removes one simulated connection; <strong>Reset demo account &amp; connections</strong> removes the local demo profile and all demo connections.</p>`,
      },
      {
        id: 'all-data',
        title: '4. Remove all website data',
        html: `<p>Use your browser’s site-data or website-storage controls for this Billora origin to remove localStorage, IndexedDB and cached app files. Depending on the browser, you may also need to remove the service worker or installed app. Uninstalling a PWA alone may leave website data behind. Remove downloaded exports and PDFs separately if you no longer need them.</p><p>Clearing local site data may also remove this website’s access/session information and offline support. Reopening an empty Billora profile displays illustrative sample accounts again; those examples are not recovered personal data.</p><p>Deletion from the app is a logical removal from its stores. Billora cannot guarantee forensic erasure of device storage, erase operating-system backups, remove copies you shared, or delete a municipality’s source records. We cannot remotely restore or wipe your browser-local records.</p>`,
      },
      {
        id: 'retention-rules',
        title: '5. Keep records only as long as needed',
        html: `<p>Review your records when a tenancy, management mandate or property relationship ends. Keep only what you are lawfully entitled or required to retain. Your own tax, contract or statutory duties may affect retention; Billora does not determine those duties for you.</p><p>Before operator-controlled storage is introduced, a purpose-based schedule, lawful retention exceptions, deletion/backup processes and provider retention periods must be documented. POPIA section 14 generally limits retention to what is necessary, subject to its exceptions; this draft does not invent a blanket five- or seven-year retention period.</p>`,
      },
    ],
  },
  {
    id: 'terms',
    label: 'Terms of use',
    title: 'A clear understanding.',
    description:
      'The scope of the preview, your responsibilities and the limits of Billora’s features.',
    summary: [
      'An organiser for your own authorised records.',
      'Payments and disputes stay with official channels.',
      'Your statutory rights remain protected.',
    ],
    sections: [
      {
        id: 'preview',
        title: '1. Status and service',
        html: `<p>These are proposed terms for review of Billora’s free browser-local preview, including its installed PWA. The operator’s legal identity, address and contact details are <a href="/legal/#publication-details">pending confirmation</a>. This document is visibly a draft, not a completed production contract. It does not claim that opening the preview constitutes acceptance of undisclosed future charges or integrations.</p><p>Billora helps you organise municipal statements, properties, personal notes and spending summaries. It is independent of municipalities, banks and collection providers. It does not act as a municipality, payment collector, credit bureau or professional financial, legal or tax adviser.</p>`,
      },
      {
        id: 'responsibilities',
        title: '2. Your records and authority',
        html: `<p>Use the app only for lawful purposes and for records you own or are authorised to manage. You remain responsible for the authority and lawful basis for using a tenant’s, owner’s or other person’s information, and for keeping any copies you export secure. The preview offers no landlord/tenant permission controls or shared cloud workspace.</p><p>Do not use the app to obtain unauthorised account access, impersonate another person, upload malicious files or attack this website or third-party systems. Do not enter municipal passwords, payment-card details or genuine credentials into the demo.</p><p>You retain your rights in your documents and records. Using the organiser does not transfer ownership of your bills to Billora or grant a right to sell your personal information. Third-party software and assets remain subject to their applicable licences.</p>`,
      },
      {
        id: 'accuracy',
        title: '3. Figures, reminders and insights',
        html: `<p>Sample data and demo responses are illustrative. Imported balances and due dates are based on records you review and enter; they are not verified live municipal balances. PDF extraction can miss or misread text and does not validate the bill. Check the original statement and the official municipal account before taking action.</p><p>Spending comparisons are informational and do not establish a billing error. A personal “marked paid” note is not proof of settlement. Downloaded request packs and follow-up letters are drafts, not lodged disputes. Submission and resolution statuses, receipts and notes in the Service Request Assistant are entered by you and are not verified municipal updates. Its checklists are general preparation guidance, not official municipality-specific application requirements. Personal follow-up dates are chosen by you, not promised response deadlines. Calendar reminders require you to import a downloaded ICS file into a calendar; Billora does not send background push reminders. You remain responsible for checking due dates, arranging payment and submitting queries through official channels.</p>`,
      },
      {
        id: 'portals',
        title: '4. Municipal links and demonstrations',
        html: `<p>Payment links open an external official portal. Billora does not take money, store payment credentials, submit a payment instruction or confirm reconciliation. The third-party portal’s terms, charges and privacy practices apply to your interaction there.</p><p>The demo cloud account, authorisation checkbox, permissions, sync and balances are local simulations. They do not establish a real cloud account, municipal partnership or legally operative authority with a municipality. Read the <a href="/legal/integrations/">integration disclaimer</a> for the exact boundaries.</p>`,
      },
      {
        id: 'availability',
        title: '5. Availability, storage and changes',
        html: `<p>The preview is currently free and does not contain paid subscriptions or payment collection. Any future paid service would need its price and applicable terms presented before you agree to it.</p><p>Features and offline/native capabilities vary by browser. Updates, storage limits, browser resets, access changes or withdrawal of the preview can affect availability. Keep independent copies of records you need; the app offers no server recovery or availability guarantee. The <a href="/legal/data/">data policy</a> explains what exports do and do not contain.</p><p>Material changes require updated notices and, where appropriate, terms or permission before the new feature begins. Existing demo actions do not authorise future processing.</p>`,
      },
      {
        id: 'rights-law',
        title: '6. Statutory rights and applicable law',
        html: `<p>Nothing in these proposed terms excludes or limits a right, remedy, duty or liability that applicable law does not allow to be excluded or limited, including applicable South African consumer and privacy protections. No blanket waiver, mandatory private arbitration or indemnity is imposed by this draft.</p><p>The proposed governing law is South African law, subject to mandatory laws that apply to you and your rights to approach an appropriate court or regulator. This wording does not restrict the Information Regulator’s powers. An enforceable allocation of liability and the final operator-specific terms remain for review before production launch.</p>`,
      },
    ],
  },
  {
    id: 'storage',
    label: 'Storage & cookies',
    title: 'A closer look at local storage.',
    description: 'How browser storage, offline caching and hosting sessions work.',
    summary: [
      'Preferences and records use browser storage.',
      'The app has no built-in advertising cookies.',
      'Hosting sign-in can use separate session technology.',
    ],
    sections: [
      {
        id: 'app-storage',
        title: '1. App storage is not a cloud account',
        html: `<p>Billora uses localStorage for account metadata, preferences, the welcome-tour state and demo records. Original PDFs and service-request evidence use separate IndexedDB databases. These browser databases are separate from cookies and are tied to this website’s origin and browser profile. They do not automatically follow you to another device, browser or domain.</p><p>The app’s own code does not set cookies or install analytics or advertising trackers. Self-hosted fonts and assets load from the Billora website. This statement covers the Billora app code, not every hosting or sign-in service around it.</p><p>The <a href="/legal/data/#inventory">data inventory</a> lists the storage keys, purposes and removal controls. Local storage is used for the features you choose; it is not a separate encrypted vault.</p>`,
      },
      {
        id: 'offline',
        title: '2. Offline files and updates',
        html: `<p>A service worker caches the app shell and public assets so previously cached features can open offline. Legal pages are included in that public cache. Your original PDFs and request-evidence files are kept separately in IndexedDB; they are not uploaded into a hosting cache or copied into the app-shell cache.</p><p>Cache files can change when the app updates or when your browser removes storage. Offline availability is not a backup promise. Clearing website data can remove both the app cache and your saved records.</p>`,
      },
      {
        id: 'hosting-sessions',
        title: '3. Hosting and external services',
        html: `<p>ChatGPT Sites and its access/sign-in infrastructure may use cookies, session storage and technical logs for delivery, authentication and security. Their exact current storage inventory, retention and processing locations are pending confirmation for the final operator notice. Refer to <a href="https://openai.com/policies/privacy-policy/" target="_blank" rel="noreferrer">OpenAI’s privacy policy (opens a new tab)</a> for that service’s practices.</p><p>Municipal portals, calendar apps and native sharing destinations have their own policies. Following an external link does not grant Billora access to that provider’s cookies or account. Your browser controls may affect both the preview’s access session and its local app storage.</p>`,
      },
      {
        id: 'choices',
        title: '4. Your choices',
        html: `<p>Manage appearance, motion and balance display in <a href="/?settings=1">Settings</a>. Use the separate workspace and demo resets, or your browser’s site-data controls, to remove stored records. Blocking all browser storage may stop persistence or offline features from working.</p><p>The app does not display an “accept all cookies” banner because its code does not currently add optional analytics or advertising storage. This does not certify the hosting layer as cookie-free. Any future non-essential tracking must be assessed, disclosed and given the choices or consent required before it starts. No consent to future tracking is inferred from using this preview.</p>`,
      },
    ],
  },
  {
    id: 'integrations',
    label: 'Integration disclaimer',
    title: 'A demo, from start to sync.',
    description: 'Exactly what the cloud-account and municipal-integration demonstration does.',
    summary: [
      'No real cloud account is created.',
      'No municipal account is accessed.',
      'Authorisation and sync are simulated.',
    ],
    sections: [
      {
        id: 'simulation',
        title: '1. What the demo does',
        html: `<p>The screens marked <strong>DEMO INTEGRATION</strong> demonstrate a possible future account and municipal-connection experience. They save a demo profile, chosen property and simulated authorisation/sync timestamps locally in this browser. Use a made-up name and email; no password is requested and no verification email is sent.</p><p>Sync shows fixed example balances, references and statement counts. Waiting indicators and timestamps are interface simulations. They do not show a request to, or response from, a municipality or cloud provider.</p>`,
      },
      {
        id: 'authority',
        title: '2. The checkbox is not real municipal consent',
        html: `<p>The demo checkbox records a local acknowledgement for the demonstration. It does not validate your identity or property rights, grant provider OAuth/API access, appoint Billora as your agent, create a collection mandate or lodge consent with a municipality. It does not establish a provider partnership or satisfy a future production integration’s authorisation requirements.</p><p>Do not enter municipal usernames, passwords, API credentials or payment details. No Billora cloud authentication, cloud statement storage or cross-device sync is active in this release.</p>`,
      },
      {
        id: 'records',
        title: '3. Keep demo results separate from real records',
        html: `<p>Demo balances never update your imported statements or personal payment notes. A downloadable demo response is marked <code>demo: true</code>, describes its simulated source, and records <code>liveMunicipalConnection: false</code>, <code>cloudStorage: false</code> and <code>paymentProcessing: false</code>.</p><p>Do not use demo balances or statement counts as evidence of a debt, payment, dispute or reconciliation. Use your original statement and official account channel for decisions. Disconnect and reset controls remove local demo records only; they revoke no real municipal connection because none exists.</p>`,
      },
      {
        id: 'future',
        title: '4. Before any live integration',
        html: `<p>A live service would need an authorised provider arrangement, proper account authentication, scoped permissions, secure server processing, purpose and retention disclosures, and a real revocation process. Payment collection would require its own authorised payment and reconciliation arrangement.</p><p>Billora must identify the real provider, explain what will be retrieved or shared, and obtain any required authority before enabling such a feature. The demo does not pre-authorise those future actions.</p>`,
      },
    ],
  },
  {
    id: 'popia',
    label: 'POPIA rights & requests',
    title: 'Your rights. Practical next steps.',
    description: 'Access, correction, deletion, objections and the official complaint channels.',
    summary: [
      'Manage local records without sending a bill anywhere.',
      'Rights are subject to POPIA’s conditions.',
      'You can approach the Information Regulator.',
    ],
    sections: [
      {
        id: 'rights',
        title: '1. Your POPIA rights',
        html: `<p>Subject to the Act’s conditions and exceptions, you may ask whether a responsible party holds your personal information, request access and information about recipients, request correction or deletion, object to qualifying processing, withdraw consent where relied upon, and submit a complaint. Withdrawal does not undo lawful processing that has already occurred. Certain solely automated decisions are also regulated by POPIA; Billora does not make credit or eligibility decisions.</p><p>These rights concern the processing in question. Billora cannot amend a municipality’s billing system or decide a municipal dispute. Direct requests about the municipality’s own records to that municipality as well.</p>`,
      },
      {
        id: 'local',
        title: '2. Act on records in this browser',
        html: `<ul><li><strong>Access:</strong> view records in Statements and Properties; export account JSON from <a href="/?settings=1">Settings</a> and download original PDFs from each imported statement.</li><li><strong>Correction:</strong> the preview does not have a general record editor. Remove an incorrect statement and import a reviewed replacement. Service-request drafts can be edited. Submitted-case notes and statuses remain clearly labelled as your own records. If you need to rebuild property records, export first, clear the workspace, and re-add the correct details.</li><li><strong>Deletion:</strong> remove one statement or service request, remove draft evidence, clear the workspace, reset demo information separately, or clear all website data. See the <a href="/legal/data/">step-by-step data policy</a>.</li></ul><p>Local controls do not replace a formal request for information held by an operator or service provider. The Billora operator cannot remotely retrieve or delete records that exist only in your browser.</p>`,
      },
      {
        id: 'operator-request',
        title: '3. Request handling: contact pending',
        html: `<p>The legal operator, Information Officer and privacy-request email have not yet been supplied. No privacy-request form or monitored request inbox is offered in this preview. These details and a verified request-handling process must be in place before production launch; see <a href="/legal/#publication-details">publication details</a>.</p><p>For a future operator request, identify the relevant service and right, describe the records involved, and give a safe reply method. Identity verification must be proportionate to the request. Do not send an entire municipal statement, password or identity document unless a secure, justified process requires it. Never post personal records in a public source-code issue.</p><p>Requests must be handled within the periods and requirements of applicable law. This draft does not invent an unsupported “30-day deletion guarantee”. Some retention or access exceptions may apply and must be explained when relied upon.</p>`,
      },
      {
        id: 'regulator',
        title: '4. Information Regulator complaints and forms',
        html: `<p>You may approach South Africa’s Information Regulator about alleged unlawful processing. You do not need Billora’s permission to do so. Use the Regulator’s current guidance and complaint channels:</p><ul><li><a href="https://inforegulator.org.za/popia/" target="_blank" rel="noreferrer">POPIA guidance, forms and complaint instructions (opens a new tab)</a></li><li><a href="https://eservices.inforegulator.org.za/" target="_blank" rel="noreferrer">Official e-Services portal (opens a new tab)</a></li></ul><p>The guidance includes Form 1 for objections, Form 2 for correction/deletion requests and Form 5 for POPIA complaints. The Regulator’s website is authoritative for current forms and submission requirements. A Billora demo authorisation is not one of these statutory forms.</p>`,
      },
      {
        id: 'paia',
        title: '5. PAIA and production readiness',
        html: `<p>This rights guide is not a PAIA section 51 manual, an Information Officer registration, or a substitute for operational compliance. An operator-specific PAIA manual and the applicable access-request procedure remain pending assessment and completion. The final operator must also document provider arrangements, lawful processing grounds, retention, security and incident-response procedures.</p>`,
      },
    ],
  },
];
