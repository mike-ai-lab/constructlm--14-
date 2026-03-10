import React from 'react';

export default function Header() {
  const styles = {
    header: { width: '100%', height: '60px', backgroundColor: '#333', color: '#fff', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    userProfile: { display: 'flex', alignItems: 'center' }
  };

  return (
    <div style={styles.header}>
      <h2>Header</h2>
      <div style={styles.userProfile}>
        <img src="https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=800&h=400&fit=crop" alt="User Profile" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
        <span style={{ marginLeft: '10px' }}>John Doe</span>
      </div>
    </div>
  );
}