import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Image as ImageIcon, X, FileText, Play, Code, Download, Copy, Check, Maximize2, Undo, Redo } from 'lucide-react';
import { ChatMessage, Citation } from '../types';
import * as GeminiService from '../services/geminiService';
import { generateBundledPreview } from '../services/runtimeBundler';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string, imageBase64?: string) => void;
  isStreaming: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isStreaming
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

  return (
    <div className="flex h-full bg-white relative overflow-hidden">
      {/* Main Chat Area */}
      <div className={`flex flex-col bg-white relative overflow-hidden transition-all duration-300 ${canvasOpen ? 'w-1/2' : 'w-full'}`}>
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-12 flex flex-col items-center" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="w-full max-w-3xl space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 select-none py-20">
              <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <p className="font-mono text-xs">AWAITING INPUT QUERY...</p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className="w-full">
              {msg.role === 'user' ? (
                <div className="flex flex-col items-end">
                  <div className="mb-1 font-mono text-[10px] text-gray-400 uppercase">YOU</div>
                  <div className="max-w-[80%] md:max-w-[70%] p-3.5 border-2 bg-black text-white border-black">
                    <div className="leading-relaxed text-sm font-mono whitespace-pre-wrap">
                      {msg.content}
                    </div>
                    {msg.metadata?.imageBase64 && (
                      <div className="mt-2 pt-2 border-t border-gray-600">
                        <div className="grid grid-cols-3 gap-2">
                          {msg.metadata.imageBase64.split(',').map((img, idx) => (
                            <img 
                              key={idx}
                              src={`data:image/jpeg;base64,${img}`}
                              alt={`Attached ${idx + 1}`}
                              className="w-full h-24 object-cover border border-gray-500 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setImagePreview(`data:image/jpeg;base64,${img}`)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {msg.metadata?.activeSources && msg.metadata.activeSources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-600 text-[10px] text-gray-300 flex items-center gap-2">
                        <FileText size={12} />
                        <span>Sources ({msg.metadata.activeSources.length}): {msg.metadata.activeSources.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-start w-full">
                  <div className="mb-1 font-mono text-[10px] text-gray-400 uppercase">CONSTRUCT_LM</div>
                  <div className="w-full bg-white border-2 border-black p-6 md:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <div className="leading-relaxed text-sm font-mono overflow-x-auto">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-4 mb-2 font-mono" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-3 mb-2 font-mono" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-base font-bold mt-2 mb-1 font-mono" {...props} />,
                          p: ({node, ...props}) => <div className="mb-3 last:mb-0 font-mono text-[13px] text-gray-800" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 space-y-1 font-mono" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 space-y-1 font-mono" {...props} />,
                          li: ({node, ...props}) => <li className="ml-2 font-mono" {...props} />,
                          code: ({node, inline, className, children, ...props}: any) => {
                            if (inline) {
                              return <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>;
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
                            
                            const generatePreviewHtml = () => {
                              if (isHtml) return code;
                              if (isReactComponent) return generateReactPreviewHtml(code, language);
                              return code;
                            };
                            
                            return (
                              <div className="relative my-2">
                                <div className="absolute left-2 top-2 z-10">
                                  <span className="text-[9px] font-bold uppercase bg-black text-white px-2 py-1">
                                    {language}
                                  </span>
                                </div>
                                <div className="absolute right-2 top-2 flex gap-1 z-10">
                                  <button
                                    onClick={() => copyCode(code, blockId)}
                                    className="p-1 bg-white border border-black hover:bg-gray-100 text-[10px] font-mono flex items-center gap-1"
                                    title="Copy Code"
                                  >
                                    {isCopied ? <Check size={12} /> : <Copy size={12} />}
                                  </button>
                                  <button
                                    onClick={() => downloadCode(code, language)}
                                    className="p-1 bg-white border border-black hover:bg-gray-100 text-[10px] font-mono flex items-center gap-1"
                                    title="Download"
                                  >
                                    <Download size={12} />
                                  </button>
                                  {isPreviewable && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setCanvasContent({html: generatePreviewHtml(), code, language, blockId});
                                          setCanvasEditedCode(code);
                                          setCanvasOpen(true);
                                          setCanvasShowCode(false);
                                          
                                          // Initialize version history if not exists
                                          if (!codeVersionHistory[blockId]) {
                                            setCodeVersionHistory(prev => ({
                                              ...prev,
                                              [blockId]: {versions: [code], currentIndex: 0}
                                            }));
                                          }
                                        }}
                                        className="p-1 bg-white border border-black hover:bg-gray-100 text-[10px] font-mono flex items-center gap-1"
                                        title="Open in Canvas"
                                      >
                                        <Maximize2 size={12} />
                                      </button>
                                      <button
                                        onClick={() => setCodeBlockStates(prev => ({
                                          ...prev,
                                          [blockId]: {showRendered: !blockState.showRendered}
                                        }))}
                                        className="p-1 bg-white border border-black hover:bg-gray-100 text-[10px] font-mono flex items-center gap-1"
                                        title="Toggle View"
                                      >
                                        <Code size={12} />
                                        {blockState.showRendered ? 'CODE' : 'PREVIEW'}
                                      </button>
                                    </>
                                  )}
                                </div>
                                {blockState.showRendered ? (
                                  <div className="border border-gray-300 bg-white mt-8">
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
                                  <code className="block bg-gray-100 p-3 pt-10 rounded text-xs font-mono overflow-x-auto border border-gray-300" {...props}>
                                    {children}
                                  </code>
                                )}
                              </div>
                            );
                          },
                          pre: ({node, ...props}) => <pre className="my-2" {...props} />,
                          a: ({node, ...props}) => <a className="text-blue-600 hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />,
                          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-3 text-gray-700" {...props} />,
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
                      <div className="mt-4 pt-3 border-t border-gray-200 text-[10px] text-gray-500 italic font-mono">
                        {msg.inputTokens && `Input: ${msg.inputTokens} tokens • `}
                        Output: {msg.outputTokens} tokens
                      </div>
                    )}

                    {msg.citations && msg.citations.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8 pt-6 border-t-2 border-black">
                        {msg.citations.map((cite, i) => {
                          const sentences = cite.text.split(/[.!?]+\s+/).filter(s => s.trim().length > 20);
                          const preview = sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '.' : '');
                          const displayPreview = preview.length > 200 ? preview.substring(0, 200) + '...' : preview;
                          const citationId = `${msg.id}-${i}`;
                          const isPinned = pinnedCitation === citationId;
                          
                          return (
                            <div key={i} className="group relative">
                              <div 
                                onClick={() => setPinnedCitation(isPinned ? null : citationId)}
                                className="bg-white border-2 border-gray-100 p-2.5 flex items-center gap-3 cursor-pointer hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                                <div className="w-1.5 h-1.5 bg-black" />
                                <span className="text-[9px] font-bold uppercase text-gray-500 truncate">
                                  SRC {i + 1}: {cite.docName}
                                </span>
                              </div>
                              <div className={`fixed left-1/2 -translate-x-1/2 top-20 w-80 md:w-96 bg-white border-2 border-black p-3 text-xs transition-all z-[100] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-h-96 overflow-y-auto ${
                                isPinned ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
                              }`}>
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
                                <div className="bg-yellow-100 border-l-4 border-yellow-400 pl-2 py-1 mb-3 text-gray-800 font-medium text-[11px] leading-relaxed">
                                  {displayPreview}
                                </div>
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
                                <div className="mt-2 text-right text-[10px] text-gray-400 border-t border-gray-200 pt-1">
                                  Similarity: {cite.similarity.toFixed(3)}
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

      <div 
        ref={dropZoneRef}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-t-2 border-black bg-white shrink-0 flex flex-col items-center px-6 py-3 relative ${isDragging ? 'bg-gray-100' : ''}`}
      >
        {isDragging && (
          <div className="absolute inset-0 bg-black/10 border-4 border-dashed border-black flex items-center justify-center z-10 pointer-events-none">
            <div className="text-center font-mono font-bold">
              <ImageIcon size={32} className="mx-auto mb-2" />
              DROP IMAGE HERE
            </div>
          </div>
        )}
        {(input || selectedImages.length > 0) && (
          <div className="w-full max-w-3xl mb-2 flex justify-end">
            <div className="text-[10px] font-mono text-gray-500">
              EST. TOKENS: <span className="font-bold text-black">{estimatedTokens}</span>
            </div>
          </div>
        )}
        
        {selectedImages.length > 0 && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-full max-w-3xl mb-1 px-6">
            <div className="border-2 border-black bg-gray-50">
              <div className="flex justify-between items-center p-2 border-b border-gray-300">
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
                    className="text-[10px] font-mono hover:bg-gray-200 px-2 py-1"
                    type="button"
                  >
                    CLEAR ALL
                  </button>
                </div>
              </div>
              <div className="p-2 space-y-2 max-h-[280px] overflow-y-auto">
                {(isImagesExpanded ? selectedImages : selectedImages.slice(0, 2)).map((img, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-white border border-gray-300 p-2">
                    <img src={img.preview} alt={img.name} className="h-12 w-12 object-cover border border-black" />
                    <div className="flex-1 text-[10px] font-mono">
                      <div className="font-bold truncate">{img.name}</div>
                      <div className="text-gray-500">{img.tokens} tokens • {(img.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                    <button
                      onClick={() => removeImage(idx)}
                      className="p-1 hover:bg-gray-200 border border-black"
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
            <div className={`relative transition-all duration-100 ${isInputFocused ? 'translate-x-[-2px] translate-y-[-2px]' : ''}`}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                placeholder={selectedImages.length > 0 ? "ADD DESCRIPTION (OPTIONAL)..." : "ASK A QUESTION..."}
                className={`w-full border-2 border-black p-3 pr-20 text-[11px] font-bold focus:outline-none uppercase placeholder:text-gray-300 bg-white transition-all duration-100 resize-none overflow-y-auto ${
                  isInputFocused ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : ''
                }`}
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
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isStreaming}
                  className="text-black hover:text-gray-600 transition-colors disabled:opacity-50"
                  title="Upload Image"
                >
                  <ImageIcon size={16} />
                </button>
                <button 
                  type="submit"
                  disabled={(!input.trim() && selectedImages.length === 0) || isStreaming}
                  className="text-black hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                  {isStreaming ? (
                    <div className="w-4 h-4 border-2 border-t-transparent border-black rounded-full animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      </div>

      {/* Canvas Side Panel */}
      {canvasOpen && canvasContent && (
        <div className="w-1/2 border-l-2 border-black bg-white flex flex-col">
          {/* Canvas Header */}
          <div className="h-14 border-b-2 border-black flex items-center justify-between px-4 bg-white shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase bg-black text-white px-2 py-1">
                {canvasContent.language}
              </span>
              <span className="text-xs font-mono">CANVAS</span>
              {codeVersionHistory[canvasContent.blockId] && (
                <span className="text-[9px] font-mono text-gray-500">
                  v{codeVersionHistory[canvasContent.blockId].currentIndex + 1}/{codeVersionHistory[canvasContent.blockId].versions.length}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleVersionUndo}
                disabled={!codeVersionHistory[canvasContent.blockId] || codeVersionHistory[canvasContent.blockId].currentIndex <= 0}
                className="p-1 border border-black hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-[10px] font-mono flex items-center gap-1"
                title="Undo (Previous Version)"
              >
                <Undo size={14} />
              </button>
              <button
                onClick={handleVersionRedo}
                disabled={!codeVersionHistory[canvasContent.blockId] || codeVersionHistory[canvasContent.blockId].currentIndex >= codeVersionHistory[canvasContent.blockId].versions.length - 1}
                className="p-1 border border-black hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-[10px] font-mono flex items-center gap-1"
                title="Redo (Next Version)"
              >
                <Redo size={14} />
              </button>
              <button
                onClick={() => {
                  const newCode = canvasEditedCode;
                  let newHtml = newCode;
                  
                  // Generate preview HTML based on language
                  const isTsx = canvasContent.language === 'tsx' || canvasContent.language === 'jsx' || 
                                canvasContent.language === 'typescript' || canvasContent.language === 'javascript' || canvasContent.language === 'ts';
                  const isReactComponent = isTsx && (newCode.includes('export default') || newCode.includes('function'));
                  
                  if (isReactComponent) {
                    newHtml = generateReactPreviewHtml(newCode, canvasContent.language);
                  } else if (canvasContent.language !== 'html' && canvasContent.language !== 'htm') {
                    newHtml = newCode;
                  }
                  
                  // Save to version history
                  const history = codeVersionHistory[canvasContent.blockId] || {versions: [canvasContent.code], currentIndex: 0};
                  const newVersions = [...history.versions.slice(0, history.currentIndex + 1), newCode];
                  setCodeVersionHistory(prev => ({
                    ...prev,
                    [canvasContent.blockId]: {versions: newVersions, currentIndex: newVersions.length - 1}
                  }));
                  
                  // Save edited code to state so chat preview updates
                  setEditedCodeBlocks(prev => ({...prev, [canvasContent.blockId]: newCode}));
                  setCanvasContent({html: newHtml, code: newCode, language: canvasContent.language, blockId: canvasContent.blockId});
                  setIframeKey(prev => prev + 1);
                  setCanvasShowCode(false);
                }}
                className="px-2 py-1 border border-black hover:bg-gray-100 text-[10px] font-mono font-bold"
              >
                UPDATE
              </button>
              <button
                onClick={() => setCanvasShowCode(!canvasShowCode)}
                className="p-1 border border-black hover:bg-gray-100 text-[10px] font-mono flex items-center gap-1"
              >
                <Code size={14} />
                {canvasShowCode ? 'PREVIEW' : 'CODE'}
              </button>
              <button
                onClick={() => setCanvasOpen(false)}
                className="p-1 border border-black hover:bg-gray-100"
                title="Close Canvas"
              >
                <X size={14} />
              </button>
            </div>
          </div>
          
          {/* Canvas Content */}
          <div className="flex-1 overflow-auto">
            {canvasShowCode ? (
              <textarea
                value={canvasEditedCode}
                onChange={(e) => setCanvasEditedCode(e.target.value)}
                className="w-full h-full p-4 text-xs font-mono bg-gray-50 border-0 resize-none focus:outline-none"
                spellCheck={false}
              />
            ) : (
              <iframe
                key={iframeKey}
                srcDoc={canvasContent.html}
                className="w-full h-full border-0"
                sandbox="allow-scripts"
                title="Canvas Preview"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
