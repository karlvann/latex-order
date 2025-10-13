import React from 'react';
import { MONTHLY_SALES_RATE, TOTAL_MONTHLY_SALES, MATTRESS_SALES_DATA, SKU_MONTHLY_USAGE } from '../lib/constants';

export default function SalesBreakdown() {
  const weeksPerMonth = 4.33;
  const weeklyLatexPieces = TOTAL_MONTHLY_SALES / weeksPerMonth;

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Sales & Usage Breakdown</h3>
      <p style={styles.subtitle}>Understanding the math behind latex piece consumption</p>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Latex Pieces/Month</div>
          <div style={styles.summaryValue}>{TOTAL_MONTHLY_SALES}</div>
          <div style={styles.summaryNote}>Raw material usage</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Latex Pieces/Week</div>
          <div style={styles.summaryValue}>{weeklyLatexPieces.toFixed(1)}</div>
          <div style={styles.summaryNote}>≈ {Math.round(weeklyLatexPieces)} pieces weekly</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Mattresses/Month</div>
          <div style={styles.summaryValue}>{MATTRESS_SALES_DATA.totalMattressesPerMonth.toFixed(0)}</div>
          <div style={styles.summaryNote}>Finished product sales</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Latex per Mattress</div>
          <div style={styles.summaryValue}>1</div>
          <div style={styles.summaryNote}>Exactly 1:1 ratio</div>
        </div>
      </div>

      {/* Detailed Breakdown Table */}
      <div style={styles.tableSection}>
        <h4 style={styles.tableTitle}>Latex Piece Usage by Size & Firmness</h4>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Size</th>
              <th style={styles.th}>Firmness</th>
              <th style={styles.th}>% of Total</th>
              <th style={styles.th}>Pieces/Month</th>
              <th style={styles.th}>Pieces/Week</th>
            </tr>
          </thead>
          <tbody>
            {['Queen', 'King'].map(size => (
              <React.Fragment key={size}>
                {/* Size subtotal row */}
                <tr style={styles.sizeRow}>
                  <td style={{...styles.td, fontWeight: 'bold', color: '#fafafa'}}>{size}</td>
                  <td style={{...styles.td, color: '#71717a'}}>All firmnesses</td>
                  <td style={{...styles.td, fontWeight: 'bold'}}>
                    {(MONTHLY_SALES_RATE[size] / TOTAL_MONTHLY_SALES * 100).toFixed(1)}%
                  </td>
                  <td style={{...styles.td, fontWeight: 'bold', color: '#60a5fa'}}>
                    {MONTHLY_SALES_RATE[size]}
                  </td>
                  <td style={{...styles.td, fontWeight: 'bold', color: '#60a5fa'}}>
                    {(MONTHLY_SALES_RATE[size] / weeksPerMonth).toFixed(1)}
                  </td>
                </tr>

                {/* Firmness breakdown rows */}
                {['firm', 'medium', 'soft'].map(firmness => {
                  const piecesPerMonth = SKU_MONTHLY_USAGE[size][firmness];
                  const piecesPerWeek = piecesPerMonth / weeksPerMonth;
                  const percentOfTotal = (piecesPerMonth / TOTAL_MONTHLY_SALES) * 100;

                  return (
                    <tr key={`${size}-${firmness}`}>
                      <td style={{...styles.td, paddingLeft: '32px', color: '#71717a'}}></td>
                      <td style={{...styles.td, textTransform: 'capitalize'}}>{firmness}</td>
                      <td style={styles.td}>{percentOfTotal.toFixed(1)}%</td>
                      <td style={styles.td}>{piecesPerMonth}</td>
                      <td style={styles.td}>{piecesPerWeek.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}

            {/* Total row */}
            <tr style={styles.totalRow}>
              <td style={{...styles.td, fontWeight: 'bold', color: '#fafafa'}} colSpan={2}>TOTAL</td>
              <td style={{...styles.td, fontWeight: 'bold'}}>100%</td>
              <td style={{...styles.td, fontWeight: 'bold', color: '#22c55e'}}>{TOTAL_MONTHLY_SALES}</td>
              <td style={{...styles.td, fontWeight: 'bold', color: '#22c55e'}}>
                {weeklyLatexPieces.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Source Data */}
      <div style={styles.sourceNote}>
        <strong>Data Source:</strong> Based on actual usage data from "Latex Order.xlsx" USAGE RATES section
        <br />
        <strong>1:1 Ratio:</strong> Each mattress uses exactly 1 piece of latex | 80 pieces/month = 80 mattresses/month = 960/year
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: '#0a0a0a',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #333'
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#fafafa',
    margin: '0 0 4px 0'
  },
  subtitle: {
    fontSize: '14px',
    color: '#888',
    margin: '0 0 20px 0'
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  summaryCard: {
    background: '#1a1a1a',
    padding: '16px',
    borderRadius: '6px',
    border: '1px solid #333',
    textAlign: 'center'
  },
  summaryLabel: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  summaryValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#4a9eff',
    marginBottom: '4px'
  },
  summaryNote: {
    fontSize: '11px',
    color: '#666'
  },
  tableSection: {
    marginBottom: '20px'
  },
  tableTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#a1a1aa',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#000',
    border: '1px solid #333',
    borderRadius: '6px',
    overflow: 'hidden'
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    background: '#1a1a1a',
    color: '#a1a1aa',
    fontWeight: '600',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '2px solid #333'
  },
  td: {
    padding: '10px 12px',
    color: '#d4d4d8',
    fontSize: '13px',
    borderBottom: '1px solid #27272a'
  },
  sizeRow: {
    background: '#0f0f0f'
  },
  totalRow: {
    background: '#1a1a1a',
    borderTop: '2px solid #333'
  },
  sourceNote: {
    fontSize: '12px',
    color: '#71717a',
    fontStyle: 'italic',
    padding: '12px',
    background: '#0f0f0f',
    borderRadius: '4px',
    border: '1px solid #27272a',
    lineHeight: '1.6'
  }
};
