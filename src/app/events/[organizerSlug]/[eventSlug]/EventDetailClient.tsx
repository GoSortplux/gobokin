"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import LoginRequiredModal from "@/components/auth/LoginRequiredModal";
import {
  Calendar,
  MapPin,
  Ticket,
  Users,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Tag,
  Share2,
  Clock,
  ChevronRight,
  Download,
  CalendarPlus,
  Heart,
  Globe,
  Sparkles,
  BookmarkPlus
} from "lucide-react";
import api from "@/services/api";
import { Event, Ticket as TicketType } from "@/types";
import CustomLoader from "@/components/CustomLoader";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";

const EventDetailClient = () => {
  const { organizerSlug, eventSlug } = useParams();
  const router = useRouter();
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
  };

  useEffect(() => {
    const fetchWaitlistStatus = async (id: string) => {
      if (!user) return;
      try {
        const response = await api.get(`/events/${id}/waitlist/status`);
        setWaitlistStatus(response.data.data);
      } catch (error) {
        setWaitlistStatus(null);
      }
    };

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
      } catch (error) {
        console.error("Failed to fetch event details:", error);
        Swal.fire("Error", translateError(error), "error");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent().then((data) => {
      if (data?.id) {
        fetchWaitlistStatus(data.id);
      }
    });
  }, [organizerSlug, eventSlug, user]);

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
    } catch (error) {
      console.error("Failed to join waitlist:", error);
      Swal.fire("Error", translateError(error), "error");
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
    } catch (error) {
      console.error("Failed to download ICS:", error);
      Swal.fire("Error", "Could not download calendar file.", "error");
    }
  };

  const handleAddToCalendar = async (type: 'google' | 'outlook' | 'apple') => {
    if (!event) return;
    try {
      const response = await api.get(`/events/${event.id}/calendar-links`);
      const links = response.data.data;
      if (links && links[type]) {
        window.open(links[type], '_blank');
      }
    } catch (error) {
      console.error("Failed to get calendar links:", error);
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
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
      Swal.fire("Error", translateError(error), "error");
    } finally {
      setIsBookmarking(false);
    }
  };

  if (loading) return <div className="min-h-screen pt-32 flex items-center justify-center bg-gray-50"><CustomLoader /></div>;
  if (!event) return <div className="p-20 text-center bg-gray-50"><h3 className="text-xl font-semibold">Event not found</h3></div>;

  return (
    <div className="min-h-screen bg-white pt-24 pb-24">
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

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
               <div className="relative aspect-video lg:aspect-[21/10] rounded-2xl overflow-hidden shadow-sm group border border-gray-100">
                  {event.bannerUrl ? (
                    <Image src={event.bannerUrl} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-1000" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <Calendar size={80} className="text-primary/10" />
                    </div>
                  )}

                  {/* Floating Date Badge */}
                  <div className="absolute top-6 left-6">
                     <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-md flex items-center gap-3.5">
                        <div className="flex flex-col items-center">
                           <span className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-0.5">
                             {new Date(event.startDate).toLocaleDateString(undefined, { month: 'short' })}
                           </span>
                           <span className="text-2xl font-semibold text-gray-900 leading-none">
                             {new Date(event.startDate).toLocaleDateString(undefined, { day: 'numeric' })}
                           </span>
                        </div>
                        <div className="h-8 w-[1px] bg-gray-200"></div>
                        <div>
                           <p className="text-sm font-semibold text-gray-900 mb-0.5">
                             {new Date(event.startDate).toLocaleDateString(undefined, { weekday: 'long' })}
                           </p>
                           <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
                             {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </p>
                        </div>
                     </div>
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
               </div>
            </div>

            {/* Content Tabs */}
            <div className="space-y-8">
               <div className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-xl border border-gray-100 w-fit">
                  {["overview", "schedule", "tickets"].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-8 py-3 rounded-lg text-xs font-semibold uppercase tracking-widest transition-all duration-300 ${
                        activeTab === tab ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
               </div>

               <div className="bg-white p-8 lg:p-12 rounded-2xl border border-gray-100 shadow-sm min-h-[400px] relative overflow-hidden">
                  {/* Decorative element */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>

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
                               <p className="text-base font-semibold text-gray-900">{event.location || "Virtual Experience"}</p>
                               <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Global Access Available</p>
                            </div>
                            <button className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-all flex items-center gap-2">
                               Get Directions
                               <ArrowRight size={16} />
                            </button>
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
                      <h3 className="text-2xl font-semibold text-gray-900 tracking-tighter flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                        The Schedule
                      </h3>
                      {event.sessions && event.sessions.length > 0 ? (
                        <div className="space-y-4">
                          {event.sessions.map((session, i) => (
                            <div key={i} className="flex flex-col md:flex-row gap-5 md:items-center bg-gray-50 p-6 rounded-2xl border border-transparent hover:bg-white hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 group">
                              <div className="flex-shrink-0 w-28">
                                 <p className="text-sm font-semibold text-primary uppercase tracking-widest leading-none mb-1">
                                    {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </p>
                                 <p className="text-[9px] font-medium text-gray-400 uppercase tracking-widest">START TIME</p>
                              </div>
                              <div className="flex-1">
                                 <h4 className="font-semibold text-gray-900 text-xl tracking-tight mb-1 group-hover:text-primary transition-colors">{session.title}</h4>
                                 <p className="text-gray-500 text-sm font-medium line-clamp-2">{session.description}</p>
                              </div>
                              <div className="flex-shrink-0 flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                                 <MapPin size={12} className="text-primary" />
                                 <span className="text-[10px] font-semibold text-gray-900 uppercase tracking-widest">{session.location || "Main Hall"}</span>
                              </div>
                            </div>
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
                        <h3 className="text-2xl font-semibold text-gray-900 tracking-tighter flex items-center gap-3">
                          <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                          Choose your Experience
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {event.tickets && event.tickets.map((ticket) => {
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
                                  <div className="flex items-baseline gap-2">
                                     <p className={`text-3xl font-semibold ${isTicketSoldOut ? 'text-gray-400' : 'text-gray-900'}`}>
                                        {ticket.price > 0 ? `₦${ticket.price.toLocaleString()}` : "FREE"}
                                     </p>
                                     {ticket.price > 0 && <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">/ seat</span>}
                                  </div>

                                  <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-between">
                                     <div className="flex items-center gap-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-[0.1em]">
                                        <Users size={14} className={isTicketSoldOut ? 'text-gray-300' : 'text-primary'} />
                                        {isTicketSoldOut ? '0' : (ticket.remainingTickets ?? ticket.availableQuantity)} Slots Left
                                     </div>
                                     {!isTicketSoldOut ? (
                                       <p className="text-[10px] font-semibold text-primary group-hover:translate-x-2 transition-transform flex items-center gap-1.5">
                                          SELECT PASS <ChevronRight size={14} />
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
                  )}
               </div>
            </div>
          </div>

          {/* Checkout Sidebar - Prominent & Sticky */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-6">

               {/* Primary CTA Box */}
               <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8 lg:p-10 space-y-8 overflow-hidden relative">
                  {/* Decorative Luma circle */}
                  <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>

                  <div className="relative z-10">
                     <h3 className="text-2xl font-semibold text-gray-900 mb-1 tracking-tighter">Secure Spot</h3>
                     <p className="text-gray-400 font-semibold text-[10px] uppercase tracking-widest">Experience it live</p>
                  </div>

                  <div className="space-y-6 relative z-10">
                     <div className="space-y-3">
                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1">Current Selection</label>
                        <div
                          className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-all hover:border-primary/20 group shadow-sm"
                          onClick={() => setActiveTab("tickets")}
                        >
                           <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm border border-gray-50 group-hover:scale-110 transition-transform">
                                 <Ticket size={20} />
                              </div>
                              <div className="text-left">
                                 <p className="text-base font-semibold text-gray-900 leading-tight">{selectedTicket?.name || "Choose a ticket"}</p>
                                 <p className="text-[9px] font-semibold text-primary uppercase tracking-widest mt-1">{selectedTicket?.type || "Pending Selection"}</p>
                              </div>
                           </div>
                           <div
                              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm transition-all group/btn"
                              onClick={(e) => {
                                 e.stopPropagation();
                                 handleNextTicket();
                              }}
                           >
                              <ChevronRight size={18} className="text-gray-400 group-hover/btn:translate-x-0.5 group-hover/btn:text-primary transition-all" />
                           </div>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <div className="flex items-center justify-between ml-1">
                          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Quantity</label>
                          {selectedTicket && selectedTicket.maxPerOrder > 0 && (
                            <span className="text-[10px] font-semibold text-primary uppercase tracking-widest">Max {selectedTicket.maxPerOrder}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100 shadow-sm">
                           <button
                             onClick={() => setQuantity(Math.max(1, quantity - 1))}
                             className="w-12 h-12 bg-white rounded-xl text-xl font-semibold text-gray-900 hover:text-primary shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center justify-center"
                           >-</button>
                           <div className="flex-1 text-center text-xl font-semibold text-gray-900">{quantity}</div>
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
                             className="w-12 h-12 bg-white rounded-xl text-xl font-semibold text-gray-900 hover:text-primary shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                           >+</button>
                        </div>
                     </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6 space-y-4 relative z-10 border border-gray-100/50">
                     <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-widest">
                        <span>{selectedTicket?.name || 'Selection'}</span>
                        <span className="text-gray-900">₦{((selectedTicket?.price || 0) * quantity).toLocaleString()}</span>
                     </div>
                     <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-widest">
                        <span>Fee</span>
                        <span className="text-emerald-600 font-semibold uppercase">Free</span>
                     </div>
                     <div className="pt-5 border-t border-gray-200 flex items-center justify-between">
                        <span className="text-lg font-semibold text-gray-900 tracking-tighter">TOTAL</span>
                        <span className="text-3xl font-semibold text-primary tracking-tighter">₦{((selectedTicket?.price || 0) * quantity).toLocaleString()}</span>
                     </div>
                  </div>

                  <div className="space-y-3 relative z-10">
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
                              className="w-full font-semibold py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-lg group bg-rose-600 text-white shadow-xl shadow-rose-600/20 hover:brightness-110"
                            >
                              {isJoiningWaitlist ? 'Joining...' : waitlistStatus ? `Waitlisted (Pos: #${waitlistStatus.position})` : 'Join Waitlist'}
                              <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                            </button>
                          );
                        }

                        return (
                          <button
                             onClick={handleRegister}
                             disabled={!selectedTicket || isTicketSoldOut || isNotOnSale}
                             className={`w-full font-semibold py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-lg group ${
                                (isTicketSoldOut || isNotOnSale)
                                ? 'bg-rose-600 text-white shadow-xl shadow-rose-600/20'
                                : 'bg-primary text-white hover:brightness-110 shadow-xl shadow-primary/20 disabled:opacity-50 disabled:grayscale'
                             }`}
                          >
                             {isTicketSoldOut
                                ? 'SOLD OUT'
                                : ticketStatus === 'UPCOMING'
                                  ? 'Ticket sale has not started'
                                  : ticketStatus === 'ENDED'
                                    ? 'Sales Ended'
                                    : 'Claim your Ticket'}
                             {!isTicketSoldOut && ticketStatus === 'ACTIVE' && <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />}
                          </button>
                        );
                     })()}

                     <div className="flex items-center gap-2 justify-center pt-2">
                        <button
                           onClick={() => handleAddToCalendar('google')}
                           className="flex-1 py-3 bg-white border-2 border-gray-100 rounded-xl text-[10px] font-semibold text-gray-600 uppercase tracking-widest hover:border-primary/20 hover:text-primary transition-all flex items-center justify-center gap-2 group"
                        >
                           <CalendarPlus size={14} className="group-hover:scale-110 transition-transform" />
                           Save Date
                        </button>
                        <button
                          onClick={handleToggleBookmark}
                          disabled={isBookmarking}
                          className={`p-3 bg-white border-2 rounded-xl transition-all ${
                            event.isBookmarked
                              ? 'text-red-500 border-red-100 bg-red-50'
                              : 'text-gray-400 border-gray-100 hover:text-red-500 hover:border-red-100'
                          } disabled:opacity-50`}
                          title={event.isBookmarked ? "Remove Bookmark" : "Bookmark Event"}
                        >
                           <Heart size={18} className={event.isBookmarked ? "fill-current" : ""} />
                        </button>
                        <button className="p-3 bg-white border-2 border-gray-100 rounded-xl text-gray-400 hover:text-primary hover:border-blue-100 transition-all">
                           <Share2 size={18} />
                        </button>
                     </div>
                  </div>

                  <div className="flex items-center justify-center gap-6 pt-2 relative z-10">
                     <div className="flex items-center gap-2 text-[8px] font-semibold text-gray-400 uppercase tracking-[0.2em]">
                        <ShieldCheck size={12} className="text-emerald-500" />
                        Verified
                     </div>
                     <div className="w-[1px] h-2 bg-gray-200"></div>
                     <div className="flex items-center gap-2 text-[8px] font-semibold text-gray-400 uppercase tracking-[0.2em]">
                        <Tag size={12} className="text-primary" />
                        Official
                     </div>
                  </div>
               </div>

               {/* Secondary Save Date Options - Explicit Luma Style */}
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

               {/* Minimalist Organizer Card */}
               <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 bg-primary/5 rounded-xl flex items-center justify-center text-primary text-xl font-semibold relative overflow-hidden">
                     {event.organizer?.userProfile?.fullName?.[0] || 'O'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                     <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Organized by</p>
                     <h4 className="font-semibold text-gray-900 tracking-tight truncate">{event.organizer?.userProfile?.fullName || "Verified Organizer"}</h4>
                     <button className="text-[10px] font-semibold text-primary uppercase tracking-[0.15em] mt-1 hover:underline">View Profile</button>
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
