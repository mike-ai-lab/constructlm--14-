# Settings Modal Upgrade Plan

## Current App (Simple)
- Only 2 providers: Gemini, Cerebras
- Simple single-page layout
- Basic API key input with test buttons
- No tabs or organization

## ConstructLM-1 App (Advanced)
- 5 providers: Google, OpenAI, Groq, Cerebras, AWS
- Tabbed interface with 5 sections
- Advanced features: data export/import, user profile, local models
- Better organized and scalable

---

## PLAN: Upgrade Current App Settings Modal

### Phase 1: Add New API Key Fields (Keep Simple Layout)
We'll add support for all providers but keep the simple single-page layout for now.

**New API Keys to Add:**
1. ✅ **Gemini** (already exists)
2. ✅ **Cerebras** (already exists)
3. ➕ **Groq** (NEW) - `GROQ_API_KEY`
4. ➕ **OpenAI** (NEW) - `OPENAI_API_KEY`
5. ➕ **AWS Bedrock** (NEW) - `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`

### Phase 2: Update App.tsx State Management
Add state for new API keys:
```typescript
const [groqApiKey, setGroqApiKey] = useState('');
const [openaiApiKey, setOpenaiApiKey] = useState('');
const [awsAccessKey, setAwsAccessKey] = useState('');
const [awsSecretKey, setAwsSecretKey] = useState('');
```

### Phase 3: Update Model Registry
Use the model registry pattern from ConstructLM-1:
- Create `services/modelRegistry.ts`
- Define all 38 models with metadata
- Helper functions: `getModel()`, `getApiKeyForModel()`, `saveApiKey()`

### Phase 4: Update SettingsModal Component
**Keep current simple layout but add:**
1. Groq API key input with test button
2. OpenAI API key input with test button
3. AWS credentials (Access Key + Secret Key)
4. Test functions for each provider
5. Save all keys to localStorage

**Test Functions to Add:**
- `testGroqKey()` - Test with llama-3.3-70b-versatile
- `testOpenaiKey()` - Test with gpt-4o-mini
- `testAwsKey()` - Test with Claude (requires AWS SDK)

### Phase 5: Update Services
**New Service Files:**
1. `services/groqService.ts` - Groq API integration
2. `services/openaiService.ts` - OpenAI API integration
3. `services/awsBedrockService.ts` - AWS Bedrock integration

---

## IMPLEMENTATION ORDER

1. ✅ **First**: Add Groq + OpenAI + AWS API key fields to SettingsModal
2. ✅ **Second**: Update App.tsx to manage new API keys
3. ✅ **Third**: Create modelRegistry.ts with all 38 models
4. ✅ **Fourth**: Create new service files (groqService, openaiService, awsBedrockService)
5. ✅ **Fifth**: Update model dropdown to show all models grouped by provider
6. ✅ **Sixth**: Test everything works

---

## MODELS TO ADD (33 NEW MODELS)

### Groq (11 models)
- llama-3.3-70b-versatile
- llama-3.1-8b-instant
- qwen/qwen3-32b (with thinking support)
- meta-llama/llama-4-scout-17b-16e-instruct
- meta-llama/llama-4-maverick-17b-128e-instruct
- openai/gpt-oss-120b
- openai/gpt-oss-safeguard-20b
- openai/gpt-oss-20b
- meta-llama/llama-guard-4-12b
- meta-llama/llama-prompt-guard-2-86m
- meta-llama/llama-prompt-guard-2-22m

### Cerebras (2 additional models)
- llama3.3-70b (add to existing)
- qwen-3-235b-a22b-instruct-2507 (add to existing)
- zai-glm-4.7 (add to existing)

### OpenAI (2 models)
- gpt-4o
- gpt-4o-mini

### AWS Bedrock (4 models)
- anthropic.claude-3-5-sonnet-20241022-v2:0
- anthropic.claude-3-haiku-20240307-v1:0
- meta.llama3-70b-instruct-v1:0
- mistral.mistral-large-2402-v1:0

### Gemini (keep existing 4 models)
- gemini-2.5-flash
- gemini-2.0-flash-exp
- gemini-1.5-pro
- gemini-1.5-flash

---

## READY TO PROCEED?

Confirm and I'll start implementing:
1. Update SettingsModal with new API key fields
2. Create modelRegistry.ts
3. Add new service files
4. Update model dropdown

This will give you access to ALL 38 models!
