"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  User,
  Mail,
  Ticket,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  MapPin
} from "lucide-react";
import api from "@/services/api";
import CustomLoader from "@/components/CustomLoader";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";

interface DailyAttendance {
  day: number;
  attended: boolean;
  checkInTime?: string;
  checkedInBy?: {
    fullName: string;
    email: string;
    role: string;
  };
}

interface RegistrationDetail {
  id: string;
  ticketNumber: string;
  attendeeName: string;
  attendeeEmail: string;
  ticketName: string;
  guestCategory: string;
  overallCheckInStatus: boolean;
  dailyAttendance: DailyAttendance[];
}

interface RegistrationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  ticketNumber: string;
  attendeeName: string;
  onCheckInSuccess?: () => void;
}

const RegistrationDetailsModal = ({
  isOpen,
  onClose,
  eventId,
  ticketNumber,
  attendeeName,
  onCheckInSuccess
}: RegistrationDetailsModalProps) => {
  const [loading, setLoading] = useState(true);
  const [registration, setRegistration] = useState<RegistrationDetail | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [eventDays, setEventDays] = useState(0);

  const fetchDetails = useCallback(async () => {
    if (!isOpen || !eventId || !ticketNumber) return;

    try {
      setLoading(true);
      const response = await api.get(`/events/${eventId}/registrations`, {
        params: { search: ticketNumber }
      });

      const found = response.data.data.find((reg: RegistrationDetail) => reg.ticketNumber === ticketNumber);
      setRegistration(found || null);
      setEventDays(response.data.eventDays || 0);
    } catch (error) {
      console.error("Failed to fetch registration details:", error);
      Swal.fire("Error", "Could not load registration details.", "error");
    } finally {
      setLoading(false);
    }
  }, [isOpen, eventId, ticketNumber]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      Swal.showLoading();

      await api.post("/events/check-in", { ticketNumber });

      await Swal.fire({
        title: "Success",
        text: "Attendee checked in successfully",
        icon: "success",
        timer: 1500,
        showConfirmButton: false
      });

      fetchDetails(); // Refresh details in modal
      if (onCheckInSuccess) onCheckInSuccess();
    } catch (error) {
      Swal.fire("Error", translateError(error), "error");
    } finally {
      setCheckingIn(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-3xl rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-primary p-5 sm:p-7 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 sm:top-5 right-4 sm:right-6 p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-md">
              <User className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Registration Details</h2>
              <p className="text-white/70 text-[11px] sm:text-sm font-medium">Manage and view attendee history</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-5 sm:p-8 space-y-8">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <CustomLoader />
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading details...</p>
            </div>
          ) : registration ? (
            <>
              {/* Attendee Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black text-2xl">
                         {registration.attendeeName?.[0] || 'G'}
                      </div>
                      <div>
                         <h3 className="text-2xl font-black text-gray-900 leading-tight">{registration.attendeeName}</h3>
                         <p className="text-sm font-bold text-gray-500 flex items-center gap-1.5 mt-1">
                            <Mail size={14} className="text-primary" />
                            {registration.attendeeEmail}
                         </p>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ticket Number</p>
                         <p className="text-sm font-black text-gray-900">{registration.ticketNumber}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Category</p>
                         <p className="text-sm font-black text-gray-900">{registration.ticketName}</p>
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className={`p-6 rounded-3xl border flex items-center justify-between ${
                     registration.overallCheckInStatus
                     ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                     : 'bg-amber-50 border-amber-100 text-amber-700'
                   }`}>
                      <div className="flex items-center gap-4">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                            registration.overallCheckInStatus ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                         }`}>
                            {registration.overallCheckInStatus ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                         </div>
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Overall Status</p>
                            <p className="text-lg font-black">{registration.overallCheckInStatus ? 'Checked In' : 'Not Checked In'}</p>
                         </div>
                      </div>
                   </div>

                   {registration.guestCategory && (
                     <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3">
                        <ShieldCheck className="text-blue-600" size={18} />
                        <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Guest Category: {registration.guestCategory}</span>
                     </div>
                   )}
                </div>
              </div>

              {/* Attendance Grid */}
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                       <Calendar size={16} className="text-primary" />
                       Attendance History
                    </h4>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                       {registration.dailyAttendance.filter(d => d.attended).length} / {eventDays || registration.dailyAttendance.length || 1} Days
                    </span>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {registration.dailyAttendance.length > 0 ? (
                      registration.dailyAttendance.map((dayData) => (
                        <div
                          key={dayData.day}
                          className={`p-4 rounded-2xl border transition-all ${
                            dayData.attended
                            ? 'bg-white border-emerald-100 shadow-sm'
                            : 'bg-gray-50 border-gray-100'
                          }`}
                        >
                           <div className="flex items-center justify-between mb-3">
                              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                                 dayData.attended ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'
                              }`}>
                                 Day {dayData.day + 1}
                              </span>
                              {dayData.attended ? (
                                <CheckCircle2 size={16} className="text-emerald-500" />
                              ) : (
                                <XCircle size={16} className="text-gray-300" />
                              )}
                           </div>

                           {dayData.attended ? (
                             <div className="space-y-2">
                                <div className="flex items-center gap-2 text-gray-600">
                                   <Clock size={12} />
                                   <p className="text-[10px] font-bold">
                                      {new Date(dayData.checkInTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                   </p>
                                </div>
                                {dayData.checkedInBy && (
                                  <div className="flex items-center gap-2 text-gray-400">
                                     <User size={12} />
                                     <p className="text-[9px] font-medium truncate" title={dayData.checkedInBy.fullName}>
                                        By {dayData.checkedInBy.fullName}
                                     </p>
                                  </div>
                                )}
                             </div>
                           ) : (
                             <p className="text-[10px] font-bold text-gray-400 italic">No attendance record</p>
                           )}
                        </div>
                      ))
                    ) : (
                      // Fallback if dailyAttendance is empty but eventDays > 0
                      Array.from({ length: eventDays || 1 }).map((_, i) => (
                        <div key={i} className="p-4 rounded-2xl border bg-gray-50 border-gray-100">
                           <div className="flex items-center justify-between mb-3">
                              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-gray-200 text-gray-500">
                                 Day {i + 1}
                              </span>
                              <XCircle size={16} className="text-gray-300" />
                           </div>
                           <p className="text-[10px] font-bold text-gray-400 italic">No attendance record</p>
                        </div>
                      ))
                    )}
                 </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <User size={32} />
               </div>
               <h4 className="text-lg font-bold text-gray-900">Attendee not found</h4>
               <p className="text-gray-500 text-sm">We couldn&apos;t find registration details for this ticket.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-7 bg-gray-50/80 backdrop-blur-md border-t border-gray-100 shrink-0">
           <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 order-2 sm:order-1">
                 <div className="flex items-center gap-1.5 text-gray-400">
                    <ShieldCheck size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Verified Registration</span>
                 </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2">
                 <button
                   onClick={onClose}
                   className="flex-1 sm:flex-none px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
                 >
                   Close
                 </button>

                 {!registration?.overallCheckInStatus && (
                    <button
                      onClick={handleCheckIn}
                      disabled={checkingIn || loading || !registration}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-900/20 hover:bg-emerald-700 transition-all disabled:opacity-50"
                    >
                      {checkingIn ? (
                        <>
                          <CustomLoader size={16} />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          Check-in Attendee
                        </>
                      )}
                    </button>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationDetailsModal;
