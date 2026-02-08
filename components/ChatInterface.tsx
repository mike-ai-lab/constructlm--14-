import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send } from 'lucide-react';
import { ChatMessage, Citation } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  isStreaming: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isStreaming 
}) => {
  const [input, setInput] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    onSendMessage(input);
    setInput('');
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      {/* Messages Area */}
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
                          p: ({node, ...props}) => <p className="mb-3 last:mb-0 font-mono text-[13px] text-gray-800" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 space-y-1 font-mono" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 space-y-1 font-mono" {...props} />,
                          li: ({node, ...props}) => <li className="ml-2 font-mono" {...props} />,
                          code: ({node, inline, ...props}: any) => 
                            inline ? (
                              <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />
                            ) : (
                              <code className="block bg-gray-100 p-3 rounded my-2 text-xs font-mono overflow-x-auto border border-gray-300" {...props} />
                            ),
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

                    {/* Citations Section */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8 pt-6 border-t-2 border-black">
                        {msg.citations.map((cite, i) => (
                          <div key={i} className="group relative">
                            <div className="bg-white border-2 border-gray-100 p-2.5 flex items-center gap-3 cursor-pointer hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                              <div className="w-1.5 h-1.5 bg-black" />
                              <span className="text-[9px] font-bold uppercase text-gray-500 truncate">
                                SRC {i + 1}: {cite.docName}
                              </span>
                            </div>
                            {/* Tooltip for Citation Content */}
                            <div className="absolute bottom-full left-0 mb-2 w-80 md:w-96 bg-white border-2 border-black p-3 text-xs opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-h-96 overflow-y-auto">
                              <div className="font-bold mb-2 border-b border-gray-200 pb-1">{cite.docName}</div>
                              <div className="text-gray-700 prose prose-sm max-w-none">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
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
                        ))}
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

      {/* Input Area */}
      <div className="h-[90px] border-t-2 border-black bg-white shrink-0 flex items-center justify-center px-6">
        <div className="w-full max-w-3xl relative">
          <form onSubmit={handleSubmit} className="relative">
            <div className={`relative transition-all duration-100 ${isInputFocused ? 'translate-x-[-2px] translate-y-[-2px]' : ''}`}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                placeholder="ASK A QUESTION..."
                className={`w-full border-2 border-black p-3 text-[11px] font-bold focus:outline-none uppercase placeholder:text-gray-300 bg-white transition-all duration-100 ${
                  isInputFocused ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : ''
                }`}
                disabled={isStreaming}
              />
              <button 
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                {isStreaming ? (
                  <div className="w-4 h-4 border-2 border-t-transparent border-black rounded-full animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
