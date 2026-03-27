import React from 'react';

function ContactFormSection({ phone, address }) {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Get in Touch</h2>
      <p>Phone: {phone}</p>
      <p>Address: {address}</p>
    </div>
  );
}

export default ContactFormSection;