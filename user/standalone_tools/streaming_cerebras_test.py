import os
import requests
from pathlib import Path

# Load API key from .env.local
env_path = Path(__file__).parent.parent.parent / '.env.local'
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            if line.startswith('VITE_CEREBRAS_API_KEY='):
                api_key = line.split('=', 1)[1].strip()
                break
else:
    api_key = os.getenv('CEREBRAS_API_KEY')
    if not api_key:
        raise ValueError("CEREBRAS_API_KEY not found in .env.local or environment")

url = "https://api.cerebras.ai/v1/chat/completions"

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

data = {
    "model": "llama3.1-8b",
    "messages": [
        {"role": "user", "content": "Explain digital twins"}
    ],
    "max_tokens": 200,
    "stream": True
}

print("Sending request to Cerebras API...")
response = requests.post(url, headers=headers, json=data, stream=True)

if response.status_code == 200:
    print("\nStreaming response:\n")
    for line in response.iter_lines():
        if line:
            line_text = line.decode('utf-8')
            if line_text.startswith('data: '):
                print(line_text[6:])
else:
    print(f"Error: {response.status_code}")
    print(response.text)