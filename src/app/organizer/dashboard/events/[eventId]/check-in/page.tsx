"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  XCircle,
  QrCode,
  User,
  Ticket,
  Clock,
  Calendar,
  AlertCircle,
  Scan,
  ShieldCheck
} from "lucide-react";
import api from "@/services/api";
import { Event } from "@/types";
import CustomLoader from "@/components/CustomLoader";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";

const CheckInInterface = () => {
  const { eventId } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/events/${eventId}`);
        setEvent(response.data.data);
      } catch (error) {
        console.error("Failed to fetch event details:", error);
        Swal.fire("Error", translateError(error), "error");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setSearching(true);
    setSearchResult(null);
    try {
      const response = await api.get(`/events/check-in/lookup?eventId=${eventId}&ticketNumber=${searchTerm}`);
      setSearchResult(response.data.data);
    } catch (error) {
      console.error("Lookup failed:", error);
      Swal.fire("Not Found", "Ticket number not valid for this event.", "error");
    } finally {
      setSearching(false);
    }
  };

  const handleConfirmCheckIn = async (registrationId: string) => {
    setCheckingIn(true);
    try {
      Swal.showLoading();
      await api.post("/events/check-in", {
        registrationId,
        eventId
      });

      await Swal.fire({
        title: "Check-in Successful!",
        text: `${searchResult?.attendeeData?.['full-name'] || 'Guest'} has been checked in.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false
      });

      setSearchResult(null);
      setSearchTerm("");
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
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold mb-4 group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Event
        </button>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">QR Check-in</h1>
        <p className="text-gray-500 font-medium">Scan or lookup attendee ticket numbers to track attendance.</p>
      </div>

      <div className="space-y-8">
        {/* Search / Scan Box */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-blue-900/5">
           <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                 <Scan size={28} />
              </div>
              <div>
                 <h3 className="text-xl font-black text-gray-900">Attendee Lookup</h3>
                 <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Enter Ticket ID</p>
              </div>
           </div>

           <form onSubmit={handleLookup} className="relative">
              <input
                type="text"
                placeholder="Enter Ticket Number (e.g., TKT-12345)"
                className="w-full pl-6 pr-32 py-5 bg-gray-50 border-2 border-transparent rounded-[2rem] text-lg font-bold focus:border-primary focus:bg-white transition-all uppercase placeholder:normal-case"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                disabled={searching}
                className="absolute right-3 top-3 bottom-3 bg-primary text-white font-black px-6 rounded-2xl hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
              >
                {searching ? "..." : <Search size={20} />}
                Lookup
              </button>
           </form>

           <div className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-center">
              <button className="flex flex-col items-center gap-3 group">
                 <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                    <QrCode size={32} />
                 </div>
                 <span className="text-xs font-black text-gray-500 uppercase tracking-widest group-hover:text-primary transition-colors">Start QR Scanner</span>
              </button>
           </div>
        </div>

        {/* Search Result Card */}
        {searchResult && (
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-blue-900/10 overflow-hidden animate-in zoom-in duration-300">
             <div className={`p-1 text-center text-[10px] font-black uppercase tracking-widest ${searchResult.checkInStatus ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {searchResult.checkInStatus ? 'Already Checked-in' : 'Ready for Check-in'}
             </div>

             <div className="p-8 space-y-6">
                <div className="flex items-center gap-6">
                   <div className="w-20 h-20 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center font-black text-3xl">
                      {searchResult.attendeeData?.['full-name']?.[0] || <User />}
                   </div>
                   <div className="flex-1">
                      <h3 className="text-2xl font-black text-gray-900 leading-tight mb-1">{searchResult.attendeeData?.['full-name'] || "N/A"}</h3>
                      <p className="text-gray-500 font-bold flex items-center gap-2">
                        <Ticket size={16} className="text-primary" />
                        {searchResult.ticketNumber}
                      </p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-gray-50 rounded-2xl">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ticket Type</p>
                      <p className="text-sm font-bold text-gray-900">VIP Admission</p>
                   </div>
                   <div className="p-4 bg-gray-50 rounded-2xl">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Payment</p>
                      <p className="text-sm font-black text-emerald-600 flex items-center gap-1.5">
                        <ShieldCheck size={14} />
                        PAID
                      </p>
                   </div>
                </div>

                {searchResult.checkInStatus ? (
                  <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex items-center gap-4">
                     <AlertCircle className="text-amber-500" size={24} />
                     <div>
                        <p className="text-amber-900 font-bold">Already checked in at</p>
                        <p className="text-xs text-amber-700 font-medium">
                           {searchResult.checkedInAt ? new Date(searchResult.checkedInAt).toLocaleString() : "N/A"}
                        </p>
                     </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleConfirmCheckIn(searchResult.id)}
                    disabled={checkingIn}
                    className="w-full bg-emerald-600 text-white font-black py-6 rounded-[2rem] hover:bg-opacity-90 transition-all shadow-xl shadow-emerald-900/10 flex items-center justify-center gap-3 text-lg disabled:opacity-50"
                  >
                    Confirm Check-in
                    <CheckCircle2 size={24} />
                  </button>
                )}

                <button
                  onClick={() => setSearchResult(null)}
                  className="w-full text-gray-400 font-bold py-2 text-sm hover:text-gray-600 transition-colors"
                >
                   Cancel and Clear
                </button>
             </div>
          </div>
        )}

        {/* Attendance Snippet */}
        <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white shadow-xl">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black tracking-tight">Event Statistics</h3>
              <div className="px-3 py-1 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-100">
                Live Status
              </div>
           </div>

           <div className="grid grid-cols-2 gap-8">
              <div>
                 <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Total Attended</p>
                 <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black">0</span>
                    <span className="text-gray-500 font-bold text-sm">/ 0 total</span>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Check-in Rate</p>
                 <p className="text-4xl font-black text-emerald-400">0%</p>
              </div>
           </div>

           <div className="mt-8 space-y-2">
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                 <div className="w-0 h-full bg-emerald-400 rounded-full"></div>
              </div>
              <p className="text-[10px] text-gray-500 font-medium">Keep track of your attendee flow in real-time.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CheckInInterface;
