/// <reference types="jest" />

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
  it('suggests transit for rideshare commuters', testSuggestsTransitForRideshareCommuters);
  it('suggests active travel integration for public transit commuters', testSuggestsActiveTravelForPublicTransitCommuters);
  it('suggests maintaining walk and bike habits', testSuggestsMaintainingWalkAndBikeHabits);
  it('suggests draft sealing for houses', testSuggestsDraftSealingForHouses);
  it('suggests baseline lifestyle routines for other users', testSuggestsBaselineLifestyleRoutinesForOtherUsers);
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

/**
 * Confirms that ride-share users are suggested to switch to public transit.
 */
function testSuggestsTransitForRideshareCommuters(): void {
  const context = createContext({
    householdType: 'apartment',
    workingFromHome: false,
    hasCar: false,
    transportMode: 'ride-share'
  });

  const actions = generateMicroActions(context);
  expect(actions[0].title).toContain('Switch one ride-share trip');
  expect(actions[0].impact).toBe('high');
}

/**
 * Confirms that transit commuters are suggested to add walk/bike segments.
 */
function testSuggestsActiveTravelForPublicTransitCommuters(): void {
  const context = createContext({
    householdType: 'apartment',
    workingFromHome: false,
    hasCar: false,
    transportMode: 'public-transit'
  });

  const actions = generateMicroActions(context);
  expect(actions[0].title).toContain('Pair transit with a short walk or bike');
  expect(actions[0].impact).toBe('medium');
}

/**
 * Confirms that walkers/bikers are encouraged to keep their habits.
 */
function testSuggestsMaintainingWalkAndBikeHabits(): void {
  const context = createContext({
    householdType: 'apartment',
    workingFromHome: false,
    hasCar: false,
    transportMode: 'walk'
  });

  const actions = generateMicroActions(context);
  expect(actions[0].title).toContain('Keep the low-carbon commute');
  expect(actions[0].impact).toBe('high');
}

/**
 * Confirms that detached houses are suggested window/door drafting seals.
 */
function testSuggestsDraftSealingForHouses(): void {
  const context = createContext({
    householdType: 'house',
    workingFromHome: false,
    hasCar: false,
    transportMode: 'walk'
  });

  const actions = generateMicroActions(context);
  expect(actions[1].title).toContain('Seal one drafty window');
  expect(actions[1].impact).toBe('high');
}

/**
 * Confirms that other users receive the default lifestyle routine maintenance guidance.
 */
function testSuggestsBaselineLifestyleRoutinesForOtherUsers(): void {
  const context = createContext({
    householdType: 'apartment',
    workingFromHome: false,
    hasCar: false,
    transportMode: 'walk',
    showerMinutes: 5,
    apartmentSharedUtilities: false
  });

  const actions = generateMicroActions(context);
  expect(actions[2].title).toContain('Keep your daily routine stable');
  expect(actions[2].impact).toBe('low');
}

describe('Recommendations Engine', runRecommendationsSuite);
