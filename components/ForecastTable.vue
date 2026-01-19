<script setup>
import { SIZES, FIRMNESSES, FIRMNESS_LABELS, LEAD_TIME_MONTHS } from '~/utils/constants'
import { calculateProjection } from '~/utils/algorithms'

const store = useOrderStore()
const { inventory, order, usageRates } = storeToRefs(store)

const isExpanded = ref(true)

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const projections = computed(() => {
  return calculateProjection(inventory.value, order.value, 12, usageRates.value)
})

const startMonth = computed(() => new Date().getMonth())

const getMonthLabel = (offset) => {
  if (offset === 0) return 'Now'
  return MONTH_NAMES[(startMonth.value + offset) % 12]
}

const getCellColor = (value) => {
  if (value < 0) return 'text-status-critical' // Red - stockout
  if (value < 20) return 'text-status-warning' // Orange - critical
  if (value < 50) return 'text-status-caution' // Yellow - low
  return 'text-status-healthy' // Green - healthy
}
</script>

<template>
  <div class="bg-surface-darker border border-surface-border rounded-xl overflow-hidden mb-4">
    <button
      @click="isExpanded = !isExpanded"
      class="flex justify-between items-center w-full px-5 py-4 bg-transparent border-none cursor-pointer text-zinc-50"
    >
      <span class="text-[15px] font-semibold">
        <span class="mr-2">{{ isExpanded ? '▼' : '▶' }}</span>
        12-Month Forecast
      </span>
      <span class="text-xs text-zinc-500">Container arrives month 3</span>
    </button>

    <div v-if="isExpanded" class="px-5 pb-5">
      <div class="overflow-x-auto border border-surface-border rounded-lg">
        <table class="w-full border-collapse text-sm font-mono">
          <thead>
            <tr>
              <th class="px-3 py-2.5 text-center text-zinc-400 font-semibold border-b border-surface-border whitespace-nowrap min-w-[50px] sticky left-0 bg-surface-darker z-[2]">
                SKU
              </th>
              <th
                v-for="(_, idx) in projections"
                :key="idx"
                class="px-2 py-2.5 text-center text-zinc-400 font-semibold border-b border-surface-border whitespace-nowrap min-w-[50px]"
                :class="{ 'bg-blue-500/15 text-blue-400': idx === LEAD_TIME_MONTHS }"
              >
                <span v-if="idx === LEAD_TIME_MONTHS">
                  <Icon name="mdi:package-variant" class="w-4 h-4 mr-1 inline" />
                </span>
                {{ getMonthLabel(idx) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-for="size in SIZES" :key="size">
              <!-- Size header row -->
              <tr>
                <td :colspan="projections.length + 1" class="px-3 py-2.5 font-bold text-sm text-zinc-50 bg-surface border-b border-surface-border">
                  {{ size }}
                </td>
              </tr>
              <!-- Firmness rows -->
              <tr v-for="firmness in FIRMNESSES" :key="`${size}_${firmness}`">
                <td class="px-3 py-2 text-zinc-400 border-b border-surface-border text-xs whitespace-nowrap sticky left-0 bg-surface-darker z-[1]">
                  {{ FIRMNESS_LABELS[firmness] }}
                </td>
                <td
                  v-for="(monthData, idx) in projections"
                  :key="idx"
                  class="px-2 py-2 text-center border-b border-surface-border font-medium"
                  :class="[
                    getCellColor(monthData[`${size}_${firmness}`]),
                    { 'bg-blue-500/10': idx === LEAD_TIME_MONTHS }
                  ]"
                >
                  {{ monthData[`${size}_${firmness}`] }}
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div class="flex gap-4 flex-wrap mt-4 text-xs text-zinc-400">
        <span class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-status-healthy"></span>
          Healthy (50+)
        </span>
        <span class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-status-caution"></span>
          Low (20-49)
        </span>
        <span class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-status-warning"></span>
          Critical (&lt;20)
        </span>
        <span class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-status-critical"></span>
          Stockout (&lt;0)
        </span>
      </div>
    </div>
  </div>
</template>
