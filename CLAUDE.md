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
- **CMS Integration**: Directus (via nuxt-directus module)
- **Icons**: @nuxt/icon (MDI icons)
- **Package Manager**: Yarn

## Architecture

### Data Flow
```
Directus CMS (source of truth)
  └─> stores/order.js (Pinia store - fetches via nuxt-directus)
        ├─> utils/constants.js (business rules, defaults)
        ├─> utils/algorithms.js (coverage-equalized ordering logic)
        └─> components/* (consume computed data via store)
```

### Key Modules

**`utils/constants.js`** - Business rules & defaults
- Lead time (3 months), safety buffer (1 month), critical threshold (4 months)
- Container size constraints (100-500 units, default 340)
- SKU definitions: firmness (firm/medium/soft) × size (Queen/King)
- Coverage thresholds for UI status colors

**`utils/algorithms.js`** - Core ordering logic
- `calculateCoverageEqualizedOrder()` - two-phase algorithm:
  - Phase 1: Allocate to SKUs below critical threshold (sorted by urgency)
  - Phase 2: Iteratively equalize coverage across remaining capacity
- `calculateProjection()` - 12-month forward projection (container arrives month 3)
- `getAllSKUCoverages()` - coverage months for all 6 SKU combinations
- `findFirstStockout()` - detects when projected stock goes negative

**`stores/order.js`** - Pinia store (central state)
- Fetches inventory from `skus` collection, sales from `orders` collection
- Calculates monthly usage rates from 42-day sales lookback
- Parses mattress SKUs (cloud/aurora/cooper ranges) to map to latex firmness/size
- Getters: `order`, `orderMetadata`, `totalOrdered`, `totalInventory`
- Actions: `setContainerSize()`, `fetchDirectusData()`, `copyOrderToClipboard()`, `exportCSV()`

### Component Pattern
All components interact with data through the Pinia store (no props/emits between siblings):
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

Dark theme with amber/orange accents. Custom Tailwind colors defined in `tailwind.config.js`:
- `background`: #0a0a0b
- `surface`: #18181b (darker: #0a0a0a, border: #27272a)
- `amber`: #d97706 (light: #fbbf24)
- `status`: critical (#ef4444), warning (#f97316), caution (#eab308), healthy (#22c55e)

## Environment Variables

- `DIRECTUS_URL` - Directus CMS base URL
- `DIRECTUS_TOKEN` - API access token for Directus
