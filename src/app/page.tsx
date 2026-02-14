'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DateRange } from 'react-day-picker';
import Carousel from '@/components/Carousel';
import SkeletonCard from '@/components/SkeletonCard';
import SearchBar from '@/components/SearchBar';
import api from '@/services/api';
import useScroll from '@/hooks/useScroll';
import { Hall } from '@/types/hall';
import { translateError } from '@/utils/errors';
import ErrorState from '@/components/ErrorState';

const HomePage = () => {
  const router = useRouter();
  const [allHalls, setAllHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const scrolled = useScroll(100);

  const fetchHalls = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/halls');
      const hallsData = response.data.data;

      if (Array.isArray(hallsData)) {
        setAllHalls(hallsData);
      } else {
        throw new Error('Invalid data format');
      }
    } catch (err) {
      console.error('Failed to fetch halls:', err);
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHalls();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting geolocation:', error);
        }
      );
    }
  }, [fetchHalls]);

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

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const popularHalls = useMemo(() => {
    return [...allHalls].sort((a, b) => (b.views || 0) - (a.views || 0));
  }, [allHalls]);

  const closestHalls = useMemo(() => {
    if (!userLocation) return [];
    return allHalls
      .filter((hall) => hall.geoLocation?.coordinates && hall.geoLocation.coordinates.length === 2)
      .map((hall) => ({
        ...hall,
        distance: calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          hall.geoLocation!.coordinates[1],
          hall.geoLocation!.coordinates[0]
        ),
      }))
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }, [allHalls, userLocation]);

  const largeCapacityHalls = useMemo(() => {
    return allHalls.filter((hall) => hall.capacity >= 500);
  }, [allHalls]);

  const budgetFriendlyHalls = useMemo(() => {
    return allHalls.filter(
      (hall) => (hall.pricing?.dailyRate || 0) <= 200000 && (hall.pricing?.dailyRate || 0) > 0
    );
  }, [allHalls]);

  const newlyAddedHalls = useMemo(() => {
    return [...allHalls].sort((a, b) => {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [allHalls]);

  const highlyRatedHalls = useMemo(() => {
    return allHalls.filter((hall) => hall.averageRating >= 4);
  }, [allHalls]);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 pt-20 pb-8 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-xl sm:text-3xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight px-2 pt-8">
            Find the perfect venue for your next event
          </h1>
          <p className="mt-3 md:mt-4 text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            Browse through our curated list of venues and book with ease.
          </p>
          <div className="mt-6 md:mt-8">
            {!scrolled && <SearchBar onSearch={handleSearch} />}
          </div>
        </div>

        {loading && (
          <div className="space-y-8 md:space-y-12">
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
                onRetry={fetchHalls}
                className="mt-8"
            />
        )}

        {!loading && !error && (
          <div className="space-y-8 md:space-y-12">
            <section>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Featured Venue</h2>
              <Carousel halls={allHalls.slice(0, 7)} />
            </section>

            {popularHalls.length > 0 && (
              <section>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Popular Venue</h2>
                <Carousel halls={popularHalls} />
              </section>
            )}

            {closestHalls.length > 0 && (
              <section>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Closest to You</h2>
                <Carousel halls={closestHalls} />
              </section>
            )}

            {highlyRatedHalls.length > 0 && (
              <section>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Highly Rated</h2>
                <Carousel halls={highlyRatedHalls} />
              </section>
            )}

            {newlyAddedHalls.length > 0 && (
              <section>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Newly Added</h2>
                <Carousel halls={newlyAddedHalls} />
              </section>
            )}

            {largeCapacityHalls.length > 0 && (
              <section>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Large Capacity Venue</h2>
                <Carousel halls={largeCapacityHalls} />
              </section>
            )}

            {budgetFriendlyHalls.length > 0 && (
              <section>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Budget Friendly</h2>
                <Carousel halls={budgetFriendlyHalls} />
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;
