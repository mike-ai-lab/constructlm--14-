import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { SettingsModal } from './components/SettingsModal';
import { FileDocument, ChatMessage, ChatSession } from './types';
import * as VectorDB from './services/vectorDb';
import * as GeminiService from './services/geminiService';
import * as CerebrasService from './services/cerebrasService';
import * as GroqService from './services/groqService';
import * as OpenRouterService from './services/openrouterService';
import * as OllamaService from './services/ollamaService';
import * as ChatStorage from './services/chatStorage';
import { Settings, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

const App: React.FC = () => {
  const [files, setFiles] = useState<FileDocument[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiModel, setAiModel] = useState<'gemini' | 'cerebras' | 'groq' | 'openrouter' | 'ollama'>('cerebras');
  const [selectedModel, setSelectedModel] = useState('llama3.1-8b');
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
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
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
      } catch (error) {
        console.error(`Error processing ${file.name}`, error);
        alert(`Failed to process ${file.name}. Ensure it is a valid text-based file.`);
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

  const handleSaveKeys = (gemini: string, cerebras: string, groq: string, openrouter: string, ollama: string, ollamaUrl: string) => {
    localStorage.setItem('gemini_api_key', gemini);
    localStorage.setItem('cerebras_api_key', cerebras);
    localStorage.setItem('groq_api_key', groq);
    localStorage.setItem('openrouter_api_key', openrouter);
    localStorage.setItem('ollama_api_key', ollama);
    localStorage.setItem('ollama_base_url', ollamaUrl);
    setGeminiApiKey(gemini);
    setCerebrasApiKey(cerebras);
    setGroqApiKey(groq);
    setOpenrouterApiKey(openrouter);
    setOllamaApiKey(ollama);
    setOllamaBaseUrl(ollamaUrl);
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
      setAiModel(session.aiModel);
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

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
    if (isRightSwipe && !isMobileSidebarOpen) {
      setIsMobileSidebarOpen(true);
    }
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

    console.log('[RAG Query]', text);

    try {
      // 1. RAG Search - get more chunks to ensure coverage
      const citations = await VectorDB.searchVectors(text, 8);
      
      console.log('[Citations Found]', citations.length, 'sources:');
      citations.forEach((c, i) => {
        console.log(`  ${i+1}. ${c.docName} (score: ${c.similarity.toFixed(3)})`);
        console.log(`     "${c.text.substring(0, 80)}..."`);
      });
      
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

      // 3. Stream Response
      let accumulatedText = '';
      let accumulatedReasoning = '';
      
      const streamService = 
        aiModel === 'gemini' ? GeminiService :
        aiModel === 'cerebras' ? CerebrasService :
        aiModel === 'groq' ? GroqService :
        aiModel === 'openrouter' ? OpenRouterService :
        (await import('./services/ollamaService')).default;
      
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

      // 4. Finalize with token count
      const outputTokens = GeminiService.estimateTokens(accumulatedText);
      setMessages(prev => prev.map(msg => 
        msg.id === modelMsgId 
          ? { ...msg, isStreaming: false, outputTokens, inputTokens: userMsg.inputTokens }
          : msg
      ));

      console.log('[AI Response]', accumulatedText.substring(0, 150) + (accumulatedText.length > 150 ? '...' : ''));

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
      className="flex flex-col min-h-[100dvh] h-[100dvh] w-full bg-white dark:bg-[#0a0a0b] text-slate-900 dark:text-slate-100 font-sans selection:bg-brand-blue selection:text-white overflow-hidden relative transition-colors duration-300"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
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
        className="block md:hidden p-3 border-b border-slate-200 dark:border-white/5 flex justify-between items-center bg-white/80 dark:bg-[#0a0a0b]/80 glass z-50 flex-shrink-0 sticky top-0"
        style={{ height: MOBILE_HEADER_HEIGHT_WITH_SAFE_AREA, paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open('/docs/index.html', '_blank')}
            className="hover:bg-slate-100 dark:hover:bg-white/5 px-2 py-1 rounded transition-colors"
            title="Documentation"
          >
            <BookOpen size={18} />
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="hover:bg-slate-100 dark:hover:bg-white/5 px-2 py-1 rounded transition-colors"
            title="Settings"
          >
            <Settings size={18} />
          </button>
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className="font-sans font-bold text-xs hover:bg-slate-100 dark:hover:bg-white/5 px-2 py-1 flex items-center gap-2 uppercase tracking-tight transition-colors"
          >
            ConstructLM
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">{files.length} Files</span>
          <select 
            value={aiModel}
            onChange={(e) => {
              const provider = e.target.value as 'gemini' | 'cerebras' | 'groq' | 'openrouter';
              setAiModel(provider);
              localStorage.setItem('ai_model', provider);
              
              const modelLists = {
                gemini: GeminiService.GEMINI_MODELS,
                cerebras: GeminiService.CEREBRAS_MODELS,
                groq: GeminiService.GROQ_MODELS,
                openrouter: GeminiService.OPENROUTER_MODELS,
                ollama: ollamaMode === 'cloud' ? OllamaService.OLLAMA_CLOUD_MODELS : OllamaService.OLLAMA_LOCAL_MODELS
              };
              
              const isCompatible = modelLists[provider].some(model => model.id === selectedModel);
              if (!isCompatible) {
                const defaultModel = modelLists[provider][0].id;
                setSelectedModel(defaultModel);
                localStorage.setItem('selected_model', defaultModel);
              }
            }}
            className="text-[9px] font-bold uppercase px-2 py-1 border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-800 rounded"
          >
            <option value="gemini">GEMINI</option>
            <option value="cerebras">CEREBRAS</option>
            <option value="groq">GROQ</option>
            <option value="openrouter">OPENROUTER</option>
            <option value="ollama">OLLAMA</option>
          </select>
        </div>
      </header>

      {/* Content wrapper for desktop/mobile */}
      <div className="flex flex-1 overflow-hidden relative">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="md:hidden fixed bg-black/50 z-40 transition-opacity duration-300"
          style={{ 
            top: 0,
            left: 0, 
            right: 0, 
            bottom: 0,
            opacity: isMobileSidebarOpen ? 0.5 : 0
          }}
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      
      {/* SIDEBAR */}
      <aside 
        className={`bg-white dark:bg-[#0f0f11] shrink-0 flex flex-col border-r border-slate-200 dark:border-white/5 shadow-lg fixed md:relative left-0 z-50 ${
          isMobileSidebarOpen ? '' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ 
          width: isMobileSidebarOpen 
            ? '100vw' 
            : (isSidebarCollapsed ? 0 : sidebarWidth),
          top: 0,
          height: isMobileSidebarOpen ? '100dvh' : '100%',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div 
          style={{ 
            width: isMobileSidebarOpen ? '100vw' : sidebarWidth,
            transform: (!isMobileSidebarOpen && isSidebarCollapsed) ? `translateX(-${sidebarWidth}px)` : 'translateX(0)',
          }}
          className={`h-full flex flex-col overflow-hidden ${transitionStyle} ${(!isMobileSidebarOpen && isSidebarCollapsed) ? 'opacity-0' : 'opacity-100'}`}
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

      {/* Mobile Swipe Indicator - Only visible when sidebar is closed */}
      {!isMobileSidebarOpen && (
        <div 
          className="md:hidden fixed left-0 top-1/2 -translate-y-1/2 z-30 pointer-events-none"
          style={{ top: 'calc(50% + 30px)' }}
        >
          <div className="flex items-center">
            <div className="w-1 h-16 bg-brand-blue/30 rounded-r-full animate-pulse" />
            <div className="ml-1 flex flex-col gap-1">
              <div className="w-2 h-2 bg-brand-blue/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-brand-blue/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-brand-blue/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      {/* MAIN */}
      <main className="flex-1 flex flex-col relative bg-white dark:bg-[#0a0a0b] min-w-0 w-full">
        {/* Desktop Header */}
        <header className="hidden md:flex h-12 items-center justify-between px-8 bg-white dark:bg-[#0a0a0b] shrink-0 z-20">
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
            
            {/* Model Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="h-9 px-4 text-[10px] font-bold uppercase border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1b1b1d] hover:bg-slate-50 dark:hover:bg-[#0f0f11] transition-all flex items-center gap-2 rounded"
              >
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[8px] opacity-60">{aiModel}</span>
                  <span className="text-[9px]">{selectedModel}</span>
                </div>
                <span className="text-[8px]">▼</span>
              </button>
              
              {isModelDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-[#1b1b1d] border border-slate-200 dark:border-white/10 shadow-xl rounded-lg z-50 min-w-[280px] max-h-[500px] overflow-y-auto">
                  <div className="p-2 border-b border-slate-100 dark:border-white/5 text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cerebras</div>
                  {GeminiService.CEREBRAS_MODELS.map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setAiModel('cerebras');
                        setIsModelDropdownOpen(false);
                        localStorage.setItem('selected_model', model.id);
                        localStorage.setItem('ai_model', 'cerebras');
                      }}
                      className={`w-full text-left px-4 py-2 text-[10px] font-sans hover:bg-slate-50 dark:hover:bg-[#0f0f11] transition-colors ${
                        selectedModel === model.id ? 'bg-slate-50 dark:bg-[#0f0f11] font-bold' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span>{model.id}</span>
                        <span className="text-[8px] text-slate-500 dark:text-slate-400">{model.context}</span>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {model.tags.map(tag => (
                          <span key={tag} className="text-[7px] px-1 py-0.5 bg-slate-100 dark:bg-[#0a0a0b] text-slate-600 dark:text-slate-300 rounded">{tag}</span>
                        ))}
                      </div>
                    </button>
                  ))}
                  
                  <div className="p-2 border-b border-t border-slate-100 dark:border-white/5 text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gemini</div>
                  {GeminiService.GEMINI_MODELS.map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setAiModel('gemini');
                        setIsModelDropdownOpen(false);
                        localStorage.setItem('selected_model', model.id);
                        localStorage.setItem('ai_model', 'gemini');
                      }}
                      className={`w-full text-left px-4 py-2 text-[10px] font-sans hover:bg-slate-50 dark:hover:bg-[#0f0f11] transition-colors ${
                        selectedModel === model.id ? 'bg-slate-50 dark:bg-[#0f0f11] font-bold' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span>{model.id}</span>
                        <span className="text-[8px] text-slate-500 dark:text-slate-400">{model.context}</span>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {model.tags.map(tag => (
                          <span key={tag} className="text-[7px] px-1 py-0.5 bg-slate-100 dark:bg-[#0a0a0b] text-slate-600 dark:text-slate-300 rounded">{tag}</span>
                        ))}
                      </div>
                    </button>
                  ))}
                  
                  <div className="p-2 border-b border-t border-slate-100 dark:border-white/5 text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Groq</div>
                  {GeminiService.GROQ_MODELS.map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setAiModel('groq');
                        setIsModelDropdownOpen(false);
                        localStorage.setItem('selected_model', model.id);
                        localStorage.setItem('ai_model', 'groq');
                      }}
                      className={`w-full text-left px-4 py-2 text-[10px] font-sans hover:bg-slate-50 dark:hover:bg-[#0f0f11] transition-colors ${
                        selectedModel === model.id ? 'bg-slate-50 dark:bg-[#0f0f11] font-bold' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span>{model.id}</span>
                        <span className="text-[8px] text-slate-500 dark:text-slate-400">{model.context}</span>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {model.tags.map(tag => (
                          <span key={tag} className="text-[7px] px-1 py-0.5 bg-slate-100 dark:bg-[#0a0a0b] text-slate-600 dark:text-slate-300 rounded">{tag}</span>
                        ))}
                      </div>
                    </button>
                  ))}
                  
                  <div className="p-2 border-b border-t border-slate-100 dark:border-white/5 text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">OpenRouter</div>
                  {GeminiService.OPENROUTER_MODELS.map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setAiModel('openrouter');
                        setIsModelDropdownOpen(false);
                        localStorage.setItem('selected_model', model.id);
                        localStorage.setItem('ai_model', 'openrouter');
                      }}
                      className={`w-full text-left px-4 py-2 text-[10px] font-sans hover:bg-slate-50 dark:hover:bg-[#0f0f11] transition-colors ${
                        selectedModel === model.id ? 'bg-slate-50 dark:bg-[#0f0f11] font-bold' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span>{model.id}</span>
                        <span className="text-[8px] text-slate-500 dark:text-slate-400">{model.context}</span>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {model.tags.map(tag => (
                          <span key={tag} className="text-[7px] px-1 py-0.5 bg-slate-100 dark:bg-[#0a0a0b] text-slate-600 dark:text-slate-300 rounded">{tag}</span>
                        ))}
                      </div>
                    </button>
                  ))}

                  <div className="p-2 border-b border-t border-slate-100 dark:border-white/5 text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ollama {ollamaMode === 'cloud' ? '(Cloud)' : '(Local)'}</div>
                  {(ollamaMode === 'cloud' ? OllamaService.OLLAMA_CLOUD_MODELS : OllamaService.OLLAMA_LOCAL_MODELS).map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setAiModel('ollama');
                        setIsModelDropdownOpen(false);
                        localStorage.setItem('selected_model', model.id);
                        localStorage.setItem('ai_model', 'ollama');
                      }}
                      className={`w-full text-left px-4 py-2 text-[10px] font-sans hover:bg-slate-50 dark:hover:bg-[#0f0f11] transition-colors ${
                        selectedModel === model.id ? 'bg-slate-50 dark:bg-[#0f0f11] font-bold' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span>{model.id}</span>
                        <span className="text-[8px] text-slate-500 dark:text-slate-400">{model.context}</span>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {model.tags.map(tag => (
                          <span key={tag} className="text-[7px] px-1 py-0.5 bg-slate-100 dark:bg-[#0a0a0b] text-slate-600 dark:text-slate-300 rounded">{tag}</span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>
        
        <ChatInterface 
          messages={messages} 
          onSendMessage={handleSendMessage}
          isStreaming={isStreaming}
          aiModel={aiModel}
        />
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
        onSaveKeys={handleSaveKeys}
      />
      </div>
    </div>
  );
};

export default App;
