import React from 'react';

export default function MetricCard({ title, value, icon }) {
  const styles = {
    card: { 
      width: '200px', 
      height: '100px', 
      backgroundColor: '#f5f5f5', 
      padding: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '10px' 
    },
    icon: { 
      fontSize: '24px', 
      marginRight: '10px' 
    }
  };

  return (
    <div style={styles.card}>
      <h3>{title}</h3>
      <p><span style={styles.icon}>{icon}</span>{value}</p>
    </div>
  );
}