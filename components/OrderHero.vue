<script setup>
import { SIZES, FIRMNESSES, FIRMNESS_LABELS, MIN_CONTAINER_SIZE, MAX_CONTAINER_SIZE } from '~/utils/constants'
import { getTotalOrdered } from '~/utils/algorithms'

const store = useOrderStore()
const { order, containerSize } = storeToRefs(store)

const totalOrdered = computed(() => getTotalOrdered(order.value))

const handleSliderChange = (e) => {
  store.setContainerSize(parseInt(e.target.value))
}
</script>

<template>
  <div class="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-2 border-blue-500 rounded-2xl p-7 mb-6">
    <div class="flex justify-between items-center mb-5">
      <h2 class="text-2xl font-bold text-zinc-50">Recommended Order</h2>
      <div class="bg-status-healthy text-black px-5 py-2 rounded-full text-lg font-bold">
        {{ totalOrdered }} units
      </div>
    </div>

    <!-- Container Size Slider -->
    <div class="mb-6">
      <label class="block text-zinc-400 mb-3 text-sm">
        Container Size: <strong class="text-zinc-50">{{ containerSize }}</strong> pieces
      </label>
      <input
        type="range"
        :min="MIN_CONTAINER_SIZE"
        :max="MAX_CONTAINER_SIZE"
        step="10"
        :value="containerSize"
        @input="handleSliderChange"
        class="w-full"
      />
      <div class="flex justify-between text-zinc-500 text-[11px] mt-1.5">
        <span>100</span>
        <span>200</span>
        <span>300</span>
        <span>400</span>
        <span>500</span>
      </div>
    </div>

    <!-- Order Table -->
    <div class="overflow-x-auto mb-6">
      <table class="w-full border-collapse text-[15px]">
        <thead>
          <tr>
            <th class="px-4 py-3 text-center text-zinc-400 font-semibold border-b-2 border-surface-border uppercase text-xs tracking-wide"></th>
            <th v-for="size in SIZES" :key="size" class="px-4 py-3 text-center text-zinc-400 font-semibold border-b-2 border-surface-border uppercase text-xs tracking-wide">
              {{ size }}
            </th>
            <th class="px-4 py-3 text-center text-zinc-400 font-semibold border-b-2 border-surface-border uppercase text-xs tracking-wide">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="firmness in FIRMNESSES" :key="firmness">
            <td class="px-4 py-3.5 text-zinc-300 border-b border-surface-border font-medium">
              {{ FIRMNESS_LABELS[firmness] }}
            </td>
            <td v-for="size in SIZES" :key="size" class="px-4 py-3.5 text-center border-b border-surface-border font-mono text-base">
              <span v-if="order[firmness]?.[size] > 0" class="text-status-healthy font-bold">
                +{{ order[firmness]?.[size] || 0 }}
              </span>
              <span v-else class="text-zinc-600">—</span>
            </td>
            <td class="px-4 py-3.5 text-center border-b border-surface-border text-zinc-400 font-semibold">
              {{ SIZES.reduce((sum, size) => sum + (order[firmness]?.[size] || 0), 0) }}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td class="px-4 py-3.5 text-zinc-300 border-b border-surface-border font-bold">Total</td>
            <td v-for="size in SIZES" :key="size" class="px-4 py-3.5 text-center border-b border-surface-border text-zinc-400 font-semibold">
              {{ FIRMNESSES.reduce((sum, f) => sum + (order[f]?.[size] || 0), 0) }}
            </td>
            <td class="px-4 py-3.5 text-center border-b border-surface-border text-status-healthy font-bold text-lg">
              {{ totalOrdered }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-3 flex-wrap">
      <button
        @click="store.copyOrderToClipboard()"
        class="flex-1 min-w-[160px] px-6 py-3.5 bg-status-healthy border-none rounded-lg text-black text-[15px] font-bold cursor-pointer hover:bg-green-400 transition-colors"
      >
        Copy to Clipboard
      </button>
      <button
        @click="store.exportCSV()"
        class="flex-1 min-w-[160px] px-6 py-3.5 bg-transparent border-2 border-blue-500 rounded-lg text-blue-500 text-[15px] font-semibold cursor-pointer hover:bg-blue-500/10 transition-colors"
      >
        Export CSV
      </button>
    </div>
  </div>
</template>
