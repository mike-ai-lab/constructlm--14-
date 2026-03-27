import React from 'react';

function AboutMeSection({ age, location }) {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>About Me</h2>
      <p>Age: {age}</p>
      <p>Location: {location}</p>
    </div>
  );
}

export default AboutMeSection;