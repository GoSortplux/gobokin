"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  TrendingUp,
  Ticket,
  Eye,
  CheckCircle2,
  AlertCircle,
  Tag,
  Globe,
  Trash2,
  EyeOff
} from "lucide-react";
import Image from "next/image";
import api from "@/services/api";
import { Event, Analytics } from "@/types";
import CustomLoader from "@/components/CustomLoader";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";

const AdminEventDetails = () => {
  const { eventId } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [attendees, setAttendees] = useState<{ id?: string; attendeeName?: string; attendeeEmail?: string; ticketName?: string; ticketNumber?: string; status?: string; checkInStatus?: boolean; createdAt: string; attendeeData?: Record<string, string> }[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        const [eventRes, analyticsRes]: [{ data: { data: Event } }, { data: { data: Analytics } }] = await Promise.all([
          api.get(`/events/${eventId}`),
          api.get(`/events/${eventId}/analytics`)
        ]);
        setEvent(eventRes.data.data);
        setAnalytics(analyticsRes.data.data);
      } catch (error) {
        console.error("Failed to fetch event data:", error);
        // Fallback to basic event fetch if analytics fails
        try {
            const eventRes = await api.get(`/events/${eventId}`);
            setEvent(eventRes.data.data);
        } catch (_e) {
            Swal.fire("Error", translateError(error), "error");
        }
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
          const response = await api.get(`/events/orders/all?eventId=${eventId}`);
          setAttendees(response.data.data || []);
        } catch (error) {
          console.error("Failed to fetch attendees:", error);
          setAttendees([]);
        } finally {
          setAttendeesLoading(false);
        }
      };
      fetchAttendees();
    }
  }, [activeTab, eventId]);

  const handlePublish = async () => {
    if (!event) return;
    const result = await Swal.fire({
      title: 'Publish Event Platform-wide?',
      text: 'This will make the event visible to all users and allow ticket sales.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Publish',
      confirmButtonColor: '#10b981',
    });

    if (result.isConfirmed) {
      try {
        setIsActionLoading(true);
        Swal.showLoading();
        await api.post(`/events/${eventId}/publish`);
        Swal.fire('Published!', 'The event is now live platform-wide.', 'success');
        const eventRes = await api.get(`/events/${eventId}`);
        setEvent(eventRes.data.data);
      } catch (error) {
        Swal.fire('Error', translateError(error), 'error');
      } finally {
        setIsActionLoading(false);
      }
    }
  };

  const handleUnpublish = async () => {
    if (!event) return;
    const result = await Swal.fire({
      title: 'Unpublish Event?',
      text: 'This will hide the event from the public.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Unpublish',
      confirmButtonColor: '#f59e0b',
    });

    if (result.isConfirmed) {
      try {
        setIsActionLoading(true);
        Swal.showLoading();
        await api.post(`/events/${eventId}/unpublish`);
        Swal.fire('Unpublished!', 'The event has been moved to drafts.', 'success');
        const eventRes = await api.get(`/events/${eventId}`);
        setEvent(eventRes.data.data);
      } catch (error) {
        Swal.fire('Error', translateError(error), 'error');
      } finally {
        setIsActionLoading(false);
      }
    }
  };

  const deleteEvent = async () => {
    if (!event) return;
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You are about to delete this event platform-wide!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    });

    if (result.isConfirmed) {
      try {
        Swal.showLoading();
        await api.delete(`/events/${event.id}`);
        Swal.fire("Deleted!", "The event has been deleted.", "success");
        router.push("/admin/events/events");
      } catch (error) {
        Swal.fire("Error", translateError(error), "error");
      }
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><CustomLoader /></div>;
  if (!event) return <div className="p-20 text-center"><AlertCircle className="mx-auto mb-4 text-red-500" size={48} /><h3 className="text-xl font-bold">Event not found</h3></div>;

  return (
    <div className="space-y-8 pb-12 px-2">
      {/* Top Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back to Platform Events
        </button>
        <div className="flex items-center gap-3">
          {!event.isPublished ? (
            <button
              onClick={handlePublish}
              disabled={isActionLoading}
              className="flex items-center gap-2 bg-emerald-50 text-emerald-600 font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100"
            >
              <CheckCircle2 size={18} />
              Publish Event
            </button>
          ) : (
            <button
              onClick={handleUnpublish}
              disabled={isActionLoading}
              className="flex items-center gap-2 bg-amber-50 text-amber-600 font-bold px-5 py-2.5 rounded-xl hover:bg-amber-600 hover:text-white transition-all border border-amber-100"
            >
              <EyeOff size={18} />
              Unpublish Event
            </button>
          )}
          <button
            onClick={deleteEvent}
            className="flex items-center gap-2 bg-rose-50 text-rose-600 font-bold px-5 py-2.5 rounded-xl hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
          >
            <Trash2 size={18} />
            Delete Event
          </button>
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
                      </div>
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
                                  </div>
                               </div>
                             )}
                          </div>
                        </div>
                      )}
                   </div>
                </div>

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
              </div>
            )}

            {activeTab === "schedule" && (
              <div className="space-y-6 animate-in fade-in duration-500">
                 <h3 className="text-lg font-black text-gray-900">Event Schedule</h3>
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
                 <h3 className="text-lg font-black text-gray-900">Platform Ticket Tiers</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {event.tickets && event.tickets.length > 0 ? (
                      event.tickets.map((ticket, i) => (
                        <div key={i} className="p-8 rounded-[2.5rem] border-2 border-gray-50 hover:border-primary/20 hover:bg-white hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
                           <div className="flex items-center justify-between mb-6 relative z-10">
                              <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${ticket.type === 'FREE' ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-700'}`}>
                                 {ticket.type}
                              </div>
                           </div>

                           <h4 className="font-black text-gray-900 text-2xl mb-2 relative z-10">{ticket.name}</h4>

                           <div className="flex items-baseline gap-1 mb-8 relative z-10">
                              <p className="text-4xl font-black text-gray-900">
                                {Number(ticket.price) > 0 ? `₦${Number(ticket.price).toLocaleString()}` : "Free"}
                              </p>
                           </div>

                           <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100 relative z-10">
                              <div className="space-y-1">
                                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Allocation</p>
                                 <p className="text-sm font-bold text-gray-700">{ticket.allocationType || "GENERAL"}</p>
                              </div>
                              <div className="space-y-1">
                                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available</p>
                                 <p className="text-sm font-bold text-gray-700">{ticket.availableQuantity || 0} / {ticket.totalQuantity}</p>
                              </div>
                           </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                         <Ticket className="mx-auto mb-4 text-gray-300" size={48} />
                         <p className="text-gray-400 font-medium">No ticket types created yet.</p>
                      </div>
                    )}
                 </div>
              </div>
            )}

            {activeTab === "attendees" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                 <h3 className="text-lg font-black text-gray-900">Registered Attendees</h3>
                 {attendeesLoading ? (
                   <div className="py-20 flex justify-center"><CustomLoader /></div>
                 ) : (
                   <div className="bg-white rounded-3xl border border-gray-50 overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                         <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-50">
                               <tr>
                                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Attendee</th>
                                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ticket</th>
                                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Registered At</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                               {attendees.length > 0 ? (
                                 attendees.map((attendee: { id?: string; attendeeName?: string; attendeeEmail?: string; ticketName?: string; ticketNumber?: string; status?: string; checkInStatus?: boolean; createdAt: string; attendeeData?: Record<string, string> }, idx: number) => (
                                   <tr key={attendee.id || idx} className="hover:bg-gray-50/50 transition-colors">
                                      <td className="px-6 py-6">
                                         <p className="text-sm font-bold text-gray-900">{attendee.attendeeName || attendee.attendeeData?.['full-name'] || "Guest"}</p>
                                         <p className="text-[10px] text-gray-400 font-medium">{attendee.attendeeEmail || attendee.attendeeData?.['email']}</p>
                                      </td>
                                      <td className="px-6 py-6">
                                         <p className="text-sm font-bold text-gray-700">{attendee.ticketName}</p>
                                      </td>
                                      <td className="px-6 py-6">
                                         <span className={`w-fit px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                            attendee.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                         }`}>
                                            {attendee.status || 'PAID'}
                                         </span>
                                      </td>
                                      <td className="px-6 py-6 font-bold text-xs text-gray-600">
                                         {new Date(attendee.createdAt).toLocaleDateString()}
                                      </td>
                                   </tr>
                                 ))
                               ) : (
                                 <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                       <Users className="mx-auto mb-4 text-gray-300" size={32} />
                                       <p className="text-gray-500 text-sm">No attendees found.</p>
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

export default AdminEventDetails;
