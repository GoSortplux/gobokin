"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  QrCode,
  Ticket,
  Clock,
  AlertCircle,
  Scan,
  ShieldCheck,
  Users,
  Mail
} from "lucide-react";
import api from "@/services/api";
import { Event, Analytics, StaffMember } from "@/types";
import CustomLoader from "@/components/CustomLoader";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";
import { useAuth } from "@/context/AuthContext";

const CheckInInterface = () => {
  const { eventId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [searching, setSearching] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  const fetchData = useCallback(async (showLoading = true) => {
    const isStaff = user?.role?.includes('organizer-staff');
    try {
      if (showLoading) setLoading(true);

      const promises: [Promise<any>, Promise<any> | null, Promise<any> | null] = [
        api.get(`/events/${eventId}`),
        !isStaff ? api.get(`/events/${eventId}/analytics`) : null,
        !isStaff ? api.get(`/events/${eventId}/staff`) : null
      ];

      const [eventRes, analyticsRes, staffRes] = await Promise.all(promises);

      setEvent(eventRes.data.data);
      if (analyticsRes) {
        setAnalytics(analyticsRes.data.data);
      }
      if (staffRes) {
        const staffMembers = (staffRes.data.data || []).map((item: any) => item.staff).filter(Boolean);
        setStaff(staffMembers);
      }
    } catch (error) {
      console.error("Failed to fetch check-in data:", error);
      if (showLoading) Swal.fire("Error", translateError(error), "error");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setSearching(true);
    setSearchResult(null);
    try {
      const response = await api.get(`/events/check-in/lookup?ticketNumber=${searchTerm}`);
      setSearchResult(response.data.data);
    } catch (error) {
      console.error("Lookup failed:", error);
      Swal.fire("Not Found", "Ticket number not valid for this event.", "error");
    } finally {
      setSearching(false);
    }
  };

  const handleConfirmCheckIn = async () => {
    if (!searchResult?.ticketNumber) return;

    setCheckingIn(true);
    try {
      Swal.showLoading();
      await api.post("/events/check-in", {
        ticketNumber: searchResult.ticketNumber,
        sessionId: selectedSessionId || undefined
      });

      await Swal.fire({
        title: "Check-in Successful!",
        text: `${searchResult?.attendeeData?.fullName || searchResult?.attendeeData?.["full-name"] || "Guest"} has been checked in.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false
      });

      setSearchResult(null);
      setSearchTerm("");
      fetchData(false); // Silent refresh of stats
    } catch (error) {
      console.error("Check-in failed:", error);
      Swal.fire("Check-in Error", translateError(error), "error");
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><CustomLoader /></div>;
  if (!event) return <div className="p-20 text-center"><h3 className="text-xl font-bold">Event not found</h3></div>;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 lg:px-8">
      <div className="mb-10">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold mb-6 group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Event
        </button>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight italic uppercase">Check-in <span className="text-primary not-italic">Portal</span></h1>
            <p className="text-gray-500 font-medium text-lg mt-1">Efficiently manage and track attendee arrival in real-time.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-black text-primary bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            LIVE SYNC ACTIVE
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Search / Scan Box */}
          <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-gray-100 shadow-2xl shadow-blue-900/5 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

             <div className="flex items-center gap-5 mb-10 relative z-10">
                <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 rotate-3 group-hover:rotate-0 transition-transform">
                   <Scan size={32} />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-gray-900 tracking-tight">Attendee Lookup</h3>
                   <p className="text-xs text-gray-400 font-black uppercase tracking-[0.2em] mt-0.5">Instant Ticket Verification</p>
                </div>
             </div>

             <form onSubmit={handleLookup} className="relative z-10">
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400">
                    <Ticket size={24} />
                  </div>
                  <input
                    type="text"
                    placeholder="Scan or Enter Ticket ID..."
                    className="w-full pl-16 pr-40 py-6 bg-gray-50 border-2 border-gray-100 rounded-[2.5rem] text-xl font-bold focus:border-primary focus:bg-white focus:ring-8 focus:ring-primary/5 transition-all uppercase placeholder:normal-case shadow-inner"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={searching}
                    className="absolute right-3 top-3 bottom-3 bg-primary text-white font-black px-10 rounded-[1.8rem] hover:bg-opacity-90 transition-all shadow-xl shadow-primary/20 flex items-center gap-3 disabled:opacity-50 group"
                  >
                    {searching ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Search size={22} className="group-hover:scale-110 transition-transform" />}
                    <span className="hidden sm:inline">Lookup</span>
                  </button>
                </div>
             </form>

             <div className="mt-10 pt-10 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
                <button className="flex items-center gap-4 px-8 py-4 bg-gray-900 text-white rounded-[1.5rem] hover:scale-105 transition-all shadow-xl shadow-gray-900/10 group">
                   <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-primary transition-colors">
                      <QrCode size={20} />
                   </div>
                   <div className="text-left">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mobile Scan</p>
                      <p className="text-sm font-bold">Open QR Scanner</p>
                   </div>
                </button>
                <div className="text-gray-300 font-bold italic text-sm">or</div>
                <p className="text-sm text-gray-500 font-medium max-w-xs text-center sm:text-left">
                  Use the input above to manually type the ticket ID found on the attendee&apos;s pass.
                </p>
             </div>
          </div>

          {/* Search Result Card */}
          {searchResult && (
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-[0_32px_64px_-16px_rgba(41,95,167,0.1)] overflow-hidden animate-in zoom-in slide-in-from-top-4 duration-500 relative">
               <div className={`p-2 text-center text-[10px] font-black uppercase tracking-[0.3em] ${searchResult.checkInStatus ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
                  {searchResult.checkInStatus ? 'ALREADY CHECKED-IN' : 'READY FOR VALIDATION'}
               </div>

               <div className="p-8 md:p-10 space-y-8">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                     <div className="relative">
                        <div className="w-28 h-28 bg-primary/10 text-primary rounded-[2.5rem] flex items-center justify-center font-black text-4xl shadow-inner border border-primary/5">
                           {(searchResult.attendeeData?.fullName || searchResult.attendeeData?.["full-name"] || "G")[0]}
                        </div>
                        {!searchResult.checkInStatus && (
                          <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-xl shadow-lg border-4 border-white">
                            <CheckCircle2 size={16} />
                          </div>
                        )}
                     </div>
                     <div className="flex-1 text-center md:text-left">
                        <h3 className="text-3xl font-black text-gray-900 tracking-tight leading-tight mb-2">
                          {searchResult.attendeeData?.fullName || searchResult.attendeeData?.["full-name"] || "Attendee Name N/A"}
                        </h3>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                          <span className="text-gray-500 font-bold flex items-center gap-2 bg-gray-50 px-4 py-1.5 rounded-full text-sm">
                            <Ticket size={16} className="text-primary" />
                            {searchResult.ticketNumber}
                          </span>
                          <span className="text-gray-500 font-bold flex items-center gap-2 bg-gray-50 px-4 py-1.5 rounded-full text-sm">
                            <Mail size={16} className="text-primary" />
                            {searchResult.attendeeData?.email || "No email provided"}
                          </span>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {event.sessions && event.sessions.length > 0 && (
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Assign to Session</label>
                        <div className="relative">
                          <Clock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <select
                            value={selectedSessionId}
                            onChange={(e) => setSelectedSessionId(e.target.value)}
                            className="w-full pl-12 pr-10 py-5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-primary transition-all outline-none appearance-none cursor-pointer"
                          >
                            <option value="">Standard Event Entry</option>
                            {event.sessions.map((session: any) => (
                              <option key={session.id} value={session.id}>
                                {session.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 group hover:bg-white hover:border-primary/20 transition-all">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ticket Category</p>
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm border border-gray-100">
                              <Ticket size={18} />
                           </div>
                           <p className="text-lg font-black text-gray-900">Standard Access</p>
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 group hover:bg-white hover:border-primary/20 transition-all">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Payment Status</p>
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                              <ShieldCheck size={18} />
                           </div>
                           <p className="text-lg font-black text-emerald-600">PAID & VERIFIED</p>
                        </div>
                    </div>
                  </div>

                  {searchResult.checkInStatus ? (
                    <div className="bg-amber-50 p-8 rounded-[2rem] border border-amber-100 flex items-start gap-5">
                       <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
                          <AlertCircle size={24} />
                       </div>
                       <div>
                          <p className="text-amber-900 font-black text-lg">Attendee Already Checked-in</p>
                          <p className="text-sm text-amber-700 font-medium mt-1 leading-relaxed">
                             This ticket was validated on {searchResult.checkedInAt ? new Date(searchResult.checkedInAt).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' }) : "an unknown time"}.
                          </p>
                       </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleConfirmCheckIn}
                      disabled={checkingIn}
                      className="w-full bg-emerald-600 text-white font-black py-7 rounded-[2rem] hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-emerald-900/20 flex items-center justify-center gap-4 text-xl disabled:opacity-50 group"
                    >
                      {checkingIn ? "Validating..." : "Confirm & Complete Check-in"}
                      {!checkingIn && <CheckCircle2 size={28} className="group-hover:rotate-12 transition-transform" />}
                    </button>
                  )}

                  <button
                    onClick={() => setSearchResult(null)}
                    className="w-full text-gray-400 font-bold py-4 text-sm hover:text-gray-900 transition-colors uppercase tracking-[0.2em]"
                  >
                     Cancel and Clear Result
                  </button>
               </div>
            </div>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* Attendance Stats */}
          <div className="bg-gray-900 p-10 rounded-[3rem] text-white shadow-2xl shadow-gray-900/30 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-colors"></div>

             <div className="flex items-center justify-between mb-10 relative z-10">
                <h3 className="text-2xl font-black tracking-tight italic uppercase">Live <span className="text-primary not-italic">Stats</span></h3>
                <div className="px-3 py-1 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-100 border border-white/5">
                  Real-time
                </div>
             </div>

             <div className="space-y-10 relative z-10">
                {!isStaff && (
                  <div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mb-3">Check-in Flow</p>
                    <div className="flex items-baseline gap-3">
                        <span className="text-6xl font-black tracking-tighter">
                          {analytics?.summary?.checkedInGuests || 0}
                        </span>
                        <span className="text-gray-500 font-black text-xl italic tracking-tight">
                          / {analytics?.summary?.totalRegistrations || 0} Total
                        </span>
                    </div>
                  </div>
                )}

                {!isStaff && (
                  <div className="space-y-4">
                    <div className="flex items-end justify-between">
                      <div>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mb-1">Check-in Rate</p>
                          <p className="text-5xl font-black text-emerald-400 tracking-tighter">
                            {analytics?.summary?.attendanceRate || 0}%
                          </p>
                      </div>
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-emerald-400 border border-white/5">
                          <Users size={32} />
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000"
                          style={{ width: `${analytics?.summary?.attendanceRate || 0}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-3">
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Entry Progress</p>
                        <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Target: 100%</p>
                      </div>
                    </div>
                  </div>
                )}
             </div>

             <div className="mt-12 p-6 bg-white/5 rounded-[2rem] border border-white/5 relative z-10">
                <div className="flex items-center gap-3 mb-3">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)]"></div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assigned Check-in Staff</p>
                </div>
                <div className="flex -space-x-2">
                   {staff.length > 0 ? (
                     staff.map((member) => (
                       <div key={member.id} className="w-8 h-8 rounded-full bg-primary/20 border-2 border-gray-900 flex items-center justify-center text-[10px] font-bold overflow-hidden" title={member.fullName || member.email}>
                          {member.fullName?.[0] || member.email[0].toUpperCase()}
                       </div>
                     ))
                   ) : (
                     <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-gray-900 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                        {user?.fullName?.[0] || 'U'}
                     </div>
                   )}
                </div>
             </div>
          </div>

          {/* Quick Help */}
          <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl shadow-blue-900/5">
             <h4 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2 uppercase italic">
                <AlertCircle size={20} className="text-primary not-italic" />
                Quick Tips
             </h4>
             <ul className="space-y-4">
                {[
                  "Position the QR code within the frame for best scanning results.",
                  "Ensure the attendee has their ID ready if verification is required.",
                  "If a ticket is rejected, check the payment status in the lookup result.",
                  "Network issues? Try refreshing the page to reconnect live sync."
                ].map((tip, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-600 font-medium">
                     <span className="text-primary font-black shrink-0">•</span>
                     {tip}
                  </li>
                ))}
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckInInterface;
