import React from 'react';

export default function Sidebar() {
  const styles = {
    sidebar: { 
      width: '200px', 
      height: '100vh', 
      backgroundColor: '#333', 
      color: '#fff', 
      padding: '20px' 
    },
    link: { 
      textDecoration: 'none', 
      color: '#fff' 
    }
  };

  return (
    <div style={styles.sidebar}>
      <h2>Navigation</h2>
      <ul>
        <li><a style={styles.link} href="#">Dashboard</a></li>
        <li><a style={styles.link} href="#">Reports</a></li>
        <li><a style={styles.link} href="#">Settings</a></li>
      </ul>
    </div>
  );
}