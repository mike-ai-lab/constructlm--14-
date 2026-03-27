import React from 'react';

function ContactSection({ name, email }) {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Get in Touch</h2>
      <p>Name: {name}</p>
      <p>Email: {email}</p>
    </div>
  );
}

export default ContactSection;