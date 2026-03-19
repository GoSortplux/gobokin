'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DateRange } from 'react-day-picker';
import { AnimatePresence, motion } from 'framer-motion';
import Carousel from '@/components/Carousel';
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
  const [, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const scrolled = useScroll(100);

  const shouldHideSearch = scrolled && !isSearchActive;

  const fetchVenues = useCallback(async (coords?: { latitude: number; longitude: number }) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (coords) {
        params.append('latitude', coords.latitude.toString());
        params.append('longitude', coords.longitude.toString());
      }

      const response = await api.get(`/halls/discovery?${params.toString()}`);
      const data = response.data.data;

      if (data && typeof data === 'object') {
        setDiscoveryData(data);
      } else {
        throw new Error('Invalid data format');
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
          setUserLocation(coords);
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
    params.set('minPrice', minPrice.toString());
    params.set('maxPrice', maxPrice.toString());

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

            {/* 2. Featured Venues (Large 2-box variant) */}
            {discoveryData.featuredVenues && discoveryData.featuredVenues.length > 0 && (
              <section>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">
                  {formatCategoryName('featuredVenues')}
                </h2>
                <Carousel
                  venues={discoveryData.featuredVenues}
                  slidesToShow={2}
                  variant="featured"
                />
              </section>
            )}

            {/* 3. All Other Categories */}
            {Object.entries(discoveryData).map(([key, venues]) => (
              venues.length > 0 && key !== 'popularVenues' && key !== 'featuredVenues' && (
                <section key={key}>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">
                    {formatCategoryName(key)}
                  </h2>
                  <Carousel venues={venues} />
                </section>
              )
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;
