import React from 'react';
import { Shield, Lock, Eye, CheckCircle, Users, AlertTriangle } from 'lucide-react';

const SafetyPage = () => {
  const safetyFeatures = [
    {
      icon: <Shield className="text-primary" size={32} />,
      title: "Verified Venues",
      description: "Every venue on Gobokin goes through a verification process to ensure it meets our quality and safety standards."
    },
    {
      icon: <Lock className="text-primary" size={32} />,
      title: "Secure Payments",
      description: "We use industry-leading encryption to protect your financial information and ensure every transaction is secure."
    },
    {
      icon: <Eye className="text-primary" size={32} />,
      title: "Privacy Protection",
      description: "Your personal data is protected and never shared with third parties without your explicit consent."
    },
    {
      icon: <Users className="text-primary" size={32} />,
      title: "Community Reviews",
      description: "Real reviews from real guests help you make informed decisions and maintain high standards across our community."
    },
    {
      icon: <CheckCircle className="text-primary" size={32} />,
      title: "Booking Protection",
      description: "Our GoCover protection ensures that your booking is safe and you're covered in case of unexpected issues."
    },
    {
      icon: <AlertTriangle className="text-primary" size={32} />,
      title: "Reporting Tools",
      description: "Easily report any suspicious activity or issues with a venue through our 24/7 support channels."
    }
  ];

  return (
    <div className="min-h-screen bg-white pt-32 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
              Safety at Gobokin
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Your safety and security are our top priorities. We&apos;ve built tools and practices to help you book with confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            {safetyFeatures.map((feature, index) => (
              <div key={index} className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300">
                <div className="mb-6 p-4 bg-white rounded-2xl w-fit shadow-sm">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed font-medium">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-primary rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-black mb-8 tracking-tight">
                Our Commitment to You
              </h2>
              <div className="space-y-6 text-primary-50 text-lg leading-relaxed max-w-2xl">
                <p>
                  At Gobokin, we believe that finding the perfect venue should be an experience built on trust. That&apos;s why we&apos;re constantly evolving our safety measures to stay ahead of new challenges.
                </p>
                <p>
                  Whether you&apos;re hosting a small gathering or a large corporate event, our platform is designed to provide peace of mind from the moment you start searching to the day of your event.
                </p>
                <button className="mt-8 px-10 py-4 bg-white text-primary rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary-50 transition-all active:scale-95 shadow-2xl shadow-black/20">
                  Read our Safety Guidelines
                </button>
              </div>
            </div>
            {/* Background decorative elements */}
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary-dark/30 rounded-full blur-3xl" />
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-primary-light/20 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyPage;
