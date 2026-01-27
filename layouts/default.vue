<script setup>
const store = useOrderStore()
const { logout } = useDirectusAuth()
const user = useDirectusUser()

const signOut = async () => {
  await logout()
  navigateTo('/')
}
</script>

<template>
  <div class="min-h-screen bg-background text-gray-200 font-sans">
    <header class="sticky top-0 h-16 bg-surface/95 backdrop-blur-sm border-b border-surface-border flex items-center justify-between px-6 z-50">
      <div>
        <div class="flex items-center gap-2.5 mb-0.5">
          <span class="text-lg font-bold text-amber tracking-tight">AusBeds</span>
          <span class="text-lg text-zinc-700 font-light">|</span>
          <span class="px-2.5 py-0.5 bg-amber/20 border border-amber/40 rounded text-[10px] font-bold tracking-wider text-amber-light">SRI LANKA</span>
          <span class="text-lg text-zinc-700 font-light">|</span>
          <span class="text-lg font-semibold text-gray-200 tracking-tight">Latex Order</span>
        </div>
        <p class="text-[11px] text-zinc-500">40-Foot Container | Coverage-Equalized Ordering</p>
      </div>

      <div class="flex items-center gap-4">
        <div v-if="store.lastFetched" class="flex items-center gap-2 px-3 py-1.5 bg-status-healthy/10 border border-status-healthy/20 rounded-md">
          <span class="w-2 h-2 rounded-full bg-status-healthy"></span>
          <span class="text-xs text-green-300">Synced {{ store.formattedLastFetched }}</span>
          <button
            @click="store.fetchDirectusData()"
            class="text-green-300 hover:text-green-200 p-1"
            title="Refresh data"
          >
            <Icon name="mdi:refresh" class="w-4 h-4" />
          </button>
        </div>

        <div v-if="user" class="flex items-center gap-3 pl-3 border-l border-surface-border">
          <span class="text-xs text-zinc-400">{{ user.email }}</span>
          <button
            @click="signOut"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-surface-darker border border-surface-border rounded-md transition-colors"
            title="Sign out"
          >
            <Icon name="mdi:logout" class="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-6 py-6">
      <slot />
    </main>

    <footer class="py-6 text-center border-t border-surface-border text-zinc-500 text-sm">
      <p>Algorithm: Coverage-Equalized Ordering | Lead Time: 3 months | Safety Buffer: 1 month</p>
    </footer>
  </div>
</template>
