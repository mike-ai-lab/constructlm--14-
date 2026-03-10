import React from 'react';

export default function Header() {
  const styles = {
    header: { 
      width: '100%', 
      height: '60px', 
      backgroundColor: '#333', 
      color: '#fff', 
      padding: '10px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center' 
    },
    profile: { 
      display: 'flex', 
      alignItems: 'center' 
    },
    avatar: { 
      width: '40px', 
      height: '40px', 
      borderRadius: '50%', 
      marginRight: '10px' 
    }
  };

  return (
    <div style={styles.header}>
      <h2>Analytics Dashboard</h2>
      <div style={styles.profile}>
        <img style={styles.avatar} src="https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=800&h=400&fit=crop" alt="Profile Picture" />
        <span>John Doe</span>
      </div>
    </div>
  );
}