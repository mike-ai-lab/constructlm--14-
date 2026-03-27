import React from 'react';
import Button from './Button';

function Header() {
  return (
    <div style={{ backgroundColor: '#333', color: '#fff', padding: '20px', textAlign: 'center' }}>
      <h1>Interior Designer Portfolio</h1>
      <Button>Get Started</Button>
    </div>
  );
}

export default Header;