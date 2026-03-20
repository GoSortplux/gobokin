'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Venue } from '@/types/venue';
import VenueCard from './VenueCard';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';

interface FeaturedShowcaseProps {
  venues: Venue[];
  interval?: number; // In milliseconds
}

const FeaturedShowcase = ({ venues, interval = 8000 }: FeaturedShowcaseProps) => {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(containerRef, { threshold: 0.1 });

  useEffect(() => {
    if (venues.length <= 2 || !isVisible || isPaused) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 2) % venues.length);
    }, interval);

    return () => clearInterval(timer);
  }, [venues.length, interval, isVisible, index, isPaused]);

  const handleNext = () => {
    setIndex((prev) => (prev + 2) % venues.length);
  };

  const handlePrev = () => {
    setIndex((prev) => (prev - 2 + venues.length) % venues.length);
  };

  if (venues.length === 0) return null;

  // For very few venues, just show them without rotation
  const displayVenues = venues.length <= 2
    ? venues
    : [venues[index], venues[(index + 1) % venues.length]];

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative py-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 relative">
        {/* Navigation Arrows (Desktop) */}
        {venues.length > 2 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute -left-4 lg:-left-8 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-xl border border-gray-100 text-gray-700 hover:text-primary hover:bg-white transition-all duration-300 hidden md:block group/arrow"
              aria-label="Previous featured venues"
            >
              <ChevronLeft className="w-6 h-6 group-hover/arrow:-translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={handleNext}
              className="absolute -right-4 lg:-right-8 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-xl border border-gray-100 text-gray-700 hover:text-primary hover:bg-white transition-all duration-300 hidden md:block group/arrow"
              aria-label="Next featured venues"
            >
              <ChevronRight className="w-6 h-6 group-hover/arrow:translate-x-0.5 transition-transform" />
            </button>
          </>
        )}

        <AnimatePresence mode="popLayout">
          {displayVenues.map((venue, i) => (
            <motion.div
              key={`${venue._id}-${index}-${i}`}
              initial={{ opacity: 0, x: 40, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -40, scale: 0.98 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay: i * 0.15 }}
              className="h-full"
            >
              <VenueCard venue={venue} variant="featured" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination and Progress */}
      {venues.length > 2 && (
        <div className="mt-8 flex flex-col items-center space-y-4">
          <div className="flex justify-center space-x-2">
            {Array.from({ length: Math.ceil(venues.length / 2) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i * 2)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  Math.floor(index / 2) === i ? 'w-10 bg-primary' : 'w-2 bg-gray-300'
                }`}
                aria-label={`Go to featured set ${i + 1}`}
              />
            ))}
          </div>

          {/* Progress bar */}
          {isVisible && (
            <div className="w-48 h-1 bg-gray-200/50 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                key={`${index}-${isPaused}`}
                initial={{ width: 0 }}
                animate={{ width: isPaused ? '0%' : '100%' }}
                transition={{
                  duration: isPaused ? 0 : interval / 1000,
                  ease: 'linear'
                }}
                className="h-full bg-primary/40"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(FeaturedShowcase);
