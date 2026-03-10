import React from 'react';

export default function Charts() {
  const styles = {
    charts: { 
      display: 'flex', 
      justifyContent: 'space-between' 
    },
    chart: { 
      width: '45%', 
      height: '300px', 
      backgroundColor: '#f5f5f5', 
      padding: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '10px' 
    }
  };

  const lineChart = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [{
      label: 'Line Chart',
      data: [10, 20, 30, 40, 50],
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 1
    }]
  };

  const barChart = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [{
      label: 'Bar Chart',
      data: [10, 20, 30, 40, 50],
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  };

  return (
    <div style={styles.charts}>
      <div style={styles.chart}>
        <h3>Line Chart</h3>
        <canvas width="400" height="200"></canvas>
        {/* Render line chart using lineChart data */}
      </div>
      <div style={styles.chart}>
        <h3>Bar Chart</h3>
        <canvas width="400" height="200"></canvas>
        {/* Render bar chart using barChart data */}
      </div>
    </div>
  );
}