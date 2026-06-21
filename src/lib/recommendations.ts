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

// Inference engine: evaluates user context and generates ranked micro-actions.
// Rules prioritize high-impact changes that fit the user's lifestyle constraints.
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

// Generate three highest-priority micro-actions based on user context.
export function generateMicroActions(context: UserContext): MicroAction[] {
  return [buildTransportAction(context), buildHomeAction(context), buildLifestyleAction(context)];
}
