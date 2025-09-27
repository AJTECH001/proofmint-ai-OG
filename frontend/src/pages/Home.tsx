import React, { lazy, Suspense } from 'react';
import { Role } from '../utils/types';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Support from '../components/Support';

// Lazy load components
const HeroSection = lazy(() => import('../components/HeroSection'));
const Description = lazy(() => import('../components/Description'));
const HowItWorks = lazy(() => import('../components/HowItWorks'));
const PartnerTestimonials = lazy(() => import('../components/PartnerTestimonials'));
const FAQ = lazy(() => import('../components/FAQ'));

interface HomeProps {
  account: string;
  role: Role;
}

const Home: React.FC<HomeProps> = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main role="main" aria-labelledby="home-title">
        {/* <section className="p-6 text-center bg-gray-50">
          <h1 id="home-title" className="text-3xl font-bold mb-4 text-gray-900">
            Welcome to ProofMint
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            {account ? (
              <>
                Connected as: <span className="font-semibold">{`${account.slice(0, 6)}...${account.slice(-4)}`}</span> (
                {role || 'No Role'})
                <br />
                {role ? (
                  <Link to="/dashboard" className="mt-4 inline-block bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition-all">
                    Go to Dashboard
                  </Link>
                ) : (
                  <Link to="/signup" className="mt-4 inline-block bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition-all">
                    Complete Signup
                  </Link>
                )}
              </>
            ) : (
              <>
                Connect your wallet to start buying electronics with NFT receipts!
                <br />
                <Link to="/signup" className="mt-4 inline-block bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition-all">
                  Get Started
                </Link>
              </>
            )}
          </p>
        </section> */}
        <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
          <HeroSection />
          <Description />
          <HowItWorks />
          <PartnerTestimonials />
          <FAQ />
        </Suspense>
      </main>
      <Footer />
      <Support />
    </div>
  );
};

export default Home;