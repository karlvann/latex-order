import React from 'react';
import LatexTimelineMonthly from '../components/LatexTimelineMonthly';

export default function MonthlyForecastView({
  startingMonth,
  setStartingMonth,
  inventory,
  order
}) {
  // Calculate date range
  const today = new Date();
  const startDate = new Date(today.getFullYear(), startingMonth, 1);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 12);

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateRangeStr = `${MONTH_NAMES[startDate.getMonth()]} ${startDate.getFullYear()} - ${MONTH_NAMES[endDate.getMonth()]} ${endDate.getFullYear()}`;

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* Month Selector */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            margin: 0,
            marginBottom: '8px',
            color: '#fafafa'
          }}>
            12-Month Inventory Forecast ({dateRangeStr})
          </h1>
          <p style={{
            margin: 0,
            color: '#888',
            fontSize: '14px'
          }}>
            Monthly view with 1 container arrival scheduled.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ color: '#a1a1aa', fontSize: '14px' }}>Starting Month:</label>
          <select
            value={startingMonth}
            onChange={(e) => setStartingMonth(parseInt(e.target.value))}
            style={{
              padding: '8px 12px',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '6px',
              color: '#fafafa',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value={0}>January</option>
            <option value={1}>February</option>
            <option value={2}>March</option>
            <option value={3}>April</option>
            <option value={4}>May</option>
            <option value={5}>June</option>
            <option value={6}>July</option>
            <option value={7}>August</option>
            <option value={8}>September</option>
            <option value={9}>October</option>
            <option value={10}>November</option>
            <option value={11}>December</option>
          </select>
        </div>
      </div>

      {/* Timeline */}
      <LatexTimelineMonthly
        inventory={inventory}
        order={order}
        startingMonth={startingMonth}
      />
    </div>
  );
}
