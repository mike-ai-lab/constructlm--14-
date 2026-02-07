import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, Citation } from '../types';
import { Button } from './ui/Button';

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
    <div className="flex flex-col h-full bg-white relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 select-none">
            <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="font-mono text-xs">AWAITING INPUT QUERY...</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[80%] md:max-w-[70%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className="mb-1 font-mono text-[10px] text-gray-400 uppercase">
                {msg.role === 'user' ? 'YOU' : 'CONSTRUCT_LM'}
              </div>
              
              <div className={`p-3 border ${msg.role === 'user' ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-300'} overflow-hidden`}>
                <div className={`leading-relaxed text-sm font-mono ${msg.role === 'user' ? 'whitespace-pre-wrap' : 'overflow-x-auto'}`}>
                  {msg.role === 'user' ? (
                    msg.content
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Headings
                        h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-4 mb-2 font-mono" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-3 mb-2 font-mono" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-base font-bold mt-2 mb-1 font-mono" {...props} />,
                        
                        // Paragraphs
                        p: ({node, ...props}) => <p className="mb-3 last:mb-0 font-mono" {...props} />,
                        
                        // Lists
                        ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 space-y-1 font-mono" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 space-y-1 font-mono" {...props} />,
                        li: ({node, ...props}) => <li className="ml-2 font-mono" {...props} />,
                        
                        // Code
                        code: ({node, inline, ...props}: any) => 
                          inline ? (
                            <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />
                          ) : (
                            <code className="block bg-gray-100 p-3 rounded my-2 text-xs font-mono overflow-x-auto border border-gray-300" {...props} />
                          ),
                        pre: ({node, ...props}) => <pre className="my-2" {...props} />,
                        
                        // Links
                        a: ({node, ...props}) => <a className="text-blue-600 hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />,
                        
                        // Blockquotes
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-3 text-gray-700" {...props} />,
                        
                        // Tables
                        table: ({node, ...props}) => (
                          <div className="overflow-x-auto my-3 -mx-3 px-3">
                            <table className="border-collapse border border-gray-300 w-full text-xs min-w-max" {...props} />
                          </div>
                        ),
                        thead: ({node, ...props}) => <thead className="bg-gray-100" {...props} />,
                        th: ({node, ...props}) => <th className="border border-gray-300 px-2 py-1 font-bold text-left whitespace-nowrap" {...props} />,
                        td: ({node, ...props}) => <td className="border border-gray-300 px-2 py-1 whitespace-nowrap" {...props} />,
                        
                        // Horizontal rule
                        hr: ({node, ...props}) => <hr className="my-4 border-gray-300" {...props} />,
                        
                        // Strong/Bold
                        strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                        
                        // Emphasis/Italic
                        em: ({node, ...props}) => <em className="italic" {...props} />,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>

              {/* Citations Section */}
              {msg.role === 'model' && msg.citations && msg.citations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 justify-start">
                   {msg.citations.map((cite, i) => (
                     <div key={i} className="group relative">
                       <span className="cursor-help inline-block px-2 py-0.5 bg-gray-100 border border-gray-300 text-[10px] font-mono hover:bg-black hover:text-white transition-colors">
                         SRC {i + 1}: {cite.docName}
                       </span>
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
        ))}
        <div ref={endRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t-2 border-black">
        <form onSubmit={handleSubmit} className="flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question based on your sources..."
            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 focus:border-black outline-none font-mono text-sm transition-all"
            disabled={isStreaming}
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || isStreaming}
            className="h-auto w-10 flex items-center justify-center"
          >
            {isStreaming ? (
               <div className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"/>
              </svg>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};
