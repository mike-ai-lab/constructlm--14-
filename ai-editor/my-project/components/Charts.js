import React from 'react';

export default function Charts() {
  const styles = {
    charts: { display: 'flex', justifyContent: 'space-between' },
    chart: { width: '45%', height: '200px', backgroundColor: '#f5f5f5', padding: '20px' }
  };

  return (
    <div style={styles.charts}>
      <div style={styles.chart}>
        <h2>Line Chart</h2>
        <svg width="100%" height="100%" viewBox="0 0 400 200">
          <path d="M0 100 L100 50 L200 150 L300 100" stroke="#333" strokeWidth="2" fill="none" />
        </svg>
      </div>
      <div style={styles.chart}>
        <h2>Bar Chart</h2>
        <svg width="100%" height="100%" viewBox="0 0 400 200">
          <rect x="50" y="50" width="50" height="100" fill="#333" />
          <rect x="150" y="50" width="50" height="150" fill="#333" />
          <rect x="250" y="50" width="50" height="50" fill="#333" />
        </svg>
      </div>
    </div>
  );
}