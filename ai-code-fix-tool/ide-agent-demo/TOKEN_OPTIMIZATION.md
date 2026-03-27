# Token Usage Optimization

## Problem Identified

You hit Groq's rate limit (100k tokens/day) because the agent was sending **FULL FILE CONTENT** in every request!

### What Was Happening (BEFORE)
```js
// read_file returned 31 lines of code
res = { content: "import React...\n[FULL 31 LINES]" };

// This was sent to AI:
messages.push({ 
  role: 'tool',
  content: JSON.stringify(res)  // ❌ FULL FILE!
});
```

**Result:** Each query used ~700 tokens, hitting limit after ~140 queries

### Example Token Waste
```
Query: "How many projects?"
- search_codebase: 2 results × 40 lines each = ~2000 chars = 500 tokens
- read_file: Full 31 lines = ~800 chars = 200 tokens  
- list_files: 10 files = ~100 chars = 25 tokens
- grep_codebase: Empty result = 10 tokens

Total per query: ~735 tokens
Daily limit: 100,000 tokens
Max queries: ~136 queries/day ❌
```

## Optimizations Applied

### 1. Truncate read_file Results
**Before:** Send entire file (could be 1000+ lines)
**After:** Send only first 50 lines + summary

```js
if (call.function.name === 'read_file' && res.content) {
  const lines = res.content.split('\n');
  const preview = lines.slice(0, 50).join('\n');
  const summary = lines.length > 50 
    ? `\n... [${lines.length - 50} more lines omitted for brevity]`
    : '';
  aiResult = { 
    content: preview + summary,
    totalLines: lines.length,
    truncated: lines.length > 50
  };
}
```

**Savings:** 31-line file now sends 31 lines (no change), but 200-line file sends only 50 lines (75% reduction)

### 2. Limit search_codebase Results
**Before:** Send all 5 search results with full content
**After:** Send top 3 results with truncated content (500 chars max)

```js
if (call.function.name === 'search_codebase' && Array.isArray(res)) {
  aiResult = res.slice(0, 3).map(r => ({
    file: r.file,
    content: r.content.slice(0, 500) + (r.content.length > 500 ? '...' : ''),
    startLine: r.startLine,
    score: r.score
  }));
}
```

**Savings:** 
- Before: 5 results × 1000 chars = 5000 chars = 1250 tokens
- After: 3 results × 500 chars = 1500 chars = 375 tokens
- **Reduction: 70%**

### 3. Added Token Logging
```js
const messageText = messages.map(m => m.content || '').join(' ');
const estimatedTokens = Math.ceil(messageText.length / 4);
console.log(`[TOKEN ESTIMATE] ~${estimatedTokens} tokens in request`);
```

## New Token Usage (AFTER)

```
Query: "How many projects?"
- search_codebase: 3 results × 500 chars = ~375 tokens (was 500)
- read_file: 31 lines = ~200 tokens (unchanged)
- list_files: 10 files = ~25 tokens (unchanged)
- grep_codebase: Empty = 10 tokens (unchanged)

Total per query: ~610 tokens (was 735)
Daily limit: 100,000 tokens
Max queries: ~164 queries/day ✅ (+20% improvement)
```

## Additional Optimizations (Future)

### 1. Smarter Context Selection
Only send relevant chunks, not full files:
```js
// Instead of sending full file
content: fullFile

// Send only relevant function
content: extractFunction(fullFile, functionName)
```

### 2. Caching Previous Results
Don't re-send same file content in follow-up queries:
```js
// Track what AI has already seen
const seenFiles = new Set();
if (seenFiles.has(filename)) {
  aiResult = { file: filename, cached: true };
}
```

### 3. Use Smaller Model for Simple Queries
```js
// For simple queries like "list files"
model: query.length < 20 ? 'llama-3.1-8b' : 'llama-3.3-70b'
```

### 4. Compress Whitespace
```js
content: content.replace(/\s+/g, ' ').trim()
```

## Monitoring

Check server logs for token estimates:
```
[TOKEN ESTIMATE] ~610 tokens in request (2440 chars)
```

If you see consistently high numbers (>1000 tokens), investigate which tool is sending too much data.

## Summary

✅ Reduced token usage by ~17% per query
✅ Added token logging for monitoring
✅ Truncated read_file to 50 lines max
✅ Limited search results to top 3 with 500 char limit
✅ Can now handle ~164 queries/day (was ~136)

**Key Principle:** Only send what the AI needs to answer the question, not everything you have!
