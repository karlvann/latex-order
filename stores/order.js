import { SIZES, FIRMNESSES, DEFAULT_CONTAINER_SIZE } from '~/utils/constants'
import { calculateCoverageEqualizedOrder, getTotalOrdered } from '~/utils/algorithms'

const LATEX_SKUS = [
  'latexfirmqueen',
  'latexfirmking',
  'latexmediumqueen',
  'latexmediumking',
  'latexsoftqueen',
  'latexsoftking'
]

// Map firmness number to display category (for Top Products)
function getFirmnessCategory(level) {
  if (level >= 2 && level <= 4) return 'Soft'
  if (level >= 5 && level <= 7) return 'Medium'
  if (level >= 8 && level <= 10) return 'Firm'
  if (level >= 11 && level <= 13) return 'Very Firm'
  if (level >= 14 && level <= 19) return 'Super Firm'
  return null
}

// Parse mattress SKU format: {range}{firmness}{size}
function parseOrderSKU(sku) {
  if (!sku || typeof sku !== 'string') return null

  const lowerSku = sku.toLowerCase()

  const rangeMatch = lowerSku.match(/^(cloud|aurora|cooper)/)
  if (!rangeMatch) return null

  const range = rangeMatch[1]

  const firmnessMatch = lowerSku.match(/^(?:cloud|aurora|cooper)(\d+)/)
  if (!firmnessMatch) return null

  const firmnessLevel = parseInt(firmnessMatch[1], 10)

  const sizeMatch = lowerSku.match(/^(?:cloud|aurora|cooper)\d+(single|kingsingle|double|queen|king)$/)
  if (!sizeMatch) return null

  const size = sizeMatch[1]

  let latexFirmness
  if (firmnessLevel >= 2 && firmnessLevel <= 7) {
    latexFirmness = 'soft'
  } else if (firmnessLevel >= 8 && firmnessLevel <= 12) {
    latexFirmness = 'medium'
  } else if (firmnessLevel >= 13 && firmnessLevel <= 19) {
    latexFirmness = 'firm'
  } else {
    return null
  }

  let latexSize
  if (size === 'queen' || size === 'double' || size === 'kingsingle' || size === 'single') {
    latexSize = 'Queen'
  } else if (size === 'king') {
    latexSize = 'King'
  } else {
    return null
  }

  const firmnessCategory = getFirmnessCategory(firmnessLevel)
  const displayRange = range.charAt(0).toUpperCase() + range.slice(1)
  const displaySize = size.charAt(0).toUpperCase() + size.slice(1)

  return { latexFirmness, latexSize, displayRange, displaySize, firmnessCategory }
}

// Calculate demand from orders
function calculateDemandFromOrders(orders) {
  const demand = {
    firm: { Queen: 0, King: 0 },
    medium: { Queen: 0, King: 0 },
    soft: { Queen: 0, King: 0 }
  }

  const topProducts = {}

  for (const order of orders) {
    if (!order.skus || !Array.isArray(order.skus)) continue

    for (const skuItem of order.skus) {
      const skuValue = skuItem?.skus_id?.sku
      const parsed = parseOrderSKU(skuValue)

      if (parsed) {
        demand[parsed.latexFirmness][parsed.latexSize]++

        const productKey = `${parsed.displayRange} ${parsed.displaySize} ${parsed.firmnessCategory}`
        topProducts[productKey] = (topProducts[productKey] || 0) + 1
      }
    }
  }

  const topProductsList = Object.entries(topProducts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  const lookbackDays = 42
  const monthlyMultiplier = 30 / lookbackDays

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
  }

  return {
    rawCounts: demand,
    monthlyUsage: monthlyDemand,
    periodDays: lookbackDays,
    topProducts: topProductsList
  }
}

const cloneInventory = () => ({
  firm: { Queen: 0, King: 0 },
  medium: { Queen: 0, King: 0 },
  soft: { Queen: 0, King: 0 }
})

const cloneUsageRates = () => ({
  SKU_MONTHLY_USAGE: {
    Queen: { firm: 3, medium: 25, soft: 18 },
    King: { firm: 2, medium: 21, soft: 11 }
  },
  TOTAL_MONTHLY_SALES: 80,
  periodDays: 60,
  rawCounts: null,
  topProducts: []
})

export const useOrderStore = defineStore('order', {
  state: () => ({
    inventory: cloneInventory(),
    containerSize: DEFAULT_CONTAINER_SIZE,
    usageRates: cloneUsageRates(),
    isLoading: true,
    error: null,
    lastFetched: null
  }),

  getters: {
    orderResult: (state) => {
      return calculateCoverageEqualizedOrder(state.inventory, state.containerSize, state.usageRates)
    },

    order: (state) => {
      const result = calculateCoverageEqualizedOrder(state.inventory, state.containerSize, state.usageRates)
      return result.order
    },

    orderMetadata: (state) => {
      const result = calculateCoverageEqualizedOrder(state.inventory, state.containerSize, state.usageRates)
      return result.metadata
    },

    totalOrdered: (state) => {
      const result = calculateCoverageEqualizedOrder(state.inventory, state.containerSize, state.usageRates)
      return getTotalOrdered(result.order)
    },

    totalInventory: (state) => {
      return FIRMNESSES.reduce((sum, f) =>
        sum + SIZES.reduce((s, sz) => s + (state.inventory[f]?.[sz] || 0), 0), 0)
    },

    formattedLastFetched: (state) => {
      if (!state.lastFetched) return ''
      return new Date(state.lastFetched).toLocaleTimeString('en-AU', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  },

  actions: {
    setContainerSize(size) {
      this.containerSize = size
    },

    async fetchDirectusData() {
      this.isLoading = true
      this.error = null

      const { getItems } = useDirectusItems()

      try {
        // Fetch inventory
        const skuData = await getItems({
          collection: 'skus',
          params: {
            filter: {
              sku: { _in: LATEX_SKUS }
            },
            fields: ['sku', 'quantity']
          }
        })

        const inventory = cloneInventory()
        for (const item of skuData || []) {
          const sku = item.sku?.toLowerCase()
          const qty = Math.round(parseFloat(item.quantity) || 0)

          if (sku === 'latexfirmqueen') inventory.firm.Queen = qty
          else if (sku === 'latexfirmking') inventory.firm.King = qty
          else if (sku === 'latexmediumqueen') inventory.medium.Queen = qty
          else if (sku === 'latexmediumking') inventory.medium.King = qty
          else if (sku === 'latexsoftqueen') inventory.soft.Queen = qty
          else if (sku === 'latexsoftking') inventory.soft.King = qty
        }
        this.inventory = inventory

        // Fetch sales (42-day lookback)
        const lookbackDays = 42
        const lookbackDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString()

        const orderData = await getItems({
          collection: 'orders',
          params: {
            filter: {
              payment_status: { _eq: 'paid' },
              subtotal: { _gt: 0 },
              date_created: { _gte: lookbackDate }
            },
            fields: ['id', 'date_created', 'skus.skus_id.sku'],
            limit: 1000
          }
        })

        const mattressOrders = (orderData || []).filter(order => {
          if (!order.skus || !Array.isArray(order.skus)) return false
          return order.skus.some(skuItem => {
            const skuValue = skuItem?.skus_id?.sku
            return skuValue && /^(cloud|aurora|cooper)/i.test(skuValue)
          })
        })

        const sales = calculateDemandFromOrders(mattressOrders)

        // Transform to expected format
        const monthlyUsage = sales.monthlyUsage
        const SKU_MONTHLY_USAGE = {
          Queen: {
            firm: monthlyUsage.firm?.Queen || 0,
            medium: monthlyUsage.medium?.Queen || 0,
            soft: monthlyUsage.soft?.Queen || 0
          },
          King: {
            firm: monthlyUsage.firm?.King || 0,
            medium: monthlyUsage.medium?.King || 0,
            soft: monthlyUsage.soft?.King || 0
          }
        }

        const totalMonthly = Object.values(SKU_MONTHLY_USAGE).reduce((sum, size) =>
          sum + Object.values(size).reduce((s, v) => s + v, 0), 0)

        this.usageRates = {
          SKU_MONTHLY_USAGE,
          TOTAL_MONTHLY_SALES: totalMonthly,
          periodDays: sales.periodDays || 60,
          rawCounts: sales.rawCounts,
          topProducts: sales.topProducts || []
        }

        this.lastFetched = new Date().toISOString()
      } catch (err) {
        console.error('Failed to fetch from Directus:', err)
        this.error = err.message || 'Failed to fetch data'
      }

      this.isLoading = false
    },

    copyOrderToClipboard() {
      const order = this.order
      const lines = ['Recommended Latex Order (40-foot Container)', '']
      lines.push(`Based on ${this.usageRates.periodDays || 60}-day sales lookback`)
      lines.push(`Monthly demand: ${this.usageRates.TOTAL_MONTHLY_SALES?.toFixed(1) || 'N/A'} units`)
      lines.push('')

      FIRMNESSES.forEach(firmness => {
        SIZES.forEach(size => {
          const qty = order[firmness]?.[size] || 0
          if (qty > 0) {
            lines.push(`${size} ${firmness}: ${qty}`)
          }
        })
      })

      const total = FIRMNESSES.reduce((sum, f) =>
        sum + SIZES.reduce((s, sz) => s + (order[f]?.[sz] || 0), 0), 0)

      lines.push('', `Total: ${total} pieces`)

      navigator.clipboard.writeText(lines.join('\n'))
      alert('Order copied to clipboard!')
    },

    exportCSV() {
      const order = this.order
      const rows = [['Firmness', 'Size', 'Quantity']]

      FIRMNESSES.forEach(firmness => {
        SIZES.forEach(size => {
          const qty = order[firmness]?.[size] || 0
          rows.push([firmness, size, qty.toString()])
        })
      })

      const csv = rows.map(row => row.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `latex-order-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }
})
