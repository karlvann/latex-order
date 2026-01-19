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
                periodDays: lookbackDays
              }

              if (ordersRes.ok) {
                const ordersData = await ordersRes.json()
                const orders = ordersData.data || []

                // DEBUG: Tally all mattress SKUs sold in last 42 days (6 weeks)
                const skuTally = {}
                const mattressCount = { total: 0, byRange: { cloud: 0, aurora: 0, cooper: 0 } }
                const mattressOrderTotals = [] // Track order totals for AOV calculation

                // Filter to mattress orders and count latex usage
                const demand = {
                  firm: { Queen: 0, King: 0 },
                  medium: { Queen: 0, King: 0 },
                  soft: { Queen: 0, King: 0 }
                }

                for (const order of orders) {
                  if (!order.skus || !Array.isArray(order.skus)) continue

                  let orderHasMattress = false
                  for (const skuItem of order.skus) {
                    // Navigate the m2m structure: skus[].skus_id.sku
                    const skuValue = skuItem?.skus_id?.sku
                    if (!skuValue) continue

                    const lowerSku = skuValue.toLowerCase()

                    // Check if mattress SKU
                    if (!/^(cloud|aurora|cooper)/.test(lowerSku)) continue

                    // DEBUG: Count this SKU
                    skuTally[lowerSku] = (skuTally[lowerSku] || 0) + 1
                    mattressCount.total++
                    orderHasMattress = true
                    if (lowerSku.startsWith('cloud')) mattressCount.byRange.cloud++
                    else if (lowerSku.startsWith('aurora')) mattressCount.byRange.aurora++
                    else if (lowerSku.startsWith('cooper')) mattressCount.byRange.cooper++

                    // Extract firmness level
                    const firmnessMatch = lowerSku.match(/^(?:cloud|aurora|cooper)(\d+)/)
                    if (!firmnessMatch) continue
                    const firmnessLevel = parseInt(firmnessMatch[1], 10)

                    // Extract size
                    const sizeMatch = lowerSku.match(/^(?:cloud|aurora|cooper)\d+(single|kingsingle|double|queen|king)$/)
                    if (!sizeMatch) continue
                    const size = sizeMatch[1]

                    // Map firmness level to latex type (2-7=soft, 8-12=medium, 13-19=firm)
                    let latexFirmness
                    if (firmnessLevel >= 2 && firmnessLevel <= 7) latexFirmness = 'soft'
                    else if (firmnessLevel >= 8 && firmnessLevel <= 12) latexFirmness = 'medium'
                    else if (firmnessLevel >= 13 && firmnessLevel <= 19) latexFirmness = 'firm'
                    else continue

                    // Map size to latex size
                    let latexSize
                    if (size === 'queen' || size === 'double' || size === 'kingsingle') latexSize = 'Queen'
                    else if (size === 'king' || size === 'single') latexSize = 'King'
                    else continue

                    demand[latexFirmness][latexSize]++
                  }

                  // Track order total for AOV calculation
                  if (orderHasMattress && order.total) {
                    const orderTotal = parseFloat(order.total)
                    if (!isNaN(orderTotal) && orderTotal > 0) {
                      mattressOrderTotals.push(orderTotal)
                    }
                  }
                }

                // Calculate average order value for mattress orders
                const avgOrderValue = mattressOrderTotals.length > 0
                  ? mattressOrderTotals.reduce((sum, val) => sum + val, 0) / mattressOrderTotals.length
                  : 0

                // DEBUG: Log the tally sorted by count
                // console.log(`\n========== MATTRESS SALES (Last ${lookbackDays} Days / 6 Weeks) ==========`)
                // console.log(`Total orders fetched: ${orders.length}`)
                // console.log(`Mattress orders: ${mattressOrderTotals.length}`)
                // console.log(`Total mattresses sold: ${mattressCount.total}`)
                // console.log(`Average Order Value (mattress orders): $${avgOrderValue.toFixed(2)}`)
                // console.log(`By range: Cloud=${mattressCount.byRange.cloud}, Aurora=${mattressCount.byRange.aurora}, Cooper=${mattressCount.byRange.cooper}`)
                // console.log('\nTop SKUs by quantity:')
                const sortedSkus = Object.entries(skuTally).sort((a, b) => b[1] - a[1])
                sortedSkus.forEach(([sku, count]) => {
                  // Parse for display
                  const match = sku.match(/^(cloud|aurora|cooper)(\d+)(single|kingsingle|double|queen|king)$/)
                  if (match) {
                    const [, , firmness, size] = match
                    const latexType = firmness >= 2 && firmness <= 7 ? 'SOFT' : firmness >= 8 && firmness <= 12 ? 'MEDIUM' : 'FIRM'
                    const latexSize = ['queen', 'double', 'kingsingle'].includes(size) ? 'Queen' : 'King'
                    // console.log(`  ${count}x ${sku} → ${latexType} ${latexSize}`)
                  } else {
                    // console.log(`  ${count}x ${sku} (not parsed)`)
                  }
                })
                // console.log(`\nLATEX DEMAND (${lookbackDays}-day raw counts):`)
                // console.log(`  Firm:   Queen=${demand.firm.Queen}, King=${demand.firm.King}`)
                // console.log(`  Medium: Queen=${demand.medium.Queen}, King=${demand.medium.King}`)
                // console.log(`  Soft:   Queen=${demand.soft.Queen}, King=${demand.soft.King}`)
                // console.log('==================================================\n')

                // Convert to monthly rate (30 days / lookbackDays)
                const monthlyMultiplier = 30 / lookbackDays  // 30/42 ≈ 0.714
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
                  periodDays: lookbackDays
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
