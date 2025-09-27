import React from 'react';
import { FaTimes } from 'react-icons/fa';

interface ChatHeaderProps {
  isLoading: boolean;
  onClose: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ isLoading, onClose }) => {
  return (
    <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-100">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-lg">psychology</span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">ProofMint AI</h3>
          <p className="text-xs text-gray-600">Blockchain Electronics Expert</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
          <span className="text-xs text-gray-600">
            {isLoading ? 'Thinking...' : 'Online'}
          </span>
        </div>
        <button
          className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
          onClick={onClose}
          aria-label="Close ProofMint AI Chat"
        >
          <FaTimes size={16} />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;