<script setup>
defineProps({
  message: {
    type: String,
    required: true
  }
})

const store = useOrderStore()
</script>

<template>
  <div class="flex justify-between items-center px-4 py-3 mb-6 bg-status-critical/15 border border-status-critical/30 rounded-lg text-red-300">
    <span>Failed to fetch live data: {{ message }}</span>
    <button
      @click="store.fetchDirectusData()"
      class="px-3 py-1.5 bg-status-critical/20 border border-status-critical/40 rounded text-red-300 cursor-pointer text-sm hover:bg-status-critical/30"
    >
      Retry
    </button>
  </div>
</template>
