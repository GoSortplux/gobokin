"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Slider from "react-slick";
import { useAuth } from "@/context/AuthContext";
import LoginRequiredModal from "@/components/auth/LoginRequiredModal";
import {
  Calendar,
  MapPin,
  Ticket,
  Users,
  ArrowRight,
  CheckCircle2,
  Share2,
  Clock,
  ChevronRight,
  Download,
  CalendarPlus,
  Heart,
  Globe,
  Sparkles,
  BookmarkPlus,
  ChevronDown,
  ChevronUp,
  User
} from "lucide-react";
import api from "@/services/api";
import { Event, Ticket as TicketType, Session, Registration, Speaker } from "@/types";
import { eventTracking } from "@/services/eventTracking";
import PublicOrganizerProfileModal from "@/components/organizer/PublicOrganizerProfileModal";
import CustomLoader from "@/components/CustomLoader";
import OrganizerStatusBadge from "@/components/shared/OrganizerStatusBadge";
import EventCountdown from "@/components/events/EventCountdown";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";
import MediaViewerModal from "@/components/MediaViewerModal";

const SpeakerCard = ({ speaker }: { speaker: Speaker }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const bioRef = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    if (bioRef.current) {
      setIsTruncated(bioRef.current.scrollHeight > bioRef.current.clientHeight);
    }
  }, [speaker.bio]);

  return (
    <div className="bg-gray-50 rounded-2xl border border-transparent hover:bg-white hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 group overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-md">
            {speaker.imageUrl ? (
              <Image
                src={speaker.imageUrl}
                alt={speaker.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary">
                <User size={40} />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-gray-900 text-lg tracking-tight group-hover:text-primary transition-colors">
              {speaker.name}
            </h4>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
              {speaker.title}
            </p>
          </div>

          {speaker.bio && (
            <div className="relative w-full">
              <p
                ref={bioRef}
                className={`text-gray-500 text-sm font-medium leading-relaxed ${!isExpanded ? 'line-clamp-3' : ''}`}
              >
                {speaker.bio}
              </p>
              {(isTruncated || isExpanded) && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-2 mx-auto text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-1 hover:underline"
                >
                  {isExpanded ? (
                    <>Show Less <ChevronUp size={14} /></>
                  ) : (
                    <>Read More <ChevronDown size={14} /></>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SessionCard = ({ session }: { session: Session }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    if (descriptionRef.current) {
      setIsTruncated(descriptionRef.current.scrollHeight > descriptionRef.current.clientHeight);
    }
  }, [session.description]);

  const startTime = new Date(session.startTime);
  const endTime = session.endTime ? new Date(session.endTime) : null;

  return (
    <div className="bg-gray-50 rounded-2xl border border-transparent hover:bg-white hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 group overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Time & Type Column */}
          <div className="flex-shrink-0 md:w-32 flex md:flex-col items-center md:items-start justify-between md:justify-start gap-2">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-primary uppercase tracking-widest leading-none">
                {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              {endTime && (
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
                  to {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
            {session.sessionType && (
              <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider">
                {session.sessionType}
              </span>
            )}
          </div>

          {/* Main Info Column */}
          <div className="flex-1 min-w-0 space-y-4">
            <div>
              <div className="flex items-start justify-between gap-4">
                <h4 className="font-bold text-gray-900 text-xl tracking-tight group-hover:text-primary transition-colors">
                  {session.title}
                </h4>
                <div className="flex-shrink-0 flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                  <MapPin size={12} className="text-primary" />
                  <span className="text-[10px] font-semibold text-gray-900 uppercase tracking-widest truncate max-w-[100px]">
                    {session.location || session.room || "Main Hall"}
                  </span>
                </div>
              </div>

              {session.description && (
                <div className="mt-2 relative">
                  <p
                    ref={descriptionRef}
                    className={`text-gray-500 text-sm font-medium leading-relaxed ${!isExpanded ? 'line-clamp-2' : ''}`}
                  >
                    {session.description}
                  </p>
                  {(isTruncated || isExpanded) && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="mt-2 text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-1 hover:underline"
                    >
                      {isExpanded ? (
                        <>Show Less <ChevronUp size={14} /></>
                      ) : (
                        <>Read More <ChevronDown size={14} /></>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Speakers & Metadata */}
            {(session.speakerNames && session.speakerNames.length > 0) && (
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                   <div className="flex -space-x-2">
                      {session.speakerNames.slice(0, 3).map((_, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center text-primary">
                          <User size={12} />
                        </div>
                      ))}
                   </div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {session.speakerNames.join(", ")}
                   </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const isEarlyBirdActive = (ticket: TicketType | undefined | null) => {
  if (!ticket) return false;
  if (!ticket.earlyBirdPrice || Number(ticket.earlyBirdPrice) <= 0) return false;

  // Check expiry
  if (ticket.earlyBirdExpiry) {
    const expiryDate = new Date(ticket.earlyBirdExpiry);
    if (expiryDate < new Date()) {
      return false;
    }
  }

  // Check limit
  if (ticket.earlyBirdLimit && ticket.earlyBirdLimit > 0) {
    const sold = ticket.soldQuantity || 0;
    if (sold >= ticket.earlyBirdLimit) {
      return false;
    }
  }

  return true;
};

const getTicketEffectivePrice = (ticket: TicketType | undefined | null) => {
  if (!ticket) return 0;
  if (isEarlyBirdActive(ticket)) {
    return Number(ticket.earlyBirdPrice);
  }
  return Number(ticket.price);
};

const EventDetailClient = () => {
  const { organizerSlug, eventSlug } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);
  const [waitlistStatus, setWaitlistStatus] = useState<{ position?: number } | null>(null);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("overview");
  const [isSpecialTicketsExpanded, setIsSpecialTicketsExpanded] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showOrganizerModal, setShowOrganizerModal] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(true);

  // New state for banner full-screen media viewer
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);

  useEffect(() => {
    const interacted = localStorage.getItem("has_interacted_ticket_selector") === "true";
    setHasInteracted(interacted);
  }, []);

  const isLocationHidden = useMemo(() => {
    return event?.hideLocationDetails && !isRegistered;
  }, [event?.hideLocationDetails, isRegistered]);

  const allMedia = useMemo(() => {
    if (!event) return [];
    const media = [];
    if (event.bannerUrl) media.push(event.bannerUrl);
    if (event.mediaUrls && Array.isArray(event.mediaUrls)) {
      event.mediaUrls.forEach(url => {
        if (url !== event.bannerUrl) {
          media.push(url);
        }
      });
    }
    return media;
  }, [event]);

  const fetchUserRegistration = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const response = await api.get("/events/my-registrations");
      const registrations = response.data.data || response.data;
      if (Array.isArray(registrations)) {
        const registered = registrations.some((reg: Registration) => reg.event.id === id);
        setIsRegistered(registered);
      }
    } catch (_error) {
      setIsRegistered(false);
    }
  }, [user]);

  const fetchWaitlistStatus = useCallback(async (id: string, isWaitlistEnabled?: boolean) => {
    if (!user || !isWaitlistEnabled) return;
    try {
      const response = await api.get(`/events/${id}/waitlist/status`);
      setWaitlistStatus(response.data.data);
    } catch (_error) {
      setWaitlistStatus(null);
    }
  }, [user]);

  const getTicketSalesStatus = (ticket: TicketType | null) => {
    if (!ticket) return "INACTIVE";
    const now = new Date();
    const salesStart = ticket.salesStart ? new Date(ticket.salesStart) : null;
    const salesEnd = ticket.salesEnd ? new Date(ticket.salesEnd) : null;

    if (salesStart && now < salesStart) return "UPCOMING";
    if (salesEnd && now > salesEnd) return "ENDED";
    return "ACTIVE";
  };

  const handleNextTicket = () => {
    if (!event?.tickets || event.tickets.length <= 1) return;
    const currentIndex = event.tickets.findIndex(t => t.id === selectedTicket?.id);
    const nextIndex = (currentIndex + 1) % event.tickets.length;
    setSelectedTicket(event.tickets[nextIndex]);
    setQuantity(1);
    setHasInteracted(true);
    localStorage.setItem("has_interacted_ticket_selector", "true");
  };

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        // New slug-based endpoint
        const response = await api.get(`/events/e/${organizerSlug}/${eventSlug}`);
        const eventData = response.data.data;
        setEvent(eventData);

        const tickets = eventData.tickets || [];
        if (tickets.length > 0) {
          const now = new Date();
          const firstAvailable = tickets.find((t: TicketType) => {
            const isTicketSoldOut = t.isSoldOut || (t.remainingTickets !== undefined && t.remainingTickets <= 0) || (t.availableQuantity !== undefined && t.availableQuantity <= 0);
            const sStart = t.salesStart ? new Date(t.salesStart) : null;
            const sEnd = t.salesEnd ? new Date(t.salesEnd) : null;
            const isCurrentlyOnSale = (!sStart || now >= sStart) && (!sEnd || now <= sEnd);
            return !isTicketSoldOut && isCurrentlyOnSale;
          });
          setSelectedTicket(firstAvailable || tickets[0]);
        }
        return eventData;
      } catch (_error) {
        console.error("Failed to fetch event details:", _error);
        Swal.fire("Error", translateError(_error), "error");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent().then((data) => {
      if (data?.id) {
        if (data.isWaitlistEnabled) {
          fetchWaitlistStatus(data.id, data.isWaitlistEnabled);
        }
        fetchUserRegistration(data.id);

        // Log DETAIL_VIEW interaction
        eventTracking.logInteraction(data.id, 'DETAIL_VIEW', {
          surface: 'event-detail',
          source: searchParams.get('src') || undefined
        });
      }
    });
  }, [organizerSlug, eventSlug, user, searchParams, fetchWaitlistStatus, fetchUserRegistration]);

  const handleJoinWaitlist = async (ticket: TicketType) => {
    if (!user || !event) {
      setShowLoginModal(true);
      return;
    }

    try {
      setIsJoiningWaitlist(true);
      await api.post(`/events/${event.id}/waitlist`, {
        fullName: user.fullName,
        email: user.email,
        ticketTypeId: ticket.id
      });
      Swal.fire("Joined Waitlist", "You have successfully joined the waitlist for this ticket tier.", "success");
      fetchWaitlistStatus(event.id, event.isWaitlistEnabled);
    } catch (_error) {
      console.error("Failed to join waitlist:", _error);
      Swal.fire("Error", translateError(_error), "error");
    } finally {
      setIsJoiningWaitlist(false);
    }
  };

  const handleRegister = async () => {
    if (!selectedTicket) return;

    const maxLimit = Math.min(
      selectedTicket.availableQuantity || 0,
      selectedTicket.maxPerOrder && selectedTicket.maxPerOrder > 0 ? selectedTicket.maxPerOrder : Infinity
    );

    if (quantity > maxLimit) {
      Swal.fire("Limit Exceeded", `You can only purchase a maximum of ${maxLimit} tickets for this event.`, "warning");
      return;
    }

    router.push(`/events/${organizerSlug}/${eventSlug}/register?ticketId=${selectedTicket.id}&qty=${quantity}`);
  };

  const handleDownloadICS = async () => {
    if (!event) return;
    try {
      const response = await api.get(`/events/${event.id}/ics`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${event?.title || 'event'}.ics`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (_error) {
      console.error("Failed to download ICS:", _error);
      Swal.fire("Error", "Could not download calendar file.", "error");
    }
  };

  const handleAddToCalendar = async (type: 'google' | 'outlook' | 'apple') => {
    if (!event) return;
    try {
      const response = await api.get(`/events/${event.id}/calendar-links`);
      const links = response.data.data;

      if (type === 'google') {
        // Construct Google Calendar link manually if API link fails or as a robust fallback
        const fmtDate = (d: string) => new Date(d).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const start = fmtDate(event.startDate);
        const end = event.endDate ? fmtDate(event.endDate) : fmtDate(new Date(new Date(event.startDate).getTime() + 2 * 60 * 60 * 1000).toISOString());

        const gLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start}/${end}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(isLocationHidden ? 'Available for registered guests' : (event.location || ''))}`;
        window.open(gLink, '_blank');
        return;
      }

      if (links && links[type]) {
        window.open(links[type], '_blank');
      }
    } catch (_error) {
      console.error("Failed to get calendar links:", _error);
      Swal.fire("Error", "Could not open calendar.", "error");
    }
  };

  const handleToggleBookmark = async () => {
    if (!user || !event) {
      setShowLoginModal(true);
      return;
    }

    try {
      setIsBookmarking(true);
      const response = await api.post(`/events/${event.id}/bookmark`);

      // Handle both nested and flat response structures
      const data = response.data.data || response.data;
      const isBookmarked = data.bookmarked !== undefined ? data.bookmarked : data.isBookmarked;

      setEvent(prev => prev ? { ...prev, isBookmarked } : null);

      Swal.toast.fire({
        icon: 'success',
        title: isBookmarked ? 'Event bookmarked' : 'Bookmark removed',
        timer: 2000
      });
    } catch (_error) {
      console.error("Failed to toggle bookmark:", _error);
      Swal.fire("Error", translateError(_error), "error");
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleShare = () => {
    if (!event) return;

    const shareData = {
      title: event.title,
      text: `Check out ${event.title} on Gobokin!`,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData).catch((_err) => {
        // Silently handle share cancellation
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      Swal.toast.fire({
        icon: 'success',
        title: 'Event link copied to clipboard!',
        timer: 2000
      });
    }
  };

  if (loading) return <div className="min-h-screen pt-32 flex items-center justify-center bg-gray-50"><CustomLoader /></div>;
  if (!event) return <div className="p-20 text-center bg-gray-50"><h3 className="text-xl font-semibold">Event not found</h3></div>;

  const showInteractionAnimation = !hasInteracted && event.tickets && event.tickets.length > 1;

  return (
    <div className="min-h-screen bg-white pt-24 pb-24">
      {showInteractionAnimation && (
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes bounceRight {
            0%, 100% {
              transform: translateX(0);
            }
            50% {
              transform: translateX(4px);
            }
          }
          .animate-bounce-right {
            animation: bounceRight 1.5s infinite;
          }
        `}} />
      )}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      <PublicOrganizerProfileModal
        isOpen={showOrganizerModal}
        onClose={() => setShowOrganizerModal(false)}
        slug={event.organizer?.slug || (organizerSlug as string)}
      />

      {allMedia.length > 0 && (
        <MediaViewerModal
          isOpen={isMediaViewerOpen}
          onClose={() => setIsMediaViewerOpen(false)}
          media={allMedia}
          startIndex={activeBannerIndex}
        />
      )}

      <div className="container mx-auto px-4 max-w-7xl">
        {/* Breadcrumbs - Minimal Luma style */}
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-8 overflow-x-auto no-scrollbar whitespace-nowrap">
          <button onClick={() => router.push('/events')} className="hover:text-primary transition-colors flex items-center gap-1">
            Discovery
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-gray-300">{event.category}</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 truncate">{event.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-10">

            {/* High-Impact Hero Section */}
            <div className="space-y-6">
               <div className="relative aspect-video lg:aspect-[21/10] rounded-2xl overflow-hidden shadow-sm group border border-gray-100 banner-slider-container">
                  {allMedia.length > 1 ? (
                    <Slider
                      dots={true}
                      infinite={true}
                      speed={500}
                      slidesToShow={1}
                      slidesToScroll={1}
                      autoplay={true}
                      autoplaySpeed={5000}
                      arrows={false}
                      className="h-full"
                      afterChange={(index) => setActiveBannerIndex(index)}
                    >
                      {allMedia.map((url, index) => (
                        <div
                          key={index}
                          className="relative aspect-video lg:aspect-[21/10] cursor-zoom-in"
                          onClick={() => setIsMediaViewerOpen(true)}
                        >
                          <Image
                            src={url}
                            alt={`${event.title} - ${index + 1}`}
                            fill
                            className="object-cover"
                            priority={index === 0}
                          />
                        </div>
                      ))}
                    </Slider>
                  ) : event.bannerUrl ? (
                    <div
                      className="relative w-full h-full cursor-zoom-in"
                      onClick={() => {
                        setActiveBannerIndex(0);
                        setIsMediaViewerOpen(true);
                      }}
                    >
                      <Image src={event.bannerUrl} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-1000" />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <Calendar size={80} className="text-primary/10" />
                    </div>
                  )}

                  {/* Floating Date Badge */}
                  <div className="absolute top-6 left-6" onClick={(e) => e.stopPropagation()}>
                     <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-md flex items-center gap-3.5 w-fit">
                        {(() => {
                          const start = new Date(event.startDate);
                          const end = event.endDate ? new Date(event.endDate) : start;
                          const isMultiDay = start.toDateString() !== end.toDateString();

                          if (isMultiDay) {
                            return (
                              <>
                                <div className="flex flex-col items-center">
                                   <span className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-0.5">
                                     {start.toLocaleDateString(undefined, { month: 'short' })}
                                   </span>
                                   <span className="text-2xl font-semibold text-gray-900 leading-none">
                                     {start.toLocaleDateString(undefined, { day: 'numeric' })}
                                   </span>
                                </div>
                                <div className="text-[10px] font-bold text-primary uppercase tracking-widest px-1">
                                  to
                                </div>
                                <div className="flex flex-col items-center">
                                   <span className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-0.5">
                                     {end.toLocaleDateString(undefined, { month: 'short' })}
                                   </span>
                                   <span className="text-2xl font-semibold text-gray-900 leading-none">
                                     {end.toLocaleDateString(undefined, { day: 'numeric' })}
                                   </span>
                                </div>
                              </>
                            );
                          } else {
                            return (
                              <>
                                <div className="flex flex-col items-center">
                                   <span className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-0.5">
                                     {start.toLocaleDateString(undefined, { month: 'short' })}
                                   </span>
                                   <span className="text-2xl font-semibold text-gray-900 leading-none">
                                     {start.toLocaleDateString(undefined, { day: 'numeric' })}
                                   </span>
                                </div>
                                <div className="h-8 w-[1px] bg-gray-200"></div>
                                <div>
                                   <p className="text-sm font-semibold text-gray-900 mb-0.5">
                                     {start.toLocaleDateString(undefined, { weekday: 'long' })}
                                   </p>
                                   <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
                                     {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                   </p>
                                </div>
                              </>
                            );
                          }
                        })()}
                     </div>
                  </div>

                  {/* Floating Countdown on Banner */}
                  <div className="absolute bottom-6 right-6 z-20" onClick={(e) => e.stopPropagation()}>
                     <EventCountdown targetDate={event.startDate} />
                  </div>
               </div>

               <div className="space-y-4 px-2">
                  <div className="flex flex-wrap items-center gap-2">
                     <span className="px-4 py-1.5 rounded-xl bg-primary text-white text-[10px] font-semibold uppercase tracking-widest shadow-md shadow-primary/10">
                       {event.category}
                     </span>
                     {(event.isSoldOut || event.availabilityStatus === 'SOLD_OUT') && (
                       <span className="px-4 py-1.5 rounded-xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/20">
                         SOLD OUT
                       </span>
                     )}
                     {event.type && (
                       <span className="px-4 py-1.5 rounded-xl bg-white border border-gray-100 text-gray-600 text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                         <Globe size={12} className="text-primary" />
                         {event.type}
                       </span>
                     )}
                     {event.isFeatured && (
                       <span className="px-4 py-1.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                         <Sparkles size={12} className="fill-amber-500" />
                         FEATURED
                       </span>
                     )}
                  </div>
                  <h1 className="text-3xl lg:text-5xl font-semibold text-gray-900 tracking-tighter leading-tight">{event.title}</h1>

                  {/* Event Detail Metadata Section - similar to organizer dashboard */}
                  <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-gray-500 font-medium pt-2">
                     <div className="flex items-center gap-2">
                        <Calendar className="text-primary flex-shrink-0" size={18} />
                        <span className="text-sm">
                           {(() => {
                             const start = new Date(event.startDate);
                             const end = event.endDate ? new Date(event.endDate) : start;
                             const isMultiDay = start.toDateString() !== end.toDateString();
                             const formatOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
                             if (isMultiDay) {
                               return `${start.toLocaleDateString(undefined, formatOptions)} - ${end.toLocaleDateString(undefined, formatOptions)}`;
                             }
                             return start.toLocaleDateString(undefined, formatOptions);
                           })()}
                        </span>
                     </div>
                     <div className="flex items-center gap-2">
                        <MapPin className="text-primary flex-shrink-0" size={18} />
                        <span className="text-sm">
                           {event.hideLocationDetails ? "Available for registered guests" : (event.location || "Virtual Event")}
                        </span>
                     </div>
                     {event.capacity && (
                       <div className="flex items-center gap-2">
                          <Users className="text-primary flex-shrink-0" size={18} />
                          <span className="text-sm">{event.capacity} Capacity</span>
                       </div>
                     )}
                  </div>
               </div>
            </div>

            {/* Content Tabs */}
            <div className="space-y-8">
               <div className="flex items-center gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100 w-full overflow-x-auto no-scrollbar sm:w-fit">
                  {(() => {
                    const tabs = ["overview"];
                    if (event.speakers && event.speakers.length > 0) {
                      tabs.push("speakers");
                    }
                    tabs.push("schedule", "tickets");
                    return tabs.map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 sm:flex-none px-5 sm:px-8 py-3.5 sm:py-3 rounded-xl sm:rounded-lg text-[10px] sm:text-xs font-black sm:font-semibold uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${
                          activeTab === tab ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100/50"
                        }`}
                      >
                        {tab}
                      </button>
                    ));
                  })()}
               </div>

               <div className="bg-white p-8 lg:p-12 rounded-2xl border border-gray-100 shadow-sm min-h-[400px] relative overflow-hidden">
                  {/* Decorative element */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>

                  {activeTab === "speakers" && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-2xl font-semibold text-gray-900 tracking-tighter flex items-center gap-3">
                          <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                          Featured Speakers
                        </h3>
                        {event.speakers && event.speakers.length > 0 && (
                          <span className="px-4 py-1.5 bg-gray-50 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-gray-100">
                             {event.speakers.length} Speakers
                          </span>
                        )}
                      </div>

                      {event.speakers && event.speakers.length > 0 ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                          {event.speakers.map((speaker, i) => (
                            <SpeakerCard key={speaker.id || i} speaker={speaker} />
                          ))}
                        </div>
                      ) : (
                        <div className="py-32 text-center">
                           <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gray-300">
                             <Users size={40} />
                           </div>
                           <h4 className="text-xl font-semibold text-gray-900 mb-2">Speakers to be announced</h4>
                           <p className="text-gray-500 font-medium">We&apos;re bringing together some incredible voices for this event.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "overview" && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
                      <div className="space-y-4">
                        <h3 className="text-2xl font-semibold text-gray-900 tracking-tighter flex items-center gap-3">
                           <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                           About this event
                        </h3>
                        <div className="text-gray-600 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                          {event.description}
                        </div>
                      </div>

                      {/* Location Preview (Minimal) */}
                      <div className="pt-8 border-t border-gray-50 space-y-5">
                         <h3 className="text-lg font-semibold text-gray-900 tracking-tight flex items-center gap-2.5">
                            <MapPin size={20} className="text-primary" />
                            Where it&apos;s happening
                         </h3>
                         <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-1">
                               <p className="text-base font-semibold text-gray-900">
                                 {isLocationHidden
                                   ? "Available for registered guests"
                                   : (event.location || (event.virtualLink ? "Virtual Event" : "Virtual Experience"))
                                 }
                               </p>
                               <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Global Access Available</p>
                            </div>
                            {!isLocationHidden && (
                              <div className="flex flex-wrap gap-3">
                                {event.location && (
                                  <a
                                    href={event.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full md:w-auto px-6 py-4 md:py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                                  >
                                    Get Directions
                                    <ArrowRight size={16} />
                                  </a>
                                )}
                                {event.virtualLink && (
                                  <a
                                    href={event.virtualLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full md:w-auto px-6 py-4 md:py-3 bg-primary text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2"
                                  >
                                    Join Meeting
                                    <Globe size={16} />
                                  </a>
                                )}
                              </div>
                            )}
                         </div>
                      </div>

                      {event.tags && event.tags.length > 0 && (
                        <div className="pt-8 border-t border-gray-50 space-y-3">
                           <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Event Keywords</h4>
                           <div className="flex flex-wrap gap-2">
                              {event.tags.map(tag => (
                                <span key={tag} className="px-4 py-2 bg-gray-50 text-gray-600 text-[10px] font-semibold rounded-xl border border-gray-100 hover:bg-white hover:border-primary/20 hover:text-primary transition-all cursor-default">
                                  #{tag}
                                </span>
                              ))}
                           </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "schedule" && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-2xl font-semibold text-gray-900 tracking-tighter flex items-center gap-3">
                          <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                          The Schedule
                        </h3>
                        {event.sessions && event.sessions.length > 0 && (
                          <span className="px-4 py-1.5 bg-gray-50 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-gray-100">
                             {event.sessions.length} Sessions
                          </span>
                        )}
                      </div>

                      {event.sessions && event.sessions.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6">
                          {[...event.sessions]
                            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                            .map((session, i) => (
                              <SessionCard key={session.id || i} session={session} />
                          ))}
                        </div>
                      ) : (
                        <div className="py-32 text-center">
                           <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gray-300">
                             <Clock size={40} />
                           </div>
                           <h4 className="text-xl font-semibold text-gray-900 mb-2">Timeline being finalized</h4>
                           <p className="text-gray-500 font-medium">The organizer is putting the final touches on the schedule.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "tickets" && (
                     <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
                        <div className="space-y-6">
                           <h3 className="text-2xl font-semibold text-gray-900 tracking-tighter flex items-center gap-3">
                              <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                              {event.tickets && event.tickets.some(t => t.isSpecial) ? "Standard Access" : "Choose your Experience"}
                           </h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {event.tickets && event.tickets.filter(t => !t.isSpecial).map((ticket) => {
                                const isTicketSoldOut = ticket.isSoldOut || (ticket.remainingTickets !== undefined && ticket.remainingTickets <= 0) || (ticket.availableQuantity !== undefined && ticket.availableQuantity <= 0);
                                const ticketStatus = getTicketSalesStatus(ticket);

                                return (
                                  <button
                                    key={ticket.id}
                                    onClick={() => !isTicketSoldOut && setSelectedTicket(ticket)}
                                    className={`p-6 rounded-2xl text-left border transition-all duration-500 relative overflow-hidden group ${
                                      selectedTicket?.id === ticket.id
                                        ? "border-primary bg-primary/5 shadow-sm"
                                        : isTicketSoldOut
                                          ? "border-gray-100 bg-gray-50 opacity-60 grayscale cursor-not-allowed"
                                          : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                                    }`}
                                  >
                                     <div className="flex items-center justify-between mb-6">
                                        <div className="flex flex-wrap gap-2">
                                          <div className={`px-4 py-1.5 rounded-xl text-[9px] font-semibold uppercase tracking-widest ${ticket.type === 'FREE' ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-700'}`}>
                                             {ticket.type} PASS
                                          </div>
                                          {isTicketSoldOut ? (
                                            <div className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-rose-100 text-rose-600">
                                               SOLD OUT
                                            </div>
                                          ) : (
                                             <>
                                               {isEarlyBirdActive(ticket) && (
                                                 <div className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-emerald-500 text-white animate-pulse">
                                                   EARLY BIRD ACTIVE
                                                 </div>
                                               )}
                                               {ticketStatus === "UPCOMING" && (
                                                 <div className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700">
                                                   STARTING SOON
                                                 </div>
                                               )}
                                               {ticketStatus === "ENDED" && (
                                                 <div className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-gray-100 text-gray-600">
                                                   SALES ENDED
                                                 </div>
                                               )}
                                             </>
                                          )}
                                        </div>
                                        {selectedTicket?.id === ticket.id && !isTicketSoldOut && (
                                          <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center animate-in zoom-in duration-500 shadow-md shadow-primary/20">
                                             <CheckCircle2 size={16} />
                                          </div>
                                        )}
                                     </div>
                                     <h4 className={`text-2xl font-semibold mb-3 tracking-tight ${isTicketSoldOut ? 'text-gray-400' : 'text-gray-900'}`}>{ticket.name}</h4>
                                     <div className="flex items-baseline gap-2 flex-wrap">
                                        {isEarlyBirdActive(ticket) ? (
                                           <>
                                              <p className="text-lg text-gray-400 line-through">
                                                 ₦{Number(ticket.price).toLocaleString()}
                                              </p>
                                              <p className={`text-3xl font-semibold ${isTicketSoldOut ? 'text-gray-400' : 'text-emerald-600 font-bold'}`}>
                                                 ₦{Number(ticket.earlyBirdPrice).toLocaleString()}
                                              </p>
                                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider self-center">Early Bird</span>
                                           </>
                                        ) : (
                                           <p className={`text-3xl font-semibold ${isTicketSoldOut ? 'text-gray-400' : 'text-gray-900'}`}>
                                              {ticket.price > 0 ? `₦${ticket.price.toLocaleString()}` : "FREE"}
                                           </p>
                                        )}
                                        {ticket.price > 0 && <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">/ seat</span>}
                                     </div>

                                     <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-[0.1em]">
                                           <Users size={14} className={isTicketSoldOut ? 'text-gray-300' : 'text-primary'} />
                                           {isTicketSoldOut ? '0' : (ticket.remainingTickets ?? ticket.availableQuantity)} Slots Left
                                        </div>
                                        {!isTicketSoldOut ? (
                                          <p className="text-[10px] font-semibold text-primary group-hover:translate-x-2 transition-transform flex items-center gap-1.5">
                                             <ChevronRight size={14} />
                                          </p>
                                        ) : event.isWaitlistEnabled && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleJoinWaitlist(ticket);
                                            }}
                                            disabled={isJoiningWaitlist}
                                            className="text-[10px] font-black text-rose-600 hover:text-rose-700 transition-colors flex items-center gap-1.5"
                                          >
                                            JOIN WAITLIST <ChevronRight size={14} />
                                          </button>
                                        )}
                                     </div>
                                  </button>
                                );
                              })}
                           </div>
                        </div>

                        {event.tickets && event.tickets.some(t => t.isSpecial) && (
                           <div className="space-y-6 pt-6 border-t border-gray-50">
                              <button
                                 onClick={() => setIsSpecialTicketsExpanded(!isSpecialTicketsExpanded)}
                                 className="w-full flex items-center justify-between group"
                              >
                                 <h3 className="text-2xl font-semibold text-gray-900 tracking-tighter flex items-center gap-3">
                                    <div className="w-1.5 h-8 bg-amber-400 rounded-full"></div>
                                    Special Access
                                    <span className="text-sm font-bold text-gray-400 ml-2">({event.tickets.filter(t => t.isSpecial).length})</span>
                                 </h3>
                                 <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-primary group-hover:bg-primary/5 transition-all">
                                    {isSpecialTicketsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                 </div>
                              </button>

                              {isSpecialTicketsExpanded && (
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-500">
                                    {event.tickets.filter(t => t.isSpecial).map((ticket) => {
                                       const isTicketSoldOut = ticket.isSoldOut || (ticket.remainingTickets !== undefined && ticket.remainingTickets <= 0) || (ticket.availableQuantity !== undefined && ticket.availableQuantity <= 0);
                                       const ticketStatus = getTicketSalesStatus(ticket);

                                       return (
                                          <button
                                             key={ticket.id}
                                             onClick={() => !isTicketSoldOut && setSelectedTicket(ticket)}
                                             className={`p-6 rounded-2xl text-left border transition-all duration-500 relative overflow-hidden group ${
                                                selectedTicket?.id === ticket.id
                                                   ? "border-amber-400 bg-amber-50/30 shadow-sm"
                                                   : isTicketSoldOut
                                                      ? "border-gray-100 bg-gray-50 opacity-60 grayscale cursor-not-allowed"
                                                      : "border-gray-100 hover:border-amber-200 hover:bg-amber-50/10"
                                             }`}
                                          >
                                             <div className="flex items-center justify-between mb-6">
                                                <div className="flex flex-wrap gap-2">
                                                   <div className={`px-4 py-1.5 rounded-xl text-[9px] font-semibold uppercase tracking-widest ${ticket.type === 'FREE' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-700'}`}>
                                                      {ticket.type} PASS
                                                   </div>
                                                   {isTicketSoldOut ? (
                                                      <div className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-rose-100 text-rose-600">
                                                         SOLD OUT
                                                      </div>
                                                   ) : (
                                                      <>
                                                         {isEarlyBirdActive(ticket) && (
                                                            <div className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-emerald-500 text-white animate-pulse">
                                                               EARLY BIRD ACTIVE
                                                            </div>
                                                         )}
                                                         {ticketStatus === "UPCOMING" && (
                                                            <div className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700">
                                                               STARTING SOON
                                                            </div>
                                                         )}
                                                         {ticketStatus === "ENDED" && (
                                                            <div className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-gray-100 text-gray-600">
                                                               SALES ENDED
                                                            </div>
                                                         )}
                                                      </>
                                                   )}
                                                </div>
                                                {selectedTicket?.id === ticket.id && !isTicketSoldOut && (
                                                   <div className="w-8 h-8 bg-amber-400 text-white rounded-full flex items-center justify-center animate-in zoom-in duration-500 shadow-md shadow-amber-400/20">
                                                      <CheckCircle2 size={16} />
                                                   </div>
                                                )}
                                             </div>
                                             <h4 className={`text-2xl font-semibold mb-3 tracking-tight ${isTicketSoldOut ? 'text-gray-400' : 'text-gray-900'}`}>{ticket.name}</h4>
                                             {ticket.description && <p className="text-xs text-gray-500 font-medium mb-4 line-clamp-2">{ticket.description}</p>}
                                             <div className="flex items-baseline gap-2 flex-wrap">
                                                {isEarlyBirdActive(ticket) ? (
                                                   <>
                                                      <p className="text-lg text-gray-400 line-through">
                                                         ₦{Number(ticket.price).toLocaleString()}
                                                      </p>
                                                      <p className={`text-3xl font-semibold ${isTicketSoldOut ? 'text-gray-400' : 'text-emerald-600 font-bold'}`}>
                                                         ₦{Number(ticket.earlyBirdPrice).toLocaleString()}
                                                      </p>
                                                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider self-center">Early Bird</span>
                                                   </>
                                                ) : (
                                                   <p className={`text-3xl font-semibold ${isTicketSoldOut ? 'text-gray-400' : 'text-gray-900'}`}>
                                                      {ticket.price > 0 ? `₦${ticket.price.toLocaleString()}` : "FREE"}
                                                   </p>
                                                )}
                                                {ticket.price > 0 && <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">/ seat</span>}
                                             </div>

                                             <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-between">
                                                <div className="flex items-center gap-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-[0.1em]">
                                                   <Users size={14} className={isTicketSoldOut ? 'text-gray-300' : 'text-amber-500'} />
                                                   {isTicketSoldOut ? '0' : (ticket.remainingTickets ?? ticket.availableQuantity)} Slots Left
                                                </div>
                                                {!isTicketSoldOut ? (
                                                   <p className="text-[10px] font-semibold text-amber-600 group-hover:translate-x-2 transition-transform flex items-center gap-1.5">
                                                      <ChevronRight size={14} />
                                                   </p>
                                                ) : event.isWaitlistEnabled && (
                                                   <button
                                                      onClick={(e) => {
                                                         e.stopPropagation();
                                                         handleJoinWaitlist(ticket);
                                                      }}
                                                      disabled={isJoiningWaitlist}
                                                      className="text-[10px] font-black text-rose-600 hover:text-rose-700 transition-colors flex items-center gap-1.5"
                                                   >
                                                      JOIN WAITLIST <ChevronRight size={14} />
                                                   </button>
                                                )}
                                             </div>
                                          </button>
                                       );
                                    })}
                                 </div>
                              )}
                           </div>
                        )}
                     </div>
                  )}
               </div>
            </div>
          </div>

          {/* Checkout Sidebar - Prominent & Sticky */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-6">

               {/* Primary CTA Box */}
               <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl p-6 sm:p-8 lg:p-10 space-y-6 sm:space-y-8 overflow-hidden relative">
                  {/* Decorative Luma circle */}
                  <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>

                  <div className="relative z-10">
                     <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-1 tracking-tighter uppercase italic">Secure <span className="text-primary not-italic">Spot</span></h3>
                     <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em]">Experience it live</p>
                  </div>

                  <div className="space-y-5 sm:space-y-6 relative z-10">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Selection</label>
                        <div
                          className="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-all hover:border-primary/20 group shadow-sm"
                          onClick={() => setActiveTab("tickets")}
                        >
                           <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm border border-gray-100 group-hover:scale-110 transition-transform shrink-0">
                                 <Ticket size={20} />
                              </div>
                              <div className="text-left min-w-0">
                                 <p className="text-sm sm:text-base font-bold text-gray-900 leading-tight truncate">{selectedTicket?.name || "Choose a ticket"}</p>
                                 <p className="text-[9px] font-black text-primary uppercase tracking-widest mt-1">
                                    {isEarlyBirdActive(selectedTicket) ? "EARLY BIRD PASS" : (selectedTicket?.type || "Pending Selection")}
                                 </p>
                              </div>
                           </div>
                           <div
                              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm transition-all group/btn shrink-0 relative"
                              onClick={(e) => {
                                 e.stopPropagation();
                                 handleNextTicket();
                              }}
                           >
                              {showInteractionAnimation && (
                                 <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary"></span>
                                 </span>
                              )}
                              <ChevronRight
                                 size={18}
                                 className={`text-gray-400 group-hover/btn:translate-x-0.5 group-hover/btn:text-primary transition-all ${
                                    showInteractionAnimation ? "animate-bounce-right !text-primary font-bold" : ""
                                 }`}
                              />
                           </div>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <div className="flex items-center justify-between ml-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quantity</label>
                          {selectedTicket && selectedTicket.maxPerOrder > 0 && (
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Max {selectedTicket.maxPerOrder}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 bg-gray-50 p-1.5 sm:p-2 rounded-2xl border border-gray-100 shadow-sm">
                           <button
                             onClick={() => setQuantity(Math.max(1, quantity - 1))}
                             className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl text-xl font-bold text-gray-900 hover:text-primary shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center justify-center"
                           >-</button>
                           <div className="flex-1 text-center text-lg sm:text-xl font-black text-gray-900">{quantity}</div>
                           <button
                             onClick={() => {
                               const maxLimit = Math.min(
                                 selectedTicket?.availableQuantity || 1,
                                 selectedTicket?.maxPerOrder && selectedTicket.maxPerOrder > 0 ? selectedTicket.maxPerOrder : Infinity
                               );
                               if (quantity < maxLimit) {
                                 setQuantity(quantity + 1);
                               }
                             }}
                             disabled={quantity >= Math.min(
                               selectedTicket?.availableQuantity || 1,
                               selectedTicket?.maxPerOrder && selectedTicket.maxPerOrder > 0 ? selectedTicket.maxPerOrder : Infinity
                             )}
                             className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl text-xl font-bold text-gray-900 hover:text-primary shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                           >+</button>
                        </div>
                     </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-5 sm:p-6 space-y-3 sm:space-y-4 relative z-10 border border-gray-100/50">
                     <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">
                        <span className="truncate max-w-[150px]">{selectedTicket?.name || 'Selection'}</span>
                        {isEarlyBirdActive(selectedTicket) ? (
                           <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-gray-400 line-through">₦{((selectedTicket?.price || 0) * quantity).toLocaleString()}</span>
                              <span className="text-emerald-600 font-black">₦{((getTicketEffectivePrice(selectedTicket)) * quantity).toLocaleString()}</span>
                              <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded normal-case tracking-normal">Early Bird</span>
                           </div>
                        ) : (
                           <span className="text-gray-900 font-black">₦{((getTicketEffectivePrice(selectedTicket)) * quantity).toLocaleString()}</span>
                        )}
                     </div>
                     <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">
                        <span>Service Fee</span>
                        <span className="text-emerald-600 font-black uppercase">Free</span>
                     </div>
                     <div className="pt-4 sm:pt-5 border-t border-gray-200 flex items-center justify-between">
                        <span className="text-base sm:text-lg font-black text-gray-900 tracking-tighter uppercase italic">Total</span>
                        {isEarlyBirdActive(selectedTicket) ? (
                           <div className="flex items-baseline gap-1.5 flex-wrap">
                              <span className="text-sm text-gray-400 line-through font-bold">₦{((selectedTicket?.price || 0) * quantity).toLocaleString()}</span>
                              <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tighter">₦{((getTicketEffectivePrice(selectedTicket)) * quantity).toLocaleString()}</span>
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider self-center">Early Bird</span>
                           </div>
                        ) : (
                           <span className="text-2xl sm:text-3xl font-black text-primary tracking-tighter">₦{((getTicketEffectivePrice(selectedTicket)) * quantity).toLocaleString()}</span>
                        )}
                     </div>
                  </div>

                  <div className="space-y-4 relative z-10">
                     {(() => {
                        const isTicketSoldOut = (event.isSoldOut || event.availabilityStatus === 'SOLD_OUT') || (selectedTicket && (selectedTicket.isSoldOut || (selectedTicket.remainingTickets !== undefined && selectedTicket.remainingTickets <= 0)));
                        const ticketStatus = getTicketSalesStatus(selectedTicket);
                        const isNotOnSale = ticketStatus !== "ACTIVE";

                        if (isTicketSoldOut && event.isWaitlistEnabled) {
                          return (
                            <button
                              onClick={() => {
                                if (waitlistStatus) {
                                  router.push('/dashboard?tab=waitlists');
                                } else if (selectedTicket) {
                                  handleJoinWaitlist(selectedTicket);
                                }
                              }}
                              disabled={isJoiningWaitlist || !selectedTicket}
                              className="w-full font-black py-4 sm:py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-base sm:text-lg group bg-rose-600 text-white shadow-xl shadow-rose-600/20 hover:brightness-110 uppercase tracking-widest"
                            >
                              {isJoiningWaitlist ? 'Joining...' : waitlistStatus ? `You're #${waitlistStatus.position} on the waitlist` : 'Join Waitlist'}
                              <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                            </button>
                          );
                        }

                        return (
                          <button
                             onClick={handleRegister}
                             disabled={!selectedTicket || isTicketSoldOut || isNotOnSale}
                             className={`w-full font-black py-4 sm:py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-base sm:text-lg group uppercase tracking-widest ${
                                (isTicketSoldOut || isNotOnSale)
                                ? 'bg-rose-600 text-white shadow-xl shadow-rose-600/20'
                                : 'bg-primary text-white hover:brightness-110 shadow-xl shadow-primary/20 disabled:opacity-50 disabled:grayscale'
                             }`}
                          >
                             {isTicketSoldOut
                                ? 'SOLD OUT'
                                : ticketStatus === 'UPCOMING'
                                  ? 'Sales Starting Soon'
                                  : ticketStatus === 'ENDED'
                                    ? 'Sales Ended'
                                    : 'Claim your Ticket'}
                             {!isTicketSoldOut && ticketStatus === 'ACTIVE' && <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />}
                          </button>
                        );
                     })()}

                     <div className="flex items-center gap-3 pt-2">
                        {isRegistered && (
                          <button
                            onClick={() => handleAddToCalendar('google')}
                            className="flex-[2] py-4 bg-white border-2 border-gray-100 rounded-2xl text-[10px] font-black text-gray-600 uppercase tracking-widest hover:border-primary/20 hover:text-primary transition-all flex items-center justify-center gap-2 group"
                          >
                             <CalendarPlus size={14} className="group-hover:scale-110 transition-transform" />
                             Save Date
                          </button>
                        )}
                        <button
                          onClick={handleToggleBookmark}
                          disabled={isBookmarking}
                          className={`flex-1 py-4 bg-white border-2 rounded-2xl transition-all flex items-center justify-center ${
                            event.isBookmarked
                              ? 'text-red-500 border-red-100 bg-red-50'
                              : 'text-gray-400 border-gray-100 hover:text-red-500 hover:border-red-100'
                          } disabled:opacity-50`}
                          title={event.isBookmarked ? "Remove Bookmark" : "Bookmark Event"}
                        >
                           <Heart size={20} className={event.isBookmarked ? "fill-current" : ""} />
                        </button>
                        <button
                          onClick={handleShare}
                          className="flex-1 py-4 bg-white border-2 border-gray-100 rounded-2xl text-gray-400 hover:text-primary hover:border-blue-100 transition-all flex items-center justify-center"
                        >
                           <Share2 size={20} />
                        </button>
                     </div>
                  </div>

               </div>

               {/* Secondary Save Date Options - Explicit Luma Style */}
               {isRegistered && (
                 <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                          <BookmarkPlus size={20} />
                       </div>
                       <h4 className="font-semibold text-gray-900 tracking-tight">Calendar Sync</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                       <button
                         onClick={() => handleAddToCalendar('google')}
                         className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-white hover:shadow-md hover:shadow-primary/5 transition-all group border border-transparent hover:border-primary/10"
                       >
                          <span className="text-xs font-semibold text-gray-700 uppercase tracking-widest">Google Calendar</span>
                          <ChevronRight size={16} className="text-gray-300 group-hover:translate-x-1 transition-transform group-hover:text-primary" />
                       </button>
                       <button
                         onClick={() => handleDownloadICS()}
                         className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-white hover:shadow-md hover:shadow-primary/5 transition-all group border border-transparent hover:border-primary/10"
                       >
                          <div className="flex items-center gap-2">
                             <span className="text-xs font-semibold text-gray-700 uppercase tracking-widest">Apple / Outlook</span>
                             <Download size={14} className="text-gray-300 group-hover:text-primary" />
                          </div>
                          <ChevronRight size={16} className="text-gray-300 group-hover:translate-x-1 transition-transform group-hover:text-primary" />
                       </button>
                    </div>
                 </div>
               )}

               {/* Minimalist Organizer Card */}
               <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 bg-primary/5 rounded-xl flex items-center justify-center text-primary text-xl font-semibold relative overflow-hidden">
                     {event.organizer?.userProfile?.fullName?.[0] || 'O'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                     <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Organized by</p>
                     <div className="flex flex-col gap-1 items-start">
                        <h4 className="font-semibold text-gray-900 tracking-tight truncate mb-0.5">{event.organizer?.userProfile?.fullName || "Verified Organizer"}</h4>
                        <OrganizerStatusBadge
                          status={event.organizer?.organizerStatus}
                          isVerified={event.organizer?.isVerified}
                          size="small"
                        />
                     </div>
                     <button
                       onClick={() => router.push(`/events/${event.organizer?.slug || organizerSlug}`)}
                       className="text-[10px] font-black text-primary uppercase tracking-[0.15em] mt-2 hover:underline block"
                     >
                       View Profile
                     </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailClient;
