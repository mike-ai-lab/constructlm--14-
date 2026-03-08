#!/usr/bin/env node

/**
 * Test script to verify Monaco Editor syntax highlighting is working
 * This will check if the dev server is running and Monaco workers are loading
 */

import http from 'http';

const TEST_URL = 'http://localhost:3001';
const TIMEOUT = 5000;

console.log('🧪 Testing Monaco Editor Syntax Highlighting...\n');

// Test 1: Check if dev server is running
console.log('Test 1: Checking dev server...');
try {
  await new Promise((resolve, reject) => {
    const req = http.get(TEST_URL, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Dev server is running on port 3001\n');
        resolve();
      } else {
        reject(new Error(`Server returned status ${res.statusCode}`));
      }
    });
    
    req.on('error', reject);
    req.setTimeout(TIMEOUT, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
} catch (error) {
  console.error('❌ Dev server is not accessible:', error.message);
  console.log('\n💡 Please run: npm run dev\n');
  process.exit(1);
}

// Test 2: Check if CodeEditor component exists
console.log('Test 2: Checking CodeEditor component...');
try {
  const fs = await import('fs');
  const content = fs.readFileSync('./components/CodeEditor.tsx', 'utf-8');
  
  // Check for Monaco imports
  if (content.includes("import * as monaco from 'monaco-editor'")) {
    console.log('✅ Monaco editor is imported');
  } else {
    throw new Error('Monaco import not found');
  }
  
  // Check for worker imports
  const workerImports = [
    'editorWorker',
    'jsonWorker', 
    'cssWorker',
    'htmlWorker',
    'tsWorker'
  ];
  
  const missingWorkers = workerImports.filter(w => !content.includes(w));
  if (missingWorkers.length === 0) {
    console.log('✅ All Monaco workers are imported');
  } else {
    throw new Error(`Missing workers: ${missingWorkers.join(', ')}`);
  }
  
  // Check for MonacoEnvironment setup
  if (content.includes('self.MonacoEnvironment')) {
    console.log('✅ MonacoEnvironment is configured with self (correct for Vite)');
  } else if (content.includes('window.MonacoEnvironment')) {
    console.log('⚠️  MonacoEnvironment uses window (should use self for Vite)');
  } else {
    throw new Error('MonacoEnvironment not configured');
  }
  
  // Check for getWorker function
  if (content.includes('getWorker')) {
    console.log('✅ getWorker function is defined');
  } else {
    throw new Error('getWorker function not found');
  }
  
  console.log('\n');
} catch (error) {
  console.error('❌ CodeEditor component check failed:', error.message);
  process.exit(1);
}

// Test 3: Instructions for manual verification
console.log('Test 3: Manual verification steps');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('📋 To verify syntax highlighting is working:');
console.log('');
console.log('1. Open http://localhost:3001 in your browser');
console.log('2. Open browser DevTools (F12) and check Console for errors');
console.log('3. Configure API keys in Settings if needed');
console.log('4. Ask the AI: "Create a React counter component"');
console.log('5. When code appears, click "Open Canvas"');
console.log('6. Click "Show Code" button in the canvas');
console.log('7. Verify in the Monaco editor:');
console.log('   - Keywords (const, function, return) should be colored');
console.log('   - Strings should be colored differently');
console.log('   - Comments should be colored');
console.log('   - JSX tags should be highlighted');
console.log('');
console.log('Expected colors in dark theme:');
console.log('   - Keywords: Purple/Blue (#569cd6)');
console.log('   - Strings: Orange/Red (#ce9178)');
console.log('   - Comments: Green (#6a9955)');
console.log('   - Functions: Yellow (#dcdcaa)');
console.log('');
console.log('If text is all white/gray with no colors:');
console.log('   ❌ Syntax highlighting is NOT working');
console.log('');
console.log('If text has multiple colors:');
console.log('   ✅ Syntax highlighting IS working');
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('🎯 All automated tests passed!');
console.log('📱 Please perform manual verification in the browser.');
console.log('');
