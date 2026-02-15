import React from 'react';
import CustomLoader from '@/components/CustomLoader';

export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-[9999]">
      <div className="flex flex-col items-center space-y-4">
        <CustomLoader size={60} />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse">
          Please wait...
        </p>
      </div>
    </div>
  );
}
