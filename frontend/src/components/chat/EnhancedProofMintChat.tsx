import React, { useState, useRef, useEffect } from 'react';
import { FaRobot, FaTimes, FaPlus } from 'react-icons/fa';
import { useZeroGProofMintAI, EnhancedAIResponse } from '../../hooks/useZeroGProofMintAI';
import { useZeroGAI } from '../../contexts/ZeroGAIContext';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ZeroGAISetup from './ZeroGAISetup';

interface ChatMessage {
  text: string;
  isUser: boolean;
  category?: 'nft' | 'blockchain' | 'recycling' | 'ownership' | 'general';
  source?: 'local' | '0g-ai';
  model?: string;
  provider?: string;
  verified?: boolean;
}

interface EnhancedProofMintChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const EnhancedProofMintChat: React.FC<EnhancedProofMintChatProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { 
    sendMessage, 
    isProcessing, 
    capabilities,
    isZeroGInitialized 
  } = useZeroGProofMintAI({ 
    fallbackToLocal: true 
  });

  const { balance, services } = useZeroGAI();

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        text: capabilities.hasZeroGAI 
          ? `Welcome to ProofMint AI Enhanced! 🚀

I'm now powered by the 0G Network with advanced AI models for even better assistance with:

🔗 **NFT Receipts & Digital Ownership**
⛓️ **Blockchain Technology**  
♻️ **Sustainable E-waste Management**
📱 **Device Lifecycle Tracking**

${balance ? `💰 Current balance: ${parseFloat(balance.available).toFixed(4)} OG tokens` : ''}
${services.length > 0 ? `🤖 ${services.length} AI models available` : ''}

What can I help you with today?`
          : `Hello! I'm ProofMint AI, your blockchain electronics expert! 🤖

I can help you with:
🔗 **NFT Receipts** - Digital proof of ownership
⛓️ **Blockchain Security** - Tamper-proof records  
♻️ **Recycling Tracking** - Sustainable e-waste management
📱 **Ownership Transfers** - Seamless device reselling

💡 **Tip:** Enable 0G AI enhancement for advanced capabilities with verified responses!

What would you like to know about ProofMint?`,
        isUser: false,
        category: 'general',
        source: capabilities.hasZeroGAI ? '0g-ai' : 'local'
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, capabilities.hasZeroGAI, balance, services]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      text: inputValue.trim(),
      isUser: true
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    try {
      const response: EnhancedAIResponse = await sendMessage(inputValue.trim());
      
      const aiMessage: ChatMessage = {
        text: response.text,
        isUser: false,
        category: response.category,
        source: response.source,
        model: response.model,
        provider: response.provider,
        verified: response.verified
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        text: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        isUser: false,
        category: 'general',
        source: 'local'
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleSetupComplete = () => {
    setShowSetup(false);
    // Refresh the welcome message to show enhanced capabilities
    const enhancedWelcome: ChatMessage = {
      text: `🎉 Great! 0G AI enhancement is now active!

You now have access to advanced AI models with verified responses. I can provide more detailed and accurate assistance with:

🔗 **NFT Receipts & Digital Ownership**
⛓️ **Blockchain Technology**  
♻️ **Sustainable E-waste Management**
📱 **Device Lifecycle Tracking**

${balance ? `💰 Balance: ${parseFloat(balance.available).toFixed(4)} OG tokens` : ''}

What would you like to explore?`,
      isUser: false,
      category: 'general',
      source: '0g-ai'
    };
    
    setMessages(prev => [...prev, enhancedWelcome]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              capabilities.hasZeroGAI ? 'bg-blue-600' : 'bg-green-600'
            }`}>
              <FaRobot className="text-white text-lg" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">
                ProofMint AI {capabilities.hasZeroGAI ? 'Enhanced' : ''}
              </h3>
              <p className="text-xs text-gray-600">
                {capabilities.hasZeroGAI 
                  ? `Powered by 0G Network • ${services.length} models` 
                  : 'Blockchain Electronics Expert'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!isZeroGInitialized && (
              <button
                onClick={() => setShowSetup(!showSetup)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="Setup 0G AI Enhancement"
              >
                <FaPlus size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaTimes size={16} />
            </button>
          </div>
        </div>

        {/* Setup Panel */}
        {showSetup && (
          <div className="p-4 border-b bg-gray-50">
            <ZeroGAISetup onSetupComplete={handleSetupComplete} />
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <ChatMessage key={index} message={message} index={index} />
          ))}
          {isProcessing && (
            <div className="flex items-start space-x-2">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                capabilities.currentSource === '0g-ai' ? 'bg-blue-600' : 'bg-green-600'
              }`}>
                <FaRobot className="animate-pulse" />
              </div>
              <div className={`p-3 rounded-lg border-l-4 rounded-tl-none ${
                capabilities.currentSource === '0g-ai' ? 'bg-blue-100 border-l-blue-500' : 'bg-green-100 border-l-green-500'
              }`}>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">
                    {capabilities.hasZeroGAI ? 'Processing with 0G AI...' : 'Thinking...'}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-gray-50">
          <ChatInput
            ref={inputRef}
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            isLoading={isProcessing}
            placeholder={capabilities.hasZeroGAI 
              ? "Ask me anything about ProofMint with 0G AI..." 
              : "Ask about NFT receipts, blockchain ownership..."
            }
          />
          
          {/* Status Bar */}
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
              <span>
                {capabilities.hasZeroGAI 
                  ? `0G AI Enhanced ${isProcessing ? '(Processing)' : '(Ready)'}` 
                  : `Local AI ${isProcessing ? '(Processing)' : '(Ready)'}`
                }
              </span>
            </div>
            {balance && capabilities.hasZeroGAI && (
              <span>{parseFloat(balance.available).toFixed(4)} OG available</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProofMintChat;