"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
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
  const { eventId } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/events/${eventId}`);
        setEvent(response.data.data);
        if (response.data.data.tickets && response.data.data.tickets.length > 0) {
          setSelectedTicket(response.data.data.tickets[0]);
        }
      } catch (error) {
        console.error("Failed to fetch event details:", error);
        Swal.fire("Error", translateError(error), "error");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

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

    router.push(`/events/${eventId}/register?ticketId=${selectedTicket.id}&qty=${quantity}`);
  };

  const handleDownloadICS = async () => {
    try {
      const response = await api.get(`/events/${eventId}/ics`, { responseType: 'blob' });
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
    try {
      const response = await api.get(`/events/${eventId}/calendar-links`);
      const links = response.data.data;
      if (links && links[type]) {
        window.open(links[type], '_blank');
      }
    } catch (error) {
      console.error("Failed to get calendar links:", error);
      Swal.fire("Error", "Could not open calendar.", "error");
    }
  };

  if (loading) return <div className="min-h-screen pt-32 flex items-center justify-center bg-gray-50"><CustomLoader /></div>;
  if (!event) return <div className="p-20 text-center bg-gray-50"><h3 className="text-xl font-bold">Event not found</h3></div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-24">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Breadcrumbs - Minimal Luma style */}
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-10 overflow-x-auto no-scrollbar whitespace-nowrap">
          <button onClick={() => router.push('/events')} className="hover:text-primary transition-colors flex items-center gap-1">
            Discovery
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-gray-300">{event.category}</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 truncate">{event.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-12">

            {/* High-Impact Hero Section */}
            <div className="space-y-8">
               <div className="relative aspect-video lg:aspect-[21/10] rounded-[3rem] overflow-hidden shadow-2xl shadow-blue-900/10 group">
                  {event.bannerUrl ? (
                    <Image src={event.bannerUrl} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-1000" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <Calendar size={120} className="text-primary/10" />
                    </div>
                  )}

                  {/* Floating Date Badge */}
                  <div className="absolute top-8 left-8">
                     <div className="bg-white/95 backdrop-blur-md px-6 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4">
                        <div className="flex flex-col items-center">
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">
                             {new Date(event.startDate).toLocaleDateString(undefined, { month: 'short' })}
                           </span>
                           <span className="text-3xl font-black text-gray-900 leading-none">
                             {new Date(event.startDate).toLocaleDateString(undefined, { day: 'numeric' })}
                           </span>
                        </div>
                        <div className="h-10 w-[1px] bg-gray-200"></div>
                        <div>
                           <p className="text-sm font-black text-gray-900 mb-0.5">
                             {new Date(event.startDate).toLocaleDateString(undefined, { weekday: 'long' })}
                           </p>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                             {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="space-y-6 px-2">
                  <div className="flex flex-wrap items-center gap-3">
                     <span className="px-5 py-2 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                       {event.category}
                     </span>
                     {event.type && (
                       <span className="px-5 py-2 rounded-2xl bg-white border border-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
                         <Globe size={12} className="text-primary" />
                         {event.type}
                       </span>
                     )}
                     {event.isFeatured && (
                       <span className="px-5 py-2 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
                         <Sparkles size={12} className="fill-amber-500" />
                         FEATURED
                       </span>
                     )}
                  </div>
                  <h1 className="text-4xl lg:text-6xl font-black text-gray-900 tracking-tighter leading-[1.1]">{event.title}</h1>
               </div>
            </div>

            {/* Content Tabs */}
            <div className="space-y-10">
               <div className="flex items-center gap-2 p-2 bg-white rounded-3xl border border-gray-100 shadow-sm w-fit">
                  {["overview", "schedule", "tickets"].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-10 py-4 rounded-[1.5rem] text-sm font-black uppercase tracking-widest transition-all duration-300 ${
                        activeTab === tab ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
               </div>

               <div className="bg-white p-8 lg:p-16 rounded-[3.5rem] border border-gray-100 shadow-sm min-h-[500px] relative overflow-hidden">
                  {/* Decorative element */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>

                  {activeTab === "overview" && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
                      <div className="space-y-6">
                        <h3 className="text-3xl font-black text-gray-900 tracking-tighter flex items-center gap-4">
                           <div className="w-2 h-10 bg-primary rounded-full"></div>
                           About this event
                        </h3>
                        <div className="text-gray-600 text-xl leading-relaxed whitespace-pre-wrap font-medium">
                          {event.description}
                        </div>
                      </div>

                      {/* Location Preview (Minimal) */}
                      <div className="pt-10 border-t border-gray-50 space-y-6">
                         <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            <MapPin size={24} className="text-primary" />
                            Where it&apos;s happening
                         </h3>
                         <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-1">
                               <p className="text-lg font-black text-gray-900">{event.location || "Virtual Experience"}</p>
                               <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Global Access Available</p>
                            </div>
                            <button className="px-8 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-black text-gray-900 hover:bg-gray-100 transition-all flex items-center gap-2">
                               Get Directions
                               <ArrowRight size={16} />
                            </button>
                         </div>
                      </div>

                      {event.tags && event.tags.length > 0 && (
                        <div className="pt-10 border-t border-gray-50 space-y-4">
                           <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Event Keywords</h4>
                           <div className="flex flex-wrap gap-2">
                              {event.tags.map(tag => (
                                <span key={tag} className="px-5 py-2.5 bg-gray-50 text-gray-600 text-xs font-bold rounded-2xl border border-gray-100 hover:bg-white hover:border-primary/20 hover:text-primary transition-all cursor-default">
                                  #{tag}
                                </span>
                              ))}
                           </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "schedule" && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
                      <h3 className="text-3xl font-black text-gray-900 tracking-tighter flex items-center gap-4">
                        <div className="w-2 h-10 bg-primary rounded-full"></div>
                        The Schedule
                      </h3>
                      {event.sessions && event.sessions.length > 0 ? (
                        <div className="space-y-6">
                          {event.sessions.map((session, i) => (
                            <div key={i} className="flex flex-col md:flex-row gap-6 md:items-center bg-gray-50 p-8 rounded-[2.5rem] border border-transparent hover:bg-white hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 group">
                              <div className="flex-shrink-0 w-32">
                                 <p className="text-sm font-black text-primary uppercase tracking-widest leading-none mb-1">
                                    {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </p>
                                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">START TIME</p>
                              </div>
                              <div className="flex-1">
                                 <h4 className="font-black text-gray-900 text-2xl tracking-tight mb-2 group-hover:text-primary transition-colors">{session.title}</h4>
                                 <p className="text-gray-500 font-medium line-clamp-2">{session.description}</p>
                              </div>
                              <div className="flex-shrink-0 flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm">
                                 <MapPin size={14} className="text-primary" />
                                 <span className="text-xs font-black text-gray-900 uppercase tracking-widest">{session.location || "Main Hall"}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-32 text-center">
                           <div className="w-24 h-24 bg-gray-50 rounded-[3rem] flex items-center justify-center mx-auto mb-6 text-gray-300">
                             <Clock size={48} />
                           </div>
                           <h4 className="text-xl font-black text-gray-900 mb-2">Timeline being finalized</h4>
                           <p className="text-gray-500 font-medium">The organizer is putting the final touches on the schedule.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "tickets" && (
                     <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
                        <h3 className="text-3xl font-black text-gray-900 tracking-tighter flex items-center gap-4">
                          <div className="w-2 h-10 bg-primary rounded-full"></div>
                          Choose your Experience
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           {event.tickets && event.tickets.map((ticket) => (
                             <button
                               key={ticket.id}
                               onClick={() => setSelectedTicket(ticket)}
                               className={`p-10 rounded-[3rem] text-left border-4 transition-all duration-500 relative overflow-hidden group ${
                                 selectedTicket?.id === ticket.id ? "border-primary bg-blue-50/30 shadow-2xl shadow-primary/10" : "border-gray-50 hover:border-gray-200 hover:bg-gray-50"
                               }`}
                             >
                                <div className="flex items-center justify-between mb-8">
                                   <div className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${ticket.type === 'FREE' ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-700'}`}>
                                      {ticket.type} PASS
                                   </div>
                                   {selectedTicket?.id === ticket.id && (
                                     <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center animate-in zoom-in duration-500 shadow-lg shadow-primary/40">
                                        <CheckCircle2 size={20} />
                                     </div>
                                   )}
                                </div>
                                <h4 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">{ticket.name}</h4>
                                <div className="flex items-baseline gap-2">
                                   <p className="text-4xl font-black text-gray-900">
                                      {ticket.price > 0 ? `₦${ticket.price.toLocaleString()}` : "FREE"}
                                   </p>
                                   {ticket.price > 0 && <span className="text-xs font-black text-gray-400 uppercase tracking-widest">/ seat</span>}
                                </div>

                                <div className="mt-10 pt-10 border-t border-gray-100 flex items-center justify-between">
                                   <div className="flex items-center gap-3 text-xs font-black text-gray-400 uppercase tracking-[0.1em]">
                                      <Users size={16} className="text-primary" />
                                      {ticket.availableQuantity} Slots Left
                                   </div>
                                   <p className="text-xs font-black text-primary group-hover:translate-x-2 transition-transform flex items-center gap-2">
                                      SELECT PASS <ChevronRight size={16} />
                                   </p>
                                </div>
                             </button>
                           ))}
                        </div>
                     </div>
                  )}
               </div>
            </div>
          </div>

          {/* Checkout Sidebar - Prominent & Sticky */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-8">

               {/* Primary CTA Box */}
               <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-2xl shadow-blue-900/10 p-10 lg:p-12 space-y-10 overflow-hidden relative">
                  {/* Decorative Luma circle */}
                  <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>

                  <div className="relative z-10">
                     <h3 className="text-3xl font-black text-gray-900 mb-2 tracking-tighter">Secure Spot</h3>
                     <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">Experience it live</p>
                  </div>

                  <div className="space-y-8 relative z-10">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Selection</label>
                        <div
                          className="bg-gray-50 rounded-[2rem] p-6 border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-all hover:border-primary/20 group shadow-sm"
                          onClick={() => setActiveTab("tickets")}
                        >
                           <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-gray-50 group-hover:scale-110 transition-transform">
                                 <Ticket size={24} />
                              </div>
                              <div className="text-left">
                                 <p className="text-lg font-black text-gray-900 leading-tight">{selectedTicket?.name || "Choose a ticket"}</p>
                                 <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">{selectedTicket?.type || "Pending Selection"}</p>
                              </div>
                           </div>
                           <ChevronRight size={20} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="flex items-center justify-between ml-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quantity</label>
                          {selectedTicket && selectedTicket.maxPerOrder > 0 && (
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Max {selectedTicket.maxPerOrder} per order</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 bg-gray-50 p-2.5 rounded-[2rem] border border-gray-100 shadow-sm">
                           <button
                             onClick={() => setQuantity(Math.max(1, quantity - 1))}
                             className="w-14 h-14 bg-white rounded-2xl text-2xl font-black text-gray-900 hover:text-primary shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center justify-center"
                           >-</button>
                           <div className="flex-1 text-center text-2xl font-black text-gray-900">{quantity}</div>
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
                             className="w-14 h-14 bg-white rounded-2xl text-2xl font-black text-gray-900 hover:text-primary shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                           >+</button>
                        </div>
                     </div>
                  </div>

                  <div className="bg-gray-50 rounded-[3rem] p-10 space-y-5 relative z-10 border border-gray-100/50">
                     <div className="flex items-center justify-between text-sm font-black text-gray-500 uppercase tracking-widest">
                        <span>{selectedTicket?.name || 'Selection'}</span>
                        <span className="text-gray-900">₦{((selectedTicket?.price || 0) * quantity).toLocaleString()}</span>
                     </div>
                     <div className="flex items-center justify-between text-sm font-black text-gray-500 uppercase tracking-widest">
                        <span>Transaction Fee</span>
                        <span className="text-emerald-600 font-black">COVERED</span>
                     </div>
                     <div className="pt-6 border-t border-gray-200 flex items-center justify-between">
                        <span className="text-xl font-black text-gray-900 tracking-tighter">TOTAL</span>
                        <span className="text-4xl font-black text-primary tracking-tighter">₦{((selectedTicket?.price || 0) * quantity).toLocaleString()}</span>
                     </div>
                  </div>

                  <div className="space-y-4 relative z-10">
                     <button
                        onClick={handleRegister}
                        disabled={!selectedTicket}
                        className="w-full bg-primary text-white font-black py-7 rounded-[2.5rem] hover:brightness-110 transition-all shadow-2xl shadow-primary/30 flex items-center justify-center gap-4 text-xl group disabled:opacity-50 disabled:grayscale"
                     >
                        Claim your Ticket
                        <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                     </button>

                     <div className="flex items-center gap-2 justify-center pt-2">
                        <button
                           onClick={() => handleAddToCalendar('google')}
                           className="flex-1 py-4 bg-white border-2 border-gray-100 rounded-2xl text-[10px] font-black text-gray-600 uppercase tracking-widest hover:border-primary/20 hover:text-primary transition-all flex items-center justify-center gap-2 group"
                        >
                           <CalendarPlus size={16} className="group-hover:scale-110 transition-transform" />
                           Save Date
                        </button>
                        <button className="p-4 bg-white border-2 border-gray-100 rounded-2xl text-gray-400 hover:text-red-500 hover:border-red-100 transition-all">
                           <Heart size={20} />
                        </button>
                        <button className="p-4 bg-white border-2 border-gray-100 rounded-2xl text-gray-400 hover:text-primary hover:border-blue-100 transition-all">
                           <Share2 size={20} />
                        </button>
                     </div>
                  </div>

                  <div className="flex items-center justify-center gap-8 pt-4 relative z-10">
                     <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        Verified
                     </div>
                     <div className="w-[1px] h-3 bg-gray-200"></div>
                     <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
                        <Tag size={14} className="text-primary" />
                        Official
                     </div>
                  </div>
               </div>

               {/* Secondary Save Date Options - Explicit Luma Style */}
               <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-sm space-y-8">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-primary/10 text-primary rounded-[1.25rem] flex items-center justify-center">
                        <BookmarkPlus size={24} />
                     </div>
                     <h4 className="font-black text-gray-900 tracking-tight">Calendar Sync</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                     <button
                       onClick={() => handleAddToCalendar('google')}
                       className="flex items-center justify-between p-5 rounded-[1.5rem] bg-gray-50 hover:bg-white hover:shadow-lg hover:shadow-primary/5 transition-all group border border-transparent hover:border-primary/10"
                     >
                        <span className="text-sm font-black text-gray-700 uppercase tracking-widest">Google Calendar</span>
                        <ChevronRight size={18} className="text-gray-300 group-hover:translate-x-1 transition-transform group-hover:text-primary" />
                     </button>
                     <button
                       onClick={() => handleDownloadICS()}
                       className="flex items-center justify-between p-5 rounded-[1.5rem] bg-gray-50 hover:bg-white hover:shadow-lg hover:shadow-primary/5 transition-all group border border-transparent hover:border-primary/10"
                     >
                        <div className="flex items-center gap-3">
                           <span className="text-sm font-black text-gray-700 uppercase tracking-widest">Apple / Outlook</span>
                           <Download size={16} className="text-gray-300 group-hover:text-primary" />
                        </div>
                        <ChevronRight size={18} className="text-gray-300 group-hover:translate-x-1 transition-transform group-hover:text-primary" />
                     </button>
                  </div>
               </div>

               {/* Minimalist Organizer Card */}
               <div className="bg-white rounded-[3rem] border border-gray-100 p-8 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 bg-primary/5 rounded-[1.5rem] flex items-center justify-center text-primary text-2xl font-black relative overflow-hidden">
                     {event.organizer?.userProfile?.fullName?.[0] || 'O'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Organized by</p>
                     <h4 className="font-black text-gray-900 tracking-tight truncate">{event.organizer?.userProfile?.fullName || "Verified Organizer"}</h4>
                     <button className="text-[10px] font-black text-primary uppercase tracking-[0.15em] mt-1 hover:underline">View Profile</button>
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
