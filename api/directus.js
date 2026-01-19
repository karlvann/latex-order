const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

// Latex SKU IDs to fetch from Directus
const LATEX_SKUS = [
  'latexfirmqueen',
  'latexfirmking',
  'latexmediumqueen',
  'latexmediumking',
  'latexsoftqueen',
  'latexsoftking'
];

// Parse mattress SKU format: {range}{firmness}{size}
// e.g., "cloud3kingsingle", "aurora12double", "cooper15queen"
function parseOrderSKU(sku) {
  if (!sku || typeof sku !== 'string') return null;

  const lowerSku = sku.toLowerCase();

  // Check if it's a mattress SKU (starts with cloud, aurora, or cooper)
  const rangeMatch = lowerSku.match(/^(cloud|aurora|cooper)/);
  if (!rangeMatch) return null;

  // Extract firmness level (number after range name)
  const firmnessMatch = lowerSku.match(/^(?:cloud|aurora|cooper)(\d+)/);
  if (!firmnessMatch) return null;

  const firmnessLevel = parseInt(firmnessMatch[1], 10);

  // Extract size (everything after the number)
  const sizeMatch = lowerSku.match(/^(?:cloud|aurora|cooper)\d+(single|kingsingle|double|queen|king)$/);
  if (!sizeMatch) return null;

  const size = sizeMatch[1];

  // Map firmness level to latex type
  // 2-7 = soft, 8-12 = medium, 13-19 = firm
  let latexFirmness;
  if (firmnessLevel >= 2 && firmnessLevel <= 7) {
    latexFirmness = 'soft';
  } else if (firmnessLevel >= 8 && firmnessLevel <= 12) {
    latexFirmness = 'medium';
  } else if (firmnessLevel >= 13 && firmnessLevel <= 19) {
    latexFirmness = 'firm';
  } else {
    return null; // Invalid firmness level
  }

  // Map mattress size to latex size
  // queen, double, kingsingle → Queen latex
  // king, single → King latex
  let latexSize;
  if (size === 'queen' || size === 'double' || size === 'kingsingle') {
    latexSize = 'Queen';
  } else if (size === 'king' || size === 'single') {
    latexSize = 'King';
  } else {
    return null;
  }

  return { latexFirmness, latexSize };
}

// Calculate demand from orders (60-day lookback → monthly rate)
function calculateDemandFromOrders(orders) {
  // Initialize counters
  const demand = {
    firm: { Queen: 0, King: 0 },
    medium: { Queen: 0, King: 0 },
    soft: { Queen: 0, King: 0 }
  };

  // Count latex usage from each order
  for (const order of orders) {
    if (!order.skus || !Array.isArray(order.skus)) continue;

    for (const skuItem of order.skus) {
      // Navigate the m2m structure: skus[].skus_id.sku
      const skuValue = skuItem?.skus_id?.sku;
      const parsed = parseOrderSKU(skuValue);

      if (parsed) {
        demand[parsed.latexFirmness][parsed.latexSize]++;
      }
    }
  }

  // Convert to monthly rate (30 days / lookbackDays)
  // For 42 days: 30/42 ≈ 0.714
  const lookbackDays = 42;
  const monthlyMultiplier = 30 / lookbackDays;

  const monthlyDemand = {
    firm: {
      Queen: Math.round(demand.firm.Queen * monthlyMultiplier * 10) / 10,
      King: Math.round(demand.firm.King * monthlyMultiplier * 10) / 10
    },
    medium: {
      Queen: Math.round(demand.medium.Queen * monthlyMultiplier * 10) / 10,
      King: Math.round(demand.medium.King * monthlyMultiplier * 10) / 10
    },
    soft: {
      Queen: Math.round(demand.soft.Queen * monthlyMultiplier * 10) / 10,
      King: Math.round(demand.soft.King * monthlyMultiplier * 10) / 10
    }
  };

  return {
    rawCounts: demand,
    monthlyUsage: monthlyDemand,
    periodDays: lookbackDays
  };
}

async function fetchInventory() {
  const filter = LATEX_SKUS.map(s => `"${s}"`).join(',');
  const url = `${DIRECTUS_URL}/items/skus?filter[sku][_in]=[${filter}]&fields=sku,quantity`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Directus error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const items = data.data || [];

  // Transform to app format
  const inventory = {
    firm: { Queen: 0, King: 0 },
    medium: { Queen: 0, King: 0 },
    soft: { Queen: 0, King: 0 }
  };

  for (const item of items) {
    const sku = item.sku?.toLowerCase();
    const qty = parseInt(item.quantity, 10) || 0;

    if (sku === 'latexfirmqueen') inventory.firm.Queen = qty;
    else if (sku === 'latexfirmking') inventory.firm.King = qty;
    else if (sku === 'latexmediumqueen') inventory.medium.Queen = qty;
    else if (sku === 'latexmediumking') inventory.medium.King = qty;
    else if (sku === 'latexsoftqueen') inventory.soft.Queen = qty;
    else if (sku === 'latexsoftking') inventory.soft.King = qty;
  }

  return inventory;
}

async function fetchSales() {
  // Calculate lookback period (42 days = 6 weeks)
  const lookbackDays = 42;
  const lookbackDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

  // Fetch orders with mattress SKUs
  // Filter: payment_status = paid, subtotal > 0, date_created >= lookback date
  const url = `${DIRECTUS_URL}/items/orders?filter[payment_status][_eq]=paid&filter[subtotal][_gt]=0&filter[date_created][_gte]=${lookbackDate}&fields=id,date_created,skus.skus_id.sku&limit=1000`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Directus error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const orders = data.data || [];

  // Filter to orders that contain at least one mattress SKU
  const mattressOrders = orders.filter(order => {
    if (!order.skus || !Array.isArray(order.skus)) return false;
    return order.skus.some(skuItem => {
      const skuValue = skuItem?.skus_id?.sku;
      return skuValue && /^(cloud|aurora|cooper)/i.test(skuValue);
    });
  });

  return calculateDemandFromOrders(mattressOrders);
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type } = req.query;

  try {
    if (type === 'inventory') {
      const inventory = await fetchInventory();
      return res.status(200).json(inventory);
    }

    if (type === 'sales') {
      const sales = await fetchSales();
      return res.status(200).json(sales);
    }

    // Default: fetch both
    const [inventory, sales] = await Promise.all([
      fetchInventory(),
      fetchSales()
    ]);

    return res.status(200).json({ inventory, sales });

  } catch (error) {
    console.error('Directus API error:', error);
    return res.status(500).json({ error: 'Failed to fetch from Directus', message: error.message });
  }
}
