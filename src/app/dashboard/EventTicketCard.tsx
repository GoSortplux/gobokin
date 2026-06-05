"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { format } from "date-fns";
import {
  Calendar,
  MapPin,
  Tag,
  ChevronRight,
  CalendarPlus,
  Download,
  ExternalLink,
  Ticket as TicketIcon,
  Clock,
  RotateCcw,
  MoreVertical
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/services/api";
import Swal from "@/utils/sweetalert";
import useOnClickOutside from "@/hooks/useOnClickOutside";
import RefundRequestModal from "@/components/RefundRequestModal";

interface Registration {
  id: string;
  ticketNumber: string;
  paymentStatus: string;
  createdAt: string;
  event: {
    id: string;
    title: string;
    startDate: string;
    location: string;
    bannerUrl: string;
  };
  ticket: {
    name: string;
    type: string;
    price: number;
  };
}

interface EventTicketCardProps {
  registration: Registration;
  onViewDetails: (registration: Registration) => void;
}

const EventTicketCard: React.FC<EventTicketCardProps> = ({ registration, onViewDetails }) => {
  const [showCalendarOptions, setShowCalendarOptions] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(calendarRef, () => setShowCalendarOptions(false));
  useOnClickOutside(menuRef, () => setIsMenuOpen(false));

  const handleDownloadICS = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await api.get(`/events/${registration.event.id}/ics`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${registration.event.title}.ics`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to download ICS:", error);
      Swal.fire("Error", "Could not download calendar file.", "error");
    }
  };

  const handleAddToCalendar = async (e: React.MouseEvent, type: 'google' | 'outlook' | 'apple') => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await api.get(`/events/${registration.event.id}/calendar-links`);
      const links = response.data.data;
      if (links && links[type]) {
        window.open(links[type], '_blank');
      }
    } catch (error) {
      console.error("Failed to get calendar links:", error);
      Swal.fire("Error", "Could not open calendar.", "error");
    }
  };

  const isPaid = registration.paymentStatus === 'PAID';
  const eventDate = new Date(registration.event.startDate);
  const hasStarted = eventDate < new Date();
  const isFree = Number(registration.ticket.price) === 0;
  const canRequestRefund = !hasStarted && !isFree && isPaid;

  return (
    <div
      className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-500 group overflow-hidden cursor-pointer flex flex-col h-full"
      onClick={() => onViewDetails(registration)}
    >
      {/* Top Section: Banner & Date Badge */}
      <div className="relative h-40 w-full bg-gray-100 flex-shrink-0">
        {registration.event.bannerUrl ? (
          <Image
            src={registration.event.bannerUrl}
            alt={registration.event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
            <Calendar size={40} />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
            isPaid ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
          }`}>
            {registration.paymentStatus}
          </div>
        </div>

        {/* Date Badge */}
        <div className="absolute top-4 left-4">
          <div className="bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl shadow-sm flex flex-col items-center leading-none border border-white/20">
            <span className="text-[10px] font-black text-emerald-600 uppercase">{format(eventDate, "MMM")}</span>
            <span className="text-lg font-black text-gray-900">{format(eventDate, "d")}</span>
          </div>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="font-black text-white text-lg leading-tight line-clamp-1 drop-shadow-md">
            {registration.event.title}
          </h3>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="space-y-3 mb-5">
          <div className="flex items-center gap-2.5 text-xs text-gray-600 font-medium">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <MapPin size={14} />
            </div>
            <span className="line-clamp-1">{registration.event.location || "Virtual Event"}</span>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-gray-600 font-medium">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Clock size={14} />
            </div>
            <span>{format(eventDate, "p")}</span>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-gray-600 font-medium">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Tag size={14} />
            </div>
            <span className="line-clamp-1">{registration.ticket.name} • {registration.ticket.type}</span>
          </div>
        </div>

        {/* Ticket ID & Actions */}
        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Ticket No.</p>
            <p className="text-sm font-black text-gray-900 flex items-center gap-1.5">
              <TicketIcon size={12} className="text-emerald-500" />
              {registration.ticketNumber}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canRequestRefund && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(!isMenuOpen);
                  }}
                  className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center border border-gray-100"
                  title="More Options"
                >
                  <MoreVertical size={18} />
                </button>

                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-[20] overflow-hidden"
                    >
                      <p className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">Actions</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowRefundModal(true);
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <RotateCcw size={14} />
                        Request Refund
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="relative" ref={calendarRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCalendarOptions(!showCalendarOptions);
                }}
                className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center border border-gray-100"
                title="Add to Calendar"
              >
                <CalendarPlus size={18} />
              </button>

              <AnimatePresence>
                {showCalendarOptions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-[20] overflow-hidden"
                  >
                    <p className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">Save Event</p>
                    <button
                      onClick={(e) => handleAddToCalendar(e, 'google')}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    >
                      Google Calendar
                    </button>
                    <button
                      onClick={(e) => handleDownloadICS(e)}
                      className="flex items-center justify-between w-full px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    >
                      <span>iCal / Outlook</span>
                      <Download size={14} className="opacity-50" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              className="w-10 h-10 rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:brightness-110 transition-all flex items-center justify-center"
              title="View Details"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(registration);
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Ticket Tear-off Effect */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-4 bg-gray-100 rounded-l-full border-y border-l border-gray-200/50" />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-4 bg-gray-100 rounded-r-full border-y border-r border-gray-200/50" />

      {showRefundModal && (
        <RefundRequestModal
          registrationId={registration.id}
          onClose={() => setShowRefundModal(false)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};

export default EventTicketCard;
