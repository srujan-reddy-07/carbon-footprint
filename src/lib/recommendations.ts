import type { HouseholdType, TransportMode } from './carbon';

// User context captures household and lifestyle signals used to generate personalized recommendations.
// These are dynamic inputs that can be updated as the user interacts with the app.
export type UserContext = {
  householdType: HouseholdType;
  workingFromHome: boolean;
  hasCar: boolean;
  transportMode: TransportMode;
  showerMinutes: number;
  apartmentSharedUtilities: boolean;
};

export type MicroAction = {
  title: string;
  reason: string;
  impact: 'high' | 'medium' | 'low';
};

/**
 * Generates the transport-focused recommendation for the current context.
 *
 * Business logic:
 * - Car ownership gets the highest-impact suggestion because vehicle miles dominate transport emissions.
 * - Ride-share users are nudged toward transit because shared public transport is still more efficient.
 * - Transit and active-travel users get maintenance suggestions that preserve low-carbon habits.
 *
 * @param context - Current household and transport context.
 * @returns One prioritized transport recommendation.
 */
function buildTransportAction(context: UserContext): MicroAction {
  // Car owners: highest per-mile emissions (0.404 kg/mi), so trip bundling has outsized impact.
  if (context.transportMode === 'car' || context.hasCar) {
    return {
      title: 'Bundle errands into one car trip',
      reason: 'Combining trips cuts cold-start waste and repeated acceleration.',
      impact: 'high'
    };
  }

  // Ride-share: per-passenger emissions are lower than a solo car, but transit is still better.
  if (context.transportMode === 'ride-share') {
    return {
      title: 'Switch one ride-share trip to transit each day',
      reason: 'Transit spreads vehicle emissions across many passengers per vehicle.',
      impact: 'high'
    };
  }

  // Transit users: last-mile optimization is the remaining lever.
  if (context.transportMode === 'public-transit') {
    return {
      title: 'Pair transit with a short walk or bike ride',
      reason: 'Replacing even a short segment with active travel cuts per-trip carbon.',
      impact: 'medium'
    };
  }

  // Walk/bike baseline: reinforce the already-low-carbon behavior.
  return {
    title: 'Keep the low-carbon commute habit',
    reason: 'Walking and biking already keep transport emissions near zero.',
    impact: 'high'
  };
}

/**
 * Generates the home-energy recommendation for the current context.
 *
 * Business logic:
 * - Houses get sealing/efficiency guidance because envelope losses are usually larger.
 * - Apartments with shared utilities get building-management suggestions with collective leverage.
 * - Other apartments get quick thermostat adjustments because they are low-friction and actionable.
 *
 * @param context - Current household and home-utility context.
 * @returns One prioritized home-efficiency recommendation.
 */
function buildHomeAction(context: UserContext): MicroAction {
  // Houses lose more energy through air leaks; sealing is high-ROI.
  if (context.householdType === 'house') {
    return {
      title: 'Seal one drafty window or door this week',
      reason: 'Detached homes usually lose more heating and cooling energy through air leaks.',
      impact: 'high'
    };
  }

  // Apartment dwellers with shared utilities: focus on collective building upgrades.
  if (context.apartmentSharedUtilities) {
    return {
      title: 'Ask building management about LED common areas',
      reason: 'Shared spaces often offer the fastest low-friction efficiency upgrades.',
      impact: 'medium'
    };
  }

  // Private apartment utilities: thermostat tweaks are the fastest low-friction win.
  return {
    title: 'Lower cooling use by 1 degree for one hour tonight',
    reason: 'Small thermostat adjustments create measurable savings without changing routine.',
    impact: 'medium'
  };
}

/**
 * Generates the lifestyle recommendation for the current context.
 *
 * Business logic:
 * - Work-from-home users are nudged toward device consolidation to avoid idle energy waste.
 * - Longer showers are targeted because hot-water use is a daily, easy-to-change emissions source.
 * - Stable routines are preserved otherwise so the user can compare future changes meaningfully.
 *
 * @param context - Current lifestyle context from the assistant.
 * @returns One prioritized lifestyle recommendation.
 */
function buildLifestyleAction(context: UserContext): MicroAction {
  // WFH workers: concentrated screen and appliance use beats always-on gadgets.
  if (context.workingFromHome) {
    return {
      title: 'Schedule one device-free power window today',
      reason: 'Grouping screen time and appliance use cuts idle energy waste.',
      impact: 'low'
    };
  }

  // Long showers: water heating is a major daily emission source.
  if (context.showerMinutes > 10) {
    return {
      title: 'Cut your shower by 2 minutes tomorrow',
      reason: 'Hot water heating is an easy daily source; small reductions compound.',
      impact: 'medium'
    };
  }

  // Default: consistency enables future tracking and comparison of changes.
  return {
    title: 'Keep your daily routine stable and track one new habit',
    reason: 'Consistency makes carbon tracking meaningful; changes are easier to compare.',
    impact: 'low'
  };
}

/**
 * Builds the full ranked set of micro-actions for the user.
 *
 * @param context - Current user profile and activity signals.
 * @returns Exactly three recommendations covering transport, home, and lifestyle.
 */
export function generateMicroActions(context: UserContext): MicroAction[] {
  return [buildTransportAction(context), buildHomeAction(context), buildLifestyleAction(context)];
}
