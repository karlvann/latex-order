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
- **Backend**: Serverless API route handlers (`api/saves.js`)
- **Database**: Neon PostgreSQL (`@neondatabase/serverless`)
- **Styling**: Inline CSS-in-JS (no external framework)

## Architecture

### Data Flow
```
App.jsx (top-level state)
  ├─> src/lib/constants.js (business rules, rates, defaults)
  ├─> src/lib/algorithms.js (coverage-equalized ordering logic)
  └─> src/components/* (consume computed data, emit changes)
```

### Key Modules

**`src/lib/constants.js`** - Business rules
- Base monthly sales rates scaled by annual revenue target
- SKU-level usage rates by firmness (firm/medium/soft) and size (Queen/King)
- Lead time (3 months), safety buffer (1 month), critical threshold (4 months)
- `getScaledUsageRates(annualRevenue)` - dynamically adjusts all rates

**`src/lib/algorithms.js`** - Core ordering logic
- `calculateCoverageEqualizedOrder()` - two-phase algorithm:
  - Phase 1: Allocate to SKUs below critical threshold
  - Phase 2: Equalize coverage across remaining units
- `calculateProjection()` - 12-month forward projection (container arrives month 3)
- `getAllSKUCoverages()` - coverage months for all 6 SKU combinations

**`api/saves.js`** - Serverless CRUD endpoint
- GET: List saves (limit 50)
- POST: Create save (validates name, inventory structure, revenue)
- DELETE: Remove save by ID

### State Management

All state lives in `App.jsx` using React hooks:
- `inventory` - stock levels by firmness/size
- `containerSize` - order quantity (100-500 units)
- `annualRevenue` - revenue target for rate scaling
- `currentSave` - loaded save metadata

### UI Design System

Dark theme with amber/orange accents (`#d97706`, `#fbbf24`). Components use inline CSS objects. Header uses glassmorphism with sticky positioning.

## Database Schema

PostgreSQL `saves` table:
- `id` (serial PK)
- `name` (varchar 255)
- `inventory` (JSONB)
- `annual_revenue` (integer)
- `created_at` (timestamp)

Environment variable: `DATABASE_URL` in `.env`
