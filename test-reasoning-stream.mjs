const API_KEY = 'csk-pfje3ynhrecd6e4p56d4tcnxhrh452h44thwxk2p2v5pvk45';

async function testReasoning() {
  console.log('🧪 Testing GPT OSS 120B with Reasoning\n');
  
  const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-oss-120b",
      messages: [
        { role: "user", content: "What is 2+2? Think step by step." }
      ],
      stream: true,
      max_tokens: 200
    })
  });

  if (!response.ok) {
    console.log(`❌ Error: ${response.status}`);
    console.log(await response.text());
    return;
  }

  console.log('✅ Streaming response:\n');
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(l => l.trim());
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        
        try {
          const json = JSON.parse(data);
          const content = json.choices?.[0]?.delta?.content;
          if (content) {
            process.stdout.write(content);
            fullText += content;
          }
        } catch (e) {}
      }
    }
  }
  
  console.log('\n\n' + '='.repeat(60));
  console.log('Full response length:', fullText.length, 'chars');
  console.log('Contains <think>:', fullText.includes('<think>'));
  console.log('Contains <reasoning>:', fullText.includes('<reasoning>'));
  console.log('='.repeat(60));
}

testReasoning();
