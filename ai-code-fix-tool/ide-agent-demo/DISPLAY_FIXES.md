Query
How do I use the `Link` component to create links between pages? 🤖 OPENROUTER AGENTIC
🔧
Tool Call
search_codebase
query: "Link component create links between pages"
📦
Result — search_codebase
File	Symbol	BM25 Score	Lines
components/Header.js	—	4.15	L1–41
App.js	—	3.20	L1–41
🔧
Tool Call
read_file
path: "components/Header.js"
📦
Result — read_file
✓ Read 12 of 15 lines (skipped 3)
  1  import React from 'react';
  2  import { Link } from 'react-router-dom';
  3  
  4  export default function Header() {
  5    return (
  6      <div style={{ backgroundColor: '#f0f0f0', padding: '20px', textAlign: 'center' }}>
  7        <h1>Interior Designer Portfolio</h1>
  8        <nav>
  9          <Link to="/" style={{ marginRight: '20px' }}>Home</Link>
 10          <Link to="/about" style={{ marginRight: '20px' }}>About</Link>
 11          <Link to="/contact">Contact</Link>
 12        </nav>
… 3 more lines
🔧
Tool Call
read_file
path: "App.js"
📦
Result — read_file
✓ Read 12 of 21 lines (skipped 9)
  1  import React from 'react';
  2  import { BrowserRouter, Routes, Route } from 'react-router-dom';
  3  import Home from './pages/Home';
  4  import About from './pages/About';
  5  import Contact from './pages/Contact';
  6  import Header from './components/Header';
  7  import Footer from './components/Footer';
  8  
  9  export default function App() {
 10    return (
 11      <BrowserRouter>
 12        <Header />
… 9 more lines
✨
Agent Answer
The project uses React Router for client‑side navigation.
To create a link that takes the user to another page you import the Link component from react‑router‑dom and give it a to prop that matches one of the routes defined in App.js.

Example from the codebase

// components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    

      
Interior Designer Portfolio

      

        Home
        About
        Contact
      

    

  );
}


- Link replaces a normal tag.
- The to prop specifies the path you want to navigate to.
- When a user clicks the link, React Router updates the URL and renders the component associated with that route.

Routes that match those links

// App.js
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';

export default function App() {
  return (
    
      

      
        } />
        } />
        } />
      
      

    
  );
}


The Header component’s Link elements (to="/", to="/about", to="/contact") correspond to the paths defined in App.js. Clicking any of those links will render the appropriate page component (Home, About, or Contact) without a full page reload.