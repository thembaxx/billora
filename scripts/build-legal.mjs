import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { baseURL, documents, sources, updated } from './legal-content.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const escape = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const icon = (name) => {
  const paths = {
    arrow: '<path d="M7 17 17 7M7 7h10v10"/>',
    back: '<path d="m14 7-5 5 5 5M9 12h11"/>',
    shield: '<path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z"/><path d="m8 12 3 3 5-6"/>',
    print: '<path d="M7 8V3h10v5M7 17H4V9h16v8h-3M7 14h10v7H7z"/><path d="M16 11h1"/>',
  };
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
};
const notice = `<div class="draft-notice"><span class="status-dot" aria-hidden="true"></span><p><strong>Preview policy drafts.</strong> Operator, privacy contact and infrastructure details are pending. <a href="/legal/#publication-details">See what is still to be confirmed.</a></p></div>`;
const details = `<section id="publication-details" class="publication-details" aria-labelledby="publication-title"><span class="eyebrow">BEFORE PRODUCTION</span><h2 id="publication-title">A few details still to confirm.</h2><p>These drafts describe how the current preview works. They are not a certification of legal compliance or a completed production contract.</p><dl><div><dt>Legal operator &amp; business address</dt><dd>Pending confirmation</dd></div><div><dt>Privacy contact &amp; Information Officer</dt><dd>Pending confirmation</dd></div><div><dt>Support email</dt><dd>Pending confirmation</dd></div><div><dt>Hosting providers, log retention &amp; processing locations</dt><dd>Pending verification</dd></div><div><dt>Operator-specific PAIA manual &amp; request procedure</dt><dd>Pending assessment and completion</dd></div><div><dt>Production effective date</dt><dd>Not yet set</dd></div></dl><p>No monitored privacy-request inbox or submission form is offered in this preview. Use <a href="/legal/data/">the local data controls</a> for records on your device. You can also consult the <a href="https://inforegulator.org.za/popia/" target="_blank" rel="noreferrer">Information Regulator (opens a new tab)</a>.</p></section>`;

function shell({ title, description, path, content, active = '' }) {
  return `<!doctype html>
<html lang="en-ZA">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#f5f5f8" />
  <meta name="color-scheme" content="light dark" />
  <title>${escape(title)} — Billora</title>
  <meta name="description" content="${escape(description)}" />
  <link rel="canonical" href="${baseURL}${path}" />
  <meta property="og:title" content="${escape(title)} — Billora" />
  <meta property="og:description" content="${escape(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${baseURL}${path}" />
  <meta property="og:image" content="${baseURL}/social.png" />
  <link rel="icon" href="/favicon.png" type="image/png" />
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
  <script src="/legal/theme.js"></script>
  <link rel="stylesheet" href="/legal/styles.css" />
</head>
<body>
  <a class="skip-link" href="#legal-content">Skip to content</a>
  <header class="legal-header">
    <a href="/" class="legal-brand" aria-label="Billora workspace"><img src="/logo.png" width="44" height="44" alt="" /><span>billora<span>.</span></span></a>
    <a href="/" class="back-link">${icon('back')}<span>Back to workspace</span></a>
  </header>
  <div class="legal-layout">
    <aside class="legal-sidebar">
      <a class="legal-home ${active === '' ? 'selected' : ''}" href="/legal/" ${active === '' ? 'aria-current="page"' : ''}>${icon('shield')} Privacy &amp; legal</a>
      <nav aria-label="Policy documents">${documents.map((d, i) => `<a href="/legal/${d.id}/" ${active === d.id ? 'aria-current="page"' : ''}><span class="nav-number" aria-hidden="true">0${i + 1}</span>${escape(d.label)}</a>`).join('')}</nav>
      <div class="sidebar-note"><span class="status-dot" aria-hidden="true"></span><p>Written for the browser-local preview. Real integrations are not active.</p></div>
    </aside>
    <main id="legal-content" tabindex="-1">${content}</main>
  </div>
  <footer class="legal-footer"><p>Billora<span class="brand-dot">.</span> <span>A little clarity for everything home.</span></p><div><a href="/?settings=1">Manage workspace data ${icon('arrow')}</a><span class="version">Draft v1 · ${updated}</span></div></footer>
</body>
</html>
`;
}

await mkdir(`${root}public/legal/assets`, { recursive: true });
for (const family of ['geist', 'geist-mono']) {
  await copyFile(
    `${root}node_modules/@fontsource-variable/${family}/files/${family}-latin-wght-normal.woff2`,
    `${root}public/legal/assets/${family}.woff2`,
  );
}

const hub = `<section class="legal-hero"><span class="eyebrow">PRIVACY &amp; LEGAL</span><h1>Clarity includes<br /><span>the small print.</span></h1><p class="lead">Your information, your choices, and a clear view of how Billora works.</p><p class="review-date">Preview drafts · Reviewed ${updated}</p></section>${notice}<section class="legal-overview" aria-label="At a glance"><div>${icon('shield')}<h2>Local by design.</h2><p>Statement files and reviewed figures stay in this browser. The demo does not connect to a municipality.</p></div><a href="/legal/data/">Understand your data ${icon('arrow')}</a></section><section class="policy-grid" aria-label="Read a policy">${documents.map((d, i) => `<a class="policy-card" href="/legal/${d.id}/"><span class="card-top"><span class="nav-number">0${i + 1}</span>${icon('arrow')}</span><h2>${escape(d.label)}</h2><p>${escape(d.description)}</p><span class="read-policy">Read the draft</span></a>`).join('')}</section>${details}`;
await writeFile(
  `${root}public/legal/index.html`,
  shell({
    title: 'Privacy & legal',
    description:
      'Billora preview policies: privacy, data retention and deletion, terms, cookies, demo integrations and POPIA rights.',
    path: '/legal/',
    content: hub,
  }),
);

for (const d of documents) {
  const content = `<header class="document-heading"><a class="breadcrumb" href="/legal/">Privacy &amp; legal</a><span class="eyebrow">${escape(d.label)}</span><h1>${escape(d.title)}</h1><p class="lead">${escape(d.description)}</p><div class="document-meta"><span>Draft v1 · Reviewed ${updated}</span><button type="button" class="print-button" data-print>${icon('print')}Print / save PDF</button></div></header>${notice}<section class="plain-summary" aria-labelledby="summary-title"><h2 id="summary-title">At a glance</h2><ul>${d.summary.map((s) => `<li>${escape(s)}</li>`).join('')}</ul><p>This summary supports the full document below.</p></section><nav class="document-toc" aria-label="On this page"><span class="eyebrow">ON THIS PAGE</span>${d.sections.map((s) => `<a href="#${s.id}">${escape(s.title)}</a>`).join('')}</nav><article class="policy-copy" aria-label="${escape(d.label)}">${d.sections.map((s) => `<section id="${s.id}" aria-labelledby="${s.id}-title"><h2 id="${s.id}-title">${escape(s.title)}</h2>${s.html}</section>`).join('')}</article><section class="legal-sources" aria-labelledby="sources-title"><h2 id="sources-title">Official references</h2><p>Consult the current legislation and Regulator guidance. These links open in a new tab.</p><ul>${sources.map((s) => `<li><a href="${s.url}" target="_blank" rel="noreferrer">${escape(s.label)} ${icon('arrow')}</a></li>`).join('')}</ul></section><div class="document-end"><a href="/legal/">${icon('back')}All legal documents</a><a href="#legal-content">Back to top ↑</a></div>`;
  await mkdir(`${root}public/legal/${d.id}`, { recursive: true });
  await writeFile(
    `${root}public/legal/${d.id}/index.html`,
    shell({
      title: d.label,
      description: d.description,
      path: `/legal/${d.id}/`,
      active: d.id,
      content,
    }),
  );
}

await writeFile(
  `${root}public/sitemap.xml`,
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${['/', '/legal/', ...documents.map((d) => `/legal/${d.id}/`)].map((p) => `  <url><loc>${baseURL}${p}</loc></url>`).join('\n')}\n</urlset>\n`,
);
console.log(`Generated the legal hub, ${documents.length} policy drafts and sitemap.`);
