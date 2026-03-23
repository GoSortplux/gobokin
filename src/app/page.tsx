'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DateRange } from 'react-day-picker';
import { AnimatePresence, motion } from 'framer-motion';
import Carousel from '@/components/Carousel';
import FeaturedShowcase from '@/components/FeaturedShowcase';
import SkeletonCard from '@/components/SkeletonCard';
import SearchBar from '@/components/SearchBar';
import api from '@/services/api';
import useScroll from '@/hooks/useScroll';
import { Venue } from '@/types/venue';
import { translateError } from '@/utils/errors';
import ErrorState from '@/components/ErrorState';

interface DiscoveryData {
  [key: string]: Venue[];
}

const HomePage = () => {
  const router = useRouter();
  const [discoveryData, setDiscoveryData] = useState<DiscoveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const scrolled = useScroll(100);

  const shouldHideSearch = scrolled && !isSearchActive;

  const fetchVenues = useCallback(async (coords?: { latitude: number; longitude: number }) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (coords && coords.latitude != null && coords.longitude != null) {
        params.append('latitude', String(coords.latitude));
        params.append('longitude', String(coords.longitude));
      }

      // Fetch both categorized discovery data and all halls for fallback in parallel
      const [discoveryResult, hallsResult] = await Promise.allSettled([
        api.get(`/halls/discovery?${params.toString()}`),
        api.get('/halls')
      ]);

      const discData = discoveryResult.status === 'fulfilled' ? (discoveryResult.value.data.data as DiscoveryData) : null;
      const allHalls: Venue[] = hallsResult.status === 'fulfilled' ? (hallsResult.value.data.data || []) : [];

      // Check if discovery API returned any actual venues in any category
      const hasDiscoveryVenues = discData && typeof discData === 'object' &&
        Object.values(discData).some((venues: Venue[]) => Array.isArray(venues) && venues.length > 0);

      if (hasDiscoveryVenues && discData) {
        // Use ONLY discovery data if it has venues
        setDiscoveryData(discData);
      } else if (allHalls.length > 0) {
        // Fallback to manual categories using all halls data if discovery API failed or is empty
        const fallback: DiscoveryData = {
          largeCapacityVenues: [...allHalls]
            .filter(v => (v.capacity || 0) >= 500)
            .sort((a, b) => (b.capacity || 0) - (a.capacity || 0))
            .slice(0, 10),
          budgetFriendlyVenues: [...allHalls]
            .filter(v => (v.pricing?.dailyRate || 0) > 0 && (v.pricing?.dailyRate || 0) <= 150000)
            .sort((a, b) => (a.pricing?.dailyRate || 0) - (b.pricing?.dailyRate || 0))
            .slice(0, 10),
          newlyAddedVenues: [...allHalls]
            .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
            .slice(0, 10),
        };
        setDiscoveryData(fallback);
      } else {
        // If we get here, either both failed or both returned empty
        if (discoveryResult.status === 'rejected') throw discoveryResult.reason;
        if (hallsResult.status === 'rejected') throw hallsResult.reason;
        throw new Error('No venues available at the moment');
      }
    } catch (err) {
      console.error('Failed to fetch discovery venues:', err);
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchVenues();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          // Refetch with location data for 'Closest' category
          fetchVenues(coords);
        },
        (error) => {
          console.error('Error getting geolocation:', error);
        }
      );
    }
  }, [fetchVenues]);

  const handleSearch = (filters: { location: string; dateRange: DateRange | undefined; capacity: string; priceRange: [number, number] }) => {
    const { location, capacity, priceRange, dateRange } = filters;
    const [minPrice, maxPrice] = priceRange;

    const params = new URLSearchParams();
    if (location) params.set('keyword', location);
    if (capacity && capacity !== 'Any') {
      const match = capacity.match(/(\d+)/);
      if (match) params.set('minCapacity', match[0]);
    }
    params.set('minPrice', (minPrice ?? 0).toString());
    params.set('maxPrice', (maxPrice ?? 10000000).toString());

    if (dateRange?.from) {
      params.set('startDate', dateRange.from.toISOString().split('T')[0]);
    }
    if (dateRange?.to) {
      params.set('endDate', dateRange.to.toISOString().split('T')[0]);
    }

    router.push(`/search?${params.toString()}`);
  };

  const formatCategoryName = (key: string) => {
    const overrides: Record<string, string> = {
      featuredVenues: 'Featured Venues',
      popularVenues: 'Popular Venues',
      closestVenues: 'Closest to You',
      highlyRatedVenues: 'Highly Rated',
      newlyAddedVenues: 'Newly Added',
      premiumVenues: 'Premium Venues',
      largeCapacityVenues: 'Large Capacity Venues',
      budgetFriendlyVenues: 'Budget Friendly',
    };

    if (overrides[key]) return overrides[key];

    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 pt-20 pb-8 sm:px-6 lg:px-8">
        <div className="text-center mb-16 md:mb-20">
          <h1 className="text-xl sm:text-3xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight px-2 pt-8">
            Find the perfect venue for your next event
          </h1>
          <p className="mt-3 md:mt-4 text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            Browse through our curated list of venues and book with ease.
          </p>
          <div className="mt-6 md:mt-8">
            <AnimatePresence>
              {!shouldHideSearch && (
                <motion.div
                  initial={{ opacity: 1, height: 'auto' }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <SearchBar onSearch={handleSearch} onActiveChange={setIsSearchActive} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {loading && (
          <div className="space-y-16 md:space-y-20">
            {[1, 2].map((section) => (
              <section key={section}>
                <div className="h-8 bg-gray-200 rounded-lg w-48 mb-4 md:mb-6 animate-pulse"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {error && (
            <ErrorState
                message={error}
                onRetry={fetchVenues}
                className="mt-8"
            />
        )}

        {!loading && !error && discoveryData && (
          <div className="space-y-16 md:space-y-20">
            {/* 1. Popular Venues (If any) */}
            {discoveryData.popularVenues && discoveryData.popularVenues.length > 0 && (
              <section>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">
                  {formatCategoryName('popularVenues')}
                </h2>
                <Carousel venues={discoveryData.popularVenues} />
              </section>
            )}

            {/* 2. Featured Venues (Hero Showcase) */}
            {discoveryData.featuredVenues && discoveryData.featuredVenues.length > 0 && (
              <section className="relative">
                <div className="flex justify-between items-end mb-8 md:mb-12">
                  <div className="space-y-2">
                    <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">
                      {formatCategoryName('featuredVenues')}
                    </h2>
                    <p className="text-sm md:text-lg text-gray-600 max-w-2xl font-medium">
                      Our handpicked selection of premium venues, curated for excellence and unforgettable experiences.
                    </p>
                  </div>
                </div>

                <div className="relative">
                  {/* Decorative background elements */}
                  <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
                  <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -z-10" />

                  <FeaturedShowcase venues={discoveryData.featuredVenues} />
                </div>
              </section>
            )}

            {/* 3. Ordered & Remaining Categories */}
            {(() => {
              const CATEGORY_ORDER = [
                'closestVenues',
                'highlyRatedVenues',
                'newlyAddedVenues',
                'largeCapacityVenues',
                'budgetFriendlyVenues',
              ];

              const renderedKeys = new Set(['popularVenues', 'featuredVenues', 'premiumVenues']);
              const sections = [];

              // First, render categories in specific order
              for (const key of CATEGORY_ORDER) {
                if (discoveryData[key] && discoveryData[key].length > 0) {
                  sections.push(
                    <section key={key}>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">
                        {formatCategoryName(key)}
                      </h2>
                      <Carousel venues={discoveryData[key]} />
                    </section>
                  );
                  renderedKeys.add(key);
                }
              }

              // Then, render any remaining categories from the API
              for (const [key, venues] of Object.entries(discoveryData)) {
                if (venues.length > 0 && !renderedKeys.has(key)) {
                  sections.push(
                    <section key={key}>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">
                        {formatCategoryName(key)}
                      </h2>
                      <Carousel venues={venues} />
                    </section>
                  );
                }
              }

              // Finally, render Premium Venues at the absolute bottom for maximum distance
              if (discoveryData.premiumVenues && discoveryData.premiumVenues.length > 0) {
                sections.push(
                  <section key="premiumVenues" className="relative pt-16 md:pt-24">
                    <div className="flex justify-between items-end mb-8 md:mb-12">
                      <div className="space-y-2">
                        <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">
                          {formatCategoryName('premiumVenues')}
                        </h2>
                        <p className="text-sm md:text-lg text-gray-600 max-w-2xl font-medium">
                          Experience luxury and elegance at our most exclusive event spaces.
                        </p>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
                      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -z-10" />
                      <FeaturedShowcase venues={discoveryData.premiumVenues} badge="Premium Venue" />
                    </div>
                  </section>
                );
              }

              return sections;
            })()}
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;
