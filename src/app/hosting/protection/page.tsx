import React from 'react';
import { Shield, Timer, ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';

const ProtectionPage = () => {
  return (
    <div className="min-h-screen bg-white pt-32 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h1 className="text-4xl md:text-7xl font-black text-gray-900 mb-8 tracking-tight">
              Protection for Venue
            </h1>
            <div className="inline-flex items-center space-x-3 px-6 py-3 bg-primary/5 rounded-2xl text-primary mb-10">
              <Timer size={20} className="animate-pulse" />
              <span className="text-sm font-black uppercase tracking-[0.2em]">Coming Soon</span>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              We&apos;re building a comprehensive protection program to give venue owners complete peace of mind.
            </p>
          </div>

          <div className="bg-gray-50 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
            <div className="relative z-10">
              <ShieldCheck className="text-primary mx-auto mb-8" size={48} />
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-6 tracking-tight">Your protection is our priority.</h2>
              <p className="text-gray-600 text-lg leading-relaxed max-w-xl mx-auto mb-12">
                Our GoCover protection program is currently being finalized. We&apos;re working with leading insurance partners to ensure you have the best coverage possible.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-3 mb-4 text-primary">
                    <Shield size={20} />
                    <span className="font-bold">Damage Coverage</span>
                  </div>
                  <p className="text-sm text-gray-500">Protection against accidental damage to your property during events.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-3 mb-4 text-primary">
                    <ShieldAlert size={20} />
                    <span className="font-bold">Liability</span>
                  </div>
                  <p className="text-sm text-gray-500">Industry-standard liability protection for every booking.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-3 mb-4 text-primary">
                    <Sparkles size={20} />
                    <span className="font-bold">Trust</span>
                  </div>
                  <p className="text-sm text-gray-500">Built-in safety features and verified guest identities.</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          </div>

          <div className="mt-20 text-center">
            <h3 className="text-xl font-black text-gray-900 mb-6">Want to be notified when we launch?</h3>
            <button className="px-10 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary-dark transition-all active:scale-95 shadow-xl shadow-primary/20">
              Stay Updated
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtectionPage;
