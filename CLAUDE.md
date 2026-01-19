# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AusBeds Latex Order Calculator - a Nuxt 4 web application that calculates optimal latex mattress order quantities for 40-foot shipping containers. The app uses a coverage-equalized ordering algorithm to prevent stockouts by intelligently distributing container capacity across product SKUs (firmness × size combinations).

## Commands

| Command | Purpose |
|---------|---------|
| `yarn dev` | Start Nuxt dev server (localhost:3000) |
| `yarn build` | Production build to `.output/` |
| `yarn preview` | Preview production build |
| `yarn generate` | Generate static site |

## Tech Stack

- **Framework**: Nuxt 4 (Vue 3)
- **Styling**: Tailwind CSS
- **State Management**: Pinia
- **CMS Integration**: Directus (via server API route)
- **Icons**: @nuxt/icon (MDI icons)
- **Package Manager**: Yarn

## Architecture

### Project Structure
```
ausbeds-latex-order/
├── nuxt.config.js           # Nuxt configuration
├── tailwind.config.js       # Tailwind color palette & theme
├── app.vue                  # Root app component
├── assets/css/main.css      # Tailwind directives & custom styles
├── components/
│   ├── OrderHero.vue        # Order table, slider, export buttons
│   ├── ForecastTable.vue    # 12-month projection, collapsible
│   ├── HealthAlert.vue      # Status alerts
│   ├── DecisionSummary.vue  # Before/after coverage charts
│   ├── InventoryMix.vue     # Stock runway bars
│   ├── DemandBreakdown.vue  # Demand table
│   └── ui/
│       ├── LoadingSpinner.vue
│       └── ErrorBanner.vue
├── layouts/default.vue      # Main layout with header
├── pages/index.vue          # Main page
├── server/api/directus.get.js  # API route for Directus
├── stores/order.js          # Pinia store (all state/actions)
└── utils/
    ├── constants.js         # Business rules, defaults
    └── algorithms.js        # Coverage-equalized ordering logic
```

### Data Flow
```
Directus CMS (source of truth)
  └─> server/api/directus.get.js (fetches inventory + sales data)
        └─> stores/order.js (Pinia store - state management)
              ├─> utils/constants.js (business rules, defaults)
              ├─> utils/algorithms.js (coverage-equalized ordering logic)
              └─> components/* (consume computed data via store)
```

### Key Modules

**`utils/constants.js`** - Business rules & defaults
- Default inventory and usage rates (used while Directus fetch is in progress)
- Lead time (3 months), safety buffer (1 month), critical threshold (4 months)
- Container size constraints (100-500 units)
- SKU definitions: firmness (firm/medium/soft) × size (Queen/King)

**`utils/algorithms.js`** - Core ordering logic
- `calculateCoverageEqualizedOrder()` - two-phase algorithm:
  - Phase 1: Allocate to SKUs below critical threshold
  - Phase 2: Equalize coverage across remaining units
- `calculateProjection()` - 12-month forward projection (container arrives month 3)
- `getAllSKUCoverages()` - coverage months for all 6 SKU combinations

**`server/api/directus.get.js`** - Server API route
- Fetches live inventory counts from Directus CMS
- Calculates monthly usage rates from 42-day sales lookback
- Returns combined inventory + demand data for the algorithm

**`stores/order.js`** - Pinia store
- State: inventory, containerSize, usageRates, isLoading, error, lastFetched
- Getters: order, orderMetadata, totalOrdered, totalInventory
- Actions: setContainerSize(), fetchDirectusData(), copyOrderToClipboard(), exportCSV()

### Component Pattern (no emits)
All components interact with data through the Pinia store:
```vue
<script setup>
import { useOrderStore } from '~/stores/order'
import { storeToRefs } from 'pinia'

const store = useOrderStore()
const { order, containerSize } = storeToRefs(store)

// Call store actions directly
const handleCopy = () => store.copyOrderToClipboard()
</script>
```

### UI Design System

Dark theme with amber/orange accents. Custom Tailwind colors:
- `background`: #0a0a0b
- `surface`: #18181b (darker: #0a0a0a, border: #27272a)
- `amber`: #d97706 (light: #fbbf24)
- `status`: critical (#ef4444), warning (#f97316), caution (#eab308), healthy (#22c55e)

## Environment Variables

- `DIRECTUS_URL` - Directus CMS base URL
- `DIRECTUS_TOKEN` - API access token for Directus
