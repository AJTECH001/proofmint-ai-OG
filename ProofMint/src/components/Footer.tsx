import { CiMail } from 'react-icons/ci';
import { FaLinkedin, FaTwitter, FaFacebook } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-100 p-6 lg:p-12">
      <div className="max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex flex-col items-start gap-4">
          <Link to="/" className="flex items-center space-x-2" aria-label="ProofMint Home">
            <span className="material-symbols-outlined text-3xl text-green-600">receipt_long</span>
            <h1 className="text-xl font-bold">ProofMint</h1>
          </Link>
          <div className="flex items-center text-[#3C4D35]">
            <CiMail size={24} className="mr-2" />
            <a href="mailto:contact@proofmint.com" className="text-base" aria-label="Email ProofMint support">
              contact@proofmint.com
            </a>
          </div>
        </div>
        <div className="flex flex-col items-start gap-4">
          <p className="text-[#3C4D35] font-semibold text-base">Quick Links</p>
          <div className="flex flex-col gap-2">
            <Link to="/marketplace" className="text-[#3C4D35] hover:text-green-600">Marketplace</Link>
            <Link to="/nft-receipts" className="text-[#3C4D35] hover:text-green-600">NFT Receipts</Link>
            <Link to="/recycling" className="text-[#3C4D35] hover:text-green-600">Recycling</Link>
            <Link to="/track" className="text-[#3C4D35] hover:text-green-600">Track Items</Link>
          </div>
        </div>
        <div className="flex flex-col items-start md:items-end gap-4">
          <p className="text-[#3C4D35] font-semibold text-base">Connect with Us</p>
          <div className="flex gap-4">
            <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="ProofMint on LinkedIn">
              <FaLinkedin size={24} className="text-[#3C4D35] hover:text-green-600" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="ProofMint on Twitter">
              <FaTwitter size={24} className="text-[#3C4D35] hover:text-green-600" />
            </a>
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" aria-label="ProofMint on Facebook">
              <FaFacebook size={24} className="text-[#3C4D35] hover:text-green-600" />
            </a>
          </div>
        </div>
      </div>
      <div className="mt-10 text-center">
        <div className="flex justify-center gap-8 mb-4">
          <Link to="/terms" className="text-[#3C4D35] text-base hover:text-green-600">Terms of Use</Link>
          <Link to="/privacy" className="text-[#3C4D35] text-base hover:text-green-600">Privacy Policy</Link>
        </div>
        <p className="text-[#3C4D35] text-sm">© {new Date().getFullYear()} ProofMint</p>
      </div>
    </footer>
  );
};

export default Footer;