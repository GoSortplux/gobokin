import React from 'react';
import { Heart, Home, Users, Globe } from 'lucide-react';

const DisasterListingPage = () => {
  const initiatives = [
    {
      icon: <Home className="text-rose-500" size={32} />,
      title: "Emergency Shelter",
      description: "We work with venue owners to provide temporary shelter and spaces for those displaced by natural disasters."
    },
    {
      icon: <Globe className="text-blue-500" size={32} />,
      title: "Global Reach",
      description: "Our network allows us to coordinate relief efforts across various regions, ensuring help reaches where it's needed most."
    },
    {
      icon: <Users className="text-emerald-500" size={32} />,
      title: "Community Support",
      description: "Connect with local volunteers and organizations to provide essential supplies and services to affected communities."
    }
  ];

  return (
    <div className="min-h-screen bg-white pt-32 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-rose-50 rounded-full text-rose-600 mb-6">
              <Heart size={16} fill="currentColor" />
              <span className="text-xs font-black uppercase tracking-widest">Gobokin Cares</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
              Disaster Relief Listing
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              In times of crisis, our community comes together. We help coordinate space and resources for those affected by disasters.
            </p>
          </div>

          <div className="bg-gray-50 rounded-[3rem] p-12 md:p-16 mb-20">
            <h2 className="text-3xl font-black text-gray-900 mb-10 tracking-tight text-center">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {initiatives.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="mb-6 p-5 bg-white rounded-[2rem] w-fit mx-auto shadow-sm border border-gray-100">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
            <div className="bg-primary rounded-[2.5rem] p-10 text-white">
              <h3 className="text-2xl font-black mb-4">Are you in need?</h3>
              <p className="text-primary-50 mb-8 leading-relaxed">
                If you have been affected by a disaster and need access to temporary space or shelter, our team is here to help you find available resources.
              </p>
              <button className="px-8 py-4 bg-white text-primary rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary-50 transition-all active:scale-95 shadow-xl shadow-black/10">
                Get Assistance
              </button>
            </div>
            <div className="bg-white border-2 border-primary/10 rounded-[2.5rem] p-10">
              <h3 className="text-2xl font-black text-gray-900 mb-4">Can you host?</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Venue owners can offer their spaces for emergency use. Your generosity can make a world of difference to families in need.
              </p>
              <button className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary-dark transition-all active:scale-95 shadow-xl shadow-primary/10">
                Offer Your Space
              </button>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] mb-8">Partner Organizations</p>
            <div className="flex flex-wrap justify-center gap-12 grayscale opacity-50">
              {/* Placeholders for partner logos */}
              <div className="font-black text-xl">REDCROSS</div>
              <div className="font-black text-xl">UNICEF</div>
              <div className="font-black text-xl">WORLD HELP</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisasterListingPage;
