import { useState, useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { debounce } from 'lodash';
import { ProofMintAI } from '../utils/proofmintAI';
import ChatMessage from './chat/ChatMessage';
import ChatHeader from './chat/ChatHeader';
import ChatInput from './chat/ChatInput';

interface Message {
  text: string;
  isUser: boolean;
  category?: 'nft' | 'blockchain' | 'recycling' | 'ownership' | 'general';
}

const Support = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: `👋 Hi! I'm **ProofMint AI**, your blockchain electronics ownership expert!

I can help you with:
🎫 **NFT Receipts** - Digital proof of ownership
⛓️ **Blockchain Technology** - Secure, tamper-proof records
♻️ **Recycling Tracking** - Sustainable e-waste management  
📱 **Ownership Transfers** - Seamless device reselling
🛡️ **Warranty & Security** - Digital protection

**Try asking:** "How do NFT receipts work?" or "How to transfer device ownership?"`,
      isUser: false,
      category: 'general',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (detailsRef.current) {
      detailsRef.current.open = isOpen;
    }
  }, [isOpen]);

  const debouncedSubmit = debounce(async (sanitizedInput: string) => {
    setMessages((prev) => [...prev, { text: sanitizedInput, isUser: true }]);
    setIsLoading(true);
    
    try {
      const aiResponse = await ProofMintAI.getResponse(sanitizedInput);
      setMessages((prev) => [...prev, { 
        text: aiResponse.text, 
        isUser: false, 
        category: aiResponse.category 
      }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { 
          text: 'I apologize, but I\'m experiencing technical difficulties. Please try again or contact our support team at <a href="mailto:support@proofmint.com" class="text-blue-500 underline">support@proofmint.com</a> for immediate assistance.', 
          isUser: false,
          category: 'general'
        },
      ]);
    }
    
    setIsLoading(false);
  }, 300);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedInput = DOMPurify.sanitize(input.trim(), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    if (!sanitizedInput) return;
    setInput('');
    debouncedSubmit(sanitizedInput);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  return (
    <details ref={detailsRef} className="group fixed bottom-8 right-8 z-50">
      <summary className="list-none cursor-pointer">
        <div 
          className="bg-gradient-to-r from-green-600 to-blue-600 p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300" 
          aria-label="Open ProofMint AI Chat" 
          onClick={() => setIsOpen(true)}
        >
          <span className="material-symbols-outlined text-white text-3xl">psychology</span>
        </div>
      </summary>
      
      <div
        className={`fixed bottom-20 right-8 w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 transform transition-all duration-300 ease-in-out ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="ProofMint AI Chat"
      >
        <div className="flex flex-col h-full p-4">
          <ChatHeader isLoading={isLoading} onClose={closeChat} />
          
          <div className="flex-grow overflow-y-auto mb-4 p-4 bg-gray-50 rounded-xl">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <ChatMessage key={index} message={message} index={index} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          <ChatInput
            ref={inputRef}
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            placeholder="Ask about NFT receipts, blockchain ownership..."
          />
        </div>
      </div>
    </details>
  );
};

export default Support;