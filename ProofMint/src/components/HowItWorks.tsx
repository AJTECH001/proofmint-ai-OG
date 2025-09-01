import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  FileText, 
  CheckCircle, 
  Recycle,
  ArrowDown,
  Sparkles
} from 'lucide-react';

const HowItWorks = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0
    }
  };

  const steps = [
    {
      icon: ShoppingBag,
      number: "01",
      title: "Shop Electronics",
      description: "Browse verified electronics from trusted merchants on our marketplace. Each product comes with authenticity guarantees.",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      icon: FileText,
      number: "02", 
      title: "Receive NFT Receipt",
      description: "Get an immutable NFT receipt stored on 0G Chain. Your purchase is permanently recorded with all product details.",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      iconColor: "text-green-600"
    },
    {
      icon: CheckCircle,
      number: "03",
      title: "Verify Authenticity", 
      description: "Use your NFT receipt to verify product authenticity anytime, anywhere. Share proof of purchase instantly.",
      color: "from-purple-500 to-violet-500",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600"
    },
    {
      icon: Recycle,
      number: "04",
      title: "Earn from Recycling",
      description: "When ready to recycle, earn PMT tokens by participating in our sustainable e-waste program.",
      color: "from-emerald-500 to-teal-500", 
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-white via-gray-50/50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-blue-100 rounded-full text-sm font-medium text-gray-700 mb-4">
            <Sparkles className="w-4 h-4" />
            How ProofMint Works
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Simple, Secure, 
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              {' '}Sustainable
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the future of electronics shopping with blockchain-verified receipts and sustainable recycling rewards.
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          className="relative"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <motion.div
                className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 mb-16 lg:mb-20"
                variants={stepVariants}
              >
                {/* Step Content */}
                <div className={`lg:w-1/2 ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <div className="relative">
                    {/* Step Number */}
                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-600">{step.number}</span>
                    </div>
                    
                    <div className={`p-8 ${step.bgColor} rounded-2xl border border-white/50 backdrop-blur-sm`}>
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-r ${step.color}`}>
                          <step.icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                      </div>
                      <p className="text-gray-700 text-lg leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </div>

                {/* Step Visualization */}
                <div className={`lg:w-1/2 ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <div className="relative group">
                    <div className={`absolute inset-0 bg-gradient-to-r ${step.color} rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity`}></div>
                    <div className="relative p-8 bg-white rounded-2xl shadow-lg border border-gray-100 group-hover:shadow-xl transition-shadow">
                      <div className="flex items-center justify-center h-48">
                        <div className={`p-8 rounded-full bg-gradient-to-r ${step.color}`}>
                          <step.icon className="w-16 h-16 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Arrow connector (except for last step) */}
              {index < steps.length - 1 && (
                <div className="flex justify-center mb-8 lg:mb-12">
                  <motion.div
                    className="p-2 bg-gradient-to-b from-green-100 to-blue-100 rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowDown className="w-6 h-6 text-green-600" />
                  </motion.div>
                </div>
              )}
            </div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 border border-green-100/50">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to start your sustainable electronics journey?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Join thousands of users who trust ProofMint for authentic electronics and earn rewards through recycling.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/marketplace">
                <motion.button
                  className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold shadow-lg shadow-green-500/25 hover:from-green-700 hover:to-green-800 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Start Shopping
                </motion.button>
              </Link>
              <Link to="/dashboard">
                <motion.button
                  className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  View Dashboard
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;