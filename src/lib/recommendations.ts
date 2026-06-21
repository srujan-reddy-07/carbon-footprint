import type { HouseholdType, TransportMode } from './carbon';\n\n// User context captures household and lifestyle signals used to generate personalized recommendations.\n// These are dynamic inputs that can be updated as the user interacts.\nexport type UserContext = {\n  householdType: HouseholdType;\n  workingFromHome: boolean;\n  hasCar: boolean;\n  transportMode: TransportMode;\n  showerMinutes: number;\n  apartmentSharedUtilities: boolean;\n};\n\nexport type MicroAction = {\n  title: string;\n  reason: string;\n  impact: 'high' | 'medium' | 'low';\n};

function buildTransportAction(context: UserContext): MicroAction {
  if (context.transportMode === 'car' || context.hasCar) {
    return {
      title: 'Bundle errands into one car trip',
      reason: 'Combining trips cuts repeated cold starts and reduces unnecessary driving.',
      impact: 'high'
    };
  }

  if (context.transportMode === 'ride-share') {
    return {
      title: 'Switch one ride-share trip to transit each day',
      reason: 'Public transit spreads emissions across more passengers per mile.',
      impact: 'high'
    };
  }

  if (context.transportMode === 'public-transit') {
    return {
      title: 'Pair transit with a short walk or bike ride',
      reason: 'Replacing even a short segment with active travel lowers per-trip emissions.',
      impact: 'medium'
    };
  }

  return {
    title: 'Keep the low-carbon commute habit',
    reason: 'Walking and biking already keep transport emissions near zero.',
    impact: 'high'
  };
}

function buildHomeAction(context: UserContext): MicroAction {
  if (context.householdType === 'house') {
    return {
      title: 'Seal one drafty window or door this week',
      reason: 'Detached homes usually lose more heating and cooling energy through air leaks.',
      impact: 'high'
    };
  }

  if (context.apartmentSharedUtilities) {
    return {
      title: 'Ask building management about LED common areas',
      reason: 'Shared spaces often offer the fastest low-friction efficiency upgrades.',
      impact: 'medium'
    };
  }

  return {
    title: 'Lower cooling use by 1 degree for one hour tonight',
    reason: 'Small thermostat adjustments create measurable savings without changing routine.',
    impact: 'medium'
  };
}

function buildLifestyleAction(context: UserContext): MicroAction {
  if (context.workingFromHome) {
    return {
      title: 'Schedule one device-free power window today',
      reason: 'Shifting screen and appliance use to a shorter window makes idle energy easier to avoid.',
      impact: 'low'
    };
  }

  if (context.showerMinutes > 10) {
    return {
      title: 'Cut your shower by 2 minutes tomorrow',
      reason: 'Hot water is an easy daily source of emissions, and small reductions add up fast.',
      impact: 'medium'
    };
  }

  return {
    title: 'Keep your daily routine stable and track one new habit',
    reason: 'Consistency makes carbon tracking meaningful because changes are easier to compare.',
    impact: 'low'
  };
}

export function generateMicroActions(context: UserContext): MicroAction[] {
  return [buildTransportAction(context), buildHomeAction(context), buildLifestyleAction(context)];
}
