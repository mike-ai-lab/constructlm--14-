# Citation System Implementation Plan

## Current State vs Target State

### Current App (Simple)
- Natural language citations: "According to Source 1 (file.pdf)..."
- Source list at bottom
- No inline citation chips
- No document viewer integration

### External App (Advanced)
- Structured citation format: `{{citation:filename|location|quote}}`
- Inline citation chips with numbering
- Citation popups with preview
- Document viewer integration
- Support for URLs and files
- Thinking blocks extraction

## Citation Format Specification

### Format Pattern
```
{{citation:filename|location|quote}}
```

**Components:**
- `filename`: Document name (e.g., "Market Pricing Survey.pdf")
- `location`: Page number or section (e.g., "Page 3", "Section 2.1")
- `quote`: Exact text snippet from source

### Alternative Format (RTL Support)
```
【citation:filename|location|quote】
```

### Regex Patterns
```typescript
// Split citations from text
SPLIT_REGEX = /((?:\{\{|【)citation:[^}】]*(?:\}\}|】))/g

// Extract citation components
MATCH_REGEX = /(?:\{\{|【)citation:([^|]*?)\|([^|]*?)\|([^}】]*?)(?:\}\}|】)/s
```

## Implementation Steps for Current App

### Phase 1: Update AI Service Prompts
**Files to modify:**
- `services/cerebrasService.ts`
- `services/groqService.ts`
- `services/openrouterService.ts`

**Changes:**
- Update system prompts to generate structured citations
- Provide examples of correct format
- Instruct models to include page numbers and exact quotes

### Phase 2: Create Citation Utilities
**New file:** `services/citationService.ts`

**Functions:**
- `extractCitations(text: string)`: Parse citations from AI response
- `validateCitation(citation: string)`: Check citation format
- `getCitationIndex(text: string, position: number)`: Get citation number

### Phase 3: Create Citation Components
**New folder:** `components/CitationRenderer/`

**Components:**
- `CitationChip.tsx`: Inline citation badge with number
- `CitationPopup.tsx`: Hover popup showing quote preview
- `CitationRenderer.tsx`: Main component to render text with citations

### Phase 4: Update ChatInterface
**File:** `components/ChatInterface.tsx`

**Changes:**
- Replace markdown rendering with CitationRenderer
- Pass file list to citation renderer
- Add document viewer callback

### Phase 5: Add Document Viewer Integration
**New file:** `components/DocumentViewer.tsx`

**Features:**
- Display document with highlighted quote
- Show page number
- Support PDF, text, markdown

## System Prompt Template

```typescript
const systemInstruction = `You are ConstructLM, an intelligent research assistant.

CRITICAL INSTRUCTIONS FOR CITATIONS:
1. When referencing information from sources, use this EXACT format:
   {{citation:filename|location|quote}}

2. Components:
   - filename: The exact document name (e.g., "Market Pricing Survey.pdf")
   - location: Page number or section (e.g., "Page 3", "Section 2.1")
   - quote: The exact text from the source (keep it concise, max 100 chars)

3. EXAMPLES OF CORRECT FORMAT:
   ✅ "The supplier is {{citation:Market Pricing Survey.pdf|Page 3|AlSarif Group (Riyadh)}}"
   ✅ "The unit is {{citation:pricing.pdf|Section 2|Terrazzo Tile, 30×30×3 cm}}"

4. EXAMPLES OF WRONG FORMAT:
   ❌ "According to Source 1..."
   ❌ "{{citation:file.pdf}}"
   ❌ "[cite:file.pdf]"

5. Rules:
   - Always include page/section number
   - Always include exact quote
   - Use filename exactly as provided
   - One citation per fact
   - No nested citations

Context Information:
${contextString}`;
```

## Data Flow

1. User asks question
2. RAG retrieves relevant chunks with file info
3. AI service generates response with structured citations
4. CitationService extracts citations from response
5. CitationRenderer displays text with inline chips
6. User clicks chip → CitationPopup shows preview
7. User clicks "View Document" → DocumentViewer opens

## Citation Chip Rendering

```typescript
// Input: "The supplier is {{citation:file.pdf|Page 3|AlSarif Group}}"
// Output: "The supplier is [1] " (with clickable chip showing "1")

// Chip displays:
// - Number badge
// - Hover shows quote preview
// - Click opens document viewer
```

## Integration Checklist

- [ ] Update system prompts in all AI services
- [ ] Create citationService.ts with parsing logic
- [ ] Create CitationRenderer component
- [ ] Create CitationChip component
- [ ] Create CitationPopup component
- [ ] Update ChatInterface to use CitationRenderer
- [ ] Add document viewer integration
- [ ] Test with all AI models
- [ ] Handle edge cases (malformed citations, missing files)
- [ ] Add RTL support for citations

## Benefits

1. **Structured Data**: Citations are machine-readable
2. **Better UX**: Inline chips are more discoverable
3. **Verification**: Users can easily check sources
4. **Consistency**: All models use same format
5. **Scalability**: Easy to add features (highlighting, annotations)
