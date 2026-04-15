# The Design System: Editorial Precision & Tonal Depth

## 1. Overview & Creative North Star
**Creative North Star: "The Financial Architect"**

This design system moves beyond the "standard" mortgage interface by adopting a high-end editorial perspective. We are not building a form; we are designing a curated financial journey. Our aesthetic philosophy rejects the cluttered "portal" look in favor of an authoritative, Apple-esque sanctuary. 

To break the "template" feel, we employ **Intentional Asymmetry**. Rather than centering everything, we use massive, sweeping whitespace to push content into purposeful focal points. We embrace **Layered Minimalism**—where the sense of premium quality comes from the mathematical precision of our typography and the subtle shifts in surface tones, rather than decorative elements. The result is a digital experience that feels as stable and permanent as a physical home.

---

## 2. Colors & Surface Philosophy
Our palette is rooted in high-contrast neutrals with a single, sharp architectural blue.

### Surface Hierarchy & Nesting
Instead of a flat grid, we treat the UI as a series of physical layers.
*   **Base:** `surface` (#F9F9FB) is our canvas.
*   **Elevated Content:** `surface_container_lowest` (#FFFFFF) is used for primary cards or modular sections to create a "paper-on-desk" lift.
*   **Recessed Areas:** `surface_container_low` (#F3F3F5) is used for utility areas or sidebars.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section off content. Boundaries must be defined solely through background color shifts. For example, a `surface_container_low` section sitting against a `surface` background provides all the definition a premium user needs. Lines create visual noise; tonal shifts create atmosphere.

### The "Glass & Gradient" Rule
To add "soul" to the minimalist aesthetic:
*   **Glassmorphism:** For floating navigation or modal overlays, use `surface_container_lowest` at 80% opacity with a `24px` backdrop-blur. 
*   **Signature Gradients:** For primary CTAs, use a subtle linear gradient from `primary` (#004E9F) to `primary_container` (#0066CC) at a 135-degree angle. This prevents the "flat-asset" look and adds a sense of depth and tactility.

---

## 3. Typography: The Editorial Voice
We use **Inter** as our typographic backbone, treated with the spacing and scale of a high-end architectural magazine.

*   **Display Scale (`display-lg` to `display-sm`):** Reserved for hero value propositions. Use `on_surface` (#1A1C1D) with a letter spacing of `-0.02em` to create a dense, authoritative "ink-on-paper" feel.
*   **Headline & Title:** Used for section headers. Always pair a `headline-lg` with generous `64px` or `80px` top padding to let the type breathe.
*   **Body (`body-lg` to `body-sm`):** Use `on_surface_variant` (#414753) for long-form text. The slightly reduced contrast against the white background is easier on the eyes and feels more sophisticated than pure black.
*   **Label Scale:** Used for technical data and micro-copy. Always use `medium` or `semibold` weights for `label-md` to ensure legibility against subtle backgrounds.

---

## 4. Elevation & Depth
In this system, depth is felt, not seen. We move away from traditional drop shadows toward **Tonal Layering**.

*   **The Layering Principle:** Stack `surface_container_lowest` (#FFFFFF) on top of `surface` (#F9F9FB). This creates a soft, natural lift that mimics natural light.
*   **Ambient Shadows:** If an element *must* float (e.g., a primary modal), use a shadow with a `48px` blur, `0px` spread, and a color of `on_secondary_container` (#626267) at 6% opacity. It should feel like a soft glow, not a dark edge.
*   **The "Ghost Border" Fallback:** If accessibility requires a container edge, use a `1px` stroke of `outline_variant` at **15% opacity**. It should be nearly invisible at first glance.

---

## 5. Components

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary_container`), white text, `0.5rem` (DEFAULT) radius. High-gloss, authoritative.
*   **Secondary:** `surface_container_highest` background with `on_surface` text. No border.
*   **Tertiary:** Pure text with `primary` color, using an arrow icon (`→`) to indicate flow.

### Input Fields
*   **Structure:** Minimalist underline or subtle `surface_container_low` fill. 
*   **State:** On focus, the background shifts to `surface_container_lowest` and a `1px` `primary` "Ghost Border" (20% opacity) appears.
*   **Error:** Use `error` (#BA1A1A) for text, but keep the container fill `error_container` at a very soft 10% opacity.

### Cards & Lists
*   **The Divider Ban:** Strictly forbid 1px divider lines. Separate list items using `16px` of vertical white space or by alternating very subtle background tints (`surface` vs `surface_container_low`).
*   **Photography Containers:** Use `xl` (1.5rem) rounded corners for imagery to soften the clinical nature of financial data.

### Mortgage-Specific Components
*   **The Rate Card:** A `surface_container_lowest` card with a `display-md` rate value. Use `primary` for the percentage to draw the eye instantly.
*   **Progress Stepper:** Use ultra-thin `2px` lines in `outline_variant` with `primary` dots to indicate the loan application journey. Keep it airy and light.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical margins (e.g., 10% left, 20% right) to create a dynamic, editorial feel.
*   **Do** use high-quality, architectural photography of homes that emphasize light and space.
*   **Do** leverage "Micro-Transitions." Elements should slide upward by `8px` while fading in to mimic a premium OS feel.

### Don’t:
*   **Don’t** use pure black (#000000) for text. Use `Deep Black` (#1D1D1F) to maintain a soft, premium look.
*   **Don’t** crowd the screen. If you feel you need more content, you likely need more pages, not more density.
*   **Don’t** use standard "blue" for links. Use our `refined Blue` (#0066CC) and ensure it’s balanced by surrounding whitespace.