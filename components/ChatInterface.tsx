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

  // Extract code blocks from message content
  const extractCodeBlocks = (content: string) => {
    console.log('[extractCodeBlocks] Input content length:', content.length);
    console.log('[extractCodeBlocks] Content preview:', content.substring(0, 200));
    
    const codeBlockRegex = /```(?:jsx?|tsx?|html|css|javascript|typescript)?\n([\s\S]*?)```/g;
    const blocks: Array<{type: string, code: string}> = [];
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const code = match[1].trim();
      console.log('[extractCodeBlocks] Found code block, length:', code.length);
      console.log('[extractCodeBlocks] Code preview:', code.substring(0, 100));
      blocks.push({
        type: 'code',
        code: code
      });
    }
    
    console.log('[extractCodeBlocks] Total blocks found:', blocks.length);
    return blocks;
  };

  // Remove code blocks from message content for display
  const getMessageContentWithoutCode = (content: string) => {
    return content.replace(/```(?:jsx?|tsx?|html|css|javascript|typescript)?\n[\s\S]*?```/g, '').trim();
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
                    {/* Main Message Content */}
                    {getMessageContentWithoutCode(msg.content) && (
                      <div className="text-gray-300 leading-relaxed text-base whitespace-pre-wrap">
                        {getMessageContentWithoutCode(msg.content)}
                      </div>
                    )}

                    {/* Reasoning/Thinking Block */}
                    {msg.reasoning && (
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
                          {msg.reasoning}
                        </div>
                      </details>
                    )}

                    {/* Code Artifact Cards */}
                    {extractCodeBlocks(msg.content).map((block, idx) => (
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
                    ))}

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
      <div className="flex-shrink-0 border-b border-white/5 bg-black px-6 md:px-12 py-1 flex justify-center">
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
