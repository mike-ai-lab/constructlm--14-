/**
 * Advanced Unit Test for Semantic Patch System
 * Tests that the system sends ONLY relevant code sections, not full files
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000';

// Simulate a REAL large application with big files
const realWorldProject = {
  'dashboard-app/README.md': `# Dashboard Application
A comprehensive analytics dashboard with multiple features.

## Features
- User authentication
- Real-time data visualization
- Export functionality
- Dark mode support
- Responsive design

## Installation
npm install

## Usage
npm start
`,

  'dashboard-app/App.js': `import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import UserProfile from './pages/UserProfile';
import Reports from './pages/Reports';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    // Load user data
    fetch('/api/user')
      .then(res => res.json())
      .then(data => setUser(data));
  }, []);
  
  useEffect(() => {
    // Load notifications
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => setNotifications(data));
  }, []);
  
  const styles = {
    app: { 
      display: 'flex', 
      minHeight: '100vh',
      background: darkMode ? '#1a1a1a' : '#f5f5f5',
      color: darkMode ? '#e0e0e0' : '#333'
    },
    main: { 
      flex: 1, 
      padding: '20px',
      marginLeft: '250px'
    }
  };
  
  const renderPage = () => {
    switch(currentPage) {
      case 'dashboard': return <Dashboard user={user} />;
      case 'analytics': return <Analytics user={user} />;
      case 'settings': return <Settings user={user} darkMode={darkMode} setDarkMode={setDarkMode} />;
      case 'profile': return <UserProfile user={user} />;
      case 'reports': return <Reports user={user} />;
      default: return <Dashboard user={user} />;
    }
  };
  
  return (
    <div style={styles.app}>
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div style={styles.main}>
        <Header user={user} notifications={notifications} darkMode={darkMode} />
        {renderPage()}
      </div>
    </div>
  );
}`,

  'dashboard-app/components/Header.js': `import React, { useState } from 'react';

export default function Header({ user, notifications, darkMode }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const styles = {
    header: {
      padding: '16px 24px',
      background: darkMode ? '#2d2d2d' : 'white',
      borderBottom: \`1px solid \${darkMode ? '#444' : '#e0e0e0'}\`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      margin: 0
    },
    actions: {
      display: 'flex',
      gap: '16px',
      alignItems: 'center'
    },
    notificationBadge: {
      position: 'relative',
      cursor: 'pointer'
    },
    badge: {
      position: 'absolute',
      top: '-8px',
      right: '-8px',
      background: '#f44336',
      color: 'white',
      borderRadius: '50%',
      width: '20px',
      height: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '11px'
    },
    userAvatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: '#007bff',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    }
  };
  
  return (
    <header style={styles.header}>
      <h1 style={styles.title}>Dashboard</h1>
      <div style={styles.actions}>
        <div style={styles.notificationBadge} onClick={() => setShowNotifications(!showNotifications)}>
          🔔
          {notifications && notifications.length > 0 && (
            <span style={styles.badge}>{notifications.length}</span>
          )}
        </div>
        <div style={styles.userAvatar} onClick={() => setShowUserMenu(!showUserMenu)}>
          {user ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
      </div>
    </header>
  );
}`,

  'dashboard-app/components/Sidebar.js': `import React from 'react';

export default function Sidebar({ currentPage, setCurrentPage }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'reports', label: 'Reports', icon: '📄' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];
  
  const styles = {
    sidebar: {
      width: '250px',
      background: '#2c3e50',
      color: 'white',
      padding: '20px',
      position: 'fixed',
      height: '100vh',
      left: 0,
      top: 0
    },
    logo: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '40px',
      textAlign: 'center'
    },
    menu: {
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    menuItem: {
      padding: '12px 16px',
      marginBottom: '8px',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'background 0.2s'
    },
    activeItem: {
      background: '#34495e'
    }
  };
  
  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>MyApp</div>
      <ul style={styles.menu}>
        {menuItems.map(item => (
          <li
            key={item.id}
            style={{
              ...styles.menuItem,
              ...(currentPage === item.id ? styles.activeItem : {})
            }}
            onClick={() => setCurrentPage(item.id)}
          >
            <span style={{ marginRight: '12px' }}>{item.icon}</span>
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}`,

  'dashboard-app/pages/Dashboard.js': `import React, { useState, useEffect } from 'react';

export default function Dashboard({ user }) {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    revenue: 0,
    activeProjects: 0,
    completionRate: 0
  });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fetch dashboard metrics
    Promise.all([
      fetch('/api/metrics').then(r => r.json()),
      fetch('/api/chart-data').then(r => r.json())
    ]).then(([metricsData, chartData]) => {
      setMetrics(metricsData);
      setChartData(chartData);
      setLoading(false);
    });
  }, []);
  
  const styles = {
    container: {
      padding: '20px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    },
    card: {
      background: 'white',
      padding: '24px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    cardTitle: {
      fontSize: '14px',
      color: '#666',
      marginBottom: '8px'
    },
    cardValue: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#333'
    },
    chart: {
      background: 'white',
      padding: '24px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      minHeight: '300px'
    }
  };
  
  if (loading) {
    return <div style={styles.container}>Loading...</div>;
  }
  
  return (
    <div style={styles.container}>
      <h2>Welcome back, {user?.name || 'User'}!</h2>
      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Total Users</div>
          <div style={styles.cardValue}>{metrics.totalUsers.toLocaleString()}</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Revenue</div>
          <div style={styles.cardValue}>\${metrics.revenue.toLocaleString()}</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Active Projects</div>
          <div style={styles.cardValue}>{metrics.activeProjects}</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Completion Rate</div>
          <div style={styles.cardValue}>{metrics.completionRate}%</div>
        </div>
      </div>
      <div style={styles.chart}>
        <h3>Performance Overview</h3>
        <p>Chart data: {chartData.length} data points</p>
      </div>
    </div>
  );
}`
};

// Helper functions
function log(message, data = null) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    if (typeof data === 'object') {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(data);
    }
  }
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  console.log(title);
  console.log('='.repeat(70) + '\n');
}

// Calculate total characters in project
function getTotalChars(files) {
  return Object.values(files).reduce((sum, content) => sum + content.length, 0);
}

// Test semantic context extraction
async function testSemanticContextExtraction() {
  logSection('TESTING SEMANTIC CONTEXT EXTRACTION');
  
  const totalChars = getTotalChars(realWorldProject);
  const totalLines = Object.values(realWorldProject).reduce((sum, content) => 
    sum + content.split('\n').length, 0
  );
  
  log(`📁 Project Statistics:`);
  log(`   Files: ${Object.keys(realWorldProject).length}`);
  log(`   Total lines: ${totalLines}`);
  log(`   Total characters: ${totalChars.toLocaleString()}`);
  
  const testCases = [
    {
      instruction: 'add a search bar to the Header component',
      expectedFile: 'dashboard-app/components/Header.js',
      description: 'Should send only Header component context'
    },
    {
      instruction: 'update the Dashboard to show a loading spinner',
      expectedFile: 'dashboard-app/pages/Dashboard.js',
      description: 'Should send only Dashboard page context'
    },
    {
      instruction: 'add a logout button to the Sidebar',
      expectedFile: 'dashboard-app/components/Sidebar.js',
      description: 'Should send only Sidebar component context'
    }
  ];
  
  for (const testCase of testCases) {
    log(`\n📝 Test: ${testCase.description}`);
    log(`   Instruction: "${testCase.instruction}"`);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${API_URL}/semantic-patch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: testCase.instruction,
          files: realWorldProject
        })
      });
      
      const result = await response.json();
      const endTime = Date.now();
      
      if (result.error) {
        log(`   ❌ Error: ${result.error}`);
        continue;
      }
      
      const filesAnalyzed = result.results?.filesModified || [];
      const tokensUsed = result.usage?.total_tokens || 0;
      const promptTokens = result.usage?.prompt_tokens || 0;
      const completionTokens = result.usage?.completion_tokens || 0;
      
      // Calculate efficiency
      const sentChars = filesAnalyzed.reduce((sum, file) => 
        sum + (realWorldProject[file]?.length || 0), 0
      );
      const efficiency = ((totalChars - sentChars) / totalChars * 100).toFixed(1);
      
      log(`\n   ✅ Results:`);
      log(`   Files found: ${filesAnalyzed.join(', ')}`);
      log(`   Patches applied: ${result.results?.applied?.length || 0}`);
      log(`   Patches failed: ${result.results?.failed?.length || 0}`);
      log(`   Response time: ${endTime - startTime}ms`);
      
      log(`\n   📊 Context Efficiency:`);
      log(`   Total project size: ${totalChars.toLocaleString()} chars`);
      log(`   Context sent: ${sentChars.toLocaleString()} chars`);
      log(`   Reduction: ${efficiency}%`);
      
      log(`\n   📊 Token Usage:`);
      log(`   Total: ${tokensUsed}`);
      log(`   Prompt: ${promptTokens} (context sent to AI)`);
      log(`   Completion: ${completionTokens} (AI response)`);
      
      // CRITICAL CHECK: Verify we're not sending full files
      const avgCharsPerFile = sentChars / filesAnalyzed.length;
      const fullFileAvg = totalChars / Object.keys(realWorldProject).length;
      
      log(`\n   🔍 Semantic Analysis:`);
      log(`   Avg chars per analyzed file: ${avgCharsPerFile.toFixed(0)}`);
      log(`   Avg chars per full file: ${fullFileAvg.toFixed(0)}`);
      
      if (sentChars === totalChars) {
        log(`   ❌ FAIL: Sending ENTIRE project (${totalChars} chars)`);
        log(`   ⚠️  System is NOT using semantic extraction!`);
      } else if (sentChars > totalChars * 0.5) {
        log(`   ⚠️  WARNING: Sending >50% of project`);
        log(`   💡 Should send only relevant code sections`);
      } else {
        log(`   ✅ PASS: Sending minimal context (${efficiency}% reduction)`);
      }
      
    } catch (error) {
      log(`   ❌ FAIL: ${error.message}`);
    }
  }
}

// Test with very large file
async function testLargeFileHandling() {
  logSection('TESTING LARGE FILE HANDLING');
  
  // Create a very large file (simulating real-world scenario)
  const largeFile = `import React, { useState, useEffect } from 'react';

export default function LargeComponent() {
  const [data, setData] = useState([]);
  
  // ... 100+ lines of code ...
  ${Array(50).fill(0).map((_, i) => `  const value${i} = useState(${i});`).join('\n')}
  
  // ... more code ...
  ${Array(50).fill(0).map((_, i) => `  const handler${i} = () => console.log(${i});`).join('\n')}
  
  return (
    <div>
      <h1>Large Component</h1>
      ${Array(20).fill(0).map((_, i) => `      <div>Section ${i}</div>`).join('\n')}
    </div>
  );
}`;

  const projectWithLargeFile = {
    ...realWorldProject,
    'dashboard-app/components/LargeComponent.js': largeFile
  };
  
  const totalChars = getTotalChars(projectWithLargeFile);
  log(`📁 Project with large file: ${totalChars.toLocaleString()} chars`);
  log(`📄 Large file size: ${largeFile.length.toLocaleString()} chars`);
  
  const instruction = 'add a button to the Header component';
  log(`\n📝 Instruction: "${instruction}"`);
  log(`   Expected: Should NOT send the large file`);
  
  try {
    const response = await fetch(`${API_URL}/semantic-patch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instruction,
        files: projectWithLargeFile
      })
    });
    
    const result = await response.json();
    
    if (result.error) {
      log(`❌ Error: ${result.error}`);
      return;
    }
    
    const filesAnalyzed = result.results?.filesModified || [];
    const tokensUsed = result.usage?.total_tokens || 0;
    
    log(`\n✅ Results:`);
    log(`   Files analyzed: ${filesAnalyzed.join(', ')}`);
    log(`   Tokens used: ${tokensUsed}`);
    
    if (filesAnalyzed.includes('dashboard-app/components/LargeComponent.js')) {
      log(`   ❌ FAIL: Sent irrelevant large file!`);
    } else {
      log(`   ✅ PASS: Did NOT send irrelevant large file`);
    }
    
  } catch (error) {
    log(`❌ FAIL: ${error.message}`);
  }
}

// Main test runner
async function runTests() {
  console.log('\n🧪 ADVANCED SEMANTIC PATCH SYSTEM TEST\n');
  console.log('Testing that system sends ONLY relevant code sections, not full files\n');
  
  // Check server
  try {
    const healthCheck = await fetch(`${API_URL}/health`);
    if (!healthCheck.ok) {
      console.error('❌ Server not responding');
      process.exit(1);
    }
    log('✓ Server is running');
  } catch (error) {
    console.error('❌ Cannot connect to server');
    process.exit(1);
  }
  
  await testSemanticContextExtraction();
  await testLargeFileHandling();
  
  logSection('TEST SUMMARY');
  log('✅ All tests completed\n');
  log('💡 Expected behavior:');
  log('   • System should send <50% of total project size');
  log('   • Only relevant files should be analyzed');
  log('   • Large irrelevant files should be skipped');
  log('   • Token usage should be minimal\n');
}

runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
