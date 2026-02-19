"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  Building2,
  User,
  Mail,
  Receipt,
  ArrowRight,
  Home,
  CheckCircle2,
  AlertCircle,
  X
} from "lucide-react";
import api from "@/services/api";
import { Booking, Reservation, Venue } from "@/types";
import CustomLoader from "@/components/CustomLoader";
import UnifiedReceipt from "@/components/shared/UnifiedReceipt";
import withAuth from "@/components/auth/withAuth";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";

const BookingDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;

  const [data, setData] = useState<Booking | Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const fetchBookingDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/bookings/search/${bookingId}`);
      setData(response.data.data);
    } catch (err) {
      console.error("Error fetching booking details:", err);
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId, fetchBookingDetails]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CustomLoader />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Booking</h1>
        <p className="text-gray-600 mb-6 text-center max-w-md">{error || "Could not find booking details."}</p>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl font-bold transition-all hover:bg-primary/90"
        >
          <ChevronLeft size={20} />
          Go Back
        </button>
      </div>
    );
  }

  const isBooking = (item: Booking | Reservation): item is Booking => {
    return 'bookingId' in item;
  };

  const id = isBooking(data) ? data.bookingId : data.reservationId;
  const venue = typeof data.hall === 'object' ? (data.hall as Venue) : null;
  const bookingUser = typeof data.user === 'object' ? (data.user as { fullName: string; email: string }) : null;
  const status = isBooking(data) ? (data.status || data.bookingStatus) : data.status;
  const paymentStatus = data.paymentStatus;

  const isPending = paymentStatus === "pending";

  const formattedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formattedTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (s: string | undefined) => {
    switch (s?.toLowerCase()) {
      case 'confirmed':
      case 'active':
      case 'paid':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleCompletePayment = async () => {
    try {
      Swal.showLoading();
      const response = await api.get(`/payments/checkout-link/${id}`);
      const checkoutUrl = response.data.data.checkoutUrl;
      if (checkoutUrl) {
        Swal.close();
        window.location.href = checkoutUrl;
      } else {
        Swal.fire("Error", "We couldn't get the payment link. Please try again.", "error");
      }
    } catch (err) {
      console.error("Failed to get checkout link:", err);
      Swal.fire("Error", translateError(err), "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 overflow-x-auto whitespace-nowrap pb-2">
          <Link href="/" className="hover:text-primary flex items-center gap-1">
            <Home size={14} />
            Home
          </Link>
          <ArrowRight size={12} />
          <Link href="/dashboard" className="hover:text-primary">
            Dashboard
          </Link>
          <ArrowRight size={12} />
          <span className="text-gray-900 font-medium">Booking Details</span>
        </nav>

        {/* Header Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors mb-2 font-medium"
            >
              <ChevronLeft size={20} />
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              Booking <span className="text-primary">#{id}</span>
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            {!isPending && (
              <button
                onClick={() => setShowReceipt(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-all active:scale-95"
              >
                <Receipt size={20} />
                View Receipt
              </button>
            )}
            {isPending && status !== 'cancelled' && (
              <button
                onClick={handleCompletePayment}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
              >
                <CreditCard size={20} />
                Complete Payment
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Status Card */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`px-4 py-2 rounded-full border text-sm font-bold uppercase tracking-wider ${getStatusColor(status)}`}>
                  {status}
                </div>
                <div className={`px-4 py-2 rounded-full border text-sm font-bold uppercase tracking-wider ${getStatusColor(paymentStatus)}`}>
                  Payment: {paymentStatus}
                </div>
              </div>
              <div className="text-sm text-gray-500 font-medium">
                Created on {formattedDate(data.createdAt)}
              </div>
            </div>

            {/* Venue Details Card */}
            <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100">
              <div className="relative h-64 w-full">
                <Image
                  src={venue?.images?.[0] || '/venue_default.jpg'}
                  alt={venue?.name || 'Venue'}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <h2 className="text-2xl font-bold">{venue?.name || 'N/A'}</h2>
                  <div className="flex items-center gap-2 text-white/80 mt-1">
                    <MapPin size={16} />
                    <span>{venue?.location || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Building2 className="text-primary" size={20} />
                  Venue Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <p className="text-gray-600 leading-relaxed line-clamp-4">
                      {venue?.description || 'No description available for this venue.'}
                    </p>
                    <Link
                      href={`/venues/${venue?.slug || venue?._id}`}
                      className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
                    >
                      View Venue Details
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-medium">Capacity</span>
                      <span className="text-gray-900 font-bold">{venue?.capacity || 0} guests</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-medium">Rating</span>
                      <div className="flex items-center gap-1 text-yellow-500 font-bold">
                        <CheckCircle2 size={16} />
                        {venue?.averageRating || 0} ({venue?.numReviews || 0} reviews)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Dates Card */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Calendar className="text-primary" size={20} />
                Scheduled Dates & Times
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.bookingDates.map((date, index) => (
                  <div key={index} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <Calendar size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{formattedDate(date.startTime)}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Clock size={14} />
                        <span>{formattedTime(date.startTime)} - {formattedTime(date.endTime)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Payment Summary */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
              <h3 className="text-lg font-bold text-gray-900 mb-6 relative z-10">Payment Summary</h3>
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Total Price</span>
                  <span className="font-bold text-gray-900">₦{data.totalPrice?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Amount Paid</span>
                  <span className="font-bold text-green-600">₦{(data.paidAmount || data.reservationFee || 0).toLocaleString()}</span>
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-gray-900 font-bold text-lg">Balance Due</span>
                  <span className="text-primary font-black text-2xl">
                    ₦{(data.balanceAmount || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {isPending && status !== 'cancelled' && (
                <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
                   <p className="text-sm text-gray-500 italic">
                    Your booking is currently pending. Please complete the payment to secure your reservation.
                   </p>
                   <button
                    onClick={handleCompletePayment}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Pay Now
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* Customer Details */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <User className="text-primary" size={20} />
                Customer Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-bold text-gray-900">{bookingUser?.fullName || data.walkInUserDetails?.fullName || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email Address</p>
                    <p className="font-bold text-gray-900">{bookingUser?.email || data.walkInUserDetails?.email || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 lg:p-8"
          >
            <div className="absolute inset-0" onClick={() => setShowReceipt(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl z-10"
            >
              <button
                onClick={() => setShowReceipt(false)}
                className="absolute -top-14 right-0 lg:-right-14 text-white hover:text-gray-300 transition-colors bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/20 shadow-xl"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="max-h-[85vh] overflow-y-auto rounded-[2.5rem] no-scrollbar shadow-2xl">
                <UnifiedReceipt data={data} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default withAuth(BookingDetailsPage, ["user", "hall-owner", "staff", "super-admin"]);
