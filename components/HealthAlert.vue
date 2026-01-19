<script setup>
import { FIRMNESS_LABELS, COVERAGE_THRESHOLDS } from '~/utils/constants'
import { findFirstStockout, calculateProjection, getAllSKUCoverages } from '~/utils/algorithms'

const store = useOrderStore()
const { inventory, order, usageRates } = storeToRefs(store)

// Convert months to approximate weeks for urgency
const formatTimeUrgent = (months) => {
  const weeks = Math.round(months * 4.3)
  if (weeks <= 4) return `${weeks} weeks`
  if (weeks <= 8) return `${weeks} weeks (~${months} months)`
  return `${months} months`
}

const alertData = computed(() => {
  const projections = calculateProjection(inventory.value, order.value, 12, usageRates.value)
  const firstStockout = findFirstStockout(projections)
  const coverages = getAllSKUCoverages(inventory.value, usageRates.value)

  // Find critical SKUs (< 2 months coverage)
  const criticalSKUs = Object.entries(coverages)
    .filter(([_, cov]) => cov < COVERAGE_THRESHOLDS.CRITICAL)
    .sort((a, b) => a[1] - b[1])

  let status, statusColor, statusBg, statusBorder, message, icon, iconName

  if (firstStockout && firstStockout.month <= 3) {
    // Stockout before container arrives - CRITICAL URGENCY
    status = 'CRITICAL'
    statusColor = 'text-status-critical'
    statusBg = 'bg-status-critical/10'
    statusBorder = 'border-status-critical'
    iconName = 'mdi:alert-circle'
    const weeksUntil = firstStockout.month * 4
    message = `${firstStockout.size} ${FIRMNESS_LABELS[firstStockout.firmness]} runs out in ~${weeksUntil} weeks — BEFORE container arrives! Order immediately.`
  } else if (criticalSKUs.length > 0) {
    // Some SKUs critically low
    const [worstKey, worstCov] = criticalSKUs[0]
    const [worstSize, worstFirmness] = worstKey.split('_')
    status = 'WARNING'
    statusColor = 'text-status-warning'
    statusBg = 'bg-status-warning/10'
    statusBorder = 'border-status-warning'
    iconName = 'mdi:alert'
    message = `${criticalSKUs.length} SKU${criticalSKUs.length > 1 ? 's' : ''} critically low. ${worstSize} ${worstFirmness} has only ${formatTimeUrgent(worstCov)} of stock. Order now.`
  } else if (firstStockout) {
    // Stockout after container but within forecast
    status = 'CAUTION'
    statusColor = 'text-status-caution'
    statusBg = 'bg-status-caution/10'
    statusBorder = 'border-status-caution'
    iconName = 'mdi:chart-line'
    message = `Projected stockout at month ${firstStockout.month}. Plan next order accordingly.`
  } else {
    // All healthy
    status = 'HEALTHY'
    statusColor = 'text-status-healthy'
    statusBg = 'bg-status-healthy/10'
    statusBorder = 'border-status-healthy'
    iconName = 'mdi:check-circle'
    message = 'All SKUs have adequate coverage through the forecast period.'
  }

  return { status, statusColor, statusBg, statusBorder, message, iconName, criticalSKUs }
})
</script>

<template>
  <div
    class="border-2 rounded-xl p-5 mb-6"
    :class="[alertData.statusBg, alertData.statusBorder]"
  >
    <div class="flex items-start gap-4">
      <div class="flex-shrink-0">
        <Icon :name="alertData.iconName" class="w-7 h-7" :class="alertData.statusColor" />
      </div>
      <div class="flex-1">
        <div class="text-sm font-bold uppercase tracking-wide mb-1" :class="alertData.statusColor">
          {{ alertData.status }}
        </div>
        <div class="text-[15px] text-zinc-300 leading-relaxed">
          {{ alertData.message }}
        </div>
      </div>
    </div>

    <div v-if="alertData.criticalSKUs.length > 0" class="mt-4 pt-4 border-t border-white/10">
      <div class="text-xs text-zinc-500 mb-2 uppercase">Critical SKUs:</div>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="[key, coverage] in alertData.criticalSKUs.slice(0, 3)"
          :key="key"
          class="text-xs px-2.5 py-1 bg-black/30 rounded text-zinc-50"
        >
          {{ key.replace('_', ' ') }}: {{ coverage.toFixed(1) }}mo
        </span>
        <span v-if="alertData.criticalSKUs.length > 3" class="text-xs text-zinc-500 self-center">
          +{{ alertData.criticalSKUs.length - 3 }} more
        </span>
      </div>
    </div>
  </div>
</template>
