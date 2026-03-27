/**
 * Live Test - Reasoning Display with Real API
 * Tests the actual application with OpenRouter API
 */

import fetch from 'node-fetch';
import fs from 'fs';

// Get API key from environment
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.openrouter_api_key;

if (!OPENROUTER_API_KEY) {
  console.error('❌ No OpenRouter API key found in environment variables');
  console.error('Set OPENROUTER_API_KEY or openrouter_api_key');
  process.exit(1);
}

console.log('🧪 Testing Reasoning Display with Live API\n');
console.log('API Key:', OPENROUTER_API_KEY.substring(0, 10) + '...\n');

async function testReasoning() {
  try {
    console.log('📤 Sending request to agent...\n');
    
    const response = await fetch('http://localhost:3001/api/agent/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'Find all security vulnerabilities in the authentication system',
        provider: 'openrouter',
        apiKey: OPENROUTER_API_KEY,
        strategy: 'agentic'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('✅ Connected to server, streaming response...\n');
    console.log('═'.repeat(70));

    let buffer = '';
    let reasoningCount = 0;
    let toolCallCount = 0;
    let hasAnswer = false;

    for await (const chunk of response.body) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data: ')) continue;
        
        const data = line.slice(6);
        if (data === '[DONE]') {
          console.log('\n' + '═'.repeat(70));
          console.log('✅ Stream completed');
          continue;
        }

        try {
          const event = JSON.parse(data);
          
          switch (event.type) {
            case 'reasoning':
              reasoningCount++;
              console.log(`\n🧠 REASONING #${reasoningCount}:`);
              console.log('─'.repeat(70));
              console.log(event.content);
              console.log('─'.repeat(70));
              break;
            
            case 'tool_call':
              toolCallCount++;
              console.log(`\n🔧 Tool Call #${toolCallCount}: ${event.tool}`);
              console.log(`   Args: ${JSON.stringify(event.args)}`);
              break;
            
            case 'tool_result':
              console.log(`✓ Tool Result: ${event.tool}`);
              break;
            
            case 'answer':
              hasAnswer = true;
              console.log('\n📝 ANSWER:');
              console.log('─'.repeat(70));
              console.log(event.content);
              break;
            
            case 'error':
              console.error(`\n❌ ERROR: ${event.message}`);
              break;
            
            case 'done':
              console.log('\n✅ Agent finished');
              break;
          }
        } catch (e) {
          console.warn('⚠️ Parse error:', e.message);
        }
      }
    }

    console.log('\n' + '═'.repeat(70));
    console.log('📊 SUMMARY:');
    console.log(`   Reasoning blocks: ${reasoningCount}`);
    console.log(`   Tool calls: ${toolCallCount}`);
    console.log(`   Answer received: ${hasAnswer ? 'YES' : 'NO'}`);
    console.log('═'.repeat(70));

    if (reasoningCount === 0) {
      console.log('\n❌ NO REASONING DETECTED!');
      console.log('   This means the model is not outputting <think> tags');
      console.log('   or the server is not detecting them properly.');
    } else {
      console.log(`\n✅ SUCCESS! ${reasoningCount} reasoning blocks detected!`);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testReasoning();
