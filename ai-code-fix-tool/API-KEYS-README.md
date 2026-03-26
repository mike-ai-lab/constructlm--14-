# API Keys Configuration

## Quick Start

1. **Use the template**: `api-keys-template.json` contains your current API keys
2. **Import in app**: Open Settings → Click "Import JSON" → Select the file
3. **Test all keys**: Click "Test All" to verify all keys at once
4. **Save**: Click "Save Settings" to persist

## Security Features

✅ **Secure Import**: Keys are validated before import
✅ **Format Validation**: Invalid key formats are rejected
✅ **No Exposure**: Keys never leave your browser
✅ **Git Protected**: `*.json` key files are in `.gitignore`

## File Format

```json
{
  "version": "1.0",
  "app": "AI Code Fix Pro V3",
  "keys": {
    "groq": "gsk_...",
    "gemini": "AIza...",
    "cerebras": "csk-...",
    "openrouter": "sk-or-v1-...",
    "ollama": "..."
  },
  "settings": {
    "ollamaBaseUrl": "http://localhost:11434",
    "selectedProvider": "groq",
    "selectedModel": "llama-3.3-70b-versatile"
  }
}
```

## Batch Operations

### Import Keys
1. Click "Import JSON" button
2. Select your JSON file
3. Keys are validated and loaded into form
4. Click "Save Settings" to persist

### Export Keys
1. Click "Export JSON" button
2. File downloads with timestamp: `ai-code-fix-pro-keys-{timestamp}.json`
3. Store securely (encrypted drive, password manager, etc.)

### Test All Keys
1. Click "Test All" button
2. All providers are tested simultaneously
3. Results show: ✓ Valid, ✗ Invalid, ○ Skipped
4. Summary shows how many keys are working

## Key Validation

Each provider has format validation:

- **Groq**: `gsk_[alphanumeric]`
- **Gemini**: `AIza[alphanumeric]`
- **Cerebras**: `csk-[alphanumeric]`
- **OpenRouter**: `sk-or-v1-[hex]`
- **Ollama**: Flexible format (optional for local)

Invalid formats are rejected during import for security.

## Security Best Practices

⚠️ **NEVER commit API keys to version control**
⚠️ **NEVER share your keys file publicly**
⚠️ **NEVER send keys via unencrypted channels**

✅ **DO** store keys in password manager
✅ **DO** use `.gitignore` to exclude key files
✅ **DO** rotate keys regularly
✅ **DO** revoke keys if compromised

## Troubleshooting

### Import Failed
- Check JSON syntax (use JSONLint.com)
- Ensure "keys" object exists
- Verify key formats match patterns

### Test Failed
- Check internet connection
- Verify API key is active (not revoked)
- Check provider status pages
- For Ollama: Ensure local server is running

### Keys Not Persisting
- Click "Save Settings" after import
- Check browser localStorage is enabled
- Try clearing browser cache and re-importing

## File Locations

- **Template**: `api-keys-template.json` (your current keys)
- **Exports**: `ai-code-fix-pro-keys-{timestamp}.json`
- **Storage**: Browser localStorage (namespaced: `ai_code_fix_pro_v3_*`)

## Privacy

- Keys stored in browser localStorage only
- No server-side storage
- No analytics or tracking
- Keys only sent to respective AI providers
- Import/export happens entirely client-side
