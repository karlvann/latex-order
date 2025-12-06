// Coverage-Equalized Ordering Algorithm
// Prioritizes stockout prevention by equalizing months-of-coverage across all SKUs

import {
  SIZES,
  FIRMNESSES,
  SKU_MONTHLY_USAGE as DEFAULT_SKU_MONTHLY_USAGE,
  MONTHLY_SALES_RATE as DEFAULT_MONTHLY_SALES_RATE,
  CRITICAL_THRESHOLD_MONTHS,
  FIRMNESS_DISTRIBUTION
} from './constants';

/**
 * Calculate months of coverage for a specific SKU
 * @param {number} stock - Current stock level
 * @param {string} size - 'Queen' or 'King'
 * @param {string} firmness - 'firm', 'medium', or 'soft'
 * @param {object} usageRates - Optional custom usage rates (from getScaledUsageRates)
 * @returns {number} Months of coverage (clamped to 0 minimum)
 */
export function calculateSKUCoverage(stock, size, firmness, usageRates = null) {
  const SKU_MONTHLY_USAGE = usageRates?.SKU_MONTHLY_USAGE || DEFAULT_SKU_MONTHLY_USAGE;
  const monthlyUsage = SKU_MONTHLY_USAGE[size]?.[firmness];

  // Guard against invalid data
  if (!monthlyUsage || monthlyUsage <= 0) return Infinity;
  if (typeof stock !== 'number' || isNaN(stock)) return 0;

  const coverage = stock / monthlyUsage;
  return Math.max(0, coverage); // Never return negative coverage
}

/**
 * Calculate aggregate coverage for a size (Queen or King)
 * @param {object} inventory - Full inventory object
 * @param {string} size - 'Queen' or 'King'
 * @param {object} usageRates - Optional custom usage rates (from getScaledUsageRates)
 * @returns {number} Months of coverage
 */
export function calculateSizeCoverage(inventory, size, usageRates = null) {
  const MONTHLY_SALES_RATE = usageRates?.MONTHLY_SALES_RATE || DEFAULT_MONTHLY_SALES_RATE;

  const totalStock = FIRMNESSES.reduce((sum, f) => {
    const stock = inventory[f]?.[size];
    return sum + (typeof stock === 'number' && !isNaN(stock) ? Math.max(0, stock) : 0);
  }, 0);

  const monthlySales = MONTHLY_SALES_RATE[size];
  if (!monthlySales || monthlySales <= 0) return 0;

  return totalStock / monthlySales;
}

/**
 * Get coverage for all SKUs
 * @param {object} inventory - Full inventory object
 * @param {object} usageRates - Optional custom usage rates (from getScaledUsageRates)
 * @returns {object} Coverage by SKU { Queen_firm: 2.5, ... }
 */
export function getAllSKUCoverages(inventory, usageRates = null) {
  const coverages = {};

  for (const size of SIZES) {
    for (const firmness of FIRMNESSES) {
      const key = `${size}_${firmness}`;
      const stock = inventory[firmness]?.[size] ?? 0;
      coverages[key] = calculateSKUCoverage(stock, size, firmness, usageRates);
    }
  }

  return coverages;
}

/**
 * Find the SKU with lowest coverage
 * @param {object} coverages - Coverage by SKU
 * @returns {{ key: string, coverage: number }} Lowest coverage SKU
 */
function findLowestCoverageSKU(coverages) {
  let minKey = null;
  let minCoverage = Infinity;

  for (const [key, coverage] of Object.entries(coverages)) {
    if (coverage < minCoverage) {
      minCoverage = coverage;
      minKey = key;
    }
  }

  return { key: minKey, coverage: minCoverage };
}

/**
 * Coverage-Equalized Ordering Algorithm
 *
 * Distributes container capacity to equalize months-of-coverage across all SKUs,
 * prioritizing those closest to stockout.
 *
 * @param {object} inventory - Current inventory levels
 * @param {number} containerSize - Container capacity (e.g., 340)
 * @param {object} usageRates - Optional custom usage rates (from getScaledUsageRates)
 * @returns {{ order: object, metadata: object }} Order quantities and analysis metadata
 */
export function calculateCoverageEqualizedOrder(inventory, containerSize, usageRates = null) {
  const SKU_MONTHLY_USAGE = usageRates?.SKU_MONTHLY_USAGE || DEFAULT_SKU_MONTHLY_USAGE;

  // Validate inputs
  const validContainerSize = Math.max(0, Math.round(containerSize) || 0);

  if (validContainerSize === 0) {
    return {
      order: createEmptyOrder(),
      metadata: {
        warning: 'Container size is 0',
        totalOrdered: 0,
        coveragesBefore: getAllSKUCoverages(inventory, usageRates),
        coveragesAfter: getAllSKUCoverages(inventory, usageRates)
      }
    };
  }

  // Initialize order
  const order = createEmptyOrder();
  let remaining = validContainerSize;

  // Calculate current coverages
  const currentCoverages = getAllSKUCoverages(inventory, usageRates);

  // Check if all SKUs are already above critical threshold
  const allHealthy = Object.values(currentCoverages).every(c => c >= CRITICAL_THRESHOLD_MONTHS);

  // Phase 1: Cover critical deficits (SKUs below threshold)
  const criticalSKUs = [];
  for (const [key, coverage] of Object.entries(currentCoverages)) {
    if (coverage < CRITICAL_THRESHOLD_MONTHS) {
      const [size, firmness] = key.split('_');
      const monthlyUsage = SKU_MONTHLY_USAGE[size][firmness];
      const deficit = (CRITICAL_THRESHOLD_MONTHS - coverage) * monthlyUsage;
      criticalSKUs.push({ key, size, firmness, coverage, deficit: Math.ceil(deficit) });
    }
  }

  // Sort by urgency (lowest coverage first)
  criticalSKUs.sort((a, b) => a.coverage - b.coverage);

  // Allocate to critical SKUs first
  const totalCriticalDeficit = criticalSKUs.reduce((sum, s) => sum + s.deficit, 0);

  if (totalCriticalDeficit >= remaining) {
    // Triage mode: not enough capacity for all critical SKUs
    // Prioritize by urgency (lowest coverage first)
    for (const sku of criticalSKUs) {
      const allocation = Math.min(sku.deficit, remaining);
      order[sku.firmness][sku.size] = allocation;
      remaining -= allocation;
      if (remaining <= 0) break;
    }
  } else {
    // Can cover all critical deficits
    for (const sku of criticalSKUs) {
      order[sku.firmness][sku.size] = sku.deficit;
      remaining -= sku.deficit;
    }

    // Phase 2: Equalize coverage with remaining capacity
    // Create projected coverages after critical allocation
    const projectedCoverages = { ...currentCoverages };
    for (const sku of criticalSKUs) {
      const monthlyUsage = SKU_MONTHLY_USAGE[sku.size][sku.firmness];
      projectedCoverages[sku.key] = (inventory[sku.firmness][sku.size] + order[sku.firmness][sku.size]) / monthlyUsage;
    }

    // Iteratively equalize coverage
    let iterations = 0;
    const MAX_ITERATIONS = 200; // Prevent infinite loops (increased for edge cases)

    while (remaining > 0 && iterations < MAX_ITERATIONS) {
      iterations++;

      // Find SKU with lowest projected coverage
      const { key: minKey, coverage: minCoverage } = findLowestCoverageSKU(projectedCoverages);
      if (!minKey) break;

      const [size, firmness] = minKey.split('_');
      const monthlyUsage = SKU_MONTHLY_USAGE[size][firmness];

      // Find second-lowest coverage (target to equalize to)
      let secondMinCoverage = Infinity;
      for (const [key, coverage] of Object.entries(projectedCoverages)) {
        if (key !== minKey && coverage < secondMinCoverage) {
          secondMinCoverage = coverage;
        }
      }

      // If all equal, add 1 month worth to lowest
      if (secondMinCoverage === Infinity || secondMinCoverage === minCoverage) {
        secondMinCoverage = minCoverage + 1;
      }

      // Calculate pieces needed to reach second-lowest coverage
      const piecesToEqualize = Math.ceil((secondMinCoverage - minCoverage) * monthlyUsage);
      const allocation = Math.min(Math.max(1, piecesToEqualize), remaining);

      order[firmness][size] += allocation;
      projectedCoverages[minKey] = (inventory[firmness][size] + order[firmness][size]) / monthlyUsage;
      remaining -= allocation;
    }
  }

  // Final adjustment: ensure we use exactly containerSize (handle rounding)
  const totalOrdered = getTotalOrdered(order);
  const difference = validContainerSize - totalOrdered;

  if (difference !== 0) {
    // Add/subtract from SKU with lowest projected coverage
    const projectedCoverages = {};
    for (const size of SIZES) {
      for (const firmness of FIRMNESSES) {
        const key = `${size}_${firmness}`;
        const stock = (inventory[firmness]?.[size] ?? 0) + order[firmness][size];
        const monthlyUsage = SKU_MONTHLY_USAGE[size][firmness];
        projectedCoverages[key] = stock / monthlyUsage;
      }
    }

    const { key: targetKey } = findLowestCoverageSKU(projectedCoverages);
    if (targetKey) {
      const [size, firmness] = targetKey.split('_');
      order[firmness][size] = Math.max(0, order[firmness][size] + difference);
    }
  }

  // Calculate final coverages
  const coveragesAfter = {};
  for (const size of SIZES) {
    for (const firmness of FIRMNESSES) {
      const key = `${size}_${firmness}`;
      const finalStock = (inventory[firmness]?.[size] ?? 0) + order[firmness][size];
      coveragesAfter[key] = calculateSKUCoverage(finalStock, size, firmness, usageRates);
    }
  }

  return {
    order,
    metadata: {
      totalOrdered: getTotalOrdered(order),
      containerSize: validContainerSize,
      coveragesBefore: currentCoverages,
      coveragesAfter,
      allHealthyBefore: allHealthy,
      criticalSKUCount: criticalSKUs.length,
      warning: allHealthy && validContainerSize > 0
        ? 'All SKUs already have healthy coverage. This order will increase buffer stock.'
        : null
    }
  };
}

/**
 * Create an empty order object
 */
export function createEmptyOrder() {
  return {
    firm: { Queen: 0, King: 0 },
    medium: { Queen: 0, King: 0 },
    soft: { Queen: 0, King: 0 }
  };
}

/**
 * Get total units in an order
 */
export function getTotalOrdered(order) {
  let total = 0;
  for (const firmness of FIRMNESSES) {
    for (const size of SIZES) {
      const qty = order[firmness]?.[size];
      if (typeof qty === 'number' && !isNaN(qty)) {
        total += Math.max(0, qty);
      }
    }
  }
  return total;
}

/**
 * Calculate stock projection over time
 * @param {object} inventory - Current inventory
 * @param {object} order - Order quantities
 * @param {number} months - Number of months to project
 * @param {object} usageRates - Optional custom usage rates (from getScaledUsageRates)
 * @returns {array} Monthly projections
 */
export function calculateProjection(inventory, order, months = 12, usageRates = null) {
  const SKU_MONTHLY_USAGE = usageRates?.SKU_MONTHLY_USAGE || DEFAULT_SKU_MONTHLY_USAGE;
  const projections = [];

  for (let month = 0; month <= months; month++) {
    const monthData = { month };

    for (const size of SIZES) {
      for (const firmness of FIRMNESSES) {
        const key = `${size}_${firmness}`;
        const initialStock = inventory[firmness]?.[size] ?? 0;
        const monthlyUsage = SKU_MONTHLY_USAGE[size][firmness];
        const orderQty = order[firmness]?.[size] ?? 0;

        let stock;
        if (month === 0) {
          stock = initialStock;
        } else if (month < 3) {
          // Before container arrival
          stock = initialStock - (monthlyUsage * month);
        } else if (month === 3) {
          // Container arrival
          stock = initialStock - (monthlyUsage * 3) + orderQty;
        } else {
          // After container arrival
          const stockAtArrival = initialStock - (monthlyUsage * 3) + orderQty;
          stock = stockAtArrival - (monthlyUsage * (month - 3));
        }

        monthData[key] = Math.round(stock);
      }
    }

    projections.push(monthData);
  }

  return projections;
}

/**
 * Find when first stockout occurs
 * @param {array} projections - From calculateProjection
 * @returns {{ sku: string, month: number } | null}
 */
export function findFirstStockout(projections) {
  for (const monthData of projections) {
    for (const size of SIZES) {
      for (const firmness of FIRMNESSES) {
        const key = `${size}_${firmness}`;
        if (monthData[key] < 0) {
          return {
            sku: key,
            month: monthData.month,
            size,
            firmness
          };
        }
      }
    }
  }
  return null;
}

/**
 * Apply an order to current inventory (simulating container arrival)
 * @param {object} inventory - Current inventory
 * @param {object} order - Order quantities
 * @returns {object} New inventory after order applied
 */
export function applyOrderToInventory(inventory, order) {
  const newInventory = {};

  for (const firmness of FIRMNESSES) {
    newInventory[firmness] = {};
    for (const size of SIZES) {
      const currentStock = inventory[firmness]?.[size] ?? 0;
      const orderQty = order[firmness]?.[size] ?? 0;
      newInventory[firmness][size] = Math.max(0, currentStock + orderQty);
    }
  }

  return newInventory;
}
