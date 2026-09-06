# Guided flow implementation

Option 2 is implemented in the existing B layout. Theme switching adds a more expressive moment while navigation and dialogs retain the short timings proposed in the exploration.

| Interaction | Implemented behavior | Purpose |
| --- | --- | --- |
| Categories | Active underline moves over 240 ms; content fades in from 8 px below | Connects the selected category to the changed content while the profile stays still. |
| Contact and CV dialogs | 220 ms entrance, 140 ms exit; Escape and backdrop dismissal; focus returns to the opener | Makes opening clear and dismissal quick while preserving keyboard use. |
| Mailriz illustration | Aliases and checks appear in sequence, followed by the inbox; approximately 800 ms overall | Reinforces the relationship between several addresses and one inbox. Plays once per project during the page session, with a 44 px Replay control. |
| Action arrows | 3 px movement on hover for a fine pointer | Gives feedback without shifting the text or touch target. |
| Theme button | New palette expands in a circle from the button center at a constant rate over 400 ms; sun/moon icon responds in the click handler and settles over 320 ms | Makes the theme change feel initiated by the visitor and adds personality without changing the brand palette. |

Theme changes use feature-detected native View Transitions with a CSS circle animation prepared before capture, and element sequences use Web Animations. During the reveal, descendant CSS transitions are disabled so colors settle once instead of animating independently beneath the circle. The circle starts with the browser transition timeline, without JavaScript scheduling it from a readiness callback. No animation dependency was added. Browsers without View Transitions apply the palette immediately with icon feedback. Reduced motion applies final states immediately and cancels active sequences. Theme choice still persists and synchronizes across tabs; system appearance continues to apply until a visitor selects a theme.

Rapid theme clicks invalidate obsolete snapshot callbacks so the most recent selection wins. Hiding the page or enabling reduced motion settles a pending selection. Unmounting cancels active animation work and removes listeners. Motion memory is scoped to the React provider, preserving category positions across route remounts without sharing mutable state between server requests.

Implementation references: [MDN startViewTransition](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition), [MDN skipTransition](https://developer.mozilla.org/en-US/docs/Web/API/ViewTransition/skipTransition).

## Verification

- TypeScript check and production build pass. Build retains the existing large editor chunk warning.
- All 41 tests pass, including eight theme-controller cases covering unavailable APIs, reduced motion, stale callbacks, visibility changes, snapshot failures, unmounting, immediate icon response, and button-centered geometry.
- Chromium checks cover real category routes and CMS preview buttons, theme persistence, nine immediate repeated theme clicks, reduced motion during a reveal and dialog exit, Escape with focus restoration, and the admin theme button.
- Mailriz does not replay automatically when returning from Writing; its Replay button restarts the three alias animations.
- At 320, 390, 768, and 1440 px, no horizontal page overflow was observed; theme and Replay targets measure at least 44 px.
- Browser checks recorded no page errors. The unsupported-API fallback was also exercised in Chromium by removing `document.startViewTransition` for that page session.

[Theme reveal captured mid-transition](implemented-theme-reveal.png) · [Implemented mobile layout](implemented-mobile.png)

Preview the application with `npm run dev` and open the URL printed by Vite. The current development session is at `http://localhost:3004/`. These changes are local; this implementation step did not create a commit or deploy.

Actual low-powered phone performance and Safari/Firefox rendering remain to be checked. User testing should assess whether the theme reveal feels playful without distracting from reading and whether the Mailriz sequence clarifies the product.

## Theme origin correction

Reproduced a real coordinate mismatch with root CSS zoom at 67%: the button center was at approximately x=1101, but the visible circle appeared near x=737, at the top center. The button's viewport rectangle and the transition snapshot used different pixel scales. Checking only the raw clip-path coordinates had missed that difference.

The controller now supplies the center and covering radius as percentages of the snapshot reference box. The radius uses the normalized diagonal defined by [CSS Shapes](https://drafts.csswg.org/css-shapes-1/#basic-shape-functions), preserving a circle and full viewport coverage as the snapshot scales. Timings and immediate icon feedback are unchanged.

Browser regression checks resolve the actual computed clip against the snapshot dimensions and effective zoom, then compare its rendered center to the button. Both theme directions pass at root zoom 67%, 100%, and 125%, on a 390 px mobile viewport, and on `/preview`. Maximum measured center difference was below 0.01 px. The final radius reaches the farthest corner; rapid clicks and reduced-motion interruption still settle correctly. All 41 tests, typecheck, and production build pass.

[Before: circle at top center](theme-origin-zoom-before.png) · [After: circle centered on the toggle](theme-origin-zoom-fixed.png). These capture the reveal at 20 ms on a page scaled to 67%; root CSS zoom is the reproduced condition, rather than a claim about every browser's native zoom implementation.

## Theme smoothness revision

The previous theme change triggered 21 additional color/background transitions on the tested portfolio page. The revision produces only the circle and icon animations during the reveal. Desktop (1440 px) and mobile (390 px) checks confirm that both light-to-dark and dark-to-light circles originate at the measured button center. Nine immediate clicks settle on the last stored choice, and enabling reduced motion mid-reveal removes both the transition and its temporary geometry.

In one local Chromium requestAnimationFrame sample, the longest frame interval changed from 116.2 ms before the revision to 17.6 ms afterward. This is a development-session observation, not a guarantee for every browser or device. Native snapshot preparation still takes time; the icon now responds before snapshot readiness rather than waiting for it.
