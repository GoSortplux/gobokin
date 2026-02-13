import React from 'react';
import { PlusCircle, Image as ImageIcon, MapPin, Calendar, DollarSign, ArrowRight } from 'lucide-react';

const TryListingPage = () => {
  const steps = [
    {
      icon: <MapPin size={24} />,
      title: "Tell us about your space",
      description: "Share where your venue is located and what makes it unique for events."
    },
    {
      icon: <ImageIcon size={24} />,
      title: "Make it stand out",
      description: "Upload high-quality photos and write a description that captures the vibe of your venue."
    },
    {
      icon: <Calendar size={24} />,
      title: "Set your availability",
      description: "Choose when you want to host and set up your booking calendar."
    },
    {
      icon: <DollarSign size={24} />,
      title: "Finish and publish",
      description: "Set your price, review your details, and publish your listing to the world."
    }
  ];

  return (
    <div className="min-h-screen bg-white pt-32 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
            <div>
              <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-8 tracking-tight leading-tight">
                Turn your space into <span className="text-primary">earnings.</span>
              </h1>
              <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                Join thousands of venue owners who are earning extra income by listing their halls, studios, and event spaces on Gobokin.
              </p>
              <a href="/apply-hall-owner" className="inline-flex items-center space-x-3 px-10 py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-primary-dark transition-all active:scale-95 shadow-2xl shadow-primary/20">
                <span>Start Your Listing</span>
                <PlusCircle size={20} />
              </a>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gray-100 rounded-[4rem] overflow-hidden rotate-3 shadow-2xl">
                {/* Mock image placeholder */}
                <div className="w-full h-full flex items-center justify-center text-gray-300 font-black text-4xl">
                  VENUE PHOTO
                </div>
              </div>
              <div className="absolute -bottom-10 -left-10 aspect-square w-48 bg-white rounded-3xl shadow-2xl p-6 -rotate-6 hidden md:block border border-gray-50">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
                  <DollarSign size={24} />
                </div>
                <div className="h-2 w-16 bg-gray-100 rounded-full mb-2" />
                <div className="h-2 w-12 bg-gray-50 rounded-full" />
              </div>
            </div>
          </div>

          <div className="mb-24">
            <h2 className="text-3xl font-black text-gray-900 mb-12 tracking-tight">Listing is as easy as...</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="relative group">
                  <div className="mb-6 w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-primary border border-gray-100 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-7 -right-4 text-gray-200">
                      <ArrowRight size={20} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 rounded-[3rem] p-12 md:p-20 text-white flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-lg">
              <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">Need more info?</h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                Learn more about how we protect your venue and the resources we provide to help you succeed.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <a href="/hosting/protection" className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all text-center border border-white/10">
                Venue Protection
              </a>
              <a href="/hosting/resources" className="px-8 py-4 bg-white text-gray-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-100 transition-all text-center">
                Explore Resources
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TryListingPage;
