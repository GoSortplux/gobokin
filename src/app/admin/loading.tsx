import React from 'react';
import CustomLoader from '@/components/CustomLoader';

export default function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center space-y-4">
        <CustomLoader size={60} />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse">
          Loading Dashboard...
        </p>
      </div>
    </div>
  );
}
