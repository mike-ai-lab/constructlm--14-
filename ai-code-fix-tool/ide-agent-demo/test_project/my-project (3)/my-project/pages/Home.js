import React, { useState } from 'react';
import Section from '../components/Section';
import Button from '../components/Button';

export default function Home() {
  const [projects, setProjects] = useState([
    { id: 1, name: 'Project 1', description: 'This is project 1' },
    { id: 2, name: 'Project 2', description: 'This is project 2' },
    { id: 3, name: 'Project 3', description: 'This is project 3' },
  ]);

  return (
    <div>
      <Section title="Welcome to my portfolio">
        <p>I am an interior designer based in Riyadh, with a passion for creating beautiful and functional spaces.</p>
        <Button />
      </Section>
      <Section title="My Projects">
        {projects.map((project) => (
          <div key={project.id} style={{ marginBottom: '20px' }}>
            <h3>{project.name}</h3>
            <p>{project.description}</p>
          </div>
        ))}
      </Section>
      <Section title="Get in Touch">
        <p>If you would like to get in touch with me, please don't hesitate to contact me.</p>
      </Section>
    </div>
  );
}