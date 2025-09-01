import React from 'react';

interface ChatMessageProps {
  message: {
    text: string;
    isUser: boolean;
    category?: 'nft' | 'blockchain' | 'recycling' | 'ownership' | 'general';
  };
  index: number;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, index }) => {
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

  return (
    <div
      className={`flex items-start space-x-2 ${message.isUser ? 'justify-end' : ''}`}
    >
      {!message.isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
          {getCategoryIcon(message.category)}
        </div>
      )}
      <div
        className={`p-3 rounded-lg max-w-[80%] ${
          message.isUser 
            ? 'bg-green-600 text-white rounded-br-none' 
            : `${getCategoryColor(message.category)} border-l-4 rounded-tl-none`
        }`}
      >
        <div
          className={`${message.isUser ? 'text-white' : 'text-gray-800'}`}
          dangerouslySetInnerHTML={{ __html: message.text }}
        />
      </div>
      {message.isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
          👤
        </div>
      )}
    </div>
  );
};

export default ChatMessage;