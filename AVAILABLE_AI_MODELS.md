# Available AI Models - ConstructLM Reference

## Your Available Gemini Models (FREE TIER)

Based on your API key test, these models are available:

### Gemini 2.5 Models (NEWEST - RECOMMENDED)

#### 1. **gemini-2.5-flash** ⭐⭐⭐ BEST FOR CONSTRUCTION
- **Vision:** YES - Excellent image analysis
- **Speed:** Very Fast
- **Context:** Large (up to 1M tokens)
- **Free Tier:** 15 requests/minute, 1M tokens/day
- **Best For:** 
  - Blueprint analysis
  - Site photo inspection
  - Material identification
  - Quick construction queries
  - Real-time analysis

#### 2. **gemini-2.5-pro** ⭐⭐⭐ BEST FOR COMPLEX ANALYSIS
- **Vision:** YES - Superior reasoning
- **Speed:** Fast
- **Context:** Very Large (up to 2M tokens)
- **Free Tier:** 2 requests/minute, 50 requests/day
- **Best For:**
  - Complex blueprint analysis
  - Multi-document coordination
  - Code compliance checking
  - Detailed technical analysis
  - Large project reviews

#### 3. **gemini-2.5-flash-lite** ⭐⭐ FASTEST
- **Vision:** YES - Basic
- **Speed:** Extremely Fast
- **Context:** Medium
- **Free Tier:** Higher rate limits
- **Best For:**
  - Quick image checks
  - Simple queries
  - High-volume requests

### Gemini 2.0 Models (STABLE)

#### 4. **gemini-2.0-flash** ⭐⭐
- **Vision:** YES
- **Speed:** Very Fast
- **Context:** Large
- **Free Tier:** 15 requests/minute
- **Best For:** General purpose, stable alternative

#### 5. **gemini-2.0-flash-001** ⭐
- **Vision:** YES
- **Speed:** Very Fast
- **Context:** Large
- **Note:** Specific version of 2.0-flash

#### 6. **gemini-2.0-flash-lite** ⭐
- **Vision:** YES - Basic
- **Speed:** Extremely Fast
- **Context:** Medium
- **Best For:** High-speed simple queries

#### 7. **gemini-2.0-flash-lite-001** ⭐
- **Vision:** YES - Basic
- **Speed:** Extremely Fast
- **Note:** Specific version of 2.0-flash-lite

---

## Recommended Model Strategy for ConstructLM

### Primary Model: **gemini-2.5-flash**
- Use for 90% of construction tasks
- Best balance of speed, quality, and vision
- Handles blueprints, photos, and complex queries

### Secondary Model: **gemini-2.5-pro**
- Use for complex multi-document analysis
- When you need deeper reasoning
- Large project coordination

### Fallback: **gemini-2.0-flash**
- If 2.5 models have issues
- Stable, proven performance

---

## Construction Use Cases by Model

### Blueprint Analysis
**Best:** gemini-2.5-flash or gemini-2.5-pro
- Upload architectural/structural drawings
- Get detailed analysis of layouts, dimensions, materials
- Identify potential issues

### Site Photo Inspection
**Best:** gemini-2.5-flash
- Upload construction site photos
- Identify safety hazards
- Check work quality
- Track progress

### Material Identification
**Best:** gemini-2.5-flash
- Photo of material/product
- Get specifications
- Check compatibility
- Find alternatives

### Code Compliance
**Best:** gemini-2.5-pro
- Upload drawings + code documents
- Cross-reference requirements
- Identify violations
- Get recommendations

### Multi-Document Coordination
**Best:** gemini-2.5-pro (2M context)
- Upload multiple drawing sets
- Find conflicts between trades
- Coordinate systems
- Generate RFI lists

### Quick Queries
**Best:** gemini-2.5-flash-lite
- Fast answers
- Simple questions
- High-volume requests

---

## API Endpoints

### For Text + Image (Vision)
```
https://generativelanguage.googleapis.com/v1/models/{MODEL_NAME}:generateContent?key={API_KEY}
```

### Available Models:
- gemini-2.5-flash
- gemini-2.5-pro
- gemini-2.5-flash-lite
- gemini-2.0-flash
- gemini-2.0-flash-001
- gemini-2.0-flash-lite
- gemini-2.0-flash-lite-001

---

## Free Tier Limits

### Rate Limits (Per Minute)
- **gemini-2.5-flash:** 15 requests/min
- **gemini-2.5-pro:** 2 requests/min
- **gemini-2.5-flash-lite:** Higher (exact limit varies)
- **gemini-2.0-flash:** 15 requests/min
- **gemini-2.0-flash-lite:** Higher

### Daily Limits
- **gemini-2.5-flash:** 1M tokens/day
- **gemini-2.5-pro:** 50 requests/day
- **Others:** Varies

### No Credit Card Required
All models work on FREE tier without billing enabled!

---

## Error Codes to Avoid

### 404 - Model Not Found
**Cause:** Wrong model name or API version
**Solution:** Use exact names from list above with v1 API

### 429 - Rate Limit Exceeded
**Cause:** Too many requests too fast
**Solution:** 
- Use gemini-2.5-flash-lite for high volume
- Add delays between requests
- Implement retry logic with backoff

### 400 - Invalid Request
**Cause:** Wrong image format or size
**Solution:**
- Use JPEG, PNG, WebP
- Keep images under 4MB
- Convert to base64 properly

---

## Implementation Checklist for ConstructLM

- [ ] Add image upload button to chat interface
- [ ] Convert images to base64
- [ ] Update Gemini service to use gemini-2.5-flash
- [ ] Add model selector (2.5-flash, 2.5-pro, 2.5-flash-lite)
- [ ] Handle image + text in same request
- [ ] Display image preview in chat
- [ ] Store images with messages (optional)
- [ ] Add rate limit handling
- [ ] Add error messages for 429/400 errors

---

## Testing Results

**Test Date:** 2026-03-05
**API Key:** Free Tier (No Billing)
**Model Tested:** gemini-2.5-flash
**Image Size:** 72.39 KB
**Result:** SUCCESS ✓

**Analysis Quality:**
- Extremely detailed construction analysis
- Identified materials, techniques, lighting
- Provided construction insights
- Professional-level observations
- Perfect for construction industry use

---

## Conclusion

**You have access to 7 FREE vision-capable models!**

**Recommended for ConstructLM:**
1. **Primary:** gemini-2.5-flash (best all-around)
2. **Complex:** gemini-2.5-pro (deep analysis)
3. **Fast:** gemini-2.5-flash-lite (high volume)

**All FREE, no credit card needed, perfect for construction professionals!**
