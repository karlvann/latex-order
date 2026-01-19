<script setup>
import { SIZES, FIRMNESSES } from '~/utils/constants'

const store = useOrderStore()
const { usageRates } = storeToRefs(store)

const totalMonthly = computed(() => usageRates.value?.TOTAL_MONTHLY_SALES ?? 0)
const totalWeekly = computed(() => totalMonthly.value / 4.33)

const variations = computed(() => {
  const items = []
  for (const size of SIZES) {
    for (const firmness of FIRMNESSES) {
      const monthlyUnits = usageRates.value?.SKU_MONTHLY_USAGE?.[size]?.[firmness] ?? 0
      const weeklyUnits = monthlyUnits / 4.33
      const pct = totalMonthly.value > 0 ? (monthlyUnits / totalMonthly.value) * 100 : 0
      items.push({
        size,
        firmness,
        weeklyUnits,
        pct
      })
    }
  }
  return items
})
</script>

<template>
  <div class="mt-6 p-4 bg-surface border border-surface-border rounded-xl max-w-[320px]">
    <div class="flex justify-between items-center mb-3">
      <h3 class="text-[13px] font-semibold text-zinc-400 uppercase tracking-wide">Demand Breakdown</h3>
      <div class="text-xs font-semibold text-status-healthy px-2 py-0.5 bg-status-healthy/10 rounded">
        {{ totalWeekly.toFixed(1) }}/wk total
      </div>
    </div>

    <table class="w-full border-collapse">
      <thead>
        <tr>
          <th class="px-2 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wide border-b border-surface-border text-left">
            Variation
          </th>
          <th class="px-2 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wide border-b border-surface-border text-right w-[70px]">
            Units/Wk
          </th>
          <th class="px-2 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wide border-b border-surface-border text-right w-[70px]">
            %
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in variations" :key="`${item.size}_${item.firmness}`" class="border-b border-surface-border">
          <td class="px-2 py-2 text-sm text-zinc-50">
            <span class="inline-block px-1.5 py-0.5 text-[10px] font-semibold text-zinc-50 bg-blue-500 rounded mr-1.5">
              {{ item.size }}
            </span>
            <span class="text-xs text-zinc-400">{{ item.firmness.charAt(0).toUpperCase() + item.firmness.slice(1) }}</span>
          </td>
          <td class="px-2 py-2 text-sm text-zinc-50 text-right font-mono">
            {{ item.weeklyUnits.toFixed(1) }}
          </td>
          <td class="px-2 py-2 text-sm text-zinc-50 text-right font-mono">
            {{ item.pct.toFixed(0) }}%
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
