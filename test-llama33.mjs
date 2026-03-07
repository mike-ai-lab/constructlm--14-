const API_KEY = 'csk-pfje3ynhrecd6e4p56d4tcnxhrh452h44thwxk2p2v5pvk45';

async function test() {
  const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: "llama3.3-70b",
      messages: [{ role: "user", content: "Say 'Working!' in one word." }],
      max_tokens: 10
    })
  });

  const text = await response.text();
  console.log(`Status: ${response.status}`);
  console.log(`Response: ${text}`);
}

test();
