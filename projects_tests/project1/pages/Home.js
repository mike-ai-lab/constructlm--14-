import React from 'react';
import Counter from '../components/Counter';

export default function Home() {
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
      <h1>Counter App</h1>
      <Counter />
    </div>
  );
}