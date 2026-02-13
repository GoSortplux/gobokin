'use client';

import React from 'react';
import Image from 'next/image';

interface CustomLoaderProps {
  className?: string;
  size?: number;
}

const CustomLoader: React.FC<CustomLoaderProps> = ({ className = "", size = 40 }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative animate-spin" style={{ width: size, height: size }}>
        <Image
          src="/loader-icon.png"
          alt="Loading..."
          fill
          className="object-contain"
        />
      </div>
    </div>
  );
};

export default CustomLoader;
