# Product and design notes

Billora unifies the organisational layer around South African municipal accounts. The first milestone is useful statement management without implying access to private municipal billing APIs.

## Visual system

The supplied Vanta references informed the rounded paper surfaces, warm orange, restrained typography, segmented bills, striped charts, large property imagery and four-item pill navigation. Billora uses its own staggered geometric mark rather than the reference brand. An original procedural Three.js building provides the interactive property visual; no external 3D model or texture is needed.

The onboarding is opt-in from a visible first-run welcome strip, keeping the initial workspace accessible. It explains sample data, reviewed imports and device-local storage. Function-based screens keep account management separate from statements and spending analysis. Primary actions stay available in each screen's header. Mobile navigation sits above the safe area.

## Sources consulted

- User-supplied market and integration research, dated 22 October 2026. The Google AI share URL returned an unavailable-page response, so no claims depend on it.
- [web.dev theming](https://web.dev/learn/design/theming): CSS custom properties, system preferences, native control colour schemes and browser theme colours.
- [EasyUI](https://easyui.site/components): source-adapted animated tabs and rolling numbers. The upload interaction uses Billora's own validation and real extraction, without simulated progress.
- [EasyUI Animated Tabs](https://easyui.site/components/animated-tabs).
- [EasyUI Animated Number](https://easyui.site/components/animated-number).

No installed skill named “anatomy” was available in the session. The supplied images and available motion/frontend guidance informed the component anatomy and implementation.

## Next integration milestone

Validate whether consumers return to import a second statement. Then investigate authorised bill presentment with municipal providers and payment networks. Public municipal finance datasets must never be represented as private household balances. A future server implementation needs verified identities, property permissions, encrypted document storage and an explicit document-retention policy.
