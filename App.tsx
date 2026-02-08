import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { SettingsModal } from './components/SettingsModal';
import { FileDocument, ChatMessage, Citation, ChatSession } from './types';
import * as VectorDB from './services/vectorDb';
import * as GeminiService from './services/geminiService';
import * as CerebrasService from './services/cerebrasService';
import * as ChatStorage from './services/chatStorage';

const App: React.FC = () => {
  const [files, setFiles] = useState<FileDocument[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiModel, setAiModel] = useState<'gemini' | 'cerebras'>('cerebras');
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [cerebrasApiKey, setCerebrasApiKey] = useState('');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

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
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.min(Math.max(e.clientX, 300), 600);
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

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

    try {
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
      className="flex flex-col md:flex-row h-screen w-full bg-white text-black font-sans overflow-hidden" 
      style={{ height: '100dvh' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`${isMobileSidebarOpen ? 'fixed inset-y-0 left-0 z-50' : 'hidden'} md:block transition-all duration-300 ${isSidebarCollapsed ? 'md:w-0 md:overflow-hidden' : ''}`}>
        <Sidebar 
          files={files} 
          onUpload={handleUpload} 
          onDelete={handleDelete}
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
      
      {/* Resize Handle / Toggle Button */}
      <div className="hidden md:flex items-center relative">
        {!isSidebarCollapsed && (
          <div 
            className="w-1 bg-gray-200 hover:bg-black cursor-col-resize transition-colors h-full"
            onMouseDown={() => setIsResizing(true)}
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
          </div>
        )}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-black text-white hover:bg-gray-800 flex items-center justify-center z-10 rounded-r"
          title={isSidebarCollapsed ? "Open sidebar" : "Close sidebar"}
        >
          <span className="text-xs">{isSidebarCollapsed ? '›' : '‹'}</span>
        </button>
      </div>
      
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden p-3 border-b-2 border-black flex justify-between items-center bg-white z-10 flex-shrink-0">
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className="font-mono font-bold text-sm hover:bg-gray-100 px-2 py-1 flex items-center gap-2"
          >
            ☰ CONSTRUCT_LM
            <span className="text-[8px] text-gray-400">SWIPE →</span>
          </button>
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

        {/* Desktop Header */}
        <header className="hidden md:flex p-4 border-b-2 border-black justify-between items-center bg-white z-10 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="font-mono text-lg font-bold">CONSTRUCT_LM</h1>
            <span className="text-xs font-mono text-gray-500">{files.length} FILES INDEXED</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-gray-500">AI MODEL:</span>
            <div className="flex gap-1 border-2 border-black">
              <button
                onClick={() => setAiModel('gemini')}
                className={`px-3 py-1 text-xs font-mono font-bold transition-all ${
                  aiModel === 'gemini'
                    ? 'bg-black text-white'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                GEMINI
              </button>
              <button
                onClick={() => setAiModel('cerebras')}
                className={`px-3 py-1 text-xs font-mono font-bold transition-all ${
                  aiModel === 'cerebras'
                    ? 'bg-black text-white'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                CEREBRAS
              </button>
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
  );
};

export default App;
