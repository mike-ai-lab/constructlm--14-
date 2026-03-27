import React, { useState } from 'react';
import HeaderSection from '../components/HeaderSection';
import ContactFormSection from '../components/ContactFormSection';
import MapSection from '../components/MapSection';
import SocialMediaSection from '../components/SocialMediaSection';

function Contact() {
  const [phone, setPhone] = useState('1234567890');
  const [address, setAddress] = useState('123 Main St');

  return (
    <div style={{ flex: '1', overflowY: 'auto' }}>
      <HeaderSection />
      <ContactFormSection phone={phone} address={address} />
      <MapSection />
      <SocialMediaSection />
    </div>
  );
}

export default Contact;