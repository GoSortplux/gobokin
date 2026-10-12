"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import api from '@/services/api';


interface Venue {
  images: string[];
}

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const [images, setImages] = useState<string[]>(['/venue_default.jpg']);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchHallImages = async () => {
      try {
        const response = await api.get('/halls');
        const venues = response.data.data;
        if (venues && venues.length > 0) {
          const allImages = venues
            .flatMap((venue: Venue) => venue.images)
            .filter((image: string) => image); // Filter out any empty strings
          if (allImages.length > 0) {
            const secureImages = allImages.map((img: string) => img.replace(/^http:/, 'https:'));
            setImages(secureImages);
          }
        }
      } catch (error) {
        console.error('Failed to fetch venue images:', error);
      }
    };

    fetchHallImages();
  }, []);

  useEffect(() => {
    if (images.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, 5000); // Change image every 5 seconds

      return () => clearInterval(timer); // Cleanup on component unmount
    }
  }, [images.length]);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Image Section - Hidden on mobile */}
      <div className="hidden lg:block relative lg:w-1/2 lg:h-screen lg:sticky lg:top-0">
        {images.map((image, index) => (
          <Image
            key={image}
            src={image}
            alt="Venue"
            fill
            style={{ objectFit: 'cover' }}
            className={`transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-50' : 'opacity-0'
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
          <Link href="/" className="transition-transform hover:scale-105 active:scale-95">
            <Image
              src="/logo.png"
              alt="Gobokin Logo"
              width={200}
              height={60}
              className="h-16 w-auto object-contain brightness-0 invert"
            />
          </Link>
          <p className="text-lg mt-4">Discover the perfect venue for your next event.</p>
        </div>
      </div>

      {/* Form Section */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col items-center justify-center bg-white p-6 lg:p-0">
        {/* Mobile Logo and Title */}
        <div className="lg:hidden flex flex-col items-center mb-8 text-center">
          <Link href="/" className="transition-transform hover:scale-105 active:scale-95">
            <Image
              src="/logo.png"
              alt="Gobokin Logo"
              width={180}
              height={50}
              className="h-12 w-auto object-contain mb-4"
            />
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
