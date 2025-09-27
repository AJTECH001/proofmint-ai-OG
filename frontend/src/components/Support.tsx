import { useState } from 'react';
import { FaRobot } from 'react-icons/fa';
import EnhancedProofMintChat from './chat/EnhancedProofMintChat';

const Support = () => {
  const [isOpen, setIsOpen] = useState(false);

  const closeChat = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-green-600 to-blue-600 p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
          aria-label="Open ProofMint AI Chat"
        >
          <FaRobot className="text-white text-2xl group-hover:animate-pulse" />
        </button>
      </div>

      {/* Enhanced Chat Interface */}
      <EnhancedProofMintChat isOpen={isOpen} onClose={closeChat} />
    </>
  );
};

export default Support;