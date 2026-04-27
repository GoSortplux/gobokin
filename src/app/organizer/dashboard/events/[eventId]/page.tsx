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
  Radio,
  Eye,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Plus,
  Tag,
  Shield,
  ExternalLink,
  Image as ImageIcon,
  Video,
  User,
  Clock,
  Globe,
  Download
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
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
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

  useEffect(() => {
    if (activeTab === "attendees" && eventId) {
      const fetchAttendees = async () => {
        try {
          setAttendeesLoading(true);
          const response = await api.get(`/events/${eventId}/registrations`);
          setAttendees(response.data.data || []);
        } catch (error) {
          console.error("Failed to fetch attendees:", error);
          try {
             const response = await api.get(`/events/orders/all?eventId=${eventId}`);
             setAttendees(response.data.data || []);
          } catch (e) {
             setAttendees([]);
          }
        } finally {
          setAttendeesLoading(false);
        }
      };
      fetchAttendees();
    }
  }, [activeTab, eventId]);

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
      <div className="flex items-center justify-between px-2">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back to My Events
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => {}} className="p-2.5 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-xl transition-all">
            <Share2 size={20} />
          </button>
          <button onClick={handleBroadcast} className="flex items-center gap-2 bg-blue-50 text-primary font-bold px-5 py-2.5 rounded-xl hover:bg-blue-100 transition-all border border-blue-100">
            <Radio size={18} />
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
             {event.bannerUrl || (event as { image?: string }).image ? (
               <Image src={event.bannerUrl || (event as { image?: string }).image!} alt={event.title} fill className="object-cover" />
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
             <h1 className="text-3xl lg:text-4xl font-black text-primary tracking-tight">{event.title}</h1>
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
          { label: "Revenue", value: `₦${analytics?.totalRevenue?.toLocaleString() || 0}`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Registrations", value: analytics?.registrations || 0, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Page Views", value: analytics?.views || 0, icon: Eye, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 group">
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
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
            {["overview", "schedule", "tickets", "attendees"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab ? "bg-primary text-white shadow-md shadow-primary/20" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab}
              </button>
            ))}
         </div>

         <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 min-h-[400px]">
            {activeTab === "overview" && (
              <div className="space-y-16 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                   <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-black text-gray-900 border-l-4 border-primary pl-4">About Event</h3>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{event.description}</p>
                      </div>

                      {event.tags && event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                           {event.tags.map((tag, i) => (
                             <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full border border-gray-200">
                               <Tag size={12} />
                               {tag}
                             </span>
                           ))}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 pt-4">
                         <div className="p-4 bg-gray-50 rounded-2xl">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Category</p>
                            <p className="text-sm font-bold text-gray-700">{event.category}</p>
                         </div>
                         <div className="p-4 bg-gray-50 rounded-2xl">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Registration Mode</p>
                            <p className="text-sm font-bold text-gray-700">{event.registrationMode?.replace('_', ' ') || 'FULL DETAILS'}</p>
                         </div>
                         <div className="p-4 bg-gray-50 rounded-2xl">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Grouping</p>
                            <p className="text-sm font-bold text-gray-700">{event.isGroupingEnabled ? "Enabled" : "Disabled"}</p>
                         </div>
                         <div className="p-4 bg-gray-50 rounded-2xl">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Visibility</p>
                            <p className="text-sm font-bold text-gray-700">{event.isPublic ? "Public" : "Private"}</p>
                         </div>
                      </div>

                      {event.registrationFields && event.registrationFields.length > 0 && (
                        <div className="space-y-4 pt-4">
                           <h3 className="text-lg font-black text-gray-900 border-l-4 border-primary pl-4">Registration Fields</h3>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {event.registrationFields.map((field, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                   <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary shadow-sm">
                                      <CheckCircle2 size={16} />
                                   </div>
                                   <div>
                                      <p className="text-xs font-bold text-gray-700">{field.label}</p>
                                      <p className="text-[10px] text-gray-400 font-medium">{field.type} • {field.required ? 'Required' : 'Optional'}</p>
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                      )}
                   </div>

                   <div className="space-y-8">
                      <div className="space-y-4">
                        <h3 className="text-lg font-black text-gray-900 border-l-4 border-primary pl-4">Quick Stats</h3>
                        <div className="bg-gray-50 rounded-3xl p-6 space-y-6 border border-gray-100">
                           <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-gray-500">Capacity Utilization</span>
                              <span className="text-sm font-black text-gray-900">{Math.round((analytics?.registrations || 0) / (event.capacity || 1) * 100)}%</span>
                           </div>
                           <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(100, ((analytics?.registrations || 0) / (event.capacity || 1) * 100))}%` }}
                              ></div>
                           </div>
                           <p className="text-xs text-gray-400 font-medium">Currently {analytics?.registrations || 0} registered out of {event.capacity} total slots.</p>
                        </div>
                      </div>

                      {(event.location || event.virtualLink) && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-black text-gray-900 border-l-4 border-primary pl-4">Access Details</h3>
                          <div className="bg-gray-50 rounded-3xl p-6 space-y-4 border border-gray-100">
                             {event.location && (
                               <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary shadow-sm">
                                    <MapPin size={16} />
                                  </div>
                                  <div className="flex-1">
                                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Physical Location</p>
                                     <p className="text-sm font-bold text-gray-700">{event.location}</p>
                                     {event.mapLink && (
                                       <a href={event.mapLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-primary hover:underline">
                                         <ExternalLink size={12} />
                                         View on Google Maps
                                       </a>
                                     )}
                                  </div>
                               </div>
                             )}
                             {event.virtualLink && (
                               <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary shadow-sm">
                                    <Globe size={16} />
                                  </div>
                                  <div className="flex-1">
                                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Virtual Link</p>
                                     <p className="text-sm font-bold text-primary truncate max-w-xs">{event.virtualLink}</p>
                                     <a href={event.virtualLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-primary hover:underline">
                                       <ExternalLink size={12} />
                                       Join Event
                                     </a>
                                  </div>
                               </div>
                             )}
                          </div>
                        </div>
                      )}
                   </div>
                </div>

                {/* Media Gallery */}
                {event.mediaUrls && event.mediaUrls.length > 0 && (
                   <div className="space-y-4">
                      <h3 className="text-lg font-black text-gray-900 border-l-4 border-primary pl-4">Media Gallery</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                         {event.mediaUrls.map((url, i) => (
                           <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 group">
                              {url && typeof url === 'string' && url.match(/\.(mp4|webm|ogg)$/) ? (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                   <Video size={40} />
                                </div>
                              ) : (
                                <Image src={url} alt={`Gallery ${i}`} fill className="object-cover transition-transform group-hover:scale-110" />
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                 <button className="p-2 bg-white rounded-full text-primary shadow-lg">
                                    {url && typeof url === 'string' && url.match(/\.(mp4|webm|ogg)$/) ? <Video size={20} /> : <ImageIcon size={20} />}
                                 </button>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                )}

                {/* Organizer Section */}
                {event.organizer && (
                   <div className="space-y-4">
                      <h3 className="text-lg font-black text-gray-900 border-l-4 border-primary pl-4">Organizer Profile</h3>
                      <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 flex items-center gap-6">
                         <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-2xl">
                            {event.organizer.userProfile?.fullName?.[0] || 'O'}
                         </div>
                         <div>
                            <h4 className="font-bold text-gray-900">{event.organizer.userProfile?.fullName}</h4>
                            <p className="text-sm text-gray-500">{event.organizer.userProfile?.email}</p>
                            <div className="flex gap-4 mt-2">
                               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Commission: {event.organizer.commissionRate}%</span>
                               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payout: {event.organizer.payoutPolicy?.replace('_', ' ')}</span>
                            </div>
                         </div>
                      </div>
                   </div>
                )}

                {/* Speakers Section */}
                <div className="space-y-8">
                   <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-gray-900 border-l-4 border-primary pl-4">Featured Speakers</h3>
                      <button className="flex items-center gap-2 text-primary font-bold text-sm bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors">
                        <Plus size={16} />
                        Add Speaker
                      </button>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {event.speakers && event.speakers.length > 0 ? (
                        event.speakers.map((speaker, i) => (
                          <div key={i} className="bg-gray-50 p-6 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-xl transition-all duration-300 group">
                             <div className="flex items-center gap-4 mb-6">
                                <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-md">
                                   {speaker.imageUrl ? (
                                     <Image src={speaker.imageUrl} alt={speaker.name} fill className="object-cover" />
                                   ) : (
                                     <div className="w-full h-full bg-primary/10 text-primary flex items-center justify-center">
                                        <User size={32} />
                                     </div>
                                   )}
                                </div>
                                <div>
                                   <h4 className="font-bold text-gray-900 text-lg leading-tight">{speaker.name}</h4>
                                   <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">{speaker.title}</p>
                                </div>
                             </div>
                             <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                                {speaker.bio}
                             </p>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                           <User className="mx-auto mb-4 text-gray-300" size={32} />
                           <p className="text-gray-400 font-medium text-sm">No speakers listed for this event.</p>
                        </div>
                      )}
                   </div>
                </div>

                {/* Agenda Section */}
                <div className="space-y-8">
                   <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-gray-900 border-l-4 border-primary pl-4">Event Agenda</h3>
                      <button className="flex items-center gap-2 text-primary font-bold text-sm bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors">
                        <Plus size={16} />
                        Add Agenda Item
                      </button>
                   </div>

                   <div className="space-y-6">
                      {event.agenda && event.agenda.length > 0 ? (
                        event.agenda.map((item, i) => (
                          <div key={i} className="flex gap-6 group">
                             <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-xl bg-secondary text-white flex items-center justify-center font-bold text-sm z-10 shadow-lg shadow-secondary/20">
                                   {i + 1}
                                </div>
                                {i !== event.agenda!.length - 1 && <div className="flex-1 w-[2px] bg-gray-100 my-1"></div>}
                             </div>
                             <div className="flex-1 pb-8">
                                <div className="bg-gray-50 p-6 rounded-3xl border border-transparent group-hover:border-secondary/20 group-hover:bg-white group-hover:shadow-lg transition-all duration-300">
                                   <div className="flex items-center justify-between mb-4">
                                      <h4 className="font-bold text-gray-900 text-lg">{item.title}</h4>
                                      <div className="flex items-center gap-3">
                                         <span className="flex items-center gap-1 text-xs font-bold text-secondary bg-orange-50 px-3 py-1 rounded-lg">
                                            <Clock size={14} />
                                            {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(item.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                         </span>
                                      </div>
                                   </div>
                                   <p className="text-gray-500 text-sm mb-4 leading-relaxed">{item.description}</p>
                                   {item.speakerName && (
                                     <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-widest">
                                        <User size={12} className="text-secondary" />
                                        Speaker: {item.speakerName}
                                     </div>
                                   )}
                                </div>
                             </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                           <Calendar className="mx-auto mb-4 text-gray-300" size={32} />
                           <p className="text-gray-400 font-medium text-sm">No agenda items added to this event.</p>
                        </div>
                      )}
                   </div>
                </div>

                {/* Refund Policy */}
                <div className="space-y-4">
                   <h3 className="text-lg font-black text-gray-900 border-l-4 border-primary pl-4">Refund Policy</h3>
                   <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
                      <div className="flex items-center gap-4 mb-6">
                         <div className="w-12 h-12 rounded-2xl bg-white text-secondary flex items-center justify-center shadow-sm border border-gray-100">
                            <Shield size={24} />
                         </div>
                         <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Policy Type</p>
                            <h4 className="text-xl font-black text-gray-900">{event.refundType || 'NONE'}</h4>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Refund Percentage</p>
                            <p className="text-lg font-black text-primary">{event.refundPercentage || 0}%</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cutoff Days</p>
                            <p className="text-lg font-black text-primary">{event.refundCutoffDays || 0} Days before event</p>
                         </div>
                         <div className="md:col-span-3 space-y-2 mt-4 pt-4 border-t border-gray-200">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Detailed Terms</p>
                            <p className="text-sm text-gray-600 leading-relaxed italic">
                               {event.refundPolicy || "No custom refund policy specified for this event."}
                            </p>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            )}


            {activeTab === "schedule" && (
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
                              {i !== event.sessions!.length - 1 && <div className="flex-1 w-[2px] bg-gray-100 my-1"></div>}
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
              <div className="space-y-8 animate-in fade-in duration-500">
                 <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-gray-900">Available Tickets</h3>
                    <button className="flex items-center gap-2 text-primary font-bold text-sm bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors">
                      <Plus size={16} />
                      Add Ticket Type
                    </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {event.tickets && event.tickets.length > 0 ? (
                      event.tickets.map((ticket, i) => (
                        <div key={i} className="p-8 rounded-[2.5rem] border-2 border-gray-50 hover:border-primary/20 hover:bg-white hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                           <div className="flex items-center justify-between mb-6 relative z-10">
                              <div className="flex items-center gap-3">
                                 <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${ticket.type === 'FREE' ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {ticket.type}
                                 </div>
                                 {ticket.isOffline && (
                                   <div className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700">
                                      OFFLINE
                                   </div>
                                 )}
                              </div>
                              <button className="text-gray-400 hover:text-primary transition-colors">
                                 <MoreVertical size={20} />
                              </button>
                           </div>

                           <h4 className="font-black text-gray-900 text-2xl mb-2 relative z-10">{ticket.name}</h4>
                           <p className="text-gray-500 text-sm mb-6 line-clamp-2">{ticket.description || "No description provided."}</p>

                           <div className="flex items-baseline gap-1 mb-8 relative z-10">
                              <p className="text-4xl font-black text-gray-900">
                                {Number(ticket.price) > 0 ? `₦${Number(ticket.price).toLocaleString()}` : "Free"}
                              </p>
                              {Number(ticket.price) > 0 && <span className="text-xs font-bold text-gray-400 uppercase">/ pax</span>}
                           </div>

                           <div className="space-y-6 pt-6 border-t border-gray-100 relative z-10">
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Min Group Size</p>
                                    <p className="text-sm font-bold text-gray-700">{ticket.groupSize || 1} Person(s)</p>
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Allocation Type</p>
                                    <p className="text-sm font-bold text-gray-700">{ticket.allocationType || "GENERAL"}</p>
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Max Per Order</p>
                                    <p className="text-sm font-bold text-gray-700">{ticket.maxPerOrder || 10}</p>
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available</p>
                                    <p className="text-sm font-bold text-gray-700">{ticket.availableQuantity || 0} / {ticket.totalQuantity}</p>
                                 </div>
                              </div>

                              {(ticket.salesStart || ticket.salesEnd) && (
                                <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                   <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                      <Clock size={12} className="text-primary" />
                                      Sales Period
                                   </div>
                                   <div className="flex flex-col gap-1">
                                      <p className="text-[11px] font-bold text-gray-600">
                                         Start: {ticket.salesStart ? new Date(ticket.salesStart).toLocaleString() : 'Immediate'}
                                      </p>
                                      <p className="text-[11px] font-bold text-gray-600">
                                         End: {ticket.salesEnd ? new Date(ticket.salesEnd).toLocaleString() : 'Event Start'}
                                      </p>
                                   </div>
                                </div>
                              )}

                              {ticket.earlyBirdPrice && (
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                   <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2 text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                                         <TrendingUp size={12} />
                                         Early Bird Active
                                      </div>
                                      <span className="text-[11px] font-black text-emerald-700">₦{Number(ticket.earlyBirdPrice).toLocaleString()}</span>
                                   </div>
                                   <p className="text-[10px] text-emerald-600 font-medium">
                                      Ends {ticket.earlyBirdExpiry ? new Date(ticket.earlyBirdExpiry).toLocaleDateString() : 'when limit reached'} • {ticket.earlyBirdLimit} slots total
                                   </p>
                                </div>
                              )}

                              {ticket.quantityDiscounts && ticket.quantityDiscounts.length > 0 && (
                                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                   <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2">Quantity Discounts</p>
                                   <div className="space-y-1">
                                      {ticket.quantityDiscounts.map((qd, idx) => (
                                         <p key={idx} className="text-[11px] font-bold text-blue-600">
                                            {qd.minQuantity}+ tickets: {qd.discountPercentage}% off
                                         </p>
                                      ))}
                                   </div>
                                </div>
                              )}

                              <div className="space-y-3">
                                 <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    <span>Sales Progress</span>
                                    <span className="text-gray-900 font-black">{ticket.totalQuantity - (ticket.availableQuantity || 0)} / {ticket.totalQuantity} Sold</span>
                                 </div>
                                 <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                      style={{ width: `${Math.min(100, ((ticket.totalQuantity - (ticket.availableQuantity || 0)) / (ticket.totalQuantity || 1)) * 100)}%` }}
                                    ></div>
                                 </div>
                              </div>
                           </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                         <Ticket className="mx-auto mb-4 text-gray-300" size={48} />
                         <p className="text-gray-400 font-medium">No ticket types created yet for this event.</p>
                      </div>
                    )}
                 </div>
              </div>
            )}

            {activeTab === "attendees" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                       <h3 className="text-lg font-black text-gray-900">Registered Attendees</h3>
                       <p className="text-xs text-gray-500 font-medium mt-1">Manage and track all guest registrations for this event.</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 font-bold text-xs rounded-xl border border-gray-100 hover:bg-gray-100 transition-all">
                          <Download size={14} />
                          Export List
                       </button>
                       <Link href={`/organizer/dashboard/events/${eventId}/check-in`} className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
                          <CheckCircle2 size={14} />
                          QR Check-in
                       </Link>
                    </div>
                 </div>

                 {attendeesLoading ? (
                   <div className="py-20 flex justify-center"><CustomLoader /></div>
                 ) : (
                   <div className="bg-white rounded-3xl border border-gray-50 overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                         <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-50">
                               <tr>
                                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Attendee</th>
                                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ticket Details</th>
                                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Registered At</th>
                                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                               {attendees.length > 0 ? (
                                 attendees.map((attendee, idx) => (
                                   <tr key={attendee.id || idx} className="hover:bg-gray-50/50 transition-colors group">
                                      <td className="px-6 py-6">
                                         <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center font-black text-sm">
                                               {(attendee.attendeeName || attendee.attendeeData?.['full-name'] || 'G')[0]}
                                            </div>
                                            <div>
                                               <p className="text-sm font-bold text-gray-900">{attendee.attendeeName || attendee.attendeeData?.['full-name'] || "Guest"}</p>
                                               <p className="text-[10px] text-gray-400 font-medium">{attendee.attendeeEmail || attendee.attendeeData?.['email'] || "No email"}</p>
                                            </div>
                                         </div>
                                      </td>
                                      <td className="px-6 py-6">
                                         <p className="text-sm font-bold text-gray-700">{attendee.ticketName || "Standard Entry"}</p>
                                         <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">ID: {attendee.ticketNumber || attendee.id?.slice(0, 8)}</p>
                                      </td>
                                      <td className="px-6 py-6">
                                         <div className="flex flex-col gap-1.5">
                                            <span className={`w-fit px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                               attendee.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                            }`}>
                                               {attendee.status || 'PAID'}
                                            </span>
                                            {attendee.checkInStatus && (
                                              <span className="flex items-center gap-1 text-[9px] font-black text-blue-600 uppercase tracking-widest">
                                                 <CheckCircle2 size={10} />
                                                 Checked-in
                                              </span>
                                            )}
                                         </div>
                                      </td>
                                      <td className="px-6 py-6">
                                         <p className="text-[11px] font-bold text-gray-600">{new Date(attendee.createdAt).toLocaleDateString()}</p>
                                         <p className="text-[9px] text-gray-400 font-medium">{new Date(attendee.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                      </td>
                                      <td className="px-6 py-6 text-right">
                                         <button className="p-2 text-gray-400 hover:text-primary transition-colors">
                                            <MoreVertical size={16} />
                                         </button>
                                      </td>
                                   </tr>
                                 ))
                               ) : (
                                 <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                       <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                          <Users size={32} />
                                       </div>
                                       <h4 className="text-lg font-bold text-gray-900">No attendees yet</h4>
                                       <p className="text-gray-500 text-sm">Once people register for your event, they will appear here.</p>
                                    </td>
                                 </tr>
                               )}
                            </tbody>
                         </table>
                      </div>
                   </div>
                 )}
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default EventDetails;
