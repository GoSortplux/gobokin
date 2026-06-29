'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Facebook,
  Instagram
} from 'lucide-react';
import PolicyModal from '@/components/PolicyModal';

const Footer = () => {
  const [policyConfig, setPolicyConfig] = useState<{
    isOpen: boolean;
    slug: string;
    type: 'general' | 'hall-owner';
  }>({
    isOpen: false,
    slug: '',
    type: 'general'
  });

  const openPolicy = (slug: string) => {
    setPolicyConfig({
      isOpen: true,
      slug,
      type: 'general'
    });
  };

  const closePolicy = () => {
    setPolicyConfig(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <footer className="bg-gray-100 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <Link href="/" className="inline-block">
            <Image
              src="/logo.png"
              alt="Gobokin Logo"
              width={150}
              height={40}
              className="h-10 w-auto object-contain"
            />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg text-gray-800">Support</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="/support/help-center" className="text-gray-600 hover:text-primary transition-colors flex items-center group">
                  Help Center
                </a>
              </li>
              <li>
                <a href="/support/safety" className="text-gray-600 hover:text-primary transition-colors flex items-center group">
                  Safety information
                </a>
              </li>
              <li>
                <a href="/support/cancellation" className="text-gray-600 hover:text-primary transition-colors flex items-center group">
                  Cancellation options
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-800">Community</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="/community/disaster-listing" className="text-gray-600 hover:text-primary transition-colors flex items-center group">
                 Gogobokin.com: disaster listing
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-800">Hosting</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="/hosting/try-listing" className="text-gray-600 hover:text-primary transition-colors flex items-center group">
                  Try Listing
                </a>
              </li>
              <li>
                <a href="/hosting/protection" className="text-gray-600 hover:text-primary transition-colors flex items-center group">
                  Protection for Venue <span className="text-[10px] ml-1 opacity-50 font-bold uppercase">(Soon)</span>
                </a>
              </li>
              <li>
                <a href="/hosting/resources" className="text-gray-600 hover:text-primary transition-colors flex items-center group">
                  Explore Listing resources
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-800">About</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="/about/newsroom" className="text-gray-600 hover:text-primary transition-colors flex items-center group">
                  Newsroom
                </a>
              </li>
              <li>
                <a href="/about/features" className="text-gray-600 hover:text-primary transition-colors flex items-center group">
                  Learn about new features
                </a>
              </li>
              <li>
                <a href="/about/careers" className="text-gray-600 hover:text-primary transition-colors flex items-center group">
                  Careers
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <p className="text-gray-600">
              &copy; {new Date().getFullYear()} Gobokin, Inc.
            </p>
            <div className="flex items-center space-x-4">
              <a href="#" className="text-gray-400 hover:text-primary transition-colors" title="X">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="https://web.facebook.com/gobokins" className="text-gray-400 hover:text-primary transition-colors" title="Facebook">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors" title="Instagram">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors" title="TikTok">
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                </svg>
              </a>
              <span className="text-gray-400 font-bold text-xs ml-2">@gobokins</span>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div className="flex gap-2">
                  {/* App Store Badge placeholder */}
                  <div className="bg-black text-white px-3 py-1.5 rounded-lg flex items-center gap-2 border border-gray-800 opacity-50 cursor-not-allowed grayscale">
                    <svg viewBox="0 0 384 512" width="16" height="16" fill="currentColor">
                      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-31.4-57.3-114.3-57.7-111.9zM232.2 72c29.4-31 30.3-65.3 27.6-96-26 1.1-55.7 17.1-73.4 38.8-18.1 22.1-31.1 53.6-26.6 84.1 29.4 3.1 57.5-12.2 72.4-26.9z" />
                    </svg>
                    <div className="flex flex-col">
                      <span className="text-[8px] leading-none uppercase font-bold">Download on the</span>
                      <span className="text-xs leading-none font-black tracking-tight">App Store</span>
                    </div>
                  </div>
                  {/* Google Play Badge placeholder */}
                  <div className="bg-black text-white px-3 py-1.5 rounded-lg flex items-center gap-2 border border-gray-800 opacity-50 cursor-not-allowed grayscale">
                    <svg viewBox="0 0 512 512" width="16" height="16" fill="currentColor">
                      <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
                    </svg>
                    <div className="flex flex-col">
                      <span className="text-[8px] leading-none uppercase font-bold">Get it on</span>
                      <span className="text-xs leading-none font-black tracking-tight">Google Play</span>
                    </div>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary mt-1 animate-pulse">Mobile App Coming Soon</span>
              </div>
            </div>

            <div className="flex space-x-6">
              <button
                onClick={() => openPolicy('privacy-policy')}
                className="text-gray-600 hover:text-primary transition-colors text-sm font-medium"
              >
                Privacy
              </button>
              <button
                onClick={() => openPolicy('terms-of-service')}
                className="text-gray-600 hover:text-primary transition-colors text-sm font-medium"
              >
                Terms
              </button>
              <a href="/sitemap" className="text-gray-600 hover:text-primary transition-colors text-sm font-medium">
                Sitemap
              </a>
            </div>
          </div>
        </div>
      </div>

      <PolicyModal
        isOpen={policyConfig.isOpen}
        onClose={closePolicy}
        onAccept={closePolicy}
        slug={policyConfig.slug}
        type={policyConfig.type}
        compact={true}
      />
    </footer>
  );
};

export default Footer;
