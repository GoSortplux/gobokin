'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Venue } from '@/types/venue';
import VenueCard from './VenueCard';

interface FeaturedShowcaseProps {
  venues: Venue[];
  interval?: number; // In milliseconds
}

const FeaturedShowcase = ({ venues, interval = 5000 }: FeaturedShowcaseProps) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (venues.length <= 2) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 2) % venues.length);
    }, interval);

    return () => clearInterval(timer);
  }, [venues.length, interval, index]); // Adding index to reset timer on manual change

  if (venues.length === 0) return null;

  // For very few venues, just show them without rotation
  const displayVenues = venues.length <= 2
    ? venues
    : [venues[index], venues[(index + 1) % venues.length]];

  return (
    <div className="relative overflow-hidden py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <AnimatePresence mode="wait">
          {displayVenues.map((venue, i) => (
            <motion.div
              key={`${venue._id}-${index}-${i}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: 'easeInOut', delay: i * 0.1 }}
              className="h-full"
            >
              <VenueCard venue={venue} variant="featured" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {venues.length > 2 && (
        <div className="mt-6 flex justify-center space-x-2">
          {Array.from({ length: Math.ceil(venues.length / 2) }).map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i * 2)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                Math.floor(index / 2) === i ? 'w-8 bg-primary' : 'w-2 bg-gray-300'
              }`}
              aria-label={`Go to featured set ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FeaturedShowcase;
