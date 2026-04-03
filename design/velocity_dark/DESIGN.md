# Design System Strategy: The High-Velocity Playbook

## 1. Overview & Creative North Star
**The Creative North Star: "The Digital Arena"**
This design system is not a static interface; it is a high-performance environment designed to mimic the intensity of a live sporting event. We are moving away from the "standard dashboard" aesthetic to create a **Digital Arena**—a space that feels premium, energetic, and authoritative. 

By leveraging intentional asymmetry, glassmorphism, and tonal layering, we break the "template" look. We favor breathing room over rigid borders and atmospheric depth over flat surfaces. The goal is to make the user feel like they are looking at a futuristic tactical display, where data is alive and every pick has weight.

---

## 2. Colors: Tonal Depth & Kinetic Energy
The palette is built on a foundation of deep ink, ignited by high-octane neon accents.

### Surface Hierarchy & Nesting (The "Physicality" of Data)
We avoid flat layouts. Treat the UI as a series of physical layers.
- **Base Layer:** `surface` (#131318) - The stadium floor.
- **Sectioning:** Use `surface_container_low` for large content areas.
- **Nesting:** Place `surface_container_high` cards inside `surface_container_low` sections to create a natural, "raised" lift.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to separate sections or list items. Boundaries are defined strictly through:
1. **Background Shifts:** A `surface_container_lowest` card sitting on a `surface_container` background.
2. **Negative Space:** Utilizing the `8` (2rem) and `12` (3rem) spacing tokens to create mental groupings.

### The "Glass & Gradient" Rule
To achieve the premium "Digital Arena" look, floating elements (modals, navigation bars, hover cards) must use **Glassmorphism**:
- **Fill:** `surface_container` at 60% opacity.
- **Effect:** `backdrop-filter: blur(20px)`.
- **Signature Soul:** Main CTAs should transition from `primary` (#b3c5ff) to `primary_container` (#0066ff) at a 135° angle to provide kinetic energy.

---

## 3. Typography: Editorial Authority
We pair the functional clarity of **Inter** with the aggressive, geometric character of **Space Grotesk** to create an editorial feel.

- **Display & Headlines (Space Grotesk):** Used for big wins, betting odds, and category headers. These should be tight-tracked (-2%) to feel dense and powerful.
- **Body & Labels (Inter):** Used for analytical data and descriptions. Inter provides the legibility required when reading rapid-fire betting stats.
- **Contrast as Hierarchy:** Use `display-lg` (3.5rem) for main pick percentages next to `label-sm` (0.6875rem) for legal disclaimers to create a sophisticated high-contrast scale.

---

## 4. Elevation & Depth: Atmospheric Layering
We do not "box" content; we "float" it.

- **The Layering Principle:** Depth is achieved by stacking `surface-container` tiers. 
    - *Example:* A betting slip (Highest) should feel "closer" to the user than the odds feed (Low).
- **Ambient Shadows (The Glow):** For primary actions, use "Glow Shadows." Instead of black, use a 10% opacity version of the `primary` (#0066FF) or `tertiary` (#00FF88) color with a 24px blur. This mimics the light of a stadium jumbotron.
- **The "Ghost Border" Fallback:** If a container needs more definition (e.g., on mobile), use the `outline_variant` token at **15% opacity**. Never use 100% opaque lines.

---

## 5. Components: Precision Tools

### Buttons (The "Actuator" Style)
- **Primary:** Gradient fill (`primary` to `primary_container`), `xl` (0.75rem) radius, with a subtle 2px inner glow on the top edge.
- **Secondary:** Glassmorphic fill (10% white) with a `Ghost Border` and white text.
- **States:** On hover, increase the shadow "glow" spread; on press, scale the component to 98%.

### Cards (The "Glass Plate" Style)
- **Structure:** No dividers. Use `surface_container_high`.
- **Radius:** Fixed at `xl` (0.75rem / 12px) for a modern, handheld feel.
- **Content:** Separate the "Sport Icon" from "Pick Data" using `spacing-6` (1.5rem) of empty space.

### Betting Chips & Tags
- **Status Tags:** Use `tertiary` (Neon Green) for "Winning" and `error` (Red) for "Loss." 
- **Typography:** Always `label-md` uppercase with +5% letter spacing for a technical look.

### Input Fields (The "Terminal" Style)
- **Surface:** `surface_container_lowest`.
- **Active State:** Border transitions to `primary` with a 4px soft outer glow. Use `title-sm` for user input text.

### Relevant App Components: "The Slip Tray"
A persistent, glassmorphic bottom sheet that tracks active picks. It uses `surface_container_highest` and a `backdrop-blur` of 30px to sit above the "noise" of the odds feed.

---

## 6. Do’s and Don’ts

### Do:
- **Use Intentional Asymmetry:** Align high-level stats to the left and secondary metadata to the right to guide the eye.
- **Embrace the Blur:** Use backdrop-blur on all overlays to maintain a sense of context within the app.
- **Use Tonal Shifting:** Change the background color of a list item on hover rather than adding a border.

### Don’t:
- **No Pure White Text:** Use `on_surface_variant` (#c2c6d8) for body text to reduce eye strain in dark environments. Save `on_primary_container` (#f8f7ff) for headlines.
- **No Heavy Shadows:** Avoid dark, muddy shadows. If it doesn't look like light is "bleeding" from the element, it's too heavy.
- **No Grid Rigidity:** Don't feel forced to align everything to a center axis. Let the sports icons breathe into the margins.