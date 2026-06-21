import { generateMicroActions } from './recommendations';
import type { UserContext } from './recommendations';

/**
 * Builds a complete recommendation context while allowing targeted overrides.
 *
 * @param overrides - Partial context used to tailor the scenario under test.
 * @returns A fully populated user context fixture.
 */
function createContext(overrides: Partial<UserContext>): UserContext {
  return {
    householdType: 'apartment',
    workingFromHome: false,
    hasCar: false,
    transportMode: 'walk',
    showerMinutes: 8,
    apartmentSharedUtilities: true,
    ...overrides
  };
}

/**
 * Runs the full recommendations engine test suite.
 */
function runRecommendationsSuite(): void {
  it('prioritizes car bundling for drivers', testPrioritizesCarBundlingForDrivers);
  it('suggests building upgrades for apartment shared utilities', testSuggestsBuildingUpgradesForApartmentSharedUtilities);
  it('suggests thermostat savings for private apartment utilities', testSuggestsThermostatSavingsForPrivateApartmentUtilities);
  it('suggests device-free windows for work from home users', testSuggestsDeviceFreeWindowsForWorkFromHomeUsers);
  it('suggests shorter showers when shower time is high', testSuggestsShorterShowersWhenShowerTimeIsHigh);
}

/**
 * Confirms that car-heavy users receive the highest-priority transport action.
 */
function testPrioritizesCarBundlingForDrivers(): void {
  const context = createContext({
    householdType: 'house',
    workingFromHome: false,
    hasCar: true,
    transportMode: 'car',
    apartmentSharedUtilities: false
  });

  const actions = generateMicroActions(context);
  expect(actions[0].title).toContain('Bundle errands');
  expect(actions[0].impact).toBe('high');
}

/**
 * Confirms that apartment dwellers with shared utilities see collective upgrade guidance.
 */
function testSuggestsBuildingUpgradesForApartmentSharedUtilities(): void {
  const context = createContext({
    householdType: 'apartment',
    workingFromHome: false,
    hasCar: false,
    transportMode: 'public-transit',
    apartmentSharedUtilities: true
  });

  const actions = generateMicroActions(context);
  expect(actions[1].title).toContain('LED common areas');
}

/**
 * Confirms that apartment users with private utilities get a thermostat-oriented suggestion.
 */
function testSuggestsThermostatSavingsForPrivateApartmentUtilities(): void {
  const context = createContext({
    householdType: 'apartment',
    workingFromHome: false,
    hasCar: false,
    transportMode: 'walk',
    apartmentSharedUtilities: false
  });

  const actions = generateMicroActions(context);
  expect(actions[1].title).toContain('Lower cooling use');
}

/**
 * Confirms that work-from-home users receive a device-consolidation suggestion.
 */
function testSuggestsDeviceFreeWindowsForWorkFromHomeUsers(): void {
  const context = createContext({
    householdType: 'apartment',
    workingFromHome: true,
    hasCar: false,
    transportMode: 'bike',
    apartmentSharedUtilities: true
  });

  const actions = generateMicroActions(context);
  expect(actions[2].title).toContain('device-free power window');
}

/**
 * Confirms that long showers trigger the hot-water reduction recommendation.
 */
function testSuggestsShorterShowersWhenShowerTimeIsHigh(): void {
  const context = createContext({
    householdType: 'apartment',
    workingFromHome: false,
    hasCar: false,
    transportMode: 'walk',
    showerMinutes: 15,
    apartmentSharedUtilities: true
  });

  const actions = generateMicroActions(context);
  expect(actions[2].title).toContain('Cut your shower');
}

describe('Recommendations Engine', runRecommendationsSuite);
