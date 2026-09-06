# Animation options for direction B

**Recommendation: option 2, Guided flow.** It adds continuity to category changes and dialogs, while a short Mailriz sequence reinforces the idea of several aliases reaching one inbox. The identity, typography, and layout retain their current hierarchy.

**Implementation update:** Guided flow is now implemented in the application with an additional playful theme reveal. See [implementation and verification](implementation.md). The standalone lab below preserves the original comparison options.

Open [the interactive motion lab](index.html) directly in a browser. Choose a preset, click **Replay showcase**, switch categories, open **Let’s connect**, and try the **Reduce motion** control. For option 3, move a mouse over the Mailriz illustration. All options also work in the existing light/dark themes.

The lab is a standalone extension of the B design artifact, simplified to one project. It is not connected to the CMS. Contact links use the existing public profiles; project detail and CV remain prototype dialogs. No application code or deployment was changed for this exploration.

## Compare the options

| Option | Motion character | What changes | Tradeoff |
| --- | --- | --- | --- |
| **1. Quiet polish** | Restrained, almost invisible | 160 ms category fade, 180 ms dialog fade, tiny arrow feedback, brief illustration fade | Lowest implementation complexity; least distinctive. Useful if reading and speed should dominate. |
| **2. Guided flow** | Calm and connected | Moving active-category indicator, 8 px content entry, gentle dialog entry/exit, alias/check sequence ending at the inbox | Best fit for B. Needs cancellation handling and stable navigation geometry. |
| **3. Tactile studio** | More playful, with depth | Spring settling, buttons that press in, dialog scale, up to 2° horizontal / 1.5° vertical pointer tilt on the illustration | Most expressive, but adds distraction and input-specific behavior. Desktop depth has no direct touch equivalent. |

The **Still baseline** disables all motion to help judge whether a transition makes the interface clearer. Option numbers refer to animation treatments, not the original A/B/C layouts.

## What to implement if Guided flow is selected

| Trigger | Treatment | Why |
| --- | --- | --- |
| Category selection | Indicator moves to the new category in 240 ms; new content enters from 8 px below | Keeps the selected location apparent as content changes. Profile stays still. |
| Contact/CV opens | 220 ms opacity + 8 px translation | Gives the dialog a clear entrance without a large zoom or bounce. |
| Dialog closes | 140 ms opacity + 6 px translation | Keeps dismissal quick; return keyboard focus after close. |
| Project CTA hover/focus | Color feedback; arrow shifts 3 px on pointer hover | Signals action without moving the text or its target area. Focus remains visible. |
| Mailriz first becomes visible | Three alias cards settle in 75 ms apart; checks appear, then the inbox responds | Explains the relationship within the illustration. Total sequence about 800 ms; play once. |
| Replay | Repeat only the illustration sequence | Lets a visitor revisit the idea without replaying the page. |
| Reduced-motion preference | Cancel in-flight motion and show final states immediately | Keeps every action and piece of content available without spatial movement. |

No continuous floating, automatic typing, scroll hijacking, or repeated entrance effect on every card is proposed. Nothing waits for a route transition to finish before becoming actionable. The lab uses short sequences rather than a loading simulation.

## Frontend approach

Use CSS for small hover/press feedback and the browser animation API for coordinated or cancellable sequences. `Element.animate()` creates and plays an animation, and its returned animation can be managed directly; no new animation package is needed for the effects demonstrated here. [MDN: Element.animate()](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate), [MDN: using the Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Using_the_Web_Animations_API).

Respect the OS preference in both CSS and JavaScript. The lab also provides a manual reduced-motion preview, but it cannot override an OS request to reduce motion. [W3C: using prefers-reduced-motion](https://www.w3.org/WAI/WCAG21/Techniques/css/C39.html).

Likely application touchpoints:

- `src/styles.css`: motion tokens, hover/focus feedback, reduced-motion styles.
- `src/components/public-view.tsx`: dialog entrance/exit and category indicator. Preserve actual links, browser Back, and `/post/$slug`; the lab’s same-page switching is only a demonstration.
- `src/components/visual.tsx`: Mailriz sequence, started once when the illustration becomes visible. Cancel on unmount or preference change.
- Coordinate route content entry with the existing router after new content is ready. Keep the profile static across categories, and keep SSR content visible before JavaScript.

Use transforms and opacity for moving elements, avoid persistent `will-change` on the whole page, and cancel prior animations when another interaction starts. Tactile pointer updates are coalesced into animation frames and disabled for touch. These are implementation choices; production frame rate and input responsiveness still need measurement on real devices.

## What to validate before rollout

Compare options 1 and 2 with the same content. Ask visitors to find a project, open it, return, and contact the owner. Observe whether they understand category changes, whether the alias sequence helps explain Mailriz, and whether motion feels calm or delays their task. Test on a lower-powered phone and with reduced motion enabled.

Option 3 is worth considering only if the desired personality is more experimental. My preference would be to retain option 2’s navigation and dialog behavior even if a small amount of option 3’s illustration depth is later adopted.

## Artifact verification

- Opened directly using `file://` in Chromium.
- All four presets, category controls, dialog opening/closing, Escape, and focus restoration checked.
- Replays produce animations for options 1–3 and none for the still baseline.
- Manual reduced motion stops animations already running. OS reduced motion is respected and disables the manual override.
- Pointer tilt checked; maximum movement is deliberately small.
- Layout checked at 320, 390, 768, and 1440 px without horizontal document overflow.
- `desktop.png` and `mobile.png` show the comparison layout. They are static screenshots; use `index.html` to assess motion.

`build.py` regenerates the standalone lab from `../mockups/direction-b.html`; Python is not needed to open the generated HTML. This is an exploration, not a cross-browser accessibility or performance certification.
