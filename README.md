# Latex Mattress Order System

A React-based inventory management and container planning tool for latex mattress ordering, built with the same architecture as the spring-order system.

## Features

- **Inventory Tracking**: Track current stock levels for Queen and King sizes across Firm, Medium, and Soft densities
- **Coverage Analysis**: Calculate months of coverage remaining based on sales rates
- **Smart Ordering**: Automatically calculate optimal container orders based on inventory gaps
- **TSV Export**: Generate tab-separated export format for supplier orders
- **Responsive Design**: Collapsible sections with clean, dark-themed interface

## Data from Spreadsheet

The app uses actual sales data from your "Latex Order.xlsx" spreadsheet:

### Sales Rates (3 months actual data)
- Queen: 491 units (163.67/month)
  - Firm: 29 (5.91%)
  - Medium: 267 (54.38%)
  - Soft: 195 (39.71%)
- King: 354 units (118/month)
  - Firm: 14 (3.95%)
  - Medium: 228 (64.41%)
  - Soft: 112 (31.64%)

### Initial Stock (from spreadsheet)
- Queen: Firm (29), Medium (64), Soft (47)
- King: Firm (21), Medium (33), Soft (30)

### Container Size
- Default: 170 units
- Adjustable: 50-300 units

## Getting Started

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### Build for Production
```bash
npm run build
```

## Project Structure

```
src/
├── App.jsx                      # Main app component
├── main.jsx                     # React entry point
├── components/                  # UI components
│   ├── InventoryTable.jsx       # Editable inventory table
│   ├── CoverageCard.jsx         # Coverage status cards
│   └── OrderSummary.jsx         # Order breakdown table
└── lib/
    ├── algorithms/              # Core business logic
    │   ├── coverage.ts          # Coverage calculations
    │   ├── orderCalculation.ts  # Order algorithm
    │   └── export.ts            # TSV generation
    ├── constants/               # Business constants
    │   ├── sales.ts             # Sales rates from spreadsheet
    │   ├── firmness.ts          # Firmness distribution
    │   └── business.ts          # Container size, thresholds
    ├── types/                   # TypeScript definitions
    │   ├── inventory.ts
    │   └── order.ts
    └── utils/                   # Helper functions
        └── inventory.ts
```

## How It Works

1. **Current Inventory**: Enter your current stock levels for each size/density combination
2. **Container Size**: Adjust the container size (default 170 units)
3. **Coverage Analysis**: System calculates months of coverage remaining
4. **Order Calculation**: Algorithm distributes container capacity based on inventory gaps
5. **Export**: Copy TSV format for supplier orders (matches spreadsheet format)

## Export Format

The export generates tab-separated values matching your spreadsheet format:

```
Size            Density  Quantity
203*152*5.0     55D      47
203*152*5.0     70D      64
203*183*5.0     90D      21
...
```

Where:
- 203*152*5.0 = Queen size
- 203*183*5.0 = King size
- 55D = Soft, 70D = Medium, 90D = Firm

## Technologies

- React 19
- Vite 7
- TypeScript (for types)
- Inline CSS-in-JS

## Comparison to spring-order

This app follows the same structure as the spring-order reference app but is adapted for:
- Only 2 sizes (Queen, King) vs 5 sizes
- Direct unit ordering vs pallet-based ordering
- Latex-specific density codes (55D, 70D, 90D)
- Simplified ordering logic (no complex N+0/N+1/N+2 rules)
