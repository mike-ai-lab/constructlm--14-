# ConstructLM Citation Handling - Consolidated Code Reference

This document consolidates all citation-related code from the ConstructLM codebase for debugging and reference purposes.

---

## 1. TYPE DEFINITIONS (types.ts)

```typescript
export interface Citation {
  docId: string;
  docName: string;
  text: string;
  similarity: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  citations?: Citation[];  // ← Citations attached to model responses
  inputTokens?: number;
  outputTokens?: number;
  reasoning?: string;
  metadata?: {
    imageBase64?: string;
    activeSources?: string[];
  };
}
```

---

## 2. CITATION SEARCH LOGIC (services/vectorDb.ts)

### Vector Math Utilities
```typescript
const dotProduct = (a: number[], b: number[]): number => {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
};

const magnitude = (a: number[]): number => {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * a[i];
  return Math.sqrt(sum);
};

const cosineSimilarity = (a: number[], b: number[]): number => {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct(a, b) / (magA * magB);
};
```

### Main Search Function
```typescript
export const searchVectors = async (query: string, limit = 5): Promise<Citation[]> => {
  // 1. Embed query using local model
  const queryVector = await embeddingService.generateEmbedding(query);
  if (!queryVector || queryVector.length === 0) return [];

  const db = await openDB();
  
  // 2. Get all chunks from IndexedDB
  const allChunks = await new Promise<TextChunk[]>((resolve, reject) => {
    const request = db.transaction('chunks', 'readonly').objectStore('chunks').getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  
  const allFiles = await new Promise<FileDocument[]>((resolve, reject) => {
    const request = db.transaction('files', 'readonly').objectStore('files').getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  
  // 3. Filter to only enabled files (default to true for backward compatibility)
  const enabledFileIds = new Set(
    allFiles
      .filter(f => f.isEnabled !== false)
      .map(f => f.id)
  );
  
  // Filter chunks to only include those from enabled files
  const enabledChunks = allChunks.filter(chunk => enabledFileIds.has(chunk.docId));
  
  console.log(`Searching across ${enabledChunks.length} chunks from ${enabledFileIds.size} enabled files`);
  
  const fileMap = new Map(allFiles.map(f => [f.id, f.name]));

  // 4. Calculate similarity scores
  const scored = enabledChunks.map(chunk => ({
    ...chunk,
    score: cosineSimilarity(queryVector, chunk.vector)
  }));

  // 5. Sort by score (highest first)
  scored.sort((a, b) => b.score - a.score);
  
  // Debug logging
  console.log('Top 10 scores before filtering:');
  scored.slice(0, 10).forEach((c, i) => {
    console.log(`  ${i+1}. ${fileMap.get(c.docId)} (score: ${c.score.toFixed(3)})`);
    console.log(`     Text: "${c.text.substring(0, 150)}${c.text.length > 150 ? '...' : ''}"`);
  });
  
  // 6. Filter by minimum relevance threshold
  const RELEVANCE_THRESHOLD = 0.15; // Lowered from 0.25
  const relevantChunks = scored.filter(chunk => chunk.score >= RELEVANCE_THRESHOLD);
  
  console.log(`Found ${relevantChunks.length} relevant chunks (threshold: ${RELEVANCE_THRESHOLD})`);
  
  // If no relevant chunks found, return top results anyway (fallback)
  if (relevantChunks.length === 0) {
    console.warn('No chunks above threshold - returning top results as fallback');
    return scored.slice(0, Math.min(limit, scored.length)).map(chunk => ({
      docId: chunk.docId,
      docName: fileMap.get(chunk.docId) || 'Unknown',
      text: chunk.text,
      similarity: chunk.score
    }));
  }
  
  // 7. Diversify results: get best chunk from each file first
  const topK: typeof scored = [];
  const filesUsed = new Set<string>();
  const maxPerFile = 3; // Allow up to 3 chunks from same file if highly relevant
  
  // First pass: get best chunk from each file (only if relevant)
  for (const item of relevantChunks) {
    if (topK.length >= limit) break;
    if (!filesUsed.has(item.docId)) {
      topK.push(item);
      filesUsed.add(item.docId);
    }
  }
  
  // Second pass: fill remaining slots with best scores (prioritize quality over diversity)
  for (const item of relevantChunks) {
    if (topK.length >= limit) break;
    if (!topK.includes(item)) {
      const fileCount = topK.filter(t => t.docId === item.docId).length;
      if (fileCount < maxPerFile) {
        topK.push(item);
      }
    }
  }
  
  console.log('Top results (diversified):', topK.map(c => ({ 
    file: fileMap.get(c.docId), 
    score: c.score.toFixed(3),
    preview: c.text.substring(0, 50) 
  })));

  // 8. Return formatted citations
  return topK.map(chunk => ({
    docId: chunk.docId,
    docName: fileMap.get(chunk.docId) || 'Unknown',
    text: chunk.text,
    similarity: chunk.score
  }));
};
```

---

## 3. CITATION RETRIEVAL IN APP (App.tsx)

### Message Handling with Citations
```typescript
const handleSendMessage = async (text: string, imageBase64?: string) => {
  // ... validation code ...
  
  try {
    // 1. RAG Search - get citations
    const citations = await VectorDB.searchVectors(text, 8);
    
    console.log('[Citations Found]', citations.length, 'sources:');
    citations.forEach((c, i) => {
      console.log(`  ${i+1}. ${c.docName} (score: ${c.similarity.toFixed(3)})`);
      console.log(`     "${c.text.substring(0, 80)}..."`);
    });
    
    // 2. Create placeholder message with citations
    const modelMsgId = crypto.randomUUID();
    setMessages(prev => [...prev, {
      id: modelMsgId,
      role: 'model',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
      citations: citations  // ← Attach citations here
    }]);

    // 3. Stream response from AI service
    let accumulatedText = '';
    
    const streamService = 
      aiModel === 'gemini' ? GeminiService :
      aiModel === 'cerebras' ? CerebrasService :
      aiModel === 'groq' ? GroqService :
      OpenRouterService;
    
    const apiKey = 
      aiModel === 'gemini' ? geminiApiKey :
      aiModel === 'cerebras' ? cerebrasApiKey :
      aiModel === 'groq' ? groqApiKey :
      openrouterApiKey;
    
    await streamService.streamChatResponse(
      text, 
      messages, 
      citations,  // ← Pass citations to AI service
      (chunk, isReasoning = false) => {
        if (isReasoning) {
          // Handle reasoning output
        } else {
          accumulatedText += chunk;
          setMessages(prev => prev.map(msg => 
            msg.id === modelMsgId 
              ? { ...msg, content: accumulatedText }
              : msg
          ));
        }
      },
      apiKey,
      selectedModel,
      imageBase64
    );

    // 4. Finalize message
    const outputTokens = GeminiService.estimateTokens(accumulatedText);
    setMessages(prev => prev.map(msg => 
      msg.id === modelMsgId 
        ? { ...msg, isStreaming: false, outputTokens }
        : msg
    ));

  } catch (error) {
    console.error("Chat Error", error);
    // Error handling...
  }
};
```

### Export Chat with Citations
```typescript
const handleExportChat = (id: string) => {
  const session = ChatStorage.getChatSession(id);
  if (!session) return;
  
  let markdown = `# ${session.title}\n\n`;
  markdown += `**Exported:** ${new Date().toLocaleString()}\n`;
  markdown += `**Model:** ${session.aiModel}\n\n---\n\n`;
  
  session.messages.forEach((msg, index) => {
    if (msg.role === 'user') {
      markdown += `## 💬 User Message ${Math.floor(index / 2) + 1}\n\n`;
      markdown += `${msg.content}\n\n`;
    } else {
      markdown += `## 🤖 Assistant Response ${Math.floor(index / 2) + 1}\n\n`;
      markdown += `${msg.content}\n\n`;
      
      // Export citations
      if (msg.citations && msg.citations.length > 0) {
        markdown += `### 📖 Sources Referenced\n\n`;
        msg.citations.forEach((cite, i) => {
          markdown += `${i + 1}. **${cite.docName}** (similarity: ${cite.similarity.toFixed(3)})\n`;
        });
        markdown += `\n`;
      }
    }
    markdown += `---\n\n`;
  });
  
  // Download as markdown file
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chat_${Date.now()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
```

---

## 4. CITATION RENDERING (components/ChatInterface.tsx)

### Citation Display Component
```typescript
{msg.citations && msg.citations.length > 0 && (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8 pt-6 border-t-2 border-black">
    {msg.citations.map((cite, i) => {
      // Extract sentences from citation text
      const sentences = cite.text.split(/[.!?]+\s+/).filter(s => s.trim().length > 20);
      const preview = sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '.' : '');
      const displayPreview = preview.length > 200 ? preview.substring(0, 200) + '...' : preview;
      const citationId = `${msg.id}-${i}`;
      const isPinned = pinnedCitation === citationId;
      
      return (
        <div key={i} className="group relative">
          {/* Citation Badge */}
          <div 
            onClick={() => setPinnedCitation(isPinned ? null : citationId)}
            className="bg-white border-2 border-gray-100 p-2.5 flex items-center gap-3 cursor-pointer hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
            <div className="w-1.5 h-1.5 bg-black" />
            <span className="text-[9px] font-bold uppercase text-gray-500 truncate">
              SRC {i + 1}: {cite.docName}
            </span>
          </div>
          
          {/* Citation Tooltip/Modal */}
          <div className={`fixed left-1/2 -translate-x-1/2 top-20 w-80 md:w-96 bg-white border-2 border-black p-3 text-xs transition-all z-[100] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-h-96 overflow-y-auto ${
            isPinned ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
          }`}>
            {/* Header */}
            <div className="flex justify-between items-start mb-2 border-b border-gray-200 pb-1">
              <div className="font-bold">{cite.docName}</div>
              {isPinned && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setPinnedCitation(null);
                  }}
                  className="text-lg font-bold hover:bg-gray-100 px-1 leading-none"
                >
                  ×
                </button>
              )}
            </div>
            
            {/* Preview */}
            <div className="bg-yellow-100 border-l-4 border-yellow-400 pl-2 py-1 mb-3 text-gray-800 font-medium text-[11px] leading-relaxed">
              {displayPreview}
            </div>
            
            {/* Full Context with Markdown Rendering */}
            <div className="text-[10px] text-gray-500 mb-2 font-bold uppercase">Full Context:</div>
            <div className="text-gray-700 prose prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({node, ...props}) => <div className="mb-2 last:mb-0" {...props} />,
                  code: ({node, inline, ...props}: any) => 
                    inline ? (
                      <code className="bg-gray-100 text-red-600 px-1 py-0.5 rounded text-[10px] font-mono" {...props} />
                    ) : (
                      <code className="block bg-gray-100 p-2 rounded my-1 text-[10px] font-mono overflow-x-auto" {...props} />
                    ),
                  ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-0.5" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 space-y-0.5" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                  em: ({node, ...props}) => <em className="italic" {...props} />,
                  h1: ({node, ...props}) => <h1 className="text-sm font-bold mt-2 mb-1" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xs font-bold mt-1 mb-1" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-xs font-bold mt-1 mb-0.5" {...props} />,
                }}
              >
                {cite.text}
              </ReactMarkdown>
            </div>
            
            {/* Similarity Score */}
            <div className="mt-2 text-right text-[10px] text-gray-400 border-t border-gray-200 pt-1">
              Similarity: {cite.similarity.toFixed(3)}
            </div>
          </div>
        </div>
      );
    })}
  </div>
)}
```

### Citation State Management
```typescript
const [pinnedCitation, setPinnedCitation] = useState<string | null>(null);

// Toggle citation pin on click
onClick={() => setPinnedCitation(isPinned ? null : citationId)}

// Close pinned citation
onClick={() => setPinnedCitation(null)}
```

---

## 5. AI SERVICE INTEGRATION (services/cerebrasService.ts, geminiService.ts, etc.)

### Citation Context in Prompts
```typescript
// All AI services receive citations and include them in the system prompt

const systemPrompt = `You are ConstructLM, a helpful AI assistant...

CONTEXT FROM DOCUMENTS:
${context.map((c, i) => `Source ${i + 1} (${c.docName}): ${c.text}`).join('\n\n')}

CITATION GUIDELINES:
1. Use the provided sources to answer questions
2. When citing, use NATURAL LANGUAGE format: "According to Source 2 (technical_spec.txt), the supplier is..."
3. NEVER use template syntax like {{citation:...}} or [cite:...]
4. Always write citations in plain English
5. If multiple sources have relevant info, synthesize them together
6. Only say you don't know if the information is truly not in ANY of the provided sources

CITATION FORMAT EXAMPLES:
✅ CORRECT: "According to Source 1 (document.pdf), the supplier is AlSarif Group."
✅ CORRECT: "Source 2 (pricing.pdf) indicates the unit is per m²."
❌ WRONG: "{{citation:document.pdf|Page 3|Supplier info}}"
❌ WRONG: "[cite:document.pdf]"
`;
```

---

## 6. DATA FLOW SUMMARY

```
User Query
    ↓
[App.tsx] handleSendMessage()
    ↓
[vectorDb.ts] searchVectors(query, limit=8)
    ├─ Generate embedding for query
    ├─ Calculate cosine similarity with all chunks
    ├─ Filter by relevance threshold (0.15)
    ├─ Diversify results (1 per file, up to 3 per file)
    └─ Return top 8 citations
    ↓
[App.tsx] Create model message with citations
    ↓
[AI Service] streamChatResponse(text, messages, citations, ...)
    ├─ Include citations in system prompt
    ├─ Stream response with natural language citations
    └─ Return accumulated text
    ↓
[ChatInterface.tsx] Render message with citation badges
    ├─ Display "SRC 1: filename", "SRC 2: filename", etc.
    ├─ Show preview on hover
    ├─ Show full context on click/pin
    └─ Display similarity score
    ↓
[App.tsx] Export chat (optional)
    └─ Include citations in markdown export
```

---

## 7. KEY DEBUGGING POINTS

### Console Logs to Monitor
```typescript
// In vectorDb.ts searchVectors():
console.log(`Searching across ${enabledChunks.length} chunks from ${enabledFileIds.size} enabled files`);
console.log('Top 10 scores before filtering:');
console.log(`Found ${relevantChunks.length} relevant chunks (threshold: ${RELEVANCE_THRESHOLD})`);
console.log('Top results (diversified):', topK.map(...));

// In App.tsx handleSendMessage():
console.log('[Citations Found]', citations.length, 'sources:');
citations.forEach((c, i) => {
  console.log(`  ${i+1}. ${c.docName} (score: ${c.similarity.toFixed(3)})`);
});
```

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| No citations appearing | Relevance threshold too high | Lower `RELEVANCE_THRESHOLD` in vectorDb.ts |
| Same file repeated | Diversification not working | Check `maxPerFile` and loop logic |
| Wrong similarity scores | Vector math error | Verify `cosineSimilarity()` calculation |
| Citations not in response | AI service not using context | Check system prompt in AI service files |
| Pinned citation not showing | State management issue | Verify `pinnedCitation` state updates |

---

## 8. CONFIGURATION CONSTANTS

```typescript
// vectorDb.ts
const CHUNK_SIZE = 1000;           // Characters per chunk
const OVERLAP = 200;               // Overlap between chunks
const RELEVANCE_THRESHOLD = 0.15;  // Minimum similarity score
const maxPerFile = 3;              // Max chunks per file in results

// App.tsx
const citations = await VectorDB.searchVectors(text, 8);  // Request 8 citations

// ChatInterface.tsx
const limit = 5;  // Default display limit (can be overridden)
```

---

## 9. QUICK REFERENCE: CITATION FLOW

1. **Search**: `vectorDb.searchVectors(query)` → Returns `Citation[]`
2. **Attach**: Add citations to `ChatMessage.citations` field
3. **Pass**: Send citations to AI service in `streamChatResponse()`
4. **Render**: Display in `ChatInterface.tsx` with hover/pin interaction
5. **Export**: Include in markdown export with similarity scores

