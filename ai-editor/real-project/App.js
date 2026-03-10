import React from 'react';
import Home from './pages/Home';

export default function App() {
  const styles = {
    container: {
      padding: '20px',
      backgroundColor: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }
  };

  return (
    <div style={styles.container}>
      <Home />
    </div>
  );
}