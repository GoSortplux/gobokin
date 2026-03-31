"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Ticket,
  Users,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Tag,
  Share2,
  Clock,
  Layers,
  ChevronRight,
  Info
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

    // Redirect to checkout/registration page with event and ticket details
    router.push(`/events/${eventId}/register?ticketId=${selectedTicket.id}&qty=${quantity}`);
  };

  if (loading) return <div className="min-h-screen pt-32 flex items-center justify-center bg-gray-50"><CustomLoader /></div>;
  if (!event) return <div className="p-20 text-center bg-gray-50"><h3 className="text-xl font-bold">Event not found</h3></div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-24">
      <div className="container mx-auto px-4">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-8 overflow-x-auto no-scrollbar whitespace-nowrap">
          <button onClick={() => router.push('/events')} className="hover:text-primary transition-colors flex items-center gap-1">
            Discover
            <ChevronRight size={14} />
          </button>
          <span className="text-gray-400 font-medium">{event.category}</span>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="text-gray-900 truncate">{event.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-12">
            {/* Banner Section */}
            <div className="relative aspect-video lg:aspect-[21/9] rounded-[3rem] overflow-hidden shadow-2xl shadow-blue-900/10">
              {event.bannerUrl ? (
                <Image src={event.bannerUrl} alt={event.title} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/10 text-primary flex items-center justify-center">
                  <Calendar size={120} className="text-primary/10" />
                </div>
              )}
              <div className="absolute top-8 left-8">
                 <div className="bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-sm flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex flex-col items-center justify-center leading-tight">
                       <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                         {new Date(event.startDate).toLocaleDateString(undefined, { month: 'short' })}
                       </span>
                       <span className="text-lg font-black leading-none">
                         {new Date(event.startDate).toLocaleDateString(undefined, { day: 'numeric' })}
                       </span>
                    </div>
                    <div className="h-8 w-[1px] bg-gray-200 mx-1"></div>
                    <div>
                       <p className="text-xs font-black text-gray-900 leading-tight">
                         {new Date(event.startDate).toLocaleDateString(undefined, { weekday: 'long' })}
                       </p>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                         {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </p>
                    </div>
                 </div>
              </div>
            </div>

            {/* Title & Info */}
            <div className="space-y-6">
               <div className="flex flex-wrap items-center gap-3">
                  <span className="px-4 py-1.5 rounded-2xl bg-blue-50 text-primary text-[10px] font-black uppercase tracking-widest">
                    {event.category}
                  </span>
                  {event.type && (
                    <span className="px-4 py-1.5 rounded-2xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                      <Zap size={12} />
                      {event.type} EVENT
                    </span>
                  )}
               </div>
               <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">{event.title}</h1>
               <div className="flex flex-col md:flex-row md:items-center gap-8 text-gray-500 font-medium bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center flex-shrink-0">
                       <Calendar size={20} />
                    </div>
                    <div>
                       <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5">Date & Time</p>
                       <p className="text-sm font-bold text-gray-900">{new Date(event.startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center flex-shrink-0">
                       <MapPin size={20} />
                    </div>
                    <div>
                       <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5">Location</p>
                       <p className="text-sm font-bold text-gray-900">{event.location || "Virtual Event"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center flex-shrink-0">
                       <Users size={20} />
                    </div>
                    <div>
                       <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5">Capacity</p>
                       <p className="text-sm font-bold text-gray-900">{event.capacity} Slots</p>
                    </div>
                  </div>
               </div>
            </div>

            {/* Tabs & Content */}
            <div className="space-y-8">
               <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-gray-100 shadow-sm w-fit overflow-x-auto no-scrollbar">
                  {["overview", "schedule", "tickets"].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-8 py-3 rounded-xl text-sm font-bold capitalize transition-all duration-300 ${
                        activeTab === tab ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
               </div>

               <div className="bg-white p-8 lg:p-12 rounded-[3rem] border border-gray-100 shadow-sm min-h-[400px]">
                  {activeTab === "overview" && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                      <div className="space-y-4">
                        <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                           <div className="w-2 h-8 bg-primary rounded-full"></div>
                           Event Description
                        </h3>
                        <div className="text-gray-600 text-lg leading-relaxed whitespace-pre-wrap">
                          {event.description}
                        </div>
                      </div>

                      {event.tags && event.tags.length > 0 && (
                        <div className="pt-8 border-t border-gray-100 space-y-4">
                           <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Event Tags</h4>
                           <div className="flex flex-wrap gap-2">
                              {event.tags.map(tag => (
                                <span key={tag} className="px-4 py-2 bg-gray-50 text-gray-600 text-sm font-bold rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                                  #{tag}
                                </span>
                              ))}
                           </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "schedule" && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                      <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3 mb-8">
                        <div className="w-2 h-8 bg-primary rounded-full"></div>
                        Event Schedule
                      </h3>
                      {event.sessions && event.sessions.length > 0 ? (
                        <div className="space-y-4">
                          {event.sessions.map((session, i) => (
                            <div key={i} className="flex gap-6 group">
                              <div className="flex flex-col items-center">
                                 <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-lg z-10 shadow-lg shadow-primary/20">
                                    {i + 1}
                                 </div>
                                 {i !== event.sessions.length - 1 && <div className="flex-1 w-[2px] bg-gray-100 my-2"></div>}
                              </div>
                              <div className="flex-1 pb-10">
                                 <div className="bg-gray-50 p-6 lg:p-8 rounded-[2.5rem] group-hover:bg-white group-hover:shadow-xl group-hover:shadow-blue-900/5 group-hover:border group-hover:border-primary/20 transition-all duration-500 relative">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                       <h4 className="font-black text-gray-900 text-xl">{session.title}</h4>
                                       <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                                          <Clock size={14} />
                                          {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          <span>-</span>
                                          {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                       </div>
                                    </div>
                                    <p className="text-gray-500 font-medium text-lg leading-relaxed mb-6">{session.description}</p>
                                    {session.location && (
                                      <div className="flex items-center gap-2 text-xs text-gray-400 font-black uppercase tracking-widest">
                                         <MapPin size={14} className="text-primary" />
                                         {session.location}
                                      </div>
                                    )}
                                 </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-20 text-center">
                           <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                           <p className="text-gray-500 font-medium">Full schedule details for this event are coming soon.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "tickets" && (
                     <div className="space-y-8 animate-in fade-in duration-500">
                        <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                          <div className="w-2 h-8 bg-primary rounded-full"></div>
                          Select your Ticket
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {event.tickets && event.tickets.map((ticket) => (
                             <button
                               key={ticket.id}
                               onClick={() => setSelectedTicket(ticket)}
                               className={`p-8 rounded-[2.5rem] text-left border-2 transition-all duration-300 relative overflow-hidden group ${
                                 selectedTicket?.id === ticket.id ? "border-primary bg-blue-50/50 ring-4 ring-primary/5 shadow-xl shadow-blue-900/5" : "border-gray-50 hover:border-gray-200 hover:bg-gray-50"
                               }`}
                             >
                                <div className="flex items-center justify-between mb-6">
                                   <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${ticket.type === 'FREE' ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-700'}`}>
                                      {ticket.type}
                                   </div>
                                   {selectedTicket?.id === ticket.id && (
                                     <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                                        <CheckCircle2 size={16} />
                                     </div>
                                   )}
                                </div>
                                <h4 className="text-2xl font-black text-gray-900 mb-2">{ticket.name}</h4>
                                <div className="flex items-baseline gap-1">
                                   <p className="text-3xl font-black text-gray-900">
                                      {ticket.price > 0 ? `₦${ticket.price.toLocaleString()}` : "Free"}
                                   </p>
                                   {ticket.price > 0 && <span className="text-xs font-bold text-gray-400">/ attendee</span>}
                                </div>

                                <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-between">
                                   <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                                      <Users size={14} />
                                      {ticket.availableQuantity} available
                                   </div>
                                   <p className="text-xs font-black text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                      SELECT <ChevronRight size={14} />
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

          {/* Sidebar / Registration Form */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-8">
               <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl shadow-blue-900/10 p-8 lg:p-10 space-y-8 overflow-hidden relative">
                  {/* Accent decorative circle */}
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>

                  <div>
                     <h3 className="text-2xl font-black text-gray-900 mb-2">Book Your Spot</h3>
                     <p className="text-gray-500 font-medium text-sm">Experience {event.title} live!</p>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Ticket Type</label>
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setActiveTab("tickets")}>
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                                 <Ticket size={18} />
                              </div>
                              <div className="text-left">
                                 <p className="text-sm font-black text-gray-900">{selectedTicket?.name || "No ticket selected"}</p>
                                 <p className="text-[10px] font-bold text-gray-500 uppercase">{selectedTicket?.type}</p>
                              </div>
                           </div>
                           <ChevronRight size={18} className="text-gray-400" />
                        </div>
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Quantity</label>
                        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                           <button
                             onClick={() => setQuantity(Math.max(1, quantity - 1))}
                             className="w-12 h-12 bg-white rounded-xl text-xl font-black text-gray-900 hover:text-primary shadow-sm hover:shadow-md transition-all active:scale-95"
                           >-</button>
                           <div className="flex-1 text-center text-xl font-black text-gray-900">{quantity}</div>
                           <button
                             onClick={() => setQuantity(Math.min(selectedTicket?.availableQuantity || 1, quantity + 1))}
                             className="w-12 h-12 bg-white rounded-xl text-xl font-black text-gray-900 hover:text-primary shadow-sm hover:shadow-md transition-all active:scale-95"
                           >+</button>
                        </div>
                     </div>
                  </div>

                  <div className="bg-gray-50 rounded-[2.5rem] p-8 space-y-4">
                     <div className="flex items-center justify-between text-sm font-bold text-gray-500">
                        <span>{selectedTicket?.name} (x{quantity})</span>
                        <span>₦{((selectedTicket?.price || 0) * quantity).toLocaleString()}</span>
                     </div>
                     <div className="flex items-center justify-between text-sm font-bold text-gray-500">
                        <span>Platform Fee</span>
                        <span className="text-emerald-600">Free</span>
                     </div>
                     <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                        <span className="text-lg font-black text-gray-900 uppercase tracking-tight">Total</span>
                        <span className="text-2xl font-black text-primary">₦{((selectedTicket?.price || 0) * quantity).toLocaleString()}</span>
                     </div>
                  </div>

                  <button
                    onClick={handleRegister}
                    disabled={!selectedTicket}
                    className="w-full bg-primary text-white font-black py-6 rounded-[2.5rem] hover:bg-opacity-90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 text-lg group disabled:opacity-50"
                  >
                    Proceed to Register
                    <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                  </button>

                  <div className="flex items-center justify-center gap-6 pt-4">
                     <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        Secure Payment
                     </div>
                     <div className="w-[1px] h-3 bg-gray-200"></div>
                     <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <Tag size={14} className="text-primary" />
                        Instant Ticket
                     </div>
                  </div>
               </div>

               {/* Organizer Info */}
               <div className="bg-white rounded-[2.5rem] border border-gray-100 p-6 shadow-sm flex items-center gap-4">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-primary text-xl font-black overflow-hidden relative">
                     {event.organizer?.bio ? (
                       <div className="text-2xl">O</div>
                     ) : (
                       <Image src="/logo-icon.png" alt="Gobokin" fill className="p-2 opacity-30 grayscale" />
                     )}
                  </div>
                  <div className="flex-1">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Organized by</p>
                     <h4 className="font-bold text-gray-900 line-clamp-1">{event.organizer?.bio || "Verified Organizer"}</h4>
                     {event.organizer?.website && (
                       <a href={event.organizer.website} target="_blank" className="text-xs text-primary font-bold hover:underline">Visit Website</a>
                     )}
                  </div>
                  <button className="p-2.5 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-xl transition-all">
                    <Share2 size={18} />
                  </button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailClient;
