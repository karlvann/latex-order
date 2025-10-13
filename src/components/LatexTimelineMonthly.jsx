import React from 'react';
import { MONTHLY_SALES_RATE, FIRMNESS_DISTRIBUTION, LEAD_TIME_MONTHS } from '../lib/constants';

// Monthly forecast showing Queen/King × Firm/Medium/Soft (6 rows) - GROUPED by size
export default function LatexTimelineMonthly({ inventory, order, startingMonth = 0 }) {
  if (!order) {
    return null;
  }

  const SIZES = ['Queen', 'King'];
  const FIRMNESS_TYPES = ['firm', 'medium', 'soft'];
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Get month name for a given offset from startingMonth
  const getMonthName = (offset) => {
    return MONTH_NAMES[(startingMonth + offset) % 12];
  };

  // Calculate stock level at a given month for a specific size/firmness
  const getStockAtMonth = (size, firmness, monthOffset) => {
    const currentStock = inventory[firmness][size] || 0;
    const monthlySales = MONTHLY_SALES_RATE[size] * FIRMNESS_DISTRIBUTION[size][firmness];
    const orderedUnits = order[firmness][size] || 0;

    if (monthOffset === 0) {
      return currentStock;
    } else if (monthOffset < LEAD_TIME_MONTHS) {
      // Before container arrival
      return currentStock - (monthlySales * monthOffset);
    } else if (monthOffset === LEAD_TIME_MONTHS) {
      // Container arrival at 3 months (12 weeks)
      return currentStock - (monthlySales * LEAD_TIME_MONTHS) + orderedUnits;
    } else {
      // After container arrival
      const stockAtArrival = currentStock - (monthlySales * LEAD_TIME_MONTHS) + orderedUnits;
      return stockAtArrival - (monthlySales * (monthOffset - LEAD_TIME_MONTHS));
    }
  };

  const headerStyle = {
    padding: '12px 8px',
    textAlign: 'center',
    borderBottom: '2px solid #27272a',
    color: '#a1a1aa',
    fontWeight: '600',
    fontSize: '11px',
    textTransform: 'uppercase'
  };

  const cellStyle = {
    padding: '10px 8px',
    textAlign: 'center',
    borderBottom: '1px solid #27272a',
    fontFamily: 'monospace',
    fontSize: '13px'
  };

  const orderNowHeaderStyle = {
    background: '#14532d',
    color: '#22c55e',
    fontWeight: '700',
    borderLeft: '2px solid #22c55e',
    borderRight: '2px solid #22c55e',
    width: '40px',
    minWidth: '40px',
    maxWidth: '40px'
  };

  const arrivalHeaderStyle = {
    background: '#1e3a8a',
    color: '#60a5fa',
    fontWeight: '700',
    borderLeft: '2px solid #3b82f6',
    borderRight: '2px solid #3b82f6'
  };

  const getCellColor = (value) => {
    if (value < 0) return '#ef4444'; // Red - stockout
    if (value < 20) return '#f97316'; // Orange - low
    if (value < 50) return '#eab308'; // Yellow - warning
    return '#10b981'; // Green - healthy
  };

  // Get current date and calculate date range
  const today = new Date();
  const startDate = new Date(today.getFullYear(), startingMonth, 1);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 12);

  const dateRangeStr = `${MONTH_NAMES[startDate.getMonth()]} ${startDate.getFullYear()} - ${MONTH_NAMES[endDate.getMonth()]} ${endDate.getFullYear()}`;

  return (
    <div style={{
      background: '#0a0a0a',
      borderRadius: '8px',
      padding: '24px',
      overflowX: 'auto',
      marginBottom: '20px'
    }}>
      <div style={{
        fontSize: '18px',
        fontWeight: '600',
        marginBottom: '8px',
        color: '#fafafa'
      }}>
        Latex Timeline - Monthly View (2 sizes × 3 firmnesses = 6 rows)
      </div>
      <div style={{
        fontSize: '14px',
        color: '#71717a',
        marginBottom: '16px'
      }}>
        {dateRangeStr} • 1 container arrival
      </div>

      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '12px',
        whiteSpace: 'nowrap'
      }}>
        <thead>
          <tr style={{ background: '#18181b' }}>
            <th style={{ ...headerStyle, position: 'sticky', left: 0, background: '#18181b', zIndex: 3 }}>
              Size /<br/>Firmness
            </th>
            <th style={{ ...headerStyle, ...orderNowHeaderStyle }}>
              ORDER<br/>HERE
            </th>
            <th style={headerStyle}>Now<br/>{getMonthName(0)}</th>
            <th style={headerStyle}>{getMonthName(1)}</th>
            <th style={headerStyle}>{getMonthName(2)}</th>
            <th style={{ ...headerStyle, ...arrivalHeaderStyle }}>
              CONTAINER<br/>ARRIVAL<br/><span style={{ fontSize: '9px' }}>(Week 12)</span>
            </th>
            {[4, 5, 6, 7, 8, 9, 10, 11, 12].map(offset => (
              <th key={offset} style={headerStyle}>{getMonthName(offset)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SIZES.map((size, sizeIdx) => (
            <React.Fragment key={size}>
              {/* Size header row */}
              <tr style={{ background: '#09090b' }}>
                <td
                  colSpan={15}
                  style={{
                    ...cellStyle,
                    textAlign: 'left',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    borderTop: sizeIdx > 0 ? '2px solid #27272a' : 'none',
                    background: '#18181b',
                    padding: '12px 8px'
                  }}
                >
                  {size}
                </td>
              </tr>

              {/* Firmness rows */}
              {FIRMNESS_TYPES.map(firmness => {
                const orderedQty = order[firmness][size] || 0;
                return (
                  <tr key={`${size}-${firmness}`} style={{ background: '#09090b' }}>
                    <td style={{
                      ...cellStyle,
                      position: 'sticky',
                      left: 0,
                      background: '#09090b',
                      textAlign: 'left',
                      paddingLeft: '24px',
                      zIndex: 2
                    }}>
                      {firmness}
                    </td>
                    <td style={{
                      ...cellStyle,
                      background: 'rgba(20, 83, 45, 0.3)',
                      borderLeft: '2px solid #22c55e',
                      borderRight: '2px solid #22c55e',
                      width: '40px',
                      minWidth: '40px',
                      maxWidth: '40px'
                    }}>
                      {/* Empty cell - visual marker for order point */}
                    </td>
                    <td style={{ ...cellStyle, color: getCellColor(getStockAtMonth(size, firmness, 0)) }}>
                      {Math.round(getStockAtMonth(size, firmness, 0))}
                    </td>
                    <td style={{ ...cellStyle, color: getCellColor(getStockAtMonth(size, firmness, 1)) }}>
                      {Math.round(getStockAtMonth(size, firmness, 1))}
                    </td>
                    <td style={{ ...cellStyle, color: getCellColor(getStockAtMonth(size, firmness, 2)) }}>
                      {Math.round(getStockAtMonth(size, firmness, 2))}
                    </td>
                    <td style={{
                      ...cellStyle,
                      background: 'rgba(30, 58, 138, 0.3)',
                      borderLeft: '2px solid #3b82f6',
                      borderRight: '2px solid #3b82f6',
                      fontWeight: '700',
                      fontSize: '14px',
                      color: '#22c55e'
                    }}>
                      {orderedQty > 0 ? `+${orderedQty}` : '—'}
                    </td>
                    {[4, 5, 6, 7, 8, 9, 10, 11, 12].map(offset => (
                      <td key={offset} style={{ ...cellStyle, color: getCellColor(getStockAtMonth(size, firmness, offset)) }}>
                        {Math.round(getStockAtMonth(size, firmness, offset))}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <div style={{
        marginTop: '16px',
        fontSize: '12px',
        color: '#71717a',
        fontStyle: 'italic'
      }}>
        * Container arrives at {LEAD_TIME_MONTHS} months (12 weeks). All projections based on current sales rates.
      </div>
    </div>
  );
}
