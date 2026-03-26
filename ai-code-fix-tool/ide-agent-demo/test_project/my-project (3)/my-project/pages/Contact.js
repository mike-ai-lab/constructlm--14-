import React, { useState } from 'react';
import Section from '../components/Section';
import Button from '../components/Button';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(name, email, message);
  };

  return (
    <div>
      <Section title="Get in Touch">
        <p>If you would like to get in touch with me, please fill out the form below.</p>
        <form onSubmit={handleSubmit}>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
          <Button type="submit" />
        </form>
      </Section>
    </div>
  );
}