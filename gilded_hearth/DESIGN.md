# Design System Strategy: The Digital Atelier

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Atelier."** 

Unlike the sterile, hyper-efficient "SaaS" look that dominates the financial sector, this system is built on the philosophy of bespoke craftsmanship and quiet authority. It bridges the gap between traditional prestige and modern digital elegance. We reject the "template" look by embracing **intentional asymmetry**, **overlapping editorial layouts**, and **tactile depth**. 

The goal is to evoke the feeling of a high-end physical office: the scent of heavy paper stock, the warmth of polished wood, and the steady confidence of an expert advisor. This system serves a sophisticated 30-50 year old Chinese community by prioritizing stability over trendiness and warmth over cold automation.

---

## 2. Color & Tonal Architecture
The palette is rooted in Earth and Metal elements, creating a grounded sense of prosperity.

### The Palette (Material Design Tokens)
- **Background/Base:** `surface` (#FDF9F5) — A warm, breathable cream.
- **Primary/Action:** `primary` (#785600) — A rich, authoritative gold.
- **Content/Text:** `on_surface` (#1C1C19) — A deep, nuanced espresso (not a harsh black).
- **Secondary/Nuance:** `secondary` (#745853) — A muted, warm brown for supporting elements.

### The "No-Line" Rule
To maintain a premium, editorial feel, **1px solid borders are strictly prohibited for sectioning.** 
Boundaries must be defined through:
1. **Background Shifts:** Use `surface_container_low` or `surface_container_high` to distinguish sections.
2. **Tonal Transitions:** Layering a `surface_container_lowest` card on a `surface_container` background.
3. **Negative Space:** Use the spacing scale to create "implied lines" through alignment.

### Surface Hierarchy & Nesting
Treat the UI as a physical desk. Use the surface-container tiers to create nested depth:
- **Base Level:** `surface` (The desk).
- **Secondary Level:** `surface_container_low` (A leather blotter).
- **Information Level:** `surface_container_highest` (A sheet of premium paper).

### The "Glass & Gradient" Rule
To add "soul" to the digital interface:
- **Glassmorphism:** For floating navigation or modal overlays, use `surface` at 80% opacity with a `backdrop-blur` of 20px.
- **Signature Gradients:** Use a subtle radial gradient transitioning from `primary` (#785600) to `primary_container` (#986D00) for hero CTAs to suggest the sheen of metallic gold.

---

## 3. Typography: Editorial Authority
The type system creates a dialogue between heritage and modern professionalism.

- **The Display & Headline (Noto Serif):** This is our "Traditional Voice." Use Noto Serif for all `display-` and `headline-` scales. It conveys established power and historical trust. Use `headline-lg` (2rem) for section titles to establish an editorial rhythm.
- **The Body & Label (Be Vietnam Pro):** This is our "Modern Voice." Use Be Vietnam Pro for `body-` and `label-` scales. Its clean, geometric warmth ensures high legibility for complex mortgage data while feeling approachable.
- **Hierarchy Tip:** Always pair a `display-md` serif header with a `body-lg` sans-serif subhead. The contrast in weight and style creates an "expensive" look commonly found in luxury lifestyle magazines.

---

## 4. Elevation & Depth
We define hierarchy through **Tonal Layering** rather than structural scaffolding.

- **The Layering Principle:** Place a `surface_container_lowest` card on a `surface_container_low` section to create a soft, natural lift. This creates a tactile "stack" without the clutter of shadows.
- **Ambient Shadows:** When a component must float (e.g., a primary modal), use an extra-diffused shadow.
    - **Specs:** `blur: 40px`, `y-offset: 12px`, `opacity: 6%`.
    - **Color:** Use a tinted version of `on_surface` (#1C1C19) to mimic natural light, never a neutral gray.
- **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline_variant` token at **15% opacity**. It should be felt, not seen.
- **Signature Texture:** Apply a 2% opacity "paper grain" SVG overlay to the entire `background` layer. This breaks the digital "flatness" and adds a premium, tactile quality.

---

## 5. Components

### Buttons: The Touch of Gold
- **Primary:** `primary` background with `on_primary` text. Use `rounded-lg` (1rem). Apply a subtle inner-glow (top-down) to simulate a beveled edge.
- **Secondary:** `surface_container_high` background. No border.
- **Tertiary:** `on_surface` text with no background. Use for "Cancel" or "Back."

### Cards: The Paper Leaf
- **Styling:** Forbid divider lines. Use `surface_container_lowest` for the card body. 
- **Interaction:** On hover, do not use a shadow; instead, shift the background color to `surface_bright` and apply a `ghost-border`.

### Input Fields: The Professional Ledger
- **Styling:** Use a "filled" style with `surface_container_low`. 
- **States:** The "active" state should be a 2px bottom-border using the `primary` gold token. This mimics the underline of a signature on a contract.

### Data Tables & Lists
- **Rule:** Forbid the use of vertical or horizontal lines. 
- **Execution:** Use alternating row colors (Zebra striping) with `surface` and `surface_container_low` at a very subtle contrast. Increase `body-md` line-height to 1.6 for readability.

---

## 6. Do’s and Don’ts

### Do
- **Do** use asymmetrical layouts (e.g., a large image on the left overlapping a text card on the right) to create a custom, high-end feel.
- **Do** use generous white space. If you think there is enough space, add 16px more.
- **Do** use `primary` (Gold) sparingly. It is an accent, like jewelry on an outfit.

### Don’t
- **Don’t** use standard 1px borders. They make the design feel like a generic template.
- **Don’t** use cold grays or pure blacks. Always use the espresso/brown tones for "on-surface" elements to maintain warmth.
- **Don’t** use sharp 90-degree corners. Everything must feel "held" and "softened" through the `lg` (1rem) and `xl` (1.5rem) roundedness scale.
- **Don’t** use generic icon libraries. If using icons, ensure they have a consistent "fine-line" weight that matches the `label-sm` stroke.