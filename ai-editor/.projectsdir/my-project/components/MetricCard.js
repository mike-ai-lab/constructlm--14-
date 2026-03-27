import React from 'react';

export default function MetricCard({ title, value, icon }) {
  const styles = {
    card: { width: '200px', height: '100px', backgroundColor: '#f5f5f5', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
    icon: { fontSize: '24px', marginRight: '10px' }
  };

  return (
    <div style={styles.card}>
      <h2 style={{ fontSize: '18px' }}>{title}</h2>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <i className={icon} style={styles.icon} />
        <span style={{ fontSize: '24px' }}>{value}</span>
      </div>
    </div>
  );
}