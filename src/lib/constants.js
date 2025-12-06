// Business constants for latex ordering system

// Container configuration (40-foot container)
export const DEFAULT_CONTAINER_SIZE = 340;

// Revenue-based sales scaling
export const MATTRESS_AVERAGE_PRICE = 2800; // Average price per mattress
export const WEEKS_PER_YEAR = 52;

// Annual revenue options ($3M to $4.5M in 5 increments)
export const ANNUAL_REVENUE_OPTIONS = [
  3000000,   // $3.0M
  3375000,   // $3.375M
  3750000,   // $3.75M
  4125000,   // $4.125M
  4500000    // $4.5M
];
export const DEFAULT_ANNUAL_REVENUE = 3000000; // Start at $3M
export const MIN_CONTAINER_SIZE = 100;
export const MAX_CONTAINER_SIZE = 500;

// Lead time configuration
export const LEAD_TIME_WEEKS = 12;
export const LEAD_TIME_MONTHS = 3.0;

// Safety buffer (months of extra coverage beyond lead time)
export const SAFETY_BUFFER_MONTHS = 1.0;

// Critical threshold: must have this many months coverage to avoid stockout during lead time
export const CRITICAL_THRESHOLD_MONTHS = LEAD_TIME_MONTHS + SAFETY_BUFFER_MONTHS; // 4 months

// Coverage thresholds for UI status
export const COVERAGE_THRESHOLDS = {
  CRITICAL: 2,    // Red - imminent stockout
  LOW: 3,         // Orange - needs attention
  WARNING: 4,     // Yellow - monitor
  HEALTHY: 5      // Green - good
};

// BASE monthly sales rates by size (at baseline revenue level)
// These are the "normal" rates that get scaled by revenue selection
export const BASE_MONTHLY_SALES_RATE = Object.freeze({
  Queen: 46,
  King: 34
});

export const BASE_TOTAL_MONTHLY_SALES = BASE_MONTHLY_SALES_RATE.Queen + BASE_MONTHLY_SALES_RATE.King; // 80

// BASE SKU-level monthly usage (at baseline revenue level)
export const BASE_SKU_MONTHLY_USAGE = Object.freeze({
  Queen: Object.freeze({ firm: 3, medium: 25, soft: 18 }),
  King: Object.freeze({ firm: 1, medium: 22, soft: 11 })
});

// Baseline annual revenue that the BASE rates represent
// 80/month = 20/week × $2,800 = $56,000/week × 52 = $2.912M/year
export const BASELINE_ANNUAL_REVENUE = 2912000;

// Function to calculate scaled usage rates based on selected annual revenue
export function getScaledUsageRates(annualRevenue) {
  const scaleFactor = annualRevenue / BASELINE_ANNUAL_REVENUE;
  const weeklyRevenue = annualRevenue / WEEKS_PER_YEAR;

  return {
    MONTHLY_SALES_RATE: {
      Queen: Math.round(BASE_MONTHLY_SALES_RATE.Queen * scaleFactor * 10) / 10,
      King: Math.round(BASE_MONTHLY_SALES_RATE.King * scaleFactor * 10) / 10
    },
    SKU_MONTHLY_USAGE: {
      Queen: {
        firm: Math.round(BASE_SKU_MONTHLY_USAGE.Queen.firm * scaleFactor * 10) / 10,
        medium: Math.round(BASE_SKU_MONTHLY_USAGE.Queen.medium * scaleFactor * 10) / 10,
        soft: Math.round(BASE_SKU_MONTHLY_USAGE.Queen.soft * scaleFactor * 10) / 10
      },
      King: {
        firm: Math.round(BASE_SKU_MONTHLY_USAGE.King.firm * scaleFactor * 10) / 10,
        medium: Math.round(BASE_SKU_MONTHLY_USAGE.King.medium * scaleFactor * 10) / 10,
        soft: Math.round(BASE_SKU_MONTHLY_USAGE.King.soft * scaleFactor * 10) / 10
      }
    },
    TOTAL_MONTHLY_SALES: Math.round(BASE_TOTAL_MONTHLY_SALES * scaleFactor * 10) / 10,
    weeklyRevenue: Math.round(weeklyRevenue),
    weeklyMattresses: Math.round(weeklyRevenue / MATTRESS_AVERAGE_PRICE * 10) / 10,
    annualRevenue,
    scaleFactor
  };
}

// For backwards compatibility - default rates at $3M/year
export const MONTHLY_SALES_RATE = getScaledUsageRates(DEFAULT_ANNUAL_REVENUE).MONTHLY_SALES_RATE;
export const SKU_MONTHLY_USAGE = getScaledUsageRates(DEFAULT_ANNUAL_REVENUE).SKU_MONTHLY_USAGE;
export const TOTAL_MONTHLY_SALES = getScaledUsageRates(DEFAULT_ANNUAL_REVENUE).TOTAL_MONTHLY_SALES;

// Firmness distribution ratios (what % of each size is each firmness)
export const FIRMNESS_DISTRIBUTION = Object.freeze({
  Queen: Object.freeze({
    firm: 3 / 46,     // 0.0652 (6.52%)
    medium: 25 / 46,  // 0.5435 (54.35%)
    soft: 18 / 46     // 0.3913 (39.13%)
  }),
  King: Object.freeze({
    firm: 1 / 34,     // 0.0294 (2.94%)
    medium: 22 / 34,  // 0.6471 (64.71%)
    soft: 11 / 34     // 0.3235 (32.35%)
  })
});

// Default starting inventory
export const DEFAULT_INVENTORY = Object.freeze({
  firm: Object.freeze({ Queen: 29, King: 21 }),
  medium: Object.freeze({ Queen: 64, King: 33 }),
  soft: Object.freeze({ Queen: 47, King: 30 })
});

// SKU list for iteration
export const SIZES = ['Queen', 'King'];
export const FIRMNESSES = ['firm', 'medium', 'soft'];

// Firmness display names
export const FIRMNESS_LABELS = Object.freeze({
  firm: 'Firm (90D)',
  medium: 'Medium (70D)',
  soft: 'Soft (55D)'
});
