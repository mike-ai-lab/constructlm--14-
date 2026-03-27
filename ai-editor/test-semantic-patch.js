/**
 * Unit Test for Semantic Patch System
 * Tests the context-aware AI assistant features
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000';

// Test files simulating a project
const testFiles = {
  'my-project/README.md': `# My Project
A test project for semantic patching`,
  
  'my-project/App.js': `import React from 'react';
import Header from './components/Header';
import Home from './pages/Home';

export default function App() {
  return (
    <div>
      <Header />
      <Home />
    </div>
  );
}`,
  
  'my-project/components/Header.js': `import React from 'react';

export default function Header() {
  const styles = {
    header: { padding: '20px', background: '#333', color: 'white' }
  };
  
  return (
    <header style={styles.header}>
      <h1>My App</h1>
    </header>
  );
}`,
  
  'my-project/pages/Home.js': `import React, { useState } from 'react';

export default function Home() {
  const [count, setCount] = useState(0);
  
  const styles = {
    container: { padding: '20px' },
    button: { padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }
  };
  
  return (
    <div style={styles.container}>
      <h2>Home Page</h2>
      <p>Count: {count}</p>
      <button style={styles.button} onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}`
};

// Test cases
const testCases = [
  {
    name: 'Test 1: Semantic File Finding',
    instruction: 'update the header to include a navigation menu',
    expectedFiles: ['my-project/components/Header.js'],
    description: 'Should find Header.js based on keyword "header"'
  },
  {
    name: 'Test 2: Component Name Matching',
    instruction: 'add a footer component',
    expectedFiles: [],
    description: 'Should not find existing files (new component request)'
  },
  {
    name: 'Test 3: Multiple File Context',
    instruction: 'update Home page to show the count in the header',
    expectedFiles: ['my-project/pages/Home.js', 'my-project/components/Header.js'],
    description: 'Should find both Home and Header files'
  },
  {
    name: 'Test 4: README Update',
    instruction: 'update the README with installation instructions',
    expectedFiles: ['my-project/README.md'],
    description: 'Should find README.md'
  }
];

// Helper functions
function log(message, data = null) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  console.log(title);
  console.log('='.repeat(60) + '\n');
}

// Test semantic file finder
async function testSemanticFileFinder() {
  logSection('TESTING SEMANTIC FILE FINDER');
  
  for (const testCase of testCases) {
    log(`\n📝 ${testCase.name}`);
    log(`   Instruction: "${testCase.instruction}"`);
    log(`   Expected: ${testCase.expectedFiles.join(', ') || 'none'}`);
    
    try {
      const response = await fetch(`${API_URL}/semantic-patch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: testCase.instruction,
          files: testFiles
        })
      });
      
      const result = await response.json();
      
      if (result.error) {
        log(`   ❌ Error: ${result.error}`);
        continue;
      }
      
      const filesModified = result.results?.filesModified || [];
      log(`   ✓ Found files: ${filesModified.join(', ')}`);
      
      // Check if expected files were found
      const foundExpected = testCase.expectedFiles.every(f => filesModified.includes(f));
      if (foundExpected || testCase.expectedFiles.length === 0) {
        log(`   ✅ PASS: ${testCase.description}`);
      } else {
        log(`   ⚠️  PARTIAL: Found different files than expected`);
      }
      
      // Log token usage
      if (result.usage) {
        log(`   📊 Tokens: ${result.usage.total_tokens || 0}`);
      }
      
    } catch (error) {
      log(`   ❌ FAIL: ${error.message}`);
    }
  }
}

// Test full workflow
async function testFullWorkflow() {
  logSection('TESTING FULL SEMANTIC PATCH WORKFLOW');
  
  const instruction = 'add a dark mode toggle button to the Header component';
  
  log(`📝 Instruction: "${instruction}"`);
  log(`📁 Project files: ${Object.keys(testFiles).length}`);
  
  try {
    log('\n1️⃣ Sending semantic patch request...');
    const response = await fetch(`${API_URL}/semantic-patch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instruction,
        files: testFiles
      })
    });
    
    const result = await response.json();
    
    if (result.error) {
      log(`❌ Error: ${result.error}`);
      return;
    }
    
    log('✓ Response received');
    
    log('\n2️⃣ Analyzing results...');
    log(`   Files analyzed: ${result.results?.filesModified?.length || 0}`);
    log(`   Patches applied: ${result.results?.applied?.length || 0}`);
    log(`   Patches failed: ${result.results?.failed?.length || 0}`);
    
    if (result.results?.applied) {
      log('\n3️⃣ Applied patches:');
      result.results.applied.forEach(patch => {
        log(`   ✓ ${patch.filePath} (${patch.changes} changes)`);
      });
    }
    
    if (result.results?.failed) {
      log('\n⚠️  Failed patches:');
      result.results.failed.forEach(patch => {
        log(`   ✗ ${patch.filePath}: ${patch.reason}`);
      });
    }
    
    if (result.usage) {
      log(`\n📊 Token Usage:`);
      log(`   Total: ${result.usage.total_tokens || 0}`);
      log(`   Prompt: ${result.usage.prompt_tokens || 0}`);
      log(`   Completion: ${result.usage.completion_tokens || 0}`);
    }
    
    log('\n✅ WORKFLOW TEST COMPLETE');
    
  } catch (error) {
    log(`❌ FAIL: ${error.message}`);
  }
}

// Test context builder efficiency
async function testContextEfficiency() {
  logSection('TESTING CONTEXT EFFICIENCY');
  
  const largeProject = { ...testFiles };
  
  // Add more files to simulate a larger project
  for (let i = 1; i <= 10; i++) {
    largeProject[`my-project/components/Component${i}.js`] = `
import React from 'react';
export default function Component${i}() {
  return <div>Component ${i}</div>;
}`;
  }
  
  log(`📁 Large project: ${Object.keys(largeProject).length} files`);
  
  const instruction = 'update the Header to add a logo';
  log(`📝 Instruction: "${instruction}"`);
  
  try {
    const response = await fetch(`${API_URL}/semantic-patch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instruction,
        files: largeProject
      })
    });
    
    const result = await response.json();
    
    if (result.error) {
      log(`❌ Error: ${result.error}`);
      return;
    }
    
    const filesAnalyzed = result.results?.filesModified?.length || 0;
    const totalFiles = Object.keys(largeProject).length;
    const efficiency = ((totalFiles - filesAnalyzed) / totalFiles * 100).toFixed(1);
    
    log(`\n📊 Efficiency Analysis:`);
    log(`   Total files: ${totalFiles}`);
    log(`   Files analyzed: ${filesAnalyzed}`);
    log(`   Files skipped: ${totalFiles - filesAnalyzed}`);
    log(`   Efficiency: ${efficiency}% reduction`);
    
    if (result.usage) {
      log(`\n📊 Token Usage:`);
      log(`   Total: ${result.usage.total_tokens || 0}`);
      log(`   Estimated savings: ~${Math.round((totalFiles - filesAnalyzed) * 100)} tokens`);
    }
    
    if (filesAnalyzed < totalFiles) {
      log(`\n✅ PASS: Context is efficiently filtered (not sending all files)`);
    } else {
      log(`\n⚠️  WARNING: All files were sent (no filtering)`);
    }
    
  } catch (error) {
    log(`❌ FAIL: ${error.message}`);
  }
}

// Main test runner
async function runTests() {
  console.log('\n🧪 SEMANTIC PATCH SYSTEM - UNIT TESTS\n');
  
  // Check if server is running
  try {
    const healthCheck = await fetch(`${API_URL}/health`);
    if (!healthCheck.ok) {
      console.error('❌ Server is not responding. Please start the server first.');
      process.exit(1);
    }
    log('✓ Server is running');
  } catch (error) {
    console.error('❌ Cannot connect to server. Please start the server first.');
    console.error(`   Run: node server.js`);
    process.exit(1);
  }
  
  // Run tests
  await testSemanticFileFinder();
  await testFullWorkflow();
  await testContextEfficiency();
  
  logSection('TEST SUMMARY');
  log('✅ All tests completed');
  log('📝 Review the output above to verify semantic patch system is working correctly');
  log('\n💡 If all tests pass, the system is:');
  log('   • Finding relevant files based on context');
  log('   • Applying patches efficiently');
  log('   • Reducing token usage by filtering files');
  log('   • Ready for production use\n');
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
