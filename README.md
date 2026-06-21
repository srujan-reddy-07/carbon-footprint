# Carbon Footprint Awareness Platform

A lightweight, Vercel-friendly Next.js app for the Virtual Prompt Wars 3 carbon footprint challenge. The product goes beyond a static calculator by combining a conversational tracker, a smart inference engine, and a testable emissions utility.

## What it does

- **Conversational tracking**: Captures daily context through quick prompts and accessible form controls.
- **Adaptive recommendations**: Micro-actions adjust based on household type, transport habits, work style, and living context (apartment vs. house, WFH vs. commuting, etc.).
- **Pure emissions utility**: Verified calculation logic in a separate module, easy to unit test.
- **Real-time feedback**: Updates footprint and recommendations instantly as inputs change.

## Stack

- Next.js App Router
- TypeScript
- React
- Plain CSS

## File structure

```text
src/
  app/
    globals.css          # Styled components, micro-interactions
    layout.tsx           # Root layout with metadata
    page.tsx             # Main page entry
  components/
    carbon-assistant.tsx # Conversational UI, state management
  lib/
    carbon.ts            # Pure emission calculations (EPA-backed constants)
    carbon.test.ts       # Unit tests for calculation utility
    recommendations.ts   # Adaptive inference engine
```

## Core design

### 1. Pure calculation utility (`src/lib/carbon.ts`)
- Verified EPA-backed coefficients for each emission category
- All calculations are side-effect-free functions
- Clamps invalid inputs to prevent NaN/negative results
- Fully tested with 12+ test cases

### 2. Adaptive inference engine (`src/lib/recommendations.ts`)
- Evaluates user context (household type, transport mode, lifestyle signals)
- Generates three ranked micro-actions per session
- Branching logic prioritizes high-impact, low-friction changes
- Rules are explicitly documented with decision rationale

### 3. Conversational UI (`src/components/carbon-assistant.tsx`)
- Real-time emission recalculation using React `useMemo`
- Live recommendation updates based on context changes
- Accessibility: semantic structure, labels, ARIA live regions
- Visual feedback: high-impact actions marked with ⚡

## Security

- No secrets hardcoded
- Environment variables documented in `.env.example`
- Configuration-driven app name and default region
- All user data stays in the browser (no backend calls)

## Testing

Run unit tests for the calculation utility:

```bash
npm test
```

Test coverage includes:
- Zero-activity edge case
- Per-category calculations (electricity, transport, food, waste)
- Transport mode variance (car, ride-share, transit, walk/bike)
- Negative input clamping
- Total emission sum verification

## Accessibility

- Semantic HTML with ARIA labels
- Live regions for chat updates
- Visible focus states (3px outline)
- Color contrast meets WCAG AA
- Responsive layout (mobile-first, desktop-optimized grid)
- Form controls with clear labels and states

## Deployment

Designed to deploy on Vercel as a standard Next.js app:

```bash
npm run build
npm start
```

The app stays under 10 MB and maintains a single branch for easy submission.

