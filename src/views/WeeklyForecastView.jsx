import React from 'react';
import LatexTimelineWeekly from '../components/LatexTimelineWeekly';

export default function WeeklyForecastView({
  startingMonth,
  setStartingMonth,
  inventory,
  order
}) {
  return (
    <div style={styles.forecastView}>
      <div style={styles.forecastContent}>
        {/* Month Selector */}
        <div style={styles.forecastHeader}>
          <div>
            <h1 style={styles.forecastTitle}>
              52-Week Inventory Forecast
            </h1>
            <p style={styles.forecastSubtitle}>
              Weekly view with 2 container arrivals scheduled throughout the year.
            </p>
          </div>
          <div style={styles.monthSelector}>
            <label style={styles.monthLabel}>Starting Month:</label>
            <select
              value={startingMonth}
              onChange={(e) => setStartingMonth(parseInt(e.target.value))}
              style={styles.monthSelect}
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
        <LatexTimelineWeekly
          inventory={inventory}
          order={order}
          startingMonth={startingMonth}
        />
      </div>
    </div>
  );
}

const styles = {
  forecastView: {
    padding: '20px',
    maxWidth: '100%',
    margin: '0 auto'
  },
  forecastContent: {
    width: '100%'
  },
  forecastHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px'
  },
  forecastTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: 0,
    marginBottom: '8px',
    color: '#fafafa'
  },
  forecastSubtitle: {
    margin: 0,
    color: '#888',
    fontSize: '14px'
  },
  monthSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  monthLabel: {
    color: '#a1a1aa',
    fontSize: '14px'
  },
  monthSelect: {
    padding: '8px 12px',
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '6px',
    color: '#fafafa',
    fontSize: '14px',
    cursor: 'pointer'
  }
};
