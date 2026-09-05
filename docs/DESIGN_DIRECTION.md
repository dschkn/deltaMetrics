# DeltaMetrics design direction

Reference projects:

- Convox — Call Center SaaS & UX UI Design, Rondesignlab, Behance, 2025
- Callivio CRM — SaaS & UX UI Design, Rondesignlab, Behance, 2025

These projects are references for visual rhythm and interaction language, not templates to copy.

## DeltaMetrics visual code

1. **Quiet light canvas**
   - white / cool off-white surfaces
   - very low-contrast borders
   - shadows are rare and shallow
   - no decorative dashboard gradients behind the whole product

2. **One calm system, two accents**
   - soft blue is the product/navigation accent
   - acid lime is retained as a small DeltaMetrics signature and positive/action accent
   - warning and danger colors remain semantic, not decorative

3. **Typography carries hierarchy**
   - larger, lighter headings
   - compact secondary labels
   - fewer boxed headings and fewer uppercase labels
   - numbers stay visually clear but should not dominate the future patient-facing experience

4. **Cards are panels, not tiles**
   - white surfaces
   - 1px neutral border
   - 15–18px corner radius
   - minimal shadow
   - large breathing room around data

5. **Mobile is a product, not a squeezed dashboard**
   - floating bottom navigation
   - large readable daily-state content
   - short actions and check-ins
   - desktop matrix remains an expert/archive view, while future mobile home should prioritize Today / Check-in / Recommendation

6. **Health data must feel calm**
   - avoid alarming visual noise
   - red only for truly important states
   - no gamified panic around missing data
   - uncertainty and insufficient data should have neutral visual treatment

## Current implementation

`app/reference-refresh.css` is an override layer on top of the existing stylesheet. This keeps the current product functional while the visual system can be tested independently before merging into the main stylesheet.
