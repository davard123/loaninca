```markdown
# Design System Strategy: The Bespoke Consultant

## 1. Overview & Creative North Star: "The Digital Atelier"
This design system rejects the "SaaS-template" aesthetic in favor of a **Digital Atelier**—a space that feels curated, architectural, and deeply personal. We are moving away from rigid, boxy layouts and towards an editorial experience that mirrors a high-end boutique consultancy.

**The Creative North Star: "Architectural Warmth"**
The system balances the structural authority of a mortgage expert (Deep Charcoal) with the tactile, human warmth of a home (Warm Parchment). By using intentional asymmetry, generous whitespace, and tonal layering, we create a rhythmic flow that guides the user through complex financial journeys with the grace of a premium lifestyle magazine.

---

## 2. Colors & Surface Philosophy
The palette is rooted in the interplay between "Ink" (Primary) and "Paper" (Background).

### The "No-Line" Rule
To maintain a high-end feel, **1px solid borders are strictly prohibited for sectioning.** Boundaries must be defined through:
*   **Tonal Shifts:** Transitioning from `surface` (#fcf9f5) to `surface-container-low` (#f6f3ef) to define content blocks.
*   **Negative Space:** Using the Spacing Scale to create "islands" of information rather than "boxes."

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, physical sheets of fine paper. 
*   **Base:** `surface` (#fcf9f5) for the main page.
*   **Nesting:** Place a `surface-container-lowest` (#ffffff) card on top of a `surface-container` (#f0ede9) background to create a "lifted" feel without using a shadow. 
*   **The Signature Gradient:** Use a subtle linear gradient (Top-Left: `primary` #17191b to Bottom-Right: `primary_container` #2c2e30) for high-impact CTA buttons to provide a "metallic ink" depth.

### Glassmorphism & Texture
For floating navigation bars or overlays, use `surface` at 80% opacity with a `24px` backdrop-blur. This ensures the warm "parchment" tone of the background bleeds through, preventing the UI from feeling disconnected.

---

## 3. Typography: Editorial Authority
The typography is a dialogue between the timelessness of a serif and the clarity of a modern sans-serif.

*   **The Display Scale (Noto Serif):** Used for large-scale storytelling and section introductions. It conveys heritage and expertise.
    *   *Rule:* Use `display-lg` for hero statements with a negative letter-spacing (-0.02em) to feel "tight" and professional.
*   **The Body Scale (Plus Jakarta Sans):** A humanistic sans-serif that remains highly legible at small sizes.
    *   *Rule:* All body text should use `on_surface_variant` (#44474a) rather than pure black to maintain the "warm" aesthetic.
*   **The Accent Label:** `label-md` should be used sparingly in uppercase with 0.1em letter spacing when paired with `secondary` (#6e5c40) for a "gold foil" stamp effect.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "tech." We achieve depth through light and layering.

*   **The Layering Principle:** Stack `surface_container_low` over `surface`. This creates a soft, natural hierarchy that feels like architectural planes.
*   **Ambient Shadows:** If a shadow is required for a floating Modal or Primary Card, use a multi-layered blur:
    *   `box-shadow: 0 10px 30px -5px rgba(28, 28, 25, 0.04), 0 20px 60px -10px rgba(28, 28, 25, 0.08);`
    *   *Note:* The shadow color is a tint of `on_surface` (#1c1c19), not pure grey.
*   **The Ghost Border:** If a form field or secondary card needs a container, use `outline_variant` (#c5c6ca) at **20% opacity**. This creates a "suggestion" of a boundary that feels lighter and more refined.

---

## 5. Components & Primitive Styling

### Buttons: The Tactile Interaction
*   **Primary:** Solid `primary` (#17191b) with `on_primary` (#ffffff) text. Use `DEFAULT` (0.25rem) corner radius. For extra polish, add a 1px inner-glow (border-top) in a lighter shade.
*   **Secondary:** No fill. `secondary` (#6e5c40) text with a "Ghost Border."
*   **Tertiary:** No fill, no border. Underlined text using `secondary` at 2px weight, offset by 4px.

### Cards: The Editorial Layout
*   **Rules:** Forbid divider lines. Use `surface_container_highest` for a header background and `surface_container_low` for the body. 
*   **Asymmetry:** Place imagery slightly "off-grid," overlapping the edge of the card to break the container's rigidity.

### Input Fields: The Minimalist Approach
*   Use `surface_container_low` as the background fill.
*   Remove all borders except for a 2px bottom-border in `outline_variant`.
*   On Focus: Transition the bottom-border to `secondary` (Gold/Bronze).

### Unique Component: "The Signature Quote"
A specific component for this system: Large `headline-lg` Noto Serif text, center-aligned, with a `secondary_fixed` (#f8dfbb) vertical accent line (2px wide) on the left. This creates a high-trust, testimonial feel.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical margins (e.g., 80px left, 120px right) in desktop hero sections to create a "custom-built" feel.
*   **Do** integrate high-grain, black-and-white photography with a "warm" sepia overlay (2% opacity).
*   **Do** use "Parchment" (`background`) as your primary canvas, not white.

### Don’t:
*   **Don’t** use pure black (#000000) or pure white (#FFFFFF). It breaks the "warm professionalism" vibe.
*   **Don’t** use icons with heavy fills. Use thin-stroke (1px or 1.5px) "linear" icons in `primary`.
*   **Don’t** use "Standard" card shadows. If it looks like a material design shadow, it’s too heavy.
*   **Don’t** use divider lines to separate list items; use increased vertical padding (16px to 24px) and a subtle background change on hover.

---
*Director’s Note: This design system is not a set of constraints; it is a philosophy of restraint. Every pixel should feel like it was placed by a person, not a framework.*```