import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { SettingsModal } from './components/SettingsModal';
import { FileDocument, ChatMessage, ChatSession } from './types';
import * as VectorDB from './services/vectorDb';
import * as GeminiService from './services/geminiService';
import * as CerebrasService from './services/cerebrasService';
import * as ChatStorage from './services/chatStorage';
import { Settings, ChevronLeft, ChevronRight } from 'lucide-react';

const App: React.FC = () => {
  const [files, setFiles] = useState<FileDocument[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiModel, setAiModel] = useState<'gemini' | 'cerebras'>('cerebras');
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

  // Transition constant for synchronized animations
  const transitionStyle = "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]";

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

    // Load chat sessions
    const sessions = ChatStorage.getAllChatSessions();
    setChatSessions(sessions);
    
    // Load last active chat or create new one
    if (sessions.length > 0) {
      setCurrentChatId(sessions[0].id);
      setMessages(sessions[0].messages);
      setAiModel(sessions[0].aiModel);
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
      createdAt: Date.now(),
      updatedAt: Date.now(),
      aiModel: aiModel
    };
    
    ChatStorage.saveChatSession(session);
    setChatSessions(ChatStorage.getAllChatSessions());
  };

  const handleNewChat = () => {
    saveCurrentChat();
    const newChatId = crypto.randomUUID();
    setCurrentChatId(newChatId);
    setMessages([]);
  };

  const handleSelectChat = (id: string) => {
    saveCurrentChat();
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

  const handleSendMessage = async (text: string) => {
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
    // Add user message
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    console.log('→ Input:', text);

    try {
      // 1. RAG Search - get more chunks to ensure coverage
      const citations = await VectorDB.searchVectors(text, 8);
      
      console.log('→ Citations:', citations.map(c => ({
        doc: c.docName,
        score: c.similarity.toFixed(3),
        preview: c.text.substring(0, 60) + '...'
      })));
      
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
        apiKey
      );

      // 4. Finalize
      setMessages(prev => prev.map(msg => 
        msg.id === modelMsgId 
          ? { ...msg, isStreaming: false }
          : msg
      ));

      console.log('← Output:', accumulatedText.substring(0, 100) + (accumulatedText.length > 100 ? '...' : ''));

      // Save chat after successful response
      setTimeout(() => saveCurrentChat(), 100);

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
      className="flex flex-col h-screen w-full bg-[#f5f5f5] text-[#1a1a1a] font-mono selection:bg-black selection:text-white overflow-hidden relative"
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
      <header className="block md:hidden p-3 border-b-2 border-black flex justify-between items-center bg-white z-50 flex-shrink-0 sticky top-0">
        <div className="flex items-center gap-2">
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
            ☰ CONSTRUCT_LM
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono">{files.length} FILES</span>
          <select 
            value={aiModel}
            onChange={(e) => setAiModel(e.target.value as 'gemini' | 'cerebras')}
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
          className="md:hidden fixed bg-black bg-opacity-50 z-40"
          style={{ top: '60px', left: 0, right: 0, bottom: 0 }}
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      
      {/* SIDEBAR */}
      <aside 
        className={`relative bg-white shrink-0 flex flex-col border-r-2 border-black ${transitionStyle} ${isMobileSidebarOpen ? 'fixed left-0 z-50' : 'hidden md:flex'}`}
        style={{ 
          width: isSidebarCollapsed ? 0 : (isMobileSidebarOpen ? '100vw' : sidebarWidth),
          top: isMobileSidebarOpen ? '60px' : '0',
          height: isMobileSidebarOpen ? 'calc(100vh - 60px)' : '100%'
        }}
      >
        {/* Collapse/Expand Rail */}
        <div 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`hidden md:flex absolute -right-[26px] top-0 w-6 h-full border-r-2 border-black bg-[#f0f0f0] cursor-pointer group hover:bg-[#e0e0e0] z-50 flex-col items-center ${transitionStyle}`}
        >
          <div className={`mt-8 [writing-mode:vertical-lr] text-[8px] font-black tracking-[0.3em] uppercase opacity-30 group-hover:opacity-100 transition-opacity ${transitionStyle}`}>
            {isSidebarCollapsed ? 'EXPAND' : 'COLLAPSE'}
          </div>

          <div className="absolute top-1/2 -translate-y-1/2 w-full flex flex-col items-center gap-1">
            <div className="w-1 h-8 bg-black/10 group-hover:bg-black/20" />
            <div className={`w-full h-12 bg-black flex items-center justify-center text-white shadow-[2px_0_10px_rgba(0,0,0,0.1)] transition-transform group-hover:scale-x-110`}>
              {isSidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
            </div>
            <div className="w-1 h-8 bg-black/10 group-hover:bg-black/20" />
          </div>

          <div className="absolute bottom-8 [writing-mode:vertical-lr] text-[7px] font-bold tracking-widest text-black/20">
            SYSTEM_RAIL_V1
          </div>
        </div>

        <div 
          style={{ 
            width: isMobileSidebarOpen ? '100vw' : sidebarWidth,
            transform: isSidebarCollapsed ? `translateX(-${sidebarWidth}px)` : 'translateX(0)',
          }}
          className={`h-full flex flex-col overflow-hidden ${transitionStyle} ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}
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
            isCollapsed={isSidebarCollapsed}
          />
        </div>

        {!isSidebarCollapsed && (
          <div 
            onMouseDown={startResizing}
            className="hidden md:block absolute top-0 right-[-2px] w-2 h-full cursor-col-resize z-[60] active:bg-black/10 hover:bg-black/5"
          />
        )}
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col relative bg-[#f9f9f9] min-w-0 ml-0 md:ml-6">
        {/* Desktop Header */}
        <header className="hidden md:flex h-16 border-b-2 border-black items-center justify-between px-8 bg-white shrink-0 z-20">
          <div className="flex items-center gap-6">
            <Settings 
              size={18} 
              className="cursor-pointer hover:rotate-45 transition-transform" 
              onClick={() => setIsSettingsOpen(true)}
            />
            <h1 className="text-lg font-black uppercase tracking-tighter">Construct_LM</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {['GEMINI', 'CEREBRAS'].map(m => (
                <button 
                  key={m}
                  onClick={() => setAiModel(m.toLowerCase() as 'gemini' | 'cerebras')}
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
