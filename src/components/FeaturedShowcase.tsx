'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Users, Star, MapPin, ArrowRight, Zap, Wifi, Car, Wind, Utensils } from 'lucide-react';
import { Venue } from '@/types/venue';
import Link from 'next/link';
import { createVenueSlug } from '@/utils/slugify';
import MediaThumbnail from './MediaThumbnail';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';

interface FeaturedShowcaseProps {
  venues: Venue[];
  interval?: number; // In milliseconds
}

const FeaturedShowcase = ({ venues, interval = 12000 }: FeaturedShowcaseProps) => {
  const [index, setIndex] = useState(0);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(containerRef, { threshold: 0.1 });

  const currentVenue = venues[index];
  const media = [...(currentVenue?.videos || []), ...(currentVenue?.images || [])];

  // Venue cycling effect
  useEffect(() => {
    if (venues.length <= 1 || !isVisible || isPaused) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % venues.length);
      setMediaIndex(0); // Reset media index when venue changes
    }, interval);

    return () => clearInterval(timer);
  }, [venues.length, interval, isVisible, isPaused]);

  // Media cycling effect (within current venue)
  useEffect(() => {
    if (media.length <= 1 || !isVisible || isPaused) return;

    const mediaInterval = interval / 3; // Cycle media 3 times per venue slide
    const mediaTimer = setInterval(() => {
      setMediaIndex((prev) => (prev + 1) % Math.min(media.length, 3)); // Cycle first 3 media items
    }, mediaInterval);

    return () => clearInterval(mediaTimer);
  }, [media.length, interval, isVisible, isPaused, index]);

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % venues.length);
    setMediaIndex(0);
  };

  const handlePrev = () => {
    setIndex((prev) => (prev - 1 + venues.length) % venues.length);
    setMediaIndex(0);
  };

  if (venues.length === 0) return null;

  const slug = createVenueSlug(currentVenue.name, currentVenue._id, currentVenue.slug);

  // Facility Icon Mapper
  const getFacilityIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('wifi')) return <Wifi className="w-3 h-3 md:w-3.5 h-3.5 mr-1" />;
    if (n.includes('park')) return <Car className="w-3 h-3 md:w-3.5 h-3.5 mr-1" />;
    if (n.includes('ac') || n.includes('air')) return <Wind className="w-3 h-3 md:w-3.5 h-3.5 mr-1" />;
    if (n.includes('food') || n.includes('catering')) return <Utensils className="w-3 h-3 md:w-3.5 h-3.5 mr-1" />;
    return null;
  };

  // Get top 4 facilities as "Strong Triggers"
  const topFacilities = currentVenue.facilities
    ?.filter(f => f.available)
    ?.slice(0, 4) || [];

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full overflow-hidden rounded-3xl md:rounded-[40px] shadow-2xl bg-gray-900 group/hero"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentVenue._id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="relative aspect-[4/5] sm:aspect-[16/10] md:aspect-[21/9] w-full"
        >
          {/* Background Image/Video - with inner cycling */}
          <div className="absolute inset-0 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentVenue._id}-${mediaIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute inset-0"
              >
                <MediaThumbnail
                  url={media[mediaIndex]}
                  alt={currentVenue.name}
                  fill
                  className="object-cover"
                  priority
                />
              </motion.div>
            </AnimatePresence>
            {/* Gradient Overlays - Optimized for visibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 md:bg-gradient-to-r md:from-black/90 md:via-black/20 md:to-transparent" />
          </div>

          {/* Content Panel */}
          <div className="absolute inset-0 flex flex-col justify-end md:justify-center p-6 pb-20 pr-16 md:p-12 lg:p-16 text-white max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="space-y-3 md:space-y-6"
            >
              <div className="flex items-center space-x-3">
                <span className="bg-primary px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest flex items-center shadow-lg">
                  <Zap className="w-3 h-3 mr-1 fill-current" />
                  Featured Venue
                </span>
                {currentVenue.averageRating > 0 && (
                  <div className="flex items-center bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 mr-1.5" />
                    <span className="text-xs md:text-sm font-bold">{currentVenue.averageRating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1 md:space-y-2">
                <h3 className="text-lg md:text-4xl lg:text-5xl font-black tracking-tight leading-tight line-clamp-2 overflow-hidden text-ellipsis drop-shadow-lg">
                  {currentVenue.name}
                </h3>
                <div className="flex items-center text-gray-200 text-[10px] md:text-lg font-medium">
                  <MapPin className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-1.5 text-primary" />
                  {currentVenue.location}
                </div>
              </div>

              <p className="text-gray-300 text-[10px] md:text-lg line-clamp-2 md:line-clamp-2 max-w-xl leading-relaxed font-medium">
                {currentVenue.description || "Experience the perfect blend of elegance and functionality at this premier venue. Ideal for corporate events, weddings, and private celebrations."}
              </p>

              {/* Strong Triggers - Facilities */}
              {topFacilities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 md:gap-2 pt-1">
                  {topFacilities.map((f, i) => {
                    const name = f.name || f.facility?.name || '';
                    return (
                      <span key={i} className="bg-white/15 backdrop-blur-md px-2 md:px-3 py-1 rounded-full text-[9px] md:text-xs font-bold flex items-center border border-white/10 shadow-sm transition-transform hover:scale-105">
                        {getFacilityIcon(name)}
                        {name}
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 md:gap-8 pt-0.5 md:pt-2">
                <div className="flex flex-col">
                  <span className="text-[8px] md:text-xs uppercase text-gray-400 font-bold tracking-wider">Capacity</span>
                  <div className="flex items-center space-x-1 md:space-x-2">
                    <Users className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                    <span className="text-sm md:text-xl font-bold">{currentVenue.capacity?.toLocaleString() || 'N/A'}</span>
                  </div>
                </div>

                <div className="h-6 md:h-10 w-px bg-white/10" />

                <div className="flex flex-col">
                  <span className="text-[8px] md:text-xs uppercase text-gray-400 font-bold tracking-wider">Starting From</span>
                  <div className="flex items-baseline space-x-0.5 md:space-x-1">
                    <span className="text-base md:text-3xl font-black text-white">
                      ₦{(currentVenue.pricing?.hourlyRate && currentVenue.pricing.hourlyRate > 0
                        ? currentVenue.pricing.hourlyRate
                        : currentVenue.pricing?.dailyRate || 0).toLocaleString()}
                    </span>
                    <span className="text-[8px] md:text-sm text-gray-400">
                      /{currentVenue.pricing?.hourlyRate && currentVenue.pricing.hourlyRate > 0 ? 'hr' : 'day'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-2 md:pt-4">
                <Link
                  href={`/venues/${slug}`}
                  className="bg-primary hover:bg-primary-dark text-white px-6 md:px-8 py-2.5 md:py-4 rounded-full font-bold text-xs md:text-base transition-all duration-300 flex items-center group/btn shadow-xl shadow-primary/20"
                >
                  View Details
                  <ArrowRight className="ml-1.5 w-3.5 h-3.5 md:ml-2 md:w-4 md:h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>

                {/* Visual indicator of other media */}
                {media.length > 1 && (
                  <div className="hidden md:flex -space-x-3 overflow-hidden">
                    {media.slice(1, 4).map((m, i) => (
                      <div key={i} className="inline-block h-10 w-10 rounded-full border-2 border-white/20 overflow-hidden backdrop-blur-sm">
                        <MediaThumbnail url={m} alt="" fill className="object-cover opacity-60" />
                      </div>
                    ))}
                    {media.length > 4 && (
                      <div className="flex items-center justify-center h-10 w-10 rounded-full border-2 border-white/20 bg-black/40 text-[10px] font-bold backdrop-blur-md">
                        +{media.length - 4}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      {venues.length > 1 && (
        <>
          {/* Arrow Buttons */}
          <div className="absolute top-1/2 -translate-y-1/2 right-3 md:right-8 flex flex-col space-y-2 md:space-y-4 z-20">
            <button
              onClick={handlePrev}
              className="p-2 md:p-4 bg-white/10 hover:bg-primary backdrop-blur-md text-white rounded-full border border-white/20 transition-all duration-300 shadow-xl"
              aria-label="Previous venue"
            >
              <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 md:p-4 bg-white/10 hover:bg-primary backdrop-blur-md text-white rounded-full border border-white/20 transition-all duration-300 shadow-xl"
              aria-label="Next venue"
            >
              <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
            </button>
          </div>

          {/* Progress & Pagination */}
          <div className="absolute bottom-4 md:bottom-10 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-12 z-20 flex flex-col items-center md:items-end space-y-3 md:space-y-4">
             <div className="flex space-x-2">
                {venues.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    className={`h-1.5 transition-all duration-500 rounded-full ${
                      index === i ? 'w-8 bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]' : 'w-2 bg-white/30 hover:bg-white/50'
                    }`}
                    aria-label={`Go to venue ${i + 1}`}
                  />
                ))}
              </div>

              {/* Progress bar (timer) */}
              {isVisible && (
                <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                  <motion.div
                    key={`${index}-${isPaused}`}
                    initial={{ width: 0 }}
                    animate={{ width: isPaused ? '0%' : '100%' }}
                    transition={{
                      duration: isPaused ? 0 : interval / 1000,
                      ease: 'linear'
                    }}
                    className="h-full bg-primary"
                  />
                </div>
              )}
          </div>
        </>
      )}
    </div>
  );
};

export default React.memo(FeaturedShowcase);
