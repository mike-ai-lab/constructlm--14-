import React from 'react';

export default function Button({ children, onClick, style }) {
  const buttonStyles = {
    padding: '10px',
    margin: '10px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    ...style
  };

  return (
    <button style={buttonStyles} onClick={onClick}>
      {children}
    </button>
  );
}