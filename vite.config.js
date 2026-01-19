import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      // Custom plugin to handle /api/directus during development
      {
        name: 'directus-api-proxy',
        configureServer(server) {
          server.middlewares.use('/api/directus', async (req, res) => {
            const DIRECTUS_URL = env.DIRECTUS_URL
            const DIRECTUS_TOKEN = env.DIRECTUS_TOKEN

            // Set CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
            res.setHeader('Content-Type', 'application/json')

            if (req.method === 'OPTIONS') {
              res.statusCode = 200
              res.end()
              return
            }

            try {
              // Fetch inventory
              const inventoryRes = await fetch(
                `${DIRECTUS_URL}/items/skus?filter[sku][_in]=latexfirmqueen,latexfirmking,latexmediumqueen,latexmediumking,latexsoftqueen,latexsoftking&fields=sku,quantity`,
                {
                  headers: {
                    'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
                    'Content-Type': 'application/json'
                  }
                }
              )

              if (!inventoryRes.ok) {
                throw new Error(`Directus inventory error: ${inventoryRes.status}`)
              }

              const inventoryData = await inventoryRes.json()
              const items = inventoryData.data || []

              // Transform to app format
              const inventory = {
                firm: { Queen: 0, King: 0 },
                medium: { Queen: 0, King: 0 },
                soft: { Queen: 0, King: 0 }
              }

              for (const item of items) {
                const sku = item.sku?.toLowerCase()
                const qty = parseInt(item.quantity, 10) || 0

                if (sku === 'latexfirmqueen') inventory.firm.Queen = qty
                else if (sku === 'latexfirmking') inventory.firm.King = qty
                else if (sku === 'latexmediumqueen') inventory.medium.Queen = qty
                else if (sku === 'latexmediumking') inventory.medium.King = qty
                else if (sku === 'latexsoftqueen') inventory.soft.Queen = qty
                else if (sku === 'latexsoftking') inventory.soft.King = qty
              }

              // Fetch orders from last 42 days (6 weeks)
              const lookbackDays = 42
              const lookbackDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString()
              const ordersRes = await fetch(
                `${DIRECTUS_URL}/items/orders?filter[payment_status][_eq]=paid&filter[subtotal][_gt]=0&filter[date_created][_gte]=${lookbackDate}&fields=id,date_created,total,skus.skus_id.sku&limit=1000`,
                {
                  headers: {
                    'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
                    'Content-Type': 'application/json'
                  }
                }
              )

              let sales = {
                rawCounts: { firm: { Queen: 0, King: 0 }, medium: { Queen: 0, King: 0 }, soft: { Queen: 0, King: 0 } },
                monthlyUsage: { firm: { Queen: 0, King: 0 }, medium: { Queen: 0, King: 0 }, soft: { Queen: 0, King: 0 } },
                periodDays: lookbackDays,
                topProducts: []
              }

              if (ordersRes.ok) {
                const ordersData = await ordersRes.json()
                const orders = ordersData.data || []

                // Count latex usage and track individual product sales
                const demand = {
                  firm: { Queen: 0, King: 0 },
                  medium: { Queen: 0, King: 0 },
                  soft: { Queen: 0, King: 0 }
                }
                const topProductsMap = {}

                for (const order of orders) {
                  if (!order.skus || !Array.isArray(order.skus)) continue

                  for (const skuItem of order.skus) {
                    const skuValue = skuItem?.skus_id?.sku
                    if (!skuValue) continue

                    const lowerSku = skuValue.toLowerCase()

                    // Check if mattress SKU
                    const match = lowerSku.match(/^(cloud|aurora|cooper)(\d+)(single|kingsingle|double|queen|king)$/)
                    if (!match) continue

                    const [, range, firmnessStr, size] = match
                    const firmness = parseInt(firmnessStr, 10)

                    // Map firmness level to latex type (2-7=soft, 8-12=medium, 13-19=firm)
                    let latexFirmness
                    if (firmness >= 2 && firmness <= 7) latexFirmness = 'soft'
                    else if (firmness >= 8 && firmness <= 12) latexFirmness = 'medium'
                    else if (firmness >= 13 && firmness <= 19) latexFirmness = 'firm'
                    else continue

                    // Map size to latex size
                    let latexSize
                    if (size === 'queen' || size === 'double' || size === 'kingsingle') latexSize = 'Queen'
                    else if (size === 'king' || size === 'single') latexSize = 'King'
                    else continue

                    demand[latexFirmness][latexSize]++

                    // Map firmness to display category: 2-4=Soft, 5-7=Medium, 8-10=Firm, 11-13=Very Firm, 14-19=Super Firm
                    let firmnessCategory
                    if (firmness >= 2 && firmness <= 4) firmnessCategory = 'Soft'
                    else if (firmness >= 5 && firmness <= 7) firmnessCategory = 'Medium'
                    else if (firmness >= 8 && firmness <= 10) firmnessCategory = 'Firm'
                    else if (firmness >= 11 && firmness <= 13) firmnessCategory = 'Very Firm'
                    else if (firmness >= 14 && firmness <= 19) firmnessCategory = 'Super Firm'

                    const displayRange = range.charAt(0).toUpperCase() + range.slice(1)
                    const displaySize = size.charAt(0).toUpperCase() + size.slice(1)
                    const productKey = `${displayRange} ${displaySize} ${firmnessCategory}`

                    topProductsMap[productKey] = (topProductsMap[productKey] || 0) + 1
                  }
                }

                // Convert topProducts to sorted array
                const topProducts = Object.entries(topProductsMap)
                  .map(([name, count]) => ({ name, count }))
                  .sort((a, b) => b.count - a.count)

                // Convert to monthly rate (30 days / lookbackDays)
                const monthlyMultiplier = 30 / lookbackDays
                sales = {
                  rawCounts: demand,
                  monthlyUsage: {
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
                  },
                  periodDays: lookbackDays,
                  topProducts
                }
              }

              res.statusCode = 200
              res.end(JSON.stringify({ inventory, sales }))
            } catch (error) {
              console.error('Directus API error:', error)
              res.statusCode = 500
              res.end(JSON.stringify({ error: 'Failed to fetch from Directus', message: error.message }))
            }
          })
        }
      }
    ]
  }
})
