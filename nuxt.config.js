// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',

  future: {
    compatibilityVersion: 4
  },

  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxt/icon',
    'nuxt-directus'
  ],

  directus: {
    url: process.env.DIRECTUS_URL,
    autoFetch: true,
    autoRefresh: true
  },

  app: {
    head: {
      title: 'AusBeds Latex Order Calculator',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },

  routeRules: {
    '/**': {
      ssr: false
    }
  },

  runtimeConfig: {
    public: {
      directus: {
        url: process.env.DIRECTUS_URL
      }
    }
  }
})
