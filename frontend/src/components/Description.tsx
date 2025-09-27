import { Link } from "react-router-dom";
import ImageWithGradient from './ImageWithGradient';

const Description = () => {
  const featureCards = [
    {
      icon: 'token',
      title: '0G-Powered NFT Receipts',
      description: 'Receive unique NFT receipts issued by ProofMint (0x045962833e855095DbE8B061d0e7E929a3f5C55c) on 0G Chain for ownership proof.',
    },
    {
      icon: 'recycling',
      title: 'Track Recycling on 0G',
      description: 'Monitor your electronics’ lifecycle with AI insights, stored securely via 0G Storage, supporting sustainable e-waste management.',
    },
    {
      icon: 'swap_horiz',
      title: 'Easy Transfers on 0G',
      description: 'Transfer ownership seamlessly using 0G Chain’s fast transactions when reselling or gifting electronics.',
    },
    {
      icon: 'security',
      title: '0G Secure Platform',
      description: 'Blockchain-powered security on 0G Chain ensures tamper-proof transactions for all your devices.',
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 bg-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-12 md:mb-20">
        {featureCards.map((card, index) => (
          <div
            key={index}
            className="p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow hover:-translate-y-1"
          >
            <span className="material-symbols-outlined text-green-600 text-4xl mb-4">{card.icon}</span>
            <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
            <p className="text-gray-600">{card.description}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-gradient-to-r from-green-50 to-blue-50 p-6 md:p-12 rounded-3xl">
        <div className="w-full md:w-1/2">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 md:mb-6">
            Revolutionizing Electronics on 0G Chain
          </h2>
          <p className="text-lg mb-6 md:mb-8 text-gray-600">
            Our 0G-powered platform, built for the 0G WaveHack Wave 2, ensures secure transactions, verifiable NFT ownership via ProofMint, and responsible recycling tracking with 0G’s AI-ready infrastructure.
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/marketplace">
              <button className="px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 hover:scale-105 transition-all">
                Shop Now
              </button>
            </Link>
            <Link to="/about">
              <button className="px-6 py-3 border-2 border-green-600 text-green-600 rounded-full hover:bg-green-50 hover:scale-105 transition-all">
                Learn More
              </button>
            </Link>
          </div>
        </div>
        <div className="w-full md:w-1/2 relative mt-8 md:mt-0">
          <ImageWithGradient
            src="https://images.unsplash.com/photo-1654892968823-ea564870a96f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHw3fHxibG9ja2NoYWluJTIwY2VydGlmaWNhdGUlMjBkaWdpdGFsJTIwcmVjZWlwdCUyME5GVHxlbnwwfDB8fGJsdWV8MTc1NDM3Njc3OHww&ixlib=rb-4.1.0&q=85"
            alt="0G-powered Digital NFT receipt blockchain certificate - Photo by 2H Media on Unsplash"
            className="w-full"
            gradientOpacity="visible"
          />
        </div>
      </div>
    </main>
  );
};

export default Description;