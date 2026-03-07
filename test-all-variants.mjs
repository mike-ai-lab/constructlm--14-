const API_KEY = 'csk-pfje3ynhrecd6e4p56d4tcnxhrh452h44thwxk2p2v5pvk45';

const variants = [
  "llama3.3-70b",
  "llama-3.3-70b",
  "llama3-3-70b",
  "meta-llama/Llama-3.3-70B-Instruct"
];

async function test(modelId) {
  try {
    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 5
      })
    });

    if (response.ok) {
      console.log(`✅ WORKS: ${modelId}`);
      return true;
    } else {
      console.log(`❌ FAILS: ${modelId} (${response.status})`);
      return false;
    }
  } catch (e) {
    console.log(`❌ ERROR: ${modelId} - ${e.message}`);
    return false;
  }
}

async function run() {
  console.log('Testing Llama 3.3 70B variants...\n');
  for (const v of variants) {
    await test(v);
    await new Promise(r => setTimeout(r, 500));
  }
}

run();
