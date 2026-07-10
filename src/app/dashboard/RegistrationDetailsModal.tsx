"use client";
import React, { useState, useEffect, useRef } from "react";
import { X, Calendar, MapPin, Ticket, User, Clock, ExternalLink, RotateCcw, CreditCard, FileText, Download } from "lucide-react";
import api from "@/services/api";
import { Event, Registration, PricingBreakdown } from "@/types";
import CustomLoader from "@/components/CustomLoader";
import CheckoutBreakdownModal from "@/components/shared/CheckoutBreakdownModal";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";
import RefundRequestModal from "@/components/RefundRequestModal";
import Image from "next/image";
import { format } from "date-fns";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

interface RegistrationDetailsModalProps {
  registration: Registration;
  onClose: () => void;
}

interface ResourceMetadata {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  [key: string]: unknown;
}

const RegistrationDetailsModal: React.FC<RegistrationDetailsModalProps> = ({ registration, onClose }) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [resources, setResources] = useState<ResourceMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [pricingBreakdown, setPricingBreakdown] = useState<PricingBreakdown | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState("");

  const ticketRef = useRef<HTMLDivElement>(null);
  const [qrBase64, setQrBase64] = useState<string>('');

  useEffect(() => {
    let active = true;
    const convertQr = async () => {
      const qrUrl = registration.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${registration.ticketNumber}`;
      try {
        const response = await fetch(qrUrl);
        if (!response.ok) throw new Error('QR code fetch failed');
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        if (active) setQrBase64(base64);
      } catch (err) {
        console.error('Failed to pre-convert ticket QR code to Base64:', err);
      }
    };

    if (registration.qrCodeUrl || registration.ticketNumber) {
      convertQr();
    }

    return () => {
      active = false;
    };
  }, [registration.qrCodeUrl, registration.ticketNumber]);

  const handleDownloadPDF = async () => {
    if (ticketRef.current === null) return;
    try {
      Swal.showLoading();
      const dataUrl = await toPng(ticketRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        filter: (node: HTMLElement) => {
          if (node.tagName === 'BUTTON') return false;
          if (node.classList && node.classList.contains('exclude-capture')) {
            return false;
          }
          return true;
        }
      });
      Swal.close();

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pdfWidth - (margin * 2);
      const contentHeight = (imgProps.height * contentWidth) / imgProps.width;

      pdf.addImage(dataUrl, 'PNG', margin, margin, contentWidth, contentHeight);
      pdf.save(`ticket-${registration.ticketNumber}.pdf`);
    } catch (err) {
      console.error('Failed to download ticket PDF', err);
      Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: 'Could not generate ticket PDF. Please try again.',
      });
    }
  };

  const handleShareTicket = async () => {
    if (ticketRef.current === null) return;
    try {
      Swal.showLoading();
      const dataUrl = await toPng(ticketRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        filter: (node: HTMLElement) => {
          if (node.tagName === 'BUTTON') return false;
          if (node.classList && node.classList.contains('exclude-capture')) {
            return false;
          }
          return true;
        }
      });
      Swal.close();

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `ticket-${registration.ticketNumber}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Event Ticket',
          text: `I'm attending ${registration.event.title}! Here is my ticket pass.`,
        });
      } else {
        const link = document.createElement('a');
        link.download = `ticket-${registration.ticketNumber}.png`;
        link.href = dataUrl;
        link.click();
        Swal.fire({
          icon: 'success',
          title: 'Ticket Saved',
          text: 'Sharing is not supported on this browser. Ticket saved as image instead!',
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error('Failed to share ticket', err);
      Swal.fire({
        icon: 'error',
        title: 'Share Failed',
        text: 'Could not share ticket. Please try again.',
      });
    }
  };

  const handlePayNow = async () => {
    if (!registration.orderId) {
      Swal.fire("Error", "Order ID missing for this registration.", "error");
      return;
    }

    try {
      setIsProcessingPayment(true);
      Swal.showLoading();
      const response = await api.get(`/events/orders/${registration.orderId}/checkout`);
      const { checkoutUrl, pricingBreakdown } = response.data.data;

      if (checkoutUrl && pricingBreakdown) {
        setPricingBreakdown(pricingBreakdown);
        setCheckoutUrl(checkoutUrl);
        setShowBreakdownModal(true);
        setIsProcessingPayment(false);
        Swal.close();
      } else if (checkoutUrl) {
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
        // We use unknown cast to bypass strict typing for this dynamic lookup
        const eventAny = registration.event as unknown as Record<string, unknown>;
        const organizer = eventAny?.organizer as { slug?: string } | undefined;
        const slug = eventAny?.slug as string | undefined;
        const endpoint = (organizer?.slug && slug)
          ? `/events/e/${organizer.slug}/${slug}`
          : `/events/${registration.event.id}`;
        const response = await api.get(endpoint);
        setEvent(response.data.data);
      } catch (error) {
        console.error("Failed to fetch event details:", error);
      } finally {
        setLoading(false);
      }
    };
    const fetchResources = async () => {
      try {
        const response = await api.get(`/events/${registration.event.id}/resources`, {
          headers: {
            'x-user-role': 'guest',
            'x-guest-ticket-types': registration.ticket.id
          }
        });
        if (response.data.success) {
          setResources(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch event resources:", error);
      }
    };

    if (registration?.event?.id) {
      fetchEventDetails();
      fetchResources();
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
      {pricingBreakdown && (
        <CheckoutBreakdownModal
          isOpen={showBreakdownModal}
          onClose={() => setShowBreakdownModal(false)}
          onConfirm={() => {
            window.location.href = checkoutUrl;
          }}
          breakdown={pricingBreakdown}
        />
      )}
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

                {/* Event Resources Section */}
                {resources.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                      <FileText size={20} className="text-primary" />
                      Resource Materials
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {resources.map((resource) => (
                        <div key={resource.id} className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100/50 flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-primary">
                              <FileText size={20} />
                            </div>
                            <div>
                              <p className="font-black text-gray-900 text-sm leading-none">{resource.title}</p>
                              <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-wider">
                                {resource.fileName.split('.').pop()?.toUpperCase()} • {resource.fileSize ? (resource.fileSize / (1024 * 1024)).toFixed(2) + ' MB' : 'Resource'}
                              </p>
                            </div>
                          </div>
                          <a
                            href={(resource.resourceFile as string) || (resource.fileUrl as string) || (resource.externalLink as string)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 bg-white hover:bg-primary hover:text-white text-primary rounded-xl transition-all shadow-sm flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                          >
                            <Download size={14} />
                            Access
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                <div ref={ticketRef} className="bg-white border-2 border-dashed border-gray-200 rounded-[2.5rem] p-10 flex flex-col items-center text-center space-y-8 sticky top-0">
                   <div className="w-full aspect-square bg-gray-50 rounded-3xl flex items-center justify-center border border-gray-100 relative group overflow-hidden">
                      {qrBase64 ? (
                         <img src={qrBase64} alt="QR Code" className="w-full h-full p-4 object-contain" />
                      ) : registration.qrCodeUrl ? (
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
                      <p className="text-xs font-bold uppercase tracking-widest text-primary line-clamp-1">{registration.event.title}</p>
                      <p className="text-2xl font-black text-gray-900 tracking-tighter">Valid Entry Pass</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mt-1">
                        Attendee: {registration.attendeeData?.fullName || (registration.attendeeData as Record<string, unknown>)?.[ "full-name" ] as string || "N/A"}
                      </p>
                      <p className="text-sm font-black text-primary font-mono bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100 w-fit mx-auto mt-2">
                        {registration.ticketNumber}
                      </p>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest leading-relaxed mt-2">
                        Please present this ticket at the <br/> venue for check-in.
                      </p>
                   </div>

                   <div className="w-full pt-8 border-t border-gray-100 space-y-3 exclude-capture">
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
                          onClick={handleDownloadPDF}
                          className="flex-1 bg-primary text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-50"
                        >
                          Download PDF
                        </button>
                        <button
                          onClick={handleShareTicket}
                          className="flex-1 bg-gray-50 text-gray-900 font-black py-4 rounded-2xl text-xs uppercase tracking-widest border border-gray-100 hover:bg-gray-100 transition-all"
                        >
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
