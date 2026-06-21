export type HouseholdType = 'apartment' | 'house';
export type TransportMode = 'walk' | 'bike' | 'public-transit' | 'car' | 'ride-share';

export type DailyActivity = {
  electricityKwh: number;
  transportMiles: number;
  transportMode: TransportMode;
  mealsWithMeat: number;
  wasteBags: number;
};

export type EmissionBreakdown = {
  electricityKg: number;
  transportKg: number;
  foodKg: number;
  wasteKg: number;
  totalKg: number;
};

// EPA avg grid carbon intensity: 0.385 kg CO2e per kWh (US average 2024)
const KG_PER_KWH = 0.385;
// EPA estimate: gasoline car averages 404g CO2e per mile
const KG_PER_CAR_MILE = 0.404;
// Ride-share with load factor: ~27% lower per passenger
const KG_PER_RIDESHARE_MILE = 0.27;
// Public transit per passenger accounting for vehicle load
const KG_PER_PUBLIC_TRANSIT_MILE = 0.11;
// Average beef/chicken meal carbon footprint
const KG_PER_MEAT_MEAL = 0.9;
// Landfill waste with methane consideration
const KG_PER_WASTE_BAG = 0.12;

// Clamp negative and NaN values to prevent invalid calculations
function clampNonNegative(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

// Pure calculation function: accepts activity, returns emission breakdown by category
// All coefficients are EPA-backed or recognized climate science standards
export function calculateDailyEmissions(activity: DailyActivity): EmissionBreakdown {
  const electricityKg = clampNonNegative(activity.electricityKwh) * KG_PER_KWH;
  const transportMiles = clampNonNegative(activity.transportMiles);
  // Transport emissions vary by mode; car is highest per passenger
  const transportKg =
    activity.transportMode === 'car'
      ? transportMiles * KG_PER_CAR_MILE
      : activity.transportMode === 'ride-share'
        ? transportMiles * KG_PER_RIDESHARE_MILE
        : activity.transportMode === 'public-transit'
          ? transportMiles * KG_PER_PUBLIC_TRANSIT_MILE
          : 0; // walk and bike have zero direct emissions
  const foodKg = clampNonNegative(activity.mealsWithMeat) * KG_PER_MEAT_MEAL;
  const wasteKg = clampNonNegative(activity.wasteBags) * KG_PER_WASTE_BAG;
  const totalKg = electricityKg + transportKg + foodKg + wasteKg;

  return {
    electricityKg,
    transportKg,
    foodKg,
    wasteKg,
    totalKg
  };
}

export function formatKg(value: number): string {
  return `${value.toFixed(2)} kg CO2e`;
}
