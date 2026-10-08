# Sistema Clínica — Clinical Signature v3

## Why this is a redesign, not a CSS polish
The previous iteration retained Inter, the full-height rigid sidebar, three indistinguishable cards and almost unchanged controls. This made the UI appear unchanged even though blur and gradient tokens were adjusted.

This iteration changes the actual visual composition and the visual hierarchy while preserving the medical workflow.

## Direction
Reference: the user's Leve repository's "Vidro & Papel" interface. Adapted rather than copied.

- **Brand identity:** independent Sistema Clínica; the editorial wordmark is distinct from any former business name.
- **Type:** DM Sans for body, forms and action labels; Nunito for display and prominent sections.
- **Palette:** new installations start with Emerald Slate. All existing saved palette preferences are preserved, including previously chosen Garnet Burgundy.
- **Floating navigation:** separate dark clinical-forest slab with meaningful active-state highlighting; collapsed and mobile drawers still work.
- **Floating glass:** toolbar, workflow progress and print action; blur applied to chrome only.
- **Paper:** opaque, readable fields and document surfaces. No glass behind sensitive field text.
- **Sections:** real workflow order patient → certificate → doctor reflected by discrete, semantic visual markers 01/02/03.
- **Action hierarchy:** one strongly defined Gerar e imprimir CTA with printer glyph and direction accent.
- **Login:** deep-green editorial composition with a typographic wordmark, no gratuitous stock card illustration.
- **Motion:** no entrance sequences; no extra steps or hover-induced layout shifts.

## Non-negotiable behavior
1. HTML generation and automatic print after preview load remain exactly as before.
2. No additions to mandatory form fields, confirmation flow, or API requests.
3. Existing record selection should not trigger a false duplicate warning.
4. Model name and document title remain separate.
5. Local form data and PWA lifecycle safety are unchanged.
6. Existing WCAG keyboard focus, contrast, reduced-transparency and narrow viewport guarantees must pass.

## Visual evidence and acceptance
The PR GitHub Actions workflow saves five screenshots with synthetic fixtures:
- login-desktop.png
- login-mobile.png
- workspace-desktop.png
- workspace-mobile.png
- workspace-mobile-dark.png

Acceptance includes lint, build, typecheck, Chromium and Firefox E2E, backend checks, and a design smoke test verifying new type, card radii, floating navigation and CTA.

## Deployment/caching note
Browsers with a saved visual palette keep it intentionally. Installed PWAs may show a previous service-worker release until safe refresh while work is not being edited. New fonts also depend on the existing public Google Fonts connection; local system sans-serif fallbacks are defined.

## Limitations
This is visual development validated by CI. A subjective aesthetic approval still requires inspecting the new deployment or the synthetic screenshots before declaring a final visual sign-off.
