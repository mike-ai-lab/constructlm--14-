import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Image as ImageIcon, X, FileText, Play, Code, Download, Copy, Check, Undo, Redo } from 'lucide-react';
import { ChatMessage, Citation } from '../types';
import * as GeminiService from '../services/geminiService';
import { generateBundledPreview } from '../services/runtimeBundler';
import { CodeEditor } from './CodeEditor';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string, imageBase64?: string) => void;
  isStreaming: boolean;
  aiModel: 'gemini' | 'cerebras' | 'groq' | 'openrouter';
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isStreaming,
  aiModel
}) => {
  const [input, setInput] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [pinnedCitation, setPinnedCitation] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<Array<{base64: string, preview: string, name: string, size: number, tokens: number}>>([]);
  const [estimatedTokens, setEstimatedTokens] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isImagesExpanded, setIsImagesExpanded] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [codeBlockStates, setCodeBlockStates] = useState<{[key: string]: {showRendered: boolean}}>({});
  const [copiedBlocks, setCopiedBlocks] = useState<{[key: string]: boolean}>({});
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [canvasContent, setCanvasContent] = useState<{html: string, code: string, language: string, blockId: string} | null>(null);
  const [canvasShowCode, setCanvasShowCode] = useState(false);
  const [canvasEditedCode, setCanvasEditedCode] = useState('');
  const [editedCodeBlocks, setEditedCodeBlocks] = useState<{[blockId: string]: string}>({});
  const [iframeKey, setIframeKey] = useState(0);
  const [codeVersionHistory, setCodeVersionHistory] = useState<{[blockId: string]: {versions: string[], currentIndex: number}}>({});
  const [autoOpenedBlocks, setAutoOpenedBlocks] = useState<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const getFileExtension = (lang: string) => {
    const extensions: {[key: string]: string} = {
      javascript: 'js', typescript: 'ts', python: 'py', java: 'java',
      html: 'html', htm: 'html', css: 'css', json: 'json', xml: 'xml',
      markdown: 'md', md: 'md', yaml: 'yml', yml: 'yml', sql: 'sql',
      bash: 'sh', sh: 'sh', cpp: 'cpp', c: 'c', csharp: 'cs', go: 'go',
      rust: 'rs', php: 'php', ruby: 'rb', swift: 'swift', kotlin: 'kt',
      tsx: 'tsx', jsx: 'jsx'
    };
    return extensions[lang.toLowerCase()] || 'txt';
  };

  // Use the new runtime bundler for React preview
  const generateReactPreviewHtml = (code: string, language: string = 'tsx') => {
    const result = generateBundledPreview(code, language);
    return result.html || `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 20px; font-family: monospace; }
  </style>
</head>
<body>
  <div style="padding:20px;color:red;border:2px solid red;">
    <strong>Bundling Error</strong><br/>
    ${result.error || 'Unknown error occurred'}
  </div>
</body>
</html>`;
  };

  const downloadCode = (code: string, language: string) => {
    const ext = getFileExtension(language);
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code_${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyCode = (code: string, blockId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedBlocks(prev => ({...prev, [blockId]: true}));
    setTimeout(() => {
      setCopiedBlocks(prev => ({...prev, [blockId]: false}));
    }, 2000);
  };

  useEffect(() => {
    const imageTokens = selectedImages.reduce((sum, img) => sum + img.tokens, 0);
    const textTokens = GeminiService.estimateTokens(input);
    setEstimatedTokens(textTokens + imageTokens);
    
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = '48px';
      if (input) {
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
      }
    }
  }, [input, selectedImages]);

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const base64Data = base64.split(',')[1];
      const tokens = GeminiService.estimateTokens('', base64Data);
      
      let finalName = file.name;
      const existingNames = selectedImages.map(img => img.name);
      if (existingNames.includes(finalName)) {
        const nameParts = file.name.split('.');
        const ext = nameParts.pop();
        const baseName = nameParts.join('.');
        let counter = 1;
        while (existingNames.includes(`${baseName}_(${counter}).${ext}`)) {
          counter++;
        }
        finalName = `${baseName}_(${counter}).${ext}`;
      }
      
      setSelectedImages(prev => [...prev, {
        base64: base64Data,
        preview: base64,
        name: finalName,
        size: file.size,
        tokens
      }]);
    };
    reader.readAsDataURL(file);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => processImageFile(file));
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    setSelectedImages([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === dropZoneRef.current) setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files) {
      Array.from(files).forEach(file => processImageFile(file));
    }
  };

  const handleVersionUndo = () => {
    if (!canvasContent) return;
    const history = codeVersionHistory[canvasContent.blockId];
    if (!history || history.currentIndex <= 0) return;
    
    const newIndex = history.currentIndex - 1;
    const previousCode = history.versions[newIndex];
    
    // Regenerate HTML for preview
    let newHtml = previousCode;
    const isTsx = canvasContent.language === 'tsx' || canvasContent.language === 'jsx' || 
                  canvasContent.language === 'typescript' || canvasContent.language === 'javascript' || canvasContent.language === 'ts';
    const isReactComponent = isTsx && (previousCode.includes('export default') || previousCode.includes('function'));
    
    if (isReactComponent) {
      newHtml = generateReactPreviewHtml(previousCode, canvasContent.language);
    } else if (canvasContent.language !== 'html' && canvasContent.language !== 'htm') {
      newHtml = previousCode;
    }
    
    setCodeVersionHistory(prev => ({
      ...prev,
      [canvasContent.blockId]: {...history, currentIndex: newIndex}
    }));
    setCanvasEditedCode(previousCode);
    setEditedCodeBlocks(prev => ({...prev, [canvasContent.blockId]: previousCode}));
    setCanvasContent({html: newHtml, code: previousCode, language: canvasContent.language, blockId: canvasContent.blockId});
    setIframeKey(prev => prev + 1);
  };

  const handleVersionRedo = () => {
    if (!canvasContent) return;
    const history = codeVersionHistory[canvasContent.blockId];
    if (!history || history.currentIndex >= history.versions.length - 1) return;
    
    const newIndex = history.currentIndex + 1;
    const nextCode = history.versions[newIndex];
    
    // Regenerate HTML for preview
    let newHtml = nextCode;
    const isTsx = canvasContent.language === 'tsx' || canvasContent.language === 'jsx' || 
                  canvasContent.language === 'typescript' || canvasContent.language === 'javascript' || canvasContent.language === 'ts';
    const isReactComponent = isTsx && (nextCode.includes('export default') || nextCode.includes('function'));
    
    if (isReactComponent) {
      newHtml = generateReactPreviewHtml(nextCode, canvasContent.language);
    } else if (canvasContent.language !== 'html' && canvasContent.language !== 'htm') {
      newHtml = nextCode;
    }
    
    setCodeVersionHistory(prev => ({
      ...prev,
      [canvasContent.blockId]: {...history, currentIndex: newIndex}
    }));
    setCanvasEditedCode(nextCode);
    setEditedCodeBlocks(prev => ({...prev, [canvasContent.blockId]: nextCode}));
    setCanvasContent({html: newHtml, code: nextCode, language: canvasContent.language, blockId: canvasContent.blockId});
    setIframeKey(prev => prev + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && selectedImages.length === 0) || isStreaming) return;
    const imagesBase64 = selectedImages.map(img => img.base64).join(',');
    onSendMessage(input || 'Analyze these images', imagesBase64 || undefined);
    setInput('');
    clearAllImages();
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-open Canvas for React components
  useEffect(() => {
    if (isStreaming || messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'model' || lastMessage.isStreaming) return;
    
    // Extract code blocks from the message
    const codeBlockRegex = /```(\w+)\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(lastMessage.content)) !== null) {
      const language = match[1];
      const code = match[2];
      const blockId = `${lastMessage.id}-${code.substring(0, 20)}`;
      
      // Check if already auto-opened
      if (autoOpenedBlocks.has(blockId)) continue;
      
      // Check if it's a React component
      const isTsx = language === 'tsx' || language === 'jsx' || 
                    language === 'typescript' || language === 'javascript' || language === 'ts' || language === 'js';
      const isReactComponent = isTsx && (
        code.includes('export default') || 
        (code.includes('function') && code.includes('return')) ||
        code.includes('const') && code.includes('=>') && code.includes('return')
      );
      
      // Auto-open only for React components
      if (isReactComponent) {
        const html = generateReactPreviewHtml(code, language);
        setCanvasContent({html, code, language, blockId});
        setCanvasEditedCode(code);
        setCanvasOpen(true);
        setCanvasShowCode(false);
        
        // Initialize version history
        if (!codeVersionHistory[blockId]) {
          setCodeVersionHistory(prev => ({
            ...prev,
            [blockId]: {versions: [code], currentIndex: 0}
          }));
        }
        
        // Mark as auto-opened
        setAutoOpenedBlocks(prev => new Set(prev).add(blockId));
        
        // Only auto-open the first React component found
        break;
      }
    }
  }, [messages, isStreaming]);

  return (
    <div className="flex h-full bg-white dark:bg-[#0a0a0b] relative overflow-hidden">
      {/* Main Chat Area */}
      <div className={`flex flex-col bg-white dark:bg-[#0a0a0b] relative overflow-hidden transition-all duration-300 ${canvasOpen ? 'w-1/2' : 'w-full'}`}>
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-12 flex flex-col items-center relative" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="w-full max-w-3xl space-y-10">
          {messages.length === 0 && (
            <div className="max-w-3xl mx-auto space-y-4 py-20">
              <div className="flex items-center gap-2 opacity-50">
                <div className="h-[1px] w-6 bg-current"></div>
                <span className="text-[9px] font-black uppercase tracking-widest">Session Start: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              <h2 className="text-2xl font-light leading-tight">
                Welcome, <span className="font-bold text-brand-blue">User</span>. How can we optimize your design intelligence today?
              </h2>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className="w-full">
              {msg.role === 'user' ? (
                <div className="flex flex-col items-end">
                  <div className="mb-2 font-sans text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">You</div>
                  <div className="max-w-[80%] md:max-w-[70%] p-4 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1b1b1d] text-slate-900 dark:text-slate-100 rounded-2xl shadow-sm">
                    <div className="leading-relaxed text-sm font-sans whitespace-pre-wrap">
                      {msg.content}
                    </div>
                    {msg.metadata?.imageBase64 && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10">
                        <div className="grid grid-cols-3 gap-2">
                          {msg.metadata.imageBase64.split(',').map((img, idx) => (
                            <img 
                              key={idx}
                              src={`data:image/jpeg;base64,${img}`}
                              alt={`Attached ${idx + 1}`}
                              className="w-full h-24 object-cover border border-slate-200 dark:border-white/10 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setImagePreview(`data:image/jpeg;base64,${img}`)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {msg.metadata?.activeSources && msg.metadata.activeSources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10 text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <FileText size={12} />
                        <span>Sources ({msg.metadata.activeSources.length}): {msg.metadata.activeSources.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex gap-4 items-start w-full">
                  {/* AI Avatar from mockup */}
                  <div className="w-7 h-7 rounded bg-brand-blue shrink-0 flex items-center justify-center text-[10px] text-white font-bold shadow-lg shadow-brand-blue/20">
                    AI
                  </div>
                  <div className="flex-1 space-y-6">
                    
                    {/* Reasoning/Thinking Display */}
                    {msg.reasoning && (
                      <details className="mb-4 border border-brand-blue/20 bg-brand-blue/5 dark:bg-brand-blue/10 rounded-lg overflow-hidden">
                        <summary className="cursor-pointer p-3 font-sans text-xs font-semibold uppercase bg-brand-blue/10 dark:bg-brand-blue/20 hover:bg-brand-blue/20 dark:hover:bg-brand-blue/30 transition-colors flex items-center gap-2">
                          <span className="text-brand-blue">💭</span>
                          Thinking Process
                          <span className="text-[10px] text-brand-blue font-normal ml-auto">
                            {msg.isStreaming ? 'Streaming...' : 'Click to expand'}
                          </span>
                        </summary>
                        <div className="p-4 text-xs font-mono text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap border-t border-brand-blue/20">
                          {msg.reasoning}
                        </div>
                      </details>
                    )}
                    
                    <div className="prose dark:prose-invert prose-slate max-w-none text-sm leading-relaxed opacity-90">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-4 mb-2" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-3 mb-2" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-base font-bold mt-2 mb-1" {...props} />,
                          p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 space-y-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 space-y-1" {...props} />,
                          li: ({node, ...props}) => <li className="ml-2" {...props} />,
                          code: ({node, inline, className, children, ...props}: any) => {
                            if (inline) {
                              return <code className="bg-slate-100 dark:bg-white/10 text-brand-blue px-1.5 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>;
                            }
                            
                            const match = /language-(\w+)/.exec(className || '');
                            const language = match ? match[1] : 'text';
                            const codeRaw = String(children).replace(/\n$/, '');
                            const blockId = `${msg.id}-${codeRaw.substring(0, 20)}`;
                            const code = editedCodeBlocks[blockId] || codeRaw;
                            const isHtml = language === 'html' || language === 'htm';
                            const isTsx = language === 'tsx' || language === 'typescript' || language === 'ts' || language === 'jsx' || language === 'javascript';
                            const isReactComponent = isTsx && (code.includes('export default') || code.includes('function'));
                            const isPreviewable = isHtml || isReactComponent;
                            const blockState = codeBlockStates[blockId] || {showRendered: false};
                            const isCopied = copiedBlocks[blockId];
                            
                            // Check if this block is currently open in Canvas
                            const isOpenInCanvas = canvasOpen && canvasContent?.blockId === blockId;
                            
                            const generatePreviewHtml = () => {
                              if (isHtml) return code;
                              if (isReactComponent) return generateReactPreviewHtml(code, language);
                              return code;
                            };
                            
                            // If this React component is open in Canvas, show a compact card instead
                            if (isReactComponent && isOpenInCanvas) {
                              return (
                                <div className="border border-slate-200 dark:border-white/10 p-4 my-4 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-[#1b1b1d] transition-all rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <div className="border border-slate-200 dark:border-white/10 p-2 bg-brand-blue text-white rounded">
                                      <Code size={18} />
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-bold uppercase tracking-tight">React Component</h4>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">{language} • Currently in Canvas</p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => copyCode(code, blockId)}
                                      className="p-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1b1b1d] hover:bg-slate-50 dark:hover:bg-[#0f0f11] text-[10px] font-mono flex items-center gap-1 rounded transition-colors"
                                      title="Copy Code"
                                    >
                                      {isCopied ? <Check size={14} /> : <Copy size={14} />}
                                    </button>
                                    <button
                                      onClick={() => downloadCode(code, language)}
                                      className="p-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1b1b1d] hover:bg-slate-50 dark:hover:bg-[#0f0f11] text-[10px] font-mono flex items-center gap-1 rounded transition-colors"
                                      title="Download"
                                    >
                                      <Download size={14} />
                                    </button>
                                  </div>
                                </div>
                              );
                            }
                            
                            // If it's a React component but Canvas is closed, show card with "Open Canvas" button
                            if (isReactComponent && !canvasOpen) {
                              return (
                                <div className="border border-slate-200 dark:border-white/10 p-4 my-4 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-[#1b1b1d] transition-all rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <div className="border border-slate-200 dark:border-white/10 p-2 bg-brand-blue text-white rounded">
                                      <Code size={18} />
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-bold uppercase tracking-tight">React Component</h4>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">{language} • Ready to render</p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => copyCode(code, blockId)}
                                      className="p-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1b1b1d] hover:bg-slate-50 dark:hover:bg-[#0f0f11] rounded transition-colors"
                                      title="Copy Code"
                                    >
                                      {isCopied ? <Check size={14} /> : <Copy size={14} />}
                                    </button>
                                    <button
                                      onClick={() => downloadCode(code, language)}
                                      className="p-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1b1b1d] hover:bg-slate-50 dark:hover:bg-[#0f0f11] rounded transition-colors"
                                      title="Download"
                                    >
                                      <Download size={14} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setCanvasContent({html: generatePreviewHtml(), code, language, blockId});
                                        setCanvasEditedCode(code);
                                        setCanvasOpen(true);
                                        setCanvasShowCode(false);
                                        
                                        if (!codeVersionHistory[blockId]) {
                                          setCodeVersionHistory(prev => ({
                                            ...prev,
                                            [blockId]: {versions: [code], currentIndex: 0}
                                          }));
                                        }
                                      }}
                                      className="border border-brand-blue px-4 py-2 text-xs font-black uppercase bg-white dark:bg-[#1b1b1d] hover:bg-brand-blue hover:text-white transition-all flex items-center gap-2 rounded"
                                    >
                                      Open Canvas <Play size={12} />
                                    </button>
                                  </div>
                                </div>
                              );
                            }
                            
                            // For non-React code blocks, show normal code view
                            return (
                              <div className="relative my-2">
                                <div className="absolute left-2 top-2 z-10">
                                  <span className="text-[9px] font-bold uppercase bg-brand-blue text-white px-2 py-1 rounded">
                                    {language}
                                  </span>
                                </div>
                                <div className="absolute right-2 top-2 flex gap-1 z-10">
                                  <button
                                    onClick={() => copyCode(code, blockId)}
                                    className="p-1 bg-white dark:bg-[#1b1b1d] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#0f0f11] text-[10px] font-mono flex items-center gap-1 rounded transition-colors"
                                    title="Copy Code"
                                  >
                                    {isCopied ? <Check size={12} /> : <Copy size={12} />}
                                  </button>
                                  <button
                                    onClick={() => downloadCode(code, language)}
                                    className="p-1 bg-white dark:bg-[#1b1b1d] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#0f0f11] text-[10px] font-mono flex items-center gap-1 rounded transition-colors"
                                    title="Download"
                                  >
                                    <Download size={12} />
                                  </button>
                                  {isHtml && (
                                    <button
                                      onClick={() => setCodeBlockStates(prev => ({
                                        ...prev,
                                        [blockId]: {showRendered: !blockState.showRendered}
                                      }))}
                                      className="p-1 bg-white dark:bg-[#1b1b1d] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#0f0f11] text-[10px] font-mono flex items-center gap-1 rounded transition-colors"
                                      title="Toggle View"
                                    >
                                      <Code size={12} />
                                      {blockState.showRendered ? 'CODE' : 'PREVIEW'}
                                    </button>
                                  )}
                                </div>
                                {blockState.showRendered && isHtml ? (
                                  <div className="border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1b1b1d] mt-8 rounded">
                                    <iframe
                                      srcDoc={generatePreviewHtml()}
                                      className="w-full border-0"
                                      style={{ minHeight: '400px', height: 'auto' }}
                                      sandbox="allow-scripts"
                                      title="Preview"
                                      onLoad={(e) => {
                                        const iframe = e.target as HTMLIFrameElement;
                                        if (iframe.contentWindow) {
                                          try {
                                            const height = iframe.contentWindow.document.body.scrollHeight;
                                            iframe.style.height = height + 'px';
                                          } catch (err) {
                                            // Cross-origin or error, keep min height
                                          }
                                        }
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <code className="block bg-slate-100 dark:bg-[#1b1b1d] p-3 pt-10 rounded text-xs font-mono overflow-x-auto border border-slate-200 dark:border-white/10" {...props}>
                                    {children}
                                  </code>
                                )}
                              </div>
                            );
                          },
                          pre: ({node, ...props}) => <pre className="my-2" {...props} />,
                          a: ({node, ...props}) => <a className="text-brand-blue hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />,
                          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-slate-300 dark:border-white/10 pl-4 italic my-3 text-slate-700 dark:text-slate-300" {...props} />,
                          table: ({node, ...props}) => (
                            <div className="overflow-x-auto my-3 -mx-3 px-3">
                              <table className="border-collapse border border-gray-300 w-full text-xs min-w-max" {...props} />
                            </div>
                          ),
                          thead: ({node, ...props}) => <thead className="bg-gray-100" {...props} />,
                          th: ({node, ...props}) => <th className="border border-gray-300 px-2 py-1 font-bold text-left whitespace-nowrap" {...props} />,
                          td: ({node, ...props}) => <td className="border border-gray-300 px-2 py-1 whitespace-nowrap" {...props} />,
                          hr: ({node, ...props}) => <hr className="my-4 border-gray-300" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                          em: ({node, ...props}) => <em className="italic" {...props} />,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>

                    {!msg.isStreaming && msg.outputTokens && (
                      <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-[10px] text-gray-500 italic font-mono">
                          {msg.inputTokens && `Input: ~${msg.inputTokens} tokens • `}
                          Output: ~{msg.outputTokens} tokens
                          <span className="ml-2 text-[9px] text-gray-400">(estimates)</span>
                        </div>
                        {aiModel === 'gemini' && (msg.inputTokens || 0) + (msg.outputTokens || 0) > 5000 && (
                          <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] px-2 py-1 bg-yellow-100 border border-yellow-400 text-yellow-800 hover:bg-yellow-200 transition-colors"
                            title="High token usage - check your quota"
                          >
                            ⚠️ Check Quota
                          </a>
                        )}
                      </div>
                    )}

                    {/* Premium Citation Styles - Inline within text */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-8 pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col gap-3">
                        <p className="text-[9px] font-bold uppercase opacity-40 tracking-widest">Sources Discovered</p>
                        {msg.citations.map((cite, i) => {
                          const citationId = `${msg.id}-${i}`;
                          const isPinned = pinnedCitation === citationId;
                          
                          return (
                            <div 
                              key={i}
                              onClick={() => setPinnedCitation(isPinned ? null : citationId)}
                              className="group/cite relative flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 hover:border-brand-blue/40 transition-all cursor-pointer w-fit"
                            >
                              <svg className="w-3.5 h-3.5 opacity-50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" strokeWidth="2"></path>
                              </svg>
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold">{cite.docName}</span>
                                <span className="text-[9px] opacity-50">Similarity: {cite.similarity.toFixed(3)}</span>
                              </div>
                              
                              {/* Hover Tooltip */}
                              <div className={`absolute bottom-full left-0 mb-2 w-80 md:w-96 p-3 bg-white dark:bg-[#1b1b1d] border border-slate-200 dark:border-white/10 rounded-lg shadow-xl transition-all text-[10px] z-50 ${
                                isPinned ? 'opacity-100 visible' : 'opacity-0 invisible group-hover/cite:opacity-100 group-hover/cite:visible'
                              }`}>
                                <div className="flex justify-between items-start mb-2 pb-2 border-b border-slate-200 dark:border-white/10">
                                  <p className="font-bold text-xs">{cite.docName}</p>
                                  {isPinned && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPinnedCitation(null);
                                      }}
                                      className="text-lg font-bold hover:bg-slate-100 dark:hover:bg-white/10 px-1 leading-none rounded"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                                <div className="bg-brand-blue/10 border-l-2 border-brand-blue pl-2 py-1 mb-2 italic text-[11px] leading-relaxed">
                                  "{cite.text.substring(0, 200)}{cite.text.length > 200 ? '...' : ''}"
                                </div>
                                <div className="text-[9px] opacity-50">
                                  Click to {isPinned ? 'unpin' : 'pin'} this citation
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div ref={endRef} />
      </div>

      {imagePreview && (
        <div 
          className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4"
          onClick={() => setImagePreview(null)}
        >
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="max-w-full max-h-full object-contain border-4 border-white"
            onClick={(e) => e.stopPropagation()}
          />
          <button 
            onClick={() => setImagePreview(null)}
            className="absolute top-4 right-4 text-white text-3xl font-bold hover:bg-white/20 w-10 h-10 flex items-center justify-center"
          >
            ×
          </button>
        </div>
      )}

      {/* Gradient Fade Effect at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-[#0a0a0b] via-white/90 dark:via-[#0a0a0b]/90 to-transparent pointer-events-none z-10" />
      
      <div 
        ref={dropZoneRef}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-6 md:p-10 shrink-0 bg-white dark:bg-[#0a0a0b] relative z-20 ${isDragging ? 'bg-gray-100' : ''}`}
      >
        {isDragging && (
          <div className="absolute inset-0 bg-slate-100/50 dark:bg-white/5 border-4 border-dashed border-brand-blue flex items-center justify-center z-10 pointer-events-none rounded-2xl">
            <div className="text-center font-mono font-bold">
              <ImageIcon size={32} className="mx-auto mb-2" />
              DROP IMAGE HERE
            </div>
          </div>
        )}
        
        {selectedImages.length > 0 && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-full max-w-3xl mb-1 px-6">
            <div className="border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1b1b1d] rounded-lg shadow-lg">
              <div className="flex justify-between items-center p-2 border-b border-slate-200 dark:border-white/10">
                <span className="text-[10px] font-mono font-bold">{selectedImages.length} IMAGE{selectedImages.length > 1 ? 'S' : ''} ATTACHED</span>
                <div className="flex gap-2">
                  {selectedImages.length > 2 && (
                    <button
                      onClick={() => setIsImagesExpanded(!isImagesExpanded)}
                      className="text-[10px] font-mono hover:bg-gray-200 px-2 py-1"
                      type="button"
                    >
                      {isImagesExpanded ? '▼ COLLAPSE' : '▲ EXPAND'}
                    </button>
                  )}
                  <button
                    onClick={clearAllImages}
                    className="text-[10px] font-sans hover:bg-slate-100 dark:hover:bg-surface-700 px-2 py-1 rounded transition-colors"
                    type="button"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="p-3 space-y-2 max-h-[280px] overflow-y-auto">
                {(isImagesExpanded ? selectedImages : selectedImages.slice(0, 2)).map((img, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-white dark:bg-surface-800 border border-slate-200 dark:border-white/10 p-3 rounded-lg">
                    <img src={img.preview} alt={img.name} className="h-12 w-12 object-cover border border-slate-200 dark:border-white/10 rounded" />
                    <div className="flex-1 text-[10px] font-sans">
                      <div className="font-semibold truncate">{img.name}</div>
                      <div className="text-slate-500 dark:text-slate-400">{img.tokens} tokens • {(img.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                    <button
                      onClick={() => removeImage(idx)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-surface-700 border border-slate-200 dark:border-white/10 rounded transition-colors"
                      type="button"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <div className="w-full max-w-3xl relative">
          <form onSubmit={handleSubmit} className="relative">
            {/* Premium Input Field from mockup */}
            <div className="relative flex items-center bg-slate-50 dark:bg-[#1b1b1d] border border-slate-200 dark:border-white/10 rounded-2xl p-2 pl-5 shadow-2xl focus-within:border-brand-blue/50 transition-all group glass">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                placeholder={selectedImages.length > 0 ? "Add description (optional)..." : "Inquire about building codes or design specs..."}
                className="flex-1 bg-transparent border-none outline-none py-3 text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none overflow-y-auto"
                style={{ height: '48px' }}
                disabled={isStreaming}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isStreaming}
                  className="text-slate-400 dark:text-slate-500 hover:text-brand-blue dark:hover:text-brand-blue transition-colors disabled:opacity-50"
                  title="Upload Image"
                >
                  <ImageIcon size={18} />
                </button>
                {/* Premium Send Button from mockup */}
                <button 
                  type="submit"
                  disabled={(!input.trim() && selectedImages.length === 0) || isStreaming}
                  className="p-3 bg-brand-blue text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isStreaming ? (
                    <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      </div>

      {/* Canvas Side Panel - Mockup Inspired */}
      {canvasOpen && canvasContent && (
        <div className="w-1/2 border-l border-slate-200 dark:border-white/5 bg-white dark:bg-[#0f0f11] flex flex-col">
          <style>{`
            /* Syntax Highlighting Styles */
            .syntax-editor {
              tab-size: 2;
              -moz-tab-size: 2;
            }
            .syntax-keyword { color: #2563eb; font-weight: 600; }
            .syntax-string { color: #059669; }
            .syntax-comment { color: #64748b; font-style: italic; }
            .syntax-function { color: #7c3aed; }
            .syntax-number { color: #dc2626; }
            .syntax-operator { color: #64748b; }
            .syntax-tag { color: #2563eb; }
            .syntax-attribute { color: #7c3aed; }
            
            /* Dark mode syntax */
            .dark .syntax-keyword { color: #60a5fa; }
            .syntax-string { color: #34d399; }
            .dark .syntax-comment { color: #94a3b8; }
            .dark .syntax-function { color: #a78bfa; }
            .dark .syntax-number { color: #f87171; }
            .dark .syntax-operator { color: #94a3b8; }
            .dark .syntax-tag { color: #60a5fa; }
            .dark .syntax-attribute { color: #a78bfa; }
          `}</style>
          
          {/* Canvas Header - Mockup Style */}
          <div className="h-10 border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-4 shrink-0 bg-white dark:bg-[#0f0f11]">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Visual Canvas</span>
              <span className="text-[9px] font-bold uppercase bg-brand-blue text-white px-2 py-0.5 rounded">
                {canvasContent.language}
              </span>
              {codeVersionHistory[canvasContent.blockId] && (
                <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">
                  v{codeVersionHistory[canvasContent.blockId].currentIndex + 1}/{codeVersionHistory[canvasContent.blockId].versions.length}
                </span>
              )}
            </div>
            <div className="flex gap-1">
              <button
                onClick={handleVersionUndo}
                disabled={!codeVersionHistory[canvasContent.blockId] || codeVersionHistory[canvasContent.blockId].currentIndex <= 0}
                className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Undo"
              >
                <Undo size={12} />
              </button>
              <button
                onClick={handleVersionRedo}
                disabled={!codeVersionHistory[canvasContent.blockId] || codeVersionHistory[canvasContent.blockId].currentIndex >= codeVersionHistory[canvasContent.blockId].versions.length - 1}
                className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Redo"
              >
                <Redo size={12} />
              </button>
              <div className="w-px h-3 bg-slate-300 dark:bg-white/10 mx-1 self-center"></div>
              <button
                onClick={() => setCanvasShowCode(!canvasShowCode)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors"
                title={canvasShowCode ? 'Show Preview' : 'Show Code'}
              >
                <Code size={12} />
              </button>
              <button
                onClick={() => downloadCode(canvasEditedCode, canvasContent.language)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors"
                title="Download"
              >
                <Download size={12} />
              </button>
              <button
                onClick={() => setCanvasOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors"
                title="Close Canvas"
              >
                <X size={12} />
              </button>
            </div>
          </div>
          
          {/* Canvas Content Area - Mockup Style */}
          <div className="flex-1 bg-slate-100 dark:bg-[#0a0a0b] m-2 rounded-xl border border-slate-200 dark:border-white/5 relative overflow-hidden flex flex-col">
            {canvasShowCode ? (
              <div className="flex-1 flex flex-col relative">
                {/* Monaco Code Editor */}
                <CodeEditor
                  value={canvasEditedCode}
                  onChange={setCanvasEditedCode}
                  language={canvasContent?.language || 'typescript'}
                  height="100%"
                  theme="dark"
                />
                {/* Floating Update Button */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-[#1b1b1d]/90 glass border border-slate-200 dark:border-white/10 px-4 py-2 rounded-full flex gap-3 shadow-xl">
                  <button
                    onClick={() => {
                      const newCode = canvasEditedCode;
                      let newHtml = newCode;
                      
                      const isTsx = canvasContent?.language === 'tsx' || canvasContent?.language === 'jsx' || 
                                    canvasContent?.language === 'typescript' || canvasContent?.language === 'javascript' || canvasContent?.language === 'ts';
                      const isReactComponent = isTsx && (newCode.includes('export default') || newCode.includes('function'));
                      
                      if (isReactComponent) {
                        newHtml = generateReactPreviewHtml(newCode, canvasContent?.language || 'tsx');
                      } else if (canvasContent?.language !== 'html' && canvasContent?.language !== 'htm') {
                        newHtml = newCode;
                      }
                      
                      const history = codeVersionHistory[canvasContent?.blockId || ''] || {versions: [canvasContent?.code || ''], currentIndex: 0};
                      const newVersions = [...history.versions.slice(0, history.currentIndex + 1), newCode];
                      setCodeVersionHistory(prev => ({
                        ...prev,
                        [canvasContent?.blockId || '']: {versions: newVersions, currentIndex: newVersions.length - 1}
                      }));
                      
                      setEditedCodeBlocks(prev => ({...prev, [canvasContent?.blockId || '']: newCode}));
                      setCanvasContent({html: newHtml, code: newCode, language: canvasContent?.language || 'tsx', blockId: canvasContent?.blockId || ''});
                      setIframeKey(prev => prev + 1);
                      setCanvasShowCode(false);
                    }}
                    className="text-[9px] font-bold uppercase hover:text-brand-blue transition-colors cursor-pointer"
                  >
                    Update Preview
                  </button>
                  <div className="w-px h-3 bg-slate-300 dark:bg-white/10"></div>
                  <button
                    onClick={() => setCanvasShowCode(false)}
                    className="text-[9px] font-bold uppercase hover:text-brand-blue transition-colors cursor-pointer"
                  >
                    View Result
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 relative">
                <iframe
                  key={iframeKey}
                  srcDoc={canvasContent.html}
                  className="w-full h-full border-0 bg-white"
                  sandbox="allow-scripts"
                  title="Canvas Preview"
                />
                {/* Floating Controls - Mockup Style */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-[#1b1b1d]/90 glass border border-slate-200 dark:border-white/10 px-4 py-2 rounded-full flex gap-4 shadow-xl">
                  <button
                    onClick={() => setCanvasShowCode(true)}
                    className="text-[9px] font-bold uppercase hover:text-brand-blue transition-colors"
                  >
                    Edit Code
                  </button>
                  <div className="w-px h-3 bg-slate-300 dark:bg-white/10"></div>
                  <button
                    onClick={() => setIframeKey(prev => prev + 1)}
                    className="text-[9px] font-bold uppercase hover:text-brand-blue transition-colors"
                  >
                    Refresh
                  </button>
                  <div className="w-px h-3 bg-slate-300 dark:bg-white/10"></div>
                  <button
                    onClick={() => downloadCode(canvasEditedCode, canvasContent.language)}
                    className="text-[9px] font-bold uppercase hover:text-brand-blue transition-colors"
                  >
                    Export
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
