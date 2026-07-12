"use client";
import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import {
  Globe,
  Mail,
  Info,
  MapPin,
  Calendar,
  CalendarPlus,
  Heart,
  Sparkles,
  ArrowRight,
  Download,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  UserCheck
} from "lucide-react";
import api from "@/services/api";
import CustomLoader from "@/components/CustomLoader";
import Swal from "@/utils/sweetalert";
import { Event, Organizer } from "@/types";

interface OrganizerData extends Organizer {
  fullName?: string;
  email?: string;
}
import { AnimatePresence, motion } from "framer-motion";
import useOnClickOutside from "@/hooks/useOnClickOutside";
import LoginRequiredModal from "@/components/auth/LoginRequiredModal";

const EventCard = ({
  event,
  onBookmarkToggle
}: {
  event: Event;
  onBookmarkToggle: (eventId: string, newStatus: boolean) => void;
}) => {
  const [showCalendarOptions, setShowCalendarOptions] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(calendarRef, () => setShowCalendarOptions(false));

  const handleDownloadICS = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await api.get(`/events/${event.id}/ics`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${event.title}.ics`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to download ICS:", err);
      Swal.fire("Error", "Could not download calendar file.", "error");
    }
  };

  const handleAddToCalendar = async (e: React.MouseEvent, type: 'google' | 'outlook' | 'apple') => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await api.get(`/events/${event.id}/calendar-links`);
      const links = response.data.data;

      if (type === 'google') {
        const fmtDate = (d: string) => new Date(d).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const start = fmtDate(event.startDate);
        const end = event.endDate ? fmtDate(event.endDate) : fmtDate(new Date(new Date(event.startDate).getTime() + 2 * 60 * 60 * 1000).toISOString());

        const gLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start}/${end}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(event.hideLocationDetails ? 'Available for registered guests' : (event.location || ''))}`;
        window.open(gLink, '_blank');
        return;
      }

      if (links && links[type]) {
        window.open(links[type], '_blank');
      }
    } catch (err) {
      console.error("Failed to get calendar links:", err);
      Swal.fire("Error", "Could not open calendar.", "error");
    }
  };

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    try {
      setIsBookmarking(true);
      const response = await api.post(`/events/${event.id}/bookmark`);
      const data = response.data.data || response.data;
      const newStatus = data.bookmarked !== undefined ? data.bookmarked : data.isBookmarked;

      onBookmarkToggle(event.id, newStatus);

      Swal.toast.fire({
        icon: 'success',
        title: newStatus ? 'Event bookmarked' : 'Bookmark removed',
        timer: 2000
      });
    } catch (err) {
      console.error("Failed to toggle bookmark:", err);
    } finally {
      setIsBookmarking(false);
    }
  };

  const isSoldOut = event.isSoldOut || event.availabilityStatus === 'SOLD_OUT';
  const isWaitlistEnabled = !!event.isWaitlistEnabled;
  const showWaitlist = isSoldOut && isWaitlistEnabled;

  const eventUrl = event.organizer?.slug && event.slug
    ? `/events/${event.organizer.slug}/${event.slug}`
    : `/events/${event.id}`;

  return (
    <div className="bg-white border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-500 group relative rounded-xl">
      <LoginRequiredModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <Link href={eventUrl} className="block">
        <div className="relative w-full overflow-hidden h-48">
          {event.bannerUrl ? (
            <Image src={event.bannerUrl} alt={event.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
               <Calendar size={48} className="text-primary/20" />
            </div>
          )}

          {/* Overlay Badges */}
          <div className="absolute inset-x-0 top-0 p-4 flex items-start justify-between">
            <span className="px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md shadow-sm text-[10px] font-semibold uppercase tracking-widest text-primary w-fit">
              {event.category}
            </span>
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={handleToggleBookmark}
                disabled={isBookmarking}
                className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-md backdrop-blur-md transition-all ${
                  event.isBookmarked
                    ? 'bg-red-500 text-white shadow-red-500/20'
                    : 'bg-white/90 text-gray-400 hover:text-red-500'
                } disabled:opacity-50`}
                title={event.isBookmarked ? "Remove Bookmark" : "Bookmark Event"}
              >
                <Heart size={14} className={event.isBookmarked ? "fill-current" : ""} />
              </button>
              {event.isFeatured && (
                <div className="w-8 h-8 bg-amber-400 text-white rounded-xl flex items-center justify-center shadow-md">
                  <Sparkles size={14} className="fill-current" />
                </div>
              )}
              {isSoldOut && (
                <div className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/20">
                  Sold Out
                </div>
              )}
            </div>
          </div>

          {/* Date Overlay */}
          <div className="absolute bottom-4 left-4">
             <div className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-sm flex items-center gap-2.5">
                <div className="flex flex-col items-center leading-none">
                   <span className="text-[9px] font-semibold text-primary uppercase">
                     {new Date(event.startDate).toLocaleDateString(undefined, { month: 'short' })}
                   </span>
                   <span className="text-lg font-semibold text-gray-900">
                     {new Date(event.startDate).toLocaleDateString(undefined, { day: 'numeric' })}
                   </span>
                </div>
                <div className="w-px h-5 bg-gray-200"></div>
                <div className="text-[9px] font-medium text-gray-500 uppercase tracking-widest">
                   {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
             </div>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors leading-tight text-lg">
              {event.title}
            </h3>

            <div className="relative" ref={calendarRef}>
               <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowCalendarOptions(!showCalendarOptions);
                  }}
                  className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:text-primary hover:bg-blue-50 transition-all"
                  title="Add to Calendar"
               >
                  <CalendarPlus size={20} />
               </button>

               <AnimatePresence>
                 {showCalendarOptions && (
                   <motion.div
                     initial={{ opacity: 0, scale: 0.9, y: 10 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.9, y: 10 }}
                     className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-3 z-[20] overflow-hidden"
                   >
                      <p className="px-4 pb-2 mb-2 border-b border-gray-50 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Save Event</p>
                      <button
                        onClick={(e) => handleAddToCalendar(e, 'google')}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
                      >
                        Google Calendar
                      </button>
                      <button
                        onClick={(e) => handleDownloadICS(e)}
                        className="flex items-center justify-between w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
                      >
                        <span>iCal / Outlook</span>
                        <Download size={14} className="opacity-50" />
                      </button>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </div>

          {event.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-4">
              {event.description}
            </p>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mb-6">
            <MapPin size={16} className="text-primary/60 flex-shrink-0" />
            <span className="line-clamp-1">
              {event.hideLocationDetails ? "Available for registered guests" : (event.location || "Virtual Event")}
            </span>
          </div>

          <div className="flex items-center justify-between pt-5 border-t border-gray-50">
            <div className="space-y-0.5">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">
                {showWaitlist ? "Waitlist" : "Starts from"}
              </p>
              <p className={`text-xl font-semibold ${showWaitlist ? 'text-rose-600' : 'text-gray-900'}`}>
                {showWaitlist
                  ? "JOIN WAITLIST"
                  : (event.tickets && event.tickets[0]?.price > 0 ? `₦${event.tickets[0].price.toLocaleString()}` : "Free")
                }
              </p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-all ${
              (!isSoldOut || isWaitlistEnabled)
                ? 'bg-primary text-white shadow-primary/10 group-hover:scale-110'
                : 'bg-gray-100 text-gray-400'
            }`}>
              <ArrowRight size={18} />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

const OrganizerProfilePage = () => {
  const { organizerSlug } = useParams();
  const router = useRouter();
  const [organizer, setOrganizer] = useState<OrganizerData | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkRedirectOrFetch = async () => {
      if (!organizerSlug || typeof organizerSlug !== 'string') return;

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(organizerSlug)) {
        setIsRedirecting(true);
        try {
          const response = await api.get(`/events/${organizerSlug}`);
          const eventData = response.data.data;
          if (eventData.organizer?.slug && eventData.slug) {
            router.replace(`/events/${eventData.organizer.slug}/${eventData.slug}`);
          } else {
            setIsRedirecting(false);
            setError("Could not redirect to event page.");
            setLoading(false);
          }
        } catch (_error) {
          console.error("Failed to fetch event for redirect:", _error);
          setIsRedirecting(false);
          setError("Failed to fetch event redirect.");
          setLoading(false);
        }
        return;
      }

      // Fetch Profile & Events
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/events/o/${organizerSlug}`);
        const responseData = response.data.data || response.data;
        if (responseData?.organizer) {
          setOrganizer(responseData.organizer);
          setEvents(responseData.events || []);
        } else {
          setOrganizer(responseData);
          setEvents([]);
        }
      } catch (err) {
        console.error("Failed to fetch organizer profile and events:", err);
        setError("Could not load organizer profile. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (organizerSlug) {
      checkRedirectOrFetch();
    }
  }, [organizerSlug, router]);

  const handleBookmarkToggle = (eventId: string, newStatus: boolean) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, isBookmarked: newStatus } : e));
  };

  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <CustomLoader />
      </div>
    );
  }

  if (error || !organizer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 p-4 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4">
          <Info size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h3>
        <p className="text-gray-600 mb-6 max-w-md">{error || "The requested organizer profile was not found."}</p>
        <Link
          href="/events"
          className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:brightness-110 transition-all text-sm uppercase tracking-wider"
        >
          Discover Events
        </Link>
      </div>
    );
  }

  const organizerName = organizer.fullName || organizer.userProfile?.fullName || "Verified Organizer";
  const organizerBio = organizer.bio || "No biography provided.";
  const organizerEmail = organizer.email || organizer.userProfile?.email;
  const organizerWebsite = organizer.website;
  const organizerSocials = organizer.socialLinks || {};

  const renderSocialIcon = (platform: string, url: string) => {
    const iconSize = 20;
    const commonClasses = "p-3.5 bg-gray-50 rounded-2xl text-gray-400 hover:text-primary hover:bg-primary/5 transition-all border border-transparent hover:border-primary/10";

    let Icon = Globe;
    if (platform.toLowerCase().includes('instagram')) Icon = Instagram;
    else if (platform.toLowerCase().includes('twitter') || platform.toLowerCase().includes('x.com')) Icon = Twitter;
    else if (platform.toLowerCase().includes('linkedin')) Icon = Linkedin;
    else if (platform.toLowerCase().includes('facebook')) Icon = Facebook;

    return (
      <a
        key={platform}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={commonClasses}
        title={platform}
      >
        <Icon size={iconSize} />
      </a>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pt-32 pb-24">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-8 overflow-x-auto no-scrollbar whitespace-nowrap">
          <Link href="/events" className="hover:text-primary transition-colors flex items-center gap-1">
            Discovery
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-400">Organizers</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 truncate">{organizerName}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Profile Card Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden relative">
              {/* Profile Background Banner Decorator */}
              <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent relative shrink-0"></div>

              <div className="px-6 sm:px-8 pb-10 -mt-12 relative">
                {/* Profile Avatar / Initial bubble */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-primary text-3xl font-black shadow-xl border-4 border-white">
                    {organizerName[0] || 'O'}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                      {organizerName}
                    </h3>
                    <div className="flex items-center justify-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                      <UserCheck size={12} />
                      Verified Organizer
                    </div>
                  </div>
                </div>

                {/* Bio Section */}
                <div className="mt-8 space-y-3">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    About the Organizer
                  </h4>
                  <div className="bg-gray-50 p-6 rounded-2xl text-gray-600 text-sm font-medium leading-relaxed">
                    {organizerBio}
                  </div>
                </div>

                {/* Contact & Social Links */}
                <div className="mt-8 space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    {organizerWebsite && (
                      <a
                        href={organizerWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3.5 p-4 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-md border border-transparent hover:border-primary/10 transition-all group"
                      >
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                          <Globe size={18} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">
                            Website
                          </p>
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {organizerWebsite.replace(/^https?:\/\//, '')}
                          </p>
                        </div>
                      </a>
                    )}
                    {organizerEmail && (
                      <a
                        href={`mailto:${organizerEmail}`}
                        className="flex items-center gap-3.5 p-4 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-md border border-transparent hover:border-primary/10 transition-all group"
                      >
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                          <Mail size={18} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">
                            Email Address
                          </p>
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {organizerEmail}
                          </p>
                        </div>
                      </a>
                    )}
                  </div>

                  {organizerSocials && Object.keys(organizerSocials).length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        Social Presence
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {Object.entries(organizerSocials).map(([platform, url]) =>
                          url ? renderSocialIcon(platform, url as string) : null
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Events List Content Area */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-gray-900 tracking-tight flex items-center gap-3">
                <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                Events Lineup
              </h3>
              <span className="px-4 py-1.5 bg-white rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-gray-100 shadow-sm">
                {events.length} {events.length === 1 ? "Event" : "Events"}
              </span>
            </div>

            {events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onBookmarkToggle={handleBookmarkToggle}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gray-300">
                  <Calendar size={40} />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">No events scheduled yet</h4>
                <p className="text-gray-500 font-medium max-w-sm mx-auto">
                  This organizer doesn&apos;t have any public events lined up. Check back later or follow their social media!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerProfilePage;
