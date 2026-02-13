import React from 'react';
import { Rocket, Sparkles, Smartphone, Shield, Zap, Search } from 'lucide-react';

const FeaturesPage = () => {
  const features = [
    {
      icon: <Search className="text-blue-500" size={32} />,
      title: "Smart Search",
      description: "Our new AI-powered search helps you find the perfect venue based on your specific event needs and preferences."
    },
    {
      icon: <Zap className="text-amber-500" size={32} />,
      title: "Instant Booking",
      description: "Book select venues instantly without waiting for owner approval. Fast, seamless, and secure."
    },
    {
      icon: <Smartphone className="text-emerald-500" size={32} />,
      title: "Mobile Optimization",
      description: "A completely redesigned mobile experience makes it easier than ever to manage your bookings on the go."
    },
    {
      icon: <Shield className="text-indigo-500" size={32} />,
      title: "Enhanced Verification",
      description: "New security features ensure that every user and venue on our platform is verified and trustworthy."
    }
  ];

  return (
    <div className="min-h-screen bg-white pt-32 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-50 rounded-full text-amber-600 mb-6">
              <Sparkles size={16} fill="currentColor" />
              <span className="text-xs font-black uppercase tracking-widest">What&apos;s New</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
              New Features
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              We&apos;re constantly working to improve your experience. Explore the latest features we&apos;ve added to Gobokin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
            {features.map((item, index) => (
              <div key={index} className="p-10 bg-gray-50 border border-gray-100 rounded-[3rem] hover:bg-white hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 group">
                <div className="mb-8 p-5 bg-white rounded-2xl w-fit shadow-sm border border-gray-50 group-hover:scale-110 transition-transform duration-500">
                  {item.icon}
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed font-medium">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="relative rounded-[4rem] overflow-hidden bg-gray-900 aspect-[21/9] flex items-center justify-center text-center p-12 mb-20">
            <div className="relative z-10">
              <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center text-white mx-auto mb-8 animate-bounce">
                <Rocket size={32} />
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">More is on the way.</h2>
              <p className="text-gray-400 text-lg max-w-xl mx-auto">
                We have a roadmap full of exciting updates. Stay tuned for even more tools to help you create unforgettable events.
              </p>
            </div>
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
          </div>

          <div className="text-center">
            <h3 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">Have a feature request?</h3>
            <a href="/support/help-center" className="inline-block px-10 py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-primary-dark transition-all active:scale-95 shadow-xl shadow-primary/20">
              Tell us what you want
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;
