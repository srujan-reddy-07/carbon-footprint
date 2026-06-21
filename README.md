# Carbon Footprint Awareness Platform

**Chosen Vertical:** [Challenge 3] Carbon Footprint Awareness Platform

A conversational carbon awareness coach and interactive tracking platform built with Next.js and TypeScript. The application combines a natural chat tracker, a real-time emissions estimator, and a rule-based recommendation engine.

---

## Chosen Vertical
[Challenge 3] Carbon Footprint Awareness Platform

## Our Approach
Conversational AI coaching that dynamically switches logic based on user housing/transport contexts. The profile signals (household type, transport habits, WFH state) are used by the adaptive inference engine to determine custom recommendations and recalculate carbon scores in real time.

---

## File Structure
```text
src/
  app/
    globals.css             # Premium glassmorphic design variables & micro-animations
    layout.tsx              # Application layout & SEO Metadata
    page.tsx                # Next.js page route entry
  components/
    carbon-assistant.tsx    # Responsive panels, theme toggle, & React State logic
  lib/
    carbon.ts               # Pure emissions logic & mathematical conversions
    carbon.test.ts          # Unit tests verifying categories, modes, & boundary cases
    recommendations.ts      # Custom lifestyle recommendation rules
    recommendations.test.ts # Tests verifying all branch permutations of rules
    carbon-assistant.test.tsx # Component tests for UI, actions, inputs & resets
```

---

## Scientific Assumptions & Formulas
The emissions calculation relies on standardized, EPA-aligned conversion coefficients to compute carbon output in kilograms of CO2 equivalent (kg CO2e):

- **Electricity Usage**: 
  - Formula: `Electricity (kWh) * 0.385 kg CO2e`
  - *Assumption*: Based on the EPA average US grid carbon intensity value (2024).
- **Transport Emissions**: 
  - **Car**: `Miles * 0.404 kg CO2e` (Average US gasoline vehicle emissions per mile).
  - **Ride-share**: `Miles * 0.27 kg CO2e` (~27% lower than a solo car due to passenger load sharing).
  - **Public Transit**: `Miles * 0.11 kg CO2e` (City transit standard averages per passenger mile).
  - **Walk / Bike**: `Miles * 0.00 kg CO2e` (Zero tailpipe greenhouse gas emissions).
- **Food & Diet**: 
  - Formula: `Meals with Meat * 0.9 kg CO2e`
  - *Assumption*: Based on average beef/chicken blend footprint per meal.
- **Landfill Waste**:
  - Formula: `Waste Bags * 0.12 kg CO2e`
  - *Assumption*: Standard domestic waste bags accounting for methane decay.
- **Input Clamping**:
  - *Assumption*: Negative, invalid, or non-finite inputs (like `NaN` or `Infinity`) are clamped to `0` to keep calculations stable and prevent dashboard crashes.

---

## Testing & Quality Control
The application features a test suite with 100% branch and line coverage for the core libraries, plus standalone component integration tests.

### Run Unit Tests
To run the full suite, execute:
```bash
npm test
```

### Coverage Scope:
- **`carbon.ts` tests**: Zero-activity cases, category breakdowns, transport modes, negative bound clamping, and non-finite number boundary safety (`NaN`/`Infinity`).
- **`recommendations.ts` tests**: Dynamic recommendation branches for drivers, transit users, active travel commuters, apartment building upgrades, private utility thermostat settings, device-free WFH windows, water-use shower reductions, and stable lifestyle baseline suggestions.
- **`carbon-assistant.test.tsx` tests**: Renders the complete dashboard, clicks chat suggestions to update history, changes numeric inputs, and verifies that the reset trigger properly cleans up conversation context.

---

## Accessibility Compliance
- **Landmark Mapping**: Major sections use semantic `<header>`, `<main>`, and `<section>` containers with explicit accessibility headings (`aria-labelledby`).
- **Associated Controls**: All form inputs are associated with their respective labels via unique `id` and `htmlFor` pairings.
- **Hidden Text**: Vision-impaired badges and visual-only icons are labeled with `aria-label="High impact badge"` to ensure clean screen reader flows.
- **Visible Focus Outline**: High-contrast 3px focus rings are applied globally to inputs, selects, and buttons.

---

## Deployment & Production Build
Designed for fast loading on Vercel:
```bash
npm run build
npm start
```
The project maintains a single git branch and operates strictly under 10 MB.
