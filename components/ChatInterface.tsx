import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, X, Code2, ChevronDown } from 'lucide-react';
import { ChatMessage } from '../types';
import * as GeminiService from '../services/geminiService';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string, imageBase64?: string) => void;
  isStreaming: boolean;
  aiModel: 'gemini' | 'cerebras' | 'groq' | 'openrouter' | 'ollama';
  onOpenCanvas?: (code: string, filename: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isStreaming,
  aiModel,
  onOpenCanvas
}) => {
  const [input, setInput] = useState('');
  const [selectedImages, setSelectedImages] = useState<Array<{base64: string, preview: string, name: string}>>([]);
  const [expandedReasoning, setExpandedReasoning] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '48px';
      if (input) {
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
      }
    }
  }, [input]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && selectedImages.length === 0) || isStreaming) return;
    const imagesBase64 = selectedImages.map(img => img.base64).join(',');
    onSendMessage(input || 'Analyze these images', imagesBase64 || undefined);
    setInput('');
    setSelectedImages([]);
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const base64Data = base64.split(',')[1];
      setSelectedImages(prev => [...prev, {
        base64: base64Data,
        preview: base64,
        name: file.name
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

  // Extract code blocks from message content (updated for markdown format)
  const extractCodeBlocks = (content: string) => {
    // Skip extraction if content contains PATCH format (semantic patches)
    if (content.includes('PATCH @@ line')) {
      return [];
    }
    
    // Match ``` blocks with language identifier
    const codeBlockRegex = /```(?:jsx|tsx|jsx?|js|typescript)?\s*\n([\s\S]*?)```/g;
    const blocks: Array<{type: string, code: string}> = [];
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const code = match[1].trim();
      if (code.length > 0) {
        blocks.push({
          type: 'code',
          code: code
        });
      }
    }
    
    return blocks;
  };

  // Get message content without code blocks (for display as markdown)
  const getMessageContentWithoutCode = (content: string) => {
    // Remove code blocks but keep the rest as markdown
    return content
      .replace(/```(?:jsx|tsx|jsx?|js|typescript)?\s*\n[\s\S]*?```\n?/g, '')
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .trim();
  };

  // Extract thinking blocks from message content
  const extractThinkingBlock = (content: string) => {
    const thinkRegex = /<think>([\s\S]*?)<\/think>/;
    const match = content.match(thinkRegex);
    return match ? match[1].trim() : null;
  };

  // Fix common AI code generation errors
  const fixCodeErrors = (code: string): string => {
    console.log('[fixCodeErrors] Input code length:', code.length);
    let fixed = code;
    
    // Fix malformed key props: key-X or key=X without braces
    fixed = fixed.replace(/\skey[=\-][^=\s{][^\s>]*/g, (match) => {
      console.log('[fixCodeErrors] Fixed key prop:', match);
      return ' key={project.id}';
    });
    
    // Fix broken closing tags like </services"
    fixed = fixed.replace(/<\/\w+[^>]*"/g, (match) => {
      const tagName = match.match(/<\/(\w+)/)?.[1];
      console.log('[fixCodeErrors] Fixed closing tag:', match, '→', `</${tagName}>`);
      return tagName ? `</${tagName}>` : match;
    });
    
    // Fix duplicate section tags - remove malformed ones
    fixed = fixed.replace(/<section[^>]*\s+<section/g, (match) => {
      console.log('[fixCodeErrors] Fixed duplicate section tags');
      return '<section';
    });
    
    // Fix orphaned closing section tags before opening tags
    fixed = fixed.replace(/<\/section>\s*(?=\s*<section)/g, (match) => {
      console.log('[fixCodeErrors] Removed orphaned section closing tag');
      return '';
    });
    
    // Fix broken section declarations mixed with services text
    fixed = fixed.replace(/\/section>\s*services"\s*className/g, (match) => {
      console.log('[fixCodeErrors] Fixed broken services section');
      return '/section>\n\n      {/* Services Section */}\n      <section id="services" className';
    });
    
    // Ensure proper spacing and formatting for section tags
    fixed = fixed.replace(/<\/section>\s*{\/\*\s*Services/g, (match) => {
      console.log('[fixCodeErrors] Fixed spacing around Services section');
      return '</section>\n\n      {/* Services';
    });
    
    // Remove any stray text between section tags
    fixed = fixed.replace(/<\/section>\s+[a-zA-Z]+"\s*className/g, (match) => {
      console.log('[fixCodeErrors] Removed stray text between sections');
      return '</section>\n\n      <section';
    });
    
    // Fix missing div closing tags (common issue)
    const divCount = (fixed.match(/<div/g) || []).length;
    const divCloseCount = (fixed.match(/<\/div>/g) || []).length;
    if (divCount > divCloseCount) {
      console.log('[fixCodeErrors] Found mismatched divs. Opening:', divCount, 'Closing:', divCloseCount);
      // Add missing closing divs before closing the main container
      const closingDivs = Array(divCount - divCloseCount).fill('      </div>').join('\n');
      fixed = fixed.replace(/(\n    <\/div>\n  \);?\n\})/g, `\n    </div>\n${closingDivs}\n  );\n}`);
    }
    
    console.log('[fixCodeErrors] Output code length:', fixed.length);
    return fixed;
  };

  return (
    <div className="flex h-full bg-black flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 md:px-12 py-8 flex flex-col items-center">
        <div className="w-full max-w-2xl space-y-8">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50 select-none py-20">
              <p className="font-mono text-xs tracking-widest">AWAITING INPUT QUERY...</p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className="w-full">
              {msg.role === 'user' ? (
                // User Message
                <div className="flex justify-end mb-6">
                  <div className="max-w-[75%] bg-blue-600 text-white p-4 rounded-lg">
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    {msg.metadata?.imageBase64 && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {msg.metadata.imageBase64.split(',').map((img, idx) => (
                          <img 
                            key={idx}
                            src={`data:image/jpeg;base64,${img.trim()}`}
                            alt={`Uploaded ${idx + 1}`}
                            className="max-w-[120px] max-h-[120px] rounded border border-white/20"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // AI Message
                <div className="flex gap-4 mb-8">
                  {/* Avatar Badge */}
                  <div className="w-8 h-8 rounded bg-blue-600 flex-shrink-0 flex items-center justify-center font-bold text-[10px] text-white">
                    AI
                  </div>

                  <div className="flex-1 space-y-4">
                    {/* Main Message Content - Rendered as Markdown Text */}
                    {getMessageContentWithoutCode(msg.content) && (
                      <div className="text-gray-300 leading-relaxed text-sm space-y-3">
                        {getMessageContentWithoutCode(msg.content).split('\n').map((line, idx) => {
                          // Handle markdown headers
                          if (line.startsWith('### ')) {
                            return (
                              <h3 key={idx} className="text-base font-bold text-blue-400 mt-4 mb-2">
                                {line.replace('### ', '').trim()}
                              </h3>
                            );
                          }
                          if (line.startsWith('## ')) {
                            return (
                              <h3 key={idx} className="text-lg font-bold text-blue-400 mt-4 mb-2">
                                {line.replace('## ', '').trim()}
                              </h3>
                            );
                          }
                          if (line.startsWith('# ')) {
                            return (
                              <h2 key={idx} className="text-2xl font-bold text-white mt-6 mb-3">
                                {line.replace('# ', '').trim()}
                              </h2>
                            );
                          }
                          // Handle lists
                          if (line.startsWith('- ') || line.startsWith('* ')) {
                            return (
                              <li key={idx} className="ml-6 text-gray-300">
                                {line.replace(/^[-*]\s/, '').trim()}
                              </li>
                            );
                          }
                          // Handle bold and italic text
                          const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/);
                          if (line.trim()) {
                            return (
                              <p key={idx} className="text-gray-300">
                                {parts.map((part, i) => {
                                  if (part.startsWith('**') && part.endsWith('**')) {
                                    return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
                                  }
                                  if (part.startsWith('*') && part.endsWith('*')) {
                                    return <em key={i} className="italic">{part.slice(1, -1)}</em>;
                                  }
                                  return part;
                                })}
                              </p>
                            );
                          }
                          return null;
                        }).filter(Boolean)}
                      </div>
                    )}

                    {/* Reasoning/Thinking Block */}
                    {(msg.reasoning || extractThinkingBlock(msg.content)) && (
                      <details 
                        className="group cursor-pointer"
                        open={expandedReasoning === msg.id}
                        onToggle={() => setExpandedReasoning(expandedReasoning === msg.id ? null : msg.id)}
                      >
                        <summary className="flex items-center gap-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-400 transition-colors py-2 px-3 bg-white/5 rounded border border-white/10 list-none cursor-pointer select-none">
                          <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
                          Thinking Process
                        </summary>
                        <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded text-[12px] text-gray-400 leading-relaxed whitespace-pre-wrap">
                          {msg.reasoning || extractThinkingBlock(msg.content)}
                        </div>
                      </details>
                    )}

                    {/* Code Artifact Cards */}
                    {extractCodeBlocks(msg.content).map((block, idx) => {
                      return (
                      <div 
                        key={idx}
                        onClick={() => {
                          console.log('[CodeCard] Clicked! Code length:', block.code.length);
                          console.log('[CodeCard] Code preview:', block.code.substring(0, 100));
                          console.log('[CodeCard] onOpenCanvas available:', !!onOpenCanvas);
                          if (onOpenCanvas) {
                            console.log('[CodeCard] Calling onOpenCanvas with code');
                            onOpenCanvas(block.code, `component-${idx}.jsx`);
                          } else {
                            console.warn('[CodeCard] onOpenCanvas is not defined!');
                          }
                        }}
                        className="artifact-card p-3 rounded-lg border border-white/8 bg-white/3 hover:bg-white/5 hover:border-blue-500/30 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/5 rounded flex items-center justify-center border border-white/5 group-hover:bg-blue-500/10">
                              <Code2 size={14} className="text-blue-400" />
                            </div>
                            <div>
                              <div className="text-[11px] font-semibold text-white">component.jsx</div>
                              <div className="text-[9px] text-gray-500 uppercase tracking-tight">React Component</div>
                            </div>
                          </div>
                          <div className="text-[9px] text-blue-500 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                            Render in Canvas
                          </div>
                        </div>
                      </div>
                      );
                    })}

                    {/* Citations */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Sources Referenced</div>
                        <div className="space-y-2">
                          {msg.citations.map((cite, idx) => (
                            <div key={idx} className="text-[11px] text-gray-400 flex items-start gap-2">
                              <span className="text-blue-500 font-bold flex-shrink-0">{idx + 1}.</span>
                              <div>
                                <span className="font-semibold text-gray-300">{cite.docName}</span>
                                <span className="text-gray-600"> (similarity: {cite.similarity.toFixed(3)})</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Token Usage */}
                    {(msg.inputTokens || msg.outputTokens) && (
                      <div className="text-[9px] text-gray-600 flex gap-4 pt-2">
                        {msg.inputTokens && <span>Input: {msg.inputTokens} tokens</span>}
                        {msg.outputTokens && <span>Output: {msg.outputTokens} tokens</span>}
                      </div>
                    )}

                    {/* Streaming Indicator */}
                    {msg.isStreaming && (
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <div className="flex gap-1">
                          <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                          <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                          <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                        </div>
                        <span>Generating response...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          <div ref={endRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-b border-white/5 bg-black px-3 md:px-12 py-1 flex justify-center">
        <div className="w-full max-w-2xl">
          {/* Image Previews */}
          {selectedImages.length > 0 && (
            <div className="mb-4 flex gap-3 flex-wrap">
              {selectedImages.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img 
                    src={img.preview}
                    alt={img.name}
                    className="w-20 h-20 rounded border border-white/10 object-cover"
                  />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 hover:border-white/20 transition-colors focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20">
              {/* Image Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isStreaming}
                className="flex-shrink-0 p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                title="Upload image"
              >
                <ImageIcon size={18} />
              </button>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Inquire about building codes or design specs..."
                className="flex-1 bg-transparent text-base text-white placeholder:text-gray-600 placeholder:truncate placeholder:overflow-hidden focus:outline-none resize-none max-h-24"
                rows={1}
                disabled={isStreaming}
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={isStreaming || (!input.trim() && selectedImages.length === 0)}
                className="flex-shrink-0 w-10 h-10 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 rounded-lg flex items-center justify-center transition-colors disabled:cursor-not-allowed"
                title="Send message"
              >
                <Send size={18} />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </form>
        </div>
      </div>
    </div>
  );
};
