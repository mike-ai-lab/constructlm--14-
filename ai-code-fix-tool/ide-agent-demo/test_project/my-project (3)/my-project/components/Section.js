import React from 'react';

export default function Section({ title, children }) {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f9f9f9', marginBottom: '20px' }}>
      <h2 style={{ marginBottom: '10px' }}>{title}</h2>
      {children}
    </div>
  );
}