// Business constants for latex ordering system

// Container configuration (40-foot container)
export const DEFAULT_CONTAINER_SIZE = 340
export const MIN_CONTAINER_SIZE = 100
export const MAX_CONTAINER_SIZE = 500

// Lead time configuration
export const LEAD_TIME_WEEKS = 12
export const LEAD_TIME_MONTHS = 3.0

// Safety buffer (months of extra coverage beyond lead time)
export const SAFETY_BUFFER_MONTHS = 1.0

// Critical threshold: must have this many months coverage to avoid stockout during lead time
export const CRITICAL_THRESHOLD_MONTHS = LEAD_TIME_MONTHS + SAFETY_BUFFER_MONTHS // 4 months

// Coverage thresholds for UI status
export const COVERAGE_THRESHOLDS = {
  CRITICAL: 2,    // Red - imminent stockout
  LOW: 3,         // Orange - needs attention
  WARNING: 4,     // Yellow - monitor
  HEALTHY: 5      // Green - good
}

// Default starting inventory (used as fallback if Directus fetch fails)
export const DEFAULT_INVENTORY = Object.freeze({
  firm: Object.freeze({ Queen: 0, King: 0 }),
  medium: Object.freeze({ Queen: 0, King: 0 }),
  soft: Object.freeze({ Queen: 0, King: 0 })
})

// Default usage rates (used as fallback if Directus fetch fails)
export const DEFAULT_USAGE_RATES = Object.freeze({
  SKU_MONTHLY_USAGE: Object.freeze({
    Queen: Object.freeze({ firm: 3, medium: 25, soft: 18 }),
    King: Object.freeze({ firm: 2, medium: 21, soft: 11 })
  }),
  TOTAL_MONTHLY_SALES: 80,
  periodDays: 60
})

// SKU list for iteration
export const SIZES = ['Queen', 'King']
export const FIRMNESSES = ['firm', 'medium', 'soft']

// Firmness display names
export const FIRMNESS_LABELS = Object.freeze({
  firm: 'Firm (90D)',
  medium: 'Medium (70D)',
  soft: 'Soft (55D)'
})
