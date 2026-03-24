'use client';

import React, { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';
import PolicyModal from '@/components/PolicyModal';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const consent = localStorage.getItem('gobokin_cookie_consent');
    if (!consent) {
      // Small delay to make it feel more organic
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('gobokin_cookie_consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-[340px] z-[100] animate-in slide-in-from-right duration-700">
      <div className="bg-white/95 backdrop-blur-md border border-gray-100 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <Cookie size={24} />
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
            >
              <X size={18} />
            </button>
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-2">Cookie Policy</h3>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.
          </p>

          <div className="flex space-x-3">
            <button
              onClick={handleAccept}
              className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm font-bold py-3 rounded-2xl transition-all duration-300 shadow-lg shadow-primary/20 cursor-pointer active:scale-95"
            >
              Accept All
            </button>
            <button
              onClick={() => setIsPolicyModalOpen(true)}
              className="px-4 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>

      <PolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        onAccept={() => setIsPolicyModalOpen(false)}
        type="general"
        compact={true}
        skipUserUpdate={true}
      />
    </div>
  );
};

export default CookieConsent;
