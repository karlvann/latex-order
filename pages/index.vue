<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-surface border border-surface-border rounded-xl p-8">
      <div class="text-center mb-8">
        <div class="flex items-center justify-center gap-2.5 mb-2">
          <span class="text-2xl font-bold text-amber tracking-tight">AusBeds</span>
          <span class="text-2xl text-zinc-700 font-light">|</span>
          <span class="px-2.5 py-0.5 bg-amber/20 border border-amber/40 rounded text-[10px] font-bold tracking-wider text-amber-light">SRI LANKA</span>
        </div>
        <h1 class="text-xl font-semibold text-zinc-50">Latex Order Calculator</h1>
        <p class="text-sm text-zinc-500 mt-1">Sign in to continue</p>
      </div>

      <form @submit.prevent="onSubmit" class="space-y-5">
        <div>
          <label for="email" class="block text-sm font-medium text-zinc-300 mb-1.5">Email</label>
          <input
            id="email"
            v-model="formState.email"
            type="email"
            autocapitalize="none"
            autocomplete="email"
            required
            class="w-full px-4 py-2.5 bg-surface-darker border border-surface-border rounded-lg text-zinc-50 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber transition-colors"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-zinc-300 mb-1.5">Password</label>
          <input
            id="password"
            v-model="formState.password"
            type="password"
            autocomplete="current-password"
            required
            class="w-full px-4 py-2.5 bg-surface-darker border border-surface-border rounded-lg text-zinc-50 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber transition-colors"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2.5 px-4 bg-amber hover:bg-amber-light text-zinc-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Icon v-if="loading" name="mdi:loading" class="w-5 h-5 animate-spin" />
          <span>{{ loading ? 'Signing in...' : 'Sign in' }}</span>
        </button>

        <div v-if="loginError" class="text-status-critical text-sm text-center">
          {{ loginError }}
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false
})

const { login } = useDirectusAuth()
const user = useDirectusUser()

const loading = ref(false)
const loginError = ref(null)

const formState = ref({
  email: '',
  password: ''
})

const onSubmit = async () => {
  loading.value = true
  loginError.value = null

  try {
    await login({
      email: formState.value.email,
      password: formState.value.password
    })
    navigateTo('/dashboard')
  } catch (e) {
    loginError.value = 'Invalid email or password'
  } finally {
    loading.value = false
  }
}

// Redirect to dashboard if already logged in
watchEffect(() => {
  if (user.value) {
    navigateTo('/dashboard')
  }
})
</script>
