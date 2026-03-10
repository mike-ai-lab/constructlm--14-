import React from 'react';

export default function ActivityTable() {
  const styles = {
    table: { 
      width: '100%', 
      borderCollapse: 'collapse' 
    },
    th: { 
      padding: '10px', 
      border: '1px solid #ddd' 
    },
    td: { 
      padding: '10px', 
      border: '1px solid #ddd' 
    }
  };

  const activities = [
    { id: 1, date: '2022-01-01', activity: 'Login' },
    { id: 2, date: '2022-01-02', activity: 'Viewed dashboard' },
    { id: 3, date: '2022-01-03', activity: 'Edited profile' }
  ];

  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Date</th>
          <th style={styles.th}>Activity</th>
        </tr>
      </thead>
      <tbody>
        {activities.map(activity => (
          <tr key={activity.id}>
            <td style={styles.td}>{activity.date}</td>
            <td style={styles.td}>{activity.activity}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}