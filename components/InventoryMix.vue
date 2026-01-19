<script setup>
import { SIZES, FIRMNESSES, FIRMNESS_LABELS, CRITICAL_THRESHOLD_MONTHS } from '~/utils/constants'
import { calculateSKUCoverage } from '~/utils/algorithms'

const store = useOrderStore()
const { inventory, usageRates } = storeToRefs(store)

const getStatusInfo = (coverage) => {
  if (coverage < 2) return { color: 'bg-status-critical', textColor: 'text-status-critical', label: 'CRITICAL', iconName: 'mdi:alert-circle' }
  if (coverage < 3) return { color: 'bg-status-warning', textColor: 'text-status-warning', label: 'LOW', iconName: 'mdi:alert' }
  if (coverage < CRITICAL_THRESHOLD_MONTHS) return { color: 'bg-status-caution', textColor: 'text-status-caution', label: 'WARNING', iconName: 'mdi:alert' }
  if (coverage > 8) return { color: 'bg-blue-500', textColor: 'text-blue-500', label: 'OVER', iconName: 'mdi:arrow-up' }
  return { color: 'bg-status-healthy', textColor: 'text-status-healthy', label: 'OK', iconName: 'mdi:check-circle' }
}

const skuData = computed(() => {
  const data = []
  let totalStock = 0

  for (const size of SIZES) {
    for (const firmness of FIRMNESSES) {
      const stock = inventory.value[firmness]?.[size] ?? 0
      const coverage = calculateSKUCoverage(stock, size, firmness, usageRates.value)
      const monthlyUsage = usageRates.value?.SKU_MONTHLY_USAGE?.[size]?.[firmness] ?? 0

      data.push({
        size,
        firmness,
        stock,
        coverage,
        monthlyUsage,
        key: `${size}_${firmness}`,
        status: getStatusInfo(coverage)
      })
      totalStock += stock
    }
  }

  return { items: data, totalStock }
})

const sortedData = computed(() => {
  return [...skuData.value.items].sort((a, b) => a.coverage - b.coverage)
})

const criticalSKUs = computed(() => {
  return sortedData.value.filter(s => s.coverage < CRITICAL_THRESHOLD_MONTHS)
})

const overstockedSKUs = computed(() => {
  return sortedData.value.filter(s => s.coverage > 8)
})

const maxCoverage = 12
const targetPosition = (CRITICAL_THRESHOLD_MONTHS / maxCoverage) * 100
</script>

<template>
  <div class="bg-surface-darker border border-surface-border rounded-xl p-5 mb-6">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-base font-semibold text-zinc-50">Stock Runway</h3>
      <div class="text-xs text-zinc-500 px-2 py-1 bg-surface rounded">
        Target: {{ CRITICAL_THRESHOLD_MONTHS }} months
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <div
        v-for="item in skuData.items"
        :key="item.key"
        class="flex items-center gap-3"
      >
        <div class="w-[140px] flex-shrink-0 flex flex-col gap-0.5">
          <span class="text-sm font-semibold text-zinc-50">{{ item.size }}</span>
          <span class="text-[11px] text-zinc-500">{{ FIRMNESS_LABELS[item.firmness] }}</span>
        </div>

        <div class="flex-1 h-5 bg-surface rounded relative overflow-hidden">
          <div
            class="absolute top-0 bottom-0 w-0.5 bg-white/30 z-[1]"
            :style="{ left: targetPosition + '%' }"
          ></div>
          <div
            class="h-full rounded transition-all duration-300"
            :class="item.status.color"
            :style="{ width: Math.min(100, (item.coverage / maxCoverage) * 100) + '%' }"
          ></div>
        </div>

        <div class="w-20 flex-shrink-0 flex items-center justify-end gap-2">
          <span class="text-sm font-semibold font-mono" :class="item.status.textColor">
            {{ item.coverage > 99 ? '99+' : item.coverage.toFixed(1) }} mo
          </span>
          <Icon :name="item.status.iconName" class="w-4 h-4" :class="item.status.textColor" />
        </div>
      </div>
    </div>

    <!-- Insights -->
    <div v-if="criticalSKUs.length > 0 || overstockedSKUs.length > 0" class="mt-4 p-3 bg-surface rounded-lg flex flex-col gap-2">
      <div v-if="criticalSKUs.length > 0" class="flex items-start gap-2">
        <Icon name="mdi:alert-circle" class="w-4 h-4 text-status-critical flex-shrink-0 mt-0.5" />
        <span class="text-xs text-zinc-400 leading-relaxed">
          <strong class="text-zinc-300">Will run out before container:</strong>
          {{ criticalSKUs.map(s => `${s.size} ${s.firmness} (${s.coverage.toFixed(1)}mo)`).join(', ') }}
        </span>
      </div>
      <div v-if="overstockedSKUs.length > 0" class="flex items-start gap-2">
        <Icon name="mdi:arrow-up" class="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <span class="text-xs text-zinc-400 leading-relaxed">
          <strong class="text-zinc-300">Overstocked:</strong>
          {{ overstockedSKUs.map(s => `${s.size} ${s.firmness} (${s.coverage.toFixed(1)}mo)`).join(', ') }}
          <span v-if="overstockedSKUs.some(s => s.firmness === 'firm')"> — Firm sells slowly (5% of demand)</span>
        </span>
      </div>
    </div>

    <div class="mt-4 pt-3 border-t border-surface-border flex justify-between text-xs text-zinc-500">
      <span>Total: {{ skuData.totalStock }} units in stock</span>
      <span class="text-zinc-600">Lead time: 3 months | Buffer: 1 month</span>
    </div>

    <!-- Demand Breakdown -->
    <DemandBreakdown />
  </div>
</template>
