import React, { useState } from 'react';
import HeaderSection from '../components/HeaderSection';
import AboutSection from '../components/AboutSection';
import ServicesSection from '../components/ServicesSection';
import PortfolioSection from '../components/PortfolioSection';
import ContactSection from '../components/ContactSection';

function Home() {
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('johndoe@example.com');

  return (
    <div style={{ flex: '1', overflowY: 'auto' }}>
      <HeaderSection />
      <AboutSection />
      <ServicesSection />
      <PortfolioSection />
      <ContactSection name={name} email={email} />
    </div>
  );
}

export default Home;