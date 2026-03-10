import React, { useState } from 'react';

export default function Sidebar() {
  const [active, setActive] = useState('dashboard');
  const styles = {
    sidebar: { width: '200px', height: '100vh', backgroundColor: '#333', color: '#fff', padding: '20px' },
    link: { textDecoration: 'none', color: '#fff' },
    activeLink: { color: '#00ff00' }
  };

  return (
    <div style={styles.sidebar}>
      <h2>Sidebar</h2>
      <ul>
        <li>
          <a style={active === 'dashboard' ? styles.activeLink : styles.link} href="#" onClick={() => setActive('dashboard')}>Dashboard</a>
        </li>
        <li>
          <a style={active === 'settings' ? styles.activeLink : styles.link} href="#" onClick={() => setActive('settings')}>Settings</a>
        </li>
        <li>
          <a style={active === 'profile' ? styles.activeLink : styles.link} href="#" onClick={() => setActive('profile')}>Profile</a>
        </li>
      </ul>
    </div>
  );
}