import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { SettingsModal } from './components/SettingsModal';

const Canvas = lazy(() => import('./components/Canvas').then(m => ({ default: m.Canvas })));
import { FileDocument, ChatMessage, ChatSession } from './types';
import * as VectorDB from './services/vectorDb';
import * as GeminiService from './services/geminiService';
import * as CerebrasService from './services/cerebrasService';
import * as GroqService from './services/groqService';
import * as OpenRouterService from './services/openrouterService';
import * as OllamaService from './services/ollamaService';
import * as ChatStorage from './services/chatStorage';
import { Settings, ChevronLeft, ChevronRight, BookOpen, ChevronDown } from 'lucide-react';

// Expandable Model Provider Section Component
interface ModelProviderSectionProps {
  title: string;
  models: Array<{ id: string; name: string; context: string; tags: string[] }>;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

const ModelProviderSection: React.FC<ModelProviderSectionProps> = ({
  title,
  models,
  selectedModel,
  onSelectModel
}) => {
  const storageKey = `model-section-expanded-${title}`;
  const [isExpanded, setIsExpanded] = React.useState(() => {
    // Load from localStorage, default to false (collapsed)
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : false;
  });

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem(storageKey, JSON.stringify(newState));
  };

  return (
    <div className="border-b border-slate-100 dark:border-white/5">
      <button
        onClick={handleToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#0f0f11] transition-colors"
      >
        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          {title}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="space-y-1 px-2 pb-2">
          {models.map(model => (
            <button
              key={model.id}
              onClick={() => {
                console.log('[ModelProviderSection] Model clicked:', model.id, 'in section:', title);
                onSelectModel(model.id);
              }}
              className={`w-full text-left px-3 py-2.5 rounded transition-colors ${
                selectedModel === model.id
                  ? 'bg-brand-blue text-white'
                  : 'hover:bg-slate-100 dark:hover:bg-[#0f0f11] text-slate-900 dark:text-slate-100'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <span className="text-[12px] font-semibold">{model.id}</span>
                <span className={`text-[10px] whitespace-nowrap ${
                  selectedModel === model.id ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {model.context}
                </span>
              </div>
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {model.tags.map(tag => (
                  <span
                    key={tag}
                    className={`text-[9px] px-1.5 py-0.5 rounded ${
                      selectedModel === model.id
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-[#0a0a0b] text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [files, setFiles] = useState<FileDocument[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiModel, setAiModel] = useState<'gemini' | 'cerebras' | 'groq' | 'openrouter' | 'ollama'>('cerebras');
  const [selectedModel, setSelectedModel] = useState('llama3.1:8b');
  const [selectedOpenRouterModel, setSelectedOpenRouterModel] = useState('openai/gpt-oss-20b:free');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [cerebrasApiKey, setCerebrasApiKey] = useState('');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [openrouterApiKey, setOpenrouterApiKey] = useState('');
  const [ollamaApiKey, setOllamaApiKey] = useState('');
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState('http://localhost:11434');
  const [ollamaMode, setOllamaMode] = useState<'local' | 'cloud'>('local');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [floatingButtonPos, setFloatingButtonPos] = useState(() => {
    const saved = localStorage.getItem('floating_button_pos');
    return saved ? JSON.parse(saved) : { x: 16, y: 128 };
  });
  const [isDraggingButton, setIsDraggingButton] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [canvasCode, setCanvasCode] = useState<string | null>(null);
  const [canvasFilename, setCanvasFilename] = useState<string>('component.jsx');
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [canvasError, setCanvasError] = useState<{message: string; code: string} | null>(null);
  const [isFixingError, setIsFixingError] = useState(false);
  const isResizingRef = useRef(false);

  // CONSTANT: Define exact header height to sync sidebar and header
  const MOBILE_HEADER_HEIGHT = '60px';
  const MOBILE_HEADER_HEIGHT_WITH_SAFE_AREA = `calc(${MOBILE_HEADER_HEIGHT} + env(safe-area-inset-top))`;

  // Transition constant for synchronized animations
  const transitionStyle = "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]";

  // Auto-save messages when they change
  useEffect(() => {
    if (messages.length > 0 && currentChatId && !isStreaming) {
      saveCurrentChat();
    }
  }, [messages, isStreaming]);

  // Load files and API keys on mount
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const loaded = await VectorDB.getAllFiles();
        setFiles(loaded);
      } catch (e) {
        console.error("Failed to load DB", e);
      }
    };
    loadFiles();

    // Load API keys from localStorage
    const storedGeminiKey = localStorage.getItem('gemini_api_key') || '';
    const storedCerebrasKey = localStorage.getItem('cerebras_api_key') || '';
    const storedGroqKey = localStorage.getItem('groq_api_key') || '';
    const storedOpenRouterKey = localStorage.getItem('openrouter_api_key') || '';
    const storedOllamaKey = localStorage.getItem('ollama_api_key') || '';
    const storedOllamaUrl = localStorage.getItem('ollama_base_url') || 'http://localhost:11434';
    const storedOllamaMode = (localStorage.getItem('ollama_mode') || 'local') as 'local' | 'cloud';
    
    setGeminiApiKey(storedGeminiKey);
    setCerebrasApiKey(storedCerebrasKey);
    setGroqApiKey(storedGroqKey);
    setOpenrouterApiKey(storedOpenRouterKey);
    setOllamaApiKey(storedOllamaKey);
    setOllamaBaseUrl(storedOllamaUrl);
    setOllamaMode(storedOllamaMode);

    // Load saved AI provider and model preferences
    const savedAiModel = localStorage.getItem('ai_model') as 'gemini' | 'cerebras' | 'groq' | 'openrouter' | null;
    const savedSelectedModel = localStorage.getItem('selected_model');
    
    if (savedAiModel) {
      setAiModel(savedAiModel);
    }
    if (savedSelectedModel) {
      setSelectedModel(savedSelectedModel);
    }

    // Load chat sessions
    const sessions = ChatStorage.getAllChatSessions();
    setChatSessions(sessions);
    
    // Load last active chat or create new one
    if (sessions.length > 0) {
      const lastSession = sessions[0];
      setCurrentChatId(lastSession.id);
      setMessages(lastSession.messages);
      // Don't override user's saved preferences with session data
      // setAiModel(lastSession.aiModel);
    } else {
      // Create initial chat if none exists
      const initialChatId = crypto.randomUUID();
      setCurrentChatId(initialChatId);
      setMessages([]);
    }

    // Show settings if no keys are configured
    if (!storedGeminiKey && !storedCerebrasKey && !storedGroqKey && !storedOpenRouterKey && !storedOllamaKey) {
      setIsSettingsOpen(true);
    }
  }, []);

  // Handle sidebar resize
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const stopResizing = () => {
    isResizingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizingRef.current) return;
    const newWidth = e.clientX;
    if (newWidth > 200 && newWidth < 600) {
      setSidebarWidth(newWidth);
    }
  };

  const handleUpload = async (fileList: FileList) => {
    setIsUploading(true);
    
    // Process sequentially to avoid overwhelming browser/api
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      setUploadStatus(`Processing ${i + 1}/${fileList.length}: ${file.name}`);
      
      try {
        const doc = await VectorDB.processFile(file, (status) => {
           setUploadStatus(`${file.name}: ${status}`);
        });
        setFiles(prev => [...prev, doc]);
        console.log(`✅ Successfully processed: ${file.name}`);
      } catch (error) {
        console.error(`❌ Error processing ${file.name}:`, error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        alert(`Failed to process ${file.name}.\n\nError: ${errorMsg}\n\nPlease ensure it is a valid text-based file and try again.`);
      }
    }
    
    setIsUploading(false);
    setUploadStatus('');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this source from index?")) return;
    await VectorDB.deleteFile(id);
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleToggleFile = async (id: string, isEnabled: boolean) => {
    await VectorDB.updateFileEnabled(id, isEnabled);
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, isEnabled } : f
    ));
  };

  const handleSaveKeys = (gemini: string, cerebras: string, groq: string, openrouter: string, ollama: string, ollamaUrl: string, ollamaMode: 'local' | 'cloud') => {
    localStorage.setItem('gemini_api_key', gemini);
    localStorage.setItem('cerebras_api_key', cerebras);
    localStorage.setItem('groq_api_key', groq);
    localStorage.setItem('openrouter_api_key', openrouter);
    localStorage.setItem('ollama_api_key', ollama);
    localStorage.setItem('ollama_base_url', ollamaUrl);
    localStorage.setItem('ollama_mode', ollamaMode);
    setGeminiApiKey(gemini);
    setCerebrasApiKey(cerebras);
    setGroqApiKey(groq);
    setOpenrouterApiKey(openrouter);
    setOllamaApiKey(ollama);
    setOllamaBaseUrl(ollamaUrl);
    setOllamaMode(ollamaMode);
  };

  const saveCurrentChat = () => {
    if (!currentChatId || messages.length === 0) return;
    
    const session: ChatSession = {
      id: currentChatId,
      title: ChatStorage.generateChatTitle(messages[0]?.content || 'New Chat'),
      messages: messages,
      createdAt: 0, // Will be set by storage service
      updatedAt: 0, // Will be set by storage service
      aiModel: aiModel
    };
    
    ChatStorage.saveChatSession(session);
    
    // Update the sessions list in state
    const updatedSessions = ChatStorage.getAllChatSessions();
    setChatSessions(updatedSessions);
  };

  const handleNewChat = () => {
    // Save current chat if it has messages
    if (currentChatId && messages.length > 0) {
      saveCurrentChat();
    }
    
    // Create new chat
    const newChatId = crypto.randomUUID();
    setCurrentChatId(newChatId);
    setMessages([]);
    
    // Refresh chat sessions list
    setChatSessions(ChatStorage.getAllChatSessions());
  };

  const handleSelectChat = (id: string) => {
    // Save current chat if it has messages
    if (currentChatId && messages.length > 0) {
      saveCurrentChat();
    }
    
    const session = ChatStorage.getChatSession(id);
    if (session) {
      setCurrentChatId(id);
      setMessages(session.messages);
      // Don't override user's current model selection when loading chat
      // setAiModel(session.aiModel);
    }
  };

  const handleDeleteChat = (id: string) => {
    if (!window.confirm("Delete this chat?")) return;
    ChatStorage.deleteChatSession(id);
    setChatSessions(ChatStorage.getAllChatSessions());
    
    if (currentChatId === id) {
      handleNewChat();
    }
  };

  const handleExportChat = (id: string) => {
    const session = ChatStorage.getChatSession(id);
    if (!session) return;
    
    // Create clean title for filename
    const cleanTitle = session.title.replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '_').substring(0, 50);
    
    let markdown = `# ${session.title}\n\n`;
    markdown += `**Exported:** ${new Date().toLocaleString()}\n`;
    markdown += `**Model:** ${session.aiModel}\n`;
    markdown += `**Messages:** ${session.messages.length}\n\n`;
    markdown += `---\n\n`;
    
    session.messages.forEach((msg, index) => {
      if (msg.role === 'user') {
        markdown += `## 💬 User Message ${Math.floor(index / 2) + 1}\n\n`;
        markdown += `${msg.content}\n\n`;
        
        if (msg.metadata) {
          if (msg.metadata.imageBase64) {
            const imageCount = msg.metadata.imageBase64.split(',').length;
            markdown += `📎 *${imageCount} image${imageCount > 1 ? 's' : ''} attached*\n\n`;
          }
          if (msg.metadata.activeSources && msg.metadata.activeSources.length > 0) {
            markdown += `📚 *Active sources (${msg.metadata.activeSources.length}):* ${msg.metadata.activeSources.join(', ')}\n\n`;
          }
        }
      } else {
        markdown += `## 🤖 Assistant Response ${Math.floor(index / 2) + 1}\n\n`;
        markdown += `${msg.content}\n\n`;
        
        if (msg.citations && msg.citations.length > 0) {
          markdown += `### 📖 Sources Referenced\n\n`;
          msg.citations.forEach((cite, i) => {
            markdown += `${i + 1}. **${cite.docName}** (similarity: ${cite.similarity.toFixed(3)})\n`;
          });
          markdown += `\n`;
        }
        
        if (msg.inputTokens || msg.outputTokens) {
          markdown += `*📊 Token Usage: Input ${msg.inputTokens || 0} • Output ${msg.outputTokens || 0}*\n\n`;
        }
      }
      
      markdown += `---\n\n`;
    });
    
    // Add footer
    markdown += `\n*Exported from ConstructLM - ${new Date().toISOString()}*\n`;
    
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cleanTitle || 'chat'}_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Swipe gesture handling for mobile
  const minSwipeDistance = 50;

  // Floating button drag handlers
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      setIsDraggingButton(true);
      setDragStart({ x: touch.clientX - floatingButtonPos.x, y: touch.clientY - floatingButtonPos.y });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingButton) return;
      e.preventDefault();
      const touch = e.touches[0];
      const newX = Math.max(0, Math.min(window.innerWidth - 56, touch.clientX - dragStart.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 56, touch.clientY - dragStart.y));
      const newPos = { x: newX, y: newY };
      setFloatingButtonPos(newPos);
      localStorage.setItem('floating_button_pos', JSON.stringify(newPos));
    };

    const handleTouchEnd = () => {
      setIsDraggingButton(false);
    };

    button.addEventListener('touchstart', handleTouchStart, { passive: true });
    button.addEventListener('touchmove', handleTouchMove, { passive: false });
    button.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      button.removeEventListener('touchstart', handleTouchStart);
      button.removeEventListener('touchmove', handleTouchMove);
      button.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDraggingButton, floatingButtonPos, dragStart]);

  const handleButtonClick = () => {
    if (!isDraggingButton) {
      setIsMobileSidebarOpen(true);
    }
  };

  const handleOpenCanvas = (code: string, filename: string) => {
    setCanvasCode(code);
    setCanvasFilename(filename);
    setIsCanvasOpen(true);
    setIsMobileSidebarOpen(false);
    setCanvasError(null);
  };

  const handleCanvasError = async (errorMessage: string | null, code: string) => {
    if (errorMessage === null || errorMessage === '') {
      // Clear error - render was successful
      setCanvasError(null);
      setIsFixingError(false);
      return;
    }
    
    // Only set error if it's for the current code being displayed
    setCanvasError({ message: errorMessage, code });
    setIsFixingError(false);
  };

  const handleFixCanvasError = async (code: string) => {
    if (isFixingError) {
      return;
    }

    setIsFixingError(true);
    
    try {
      const errorMsg = canvasError?.message || 'Unknown error';
      
      // Extract line number from error
      const lineMatch = errorMsg.match(/line (\d+)|:(\d+):\d+/i);
      const errorLine = lineMatch ? parseInt(lineMatch[1] || lineMatch[2]) : null;
      
      // Get ONLY relevant context (5 lines before and after error)
      let contextLines = '';
      if (errorLine) {
        const lines = code.split('\n');
        const start = Math.max(0, errorLine - 5);
        const end = Math.min(lines.length, errorLine + 5);
        
        contextLines = lines.slice(start, end).map((line, idx) => {
          const lineNum = start + idx + 1;
          const marker = lineNum === errorLine ? '> ' : '  ';
          return `${marker}${lineNum} | ${line}`;
        }).join('\n');
      } else {
        // If no line number, send first 10 lines
        contextLines = code.split('\n').slice(0, 10).map((line, idx) => 
          `  ${idx + 1} | ${line}`
        ).join('\n');
      }
      
      // Semantic patch prompt - MINIMAL context only
      const errorFixPrompt = `Fix this error using PATCH format:

Error: ${errorMsg}

Context (lines around error):
${contextLines}

Return ONLY patches:
PATCH @@ line X @@
old line content
new line content

Respond: "Fixed [description]" + patches.`;

      // Send to chat
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: errorFixPrompt,
        timestamp: Date.now(),
        inputTokens: GeminiService.estimateTokens(errorFixPrompt),
        metadata: {
          isErrorFix: true,
          errorCode: code
        }
      };
      
      setMessages(prev => [...prev, userMsg]);
      setIsStreaming(true);

      // Get citations
      const citations = await VectorDB.searchVectors(errorFixPrompt, 3);
      
      const modelMsgId = crypto.randomUUID();
      setMessages(prev => [...prev, {
        id: modelMsgId,
        role: 'model',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
        citations: citations
      }]);

      let accumulatedText = '';
      
      const streamService = 
        aiModel === 'gemini' ? GeminiService :
        aiModel === 'cerebras' ? CerebrasService :
        aiModel === 'groq' ? GroqService :
        aiModel === 'openrouter' ? OpenRouterService :
        OllamaService;
      
      const apiKey = 
        aiModel === 'gemini' ? geminiApiKey :
        aiModel === 'cerebras' ? cerebrasApiKey :
        aiModel === 'groq' ? groqApiKey :
        aiModel === 'openrouter' ? openrouterApiKey :
        ollamaApiKey;

      if (aiModel === 'ollama') {
        const OllamaService = await import('./services/ollamaService');
        await OllamaService.streamChatResponse(
          errorFixPrompt,
          messages,
          citations,
          (chunk) => {
            accumulatedText += chunk;
            setMessages(prev => prev.map(msg => 
              msg.id === modelMsgId ? { ...msg, content: accumulatedText } : msg
            ));
          },
          apiKey,
          selectedModel,
          undefined,
          ollamaBaseUrl,
          ollamaMode === 'cloud'
        );
      } else {
        await streamService.streamChatResponse(
          errorFixPrompt,
          messages,
          citations,
          (chunk) => {
            accumulatedText += chunk;
            setMessages(prev => prev.map(msg => 
              msg.id === modelMsgId ? { ...msg, content: accumulatedText } : msg
            ));
          },
          apiKey,
          selectedModel,
          undefined
        );
      }

      // Parse patches from AI response
      const patches = parsePatchesFromResponse(accumulatedText);
      
      if (patches.length > 0) {
        // Apply patches inline to existing code
        const patchedCode = applyPatchesToCode(code, patches);
        
        // Update canvas with patched code
        setCanvasCode(patchedCode);
        
        console.log(`[Canvas Fix] Applied ${patches.length} patch(es) inline`);
      } else {
        // Fallback: try to extract full code if AI didn't follow patch format
        const codeMatch = accumulatedText.match(/```(?:jsx|tsx|js|typescript)?\s*\n([\s\S]*?)```/);
        if (codeMatch) {
          const fixedCode = codeMatch[1].trim();
          setCanvasCode(fixedCode);
          console.log('[Canvas Fix] Applied full code replacement (fallback)');
        } else {
          console.warn('[Canvas Fix] No patches or code found in AI response');
        }
      }

      const outputTokens = GeminiService.estimateTokens(accumulatedText);
      setMessages(prev => prev.map(msg => 
        msg.id === modelMsgId 
          ? { ...msg, isStreaming: false, outputTokens, inputTokens: userMsg.inputTokens }
          : msg
      ));

      saveCurrentChat();
      
    } catch (error) {
      console.error('[handleFixCanvasError] Error:', error);
      alert('Failed to fix error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsFixingError(false);
      setIsStreaming(false);
    }
  };

  // Parse PATCH format from AI response
  const parsePatchesFromResponse = (response: string): Array<{line: number, oldContent: string, newContent: string}> => {
    const patches: Array<{line: number, oldContent: string, newContent: string}> = [];
    
    console.log('[Patch Parser] Raw response:', response);
    
    // Match: PATCH @@ line X @@ followed by old/new content (handles blank lines, +/- prefixes)
    const patchRegex = /PATCH\s+@@\s+line\s+(\d+)\s+@@\s*\n+([^\n]*)\n+([+\-]?\s*[^\n]+)/gi;
    
    let match;
    while ((match = patchRegex.exec(response)) !== null) {
      const lineNum = parseInt(match[1]);
      let oldContent = match[2].trim();
      let newContent = match[3].trim();
      
      // Remove +/- prefixes if present
      oldContent = oldContent.replace(/^[-]\s*/, '');
      newContent = newContent.replace(/^[+]\s*/, '');
      
      // Skip if both are empty
      if (!oldContent && !newContent) continue;
      
      patches.push({
        line: lineNum,
        oldContent,
        newContent
      });
      console.log(`[Patch Parsed] Line ${lineNum}:`);
      console.log(`  Old: "${oldContent}"`);
      console.log(`  New: "${newContent}"`);
    }
    
    console.log(`[Patch Parser] Found ${patches.length} patch(es)`);
    return patches;
  };

  // Apply patches to code inline
  const applyPatchesToCode = (code: string, patches: Array<{line: number, oldContent: string, newContent: string}>): string => {
    const lines = code.split('\n');
    
    console.log(`[Patch Applier] Total lines in code: ${lines.length}`);
    
    // Sort patches by line number (descending) to avoid offset issues
    const sortedPatches = [...patches].sort((a, b) => b.line - a.line);
    
    for (const patch of sortedPatches) {
      const lineIndex = patch.line - 1; // Convert to 0-based index
      
      if (lineIndex >= 0 && lineIndex < lines.length) {
        const currentLine = lines[lineIndex];
        
        console.log(`[Patch Applier] Line ${patch.line}:`);
        console.log(`  Current: "${currentLine}"`);
        console.log(`  Expected: "${patch.oldContent}"`);
        console.log(`  New: "${patch.newContent}"`);
        
        // Apply patch - replace the entire line
        lines[lineIndex] = patch.newContent;
        console.log(`[Patch Applied] Line ${patch.line} replaced`);
      } else {
        console.warn(`[Patch Skipped] Line ${patch.line} out of range (total lines: ${lines.length})`);
      }
    }
    
    return lines.join('\n');
  };

  const handleSendMessage = async (text: string, imageBase64?: string) => {
    // Check if API key is configured for selected model
    if (aiModel === 'gemini' && !geminiApiKey) {
      alert('Please configure your Gemini API key in Settings');
      setIsSettingsOpen(true);
      return;
    }
    if (aiModel === 'cerebras' && !cerebrasApiKey) {
      alert('Please configure your Cerebras API key in Settings');
      setIsSettingsOpen(true);
      return;
    }
    if (aiModel === 'groq' && !groqApiKey) {
      alert('Please configure your Groq API key in Settings');
      setIsSettingsOpen(true);
      return;
    }
    if (aiModel === 'openrouter' && !openrouterApiKey) {
      alert('Please configure your OpenRouter API key in Settings');
      setIsSettingsOpen(true);
      return;
    }
    if (aiModel === 'ollama' && ollamaMode === 'cloud' && !ollamaApiKey) {
      alert('Please configure your Ollama Cloud API key in Settings');
      setIsSettingsOpen(true);
      return;
    }
    
    // Get active sources
    const activeSources = files.filter(f => f.isEnabled !== false).map(f => f.name);
    
    // Add user message
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      inputTokens: GeminiService.estimateTokens(text, imageBase64),
      metadata: {
        imageBase64: imageBase64,
        activeSources: activeSources.length > 0 ? activeSources : undefined
      }
    };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    try {
      // Add initialization delay to ensure API state is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // 1. RAG Search - get more chunks to ensure coverage
      const citations = await VectorDB.searchVectors(text, 8);
      
      // 2. Prepare Placeholder Model Message
      const modelMsgId = crypto.randomUUID();
      setMessages(prev => [...prev, {
        id: modelMsgId,
        role: 'model',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
        citations: citations
      }]);

      // 3. Stream Response with smooth output
      let accumulatedText = '';
      let accumulatedReasoning = '';
      let hasCode = false;
      let codeDetectionTimeout: NodeJS.Timeout | null = null;
      
      const streamService = 
        aiModel === 'gemini' ? GeminiService :
        aiModel === 'cerebras' ? CerebrasService :
        aiModel === 'groq' ? GroqService :
        aiModel === 'openrouter' ? OpenRouterService :
        OllamaService;
      
      const apiKey = 
        aiModel === 'gemini' ? geminiApiKey :
        aiModel === 'cerebras' ? cerebrasApiKey :
        aiModel === 'groq' ? groqApiKey :
        aiModel === 'openrouter' ? openrouterApiKey :
        ollamaApiKey;
      
      if (aiModel === 'ollama') {
        const OllamaService = await import('./services/ollamaService');
        await OllamaService.streamChatResponse(
          text, 
          messages, 
          citations, 
          (chunk, isReasoning = false) => {
            if (isReasoning) {
              accumulatedReasoning += chunk;
              setMessages(prev => prev.map(msg => 
                msg.id === modelMsgId 
                  ? { ...msg, reasoning: accumulatedReasoning }
                  : msg
              ));
            } else {
              accumulatedText += chunk;
              
              // Detect if code is present (with intelligent delay to avoid premature opening)
              if (!hasCode && accumulatedText.includes('```')) {
                hasCode = true;
                // Clear any existing timeout
                if (codeDetectionTimeout) clearTimeout(codeDetectionTimeout);
                // Wait 800ms before auto-opening canvas to let full content stream in
                codeDetectionTimeout = setTimeout(() => {
                  // Extract code from accumulated text
                  const codeRegex = /```(?:jsx|tsx|jsx?|js|typescript)?\s*\n([\s\S]*?)```/;
                  const codeMatch = accumulatedText.match(codeRegex);
                  if (codeMatch) {
                    const code = codeMatch[1].trim();
                    handleOpenCanvas(code, 'component.jsx');
                  }
                }, 800);
              }
              
              setMessages(prev => prev.map(msg => 
                msg.id === modelMsgId 
                  ? { ...msg, content: accumulatedText }
                  : msg
              ));
            }
          },
          apiKey,
          selectedModel,
          imageBase64,
          ollamaBaseUrl,
          ollamaMode === 'cloud'
        );
      } else {
        await streamService.streamChatResponse(
          text, 
          messages, 
          citations, 
          (chunk, isReasoning = false) => {
            if (isReasoning) {
              accumulatedReasoning += chunk;
              setMessages(prev => prev.map(msg => 
                msg.id === modelMsgId 
                  ? { ...msg, reasoning: accumulatedReasoning }
                  : msg
              ));
            } else {
              accumulatedText += chunk;
              
              // Detect if code is present (with intelligent delay to avoid premature opening)
              if (!hasCode && accumulatedText.includes('```')) {
                hasCode = true;
                // Clear any existing timeout
                if (codeDetectionTimeout) clearTimeout(codeDetectionTimeout);
                // Wait 800ms before auto-opening canvas to let full content stream in
                codeDetectionTimeout = setTimeout(() => {
                  // Extract code from accumulated text
                  const codeRegex = /```(?:jsx|tsx|jsx?|js|typescript)?\s*\n([\s\S]*?)```/;
                  const codeMatch = accumulatedText.match(codeRegex);
                  if (codeMatch) {
                    const code = codeMatch[1].trim();
                    handleOpenCanvas(code, 'component.jsx');
                  }
                }, 800);
              }
              
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
      }

      // Clean up timeout if still pending
      if (codeDetectionTimeout) clearTimeout(codeDetectionTimeout);

      // 4. Finalize with token count
      const outputTokens = GeminiService.estimateTokens(accumulatedText);
      setMessages(prev => prev.map(msg => 
        msg.id === modelMsgId 
          ? { ...msg, isStreaming: false, outputTokens, inputTokens: userMsg.inputTokens }
          : msg
      ));

      // Save chat immediately after response completes
      saveCurrentChat();

    } catch (error) {
      console.error("Chat Error", error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'model',
        content: "Error: Could not generate response. Please check your connection or API limits.",
        timestamp: Date.now(),
        isStreaming: false
      }]);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div 
      className="flex flex-col min-h-[100dvh] h-[100dvh] w-full bg-black text-white font-sans selection:bg-blue-600 selection:text-white overflow-hidden relative transition-colors duration-300"
    >
      <style>{`
        /* Custom Scrollbar Styling */
        ::-webkit-scrollbar {
          width: 4px; 
          height: 4px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(155, 155, 155, 0.1);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(155, 155, 155, 0.2);
        }
        .glass {
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        
        /* Container Query for React Component Cards */
        .react-card-container {
          container-type: inline-size;
        }
        
        /* Only stack when REALLY narrow (less than 280px) */
        @container (max-width: 280px) {
          .react-card-container {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .react-card-info {
            margin-bottom: 0.5rem;
          }
          .react-card-actions {
            width: 100%;
          }
        }
      `}</style>

      {/* Mobile Header - Always visible on mobile */}
      <header 
        className="block md:hidden px-3 py-2 border-b border-slate-200 dark:border-white/5 flex justify-between items-center bg-white/80 dark:bg-[#0a0a0b]/80 glass z-50 flex-shrink-0 sticky top-0"
        style={{ 
          paddingTop: 'max(8px, env(safe-area-inset-top))',
          minHeight: '56px'
        }}
      >
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className="font-sans font-bold text-xs hover:bg-slate-100 dark:hover:bg-white/5 px-2 py-1.5 flex items-center gap-1 uppercase tracking-tight transition-colors rounded min-h-[44px] touch-manipulation"
          >
            ☰
          </button>
        </div>
        
        {/* Model Dropdown - Same as Desktop */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="h-11 px-3 text-[10px] font-bold uppercase border border-slate-300 dark:border-white/10 bg-white dark:bg-[#1b1b1d] hover:bg-slate-50 dark:hover:bg-[#0f0f11] transition-all flex items-center gap-2 rounded touch-manipulation"
            >
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[8px] opacity-60">
                  {aiModel === 'ollama' ? `Ollama ${ollamaMode === 'cloud' ? '(Cloud)' : '(Local)'}` : aiModel}
                </span>
                <span className="text-[9px]">
                  {selectedModel}
                </span>
              </div>
              <span className="text-[8px]">▼</span>
            </button>
            
            {isModelDropdownOpen && (
              <div className="absolute top-full right-0 mt-1 bg-white dark:bg-[#1b1b1d] border border-slate-200 dark:border-white/10 shadow-xl rounded-lg z-50 min-w-[320px] max-h-[70vh] overflow-y-auto">
                {/* Cerebras Section */}
                <ModelProviderSection
                  title="Cerebras"
                  models={GeminiService.CEREBRAS_MODELS}
                  selectedModel={selectedModel}
                  onSelectModel={(modelId) => {
                    setSelectedModel(modelId);
                    setAiModel('cerebras');
                    setIsModelDropdownOpen(false);
                    localStorage.setItem('selected_model', modelId);
                    localStorage.setItem('ai_model', 'cerebras');
                  }}
                />
                
                {/* Gemini Section */}
                <ModelProviderSection
                  title="Gemini"
                  models={GeminiService.GEMINI_MODELS}
                  selectedModel={selectedModel}
                  onSelectModel={(modelId) => {
                    setSelectedModel(modelId);
                    setAiModel('gemini');
                    setIsModelDropdownOpen(false);
                    localStorage.setItem('selected_model', modelId);
                    localStorage.setItem('ai_model', 'gemini');
                  }}
                />
                
                {/* Groq Section */}
                <ModelProviderSection
                  title="Groq"
                  models={GeminiService.GROQ_MODELS.filter(m => !(m as any).utilityOnly)}
                  selectedModel={selectedModel}
                  onSelectModel={(modelId) => {
                    setSelectedModel(modelId);
                    setAiModel('groq');
                    setIsModelDropdownOpen(false);
                    localStorage.setItem('selected_model', modelId);
                    localStorage.setItem('ai_model', 'groq');
                  }}
                />
                
                {/* OpenRouter Section */}
                <ModelProviderSection
                  title="OpenRouter"
                  models={GeminiService.OPENROUTER_MODELS}
                  selectedModel={selectedModel}
                  onSelectModel={(modelId) => {
                    setSelectedModel(modelId);
                    setAiModel('openrouter');
                    setIsModelDropdownOpen(false);
                    localStorage.setItem('selected_model', modelId);
                    localStorage.setItem('ai_model', 'openrouter');
                  }}
                />

                {/* Ollama Section */}
                <ModelProviderSection
                  title={`Ollama ${ollamaMode === 'cloud' ? '(Cloud)' : '(Local)'}`}
                  models={ollamaMode === 'cloud' ? OllamaService.OLLAMA_CLOUD_MODELS : OllamaService.OLLAMA_LOCAL_MODELS}
                  selectedModel={selectedModel}
                  onSelectModel={(modelId) => {
                    setSelectedModel(modelId);
                    setAiModel('ollama');
                    setIsModelDropdownOpen(false);
                    localStorage.setItem('selected_model', modelId);
                    localStorage.setItem('ai_model', 'ollama');
                  }}
                />
              </div>
            )}
          </div>
          
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="hover:bg-slate-100 dark:hover:bg-white/5 p-2 rounded transition-colors min-h-[44px] min-w-[44px] touch-manipulation flex items-center justify-center"
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Content wrapper for desktop/mobile */}
      <div className="flex flex-1 overflow-hidden relative">
      
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`md:hidden fixed inset-0 bg-black/70 z-40 transition-opacity duration-300 backdrop-blur-sm ${
          isMobileSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileSidebarOpen(false)}
      />
      
      {/* SIDEBAR */}
      <aside 
        className={`bg-white dark:bg-[#0f0f11] shrink-0 flex flex-col border-r border-slate-200 dark:border-white/5 shadow-lg fixed md:relative left-0 z-50 md:z-auto transition-transform duration-300 ease-out ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ 
          width: window.innerWidth < 768 
            ? '85vw' 
            : (isSidebarCollapsed ? 0 : Math.min(sidebarWidth, 300)),
          maxWidth: window.innerWidth < 768 ? '320px' : '300px',
          top: 0,
          height: '100dvh'
        }}
      >
        <div 
          style={{ 
            width: window.innerWidth < 768 ? '85vw' : Math.min(sidebarWidth, 300),
            maxWidth: window.innerWidth < 768 ? '320px' : '300px'
          }}
          className="h-full flex flex-col overflow-hidden"
        >
          <Sidebar 
            files={files} 
            onUpload={handleUpload} 
            onDelete={handleDelete}
            onToggleFile={handleToggleFile}
            isUploading={isUploading}
            uploadStatus={uploadStatus}
            width={sidebarWidth}
            onClose={() => setIsMobileSidebarOpen(false)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            chatSessions={chatSessions}
            currentChatId={currentChatId}
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
            onDeleteChat={handleDeleteChat}
            onExportChat={handleExportChat}
            isCollapsed={isSidebarCollapsed}
          />
        </div>

        {!isSidebarCollapsed && !isMobileSidebarOpen && (
          <div 
            onMouseDown={startResizing}
            className="hidden md:block absolute top-0 right-[-2px] w-2 h-full cursor-col-resize z-[60] hover:bg-brand-blue/10 active:bg-brand-blue/20 transition-colors"
          />
        )}
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col relative bg-black min-w-0 w-full">
        {/* Desktop Header */}
        <header className="hidden md:flex h-[50px] items-center justify-between px-5 bg-black shrink-0 z-20 border-b border-white/5 sticky top-0">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded transition-all"
              title="Toggle Sidebar"
            >
              {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-brand-blue rounded flex items-center justify-center text-white font-bold text-sm">C</div>
              <h1 className="text-xs font-bold tracking-tight uppercase">ConstructLM</h1>
            </div>
            <div 
              className="cursor-pointer hover:scale-110 transition-transform opacity-60 hover:opacity-100" 
              onClick={() => window.open('/docs/index.html', '_blank')}
              title="Documentation"
            >
              <BookOpen size={16} />
            </div>
            <div 
              className="cursor-pointer hover:rotate-45 transition-transform opacity-60 hover:opacity-100" 
              onClick={() => setIsSettingsOpen(true)}
              title="Settings"
            >
              <Settings size={16} />
            </div>
            
            {/* Model Dropdown with Expandable Sections */}
            <div className="relative">
              <button
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="h-9 px-4 text-[10px] font-bold uppercase border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1b1b1d] hover:bg-slate-50 dark:hover:bg-[#0f0f11] transition-all flex items-center gap-2 rounded"
              >
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[8px] opacity-60">
                    {aiModel === 'ollama' ? `Ollama ${ollamaMode === 'cloud' ? '(Cloud)' : '(Local)'}` : aiModel}
                  </span>
                  <span className="text-[9px]">
                    {(() => {
                      console.log('[Header] Rendering model name:', selectedModel, 'aiModel:', aiModel);
                      return selectedModel;
                    })()}
                  </span>
                </div>
                <span className="text-[8px]">▼</span>
              </button>
              
              {isModelDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-[#1b1b1d] border border-slate-200 dark:border-white/10 shadow-xl rounded-lg z-50 min-w-[350px] max-h-[600px] overflow-y-auto">
                  {/* Cerebras Section */}
                  <ModelProviderSection
                    title="Cerebras"
                    models={GeminiService.CEREBRAS_MODELS}
                    selectedModel={selectedModel}
                    onSelectModel={(modelId) => {
                      setSelectedModel(modelId);
                      setAiModel('cerebras');
                      setIsModelDropdownOpen(false);
                      localStorage.setItem('selected_model', modelId);
                      localStorage.setItem('ai_model', 'cerebras');
                    }}
                  />
                  
                  {/* Gemini Section */}
                  <ModelProviderSection
                    title="Gemini"
                    models={GeminiService.GEMINI_MODELS}
                    selectedModel={selectedModel}
                    onSelectModel={(modelId) => {
                      setSelectedModel(modelId);
                      setAiModel('gemini');
                      setIsModelDropdownOpen(false);
                      localStorage.setItem('selected_model', modelId);
                      localStorage.setItem('ai_model', 'gemini');
                    }}
                  />
                  
                  {/* Groq Section */}
                  <ModelProviderSection
                    title="Groq"
                    models={GeminiService.GROQ_MODELS.filter(m => !(m as any).utilityOnly)}
                    selectedModel={selectedModel}
                    onSelectModel={(modelId) => {
                      setSelectedModel(modelId);
                      setAiModel('groq');
                      setIsModelDropdownOpen(false);
                      localStorage.setItem('selected_model', modelId);
                      localStorage.setItem('ai_model', 'groq');
                    }}
                  />
                  
                  {/* OpenRouter Section */}
                  <ModelProviderSection
                    title="OpenRouter"
                    models={GeminiService.OPENROUTER_MODELS}
                    selectedModel={selectedModel}
                    onSelectModel={(modelId) => {
                      setSelectedModel(modelId);
                      setAiModel('openrouter');
                      setIsModelDropdownOpen(false);
                      localStorage.setItem('selected_model', modelId);
                      localStorage.setItem('ai_model', 'openrouter');
                    }}
                  />

                  {/* Ollama Section */}
                  <ModelProviderSection
                    title={`Ollama ${ollamaMode === 'cloud' ? '(Cloud)' : '(Local)'}`}
                    models={ollamaMode === 'cloud' ? OllamaService.OLLAMA_CLOUD_MODELS : OllamaService.OLLAMA_LOCAL_MODELS}
                    selectedModel={selectedModel}
                    onSelectModel={(modelId) => {
                      console.log('[App] Ollama model selected:', modelId);
                      console.log('[App] Current selectedModel before:', selectedModel);
                      setSelectedModel(modelId);
                      setAiModel('ollama');
                      setIsModelDropdownOpen(false);
                      localStorage.setItem('selected_model', modelId);
                      localStorage.setItem('ai_model', 'ollama');
                      console.log('[App] State updated, selectedModel should be:', modelId);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </header>
        
        {/* Floating Sidebar Toggle Button - Mobile Only - DRAGGABLE */}
        {!isMobileSidebarOpen && !isCanvasOpen && (
          <button
            ref={buttonRef}
            onClick={handleButtonClick}
            className="md:hidden fixed z-30 w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg flex items-center justify-center text-white transition-all touch-manipulation active:scale-95"
            style={{
              left: `${floatingButtonPos.x}px`,
              bottom: `${floatingButtonPos.y}px`,
              boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
              cursor: isDraggingButton ? 'grabbing' : 'grab'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        )}
        
        {/* Content Wrapper - Chat + Canvas */}
        <div className="flex-1 flex relative overflow-hidden min-w-0 gap-0 md:pr-[30px] md:pb-[30px]">
          {/* Chat Interface - Hidden on mobile when canvas is open */}
          <div className={`flex-1 flex flex-col min-w-0 ${isCanvasOpen ? 'hidden md:flex' : 'flex'}`}>
            <ChatInterface 
              messages={messages} 
              onSendMessage={handleSendMessage}
              isStreaming={isStreaming}
              aiModel={aiModel}
              onOpenCanvas={handleOpenCanvas}
            />
          </div>
          
          {/* Canvas Panel - Full screen on mobile */}
          {isCanvasOpen && (
            <div className="fixed md:relative inset-0 md:inset-auto md:max-w-[750px] md:flex-1 md:min-w-[300px] z-[60] md:z-auto bg-black">
              <Suspense fallback={<div className="bg-black w-full h-full md:rounded-2xl flex items-center justify-center text-white">Loading...</div>}>
                <Canvas
                  code={canvasCode || ''}
                  filename={canvasFilename}
                  isOpen={isCanvasOpen}
                  onClose={() => setIsCanvasOpen(false)}
                  error={canvasError}
                  onError={handleCanvasError}
                  onFixError={handleFixCanvasError}
                  aiModel={aiModel}
                  isFixingError={isFixingError}
                />
              </Suspense>
            </div>
          )}
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        geminiKey={geminiApiKey}
        cerebrasKey={cerebrasApiKey}
        groqKey={groqApiKey}
        openrouterKey={openrouterApiKey}
        ollamaKey={ollamaApiKey}
        ollamaBaseUrl={ollamaBaseUrl}
        ollamaMode={ollamaMode}
        onSaveKeys={handleSaveKeys}
      />
      </div>
    </div>
  );
};

export default App;
