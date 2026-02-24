"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  MapPin,
  Calendar,
  Clock,
  MoreVertical,
  CreditCard,
  Receipt,
  Star,
  XCircle,
  Undo2,
  Hash,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Booking, Venue } from "@/types";
import api from "@/services/api";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";

interface BookingCardProps {
  booking: Booking;
  onViewReceipt: (id: string) => void;
  onReview: (booking: Booking) => void;
  onRefresh?: () => void;
  isPast: boolean;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onViewReceipt, onReview, onRefresh, isPast }) => {
  const router = useRouter();
  const [completingPayment, setCompletingPayment] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const venue = typeof booking.hall === 'object' ? (booking.hall as Venue) : null;
  const hallName = venue ? venue.name : "Venue details unavailable";
  const hallLocation = venue ? venue.location : "Location unavailable";
  const hallImage = venue?.images?.[0] || "/venue_default.jpg";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRequestCancellation = async () => {
    setIsMenuOpen(false);
    const { value: reason, isConfirmed } = await Swal.fire({
      title: 'Request Cancellation?',
      text: 'Please provide a reason for requesting cancellation.',
      input: 'textarea',
      inputPlaceholder: 'Type your reason here...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Submit Request',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#295FA7',
      inputValidator: (value) => {
        if (!value) {
          return 'You need to provide a reason!';
        }
      }
    });

    if (isConfirmed && reason) {
      try {
        Swal.showLoading();
        await api.patch(`/bookings/${booking._id}/request-cancellation`, { reason });
        Swal.fire('Requested!', 'Your cancellation request has been sent.', 'success');
        if (onRefresh) onRefresh();
      } catch (error) {
        console.error('Failed to request cancellation:', error);
        Swal.fire('Error', translateError(error), 'error');
      }
    }
  };

  const handleWithdrawCancellation = async () => {
    setIsMenuOpen(false);
    const result = await Swal.fire({
      title: 'Withdraw Cancellation?',
      text: 'Are you sure you want to withdraw your cancellation request?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, withdraw it!',
      cancelButtonText: 'No, keep it',
      confirmButtonColor: '#295FA7',
    });

    if (result.isConfirmed) {
      try {
        Swal.showLoading();
        await api.patch(`/bookings/${booking._id}/withdraw-cancellation`);
        Swal.fire('Withdrawn!', 'Your cancellation request has been withdrawn.', 'success');
        if (onRefresh) onRefresh();
      } catch (error) {
        console.error('Failed to withdraw cancellation:', error);
        Swal.fire('Error', translateError(error), 'error');
      }
    }
  };

  const handleCompletePayment = async () => {
    if (completingPayment) return;
    setCompletingPayment(true);
    try {
      Swal.showLoading();
      const response = await api.get(`/payments/checkout-link/${booking.bookingId}`);
      const checkoutUrl = response.data.data.checkoutUrl;
      if (checkoutUrl) {
        Swal.close();
        window.location.href = checkoutUrl;
      } else {
        Swal.fire("Error", "We couldn't get the payment link. Please try again.", "error");
      }
    } catch (error) {
      console.error("Failed to get checkout link:", error);
      Swal.fire("Error", translateError(error), "error");
    } finally {
      setCompletingPayment(false);
    }
  };

  const cancellationStatus = booking.cancellationRequest?.status || 'not-requested';

  const getStatusConfig = () => {
    if (booking.status === 'cancelled') {
      return { label: 'Cancelled', color: 'bg-red-100 text-red-700' };
    }
    if (booking.paymentStatus === 'pending') {
      return { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-700' };
    }
    if (booking.paymentStatus === 'paid') {
      return { label: 'Fully Paid', color: 'bg-green-100 text-green-700' };
    }
    return { label: booking.status || 'Confirmed', color: 'bg-blue-100 text-blue-700' };
  };

  const status = getStatusConfig();

  const bookingDate = booking.bookingDates?.[0];
  const formattedDate = bookingDate?.startTime
    ? new Date(bookingDate.startTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : "N/A";

  const formattedTime = bookingDate?.startTime && bookingDate?.endTime
    ? `${new Date(bookingDate.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} - ${new Date(bookingDate.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
    : "N/A";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible transition-all duration-300 hover:shadow-md group relative">
      {/* Top Banner with Image */}
      <div className="relative h-32 w-full overflow-hidden rounded-t-2xl">
        <Image
          src={hallImage}
          alt={hallName}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.color}`}>
            {status.label}
          </span>
        </div>
        <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
           <h3 className="text-white font-bold text-lg truncate drop-shadow-md">
            {hallName}
          </h3>
        </div>
      </div>

      <div className="p-5">
        {/* Info Grid */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          <div className="flex items-center text-gray-600 text-sm">
            <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center mr-3 flex-shrink-0">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <span className="truncate">{hallLocation}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-600 text-sm">
              <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center mr-3 flex-shrink-0">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center text-gray-600 text-sm ml-4">
              <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center mr-3 flex-shrink-0">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <span>{formattedTime}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-2">
            <div className="flex items-center text-gray-400 text-[11px] font-medium uppercase tracking-tight">
               <Hash className="w-3 h-3 mr-1" />
               ID: {booking.bookingId}
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Amount</p>
              <p className="text-lg font-black text-gray-900 leading-none mt-1">
                ₦{booking.totalPrice?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-4">
          {!isPast && booking.paymentStatus === "pending" && booking.status !== "cancelled" ? (
            <button
              onClick={handleCompletePayment}
              disabled={!venue || completingPayment}
              className="flex-grow bg-primary text-white text-sm font-bold py-3 rounded-xl hover:bg-opacity-90 transition-all shadow-sm shadow-primary/20 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Complete Payment
            </button>
          ) : (
            <button
              onClick={() => router.push(`/booking/details/${booking.bookingId}`)}
              disabled={!venue}
              className="flex-grow bg-gray-900 text-white text-sm font-bold py-3 rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View Details
            </button>
          )}

          {/* More Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors border border-gray-100"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 bottom-full mb-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[50]"
                >
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => { router.push(`/booking/details/${booking.bookingId}`); setIsMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                      <Eye className="w-4 h-4 text-gray-400" />
                      View Details
                    </button>

                    {booking.paymentStatus !== 'pending' && (
                      <button
                        onClick={() => { onViewReceipt(booking.bookingId); setIsMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                      >
                        <Receipt className="w-4 h-4 text-gray-400" />
                        View Receipt
                      </button>
                    )}

                    {isPast && (
                      <button
                        onClick={() => { onReview(booking); setIsMenuOpen(false); }}
                        disabled={!venue}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50"
                      >
                        <Star className="w-4 h-4 text-gray-400" />
                        {booking.review ? "View Review" : "Review Venue"}
                      </button>
                    )}

                    {!isPast && booking.status !== 'cancelled' && booking.paymentStatus !== 'pending' && (
                      <div className="pt-1 mt-1 border-t border-gray-50">
                        {cancellationStatus === 'not-requested' ? (
                          <button
                            onClick={handleRequestCancellation}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            Request Cancellation
                          </button>
                        ) : cancellationStatus === 'pending' ? (
                          <button
                            onClick={handleWithdrawCancellation}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-yellow-600 hover:bg-yellow-50 rounded-xl transition-colors"
                          >
                            <Undo2 className="w-4 h-4" />
                            Withdraw Request
                          </button>
                        ) : (
                          <div className={`px-4 py-3 text-sm font-semibold ${
                            cancellationStatus === 'approved' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            Cancellation {cancellationStatus}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
