import React from 'react';
import { Briefcase, Timer, Sparkles, MapPin } from 'lucide-react';

const CareersPage = () => {
  return (
    <div className="min-h-screen bg-white pt-32 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h1 className="text-4xl md:text-7xl font-black text-gray-900 mb-8 tracking-tight">
              Careers
            </h1>
            <div className="inline-flex items-center space-x-3 px-6 py-3 bg-primary/5 rounded-2xl text-primary mb-10">
              <Timer size={20} className="animate-pulse" />
              <span className="text-sm font-black uppercase tracking-[0.2em]">Coming Soon</span>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              We&apos;re building the future of event spaces and we&apos;re always looking for talented individuals to join our mission.
            </p>
          </div>

          <div className="bg-gray-50 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
            <div className="relative z-10">
              <Sparkles className="text-amber-400 mx-auto mb-8" size={48} />
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-6 tracking-tight">We&apos;re not quite ready for you yet.</h2>
              <p className="text-gray-600 text-lg leading-relaxed max-w-xl mx-auto mb-12">
                Our careers portal is currently under development. Check back soon for exciting opportunities in engineering, design, marketing, and operations.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-3 mb-4 text-primary">
                    <Briefcase size={20} />
                    <span className="font-bold">Growth</span>
                  </div>
                  <p className="text-sm text-gray-500">Accelerate your career in a fast-paced, innovative environment.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-3 mb-4 text-primary">
                    <MapPin size={20} />
                    <span className="font-bold">Remote-First</span>
                  </div>
                  <p className="text-sm text-gray-500">Work from anywhere in the world with a flexible, global team.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-3 mb-4 text-primary">
                    <Sparkles size={20} />
                    <span className="font-bold">Impact</span>
                  </div>
                  <p className="text-sm text-gray-500">Build products that help people create meaningful connections.</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          </div>

          <div className="mt-20 text-center">
            <h3 className="text-xl font-black text-gray-900 mb-6">Want to be the first to know?</h3>
            <button className="px-10 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary-dark transition-all active:scale-95 shadow-xl shadow-primary/20">
              Get Notified
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareersPage;
