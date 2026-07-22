'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Star, X, ArrowLeft, Loader2 } from 'lucide-react';
import api from '@/services/api';
import Swal from "@/utils/sweetalert";
import { useAuth, setSharedReturnUrl } from '@/context/AuthContext';
import { Booking, Venue } from '@/types';
interface ReviewPageProps {
  params: Promise<{ slug: string }>;
}

const ReviewPage = ({ params }: ReviewPageProps) => {
  const { slug } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [venue, setVenue] = useState<Venue | null>(null);
  const [hallId, setVenueId] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hover, setHover] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setSharedReturnUrl(window.location.pathname);
      router.push('/auth/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch Venue Details
        let venueData;
        let actualVenueId: string;
        try {
          // Fetch using slug from URL
          const venueRes = await api.get(`/venues/${slug}`);
          venueData = venueRes.data.data;
          setVenue(venueData);
          actualVenueId = venueData._id || venueData.id;
          setVenueId(actualVenueId);
        } catch (err) {
          console.error('Error fetching venue:', err);
          setError('Failed to load venue details. The venue may no longer exist or the link is invalid.');
          setLoading(false);
          return;
        }

        // Fetch user's bookings to find an eligible one
        let userBookings = [];
        try {
          const bookingsRes = await api.get('/bookings/my-bookings');
          userBookings = bookingsRes.data.data || [];
        } catch (err) {
          console.error('Error fetching bookings:', err);
          setError('Failed to load your bookings. Please make sure you are logged in and have an active session.');
          setLoading(false);
          return;
        }

        // Ensure userBookings is an array before processing
        if (!Array.isArray(userBookings)) {
          console.error('User bookings is not an array:', userBookings);
          setError('We encountered an issue retrieving your booking history. Please try again later.');
          setLoading(false);
          return;
        }

        // Find eligible booking:
        // 1. Belongs to this venue
        // 2. Paid
        // 3. Most recent one
        const eligibleBooking = userBookings
          .filter((b: Booking) => {
            if (!b) return false;
            // Handle cases where venue might be null or missing
            const bVenueId = b.hall && typeof b.hall === 'object'
              ? (b.hall as { _id: string })._id
              : b.hall;

            if (!bVenueId) return false;

            // Loose comparison to handle potential ID format differences
            const isMatch = String(bVenueId) === String(actualVenueId);
            const isPaid = b.paymentStatus === 'paid';

            return isMatch && isPaid;
          })
          .sort((a: Booking, b: Booking) => {
            const dateA = a.bookingDates?.[0]?.startTime
              ? new Date(a.bookingDates[0].startTime).getTime()
              : 0;
            const dateB = b.bookingDates?.[0]?.startTime
              ? new Date(b.bookingDates[0].startTime).getTime()
              : 0;
            return dateB - dateA; // Most recent first
          })[0];

        if (!eligibleBooking) {
          setError('No eligible paid booking found for this venue. You can only review venues you have successfully booked and paid for.');
        } else {
          setBooking(eligibleBooking);
        }
      } catch (err: unknown) {
        console.error('Error in review data processing:', err);
        setError(`Something went wrong while preparing the page: ${err instanceof Error ? err.message : 'Unknown Error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || !venue) return;

    if (rating === 0) {
      Swal.fire('Error', 'Please provide a rating.', 'error');
      return;
    }
    if (!comment.trim()) {
      Swal.fire('Error', 'Please provide a comment.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/reviews/hall/${hallId}/booking/${booking._id}`, {
        rating,
        comment,
      });
      await Swal.fire({
        title: 'Success!',
        text: 'Your review has been submitted. Thank you for your feedback!',
        icon: 'success',
        confirmButtonColor: '#295FA7',
      });
      router.push(`/venues/${slug}`);
    } catch (err: unknown) {
      console.error('Error submitting review:', err);
      Swal.fire('Error', err instanceof Error ? err.message : 'Failed to submit review.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading review details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border border-gray-100">
          <div className="bg-red-50 text-red-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <X size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Cannot Write Review</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">{error}</p>
          <button
            onClick={() => router.push(`/venues/${slug}`)}
            className="w-full bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-all shadow-md"
          >
            Back to Venue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push(`/venues/${slug}`)}
          className="flex items-center text-gray-600 hover:text-primary mb-6 transition-colors group"
        >
          <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to {venue?.name || 'Venue'}
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-primary px-8 py-10 text-white text-center">
            <h1 className="text-3xl font-bold mb-2">Share Your Experience</h1>
            <p className="text-blue-100 opacity-90">How was your event at {venue?.name}?</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 lg:p-12 space-y-10">
            <div className="text-center">
              <label className="block text-lg font-semibold text-gray-800 mb-4">How would you rate it?</label>
              <div className="flex items-center justify-center space-x-2">
                {[...Array(5)].map((_, index) => {
                  const ratingValue = index + 1;
                  return (
                    <button
                      type="button"
                      key={index}
                      className="focus:outline-none transform transition-transform hover:scale-110 active:scale-95"
                      onClick={() => setRating(ratingValue)}
                      onMouseEnter={() => setHover(ratingValue)}
                      onMouseLeave={() => setHover(0)}
                    >
                      <Star
                        size={48}
                        className={`${
                          ratingValue <= (hover || rating)
                            ? 'fill-gray-400 text-gray-400'
                            : 'fill-transparent text-gray-300'
                        } transition-colors duration-200`}
                      />
                    </button>
                  );
                })}
              </div>
              {(hover || rating) > 0 && (
                <div className="mt-4 animate-fadeIn">
                  <span className="text-2xl font-black text-gray-400">
                    {(hover || rating).toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="comment" className="block text-lg font-semibold text-gray-800 mb-4">
                Tell us more about it
              </label>
              <textarea
                id="comment"
                rows={6}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 text-lg transition-all outline-none resize-none bg-gray-50/50"
                placeholder="What did you love about this venue? How was the service?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={submitting}
              ></textarea>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className={`w-full py-4 bg-primary text-white rounded-xl font-bold text-xl shadow-lg transition-all ${
                  submitting || !rating || !comment.trim()
                    ? 'opacity-50 cursor-not-allowed grayscale'
                    : 'hover:bg-opacity-90 hover:-translate-y-1 hover:shadow-2xl active:translate-y-0'
                } flex items-center justify-center`}
                disabled={submitting || !rating || !comment.trim()}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Submitting...
                  </>
                ) : 'Submit Review'}
              </button>
              <p className="text-center text-gray-400 mt-6 text-sm">
                Your review will help others find the perfect venue for their special moments.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;
