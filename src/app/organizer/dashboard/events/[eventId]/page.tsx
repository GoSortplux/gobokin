"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  TrendingUp,
  Ticket,
  Settings,
  Share2,
  Broadcast,
  Eye,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Plus
} from "lucide-react";
import Image from "next/image";
import api from "@/services/api";
import { Event, Analytics } from "@/types";
import CustomLoader from "@/components/CustomLoader";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";

const EventDetails = () => {
  const { eventId } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        const [eventRes, analyticsRes] = await Promise.all([
          api.get(`/events/${eventId}`),
          api.get(`/events/${eventId}/analytics`)
        ]);
        setEvent(eventRes.data.data);
        setAnalytics(analyticsRes.data.data);
      } catch (error) {
        console.error("Failed to fetch event data:", error);
        Swal.fire("Error", translateError(error), "error");
      } finally {
        setLoading(false);
      }
    };
    fetchEventData();
  }, [eventId]);

  const handleBroadcast = async () => {
    const { value: message, isConfirmed } = await Swal.fire({
      title: 'Broadcast Message',
      text: 'Send a message to all registered attendees via email/app.',
      input: 'textarea',
      inputPlaceholder: 'Type your message here...',
      showCancelButton: true,
      confirmButtonText: 'Send Broadcast',
      confirmButtonColor: '#295FA7',
    });

    if (isConfirmed && message) {
      try {
        Swal.showLoading();
        await api.post(`/events/${eventId}/broadcast`, { message });
        Swal.fire('Sent!', 'Your message has been broadcast to all attendees.', 'success');
      } catch (error) {
        Swal.fire('Error', translateError(error), 'error');
      }
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><CustomLoader /></div>;
  if (!event) return <div className="p-20 text-center"><AlertCircle className="mx-auto mb-4 text-red-500" size={48} /><h3 className="text-xl font-bold">Event not found</h3></div>;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back to My Events
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => {}} className="p-2.5 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-xl transition-all">
            <Share2 size={20} />
          </button>
          <button onClick={handleBroadcast} className="flex items-center gap-2 bg-blue-50 text-primary font-bold px-5 py-2.5 rounded-xl hover:bg-blue-100 transition-all border border-blue-100">
            <Broadcast size={18} />
            Broadcast
          </button>
          <Link href={`/organizer/dashboard/events/${eventId}/edit`} className="flex items-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20">
            <Settings size={18} />
            Edit Event
          </Link>
        </div>
      </div>

      {/* Header Profile Section */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row items-center gap-8">
           <div className="w-full lg:w-48 h-48 rounded-3xl overflow-hidden relative shadow-lg">
             {event.bannerUrl ? (
               <Image src={event.bannerUrl} alt={event.title} fill className="object-cover" />
             ) : (
               <div className="w-full h-full bg-primary/10 text-primary flex items-center justify-center text-5xl font-black">
                 {event.title[0]}
               </div>
             )}
           </div>

           <div className="flex-1 text-center lg:text-left space-y-4">
             <div className="flex items-center justify-center lg:justify-start gap-2 text-xs font-black text-primary uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-xl w-fit">
               <CheckCircle2 size={14} />
               {event.status}
             </div>
             <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">{event.title}</h1>
             <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-gray-500 font-medium">
               <div className="flex items-center gap-2">
                 <Calendar className="text-primary" size={18} />
                 {new Date(event.startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
               </div>
               <div className="flex items-center gap-2">
                 <MapPin className="text-primary" size={18} />
                 {event.location || "Virtual Event"}
               </div>
               <div className="flex items-center gap-2">
                 <Users className="text-primary" size={18} />
                 {event.capacity} Capacity
               </div>
             </div>
           </div>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Ticket Sales", value: analytics?.orders || 0, icon: Ticket, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Revenue", value: `₦${analytics?.totalRevenue.toLocaleString() || 0}`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Registrations", value: analytics?.registrations || 0, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Page Views", value: analytics?.views || 0, icon: Eye, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
              <stat.icon size={24} />
            </div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black text-gray-900">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Tabs & Detailed Content */}
      <div className="space-y-6">
         <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 w-fit overflow-x-auto no-scrollbar">
            {["overview", "sessions", "tickets", "attendees"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all duration-300 ${
                  activeTab === tab ? "bg-primary text-white shadow-md shadow-primary/20" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab}
              </button>
            ))}
         </div>

         <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 min-h-[400px]">
            {activeTab === "overview" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                   <div className="space-y-4">
                      <h3 className="text-lg font-black text-gray-900 border-l-4 border-primary pl-4">About Event</h3>
                      <p className="text-gray-600 leading-relaxed">{event.description}</p>

                      <div className="grid grid-cols-2 gap-4 pt-4">
                         <div className="p-4 bg-gray-50 rounded-2xl">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Registration Mode</p>
                            <p className="text-sm font-bold text-gray-700">{event.registrationMode.replace('_', ' ')}</p>
                         </div>
                         <div className="p-4 bg-gray-50 rounded-2xl">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Grouping</p>
                            <p className="text-sm font-bold text-gray-700">{event.isGroupingEnabled ? "Enabled" : "Disabled"}</p>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h3 className="text-lg font-black text-gray-900 border-l-4 border-primary pl-4">Quick Stats</h3>
                      <div className="bg-gray-50 rounded-3xl p-6 space-y-6">
                         <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-500">Capacity Utilization</span>
                            <span className="text-sm font-black text-gray-900">{(analytics?.registrations || 0) / event.capacity * 100}%</span>
                         </div>
                         <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-1000"
                              style={{ width: `${Math.min(100, ((analytics?.registrations || 0) / event.capacity * 100))}%` }}
                            ></div>
                         </div>
                         <p className="text-xs text-gray-400 font-medium">Currently {analytics?.registrations || 0} registered out of {event.capacity} total slots.</p>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {activeTab === "sessions" && (
              <div className="space-y-6 animate-in fade-in duration-500">
                 <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-gray-900">Event Schedule</h3>
                    <button className="flex items-center gap-2 text-primary font-bold text-sm bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors">
                      <Plus size={16} />
                      Add Session
                    </button>
                 </div>

                 <div className="space-y-4">
                    {event.sessions && event.sessions.length > 0 ? (
                      event.sessions.map((session, i) => (
                        <div key={i} className="flex gap-6 group">
                           <div className="flex flex-col items-center">
                              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm z-10">
                                 {i + 1}
                              </div>
                              {i !== event.sessions.length - 1 && <div className="flex-1 w-[2px] bg-gray-100 my-1"></div>}
                           </div>
                           <div className="flex-1 pb-8">
                              <div className="bg-gray-50 p-6 rounded-3xl border border-transparent group-hover:border-primary/20 group-hover:bg-white group-hover:shadow-lg transition-all duration-300">
                                 <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-gray-900 text-lg">{session.title}</h4>
                                    <span className="text-xs font-bold text-primary bg-blue-100 px-3 py-1 rounded-lg">
                                      {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                 </div>
                                 <p className="text-gray-500 text-sm mb-4">{session.description}</p>
                                 {session.location && (
                                   <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-widest">
                                      <MapPin size={12} />
                                      {session.location}
                                   </div>
                                 )}
                              </div>
                           </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-20 text-gray-400 font-medium">No sessions scheduled for this event.</p>
                    )}
                 </div>
              </div>
            )}

            {activeTab === "tickets" && (
              <div className="space-y-6 animate-in fade-in duration-500">
                 <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-gray-900">Available Tickets</h3>
                    <button className="flex items-center gap-2 text-primary font-bold text-sm bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors">
                      <Plus size={16} />
                      Add Ticket Type
                    </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {event.tickets && event.tickets.length > 0 ? (
                      event.tickets.map((ticket, i) => (
                        <div key={i} className="p-6 rounded-3xl border-2 border-gray-50 hover:border-primary/20 transition-all group">
                           <div className="flex items-center justify-between mb-4">
                              <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${ticket.type === 'FREE' ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-700'}`}>
                                 {ticket.type}
                              </div>
                              <button className="text-gray-400 hover:text-primary">
                                 <MoreVertical size={18} />
                              </button>
                           </div>
                           <h4 className="font-bold text-gray-900 text-xl mb-1">{ticket.name}</h4>
                           <p className="text-3xl font-black text-gray-900 mb-6">
                             {ticket.price > 0 ? `₦${ticket.price.toLocaleString()}` : "Free"}
                           </p>

                           <div className="space-y-3 pt-6 border-t border-gray-50">
                              <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                                 <span>Sales Progress</span>
                                 <span>{ticket.totalQuantity - ticket.availableQuantity} / {ticket.totalQuantity}</span>
                              </div>
                              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                 <div
                                   className="h-full bg-emerald-500 rounded-full"
                                   style={{ width: `${((ticket.totalQuantity - ticket.availableQuantity) / ticket.totalQuantity) * 100}%` }}
                                 ></div>
                              </div>
                           </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-20 text-gray-400 font-medium md:col-span-2">No ticket types created yet.</p>
                    )}
                 </div>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default EventDetails;
