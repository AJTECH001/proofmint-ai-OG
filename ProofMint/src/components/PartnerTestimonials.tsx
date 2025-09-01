import { Link } from 'react-router-dom';

const PartnerTestimonials = () => {
  const testimonials = [
    {
      logo: '/images/sweat-logo.png',
      name: 'SWEAT',
      quote: 'ProofMint’s NFT receipts streamlined our electronics sales, ensuring secure ownership.',
      person: 'Illa R.',
      role: 'Product Head at SWEAT',
      avatar: '/images/illa-r.png',
    },
    {
      logo: '/images/brave-logo.png',
      name: 'Brave',
      quote: 'ProofMint’s recycling tracking helps us promote sustainability to our users.',
      person: 'Brendan Eich',
      role: 'Co-founder & CEO of Brave',
      avatar: '/images/brendan-eich.png',
    },
    {
      logo: '/images/sorare-logo.png',
      name: 'Sorare',
      quote: 'ProofMint’s blockchain platform is a game-changer for secure transactions.',
      person: 'Brian O’Hagan',
      role: 'Growth Lead at Sorare',
      avatar: '/images/brian-ohagan.png',
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6">
      <section className="py-16 bg-gradient-to-r from-green-50 to-blue-50 rounded-3xl mt-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Hear from Our Partners</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, index) => (
              <div
                key={index}
                className="bg-gray-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-2"
              >
                <div className="flex items-center mb-6">
                  <img src={t.logo} alt={`${t.name} logo`} className="w-12 h-12" loading="lazy" />
                  <div className="ml-4">
                    <h4 className="font-semibold">{t.name}</h4>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{t.quote}</p>
                <div className="flex items-center">
                  <img
                    src={t.avatar}
                    alt={`Avatar of ${t.person}`}
                    className="w-8 h-8 rounded-full"
                    loading="lazy"
                  />
                  <div className="ml-2">
                    <p className="text-sm font-semibold">{t.person}</p>
                    <p className="text-xs text-gray-600">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/partners">
              <button className="px-8 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 hover:scale-105 transition-all">
                Join Our Partners
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default PartnerTestimonials;