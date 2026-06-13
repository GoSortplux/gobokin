"use client";
import React, { useState, useEffect } from "react";
import { X, Calendar, MapPin, Ticket, User, Mail, Phone, Info, Clock, ExternalLink, RotateCcw, CreditCard } from "lucide-react";
import api from "@/services/api";
import { Event, Registration } from "@/types";
import CustomLoader from "@/components/CustomLoader";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";
import RefundRequestModal from "@/components/RefundRequestModal";
import Image from "next/image";
import { format } from "date-fns";

interface RegistrationDetailsModalProps {
  registration: Registration;
  onClose: () => void;
}

const RegistrationDetailsModal: React.FC<RegistrationDetailsModalProps> = ({ registration, onClose }) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handlePayNow = async () => {
    if (!registration.orderId) {
      Swal.fire("Error", "Order ID missing for this registration.", "error");
      return;
    }

    try {
      setIsProcessingPayment(true);
      Swal.showLoading();
      const response = await api.get(`/events/orders/${registration.orderId}/checkout`);
      const checkoutUrl = response.data.data.checkoutUrl;

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error("Checkout URL not found.");
      }
    } catch (error) {
      console.error("Failed to fetch checkout URL:", error);
      Swal.fire("Error", translateError(error), "error");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        // The event object inside registration might not have organizer slug
        // We use any to bypass strict typing for this dynamic lookup
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eventAny = registration.event as any;
        const endpoint = eventAny?.organizer?.slug && eventAny?.slug
          ? `/events/e/${eventAny.organizer.slug}/${eventAny.slug}`
          : `/events/${registration.event.id}`;
        const response = await api.get(endpoint);
        setEvent(response.data.data);
      } catch (error) {
        console.error("Failed to fetch event details:", error);
      } finally {
        setLoading(false);
      }
    };
    if (registration?.event?.id) {
      fetchEventDetails();
    }
  }, [registration]);

  if (!registration) return null;

  const eventDate = new Date(registration.event.startDate);
  const hasStarted = eventDate < new Date();
  const isFree = Number(registration.ticket.price) === 0;
  const isPaid = registration.paymentStatus === 'PAID';
  const canRequestRefund = !hasStarted && !isFree && isPaid;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-20 p-2 bg-black/10 hover:bg-black/20 text-white lg:text-gray-900 rounded-full backdrop-blur-md transition-all"
        >
          <X size={20} />
        </button>

        <div className="overflow-y-auto no-scrollbar">
          {/* Header Image */}
          <div className="relative h-64 lg:h-80 w-full bg-gray-100">
            {registration.event.bannerUrl ? (
              <Image src={registration.event.bannerUrl} alt={registration.event.title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-200">
                <Calendar size={80} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="px-4 py-1.5 bg-primary rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-primary/20">
                  {event?.category || "Event"}
                </span>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${registration.paymentStatus === 'PAID' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                  {registration.paymentStatus}
                </span>
              </div>
              <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tighter leading-none">{registration.event.title}</h2>
            </div>
          </div>

          <div className="p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left Column: Info */}
              <div className="lg:col-span-7 space-y-10">
                {/* Event Highlights */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date & Time</p>
                    <div className="flex items-center gap-2 text-gray-900 font-bold">
                       <Clock size={16} className="text-primary" />
                       {format(new Date(registration.event.startDate), "PPP p")}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</p>
                    <div className="flex items-center gap-2 text-gray-900 font-bold">
                       <MapPin size={16} className="text-primary" />
                       <span className="truncate">{registration.event.location || "Virtual Event"}</span>
                    </div>
                  </div>
                </div>

                {/* Attendee Details */}
                <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 space-y-6">
                   <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                     <User size={20} className="text-primary" />
                     Attendee Information
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Full Name</p>
                        <p className="font-black text-gray-900">{registration.attendeeData?.fullName || (registration.attendeeData as Record<string, unknown>)?.[ "full-name" ] as string || "N/A"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Email Address</p>
                        <p className="font-black text-gray-900">{registration.attendeeData?.email || "N/A"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ticket Type</p>
                        <p className="font-black text-gray-900">{registration.ticket.name} ({registration.ticket.type})</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ticket Number</p>
                        <p className="font-black text-gray-900">{registration.ticketNumber}</p>
                      </div>
                   </div>
                </div>

                {/* Event Description (Truncated if needed) */}
                {loading ? (
                  <div className="flex justify-center py-10"><CustomLoader /></div>
                ) : event && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">About Event</h3>
                    <p className="text-gray-500 leading-relaxed font-medium">
                      {event.description}
                    </p>
                    <button
                      onClick={() => {
                        const url = event.organizer?.slug && event.slug
                          ? `/events/${event.organizer.slug}/${event.slug}`
                          : `/events/${event.id}`;
                        window.open(url, '_blank');
                      }}
                      className="text-primary text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:underline"
                    >
                      View Full Event Page <ExternalLink size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Ticket Card */}
              <div className="lg:col-span-5">
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-[2.5rem] p-10 flex flex-col items-center text-center space-y-8 sticky top-0">
                   <div className="w-full aspect-square bg-gray-50 rounded-3xl flex items-center justify-center border border-gray-100 relative group overflow-hidden">
                      {registration.qrCodeUrl ? (
                         <Image src={registration.qrCodeUrl} alt="QR Code" fill className="p-4" />
                      ) : (
                        <div className="flex flex-col items-center gap-4 text-gray-300">
                           <Ticket size={80} strokeWidth={1} />
                           <p className="text-xs font-black uppercase tracking-widest opacity-50 text-gray-400">QR Code Pending</p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <div className="bg-white px-4 py-2 rounded-xl shadow-lg text-[10px] font-black text-primary uppercase tracking-widest">
                            Official Ticket
                         </div>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <p className="text-2xl font-black text-gray-900 tracking-tighter">Valid Entry Pass</p>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                        Please present this ticket at the <br/> venue for check-in.
                      </p>
                   </div>

                   <div className="w-full pt-8 border-t border-gray-100 space-y-3">
                      {!isPaid && !isFree && (
                        <button
                          onClick={handlePayNow}
                          disabled={isProcessingPayment}
                          className="w-full bg-amber-500 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-amber-500/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <CreditCard size={14} />
                          {isProcessingPayment ? 'Processing...' : 'Complete Payment Now'}
                        </button>
                      )}

                      <div className="flex gap-4">
                        <button
                          disabled={!isPaid && !isFree}
                          className="flex-1 bg-primary text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-50"
                        >
                          Download PDF
                        </button>
                        <button className="flex-1 bg-gray-50 text-gray-900 font-black py-4 rounded-2xl text-xs uppercase tracking-widest border border-gray-100 hover:bg-gray-100 transition-all">
                          Share Ticket
                        </button>
                      </div>

                      {canRequestRefund && (
                        <button
                          onClick={() => setShowRefundModal(true)}
                          className="w-full bg-red-50 text-red-600 font-black py-4 rounded-2xl text-xs uppercase tracking-widest border border-red-100 hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                        >
                          <RotateCcw size={14} />
                          Request Refund
                        </button>
                      )}
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showRefundModal && (
        <RefundRequestModal
          registrationId={registration.id}
          onClose={() => setShowRefundModal(false)}
          onSuccess={() => {
            // Success alert is handled in the modal
            onClose();
          }}
        />
      )}
    </div>
  );
};

export default RegistrationDetailsModal;
