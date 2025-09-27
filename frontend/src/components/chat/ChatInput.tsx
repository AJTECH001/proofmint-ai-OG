import React, { forwardRef } from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  placeholder?: string;
}

const ChatInput = forwardRef<HTMLInputElement, ChatInputProps>(
  ({ value, onChange, onSubmit, isLoading, placeholder = "Ask about NFT receipts, blockchain ownership..." }, ref) => {
    return (
      <form onSubmit={onSubmit} className="flex space-x-2">
        <div className="flex-grow relative">
          <input
            ref={ref}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            disabled={isLoading}
            aria-label="Chat input for ProofMint questions"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <span className="material-symbols-outlined text-sm">chat</span>
          </div>
        </div>
        <button
          type="submit"
          className="px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center space-x-2"
          disabled={isLoading || !value.trim()}
          aria-label="Send message to ProofMint AI"
        >
          {isLoading ? (
            <span className="material-symbols-outlined animate-spin">refresh</span>
          ) : (
            <span className="material-symbols-outlined">send</span>
          )}
        </button>
      </form>
    );
  }
);

ChatInput.displayName = 'ChatInput';

export default ChatInput;