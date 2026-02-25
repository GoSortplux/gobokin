'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { VIEW_COUNT_ROLES } from '@/constants/auth';
import api from '@/services/api';
import BookingModal, { FacilityWithQuantity } from '@/components/BookingModal';
import DemoModal from '@/components/DemoModal';
import { useUI } from '@/context/UIContext';
import ReviewCard from '@/components/ReviewCard';
import Calendar from '@/components/Calendar';
import VenueDetailSkeleton from '@/components/VenueDetailSkeleton';
import Carousel from '@/components/Carousel';
import MediaViewerModal from '@/components/MediaViewerModal';
import { isVideo, getMediaThumbnail } from '@/utils/media';
import { useBookingAvailability } from '@/hooks/useBookingAvailability';
import { translateError } from '@/utils/errors';
import { Venue, Review, Suitability } from '@/types';
import FacilityIcon from '@/components/FacilityIcon';
import ErrorState from '@/components/ErrorState';
import {
  CheckCircle,
  CircleDollarSign,
  Eye,
  Star,
  AlertTriangle,
  Sparkles,
  Gift,
  Church,
  Heart,
  Users,
  Play,
  Share2,
  MapPin
} from 'lucide-react';
import Swal from "@/utils/sweetalert";

interface VenueDetailClientProps {
  slugOrId: string;
  initialVenue?: Venue | null;
}

const VenueDetailClient = ({ slugOrId, initialVenue }: VenueDetailClientProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const canSeeViews = user && VIEW_COUNT_ROLES.includes(user.activeRole);
  const [venue, setVenue] = useState<Venue | null>(initialVenue || null);
  const [recommendations, setRecommendations] = useState<Venue[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(!initialVenue);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [error, setError] = useState('');
  const [recommendationsUnavailable, setRecommendationsUnavailable] = useState(false);
  const { isBookingModalOpen, openBookingModal, closeBookingModal } = useUI();
  const [bookingMode, setBookingMode] = useState('book');
  const [initialSelectedDates, setInitialSelectedDates] = useState<Date[] | undefined>(undefined);
  const [initialStep, setInitialStep] = useState(1);
  const [initialEventDetails, setInitialEventDetails] = useState('');
  const [initialStartTime, setInitialStartTime] = useState('08:00');
  const [initialEndTime, setInitialEndTime] = useState('22:00');
  const [initialSelectedFacilities, setInitialSelectedFacilities] = useState<FacilityWithQuantity[]>([]);
  const [displayedMonth, setDisplayedMonth] = useState<Date>(new Date());
  const [isDemoModalOpen, setDemoModalOpen] = useState(false);
  const [ownerContact, setOwnerContact] = useState({ phone: '' });
  const [isMediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  const { getDateAvailability } = useBookingAvailability(venue, undefined, displayedMonth);

  const isOnlineBookingEnabled = venue?.isOnlineBookingEnabled !== false;

  const handleContactOwner = useCallback(async () => {
    if (!user) {
      localStorage.setItem('pendingAction', JSON.stringify({ hallId: slugOrId, action: 'contactOwner' }));
      localStorage.setItem('returnUrl', window.location.pathname + window.location.search);
      Swal.fire({
        title: 'Want to reach out to the owner?',
        text: 'Please log in to view the contact details.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Log In',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#295FA7',
        cancelButtonColor: '#d33',
      }).then((result) => {
        if (result.isConfirmed) {
          router.push('/auth/login');
        }
      });
      return;
    }
    try {
      const targetId = venue?._id || venue?.id || slugOrId;
      const response = await api.post(`/halls/${targetId}/book-demo`);
      setOwnerContact(response.data.data);
      setDemoModalOpen(true);
    } catch (err: unknown) {
      console.error(`Failed to contact owner for venue with id ${slugOrId}:`, err);
      setError(translateError(err));
    }
  }, [slugOrId, user, router, venue]);

  const fetchVenueAndRecommendations = useCallback(async (isInitial: boolean = false) => {
    if (!slugOrId) return;

    if (!isInitial) {
      setLoading(true);
    }
    setError('');
    setRecommendations([]);

    try {
      let currentVenue = venue;

      if (!isInitial || !currentVenue) {
        const venueResponse = await api.get<{ data: Venue }>(`/halls/${slugOrId}`);
        currentVenue = venueResponse.data.data;
        setVenue(currentVenue);
      }

      if (!currentVenue) return;

      // Fetch recommendations only if geoLocation data is available
      if (currentVenue.geoLocation?.coordinates && currentVenue.geoLocation.coordinates.length === 2) {
        const longitude = currentVenue.geoLocation.coordinates[0];
        const latitude = currentVenue.geoLocation.coordinates[1];
        api.get<{ data: Venue[] }>(
          `/halls/recommendations`,
          {
            params: { latitude, longitude },
          }
        ).then(recommendationsResponse => {
          setRecommendations(recommendationsResponse.data.data || []);
        }).catch(recErr => {
          if (recErr.response?.status === 500) {
            setRecommendationsUnavailable(true);
          }
          console.error('Failed to fetch recommendations:', recErr);
          setRecommendations([]);
        });
      }

      // Fetch reviews
      setReviewsLoading(true);
      const targetId = currentVenue?._id || currentVenue?.id || slugOrId;
      api.get<{ data: Review[] }>(`/reviews/hall/${targetId}`)
        .then(reviewsResponse => {
          setReviews(reviewsResponse.data.data || []);
        })
        .catch(revErr => {
          console.error('Failed to fetch reviews:', revErr);
        })
        .finally(() => {
          setReviewsLoading(false);
        });

    } catch (err) {
      console.error(`Failed to fetch venue with id ${slugOrId}:`, err);
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  }, [slugOrId, venue]);

  useEffect(() => {
    // Restore state from localStorage if it exists
    const pendingBooking = localStorage.getItem('pendingBooking');
    if (pendingBooking) {
      const data = JSON.parse(pendingBooking);
      if (data.hallId === slugOrId) {
        setBookingMode(data.bookingMode);
        setInitialSelectedDates(data.selectedDates?.map((d: string) => new Date(d)));
        setInitialEventDetails(data.eventDetails);
        setInitialStartTime(data.startTime);
        setInitialEndTime(data.endTime);
        setInitialSelectedFacilities(data.selectedFacilities);
        setInitialStep(data.step);
        openBookingModal();
      }
      localStorage.removeItem('pendingBooking');
    }

    const pendingAction = localStorage.getItem('pendingAction');
    if (pendingAction) {
      const data = JSON.parse(pendingAction);
      if (data.hallId === slugOrId && data.action === 'contactOwner') {
        handleContactOwner();
      }
      localStorage.removeItem('pendingAction');
    }

    fetchVenueAndRecommendations(!!initialVenue);
  }, [slugOrId, handleContactOwner, openBookingModal, fetchVenueAndRecommendations, initialVenue, venue]);

  if (loading) {
    return <VenueDetailSkeleton />;
  }

  if (error) {
    return (
        <div className="pt-32 pb-20">
            <ErrorState message={error} onRetry={fetchVenueAndRecommendations} />
        </div>
    );
  }

  if (!venue) {
    return (
        <div className="pt-32 pb-20">
            <ErrorState message="We couldn't find the venue you're looking for." />
        </div>
    );
  }

  const openMediaViewer = (index: number) => {
    setSelectedMediaIndex(index);
    setMediaViewerOpen(true);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: venue?.name,
        text: `Check out ${venue?.name} on GoBokin!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      Swal.toast.fire({
        icon: 'success',
        title: 'Link copied to clipboard!',
      });
    }
  };

  const media = [...(venue.videos || []), ...(venue.images || [])];

  const getMapEmbedUrl = () => {
    if (venue.geoLocation?.coordinates && venue.geoLocation.coordinates.length === 2) {
      const [lng, lat] = venue.geoLocation.coordinates;
      return `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
    }

    if (venue.directionUrl) {
      const coordsMatch = venue.directionUrl.match(/destination=([0-9.-]+),([0-9.-]+)/);
      if (coordsMatch) {
        const [, lat, lng] = coordsMatch;
        return `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
      }
    }

    return null;
  };

  const renderMediaItem = (url: string | undefined, index: number, isLarge: boolean = false) => {
    const isVid = isVideo(url);
    const thumb = isVid ? getMediaThumbnail(url) : (url || '/venue_default.jpg');

    return (
      <div className="relative w-full h-full">
        <Image
          src={thumb}
          alt={index === 0 ? venue.name : ""}
          fill
          className="object-cover"
          sizes={isLarge ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
          priority={index === 0}
        />
        {isVid && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <Play className={`text-white opacity-90 ${isLarge ? 'w-16 h-16' : 'w-8 h-8'}`} fill="currentColor" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28">
        <div className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{venue.name}</h1>
          <div className="flex items-center mt-2">
            <div className="text-sm text-gray-600 flex items-center">
              {venue.averageRating > 0 ? (
                <span className="font-semibold flex items-center text-gray-400">
                  {venue.averageRating.toFixed(1)} <Star className="h-4 w-4 ml-1 fill-gray-400" />
                </span>
              ) : (
                <span className="font-semibold text-gray-400">New</span>
              )}
              {venue.numReviews > 0 && (
                <span className="ml-1">
                  ({venue.numReviews} review{venue.numReviews > 1 ? 's' : ''})
                </span>
              )}
              <span className="mx-2">·</span>
              <span>{venue.location}</span>
              {canSeeViews && (
                <>
                  <span className="mx-2">·</span>
                  <span className="flex items-center inline-flex">
                    <Eye className="h-4 w-4 mr-1" />
                    {venue.views || 0} views
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Media gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-2 h-96 rounded-xl overflow-hidden">
          <div className="md:col-span-1 md:row-span-2 h-full cursor-pointer relative group" onClick={() => openMediaViewer(0)}>
            {renderMediaItem(media[0], 0, true)}
            <button
              onClick={handleShare}
              className="absolute top-4 left-4 z-20 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 group/share"
              title="Share Venue"
            >
              <Share2 size={18} className="text-gray-700 group-hover/share:text-primary transition-colors" />
            </button>
          </div>
          <div className="hidden md:grid grid-cols-2 grid-rows-1 gap-2 h-full">
            <div className="relative h-full w-full cursor-pointer" onClick={() => openMediaViewer(1)}>
              {renderMediaItem(media[1], 1)}
            </div>
            <div className="relative h-full w-full cursor-pointer" onClick={() => openMediaViewer(2)}>
              {renderMediaItem(media[2], 2)}
            </div>
          </div>
          <div className="hidden md:grid grid-cols-2 grid-rows-1 gap-2 h-full">
            <div className="relative h-full w-full cursor-pointer" onClick={() => openMediaViewer(3)}>
              {renderMediaItem(media[3], 3)}
            </div>
            <div className="relative w-full h-full cursor-pointer" onClick={() => openMediaViewer(4)}>
              {renderMediaItem(media[4], 4)}
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center pointer-events-none">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openMediaViewer(0);
                  }}
                  className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold pointer-events-auto"
                >
                  Show all media
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-12 mt-8">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="pb-6 border-b">
              <h2 className="text-2xl font-semibold text-gray-800">
                Capacity
              </h2>
              <p className="text-gray-600 mt-1">
                {venue.capacity} guests
              </p>
            </div>

            <div className="py-6 border-b">
              <h3 className="font-semibold text-xl text-gray-800 mb-4">About this venue</h3>
              <p className="text-gray-700 whitespace-pre-line">
                {venue.description}
              </p>
            </div>

            {venue.suitableFor && venue.suitableFor.length > 0 && (
              <div className="py-6 border-b">
                <h3 className="font-semibold text-xl text-gray-800 mb-4">Suitable For</h3>
                <div className="flex flex-wrap gap-3">
                  {venue.suitableFor.map((s) => {
                    const suitability = typeof s === 'string' ? { _id: s, name: s } as Suitability : s;
                    return (
                      <div
                        key={suitability._id}
                        className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-100"
                      >
                        {suitability.name.toLowerCase().includes('birthday') ? (
                          <Gift className="h-4 w-4" />
                        ) : suitability.name.toLowerCase().includes('church') ? (
                          <Church className="h-4 w-4" />
                        ) : suitability.name.toLowerCase().includes('wedding') ? (
                          <Heart className="h-4 w-4" />
                        ) : suitability.name.toLowerCase().includes('conference') || suitability.name.toLowerCase().includes('conferrence') || suitability.name.toLowerCase().includes('meeting') ? (
                          <Users className="h-4 w-4" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        <span>{suitability.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="py-6 border-b">
              <h3 className="font-semibold text-xl text-gray-800 mb-4">What this place offers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {venue.facilities?.length > 0 ? (
                  venue.facilities.map((facility, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <FacilityIcon name={facility.facility?.name || facility.name || ''} />
                      <div className="flex-grow">
                        <p className="text-gray-800 font-medium">
                          {facility.facility?.name || facility.name}
                          {facility.variantName && (
                            <span className="text-gray-500 ml-1">({facility.variantName})</span>
                          )}
                        </p>
                        <div className="flex items-center text-sm text-gray-500">
                          {facility.chargeMethod === 'free' ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500 mr-1.5" />
                              <span>Free</span>
                            </>
                          ) : (
                            <>
                              <CircleDollarSign className="h-4 w-4 text-yellow-600 mr-1.5" />
                              <span>Paid</span>
                            </>
                          )}
                        </div>
                        {facility.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{facility.description}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No facilities listed.</p>
                )}
              </div>
            </div>

            {venue.rules && (Array.isArray(venue.rules) ? venue.rules.length > 0 : (venue.rules as string).length > 0) && (
              <div className="py-6 border-b">
                <div className="flex items-center space-x-2 mb-4">
                  <AlertTriangle className="h-6 w-6 text-amber-500 animate-pulse" />
                  <h3 className="font-semibold text-xl text-gray-800">Venue Rules</h3>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-5">
                  <ul className="space-y-3">
                    {(Array.isArray(venue.rules) ? venue.rules : (venue.rules as string).split('\n')).map((rule, index) => (
                      <li key={index} className="flex items-start space-x-3 text-gray-700">
                        <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                        <span className="text-sm font-medium leading-relaxed">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Availability Section */}
            <div className="py-6 border-b">
              <h3 className="font-semibold text-xl text-gray-800 mb-4">Availability</h3>
              <div className="flex flex-col md:flex-row justify-center items-start gap-8">
                <Calendar
                  unavailableDates={[]}
                  disableToday={true}
                  selectedDates={undefined}
                  onChange={() => {}}
                  onMonthChange={setDisplayedMonth}
                  displayedMonth={displayedMonth}
                  getDateAvailability={getDateAvailability}
                  onDateClick={(date) => {
                    if (!isOnlineBookingEnabled) {
                      Swal.fire({
                        icon: 'info',
                        title: 'Contact Owner to Book',
                        text: 'Online booking is currently disabled for this venue. Contact Owner to Book',
                        confirmButtonColor: '#295FA7',
                      });
                      return;
                    }

                    const availability = getDateAvailability(date);
                    if (availability === 'fully booked') {
                      Swal.fire({
                        icon: 'error',
                        title: 'Not Available',
                        text: 'This date is not available for booking.',
                      });
                      return;
                    }

                    Swal.fire({
                      title: 'Choose an option',
                      text: `What would you like to do for ${date.toLocaleDateString()}?`,
                      icon: 'question',
                      showCancelButton: true,
                      confirmButtonText: 'Book Now',
                      cancelButtonText: 'Reserve Venue',
                      confirmButtonColor: '#295FA7',
                      cancelButtonColor: '#B68945',
                    }).then((result) => {
                      if (result.isConfirmed) {
                        setBookingMode('book');
                        setInitialSelectedDates([date]);
                        setInitialStep(2);
                        openBookingModal();
                      } else if (result.dismiss === Swal.DismissReason.cancel) {
                        setBookingMode('reserve');
                        setInitialSelectedDates([date]);
                        setInitialStep(2);
                        openBookingModal();
                      }
                    });
                  }}
                />
                <div className="mt-4 p-4 border rounded-lg bg-gray-50 w-full md:w-64">
                  <h3 className="font-semibold text-lg mb-3">Legend</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <span className="w-5 h-5 rounded-full bg-red-300 mr-2"></span>
                      <span className="text-sm">Completely Booked</span>
                    </li>
                    <li className="flex items-center">
                      <span className="w-5 h-5 rounded-full bg-orange-300 mr-2"></span>
                      <span className="text-sm">Booked, but some time slot still available</span>
                    </li>
                    <li className="flex items-center">
                      <span className="w-5 h-5 rounded-full bg-green-300 mr-2"></span>
                      <span className="text-sm">Completely Available</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Map Section */}
            {getMapEmbedUrl() && (
              <div className="py-6 border-b">
                <h3 className="font-semibold text-xl text-gray-800 mb-4">How to get there</h3>
                <div className="rounded-xl overflow-hidden h-96 w-full border border-gray-100 shadow-sm">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={getMapEmbedUrl()!}
                  ></iframe>
                </div>
                {venue.geoLocation?.address && (
                  <p className="mt-3 text-gray-600 text-sm flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-gray-400 flex-shrink-0" />
                    {venue.geoLocation.address}
                  </p>
                )}
              </div>
            )}

            {/* Reviews Section */}
            <div className="py-6 border-b">
              <h3 className="font-semibold text-xl text-gray-800 mb-4">Reviews</h3>
              {reviewsLoading ? (
                <p className="text-gray-500 italic">Loading reviews...</p>
              ) : reviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {reviews.map((review) => (
                    <ReviewCard
                      key={review._id}
                      name={review.user?.fullName || 'Anonymous'}
                      date={review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long'
                      }) : 'N/A'}
                      rating={review.rating}
                      comment={review.comment}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No reviews yet for this venue.</p>
              )}
            </div>
             {/* Recommendation Section */}
            <div className="py-6">
              <h3 className="font-semibold text-xl text-gray-800 mb-4">Similar Venues</h3>
              {recommendationsUnavailable ? (
                <p className="text-gray-500">Recommendations are temporarily unavailable</p>
              ) : recommendations.length > 0 ? (
                <Carousel venues={recommendations} slidesToShow={3} />
              ) : (
                <p className="text-gray-500">No recommendation found</p>
              )}
            </div>
          </div>

          {/* Sticky booking widget */}
          <div className="lg:col-span-1 order-1 lg:order-2 mb-8 lg:mb-0">
            <div className="sticky top-28 border rounded-xl shadow-lg p-6">
              <div className="mb-4">
                {venue.pricing?.dailyRate && venue.pricing?.hourlyRate ? (
                  <div className="flex items-center justify-around">
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-900">
                        ₦{venue.pricing.dailyRate.toLocaleString()}
                      </p>
                      <span className="text-sm text-gray-600">/ day</span>
                    </div>
                    <div className="h-10 border-l border-gray-300"></div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-900">
                        ₦{venue.pricing.hourlyRate.toLocaleString()}
                      </p>
                      <span className="text-sm text-gray-600">/ hour</span>
                    </div>
                  </div>
                ) : venue.pricing?.dailyRate ? (
                  <div className="flex items-baseline">
                    <p className="text-2xl font-bold text-gray-900">
                      ₦{venue.pricing.dailyRate.toLocaleString()}
                    </p>
                    <span className="ml-1 text-gray-600">/ day</span>
                  </div>
                ) : venue.pricing?.hourlyRate ? (
                  <div className="flex items-baseline">
                    <p className="text-2xl font-bold text-gray-900">
                      ₦{venue.pricing.hourlyRate.toLocaleString()}
                    </p>
                    <span className="ml-1 text-gray-600">/ hour</span>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-gray-500">Price not available</p>
                )}
              </div>
              {!isOnlineBookingEnabled && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    Online booking is currently disabled for this venue. Contact Owner to Book
                  </p>
                </div>
              )}
              {isOnlineBookingEnabled && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setBookingMode('reserve');
                      setInitialSelectedDates(undefined);
                      setInitialStep(1);
                      openBookingModal();
                    }}
                    className="w-full bg-transparent border border-[#B68945] text-[#B68945] cursor-pointer font-bold py-3 px-4 rounded-lg transition duration-300 hover:bg-[#B68945] hover:text-white"
                  >
                    Reserve Now
                  </button>
                  <button
                    onClick={() => {
                      setBookingMode('book');
                      setInitialSelectedDates(undefined);
                      setInitialStep(1);
                      openBookingModal();
                    }}
                    className="w-full bg-[#295FA7] hover:bg-[#204a8a] cursor-pointer text-white font-bold py-3 px-4 rounded-lg transition duration-300"
                  >
                    Book Now
                  </button>
                </div>
              )}
              <div className="mt-2">
                <button
                  onClick={handleContactOwner}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-[#B68945] hover:text-white cursor-pointer transition duration-300"
                >
                  Contact Owner
                </button>
              </div>
              <p className="text-center text-sm text-gray-500 mt-4">You won&apos;t be charged yet</p>
            </div>
          </div>
        </div>
      </div>
      {venue && (
        <>
          <BookingModal
            key={isBookingModalOpen ? 'open' : 'closed'}
            hallId={venue.id || venue._id}
            isOpen={isBookingModalOpen}
            onClose={closeBookingModal}
            bookingMode={bookingMode as 'book' | 'reserve'}
            initialSelectedDates={initialSelectedDates}
            initialStep={initialStep}
            initialEventDetails={initialEventDetails}
            initialStartTime={initialStartTime}
            initialEndTime={initialEndTime}
            initialSelectedFacilities={initialSelectedFacilities}
          />
          <DemoModal
            isOpen={isDemoModalOpen}
            onClose={() => setDemoModalOpen(false)}
            phone={ownerContact.phone}
            directionUrl={venue.directionUrl}
            address={venue.geoLocation?.address}
          />
        </>
      )}
      <MediaViewerModal
        isOpen={isMediaViewerOpen}
        onClose={() => setMediaViewerOpen(false)}
        media={media}
        startIndex={selectedMediaIndex}
      />
    </div>
  );
};

export default VenueDetailClient;
