<script setup>
defineProps({
  message: {
    type: String,
    default: 'Loading...'
  }
})
</script>

<template>
  <div class="flex flex-col items-center justify-center py-20 px-5">
    <div class="w-10 h-10 border-[3px] border-surface-border border-t-amber rounded-full animate-spin"></div>
    <p class="mt-4 text-zinc-500 text-sm">{{ message }}</p>
  </div>
</template>
