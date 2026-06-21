import { calculateDailyEmissions, formatKg } from './carbon';
import type { DailyActivity } from './carbon';

describe('Carbon Calculations', () => {
  describe('calculateDailyEmissions', () => {
    it('returns zero emissions for zero activity', () => {
      const activity: DailyActivity = {
        electricityKwh: 0,
        transportMiles: 0,
        transportMode: 'walk',
        mealsWithMeat: 0,
        wasteBags: 0
      };

      const result = calculateDailyEmissions(activity);
      expect(result.totalKg).toBe(0);
      expect(result.electricityKg).toBe(0);
      expect(result.transportKg).toBe(0);
      expect(result.foodKg).toBe(0);
      expect(result.wasteKg).toBe(0);
    });

    it('calculates electricity emissions correctly', () => {
      const activity: DailyActivity = {
        electricityKwh: 10,
        transportMiles: 0,
        transportMode: 'walk',
        mealsWithMeat: 0,
        wasteBags: 0
      };

      const result = calculateDailyEmissions(activity);
      expect(result.electricityKg).toBeCloseTo(3.85, 1);
    });

    it('calculates car transport emissions correctly', () => {
      const activity: DailyActivity = {
        electricityKwh: 0,
        transportMiles: 10,
        transportMode: 'car',
        mealsWithMeat: 0,
        wasteBags: 0
      };

      const result = calculateDailyEmissions(activity);
      expect(result.transportKg).toBeCloseTo(4.04, 1);
    });

    it('calculates ride-share transport emissions correctly', () => {
      const activity: DailyActivity = {
        electricityKwh: 0,
        transportMiles: 10,
        transportMode: 'ride-share',
        mealsWithMeat: 0,
        wasteBags: 0
      };

      const result = calculateDailyEmissions(activity);
      expect(result.transportKg).toBeCloseTo(2.7, 1);
    });

    it('calculates public transit emissions correctly', () => {
      const activity: DailyActivity = {
        electricityKwh: 0,
        transportMiles: 10,
        transportMode: 'public-transit',
        mealsWithMeat: 0,
        wasteBags: 0
      };

      const result = calculateDailyEmissions(activity);
      expect(result.transportKg).toBeCloseTo(1.1, 1);
    });

    it('returns zero for walk and bike transport', () => {
      const walk: DailyActivity = {
        electricityKwh: 0,
        transportMiles: 10,
        transportMode: 'walk',
        mealsWithMeat: 0,
        wasteBags: 0
      };

      const bike: DailyActivity = {
        electricityKwh: 0,
        transportMiles: 10,
        transportMode: 'bike',
        mealsWithMeat: 0,
        wasteBags: 0
      };

      expect(calculateDailyEmissions(walk).transportKg).toBe(0);
      expect(calculateDailyEmissions(bike).transportKg).toBe(0);
    });

    it('calculates food emissions correctly', () => {
      const activity: DailyActivity = {
        electricityKwh: 0,
        transportMiles: 0,
        transportMode: 'walk',
        mealsWithMeat: 2,
        wasteBags: 0
      };

      const result = calculateDailyEmissions(activity);
      expect(result.foodKg).toBeCloseTo(1.8, 1);
    });

    it('calculates waste emissions correctly', () => {
      const activity: DailyActivity = {
        electricityKwh: 0,
        transportMiles: 0,
        transportMode: 'walk',
        mealsWithMeat: 0,
        wasteBags: 3
      };

      const result = calculateDailyEmissions(activity);
      expect(result.wasteKg).toBeCloseTo(0.36, 2);
    });

    it('sums all categories correctly', () => {
      const activity: DailyActivity = {
        electricityKwh: 5,
        transportMiles: 5,
        transportMode: 'car',
        mealsWithMeat: 1,
        wasteBags: 1
      };

      const result = calculateDailyEmissions(activity);
      const sum = result.electricityKg + result.transportKg + result.foodKg + result.wasteKg;
      expect(result.totalKg).toBeCloseTo(sum, 5);
    });

    it('clamps negative input values to zero', () => {
      const activity: DailyActivity = {
        electricityKwh: -5,
        transportMiles: -10,
        transportMode: 'walk',
        mealsWithMeat: -2,
        wasteBags: -1
      };

      const result = calculateDailyEmissions(activity);
      expect(result.totalKg).toBe(0);
    });
  });

  describe('formatKg', () => {
    it('formats positive values correctly', () => {
      expect(formatKg(1.234)).toBe('1.23 kg CO2e');
      expect(formatKg(0.5)).toBe('0.50 kg CO2e');
    });

    it('formats zero correctly', () => {
      expect(formatKg(0)).toBe('0.00 kg CO2e');
    });
  });
});
