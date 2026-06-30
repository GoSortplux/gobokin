"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../services/api";
import BookingCard from "./BookingCard";
import BookingDetailsModal from "./BookingDetailsModal";
import ReviewModal from "./ReviewModal";
import ReservationsList from "@/components/ReservationsList";
import Swal from "@/utils/sweetalert";
import CustomLoader from "@/components/CustomLoader";
import { useAuth } from "@/context/AuthContext";
import { Booking, Review, Venue } from "@/types";
import { Search, Clock } from "lucide-react";

const BookingsView = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");

  const fetchBookings = async () => {
    try {
      const response = await api.get("/bookings/my-bookings");
      setBookings(response.data.data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<Booking | null>(null);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [loadingReviewStatus, setLoadingReviewStatus] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      Swal.fire("Validation Error", "Please enter a booking ID to search.", "error");
      return;
    }
    try {
      const response = await api.get(`/bookings/search/${searchTerm}`);
      if (response.data.data) {
        const result = response.data.data;
        const id = result.bookingId || result.reservationId;
        router.push(`/booking/details/${id}`);
      } else {
        Swal.fire("Not Found", "Booking not found.", "error");
      }
    } catch (error) {
      console.error("Error searching for booking:", error);
      Swal.fire("Error", "Failed to search for booking.", "error");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  const handleReviewClick = async (booking: Booking) => {
    // Requirements: paid and completed (bookingStatus check anticipated)
    if (booking.paymentStatus !== 'paid') {
      Swal.fire('Ineligible', 'You can only review bookings that have been paid in full.', 'info');
      return;
    }

    // Future-proofing for bookingStatus
    if (booking.bookingStatus && booking.bookingStatus !== 'completed') {
      Swal.fire('Ineligible', 'You can only review bookings that are completed.', 'info');
      return;
    }

    if (booking.review) {
      setExistingReview(booking.review);
      setSelectedBookingForReview(booking);
      setIsReviewModalOpen(true);
      return;
    }

    try {
      setLoadingReviewStatus(true);
      // Fetch all reviews for this venue to check if one exists for this booking (fallback)
      const hallId = typeof booking.hall === 'object' ? (booking.hall as Venue)._id : booking.hall;
      const response = await api.get(`/reviews/hall/${hallId}`);
      const reviews = (response.data.data || []) as Review[];

      const foundReview = reviews.find((r: Review) =>
        r.booking === booking._id && r.user?._id === user?.id
      );

      setExistingReview(foundReview || null);
      setSelectedBookingForReview(booking);
      setIsReviewModalOpen(true);
    } catch (error) {
      console.error("Error checking for existing review:", error);
      Swal.fire("Error", "Failed to check review status.", "error");
    } finally {
      setLoadingReviewStatus(false);
    }
  };

  const handleViewReceipt = async (bookingId: string) => {
    try {
      const response = await api.get(`/bookings/search/${bookingId}`);
      if (response.data.data) {
        setSelectedBooking(response.data.data);
        setIsModalOpen(true);
      } else {
        Swal.fire("Not Found", "Booking details could not be found.", "error");
      }
    } catch (error) {
      console.error("Error fetching booking details:", error);
      Swal.fire("Error", "Failed to fetch booking details.", "error");
    }
  };

  const filteredBookings = bookings.filter((booking: Booking) => {
    if (!booking.bookingDates || booking.bookingDates.length === 0) {
      return activeTab === "upcoming";
    }
    const latestEndTime = new Date(
      Math.max(...booking.bookingDates.map((d) => new Date(d.endTime).getTime()))
    );
    const now = new Date();
    const isPast = latestEndTime < now;

    if (activeTab === "pending") {
      return booking.paymentStatus === "pending" && !isPast;
    }

    return activeTab === "past" ? isPast : !isPast;
  }).sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  return (
    <div>
      {loadingReviewStatus && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
          <CustomLoader size={64} />
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Venue Bookings</h2>
        <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500 font-medium bg-gray-100/50 px-4 py-2 rounded-full">
           <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
           {bookings.length} Total Bookings
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6 bg-white p-1.5 sm:p-2 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex p-1 bg-gray-50 rounded-xl w-full lg:w-auto overflow-x-auto no-scrollbar -mx-1 px-1 sm:mx-0 sm:px-0">
          <div className="flex min-w-max lg:min-w-0 w-full gap-1">
            {["upcoming", "past", "pending", "reservations"].map((tab) => (
              <button
                key={tab}
                className={`flex-1 lg:flex-none px-4 sm:px-6 py-2.5 text-[13px] sm:text-sm font-bold capitalize transition-all duration-200 rounded-lg flex items-center justify-center gap-2 whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-400 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "reservations" && <Clock size={14} />}
                {tab === "pending" ? "Pending" : tab}
              </button>
            ))}
          </div>
        </div>
        <div className={`flex items-center w-full lg:max-w-md relative ${activeTab === 'reservations' ? 'opacity-50 pointer-events-none' : ''}`}>
          <input
            type="text"
            placeholder="Search by booking ID..."
            className="w-full p-3 pl-10 pr-20 bg-gray-50 border-none rounded-xl text-gray-800 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute left-3.5 text-gray-400">
             <Search className="w-4 h-4" />
          </div>
          <button
            className="absolute right-2 px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-opacity-90 transition-all shadow-md shadow-primary/20"
            onClick={handleSearch}
          >
            Search
          </button>
        </div>
      </div>

      {activeTab === "reservations" ? (
        <ReservationsList />
      ) : filteredBookings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBookings.map((booking: Booking) => (
            <BookingCard
              key={booking._id}
              booking={booking}
              onViewReceipt={handleViewReceipt}
              onReview={handleReviewClick}
              onRefresh={fetchBookings}
              isPast={activeTab === "past"}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>
          </div>
          <p className="text-gray-900 font-bold text-xl">No {activeTab} bookings</p>
          <p className="text-gray-500 mt-1">We couldn&apos;t find any bookings in this category.</p>
        </div>
      )}
      {isModalOpen && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={handleCloseModal}
        />
      )}
      {isReviewModalOpen && selectedBookingForReview && (
        <ReviewModal
          booking={selectedBookingForReview}
          existingReview={existingReview}
          onClose={() => setIsReviewModalOpen(false)}
          onReviewSubmitted={(newReview: Review) => {
            setBookings((prevBookings) =>
              prevBookings.map((b) =>
                b._id === selectedBookingForReview?._id
                  ? { ...b, review: newReview }
                  : b
              )
            );
          }}
        />
      )}
    </div>
  );
};

export default BookingsView;
