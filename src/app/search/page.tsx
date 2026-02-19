'use client';

import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import VenueCard from '@/components/VenueCard';
import api from '@/services/api';
import { Venue } from '@/types/venue';
import CustomLoader from '@/components/CustomLoader';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import { translateError } from '@/utils/errors';
import ErrorState from '@/components/ErrorState';

const AnimatedVenueCard = ({ venue, index }: { venue: Venue; index: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(ref);
  const isInitiallyVisible = index < 6;

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${
        isVisible || isInitiallyVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      <VenueCard venue={venue} />
    </div>
  );
};

const SearchContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('Loading venues...');
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [minCapacity, setMinCapacity] = useState(searchParams.get('minCapacity') || '');
  const [minPrice, setMinPrice] = useState<number>(Number(searchParams.get('minPrice')) || 0);
  const [maxPrice, setMaxPrice] = useState<number>(Number(searchParams.get('maxPrice')) || 10000000);
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');

  const fetchWithParams = useCallback(async () => {
    const kw = searchParams.get('keyword') || '';
    const cap = searchParams.get('minCapacity') || '';
    const minP = Number(searchParams.get('minPrice')) || 0;
    const maxP = Number(searchParams.get('maxPrice')) || 10000000;
    const start = searchParams.get('startDate') || '';
    const end = searchParams.get('endDate') || '';

    setKeyword(kw);
    setMinCapacity(cap);
    setMinPrice(minP);
    setMaxPrice(maxP);
    setStartDate(start);
    setEndDate(end);

    setLoading(true);
    setLoadingMessage('Searching for venues...');
    try {
      const response = await api.get('/halls', {
        params: {
          keyword: kw || undefined,
          minCapacity: cap || undefined,
          minPrice: minP,
          maxPrice: maxP,
          startDate: start || undefined,
          endDate: end || undefined,
        },
      });

      let filteredVenues = response.data.data;

      if (Array.isArray(filteredVenues)) {
        /**
         * NOTE: Manual frontend filtering is necessary because the current backend
         * /venues endpoint ignores query parameters like keyword, minCapacity, and price.
         */

        // 1. Keyword / Location filter
        if (kw) {
          const lowerKw = kw.toLowerCase();
          filteredVenues = filteredVenues.filter((venue: Venue) =>
            venue.name.toLowerCase().includes(lowerKw) ||
            venue.location.toLowerCase().includes(lowerKw) ||
            (venue.description && venue.description.toLowerCase().includes(lowerKw))
          );
        }

        // 2. Capacity filter
        if (cap) {
          const minCap = parseInt(cap);
          if (!isNaN(minCap)) {
            filteredVenues = filteredVenues.filter((venue: Venue) => venue.capacity >= minCap);
          }
        }

        // 3. Price filter
        filteredVenues = filteredVenues.filter((venue: Venue) => {
          const rate = venue.pricing?.dailyRate || venue.pricing?.hourlyRate || 0;
          return rate >= minP && rate <= maxP;
        });

        // 4. Date availability filter
        if (start || end) {
          setLoadingMessage('Checking availability...');
          /**
           * Since the backend doesn't support filtering by availability in the list view,
           * we check each venue individually. This is an N+1 operation, but necessary
           * until backend support is added.
           */
          const availabilityResults = await Promise.all(
            filteredVenues.map(async (venue: Venue) => {
              try {
                const res = await api.get(`/halls/${venue._id}/unavailable-dates`, {
                  params: { startDate: start || end, endDate: end || start }
                });
                // If data array is empty, it means no bookings/blocks in that range
                return res.data.data.length === 0 ? venue : null;
              } catch (err) {
                console.error(`Error checking availability for venue ${venue._id}:`, err);
                // If availability check fails, we exclude the venue to be safe
                return null;
              }
            })
          );
          filteredVenues = availabilityResults.filter((h): h is Venue => h !== null);
        }

        setVenues(filteredVenues);
      } else {
        setVenues([]);
      }
      setError('');
    } catch (error) {
      console.error('Error fetching venues:', error);
      setError(translateError(error));
      setVenues([]);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchWithParams();
  }, [fetchWithParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword) params.set('keyword', keyword);
    if (minCapacity) params.set('minCapacity', minCapacity);
    params.set('minPrice', minPrice.toString());
    params.set('maxPrice', maxPrice.toString());
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="container mx-auto px-4 pt-24 pb-8">
      <h1 className="text-3xl font-bold mb-8">Search for Venue</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1">
          {/* Filter section */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6 text-gray-900">Filters</h2>
            <form onSubmit={handleSearch} className="space-y-6">
              <div>
                <label htmlFor="keyword" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Keyword / Location
                </label>
                <input
                  type="text"
                  id="keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="block w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 sm:text-sm text-gray-700 font-medium placeholder:text-gray-300 transition-all"
                  placeholder="Where are you going?"
                />
              </div>
              <div>
                <label htmlFor="startDate" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 sm:text-sm text-gray-700 font-medium transition-all"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 sm:text-sm text-gray-700 font-medium transition-all"
                />
              </div>
              <div>
                <label htmlFor="minCapacity" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Minimum Capacity
                </label>
                <input
                  type="number"
                  id="minCapacity"
                  value={minCapacity}
                  onChange={(e) => setMinCapacity(e.target.value)}
                  className="block w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 sm:text-sm text-gray-700 font-medium placeholder:text-gray-300 transition-all"
                  placeholder="How many guests?"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Price Range (₦)
                </label>
                <div className="space-y-2">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(Number(e.target.value))}
                    className="block w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 sm:text-sm text-gray-700 font-medium transition-all"
                    placeholder="Min Price"
                  />
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="block w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 sm:text-sm text-gray-700 font-medium transition-all"
                    placeholder="Max Price"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-white py-4 px-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95"
              >
                Update Results
              </button>
            </form>
          </div>
        </div>
        <div className="col-span-3">
          {/* Search results */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <CustomLoader size={48} className="mb-4" />
              <p className="text-gray-400 font-black uppercase text-[10px] tracking-[0.3em] animate-pulse">{loadingMessage}</p>
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={fetchWithParams} />
          ) : (
            <>
              {venues.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {venues.map((venue, index) => (
                    <AnimatedVenueCard key={venue._id} venue={venue} index={index} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No venues found</h3>
                  <p className="text-gray-500 max-w-xs">We couldn&apos;t find any venues matching your current filters. Try broadening your search.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const SearchPage = () => {
  return (
    <Suspense fallback={<div className="pt-24 text-center">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
};

export default SearchPage;
