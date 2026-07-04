"use client";
import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Calendar,
  Search,
  Filter,
  MapPin,
  ArrowRight,
  PlusCircle,
  LayoutGrid,
  ChevronRight,
  Heart,
  CheckCircle2,
  X,
  Map as MapIcon,
  Sparkles,
  Zap,
  MapPinned,
  CalendarPlus,
  Download,
  Cpu,
  Church,
  Users,
  Briefcase,
  Wrench,
  Music,
  MoreHorizontal,
  Layers
} from "lucide-react";
import Image from "next/image";
import api from "@/services/api";
import { Event } from "@/types";
import CustomLoader from "@/components/CustomLoader";
import { eventTracking } from "@/services/eventTracking";
import { motion, AnimatePresence } from "framer-motion";
import useOnClickOutside from "@/hooks/useOnClickOutside";
import useIntersectionObserver from "@/hooks/useIntersectionObserver";
import Swal from "@/utils/sweetalert";
import LoginRequiredModal from "@/components/auth/LoginRequiredModal";
interface DiscoveryData {
  featured: Event[];
  upcoming: Event[];
  nearby: Event[];
  bookmarks: Event[];
  byCategory: Record<string, Event[]>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CATEGORY_ICONS: Record<string, any> = {
  "Technology": Cpu,
  "Religious": Church,
  "Social": Users,
  "Corporate": Briefcase,
  "Workshop": Wrench,
  "Concert": Music,
  "Other": MoreHorizontal,
  "All": Layers
};

const EventDiscoveryContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, updateToken } = useAuth();
  const [discoveryData, setDiscoveryData] = useState<DiscoveryData>({
    featured: [],
    upcoming: [],
    nearby: [],
    bookmarks: [],
    byCategory: {}
  });
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [heroBannerImage, setHeroBannerImage] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Event[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Filters - Synced with EventHeader/URL
  const searchTerm = searchParams.get("search") || "";
  const locationTerm = searchParams.get("location") || "";
  const [activeCategory, setActiveCategory] = useState("All");
  const [eventType, setEventType] = useState<string>("All");
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showBookmarksDrawer, setShowBookmarksDrawer] = useState(false);

  // Geolocation
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  }, []);

  const fetchDiscoveryEvents = useCallback(async () => {
    try {
      const params: Record<string, number | undefined> = {};
      if (coords) {
        params.lat = coords.lat;
        params.lng = coords.lng;
      }

      const response = await api.get("/events/discovery", { params });
      const data = response.data.data;

      let bookmarks: Event[] = [];
      if (user) {
        try {
          const bookmarkRes = await api.get("/events/my-bookmarks");
          bookmarks = bookmarkRes.data.data || [];
          setBookmarkedIds(new Set(bookmarks.map(e => e.id)));
        } catch (err) {
          console.error("Failed to fetch bookmarks:", err);
        }
      } else {
        setBookmarkedIds(new Set());
      }

      if (data) {
        setDiscoveryData({
          featured: data.featured || [],
          upcoming: data.upcoming || [],
          nearby: data.nearby || [], // Assuming the API might return nearby
          bookmarks,
          byCategory: data.byCategory || {}
        });

        // Collect all available banner images
        const allEvents = [
          ...(data.featured || []),
          ...(data.upcoming || []),
          ...(data.nearby || []),
          ...Object.values(data.byCategory || {}).flat()
        ];

        const bannerImages = allEvents
          .map(event => (event as Event).bannerUrl)
          .filter((url): url is string => !!url);

        if (bannerImages.length > 0) {
          // Shuffle and pick one
          const shuffled = [...bannerImages].sort(() => 0.5 - Math.random());
          setHeroBannerImage(shuffled[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch discovery events:", error);
    }
  }, [coords, user]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get("/events/utils/categories");
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, []);

  useEffect(() => {
    fetchDiscoveryEvents();
    fetchCategories();
  }, [fetchDiscoveryEvents, fetchCategories]);

  const handleSearch = useCallback(async (page = 1, append = false) => {
    try {
      if (page === 1) setSearching(true);
      else setLoadingMore(true);

      const params: Record<string, string | number | boolean | undefined> = {
        page,
        limit: pagination.limit,
      };

      const queryParts = [];
      if (searchTerm) queryParts.push(searchTerm);
      if (locationTerm) queryParts.push(locationTerm);

      if (queryParts.length > 0) {
        params.search = queryParts.join(" ");
      }

      if (activeCategory !== "All") params.category = activeCategory;
      if (eventType !== "All") params.type = eventType;

      const response = await api.get("/events", { params });
      const { data, pagination: pagin } = response.data;

      if (append) {
        setSearchResults(prev => [...prev, ...data]);
      } else {
        setSearchResults(data);
      }
      setPagination(pagin);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setSearching(false);
      setLoadingMore(false);
    }
  }, [searchTerm, locationTerm, activeCategory, eventType, pagination.limit]);

  useEffect(() => {
    if (searchTerm || locationTerm || activeCategory !== "All" || eventType !== "All") {
      handleSearch(1);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, locationTerm, activeCategory, eventType, handleSearch]);

  const loadMore = () => {
    if (pagination.page < pagination.pages) {
      handleSearch(pagination.page + 1, true);
    }
  };

  const isSearching = searchTerm || locationTerm || activeCategory !== "All" || eventType !== "All";

  const handleHostEventClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!user) {
      router.push("/host-event");
      return;
    }

    if (user.role?.includes('organizer')) {
      if (user.activeRole === 'organizer') {
        router.push("/organizer/dashboard/events/create");
        return;
      }

      // Silent role switch for organizers
      try {
        Swal.showLoading();
        const response = await api.post('/auth/switch-role', { role: 'organizer' });
        const data = response.data.data || response.data;
        const token = data.accessToken || data.token;

        if (token) {
          updateToken(token, "/organizer/dashboard/events/create");
        } else {
          throw new Error("No token received from server");
        }
      } catch (error) {
        console.error("Failed to switch to organizer role:", error);
        // Fallback to manual redirect if silent switch fails
        router.push("/organizer/dashboard/events/create");
      } finally {
        Swal.close();
      }
    } else {
      router.push("/host-event");
    }
  };

  const renderEventCard = (
    event: Event,
    variant: 'featured' | 'standard' = 'standard',
    surface: string = 'events-list',
    position?: number
  ) => {
    return (
      <EventCard
        key={event.id}
        event={event}
        variant={variant}
        surface={surface}
        position={position}
      />
    );
  };

  const EventCard = ({
    event,
    variant,
    className,
    surface,
    position
  }: {
    event: Event,
    variant: 'featured' | 'standard',
    className?: string,
    surface: string,
    position?: number
  }) => {
    const [showCalendarOptions, setShowCalendarOptions] = useState(false);
    const [isBookmarking, setIsBookmarking] = useState(false);
    const isBookmarked = bookmarkedIds.has(event.id);
    const calendarRef = React.useRef<HTMLDivElement>(null);
    const cardRef = React.useRef<HTMLDivElement>(null);
    const impressionTracked = React.useRef(false);
    useOnClickOutside(calendarRef, () => setShowCalendarOptions(false));

    const isVisible = useIntersectionObserver(cardRef, { threshold: 0.5 });

    useEffect(() => {
      if (isVisible && !impressionTracked.current) {
        eventTracking.logInteraction(event.id, 'IMPRESSION', {
          surface,
          viewportRatio: 0.5,
          position
        });
        impressionTracked.current = true;
      }
    }, [isVisible, event.id, surface, position]);

    const handleTrackClick = () => {
      eventTracking.logInteraction(event.id, 'CLICK', {
        surface,
        position
      });
    };

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
      } catch (error) {
        console.error("Failed to download ICS:", error);
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
      } catch (error) {
        console.error("Failed to get calendar links:", error);
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

        // Handle both nested and flat response structures
        const data = response.data.data || response.data;
        const newStatus = data.bookmarked !== undefined ? data.bookmarked : data.isBookmarked;

        // Update centralized IDs
        setBookmarkedIds(prev => {
          const next = new Set(prev);
          if (newStatus) next.add(event.id);
          else next.delete(event.id);
          return next;
        });

        // Update discoveryData.bookmarks to immediately show/hide
        setDiscoveryData(prev => {
          if (newStatus) {
            // Add if not present
            if (!prev.bookmarks.find(e => e.id === event.id)) {
              return { ...prev, bookmarks: [event, ...prev.bookmarks] };
            }
          } else {
            // Remove
            return { ...prev, bookmarks: prev.bookmarks.filter(e => e.id !== event.id) };
          }
          return prev;
        });

        Swal.toast.fire({
          icon: 'success',
          title: newStatus ? 'Event bookmarked' : 'Bookmark removed',
          timer: 2000
        });
      } catch (error) {
        console.error("Failed to toggle bookmark:", error);
      } finally {
        setIsBookmarking(false);
      }
    };

    const isSoldOut = event.isSoldOut || event.availabilityStatus === 'SOLD_OUT';
    const isWaitlistEnabled = !!event.isWaitlistEnabled;
    const showWaitlist = isSoldOut && isWaitlistEnabled;

    const eventUrl = event.organizer?.slug && event.slug
      ? `/events/${event.organizer.slug}/${event.slug}?src=${surface}`
      : `/events/${event.id}?src=${surface}`;

    return (
    <div
      ref={cardRef}
      className={`bg-white border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-500 group relative ${
        variant === 'featured' ? 'rounded-2xl' : 'rounded-xl'
      } ${className || ""}`}
    >
      <Link href={eventUrl} className="block" onClick={handleTrackClick}>
      <div className={`relative w-full overflow-hidden ${variant === 'featured' ? 'h-64' : 'h-48'}`}>
        {event.bannerUrl ? (
          <Image src={event.bannerUrl} alt={event.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
             <Calendar size={48} className="text-primary/20" />
          </div>
        )}

        {/* Overlay Badges */}
        <div className="absolute inset-x-0 top-0 p-4 flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md shadow-sm text-[10px] font-semibold uppercase tracking-widest text-primary w-fit">
              {event.category}
            </span>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={handleToggleBookmark}
              disabled={isBookmarking}
              className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-md backdrop-blur-md transition-all ${
                isBookmarked
                  ? 'bg-red-500 text-white shadow-red-500/20'
                  : 'bg-white/90 text-gray-400 hover:text-red-500'
              } disabled:opacity-50`}
              title={isBookmarked ? "Remove Bookmark" : "Bookmark Event"}
            >
              <Heart size={14} className={isBookmarked ? "fill-current" : ""} />
            </button>
            {event.isFeatured && (
              <div className="w-8 h-8 bg-amber-400 text-white rounded-xl flex items-center justify-center shadow-md">
                <Sparkles size={14} className="fill-current" />
              </div>
            )}
            {(event.isSoldOut || event.availabilityStatus === 'SOLD_OUT') && (
              <div className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/20 animate-in fade-in zoom-in duration-300">
                Sold Out
              </div>
            )}
          </div>
        </div>

        {/* Date Overlay */}
        <div className="absolute bottom-4 left-4">
           <div className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-sm flex items-center gap-2.5">
              <div className="flex flex-col items-center leading-none">
                 <span className="text-[9px] font-semibold text-primary uppercase">{new Date(event.startDate).toLocaleDateString(undefined, { month: 'short' })}</span>
                 <span className="text-lg font-semibold text-gray-900">{new Date(event.startDate).toLocaleDateString(undefined, { day: 'numeric' })}</span>
              </div>
              <div className="w-px h-5 bg-gray-200"></div>
              <div className="text-[9px] font-medium text-gray-500 uppercase tracking-widest">
                 {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
           </div>
        </div>
      </div>

      <div className="p-5 lg:p-6">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className={`font-semibold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors leading-tight ${variant === 'featured' ? 'text-xl' : 'text-lg'}`}>
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

  const BookmarksDrawer = () => (
    <AnimatePresence>
      {showBookmarksDrawer && (
        <div className="fixed inset-0 z-[110]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowBookmarksDrawer(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-y-0 right-0 w-full max-w-md bg-gray-50 shadow-2xl flex flex-col border-l border-white/20"
          >
            {/* Header */}
            <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                   <Heart className="text-red-500 fill-red-500" size={20} />
                   My Bookmarks
                </h3>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                   {discoveryData.bookmarks.length} Saved Events
                </p>
              </div>
              <button
                onClick={() => setShowBookmarksDrawer(false)}
                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
              {discoveryData.bookmarks.length > 0 ? (
                <div className="space-y-6">
                   {discoveryData.bookmarks.map((event, idx) => (
                      <div key={event.id} className="animate-in fade-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                        {renderEventCard(event, 'standard', 'bookmarks-drawer', idx + 1)}
                      </div>
                   ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                   <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-inner text-gray-200 mb-6">
                      <Heart size={40} />
                   </div>
                   <h4 className="text-lg font-bold text-gray-900 mb-2">No bookmarks yet</h4>
                   <p className="text-sm text-gray-500 font-medium leading-relaxed">
                     Start exploring events and save the ones you love to find them here later.
                   </p>
                   <button
                     onClick={() => setShowBookmarksDrawer(false)}
                     className="mt-8 px-6 py-3 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                   >
                     Explore Events
                   </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-white border-t border-gray-100 flex items-center justify-center">
               <button
                 onClick={() => setShowBookmarksDrawer(false)}
                 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest hover:text-gray-600 transition-colors"
               >
                 Close Bookmarks
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const FilterSidebar = () => (
    <aside className="hidden lg:block w-72 space-y-6 flex-shrink-0">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 sticky top-32">
        {/* Bookmarks Toggle */}
        <button
          onClick={() => {
            if (!user) setShowLoginModal(true);
            else setShowBookmarksDrawer(true);
          }}
          className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
               <Heart size={16} className="fill-red-500 text-red-500" />
            </div>
            <span className="text-sm font-bold uppercase tracking-tight">My Bookmarks</span>
          </div>
          {discoveryData.bookmarks.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
              {discoveryData.bookmarks.length}
            </span>
          )}
        </button>

        <div className="h-px bg-gray-50 mx-2"></div>

        <div className="flex items-center justify-between">
           <h4 className="font-semibold text-gray-900 uppercase tracking-tighter text-base flex items-center gap-2">
             <Filter size={18} className="text-primary" />
             Filters
           </h4>
           {isSearching && (
              <button
                onClick={() => {
                  router.push("/events");
                  setActiveCategory("All");
                  setEventType("All");
                }}
                className="text-[10px] font-semibold text-primary hover:underline uppercase tracking-widest"
              >
                Reset
              </button>
           )}
        </div>

        {/* Category Filter */}
        <div id="discovery-categories" className="space-y-3">
           <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1">Category</label>
           <div className="flex flex-col gap-1.5">
              {["All", ...categories].map(cat => {
                const Icon = CATEGORY_ICONS[cat] || MoreHorizontal;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      activeCategory === cat ? 'bg-primary text-white shadow-md shadow-primary/10' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} className={activeCategory === cat ? 'text-white' : 'text-primary/60'} />
                      {cat}
                    </div>
                    {activeCategory === cat && <CheckCircle2 size={14} />}
                  </button>
                );
              })}
           </div>
        </div>

        {/* Event Type Filter */}
        <div className="space-y-3">
           <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1">Event Type</label>
           <div className="grid grid-cols-1 gap-1.5">
              {["All", "PHYSICAL", "ONLINE", "HYBRID"].map(type => (
                <button
                  key={type}
                  onClick={() => setEventType(type)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    eventType === type ? 'bg-primary text-white shadow-md shadow-primary/10' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="capitalize">{type.toLowerCase()}</span>
                  {eventType === type && <CheckCircle2 size={14} />}
                </button>
              ))}
           </div>
        </div>

        {/* View Toggle */}
        <div id="discovery-view-toggle" className="pt-4 border-t border-gray-100">
           <div className="flex bg-gray-50 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all text-xs font-semibold ${viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <LayoutGrid size={14} />
                Grid
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all text-xs font-semibold ${viewMode === 'map' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <MapIcon size={14} />
                Map
              </button>
           </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      <BookmarksDrawer />

      {/* Hero Section - Immersive & Minimal */}
      <section className="container mx-auto px-4 mb-12">
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-8 lg:py-10 lg:px-12 text-white relative overflow-hidden shadow-sm min-h-[320px] flex items-center">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-widest mb-4">
              <Sparkles size={12} className="text-amber-400" />
              Explore curated experiences
            </div>

            <div className="flex flex-col gap-4 mb-2">
               <h1 className="text-3xl md:text-5xl lg:text-6xl font-semibold leading-[1.1] tracking-tighter uppercase">
                 Discover <br/>
                 <span className="text-primary italic">Something</span> New.
               </h1>
               <p className="text-gray-400 text-base md:text-lg font-medium max-w-xl leading-relaxed">
                 Join thousands discovering local workshops, tech meetups, and music festivals.
               </p>

               <div className="flex items-center gap-3 mt-2">
                  <button
                    id="discovery-host-event"
                    onClick={handleHostEventClick}
                    className="bg-primary text-white px-6 py-3 rounded-xl text-sm font-semibold uppercase tracking-widest hover:scale-105 transition-all shadow-md shadow-primary/10"
                  >
                    Host an Event
                  </button>
                  <button
                    id="discovery-browse-list"
                    onClick={() => {
                      const el = document.getElementById('main-listing');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl text-sm font-semibold uppercase tracking-widest hover:bg-white/10 transition-all shadow-sm"
                  >
                    Browse List
                  </button>
               </div>
            </div>
          </div>

          {/* Background Image with Gradient Overlay */}
          {heroBannerImage && (
            <div className="absolute inset-0 z-0 select-none pointer-events-none hero-banner-image">
              <div className="absolute inset-y-0 right-0 w-full h-full">
                <Image
                  src={heroBannerImage}
                  alt=""
                  fill
                  className="object-cover object-center"
                  priority
                />
                {/* Gradient overlay: Dark on left to keep text readable, transparent on right */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/90 to-gray-950/20 lg:from-gray-950 lg:via-gray-950/80 lg:to-transparent"></div>
              </div>
            </div>
          )}

          {!heroBannerImage && (
            <>
              <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/20 rounded-full blur-[80px]"></div>
              <div className="absolute bottom-0 right-10 translate-y-1/4 hidden 2xl:block opacity-5">
                 <div className="relative">
                    <div className="w-64 h-80 bg-white/5 rounded-2xl border border-white/10 shadow-sm rotate-6"></div>
                    <div className="absolute inset-0 w-64 h-80 bg-white/5 rounded-2xl border border-white/10 shadow-sm -rotate-3"></div>
                 </div>
              </div>
            </>
          )}
        </div>
      </section>

      <div id="main-listing" className="container mx-auto px-4 flex flex-col lg:flex-row gap-12">
        <FilterSidebar />

        {/* Mobile Filter Button */}
        <button
          onClick={() => setShowMobileFilters(true)}
          className="lg:hidden flex items-center justify-center gap-2 w-full py-4 bg-white border border-gray-100 rounded-xl font-semibold text-gray-900 shadow-sm mb-8"
        >
          <Filter size={20} />
          Filters & View
        </button>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {searching ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-6">
               <div className="relative">
                  <CustomLoader size={48} className="text-primary" />
                  <Search className="absolute inset-0 m-auto text-primary" size={16} />
               </div>
               <p className="text-gray-500 font-semibold uppercase tracking-widest text-xs animate-pulse">Scanning the horizon for events...</p>
            </div>
          ) : isSearching ? (
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                 <div>
                    <h2 className="text-3xl font-semibold text-gray-900 tracking-tighter">Search Results</h2>
                    <p className="text-gray-500 font-medium mt-1">We found <span className="text-primary">{pagination.total}</span> events matching your search</p>
                 </div>
                 {viewMode === 'map' && (
                    <div className="flex items-center gap-2 text-primary font-semibold text-[10px] uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 shadow-sm">
                       <MapPinned size={14} />
                       Map mode active
                    </div>
                 )}
              </div>

              {viewMode === 'grid' ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {searchResults.map((event, idx) => renderEventCard(event, 'standard', 'search-results', idx + 1))}
                  </div>

                  {searchResults.length === 0 && (
                    <div className="py-24 text-center bg-white rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                      <div className="absolute -top-24 -left-24 w-64 h-64 bg-gray-50 rounded-full blur-3xl"></div>
                      <div className="relative z-10">
                        <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gray-300">
                          <Search size={40} />
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4 tracking-tighter">No events discovered</h3>
                        <p className="text-gray-500 font-medium max-w-md mx-auto mb-8 text-base leading-relaxed">
                          We couldn&apos;t find any events matching your criteria. Try widening your search radius or changing categories.
                        </p>
                        <button
                          onClick={() => {
                            router.push("/events");
                            setActiveCategory("All");
                            setEventType("All");
                          }}
                          className="px-8 py-4 bg-primary text-white font-semibold rounded-xl shadow-lg shadow-primary/10 hover:scale-105 transition-all"
                        >
                          Clear all filters
                        </button>
                      </div>
                    </div>
                  )}

                  {pagination.page < pagination.pages && (
                    <div className="mt-16 text-center">
                      <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="px-10 py-4 bg-white border-2 border-primary text-primary font-semibold rounded-xl hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/5 disabled:opacity-50 flex items-center gap-3 mx-auto text-base group"
                      >
                        {loadingMore ? <CustomLoader size={20} /> : <PlusCircle size={20} className="group-hover:rotate-90 transition-transform" />}
                        {loadingMore ? 'Fetching more...' : 'Discover more events'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="relative h-[700px] w-full rounded-2xl overflow-hidden border border-gray-100 shadow-2xl bg-gray-100 group">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={`https://www.google.com/maps/embed/v1/place?key=PLACEHOLDER_KEY&q=${encodeURIComponent(locationTerm || 'Lagos, Nigeria')}`}
                  ></iframe>
                  <div className="absolute inset-0 bg-black/5 flex flex-col items-center justify-center pointer-events-none group-hover:bg-black/0 transition-colors">
                     <div className="bg-white/95 backdrop-blur-xl p-10 rounded-2xl shadow-2xl text-center max-w-md pointer-events-auto border border-white relative overflow-hidden">
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
                        <div className="w-20 h-20 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                          <MapIcon size={32} />
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4 tracking-tighter">Interactive Map Explorer</h3>
                        <p className="text-gray-500 font-medium leading-relaxed mb-8">
                          Visualize events happening across the city. Click pins to explore details and book tickets instantly.
                        </p>
                        <button
                          onClick={() => setViewMode('grid')}
                          className="px-8 py-4 bg-primary text-white font-semibold rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-3 mx-auto hover:scale-105 transition-all"
                        >
                          <LayoutGrid size={20} />
                          Back to Grid Layout
                        </button>
                     </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-24">
              {/* Featured Section */}
              {discoveryData?.featured?.length > 0 && (
                <div id="discovery-featured">
                  <div className="flex items-center justify-between mb-8">
                     <div>
                        <h2 className="text-2xl font-semibold text-gray-900 tracking-tighter flex items-center gap-3">
                          <Sparkles className="text-amber-400 fill-amber-400" size={24} />
                          Featured Experiences
                        </h2>
                        <p className="text-gray-400 font-semibold mt-1 uppercase tracking-widest text-[10px]">Curated events you cannot miss</p>
                     </div>
                     <Link href="/events?filter=featured" className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl text-sm font-semibold text-primary border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        View All
                        <ArrowRight size={14} />
                     </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {discoveryData.featured.slice(0, 3).map((event, idx) => renderEventCard(event, 'featured', 'featured-experiences', idx + 1))}
                  </div>
                </div>
              )}

              {/* Nearby Section */}
              {discoveryData?.nearby?.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                  <div className="flex items-center justify-between mb-8">
                     <div>
                        <h2 className="text-2xl font-semibold text-gray-900 tracking-tighter flex items-center gap-3">
                          <MapPinned className="text-primary" size={24} />
                          Happening Near You
                        </h2>
                        <p className="text-gray-400 font-semibold mt-1 uppercase tracking-widest text-[10px]">Based on your current location</p>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {discoveryData.nearby.slice(0, 6).map((event, idx) => renderEventCard(event, 'standard', 'happening-near-you', idx + 1))}
                  </div>
                </div>
              )}

              {/* Upcoming Section */}
              {discoveryData?.upcoming?.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-8">
                     <div>
                        <h2 className="text-2xl font-semibold text-gray-900 tracking-tighter flex items-center gap-3">
                          <Zap className="text-primary fill-primary" size={24} />
                          Upcoming Wonders
                        </h2>
                        <p className="text-gray-400 font-semibold mt-1 uppercase tracking-widest text-[10px]">Fresh experiences on the horizon</p>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {discoveryData.upcoming.map((event, idx) => renderEventCard(event, 'standard', 'upcoming-wonders', idx + 1))}
                  </div>
                </div>
              )}

              {/* Categorized Sections */}
              {Object.entries(discoveryData?.byCategory || {}).map(([category, events], idx) => (
                 <div key={category} className={`animate-in fade-in slide-in-from-bottom-8 duration-700`} style={{ animationDelay: `${(idx + 1) * 200}ms` }}>
                    <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-5">
                       <div>
                          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">{category}</h2>
                          <p className="text-gray-400 font-semibold mt-1 uppercase tracking-widest text-[10px]">Explore {events.length} more in this category</p>
                       </div>
                       <button onClick={() => setActiveCategory(category)} className="text-primary font-semibold text-[10px] uppercase tracking-widest hover:underline flex items-center gap-1.5">
                          View Category <ChevronRight size={12} />
                       </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                      {events && Array.isArray(events) && events.slice(0, 3).map((event, i) => renderEventCard(event, 'standard', `category-${category.toLowerCase().replace(/\s+/g, '-')}`, i + 1))}
                    </div>
                 </div>
              ))}

            </div>
          )}
        </main>
      </div>

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-[100] lg:hidden">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)}></div>
           <div className="absolute inset-y-0 right-0 w-[85%] bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
              <div className="p-6 border-b flex items-center justify-between">
                 <h3 className="text-lg font-semibold text-gray-900 tracking-tight uppercase tracking-widest">Filter Discovery</h3>
                 <button onClick={() => setShowMobileFilters(false)} className="p-2 bg-gray-100 rounded-full"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                 {/* Mobile Bookmarks Toggle */}
                 <div className="space-y-3">
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">My Account</label>
                    <button
                      onClick={() => {
                        setShowMobileFilters(false);
                        if (!user) setShowLoginModal(true);
                        else setShowBookmarksDrawer(true);
                      }}
                      className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-red-50 border border-red-100 text-red-600 active:bg-red-100 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                           <Heart size={16} className="fill-red-500 text-red-500" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-tight">My Bookmarks</span>
                      </div>
                      {discoveryData.bookmarks.length > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                          {discoveryData.bookmarks.length}
                        </span>
                      )}
                    </button>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Category</label>
                    <div className="grid grid-cols-1 gap-1.5">
                       {["All", ...categories].map(cat => {
                         const Icon = CATEGORY_ICONS[cat] || MoreHorizontal;
                         return (
                          <button
                            key={cat}
                            onClick={() => { setActiveCategory(cat); setShowMobileFilters(false); }}
                            className={`flex items-center gap-3 px-5 py-4 rounded-xl text-sm font-semibold text-left transition-all ${activeCategory === cat ? 'bg-primary text-white' : 'bg-gray-50 text-gray-600'}`}
                          >
                            <Icon size={18} className={activeCategory === cat ? 'text-white' : 'text-primary/60'} />
                            {cat}
                          </button>
                         );
                       })}
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">View Mode</label>
                    <div className="flex bg-gray-50 p-1 rounded-xl">
                       <button onClick={() => setViewMode('grid')} className={`flex-1 py-3 rounded-lg text-xs font-semibold ${viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}>Grid</button>
                       <button onClick={() => setViewMode('map')} className={`flex-1 py-3 rounded-lg text-xs font-semibold ${viewMode === 'map' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}>Map</button>
                    </div>
                 </div>
              </div>
              <div className="p-6 border-t">
                 <button onClick={() => setShowMobileFilters(false)} className="w-full py-4 bg-primary text-white font-semibold rounded-xl shadow-lg shadow-primary/10">Apply Filters</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const EventDiscovery = () => (
  <Suspense fallback={
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <CustomLoader size={64} />
    </div>
  }>
    <EventDiscoveryContent />
  </Suspense>
);

export default EventDiscovery;
