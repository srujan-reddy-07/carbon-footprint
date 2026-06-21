import { calculateDailyEmissions, formatKg } from './carbon';
import type { DailyActivity } from './carbon';

/**
 * Builds a complete activity fixture while allowing callers to override only the fields they care about.
 *
 * @param overrides - Partial activity data used to tailor a test fixture.
 * @returns A fully populated activity object for emissions tests.
 */
function createActivity(overrides: Partial<DailyActivity>): DailyActivity {
  return {
    electricityKwh: 0,
    transportMiles: 0,
    transportMode: 'walk',
    mealsWithMeat: 0,
    wasteBags: 0,
    ...overrides
  };
}

/**
 * Runs the complete carbon calculation test suite.
 */
function runCarbonCalculationsSuite(): void {
  describe('calculateDailyEmissions', calculateDailyEmissionsSuite);
  describe('formatKg', formatKgSuite);
}

/**
 * Verifies the emissions calculator across all supported activity categories.
 */
function calculateDailyEmissionsSuite(): void {
  /**
   * Confirms that zero activity stays at zero across every category.
   */
  function testReturnsZeroEmissionsForZeroActivity(): void {
    const activity = createActivity({});

    const result = calculateDailyEmissions(activity);
    expect(result.totalKg).toBe(0);
    expect(result.electricityKg).toBe(0);
    expect(result.transportKg).toBe(0);
    expect(result.foodKg).toBe(0);
    expect(result.wasteKg).toBe(0);
  }

  /**
   * Confirms that electricity is multiplied by the expected grid factor.
   */
  function testCalculatesElectricityEmissionsCorrectly(): void {
    const activity = createActivity({ electricityKwh: 10 });

    const result = calculateDailyEmissions(activity);
    expect(result.electricityKg).toBeCloseTo(3.85, 1);
  }

  /**
   * Confirms that car transport uses the highest transport coefficient.
   */
  function testCalculatesCarTransportEmissionsCorrectly(): void {
    const activity = createActivity({ transportMiles: 10, transportMode: 'car' });

    const result = calculateDailyEmissions(activity);
    expect(result.transportKg).toBeCloseTo(4.04, 1);
  }

  /**
   * Confirms that ride-share transport uses the shared-ride coefficient.
   */
  function testCalculatesRideShareTransportEmissionsCorrectly(): void {
    const activity = createActivity({ transportMiles: 10, transportMode: 'ride-share' });

    const result = calculateDailyEmissions(activity);
    expect(result.transportKg).toBeCloseTo(2.7, 1);
  }

  /**
   * Confirms that public transit uses the lower shared-vehicle coefficient.
   */
  function testCalculatesPublicTransitEmissionsCorrectly(): void {
    const activity = createActivity({ transportMiles: 10, transportMode: 'public-transit' });

    const result = calculateDailyEmissions(activity);
    expect(result.transportKg).toBeCloseTo(1.1, 1);
  }

  /**
   * Confirms that walk and bike are treated as zero direct transport emissions.
   */
  function testReturnsZeroForWalkAndBikeTransport(): void {
    const walk = createActivity({ transportMiles: 10, transportMode: 'walk' });
    const bike = createActivity({ transportMiles: 10, transportMode: 'bike' });

    expect(calculateDailyEmissions(walk).transportKg).toBe(0);
    expect(calculateDailyEmissions(bike).transportKg).toBe(0);
  }

  /**
   * Confirms that food-based emissions use the per-meal coefficient.
   */
  function testCalculatesFoodEmissionsCorrectly(): void {
    const activity = createActivity({ mealsWithMeat: 2 });

    const result = calculateDailyEmissions(activity);
    expect(result.foodKg).toBeCloseTo(1.8, 1);
  }

  /**
   * Confirms that waste bags contribute the expected landfill emissions.
   */
  function testCalculatesWasteEmissionsCorrectly(): void {
    const activity = createActivity({ wasteBags: 3 });

    const result = calculateDailyEmissions(activity);
    expect(result.wasteKg).toBeCloseTo(0.36, 2);
  }

  /**
   * Confirms that the total equals the sum of all category breakdowns.
   */
  function testSumsAllCategoriesCorrectly(): void {
    const activity = createActivity({
      electricityKwh: 5,
      transportMiles: 5,
      transportMode: 'car',
      mealsWithMeat: 1,
      wasteBags: 1
    });

    const result = calculateDailyEmissions(activity);
    const sum = result.electricityKg + result.transportKg + result.foodKg + result.wasteKg;
    expect(result.totalKg).toBeCloseTo(sum, 5);
  }

  /**
   * Confirms that invalid negative input is clamped to a safe value.
   */
  function testClampsNegativeInputValuesToZero(): void {
    const activity = createActivity({
      electricityKwh: -5,
      transportMiles: -10,
      transportMode: 'walk',
      mealsWithMeat: -2,
      wasteBags: -1
    });

    const result = calculateDailyEmissions(activity);
    expect(result.totalKg).toBe(0);
  }

  it('returns zero emissions for zero activity', testReturnsZeroEmissionsForZeroActivity);
  it('calculates electricity emissions correctly', testCalculatesElectricityEmissionsCorrectly);
  it('calculates car transport emissions correctly', testCalculatesCarTransportEmissionsCorrectly);
  it('calculates ride-share transport emissions correctly', testCalculatesRideShareTransportEmissionsCorrectly);
  it('calculates public transit emissions correctly', testCalculatesPublicTransitEmissionsCorrectly);
  it('returns zero for walk and bike transport', testReturnsZeroForWalkAndBikeTransport);
  it('calculates food emissions correctly', testCalculatesFoodEmissionsCorrectly);
  it('calculates waste emissions correctly', testCalculatesWasteEmissionsCorrectly);
  it('sums all categories correctly', testSumsAllCategoriesCorrectly);
  it('clamps negative input values to zero', testClampsNegativeInputValuesToZero);
}

/**
 * Verifies that the formatting helper renders a stable UI label.
 */
function formatKgSuite(): void {
  /**
   * Confirms that positive decimal values render with two fixed decimals.
   */
  function testFormatsPositiveValuesCorrectly(): void {
    expect(formatKg(1.234)).toBe('1.23 kg CO2e');
    expect(formatKg(0.5)).toBe('0.50 kg CO2e');
  }

  /**
   * Confirms that zero still renders a fully formatted label.
   */
  function testFormatsZeroCorrectly(): void {
    expect(formatKg(0)).toBe('0.00 kg CO2e');
  }

  it('formats positive values correctly', testFormatsPositiveValuesCorrectly);
  it('formats zero correctly', testFormatsZeroCorrectly);
}

describe('Carbon Calculations', runCarbonCalculationsSuite);
