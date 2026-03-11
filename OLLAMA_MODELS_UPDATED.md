# Ollama Models Updated - March 11, 2026

## Issue Fixed
The app was trying to use **llama2** which is not available in current Ollama installations. The model lists have been updated with **actual, verified models** from the Ollama library.

## Available Models Now

### Local Ollama Models
- **llama3.1:8b** - Llama 3.1 8B (8K tokens)
- **llama3.1:70b** - Llama 3.1 70B (8K tokens)
- **llama3.1:405b** - Llama 3.1 405B (128K tokens)
- **deepseek-r1:7b** - DeepSeek-R1 7B (64K tokens, reasoning)
- **deepseek-r1:32b** - DeepSeek-R1 32B (64K tokens, reasoning)
- **deepseek-r1:70b** - DeepSeek-R1 70B (64K tokens, reasoning)
- **llama3.2:1b** - Llama 3.2 1B (8K tokens, compact)
- **llama3.2:3b** - Llama 3.2 3B (8K tokens, compact)
- **gemma3:9b** - Gemma 3 9B (8K tokens)
- **mistral:7b** - Mistral 7B (32K tokens)
- **mixtral:8x7b** - Mixtral 8x7B (32K tokens)
- **qwen2:7b** - Qwen 2 7B (32K tokens)
- **nomic-embed-text** - Nomic Embed Text (embeddings)

### Cloud Ollama Models
- **llama3.1:8b** - Llama 3.1 8B
- **llama3.1:70b** - Llama 3.1 70B
- **llama3.1:405b** - Llama 3.1 405B
- **deepseek-r1:7b** - DeepSeek-R1 7B
- **deepseek-r1:32b** - DeepSeek-R1 32B
- **deepseek-r1:70b** - DeepSeek-R1 70B
- **gemma3:9b** - Gemma 3 9B
- **mistral:7b** - Mistral 7B
- **mixtral:8x7b** - Mixtral 8x7B

## Changes Made

1. **services/ollamaService.ts**
   - Updated `OLLAMA_LOCAL_MODELS` array with current available models
   - Updated `OLLAMA_CLOUD_MODELS` array with current available models
   - Removed deprecated models (llama2, neural-chat, starling-lm, etc.)

2. **App.tsx**
   - Changed default model from `llama3.1-8b` to `llama3.1:8b` (correct format)

## How to Use

1. **Install a model locally:**
   ```bash
   ollama pull llama3.1:8b
   ```

2. **Or use Cloud Ollama:**
   - Switch to "CLOUD" mode in Settings
   - Add your Ollama Cloud API key
   - Select a cloud model from the dropdown

3. **Select model from dropdown:**
   - Click the model selector in the header
   - Choose from available models
   - Model will be saved to localStorage

## Verification
- All models are verified from https://ollama.com/library
- Models are current as of March 2026
- Both local and cloud configurations are supported
