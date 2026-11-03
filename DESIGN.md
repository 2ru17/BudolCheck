# BudolCheck Design System Specification

## 1. Aesthetic Direction and Brand Philosophy
* **Application Name:** BudolCheck
* **Tagline:** "Check First. Budol Later."
* **Design Archetype:** Warm Editorial Neo-Brutalist Craft
* **Primary Audience:** Online shoppers, small-to-medium legitimate merchants, and platform moderators inspecting product listings across Shopee, Lazada, TikTok Shop, and Temu.
* **Core Visual Thesis:** Unlike cold corporate dashboards, BudolCheck pairs a warm paper-like cream canvas (`#F7F3E8`) with organic forest-to-sage green gradients (`#3E5634` to `#789668`), crisp white content surfaces (`#FFFFFF`), and tactile `1.5px` dark charcoal borders (`#2C2623`).

---

## 2. Color Tokens

| Token Name | CSS Variable | Hex | RGB | Role and Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Warm Cream** | `--bg-cream` | `#F7F3E8` | `247, 243, 232` | Primary application background across desktop and mobile viewports. |
| **Sand Doodle Line** | `--bg-pattern` | `#E4DEC8` | `228, 222, 200` | Low-opacity vector retail pattern and subtle Haikei SVG wave accents. |
| **Crisp White** | `--surface-white` | `#FFFFFF` | `255, 255, 255` | Card surfaces, modal sheets, input fields, and navigation docks. |
| **Deep Charcoal Brown** | `--border-ink` | `#2C2623` | `44, 38, 35` | `1.5px` structural card borders, primary typography, and vector strokes. |
| **Forest Olive Green** | `--grad-start` | `#3E5634` | `62, 86, 52` | Start stop of primary CTA buttons (`Get started`, `Next`) and Hero Banner. |
| **Soft Sage Green** | `--grad-end` | `#789668` | `120, 150, 104` | End stop of primary CTA buttons, brand wordmark accent, and active pills. |
| **Active Pill Olive** | `--pill-active` | `#4B6440` | `75, 100, 64` | Active sub-tab background (`Overview`, `Reviews`, `Similar`) and selected filters. |
| **Peach Shopping Bag** | `--mascot-peach` | `#FAD6B8` | `250, 214, 184` | Primary body fill for the 3D and vector shopping bag mascot. |
| **Warm Gold** | `--star-gold` | `#F5B82E` | `245, 184, 46` | Star rating icons (`4.9 / 5`, `4.8 / 5`) and review breakdown bars. |
| **Coral Red** | `--red-flag` | `#D9383A` | `217, 56, 58` | Discount badges (`-29%`, `-60%`), high-risk alerts, and Budol Red Flags. |
| **Caution Amber** | `--caution-amber` | `#D97706` | `217, 119, 6` | Moderate caution indicators, urgency warnings, and pending verification items. |
| **Confirmation Green** | `--verified-green` | `#3B6E38` | `59, 110, 56` | Verified seller checkmarks and passed scorecard items. |
| **Warm Slate Gray** | `--text-secondary` | `#6E6A66` | `110, 106, 102` | Secondary metadata, masked usernames (`c**y`), and sold counters. |

---

## 3. Typography and Numeric Discipline

### 3.1 Font Families
* **Brand Wordmark (`--font-brand`):** `'Quicksand', sans-serif` (Bold `700`) for the dual-tone `BudolCheck` logotype.
* **Editorial Headings (`--font-serif`):** `'Fraunces', 'Merriweather', Georgia, serif` (Bold `700` to ExtraBold `800`) for screen titles, card headers, and primary pill buttons.
* **Interface and Body Copy (`--font-sans`):** `'Inter', system-ui, -apple-system, sans-serif` (Regular `400` to Bold `700`) for product specifications, customer reviews, form controls, and filter chips.

### 3.2 Text Wrapping and Numeric Rules
* **Headings:** Apply `text-wrap: balance` to all `h1`, `h2`, `h3`, and Bento card titles to prevent single-word orphans.
* **Body and Descriptions:** Apply `text-wrap: pretty` to review comments, warning descriptions, and educational guide paragraphs.
* **Tabular Numerals:** Apply `font-variant-numeric: tabular-nums` to all prices (`₱1,234.56`), discount badges (`-60%`), star ratings (`4.9/5`), review counts (`172.1K`), countdown timers, and risk scores (`65/100`) so digits align vertically and never shift layout during updates.
* **Font Smoothing:** Root `html` enforces `-webkit-font-smoothing: antialiased` and `-moz-osx-font-smoothing: grayscale`.

---

## 4. Geometry, Borders, and Elevation

### 4.1 Concentric Border Radii
Nested rounded containers follow the optical concentric radius formula:
```text
R_outer = R_inner + padding
```
* **Outer Card Container:** `border-radius: 16px` with `padding: 16px` (`14px` on compact mobile cards).
* **Nested Media / Thumbnail Box:** `border-radius: 8px` (`16px - 8px` inner visual offset).
* **Primary and Secondary Action Pills:** `border-radius: 9999px` (full capsule).

### 4.2 Borders and Shadows
* **Primary Card Outline:** `1.5px solid #2C2623`.
* **Elevated Neo-Brutalist Shadow:** `2px 2px 0px #2C2623` on interactive Bento cards and primary buttons; `3px 3px 0px rgba(44, 38, 35, 0.9)` on focal summary cards.
* **Media Outlines:** All product thumbnails and buyer review photos include `outline: 1px solid rgba(0, 0, 0, 0.1); outline-offset: -1px;` so light product edges remain distinct against white cards.

### 4.3 Interactive Hit Targets
* Every interactive button, icon toggle, sub-tab pill, filter chip, and bottom navigation item maintains a minimum clickable hit target of `44x44px` on touchscreens (`40x40px` minimum on desktop compact controls).

---

## 5. Motion, 3D, and Mobile GPU Stability

### 5.1 Transition Rules
* **Explicit Properties Only:** Never use `transition: all`. Always declare explicit properties:
  ```css
  transition-property: transform, opacity, background-color, border-color, box-shadow;
  transition-duration: 160ms;
  transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  ```
* **Tactile Press Feedback:** Interactive cards and buttons shift by `transform: translate(1px, 1px)` or `scale(0.98)` on active press.
* **Reduced Motion:** Respect `@media (prefers-reduced-motion: reduce)` and Motion's `useReducedMotion()` hook by collapsing spatial translations into `120ms` opacity fades.

### 5.2 3D Canvas and Shader Guardrails
* **Single WebGL Context Limit:** At most 1 WebGL context may be mounted at any time.
* **Pixel Ratio Cap:** `@react-three/fiber` canvases cap device pixel ratio to `dpr={[1, 1.5]}` with `powerPreference: "low-power"` on mobile viewports to prevent mobile GPU memory exhaustion.
* **Automatic Vector Fallback:** Every 3D component is wrapped in a React `<ErrorBoundary>` and listens for `webglcontextlost`, falling back immediately to a vector SVG illustration if the device throttles WebGL.
* **Mobile Hero Backdrop:** Mobile screens (`< 768px`) use hardware-accelerated CSS and Haikei SVG layered waves instead of fragment shaders.

---

## 6. Responsive Viewport Architecture
* **Desktop and Laptop (`>= 768px`):**
  - Top navigation bar with brand identity, quick screen navigation, role switcher (`Shopper`, `Seller`, `Admin`), and saved items trigger.
  - Multi-column Bento dashboard (3-column feature grid, side-by-side product overview and verification modules).
* **Mobile (`< 768px`):**
  - Uses `min-height: 100dvh` and `padding-bottom: calc(76px + env(safe-area-inset-bottom))` to prevent mobile browser toolbars from clipping content.
  - Renders the 7-screen mobile layout with the persistent bottom dock (`Home`, `History`, `Saved`, `Profile`).
