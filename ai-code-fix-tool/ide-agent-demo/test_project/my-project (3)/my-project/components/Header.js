import React from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <div style={{ backgroundColor: '#f0f0f0', padding: '20px', textAlign: 'center' }}>
      <h1>Interior Designer Portfolio</h1>
      <nav>
        <Link to="/" style={{ marginRight: '20px' }}>Home</Link>
        <Link to="/about" style={{ marginRight: '20px' }}>About</Link>
        <Link to="/contact">Contact</Link>
      </nav>
    </div>
  );
}