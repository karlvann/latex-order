<script setup>
import { SIZES, FIRMNESSES, CRITICAL_THRESHOLD_MONTHS } from '~/utils/constants'
import { getAllSKUCoverages, getTotalOrdered } from '~/utils/algorithms'

const store = useOrderStore()
const { inventory, order, usageRates } = storeToRefs(store)

const summaryData = computed(() => {
  const coveragesBefore = getAllSKUCoverages(inventory.value, usageRates.value)
  const totalOrdered = getTotalOrdered(order.value)

  // Calculate after coverage (inventory + order)
  const inventoryAfter = {}
  for (const firmness of FIRMNESSES) {
    inventoryAfter[firmness] = {}
    for (const size of SIZES) {
      inventoryAfter[firmness][size] = (inventory.value[firmness]?.[size] || 0) + (order.value[firmness]?.[size] || 0)
    }
  }
  const coveragesAfter = getAllSKUCoverages(inventoryAfter, usageRates.value)

  // Find critical SKUs (before order)
  const criticalBefore = Object.entries(coveragesBefore)
    .filter(([_, cov]) => cov < CRITICAL_THRESHOLD_MONTHS)
    .sort((a, b) => a[1] - b[1])

  // Find lowest coverage after order
  const lowestAfter = Object.entries(coveragesAfter)
    .sort((a, b) => a[1] - b[1])[0]

  // Calculate container breakdown
  const queenTotal = FIRMNESSES.reduce((sum, f) => sum + (order.value[f]?.Queen || 0), 0)
  const kingTotal = FIRMNESSES.reduce((sum, f) => sum + (order.value[f]?.King || 0), 0)
  const firmTotal = SIZES.reduce((sum, s) => sum + (order.value.firm?.[s] || 0), 0)
  const mediumTotal = SIZES.reduce((sum, s) => sum + (order.value.medium?.[s] || 0), 0)
  const softTotal = SIZES.reduce((sum, s) => sum + (order.value.soft?.[s] || 0), 0)

  const queenPct = totalOrdered > 0 ? Math.round((queenTotal / totalOrdered) * 100) : 0
  const kingPct = totalOrdered > 0 ? Math.round((kingTotal / totalOrdered) * 100) : 0
  const firmPct = totalOrdered > 0 ? Math.round((firmTotal / totalOrdered) * 100) : 0
  const mediumPct = totalOrdered > 0 ? Math.round((mediumTotal / totalOrdered) * 100) : 0
  const softPct = totalOrdered > 0 ? Math.round((softTotal / totalOrdered) * 100) : 0

  return {
    coveragesBefore,
    coveragesAfter,
    criticalBefore,
    lowestAfter,
    queenTotal,
    kingTotal,
    firmTotal,
    mediumTotal,
    softTotal,
    queenPct,
    kingPct,
    firmPct,
    mediumPct,
    softPct
  }
})
</script>

<template>
  <div class="bg-surface border border-surface-border rounded-xl p-5 mb-4">
    <div class="flex items-center gap-2.5 mb-4">
      <Icon name="mdi:clipboard-text" class="w-5 h-5 text-zinc-400" />
      <span class="text-base font-semibold text-zinc-50">Order Summary</span>
    </div>

    <!-- Before/After Coverage -->
    <div class="mb-4">
      <div class="text-xs text-zinc-500 uppercase tracking-wide mb-2.5">Coverage Change</div>
      <div class="flex flex-col gap-2">
        <template v-if="summaryData.criticalBefore.length > 0">
          <div
            v-for="[key, covBefore] in summaryData.criticalBefore.slice(0, 4)"
            :key="key"
            class="flex justify-between items-center px-3 py-2 bg-surface-darker rounded-md"
          >
            <span class="text-sm text-zinc-300 font-medium">{{ key.replace('_', ' ') }}</span>
            <span class="text-sm font-mono">
              <span class="text-status-critical">{{ covBefore.toFixed(1) }}mo</span>
              <span class="text-zinc-500 mx-1">→</span>
              <span :class="summaryData.coveragesAfter[key] >= CRITICAL_THRESHOLD_MONTHS ? 'text-status-healthy' : 'text-status-caution'">
                {{ summaryData.coveragesAfter[key].toFixed(1) }}mo
              </span>
            </span>
          </div>
        </template>
        <div v-else class="p-3 bg-status-healthy/10 rounded-md text-green-300 text-sm">
          All SKUs already healthy. This order increases buffer stock.
        </div>
      </div>

      <!-- Result summary -->
      <div v-if="summaryData.criticalBefore.length > 0" class="flex items-center gap-2 mt-3 px-3 py-2.5 bg-status-healthy/15 border border-status-healthy/30 rounded-md">
        <Icon name="mdi:check-circle" class="w-4 h-4 text-status-healthy" />
        <span class="text-green-300 text-sm font-medium">
          After order: All SKUs at {{ summaryData.lowestAfter ? summaryData.lowestAfter[1].toFixed(1) : '4+' }}+ months coverage
        </span>
      </div>
    </div>

    <!-- Container Breakdown -->
    <div>
      <div class="text-xs text-zinc-500 uppercase tracking-wide mb-2.5">Container Breakdown</div>

      <!-- Size split -->
      <div class="flex items-center gap-3 mb-2.5">
        <span class="text-xs text-zinc-400 w-[70px] flex-shrink-0">Size:</span>
        <div class="flex-1 flex h-6 rounded overflow-hidden bg-surface-darker">
          <div
            class="flex items-center justify-center text-[11px] font-semibold text-white bg-blue-500 transition-all duration-300"
            :style="{ width: summaryData.queenPct + '%' }"
          >
            <span v-if="summaryData.queenPct > 15">Queen {{ summaryData.queenPct }}%</span>
          </div>
          <div
            class="flex items-center justify-center text-[11px] font-semibold text-white bg-purple-500 transition-all duration-300"
            :style="{ width: summaryData.kingPct + '%' }"
          >
            <span v-if="summaryData.kingPct > 15">King {{ summaryData.kingPct }}%</span>
          </div>
        </div>
      </div>

      <!-- Firmness split -->
      <div class="flex items-center gap-3 mb-2.5">
        <span class="text-xs text-zinc-400 w-[70px] flex-shrink-0">Firmness:</span>
        <div class="flex-1 flex h-6 rounded overflow-hidden bg-surface-darker">
          <div
            class="flex items-center justify-center text-[11px] font-semibold text-white bg-slate-500 transition-all duration-300"
            :style="{ width: summaryData.firmPct + '%' }"
          >
            <span v-if="summaryData.firmPct > 10">F {{ summaryData.firmPct }}%</span>
          </div>
          <div
            class="flex items-center justify-center text-[11px] font-semibold text-white bg-status-healthy transition-all duration-300"
            :style="{ width: summaryData.mediumPct + '%' }"
          >
            <span v-if="summaryData.mediumPct > 15">Med {{ summaryData.mediumPct }}%</span>
          </div>
          <div
            class="flex items-center justify-center text-[11px] font-semibold text-white bg-status-caution transition-all duration-300"
            :style="{ width: summaryData.softPct + '%' }"
          >
            <span v-if="summaryData.softPct > 15">Soft {{ summaryData.softPct }}%</span>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="flex flex-wrap gap-3 mt-2">
        <span class="flex items-center gap-1 text-[11px] text-zinc-400">
          <span class="w-2 h-2 rounded-full bg-blue-500"></span>Queen: {{ summaryData.queenTotal }}
        </span>
        <span class="flex items-center gap-1 text-[11px] text-zinc-400">
          <span class="w-2 h-2 rounded-full bg-purple-500"></span>King: {{ summaryData.kingTotal }}
        </span>
        <span class="flex items-center gap-1 text-[11px] text-zinc-400">
          <span class="w-2 h-2 rounded-full bg-slate-500"></span>Firm: {{ summaryData.firmTotal }}
        </span>
        <span class="flex items-center gap-1 text-[11px] text-zinc-400">
          <span class="w-2 h-2 rounded-full bg-status-healthy"></span>Medium: {{ summaryData.mediumTotal }}
        </span>
        <span class="flex items-center gap-1 text-[11px] text-zinc-400">
          <span class="w-2 h-2 rounded-full bg-status-caution"></span>Soft: {{ summaryData.softTotal }}
        </span>
      </div>
    </div>
  </div>
</template>
