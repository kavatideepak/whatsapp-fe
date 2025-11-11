
---

#### 2. `.github/DESIGN_SYSTEM.md`
> **Purpose:** Makes Copilot’s UI generations consistent — spacing, fonts, radii, shadows, etc.

```markdown
# 🎨 Synapse Design System

Copilot Agents must follow these UI and styling rules to ensure a consistent look across components.

## 🧱 Base Style Tokens

| Property | Light | Dark |
|-----------|--------|------|
| Background | #FFFFFF | #000000 |
| Text Primary | #000000 | #FFFFFF |
| Accent | #007AFF | #0A84FF |
| Card | #F7F7F7 | #1C1C1E |

## 🔤 Typography
| Type | Font Size | Weight |
|------|------------|--------|
| Heading | 24px | 700 |
| Subheading | 18px | 600 |
| Body | 16px | 400 |
| Caption | 14px | 400 |

## 📏 Layout Spacing
Use multiples of **8px** for padding and margins:

## 🧩 Border Radius
Small: 8px
Medium: 12px
Large: 20px
Button: 50px (rounded)


## 🌫️ Shadows (Elevation)
Light mode: rgba(0,0,0,0.1)
Dark mode: rgba(255,255,255,0.08)

perl
Copy code

## 🧠 Copilot Rules
- Always use theme colors (no hardcoded hex values)
- Always apply `borderRadius` and consistent padding
- Avoid inline styles; use a `styles.js` file
- Include responsiveness via `Dimensions` or `useWindowDimensions`