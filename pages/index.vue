<script setup>
import { SIZES, FIRMNESSES } from '~/utils/constants'

const store = useOrderStore()
const { inventory, usageRates, isLoading, error } = storeToRefs(store)

// Fetch data on mount
onMounted(() => {
  store.fetchDirectusData()
})

// Compute total inventory
const totalInventory = computed(() => {
  return FIRMNESSES.reduce((sum, f) =>
    sum + SIZES.reduce((s, sz) => s + (inventory.value[f]?.[sz] || 0), 0), 0)
})
</script>

<template>
  <div>
    <!-- Error Display -->
    <UiErrorBanner v-if="error" :message="error" />

    <!-- Loading State -->
    <UiLoadingSpinner v-if="isLoading" message="Fetching inventory and sales data..." />

    <template v-else>
      <!-- Demand & Top Products Row -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <!-- Demand Summary -->
        <div class="bg-surface border border-surface-border rounded-xl p-5">
          <div class="flex justify-between items-center mb-4">
            <label class="text-base font-semibold text-zinc-50">Demand (42-Day Lookback)</label>
            <div class="text-sm text-status-healthy font-medium">
              {{ usageRates.TOTAL_MONTHLY_SALES?.toFixed(1) || 0 }} units/month
            </div>
          </div>
          <div class="grid grid-cols-3 gap-2.5">
            <template v-for="firmness in FIRMNESSES" :key="firmness">
              <template v-for="size in SIZES" :key="`${firmness}-${size}`">
                <div class="bg-surface-darker border border-surface-border rounded-lg p-3 text-center">
                  <div class="text-[10px] text-zinc-500 uppercase tracking-wide mb-1.5">{{ firmness }} {{ size }}</div>
                  <div class="text-2xl font-bold text-amber-light font-mono leading-none">
                    {{ usageRates.SKU_MONTHLY_USAGE?.[size]?.[firmness]?.toFixed(1) || 0 }}
                  </div>
                  <div class="text-[11px] text-zinc-600 mt-1">/month</div>
                </div>
              </template>
            </template>
          </div>
        </div>

        <!-- Top Products -->
        <div class="bg-surface border border-surface-border rounded-xl p-5">
          <div class="flex justify-between items-center mb-4">
            <label class="text-base font-semibold text-zinc-50">Top Products (42-Day)</label>
            <div class="text-sm text-status-healthy font-medium">
              {{ usageRates.topProducts?.reduce((sum, p) => sum + p.count, 0) || 0 }} sold
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <div
              v-for="(product, idx) in (usageRates.topProducts || []).slice(0, 8)"
              :key="idx"
              class="flex justify-between items-center px-3 py-2 bg-surface-darker border border-surface-border rounded-md"
            >
              <span class="text-sm text-zinc-300">{{ product.name }}</span>
              <span class="text-sm font-semibold text-amber-light font-mono">x{{ product.count }}</span>
            </div>
            <div
              v-if="!usageRates.topProducts || usageRates.topProducts.length === 0"
              class="text-sm text-zinc-600 italic p-3 text-center"
            >
              No sales data
            </div>
          </div>
        </div>
      </div>

      <!-- 12-Month Forecast -->
      <ForecastTable />

      <!-- Health Alert -->
      <HealthAlert />

      <!-- Decision Summary -->
      <DecisionSummary />

      <!-- Hero Section - Recommended Order -->
      <OrderHero />

      <!-- Current Inventory Display -->
      <div class="bg-surface-darker border border-surface-border rounded-xl p-5 mb-4">
        <div class="flex justify-between items-center mb-4">
          <span class="text-[15px] font-semibold text-zinc-50">Current Inventory</span>
          <span class="text-sm text-zinc-400">{{ totalInventory }} pieces</span>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div
            v-for="firmness in FIRMNESSES"
            :key="firmness"
            class="bg-surface border border-surface-border rounded-lg p-3"
          >
            <div class="text-xs text-zinc-500 uppercase mb-2">{{ firmness }}</div>
            <div class="flex flex-col gap-1">
              <div v-for="size in SIZES" :key="size" class="flex justify-between text-sm">
                <span class="text-zinc-400">{{ size }}</span>
                <span class="text-zinc-50 font-semibold font-mono">{{ inventory[firmness]?.[size] || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
        <p class="mt-3 text-[11px] text-zinc-600 italic">Data synced from Directus CMS</p>
      </div>

      <!-- Inventory Mix -->
      <InventoryMix />
    </template>
  </div>
</template>
