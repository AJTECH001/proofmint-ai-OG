import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, Minus, HelpCircle, MessageSquare } from 'lucide-react';

const FAQCard = ({ question, answer, index, isOpen, onToggle }: { 
  question: string; 
  answer: string; 
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      <button
        className="w-full p-6 text-left flex justify-between items-center cursor-pointer group"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${index}`}
      >
        <h3 className="text-lg font-semibold text-gray-900 pr-4 group-hover:text-green-600 transition-colors">
          {question}
        </h3>
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
            isOpen 
              ? 'bg-green-100 text-green-600 rotate-180' 
              : 'bg-gray-100 text-gray-600 group-hover:bg-green-100 group-hover:text-green-600'
          }`}>
            {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </div>
        </div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6">
              <div className="w-full h-px bg-gradient-to-r from-green-200 to-blue-200 mb-4"></div>
              <p className="text-gray-600 leading-relaxed">{answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      question: 'What is ProofMint and how does it work?',
      answer: 'ProofMint is a blockchain-based receipt management system built on 0G Network. When you purchase electronics from verified merchants, you receive an NFT receipt that serves as immutable proof of ownership, stored permanently on-chain.',
    },
    {
      question: 'How are NFT receipts different from regular receipts?',
      answer: 'NFT receipts are tamper-proof, permanently stored on the blockchain, and can be verified instantly. Unlike paper receipts that can be lost or forged, NFT receipts provide cryptographic proof of authenticity and ownership that lasts forever.',
    },
    {
      question: 'What can I do with my NFT receipts?',
      answer: 'You can verify product authenticity, prove ownership for warranties, share purchase proof instantly, track your electronics throughout their lifecycle, and earn rewards when recycling your items through our sustainable program.',
    },
    {
      question: 'How does the recycling reward system work?',
      answer: 'When your electronics reach end-of-life, present your NFT receipt to authorized recyclers. You\'ll earn 10 PMT tokens per item recycled, promoting sustainable e-waste management while rewarding responsible disposal.',
    },
    {
      question: 'Is my data secure on 0G Network?',
      answer: '0G Network provides enterprise-grade security with fast finality (1-2 seconds) and high throughput (2,500+ TPS). All data is decentralized and encrypted, with ProofMint smart contracts ensuring secure, transparent operations.',
    },
    {
      question: 'Which wallets are compatible with ProofMint?',
      answer: 'ProofMint works with any wallet that supports 0G Network (Chain ID: 16601), including MetaMask, WalletConnect-compatible wallets, and other EVM-compatible wallets configured for the 0G testnet.',
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-sm font-medium text-gray-700 mb-4">
            <HelpCircle className="w-4 h-4" />
            Frequently Asked Questions
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Got Questions?{' '}
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              We've Got Answers
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about ProofMint and blockchain-verified receipts.
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-4 mb-16">
          {faqs.map((faq, index) => (
            <FAQCard
              key={index}
              question={faq.question}
              answer={faq.answer}
              index={index}
              isOpen={openIndex === index}
              onToggle={() => toggleFAQ(index)}
            />
          ))}
        </div>

        {/* Contact Section */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 rounded-2xl p-8 border border-gray-100">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-full">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Still have questions?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Our support team is here to help you navigate ProofMint and make the most of your blockchain receipts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/support">
                <motion.button
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold shadow-lg shadow-green-500/25 hover:from-green-700 hover:to-green-800 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <MessageSquare className="w-5 h-5" />
                  Contact Support
                </motion.button>
              </Link>
              <Link to="/docs">
                <motion.button
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <HelpCircle className="w-5 h-5" />
                  View Documentation
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;