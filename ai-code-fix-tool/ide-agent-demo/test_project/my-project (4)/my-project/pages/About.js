import React, { useState } from 'react';
import HeaderSection from '../components/HeaderSection';
import AboutMeSection from '../components/AboutMeSection';
import ExperienceSection from '../components/ExperienceSection';
import SkillsSection from '../components/SkillsSection';

function About() {
  const [age, setAge] = useState(30);
  const [location, setLocation] = useState('Riyadh');

  return (
    <div style={{ flex: '1', overflowY: 'auto' }}>
      <HeaderSection />
      <AboutMeSection age={age} location={location} />
      <ExperienceSection />
      <SkillsSection />
    </div>
  );
}

export default About;