# Product and design notes

Billora unifies the organisational layer around South African municipal accounts. The first milestone is useful statement management without implying access to private municipal billing APIs.

## Visual system

The supplied Vanta references informed the rounded paper surfaces, warm orange, restrained typography, segmented bills, striped charts, large property imagery and four-item pill navigation. Billora now uses an original tactile b monogram: a coral stem, an apricot bowl and a folded yellow statement. The newer rounded app-icon references informed its finish. An original procedural Three.js building provides the interactive property visual; no external 3D model or texture is needed.

The onboarding is opt-in from a visible first-run welcome strip, keeping the initial workspace accessible. It explains sample data, reviewed imports and device-local storage. Function-based screens keep account management separate from statements and spending analysis. Primary actions stay available in each screen's header. Mobile navigation sits above the safe area.

## Sources consulted

- User-supplied market and integration research, dated 22 October 2026. The Google AI share URL returned an unavailable-page response, so no claims depend on it.
- [web.dev theming](https://web.dev/learn/design/theming): CSS custom properties, system preferences, native control colour schemes and browser theme colours.
- [EasyUI](https://easyui.site/components): source-adapted animated tabs and rolling numbers. The upload interaction uses Billora's own validation and real extraction, without simulated progress.
- [EasyUI Animated Tabs](https://easyui.site/components/animated-tabs).
- [EasyUI Animated Number](https://easyui.site/components/animated-number).

The Anatomy skill was subsequently supplied at https://github.com/wheresryan22/anatomy. Its isometric kit powers the original 79-part bill cabinet in Insights. Four drawers select electricity, water, rates and other charges; drawer movement and the readout share the same category selection and statement totals. The vendored geometry kit retains Ryan’s MIT licence.

Product Design’s brief and audit guidance informed the polish: shorter mobile headings, larger type and touch targets, visible statement due dates and source badges, and calmer card hierarchy. Screenshots were captured and inspected with workspace Chromium. The plugin-specific cloud Browser tool was not exposed, so this does not claim the plugin’s dedicated browser QA workflow.

## Explicit demo connections

Cloud profiles and authorised municipal connector flows are local demonstrations, labelled “DEMO INTEGRATION”. A made-up profile is saved in `billora-demo`. Consent is recorded for the demo; a sync returns fixed municipal fixtures and never accesses municipal APIs. Demo balances and statement counts are not merged into imported statements. The response JSON includes `demo: true`, `liveMunicipalConnection: false`, `cloudStorage: false` and `paymentProcessing: false`.

## Next integration milestone

Validate whether consumers return to import a second statement. Then investigate authorised bill presentment with municipal providers and payment networks. Public municipal finance datasets must never be represented as private household balances. A future server implementation needs verified identities, property permissions, encrypted document storage and an explicit document-retention policy.

## Location explorer and map (October 2026)

- A dedicated Properties card/map view and optional map-assisted property creation preserve the four-tab navigation.
- The browser requests only visible OpenStreetMap tiles; no background tile downloads, prefetching, service-worker pre-caching, or offline map promises.
- Search requires the user's explicit submit action and queries Nominatim with South African results. No autocomplete. The public Nominatim server has strict rate limits, no SLA, and is unsuitable for significant scale; use a properly identified hosted provider or own service before commercial rollout.
- Geolocation permission is requested exclusively by an explicit button. Browser device coordinates remain ephemeral, whereas a user-confirmed property map pin is saved to local workspace metadata. Saving pinned coordinates does not verify municipal property identity or ownership.
- The WebGL compass is decorative, uses existing Three.js, and respects reduced motion and visibility. Fallback remains functional with WebGL unavailable.
- The map is an online enhancement. The rest of the local PWA, manual address form and property lists remain usable without map data.
