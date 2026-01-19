# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AusBeds Latex Order Calculator - a React + Vite web application that calculates optimal latex mattress order quantities for 40-foot shipping containers. The app uses a coverage-equalized ordering algorithm to prevent stockouts by intelligently distributing container capacity across product SKUs (firmness × size combinations).

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server (localhost:5173) |
| `npm run build` | Production build to `dist/` |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## Tech Stack

- **Frontend**: React 19 + Vite 7
- **Backend**: Serverless API route (`api/directus.js`) fetching live data from Directus CMS
- **Styling**: Inline CSS-in-JS (no external framework)

## Architecture

### Data Flow
```
Directus CMS (source of truth)
  └─> api/directus.js (fetches inventory + sales data)
        └─> App.jsx (top-level state)
              ├─> src/lib/constants.js (business rules, defaults)
              ├─> src/lib/algorithms.js (coverage-equalized ordering logic)
              └─> src/components/* (consume computed data)
```

### Key Modules

**`src/lib/constants.js`** - Business rules & defaults
- Default inventory and usage rates (used while Directus fetch is in progress)
- Lead time (3 months), safety buffer (1 month), critical threshold (4 months)
- Container size constraints (100-500 units)
- SKU definitions: firmness (firm/medium/soft) × size (Queen/King)

**`src/lib/algorithms.js`** - Core ordering logic
- `calculateCoverageEqualizedOrder()` - two-phase algorithm:
  - Phase 1: Allocate to SKUs below critical threshold
  - Phase 2: Equalize coverage across remaining units
- `calculateProjection()` - 12-month forward projection (container arrives month 3)
- `getAllSKUCoverages()` - coverage months for all 6 SKU combinations

**`api/directus.js`** - Serverless data fetcher
- Fetches live inventory counts from Directus CMS
- Calculates monthly usage rates from 42-day sales lookback
- Returns combined inventory + demand data for the algorithm

### State Management

All state lives in `App.jsx` using React hooks:
- `inventory` - stock levels by firmness/size (from Directus)
- `usageRates` - monthly demand rates by SKU (from Directus sales data)
- `containerSize` - order quantity (100-500 units)
- `lastFetched` - timestamp of last CMS sync

### UI Design System

Dark theme with amber/orange accents (`#d97706`, `#fbbf24`). Components use inline CSS objects. Header uses glassmorphism with sticky positioning.

## Environment Variables

- `DIRECTUS_URL` - Directus CMS base URL
- `DIRECTUS_TOKEN` - API access token for Directus
