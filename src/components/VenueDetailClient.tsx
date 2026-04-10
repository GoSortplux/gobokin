'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toPng } from 'html-to-image';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import BookingModal, { FacilityWithQuantity } from '@/components/BookingModal';
import DemoModal from '@/components/DemoModal';
import { useUI } from '@/context/UIContext';
import ReviewCard from '@/components/ReviewCard';
import Calendar from '@/components/Calendar';
import VenueDetailSkeleton from '@/components/VenueDetailSkeleton';
import Carousel from '@/components/Carousel';
import MediaViewerModal from '@/components/MediaViewerModal';
import MediaThumbnail from '@/components/MediaThumbnail';
import { useBookingAvailability } from '@/hooks/useBookingAvailability';
import { translateError } from '@/utils/errors';
import { formatDateLong } from '@/utils/date';
import { Venue, Review, Suitability } from '@/types';
import FacilityIcon from '@/components/FacilityIcon';
import ErrorState from '@/components/ErrorState';
import DiscountCard from '@/components/shared/DiscountCard';
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
  Share2,
  MapPin,
  Ticket,
} from 'lucide-react';
import Swal from "@/utils/sweetalert";

interface VenueDetailClientProps {
  slugOrId: string;
  initialVenue?: Venue | null;
}

const VenueDetailClient = ({ slugOrId, initialVenue }: VenueDetailClientProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const [venue, setVenue] = useState<Venue | null>(initialVenue || null);
  const discountCardRef = useRef<HTMLDivElement>(null);
  const [generatedCode, setGeneratedCode] = useState<{
    code: string;
    discountPercentage: number;
    expiryDate?: string;
    daysRemaining?: number;
  } | null>(null);

  const canSeeViews = useMemo(() => {
    if (!user || !venue) return false;
    if (user.activeRole === 'super-admin') return true;

    const venueOwnerId = typeof venue.owner === 'object' ? venue.owner?._id : venue.owner;
    const userId = user._id || user.id;

    if (user.activeRole === 'hall-owner') {
      return venueOwnerId === userId;
    }

    if (user.activeRole === 'staff') {
      const assignedHalls = (user.assignedHalls || user.hallIds || []) as (string | { _id: string })[];
      return assignedHalls.some((h) => {
        const hId = typeof h === 'object' ? h._id : h;
        return hId === venue._id || hId === venue.id;
      });
    }

    return false;
  }, [user, venue]);

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
  const [initialUsePerDateTimes, setInitialUsePerDateTimes] = useState(false);
  const [initialDateTimes, setInitialDateTimes] = useState<Record<string, { startTime: string; endTime: string }>>({});
  const [displayedMonth, setDisplayedMonth] = useState<Date>(new Date());
  const [isDemoModalOpen, setDemoModalOpen] = useState(false);
  const [ownerContact, setOwnerContact] = useState({ phone: '', name: '', address: '', directionUrl: '' });
  const [isMediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  const { getDateAvailability } = useBookingAvailability(venue, undefined, displayedMonth);

  const isOnlineBookingEnabled = (venue?.isOnlineBookingEnabled !== false) && (venue?.bookingMode === 'online' || !venue?.bookingMode);

  const handleDownloadCodeImage = async (code: string) => {
    if (!discountCardRef.current) return;
    try {
      const dataUrl = await toPng(discountCardRef.current, { cacheBust: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `discount-${code}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download discount code image', err);
      Swal.toast.fire({
        icon: 'error',
        title: 'Failed to generate image',
      });
    }
  };

  const handleShareCode = useCallback(async (code: string, discount: number) => {
    const shareText = `Hey! I just got a ${discount}% discount code for ${venue?.name} on GoBokin. Use code: ${code}`;

    if (navigator.share) {
      try {
        if (discountCardRef.current) {
          const dataUrl = await toPng(discountCardRef.current, { cacheBust: true, backgroundColor: '#ffffff' });
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], `discount-${code}.png`, { type: 'image/png' });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'My Discount Code',
              text: shareText,
            });
            return;
          }
        }

        // Fallback to text share if file share not supported
        await navigator.share({
          title: 'My Discount Code',
          text: shareText,
          url: window.location.href,
        });
      } catch (_err) {
        // Silently ignore share cancellation or errors
      }
    } else {
      navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
      Swal.toast.fire({
        icon: 'success',
        title: 'Share link copied to clipboard!',
      });
    }
  }, [venue?.name]);

  const handleGenerateReferralCode = useCallback(async () => {
    if (!user) {
      localStorage.setItem('pendingAction', JSON.stringify({ hallId: slugOrId, action: 'generateReferral' }));
      localStorage.setItem('returnUrl', window.location.pathname + window.location.search);
      Swal.fire({
        title: 'Want a Discount?',
        text: 'Kindly sign in to generate your unique discount code and enjoy exclusive savings.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Sign In',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#295FA7',
      }).then((result) => {
        if (result.isConfirmed) {
          router.push('/auth/login');
        }
      });
      return;
    }

    const { value: formValues } = await Swal.fire({
      title: 'Generate Discount Code',
      html:
        '<div class="text-left space-y-4">' +
        '<p class="text-sm text-gray-500 mb-4">Enter your details to generate a unique discount code for this venue.</p>' +
        '<div><label class="block text-xs font-bold text-gray-400 uppercase mb-1">Full Name</label>' +
        `<input id="swal-fullname" class="swal2-input !mt-0 !w-full" value="${user.fullName || ''}"></div>` +
        '<div><label class="block text-xs font-bold text-gray-400 uppercase mb-1">Phone Number</label>' +
        `<input id="swal-phone" class="swal2-input !mt-0 !w-full" value="${user.phone || ''}"></div>` +
        '<div><label class="block text-xs font-bold text-gray-400 uppercase mb-1">Email</label>' +
        `<input id="swal-email" class="swal2-input !mt-0 !w-full" value="${user.email || ''}"></div>` +
        '</div>',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Generate Code',
      confirmButtonColor: '#295FA7',
      preConfirm: () => {
        const fullName = (document.getElementById('swal-fullname') as HTMLInputElement).value;
        const phone = (document.getElementById('swal-phone') as HTMLInputElement).value;
        const email = (document.getElementById('swal-email') as HTMLInputElement).value;
        if (!fullName || !phone || !email) {
          Swal.showValidationMessage('Please fill all fields');
          return false;
        }
        return { fullName, phone, email };
      }
    });

    if (formValues) {
        try {
            Swal.showLoading();
            const targetId = venue?._id || venue?.id || slugOrId;
            const response = await api.post(`/halls/${targetId}/generate-referral-code`, formValues);
            const { code, discountPercentage, expiryDate, daysRemaining } = response.data.data;
            setGeneratedCode({ code, discountPercentage, expiryDate, daysRemaining });

            const formattedExpiry = expiryDate ? formatDateLong(expiryDate) : null;

            // Small delay to ensure the hidden DiscountCard is rendered with the new data
            setTimeout(() => {
              Swal.fire({
                  title: 'Your Discount Code',
                  html: `
                      <div class="relative p-6 bg-blue-50 rounded-2xl border-2 border-dashed border-primary mt-4">
                          <p class="text-4xl font-black text-primary tracking-widest uppercase mb-2 pr-10">${code}</p>
                          <p class="text-sm font-bold text-blue-700">Get ${discountPercentage}% OFF your booking!</p>
                          <button id="swal-copy-btn" class="absolute top-4 right-4 p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer" title="Copy Code">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                          </button>
                      </div>
                      <div class="mt-4 mb-6">
                        ${formattedExpiry ? `<p class="text-sm font-bold text-gray-700">Valid until ${formattedExpiry}</p>` : ''}
                        ${daysRemaining !== undefined ? `<p class="text-xs text-primary italic">(${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining)</p>` : ''}
                        <p class="mt-2 text-xs text-gray-500">Show this code to the venue owner when making an offline booking.</p>
                      </div>
                      <div class="grid grid-cols-2 gap-3">
                          <button id="swal-download-btn" class="flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-white rounded-xl font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity">
                              Download Image
                          </button>
                          <button id="swal-share-btn" class="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-xl font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity">
                              Share Voucher
                          </button>
                      </div>
                  `,
                  icon: 'success',
                  showCancelButton: false,
                  confirmButtonText: 'Close',
                  confirmButtonColor: '#295FA7',
                  didOpen: () => {
                    const downloadBtn = document.getElementById('swal-download-btn');
                    const shareBtn = document.getElementById('swal-share-btn');
                    const copyBtn = document.getElementById('swal-copy-btn');

                    if (downloadBtn) {
                      downloadBtn.onclick = () => handleDownloadCodeImage(code);
                    }
                    if (shareBtn) {
                      shareBtn.onclick = () => handleShareCode(code, discountPercentage);
                    }
                    if (copyBtn) {
                      copyBtn.onclick = () => {
                        navigator.clipboard.writeText(code);
                        Swal.toast.fire({
                            icon: 'success',
                            title: 'Code copied to clipboard!'
                        });
                      };
                    }
                  }
              });
            }, 100);
        } catch (err) {
            console.error('Failed to generate referral code:', err);
            Swal.fire('Error', translateError(err), 'error');
        }
    }
  }, [user, venue, slugOrId, router, handleShareCode]);

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

      if (venue?.bookingMode === 'platform-managed' && venue.platformContact) {
        setOwnerContact({
            phone: venue.platformContact.phone,
            name: venue.platformContact.name,
            address: '',
            directionUrl: ''
        });
      } else {
        const response = await api.post(`/halls/${targetId}/book-demo`);
        setOwnerContact(response.data.data);
      }

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
      const venueId = venue?.id || venue?._id;

      // Match against slugOrId (from URL) or loaded venue details
      const isMatch =
        data.hallId === slugOrId ||
        data.hallSlug === slugOrId ||
        (venueId && data.hallId === venueId) ||
        (venue?.slug && data.hallSlug === venue.slug);

      if (isMatch) {
        setBookingMode(data.bookingMode || 'book');
        if (data.selectedDates) {
          setInitialSelectedDates(data.selectedDates.map((d: string) => new Date(d)));
        }
        setInitialEventDetails(data.eventDetails || '');
        setInitialStartTime(data.startTime || '08:00');
        setInitialEndTime(data.endTime || '22:00');
        setInitialSelectedFacilities(data.selectedFacilities || []);
        setInitialStep(data.step || 1);
        setInitialUsePerDateTimes(data.usePerDateTimes || false);
        setInitialDateTimes(data.dateTimes || {});

        // Small delay to ensure state updates are processed before opening the modal
        // We also check if loading is finished to avoid the skeleton overlapping or interference
        if (!loading || venue) {
          const timer = setTimeout(() => {
            openBookingModal();
          }, 500); // Increased delay for stability

          localStorage.removeItem('pendingBooking');
          return () => clearTimeout(timer);
        }
      }
    }
  }, [slugOrId, venue, openBookingModal, loading]);

  useEffect(() => {
    const pendingAction = localStorage.getItem('pendingAction');
    if (pendingAction) {
      const data = JSON.parse(pendingAction);
      const venueId = venue?.id || venue?._id;

      // Match against slugOrId (from URL) or loaded venue details
      const isMatch =
        data.hallId === slugOrId ||
        data.hallSlug === slugOrId ||
        (venueId && data.hallId === venueId) ||
        (venue?.slug && data.hallSlug === venue.slug);

      if (isMatch && data.action === 'contactOwner') {
        handleContactOwner();
        localStorage.removeItem('pendingAction');
      } else if (isMatch && data.action === 'generateReferral') {
        handleGenerateReferralCode();
        localStorage.removeItem('pendingAction');
      } else if (isMatch) {
        // If it's a match but not the right action, we might still want to clear it
        // if we are sure it's stale, but for now let's be conservative.
      }
    }
  }, [slugOrId, venue, handleContactOwner, handleGenerateReferralCode]);

  useEffect(() => {
    fetchVenueAndRecommendations(!!initialVenue);
  }, [fetchVenueAndRecommendations, initialVenue]);

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
    // 1. Coordinates from geoLocation
    if (venue.geoLocation?.coordinates && venue.geoLocation.coordinates.length === 2) {
      const [lng, lat] = venue.geoLocation.coordinates;
      if (lat && lng) {
        return `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
      }
    }

    // 2. directionUrl analysis
    if (venue.directionUrl) {
      try {
        const url = new URL(venue.directionUrl);
        const params = new URLSearchParams(url.search);

        // Try destination (often used in directions)
        const destination = params.get('destination');
        if (destination) {
          return `https://maps.google.com/maps?q=${encodeURIComponent(destination)}&z=15&output=embed`;
        }

        // Try query (common in search/api URLs)
        const query = params.get('query');
        if (query) {
          return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
        }

        // Fallback for specific format if URL parsing succeeds but params missing
        const coordsMatch = venue.directionUrl.match(/destination=([0-9.-]+),([0-9.-]+)/);
        if (coordsMatch) {
          const [, lat, lng] = coordsMatch;
          return `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
        }
      } catch (_e) {
        // If URL parsing fails, try simple regex for coords
        const coordsMatch = venue.directionUrl.match(/destination=([0-9.-]+),([0-9.-]+)/);
        if (coordsMatch) {
          const [, lat, lng] = coordsMatch;
          return `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
        }
      }
    }

    // 3. geoLocation.address
    if (venue.geoLocation?.address) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(venue.geoLocation.address)}&z=15&output=embed`;
    }

    // 4. location (as a final fallback)
    if (venue.location) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(venue.location)}&z=15&output=embed`;
    }

    return null;
  };

  const renderMediaItem = (url: string | undefined, index: number, isLarge: boolean = false) => {
    return (
      <MediaThumbnail
        url={url}
        alt={index === 0 ? venue.name : ""}
        fill
        className="object-cover"
        sizes={isLarge ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
        priority={index === 0}
        showPlayIcon={true}
        playIconSize={isLarge ? 'lg' : 'md'}
      />
    );
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Hidden container for image generation */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none">
        <div ref={discountCardRef}>
          {generatedCode && (
            <DiscountCard
              venueName={venue.name}
              code={generatedCode.code}
              discountPercentage={generatedCode.discountPercentage}
              expiryDate={generatedCode.expiryDate}
              daysRemaining={generatedCode.daysRemaining}
            />
          )}
        </div>
      </div>

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
                      const msg = venue.bookingMessage || 'Online booking is currently disabled for this venue. Contact Owner to Book';
                      Swal.fire({
                        icon: 'info',
                        title: 'Contact Owner to Book',
                        text: msg,
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
                {venue.pricing?.dailyRate && (venue.pricing?.hourlyRate && venue.pricing.hourlyRate > 0) ? (
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
                ) : (venue.pricing?.hourlyRate && venue.pricing.hourlyRate > 0) ? (
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
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-amber-800">
                      {venue.bookingMessage || 'Online booking is currently disabled for this venue.'}
                    </p>
                  </div>
                  <button
                    onClick={handleContactOwner}
                    className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dark transition duration-300 shadow-lg shadow-primary/20"
                  >
                    Contact Owner
                  </button>
                </div>
              )}
              {isOnlineBookingEnabled && (
                <>
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
                  <div className="mt-2">
                    <button
                      onClick={handleContactOwner}
                      className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-[#B68945] hover:text-white cursor-pointer transition duration-300"
                    >
                      Contact Owner
                    </button>
                  </div>
                </>
              )}
              {venue.isPartnership && (
                <div className="mt-2">
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleGenerateReferralCode}
                      className="w-full bg-emerald-50 text-emerald-700 border border-emerald-100 py-3 rounded-xl font-bold hover:bg-emerald-100 cursor-pointer transition duration-300 flex items-center justify-center gap-2"
                    >
                      <Ticket size={18} />
                      Generate Discount Code
                    </button>
                    <p className="text-[10px] text-center font-bold text-emerald-600 uppercase tracking-wider">
                      Get a {venue.referralDiscountPercentage || 2}% discount when Paying for Booking
                    </p>
                  </div>
                </div>
              )}
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
            hallSlug={venue.slug}
            isOpen={isBookingModalOpen}
            onClose={closeBookingModal}
            bookingMode={bookingMode as 'book' | 'reserve'}
            initialSelectedDates={initialSelectedDates}
            initialStep={initialStep}
            initialEventDetails={initialEventDetails}
            initialStartTime={initialStartTime}
            initialEndTime={initialEndTime}
            initialSelectedFacilities={initialSelectedFacilities}
            initialUsePerDateTimes={initialUsePerDateTimes}
            initialDateTimes={initialDateTimes}
          />
          <DemoModal
            isOpen={isDemoModalOpen}
            onClose={() => setDemoModalOpen(false)}
            phone={ownerContact.phone}
            name={ownerContact.name}
            directionUrl={venue.directionUrl || ownerContact.directionUrl}
            address={venue.geoLocation?.address || ownerContact.address}
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
