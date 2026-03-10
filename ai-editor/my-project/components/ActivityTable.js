import React from 'react';

export default function ActivityTable() {
  const styles = {
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '10px', border: '1px solid #ddd' },
    td: { padding: '10px', border: '1px solid #ddd' }
  };

  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Date</th>
          <th style={styles.th}>Activity</th>
          <th style={styles.th}>User</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={styles.td}>2022-01-01</td>
          <td style={styles.td}>Login</td>
          <td style={styles.td}>John Doe</td>
        </tr>
        <tr>
          <td style={styles.td}>2022-01-02</td>
          <td style={styles.td}>Logout</td>
          <td style={styles.td}>Jane Doe</td>
        </tr>
      </tbody>
    </table>
  );
}