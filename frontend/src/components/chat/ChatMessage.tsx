import React from 'react';
import { FaShieldAlt, FaRobot, FaUser } from 'react-icons/fa';

interface ChatMessageProps {
  message: {
    text: string;
    isUser: boolean;
    category?: 'nft' | 'blockchain' | 'recycling' | 'ownership' | 'general';
    source?: 'local' | '0g-ai';
    model?: string;
    provider?: string;
    verified?: boolean;
  };
  index: number;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'nft': return '🎫';
      case 'blockchain': return '⛓️';
      case 'recycling': return '♻️';
      case 'ownership': return '📱';
      default: return '🤖';
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'nft': return 'bg-purple-100 border-l-purple-500';
      case 'blockchain': return 'bg-blue-100 border-l-blue-500';
      case 'recycling': return 'bg-green-100 border-l-green-500';
      case 'ownership': return 'bg-orange-100 border-l-orange-500';
      default: return 'bg-green-100 border-l-green-500';
    }
  };

  const getSourceIcon = () => {
    if (message.source === '0g-ai') {
      return <FaRobot className="text-blue-600" />;
    }
    return getCategoryIcon(message.category);
  };

  const getSourceBadge = () => {
    if (!message.isUser && message.source === '0g-ai') {
      return (
        <div className="flex items-center space-x-1 text-xs text-blue-600 mb-1">
          <FaRobot size={12} />
          <span>0G AI</span>
          {message.verified && (
            <div className="flex items-center space-x-1 text-green-600">
              <FaShieldAlt size={10} />
              <span>Verified</span>
            </div>
          )}
          {message.model && (
            <span className="text-gray-500">• {message.model}</span>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`flex items-start space-x-2 ${message.isUser ? 'justify-end' : ''}`}
    >
      {!message.isUser && (
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
          message.source === '0g-ai' ? 'bg-blue-600' : 'bg-green-600'
        }`}>
          {getSourceIcon()}
        </div>
      )}
      <div
        className={`p-3 rounded-lg max-w-[80%] ${
          message.isUser 
            ? 'bg-green-600 text-white rounded-br-none' 
            : `${getCategoryColor(message.category)} border-l-4 rounded-tl-none`
        }`}
      >
        {getSourceBadge()}
        <div
          className={`${message.isUser ? 'text-white' : 'text-gray-800'}`}
          dangerouslySetInnerHTML={{ __html: message.text }}
        />
      </div>
      {message.isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
          <FaUser />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;