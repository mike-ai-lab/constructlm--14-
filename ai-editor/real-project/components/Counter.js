import React, { useState } from 'react';
import Button from '../components/Button';

export default function Counter() {
  const [count, setCount] = useState(0);

  const increment = () => {
    setCount(count + 1);
  };

  const decrement = () => {
    setCount(count - 1);
  };

  const styles = {
    container: {
      padding: '20px',
      backgroundColor: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    },
    count: {
      fontSize: '24px',
      fontWeight: 'bold'
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.count}>{count}</h1>
      <Button style={{ backgroundColor: 'green', color: 'white' }} onClick={increment}>
        Increment
      </Button>
      <Button style={{ backgroundColor: 'red', color: 'white' }} onClick={decrement}>
        Decrement
      </Button>
    </div>
  );
}