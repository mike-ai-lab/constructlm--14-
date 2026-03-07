import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { SettingsModal } from './components/SettingsModal';
import { FileDocument, ChatMessage, ChatSession } from './types';
import * as VectorDB from './services/vectorDb';
import * as GeminiService from './services/geminiService';
import * as CerebrasService from './services/cerebrasService';
import * as ChatStorage from './services/chatStorage';
import { Settings, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

const App: React.FC = () => {
  const [files, setFiles] = useState<FileDocument[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiModel, setAiModel] = useState<'gemini' | 'cerebras'>('gemini');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [cerebrasApiKey, setCerebrasApiKey] = useState('');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
    setGeminiApiKey(storedGeminiKey);
    setCerebrasApiKey(storedCerebrasKey);

    // Load saved AI provider and model preferences
    const savedAiModel = localStorage.getItem('ai_model') as 'gemini' | 'cerebras' | null;
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
    if (!storedGeminiKey && !storedCerebrasKey) {
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

  const handleSaveKeys = (gemini: string, cerebras: string) => {
    localStorage.setItem('gemini_api_key', gemini);
    localStorage.setItem('cerebras_api_key', cerebras);
    setGeminiApiKey(gemini);
    setCerebrasApiKey(cerebras);
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
      
      const streamService = aiModel === 'gemini' ? GeminiService : CerebrasService;
      const apiKey = aiModel === 'gemini' ? geminiApiKey : cerebrasApiKey;
      
      await streamService.streamChatResponse(
        text, 
        messages, 
        citations, 
        (chunk) => {
          accumulatedText += chunk;
          setMessages(prev => prev.map(msg => 
            msg.id === modelMsgId 
              ? { ...msg, content: accumulatedText }
              : msg
          ));
        },
        apiKey,
        selectedModel,
        imageBase64
      );

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
      className="flex flex-col min-h-[100dvh] h-[100dvh] w-full bg-[#f5f5f5] text-[#1a1a1a] font-mono selection:bg-black selection:text-white overflow-hidden relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <style>{`
        /* Custom Scrollbar Styling */
        ::-webkit-scrollbar {
          width: 12px; 
          height: 12px;
        }
        ::-webkit-scrollbar-track {
          background: #f0f0f0;
          border-left: 1px solid black;
        }
        ::-webkit-scrollbar-thumb {
          background: black;
          border-radius: 0px;
          border: 2px solid #f0f0f0; 
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #333;
        }
      `}</style>

      {/* Mobile Header - Always visible on mobile */}
      {/* FIXED: Added fixed height to ensure sidebar offset matches exactly */}
      <header 
        className="block md:hidden p-3 border-b-2 border-black flex justify-between items-center bg-white z-50 flex-shrink-0 sticky top-0"
        style={{ height: MOBILE_HEADER_HEIGHT_WITH_SAFE_AREA, paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open('/docs/index.html', '_blank')}
            className="hover:bg-gray-100 px-2 py-1 rounded"
            title="Documentation"
          >
            <BookOpen size={18} />
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="hover:bg-gray-100 px-2 py-1 rounded"
            title="Settings"
          >
            <Settings size={18} />
          </button>
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className="font-mono font-bold text-sm hover:bg-gray-100 px-2 py-1 flex items-center gap-2"
          >
            CONSTRUCT_LM
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono">{files.length} FILES</span>
          <select 
            value={aiModel}
            onChange={(e) => {
              const provider = e.target.value as 'gemini' | 'cerebras';
              setAiModel(provider);
              localStorage.setItem('ai_model', provider);
              
              // Auto-select a compatible model for the provider
              if (provider === 'gemini') {
                const isGeminiModel = GeminiService.GEMINI_MODELS.some(model => model.id === selectedModel);
                if (!isGeminiModel) {
                  const defaultGemini = 'gemini-2.5-flash';
                  setSelectedModel(defaultGemini);
                  localStorage.setItem('selected_model', defaultGemini);
                }
              } else {
                const isCerebrasModel = GeminiService.CEREBRAS_MODELS.some(model => model.id === selectedModel);
                if (!isCerebrasModel) {
                  const defaultCerebras = 'llama3.1-8b';
                  setSelectedModel(defaultCerebras);
                  localStorage.setItem('selected_model', defaultCerebras);
                }
              }
            }}
            className="text-[10px] font-mono font-bold px-2 py-1 border border-black bg-white"
          >
            <option value="gemini">GEMINI</option>
            <option value="cerebras">CEREBRAS</option>
          </select>
        </div>
      </header>

      {/* Content wrapper for desktop/mobile */}
      <div className="flex flex-1 overflow-hidden relative">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="md:hidden fixed bg-black z-40 transition-opacity duration-300"
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
        className={`bg-white shrink-0 flex flex-col border-r-2 border-black shadow-[4px_0_0_0_rgba(0,0,0,1)] fixed md:relative left-0 z-50 ${
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
        {/* Collapse/Expand Button - Desktop Only */}
        {!isMobileSidebarOpen && (
          <div 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex absolute -right-[12px] top-1/2 -translate-y-1/2 w-6 h-16 bg-white border-2 border-black items-center justify-center cursor-pointer z-[70] transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]"
          >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </div>
        )}

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
            className="hidden md:block absolute top-0 right-[-2px] w-2 h-full cursor-col-resize z-[60] active:bg-black/10 hover:bg-black/5"
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
            <div className="w-1 h-16 bg-black rounded-r-full animate-pulse" />
            <div className="ml-1 flex flex-col gap-1">
              <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      {/* MAIN */}
      {/* FIXED: Added w-full and proper flex properties to ensure ChatInterface renders on mobile */}
      <main className="flex-1 flex flex-col relative bg-white md:bg-[#f9f9f9] min-w-0 w-full">
        {/* Desktop Header */}
        <header className="hidden md:flex h-16 border-b-2 border-black items-center justify-between px-8 bg-white shrink-0 z-20">
          <div className="flex items-center gap-6">
            <BookOpen 
              size={18} 
              className="cursor-pointer hover:scale-110 transition-transform" 
              onClick={() => window.open('/docs/index.html', '_blank')}
              title="Documentation"
            />
            <Settings 
              size={18} 
              className="cursor-pointer hover:rotate-45 transition-transform" 
              onClick={() => setIsSettingsOpen(true)}
              title="Settings"
            />
            <h1 className="text-lg font-black uppercase tracking-tighter">Construct_LM</h1>
            
            {/* Model Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="h-9 px-4 text-[10px] font-black uppercase border-2 border-black bg-white hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all flex items-center gap-2"
              >
                {selectedModel}
                <span className="text-[8px]">▼</span>
              </button>
              
              {isModelDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 min-w-[280px]">
                  <div className="p-2 border-b border-gray-200 text-[8px] font-bold text-gray-500">CEREBRAS</div>
                  {GeminiService.CEREBRAS_MODELS.map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setAiModel('cerebras');
                        setIsModelDropdownOpen(false);
                        // Persist to localStorage
                        localStorage.setItem('selected_model', model.id);
                        localStorage.setItem('ai_model', 'cerebras');
                      }}
                      className={`w-full text-left px-4 py-2 text-[10px] font-mono hover:bg-gray-100 ${
                        selectedModel === model.id ? 'bg-gray-100 font-bold' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span>{model.id}</span>
                        <span className="text-[8px] text-gray-500">{model.context}</span>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {model.tags.map(tag => (
                          <span key={tag} className="text-[7px] px-1 py-0.5 bg-gray-200 text-gray-700">{tag}</span>
                        ))}
                      </div>
                    </button>
                  ))}
                  <div className="p-2 border-b border-t border-gray-200 text-[8px] font-bold text-gray-500">GEMINI</div>
                  {GeminiService.GEMINI_MODELS.map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setAiModel('gemini');
                        setIsModelDropdownOpen(false);
                        // Persist to localStorage
                        localStorage.setItem('selected_model', model.id);
                        localStorage.setItem('ai_model', 'gemini');
                      }}
                      className={`w-full text-left px-4 py-2 text-[10px] font-mono hover:bg-gray-100 ${
                        selectedModel === model.id ? 'bg-gray-100 font-bold' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span>{model.id}</span>
                        <span className="text-[8px] text-gray-500">{model.context}</span>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {model.tags.map(tag => (
                          <span key={tag} className="text-[7px] px-1 py-0.5 bg-gray-200 text-gray-700">{tag}</span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {['GEMINI', 'CEREBRAS'].map(m => (
                <button 
                  key={m}
                  onClick={() => {
                    const provider = m.toLowerCase() as 'gemini' | 'cerebras';
                    setAiModel(provider);
                    localStorage.setItem('ai_model', provider);
                    
                    // Auto-select a compatible model for the provider
                    if (provider === 'gemini') {
                      // Check if current model is a Gemini model
                      const isGeminiModel = GeminiService.GEMINI_MODELS.some(model => model.id === selectedModel);
                      if (!isGeminiModel) {
                        // Switch to default Gemini model
                        const defaultGemini = 'gemini-2.5-flash';
                        setSelectedModel(defaultGemini);
                        localStorage.setItem('selected_model', defaultGemini);
                      }
                    } else {
                      // Check if current model is a Cerebras model
                      const isCerebrasModel = GeminiService.CEREBRAS_MODELS.some(model => model.id === selectedModel);
                      if (!isCerebrasModel) {
                        // Switch to default Cerebras model
                        const defaultCerebras = 'llama3.1-8b';
                        setSelectedModel(defaultCerebras);
                        localStorage.setItem('selected_model', defaultCerebras);
                      }
                    }
                  }}
                  className={`h-9 px-4 text-[10px] font-black uppercase transition-all duration-75 border-2 ${
                    aiModel === m.toLowerCase()
                    ? 'bg-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px] text-black' 
                    : 'bg-white border-gray-100 text-black'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </header>
        
        <ChatInterface 
          messages={messages} 
          onSendMessage={handleSendMessage}
          isStreaming={isStreaming}
        />
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        geminiKey={geminiApiKey}
        cerebrasKey={cerebrasApiKey}
        onSaveKeys={handleSaveKeys}
      />
      </div>
    </div>
  );
};

export default App;
