"use client";
import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAuth } from "@/context/AuthContext";
import { useUI } from "@/context/UIContext";
import api from "@/services/api";
import { translateError } from "@/utils/errors";
import BookingModal from "@/components/vendor/BookingModal";
import RescheduleModal from "@/components/vendor/RescheduleModal";
import RefundModal from "@/components/vendor/RefundModal";
import ConversionModal from "@/components/shared/ConversionModal";
import PaymentLinkModal from "@/components/shared/PaymentLinkModal";
import CustomLoader from "@/components/CustomLoader";
import ErrorState from "@/components/ErrorState";
import Swal from "@/utils/sweetalert";
import { ChevronDown, XCircle, Share2 } from "lucide-react";
import { Booking, Reservation, Venue } from "@/types";

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md shadow-sm disabled:opacity-50 disabled:bg-gray-100 transition-colors hover:bg-gray-50"
      >
        Previous
      </button>
      <span className="text-sm font-medium text-gray-700">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md shadow-sm disabled:opacity-50 disabled:bg-gray-100 transition-colors hover:bg-gray-50"
      >
        Next
      </button>
    </div>
  );
};

const BookingsPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { isBookingModalOpen, openBookingModal, closeBookingModal } = useUI();
  const searchParams = useSearchParams();
  const venueIdFromQuery = searchParams.get('hallId');
  const searchTerm = searchParams.get('search') || '';
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [rescheduleType, setRescheduleType] = useState<'booking' | 'reservation'>('booking');
  const [selectedBookingToReschedule, setSelectedBookingToReschedule] = useState<Booking | Reservation | null>(null);
  const [isPaymentLinkModalOpen, setIsPaymentLinkModalOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState("");
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundType, setRefundType] = useState<'booking' | 'reservation'>('booking');
  const [selectedItemForRefund, setSelectedItemForRefund] = useState<Booking | Reservation | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<string>(venueIdFromQuery || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isConversionModalOpen, setIsConversionModalOpen] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsTotalPages, setBookingsTotalPages] = useState(1);
  const [reservationsPage, setReservationsPage] = useState(1);
  const [reservationsTotalPages, setReservationsTotalPages] = useState(1);
  const [pendingCancellationsCount, setPendingCancellationsCount] = useState(0);
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [bookingTypeFilter, setBookingTypeFilter] = useState('all');
  const LIMIT = 20;

  const isOwnerBlocked = (booking: Booking | Reservation) => {
    return (
      booking.eventDetails === 'Owner Reservation (Blocked)' ||
      (booking as Booking).bookingType === 'admin-block'
    );
  };

  const isRefundComplete = (item: Booking | Reservation) => {
    if (!item.refundDetails) return false;
    const refundable = item.refundDetails.totalRefundableAmount || item.totalPrice || 0;
    const refunded = item.refundDetails.totalRefundedAmount || 0;
    return refunded >= refundable && refundable > 0;
  };

  const hasBeenRefunded = (item: (Booking | Reservation) & { isGroup?: boolean; groupBookings?: Booking[] }) => {
    if (item.isGroup && item.groupBookings) {
      return item.groupBookings.some((b: Booking) => (b.refundDetails?.totalRefundedAmount || 0) > 0);
    }
    return (item.refundDetails?.totalRefundedAmount || 0) > 0;
  };

  const fetchVenues = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get("/halls/by-owner");
      if (response.data && Array.isArray(response.data.data)) {
        setVenues(response.data.data);
        // If hallId from query is present, ensure it's selected
        if (venueIdFromQuery && response.data.data.some((venue: Venue) => venue._id === venueIdFromQuery)) {
          setSelectedVenue(venueIdFromQuery);
        }
      }
    } catch (err) {
      console.error("Error fetching venues:", err);
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  }, [venueIdFromQuery]);

  const fetchBookings = useCallback(async (hallId: string, page: number = 1) => {
    if (!hallId) {
      setBookings([]);
      return;
    }
    try {
      setLoading(true);
      setError('');
      let url = `/halls/${hallId}/bookings?page=${page}&limit=${LIMIT}`;

      if (activeTab === 'pending') {
        url += `&paymentStatus=pending`;
      } else if (status) {
        url += `&status=${status}`;
      }

      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      if (sortBy) url += `&sortBy=${sortBy}`;
      if (sortOrder) url += `&sortOrder=${sortOrder}`;

      const response = await api.get(url);
      const data = response.data.data;
      setBookings(data.bookings || []);
      setBookingsTotalPages(data.pagination?.totalPages || data.totalPages || 1);
    } catch (error: unknown) {
      console.error("Error fetching bookings:", error);
      const err = error as { response?: { status: number } };
      if (err.response?.status === 404) {
        setBookings([]);
        setBookingsTotalPages(1);
      } else {
        setError(translateError(error));
      }
    } finally {
      setLoading(false);
    }
  }, [status, startDate, endDate, sortBy, sortOrder, activeTab]);

  const fetchReservations = useCallback(async (hallId: string, page: number = 1) => {
    if (!hallId) {
      setReservations([]);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/reservations/halls/${hallId}?page=${page}&limit=${LIMIT}`);
      const data = response.data.data;
      setReservations(data.reservations || []);
      setReservationsTotalPages(data.pagination?.totalPages || data.totalPages || 1);
    } catch (error: unknown) {
      console.error("Error fetching reservations:", error);
      const err = error as { response?: { status: number } };
      if (err.response?.status === 404) {
        setReservations([]);
        setReservationsTotalPages(1);
      } else {
        setError(translateError(error));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      openBookingModal();

      // Clear the query parameter
      const params = new URLSearchParams(searchParams.toString());
      params.delete('action');
      const newQuery = params.toString();
      router.replace(newQuery ? `${pathname}?${newQuery}` : pathname);
    }
  }, [searchParams, openBookingModal, pathname, router]);

  useEffect(() => {
    if (selectedVenue) {
      const fetchCounts = async () => {
        try {
          const [bRes, rRes] = await Promise.all([
            api.get(`/halls/${selectedVenue}/bookings?cancellationRequestStatus=pending&limit=1`),
            api.get(`/reservations/halls/${selectedVenue}?cancellationRequestStatus=pending&limit=1`)
          ]);
          const bCount = bRes.data.data.pagination?.totalResults || bRes.data.data.totalResults || 0;
          const rCount = rRes.data.data.pagination?.totalResults || rRes.data.data.totalResults || 0;
          setPendingCancellationsCount(bCount + rCount);
        } catch (err) {
          console.error("Error fetching cancellation counts:", err);
        }
      };
      fetchCounts();

      if (activeTab === 'reservations') {
        fetchReservations(selectedVenue, reservationsPage);
      } else if (activeTab === 'cancellations') {
        fetchBookings(selectedVenue, bookingsPage);
        fetchReservations(selectedVenue, reservationsPage);
      } else if (activeTab === 'pending') {
        fetchBookings(selectedVenue, bookingsPage);
        fetchReservations(selectedVenue, reservationsPage);
      } else {
        fetchBookings(selectedVenue, bookingsPage);
      }
    }
  }, [selectedVenue, activeTab, bookingsPage, reservationsPage, fetchBookings, fetchReservations]);

  const handleHallChange = (hallId: string) => {
    setSelectedVenue(hallId);
    setBookingsPage(1);
    setReservationsPage(1);
  };

  const handleRetry = useCallback(() => {
    fetchVenues();
    if (selectedVenue) {
      if (activeTab === 'reservations') {
        fetchReservations(selectedVenue, reservationsPage);
      } else {
        fetchBookings(selectedVenue, bookingsPage);
      }
    }
  }, [fetchVenues, selectedVenue, activeTab, reservationsPage, bookingsPage, fetchReservations, fetchBookings]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'bookings') {
      setStatus('');
    }
    setBookingsPage(1);
    setReservationsPage(1);
  };

  const handleDirectCancel = async (id: string, isReservation = false) => {
    const title = isReservation ? 'Cancel Reservation?' : 'Cancel Booking?';
    const text = isReservation ? 'Please provide a reason for cancelling this reservation.' : 'Please provide a reason for cancelling this booking.';

    const { value: reason, isConfirmed } = await Swal.fire({
      title,
      text,
      input: 'textarea',
      inputPlaceholder: 'Type your reason here...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel it!',
      cancelButtonText: 'No, keep it',
      confirmButtonColor: '#d33',
      inputValidator: (value) => {
        if (!value) {
          return 'You need to provide a reason!';
        }
      }
    });

    if (isConfirmed && reason) {
      try {
        Swal.showLoading();
        const endpoint = isReservation ? `/reservations/${id}/cancel` : `/bookings/${id}/cancel`;
        await api.patch(endpoint, { reason });
        Swal.fire('Cancelled!', `The ${isReservation ? 'reservation' : 'booking'} has been cancelled.`, 'success');
        if (selectedVenue) {
          if (isReservation) fetchReservations(selectedVenue, reservationsPage);
          else fetchBookings(selectedVenue, bookingsPage);
        }
      } catch (err) {
        console.error('Failed to cancel:', err);
        Swal.fire('Error', translateError(err), 'error');
      }
    }
  };

  const handleConfirmCancellation = async (id: string, isReservation = false) => {
    const { value: reason, isConfirmed } = await Swal.fire({
      title: 'Confirm Cancellation?',
      text: 'Please provide a reason or note for approving this cancellation.',
      input: 'textarea',
      inputPlaceholder: 'Type your reason here...',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, approve it!',
      cancelButtonText: 'No',
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
        const endpoint = isReservation ? `/reservations/${id}/confirm-cancellation` : `/bookings/${id}/confirm-cancellation`;
        await api.patch(endpoint, { reason });
        Swal.fire('Approved!', 'The cancellation has been confirmed.', 'success');
        if (selectedVenue) {
          if (isReservation) fetchReservations(selectedVenue, reservationsPage);
          else fetchBookings(selectedVenue, bookingsPage);
        }
      } catch (err) {
        console.error('Failed to confirm cancellation:', err);
        Swal.fire('Error', translateError(err), 'error');
      }
    }
  };

  const handleRejectCancellation = async (id: string, isReservation = false) => {
    const { value: reason, isConfirmed } = await Swal.fire({
      title: 'Reject Cancellation?',
      text: 'Please provide a reason for rejecting this cancellation request.',
      input: 'textarea',
      inputPlaceholder: 'Type your reason here...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, reject it!',
      cancelButtonText: 'No',
      confirmButtonColor: '#d33',
      inputValidator: (value) => {
        if (!value) {
          return 'You need to provide a reason!';
        }
      }
    });

    if (isConfirmed && reason) {
      try {
        Swal.showLoading();
        const endpoint = isReservation ? `/reservations/${id}/reject-cancellation` : `/bookings/${id}/reject-cancellation`;
        await api.patch(endpoint, { reason });
        Swal.fire('Rejected!', 'The cancellation request has been rejected.', 'success');
        if (selectedVenue) {
          if (isReservation) fetchReservations(selectedVenue, reservationsPage);
          else fetchBookings(selectedVenue, bookingsPage);
        }
      } catch (err) {
        console.error('Failed to reject cancellation:', err);
        Swal.fire('Error', translateError(err), 'error');
      }
    }
  };

  const openRescheduleModal = (item: Booking | Reservation, type: 'booking' | 'reservation' = 'booking') => {
    setSelectedBookingToReschedule(item);
    setRescheduleType(type);
    setIsRescheduleModalOpen(true);
  };

  const openRefundModal = (item: Booking | Reservation, type: 'booking' | 'reservation' = 'booking') => {
    setSelectedItemForRefund(item);
    setRefundType(type);
    setIsRefundModalOpen(true);
  };

  const filteredBookings = React.useMemo(() => {
    let result = bookings;
    if (activeTab === 'cancellations') {
      result = result.filter(booking => booking.cancellationRequest?.status === 'pending');
    }
    if (activeTab === 'pending') {
      result = result.filter(booking =>
        booking.paymentStatus?.toLowerCase() === 'pending' ||
        booking.status?.toLowerCase() === 'pending'
      );
    }
    if (searchTerm) {
      result = result.filter(
        (booking) =>
          booking.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (booking.recurringBookingId && booking.recurringBookingId.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (typeof booking.user === 'object' && booking.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          booking.walkInUserDetails?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.eventDetails?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (bookingTypeFilter !== 'all') {
      result = result.filter(booking => {
        const isRecurring = !!booking.isRecurring;
        return bookingTypeFilter === 'recurring' ? isRecurring : !isRecurring;
      });
    }
    return result;
  }, [bookings, searchTerm, bookingTypeFilter, activeTab]);

  const groupedBookings = React.useMemo(() => {
    const groups: Record<string, Booking[]> = {};
    const result: (Booking & { isGroup?: boolean; groupBookings?: Booking[]; isReservation?: boolean })[] = [];

    filteredBookings.forEach(booking => {
      if (booking.isRecurring && booking.recurringBookingId) {
        if (!groups[booking.recurringBookingId]) {
          groups[booking.recurringBookingId] = [];
        }
        groups[booking.recurringBookingId].push(booking);
      } else {
        result.push({ ...booking, isGroup: false });
      }
    });

    if (activeTab === 'cancellations') {
      const reservationCancellations = reservations.filter(r => r.cancellationRequest?.status === 'pending');
      reservationCancellations.forEach(r => {
        result.push({
          ...(r as unknown as Booking),
          isGroup: false,
          isReservation: true,
          bookingId: r.reservationId // For display consistency
        });
      });
    } else if (activeTab === 'pending') {
      const pendingReservations = reservations.filter(r =>
        r.paymentStatus?.toLowerCase() === 'pending' ||
        r.status?.toLowerCase() === 'pending'
      );
      pendingReservations.forEach(r => {
        result.push({
          ...(r as unknown as Booking),
          isGroup: false,
          isReservation: true,
          bookingId: r.reservationId // For display consistency
        });
      });
    }

    Object.entries(groups).forEach(([recurringId, groupBookings]) => {
      groupBookings.sort((a, b) => new Date(a.bookingDates[0].startTime).getTime() - new Date(b.bookingDates[0].startTime).getTime());

      const first = groupBookings[0];
      const last = groupBookings[groupBookings.length - 1];
      const totalSum = groupBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

      result.push({
        ...first,
        isGroup: true,
        bookingId: recurringId,
        totalPrice: totalSum,
        bookingDates: [
          {
            startTime: first.bookingDates[0].startTime,
            endTime: last.bookingDates[0].endTime // Use last one's end time
          }
        ],
        groupBookings: groupBookings
      });
    });

    result.sort((a, b) => {
      const dateA = new Date(a.bookingDates[0].startTime).getTime();
      const dateB = new Date(b.bookingDates[0].startTime).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [filteredBookings, sortOrder, activeTab, reservations]);

  const filteredReservations = React.useMemo(() => {
    if (!searchTerm) return reservations;
    return reservations.filter(
      (reservation) =>
        reservation.reservationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof reservation.user === 'object' && reservation.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        reservation.walkInUserDetails?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [reservations, searchTerm]);

  const handleCreateBooking = async (formData: unknown, type: string) => {
    const data = formData as { paymentMethod?: string };
    Swal.fire({
      title: 'Creating Booking...',
      text: 'Please wait while we create the booking.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      let endpoint = '';
      if (type === 'recurring') {
        endpoint = '/bookings/recurring';
      } else if (type === 'walk-in') {
        endpoint = '/bookings/walk-in';
      } else if (type === 'reservation') {
        endpoint = '/reservations/walk-in';
      }
      const response = await api.post(endpoint, formData);

      if (data.paymentMethod === 'online' && type === 'recurring') {
        const recurringBookingId = response.data.data.recurringBookingId;
        await api.post(`/payments/initialize/recurring/${recurringBookingId}`);
      }

      Swal.fire({
        icon: 'success',
        title: type === 'reservation' ? 'Reservation Created!' : 'Booking Created!',
        text: `The ${type} has been successfully created.`,
      });
      if (selectedVenue) {
        if (type === 'reservation') {
          setActiveTab('reservations');
        } else {
          fetchBookings(selectedVenue, 1);
          setBookingsPage(1);
        }
      }
      closeBookingModal();
    } catch (error: unknown) {
      console.error('Failed to create booking:', error);
      const err = error as { response?: { data?: { message?: string } } };
      Swal.fire({
        icon: 'error',
        title: 'Booking Failed',
        text: err.response?.data?.message || 'An unexpected error occurred.',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-primary">Bookings</h1>
        {(user?.activeRole === "hall-owner" || user?.activeRole === "staff" || user?.role?.includes("hall-owner") || user?.role?.includes("staff")) && (
          <button
            onClick={() => openBookingModal()}
            className="w-full sm:w-auto bg-primary text-white px-6 py-2.5 rounded-lg font-semibold shadow-md hover:bg-primary-dark transition-colors"
          >
            Create Booking
          </button>
        )}
      </div>
      <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <label htmlFor="venue-select" className="block text-xs font-semibold text-gray-500 uppercase mb-2">Select a Venue</label>
        <select
          id="venue-select"
          value={selectedVenue}
          onChange={(e) => handleHallChange(e.target.value)}
          className="block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-lg text-gray-900"
        >
          <option value="">--Please choose a venue--</option>
          {venues.map((venue) => (
            <option key={venue._id} value={venue._id}>
              {venue.name}
            </option>
          ))}
        </select>
      </div>

      {activeTab === 'bookings' && (
        <div className="bg-gray-50 p-5 rounded-xl mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 border border-gray-200">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary py-2 text-gray-700"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Type</label>
            <select
              value={bookingTypeFilter}
              onChange={(e) => setBookingTypeFilter(e.target.value)}
              className="w-full border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary py-2 text-gray-700"
            >
              <option value="all">All Types</option>
              <option value="normal">Normal</option>
              <option value="recurring">Recurring</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary py-2 text-gray-700"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary py-2 text-gray-700"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary py-2 text-gray-700"
            >
              <option value="createdAt">Date Created</option>
              <option value="totalPrice">Price</option>
              <option value="status">Status</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary py-2 text-gray-700"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      )}

      <div className="relative group">
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            className={`px-6 py-3 text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'bookings' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => handleTabChange('bookings')}
          >
            Bookings
          </button>
          <button
            className={`px-6 py-3 text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'reservations' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => handleTabChange('reservations')}
          >
            Reservations
          </button>
          <button
            className={`px-6 py-3 text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'pending' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => handleTabChange('pending')}
          >
            Pending
          </button>
          <button
            className={`px-6 py-3 text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'cancellations' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => handleTabChange('cancellations')}
          >
            Cancellation Requests
            {pendingCancellationsCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white animate-pulse">
                {pendingCancellationsCount}
              </span>
            )}
          </button>
        </div>
        {/* Mobile Scroll Indicator Fade */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none sm:hidden" />
      </div>


      {error && (
        <ErrorState
          message={error}
          onRetry={handleRetry}
          className="bg-white rounded-xl shadow-sm border border-gray-50 py-20 mb-6"
        />
      )}

      {!error && (
        <div className="space-y-4">
          {loading ? (
          <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl shadow-sm border border-gray-50">
             <CustomLoader size={48} className="mb-4" />
             <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Fetching your {activeTab}...</p>
          </div>
        ) : (activeTab === 'bookings' || activeTab === 'cancellations' || activeTab === 'pending') ? (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block bg-white shadow-lg rounded-xl overflow-x-auto border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Booking ID</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Customer</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Event Date</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Booked On</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Payout</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groupedBookings.length > 0 ? groupedBookings.map((booking) => (
                    <React.Fragment key={booking._id}>
                      <tr onClick={() => setExpandedBookingId(expandedBookingId === booking._id ? null : booking._id)} className="cursor-pointer hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold text-gray-700">{booking.bookingId}</span>
                            <div className="flex flex-col gap-1">
                              {booking.isReservation && (
                                <span className="px-2 py-0.5 inline-flex text-[9px] font-bold rounded-full bg-orange-100 text-orange-800 uppercase">Reservation</span>
                              )}
                              {booking.isRecurring && (
                                <span className="px-2 py-0.5 inline-flex text-[9px] font-bold rounded-full bg-blue-100 text-blue-800 uppercase">Recurring</span>
                              )}
                              {booking.bookingType?.toLowerCase() === 'online' && (
                                <span className="px-2 py-0.5 inline-flex text-[9px] font-bold rounded-full bg-green-100 text-green-800 uppercase">Online</span>
                              )}
                              {booking.bookingType?.toLowerCase() === 'walk-in' && (
                                <span className="px-2 py-0.5 inline-flex text-[9px] font-bold rounded-full bg-purple-100 text-purple-800 uppercase">Walk-in</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {(typeof booking.user === 'object' && booking.user?.fullName) || booking.walkInUserDetails?.fullName}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {booking.isGroup ? (
                            <div>
                              <span>{new Date(booking.bookingDates[0].startTime).toLocaleDateString()}</span>
                              <span className="mx-1">-</span>
                              <span>{new Date(booking.bookingDates[0].endTime).toLocaleDateString()}</span>
                              <div className="text-[10px] text-blue-600 font-bold mt-0.5">({booking.groupBookings?.length} sessions)</div>
                            </div>
                          ) : (
                            <div>
                              <span className="block">{new Date(booking.bookingDates[0].startTime).toLocaleDateString()}</span>
                              <span className="text-xs text-gray-400">{new Date(booking.bookingDates[0].startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(booking.bookingDates[0].endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1.5">
                            <span className={`px-2.5 py-1 w-fit text-[10px] font-bold rounded-full uppercase tracking-wider ${
                                booking.status === "confirmed" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                booking.status === "pending" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                "bg-rose-50 text-rose-700 border border-rose-100"
                            }`}>
                              {booking.status}
                            </span>
                            {booking.paymentStatus && (
                              <span className={`px-2.5 py-1 w-fit text-[10px] font-bold rounded-full uppercase tracking-wider ${
                                booking.paymentStatus.toLowerCase() === 'paid' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {booking.paymentStatus}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {isOwnerBlocked(booking) ? (
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                              Blocked
                            </span>
                          ) : booking.bookingType?.toLowerCase() === 'walk-in' ? (
                            <span className="px-2 py-0.5 w-fit text-[9px] font-black rounded-full uppercase tracking-tight bg-purple-50 text-purple-700 border border-purple-100">
                              Offline Booking
                            </span>
                          ) : booking.payout ? (
                            <span className={`px-2 py-0.5 w-fit text-[9px] font-black rounded-full uppercase tracking-tight ${
                              booking.payout.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              booking.payout.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                              'bg-gray-50 text-gray-500 border border-gray-100'
                            }`}>
                              Payout: {booking.payout.status}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-bold uppercase">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end space-x-2">
                            {activeTab === 'pending' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPaymentId(booking.isGroup ? (booking.recurringBookingId || booking.bookingId) : booking.bookingId);
                                  setIsPaymentLinkModalOpen(true);
                                }}
                                className="text-xs font-bold text-primary hover:text-primary-dark bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-blue-100 flex items-center gap-1.5"
                              >
                                <Share2 size={14} />
                                Generate Link
                              </button>
                            )}
                            {activeTab === 'cancellations' ? (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConfirmCancellation(booking._id, booking.isReservation);
                                  }}
                                  className="text-xs font-bold text-green-600 hover:text-green-800 bg-green-50 px-3 py-1.5 rounded-lg transition-colors border border-green-100"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRejectCancellation(booking._id, booking.isReservation);
                                  }}
                                  className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-red-100"
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <>
                                {booking.status?.toLowerCase() !== 'cancelled' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDirectCancel(booking._id, booking.isReservation);
                                    }}
                                    className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-red-100"
                                  >
                                    Cancel
                                  </button>
                                )}
                                {booking.status?.toLowerCase() === 'cancelled' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openRefundModal(booking, booking.isReservation ? 'reservation' : 'booking');
                                    }}
                                    disabled={isRefundComplete(booking)}
                                    className="text-xs font-bold text-orange-600 hover:text-orange-800 bg-orange-50 px-3 py-1.5 rounded-lg transition-colors border border-orange-100 disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
                                  >
                                    Refund
                                  </button>
                                )}
                              </>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openRescheduleModal(booking, booking.isReservation ? 'reservation' : 'booking');
                              }}
                              disabled={hasBeenRefunded(booking)}
                              className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-blue-100 disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
                            >
                              Reschedule
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <ChevronDown size={18} className={`text-gray-400 transform transition-transform ${expandedBookingId === booking._id ? 'rotate-180' : ''}`} />
                        </td>
                      </tr>
                      {expandedBookingId === booking._id && (
                        <tr>
                          <td colSpan={8} className="px-6 py-8 bg-white border-t border-gray-100 shadow-inner">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                              {/* Left Column: Customer & Event Info */}
                              <div className="space-y-6">
                                <div>
                                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                                    Customer & Event Info
                                  </h4>
                                  <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                    <div className="flex flex-col">
                                      <span className="text-[10px] text-gray-400 font-bold uppercase">Customer</span>
                                      <span className="text-sm font-semibold text-gray-900">{(typeof booking.user === 'object' && booking.user?.fullName) || booking.walkInUserDetails?.fullName}</span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-[10px] text-gray-400 font-bold uppercase">Event Details</span>
                                      <span className="text-sm text-gray-700 italic">&quot;{booking.eventDetails || 'N/A'}&quot;</span>
                                    </div>
                                    {(typeof booking.user === 'object' && booking.user?.email || booking.walkInUserDetails?.email) && (
                                      <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">Contact Email</span>
                                        <span className="text-sm text-gray-700">{(typeof booking.user === 'object' ? booking.user?.email : booking.walkInUserDetails?.email) || 'N/A'}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {booking.selectedFacilities && booking.selectedFacilities.length > 0 && (
                                  <div>
                                    <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                                      Selected Facilities
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                      {booking.selectedFacilities.map((f, i) => (
                                        <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-100">
                                          {f.name} (x{f.quantity})
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Second Column: Financial Breakdown */}
                              <div>
                                <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                                  Financial Breakdown
                                </h4>
                                <div className="space-y-2 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                  <div className="flex justify-between items-center text-sm border-b border-gray-200 pb-2">
                                    <span className="text-gray-500 font-medium">Venue Price:</span>
                                    <span className="font-bold text-gray-900">₦{(booking.hallPrice || 0).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-sm border-b border-gray-200 pb-2">
                                    <span className="text-gray-500 font-medium">Facilities Price:</span>
                                    <span className="font-bold text-gray-900">₦{(booking.facilitiesPrice || 0).toLocaleString()}</span>
                                  </div>
                                  {(booking.discountAmount || 0) > 0 && (
                                    <div className="flex justify-between items-center text-sm text-green-600 border-b border-gray-200 pb-2">
                                      <span className="font-medium">Discount:</span>
                                      <span className="font-bold">-₦{booking.discountAmount?.toLocaleString()}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between items-center pt-2">
                                    <span className="text-gray-900 font-bold">Total Amount:</span>
                                    <span className="text-lg font-black text-primary">₦{(booking.totalPrice || 0).toLocaleString()}</span>
                                  </div>
                                  <div className="mt-4 pt-3 border-t border-gray-200">
                                    <div className="flex justify-between text-[10px] font-bold uppercase">
                                      <span className="text-gray-400 tracking-tight">Payment Method:</span>
                                      <span className="text-gray-700">{booking.paymentMethod}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Third Column: Payout Information */}
                              {!isOwnerBlocked(booking) && (
                                <div>
                                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                                    Payout Information
                                  </h4>
                                  {booking.bookingType?.toLowerCase() === 'walk-in' ? (
                                    <div className="flex flex-col items-center justify-center h-32 bg-purple-50 rounded-xl border-2 border-dashed border-purple-100 text-purple-700">
                                      <p className="text-[10px] font-bold uppercase tracking-widest">Offline Booking</p>
                                      <p className="text-[9px] text-purple-500 font-medium mt-1">Payment Handled Locally</p>
                                    </div>
                                  ) : booking.payout ? (
                                    <div className="space-y-4 bg-blue-50/30 p-4 rounded-xl border border-blue-100/50">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col">
                                          <span className="text-[10px] text-gray-400 font-bold uppercase">Payout Amount</span>
                                          <span className="text-lg font-black text-blue-900">₦{booking.payout.amount?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                          <span className="text-[10px] text-gray-400 font-bold uppercase">Status</span>
                                          <span className={`mt-1 px-2.5 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                                            booking.payout.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                          }`}>
                                            {booking.payout.status}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="space-y-2.5 pt-2">
                                        <div className="flex justify-between text-xs border-b border-blue-100/50 pb-2">
                                          <span className="text-gray-500 font-medium">Bank Name:</span>
                                          <span className="font-bold text-gray-800">{booking.payout.bankName || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between text-xs border-b border-blue-100/50 pb-2">
                                          <span className="text-gray-500 font-medium">Account No:</span>
                                          <span className="font-bold text-gray-800 tracking-wider">{booking.payout.accountNumber || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                          <span className="text-gray-500 font-medium font-mono text-[10px]">Payout Date:</span>
                                          <span className="font-bold text-gray-800">
                                            {booking.payout.payoutDate ? new Date(booking.payout.payoutDate).toLocaleDateString(undefined, {
                                              year: 'numeric', month: 'short', day: 'numeric'
                                            }) : 'Pending'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center h-32 bg-gray-50 rounded-xl border-2 border-dashed border-gray-100 text-gray-400">
                                      <p className="text-[10px] font-bold uppercase tracking-widest">No Payout Data</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Right Column: Schedule / Group Info */}
                              <div>
                                {booking.isGroup ? (
                                  <>
                                    <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                                      Recurring Schedule ({booking.groupBookings?.length})
                                    </h4>
                                    <div className="max-h-[180px] overflow-y-auto border border-gray-100 rounded-xl bg-gray-50/50 p-2 shadow-inner">
                                      <table className="min-w-full text-[10px]">
                                        <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-sm shadow-sm">
                                          <tr className="border-b border-gray-200">
                                            <th className="text-left py-2 px-2 text-gray-400 font-bold uppercase">ID</th>
                                            <th className="text-left py-2 px-2 text-gray-400 font-bold uppercase">Date</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                          {booking.groupBookings?.map((gb) => (
                                            <tr key={gb._id} className="hover:bg-white/50 transition-colors">
                                              <td className="py-2.5 px-2 font-mono text-gray-500">#{gb.bookingId}</td>
                                              <td className="py-2.5 px-2 text-gray-700 font-bold uppercase">
                                                {new Date(gb.bookingDates[0].startTime).toLocaleDateString()}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                                      Quick Timeline
                                    </h4>
                                    <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
                                      <div className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 ring-4 ring-green-50"></div>
                                        <div>
                                          <p className="text-[10px] text-gray-400 font-bold uppercase">Booking Start</p>
                                          <p className="text-sm font-bold text-gray-900">{new Date(booking.bookingDates[0].startTime).toLocaleString()}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 ring-4 ring-red-50"></div>
                                        <div>
                                          <p className="text-[10px] text-gray-400 font-bold uppercase">Booking End</p>
                                          <p className="text-sm font-bold text-gray-900">{new Date(booking.bookingDates[0].endTime).toLocaleString()}</p>
                                        </div>
                                      </div>
                                      <div className="pt-2 border-t border-gray-200">
                                        <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Created Date</p>
                                        <p className="text-xs text-gray-600">{new Date(booking.createdAt).toLocaleString()}</p>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center text-gray-500">
                        {selectedVenue ? (searchTerm ? `No bookings found matching "${searchTerm}"` : 'No bookings found for this venue.') : 'Please select a venue.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Booking Cards */}
            <div className="lg:hidden space-y-4">
              {groupedBookings.length > 0 ? groupedBookings.map((booking) => (
                <div key={booking._id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-mono text-[10px] font-bold text-gray-400 uppercase tracking-tight">#{booking.bookingId}</span>
                          {booking.isReservation && <span className="text-[8px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-full font-bold uppercase">Res</span>}
                          {booking.isRecurring && <span className="text-[8px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-bold uppercase">Rec</span>}
                        </div>
                        <h3 className="text-base font-bold text-gray-900">{(typeof booking.user === 'object' && booking.user?.fullName) || booking.walkInUserDetails?.fullName}</h3>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                          booking.status === "confirmed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {booking.status}
                        </span>
                        {booking.paymentStatus && (
                          <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full uppercase ${
                            booking.paymentStatus.toLowerCase() === 'paid' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.paymentStatus}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gray-50 p-2 rounded-lg">
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Event Date</p>
                        <p className="text-xs font-semibold text-gray-800">
                          {new Date(booking.bookingDates[0].startTime).toLocaleDateString()}
                          {booking.isGroup && <span className="text-blue-600 block text-[9px]">Series End: {new Date(booking.bookingDates[0].endTime).toLocaleDateString()}</span>}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-lg">
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Price</p>
                        <p className="text-xs font-bold text-gray-900">₦{booking.totalPrice?.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setExpandedBookingId(expandedBookingId === booking._id ? null : booking._id)}
                        className="flex-1 text-xs font-bold text-gray-600 bg-gray-100 py-2.5 rounded-lg"
                      >
                        {expandedBookingId === booking._id ? 'Hide Details' : 'View Details'}
                      </button>
                      <div className="flex space-x-2">
                        {activeTab === 'pending' && (
                          <button
                            onClick={() => {
                              setSelectedPaymentId(booking.isGroup ? (booking.recurringBookingId || booking.bookingId) : booking.bookingId);
                              setIsPaymentLinkModalOpen(true);
                            }}
                            className="p-2.5 text-primary bg-blue-50 rounded-lg border border-blue-100"
                            title="Generate Payment Link"
                          >
                            <Share2 size={18} />
                          </button>
                        )}
                        {activeTab === 'cancellations' ? (
                           <>
                             <button
                                onClick={() => handleConfirmCancellation(booking._id, booking.isReservation)}
                                className="p-2.5 text-green-600 bg-green-50 rounded-lg border border-green-100"
                             >
                               Confirm
                             </button>
                             <button
                                onClick={() => handleRejectCancellation(booking._id, booking.isReservation)}
                                className="p-2.5 text-red-600 bg-red-50 rounded-lg border border-red-100"
                             >
                               Reject
                             </button>
                           </>
                        ) : (
                          <>
                            {booking.status?.toLowerCase() !== 'cancelled' && (
                              <button
                                onClick={() => handleDirectCancel(booking._id, booking.isReservation)}
                                className="p-2.5 text-red-500 bg-red-50 rounded-lg border border-red-100"
                                title="Cancel"
                              >
                                <XCircle size={18} />
                              </button>
                            )}
                            {booking.status?.toLowerCase() === 'cancelled' && (
                              <button
                                onClick={() => openRefundModal(booking, booking.isReservation ? 'reservation' : 'booking')}
                                disabled={isRefundComplete(booking)}
                                className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
                              >
                                Refund
                              </button>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => openRescheduleModal(booking, booking.isReservation ? 'reservation' : 'booking')}
                          disabled={hasBeenRefunded(booking)}
                          className="p-2.5 text-blue-600 bg-blue-50 rounded-lg border border-blue-100 disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
                        >
                          Reschedule
                        </button>
                      </div>
                    </div>
                  </div>

                  {expandedBookingId === booking._id && (
                    <div className="bg-gray-50 px-4 py-6 border-t border-gray-100 space-y-6">
                      <div>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Financial Breakdown</p>
                        <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-2 text-xs">
                          <div className="flex justify-between"><span className="text-gray-400">Venue Price:</span> <span className="font-bold text-gray-900">₦{(booking.hallPrice || 0).toLocaleString()}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">Facilities:</span> <span className="font-bold text-gray-900">₦{(booking.facilitiesPrice || 0).toLocaleString()}</span></div>
                          {(booking.discountAmount || 0) > 0 && <div className="flex justify-between text-green-600"><span className="font-medium">Discount:</span> <span className="font-bold">-₦{booking.discountAmount?.toLocaleString()}</span></div>}
                          <div className="flex justify-between pt-2 border-t border-gray-100"><span className="text-gray-900 font-bold">Total:</span> <span className="text-sm font-black text-primary">₦{(booking.totalPrice || 0).toLocaleString()}</span></div>
                        </div>
                      </div>

                      {!isOwnerBlocked(booking) && (
                        <div>
                          <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Payout Status</p>
                          {booking.bookingType?.toLowerCase() === 'walk-in' ? (
                            <div className="py-4 text-center bg-purple-50 rounded-lg border border-dashed border-purple-100 text-[10px] text-purple-700 font-bold uppercase">Offline Booking</div>
                          ) : booking.payout ? (
                            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Amount:</span>
                                <span className="font-bold text-blue-900">₦{booking.payout.amount?.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Status:</span>
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                                  booking.payout.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {booking.payout.status}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Bank:</span>
                                <span className="font-medium text-gray-900">{booking.payout.bankName || 'N/A'}</span>
                              </div>
                              {booking.payout.payoutDate && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500 font-mono text-[10px]">Date:</span>
                                  <span className="font-medium text-gray-900">{new Date(booking.payout.payoutDate).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="py-4 text-center bg-white rounded-lg border border-dashed border-gray-200 text-[10px] text-gray-400 font-bold uppercase">No Payout Info</div>
                          )}
                        </div>
                      )}

                      <div>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Event Details</p>
                        <div className="space-y-1.5 text-xs text-gray-700">
                          <div className="flex justify-between"><span className="text-gray-400">Event:</span> <span className="font-medium text-right ml-4">{booking.eventDetails || 'N/A'}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">Payment:</span> <span className="text-right">{booking.paymentMethod}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">Email:</span> <span className="text-right truncate ml-4">{booking.walkInUserDetails?.email || 'N/A'}</span></div>
                        </div>
                      </div>

                      {booking.isGroup && (
                        <div>
                           <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Series Schedule ({booking.groupBookings?.length})</p>
                           <div className="bg-white rounded-lg border border-gray-200 max-h-40 overflow-y-auto">
                              {booking.groupBookings?.map((gb, i) => (
                                <div key={gb._id} className={`p-2 flex justify-between text-[10px] ${i !== 0 ? 'border-t border-gray-50' : ''}`}>
                                  <span className="font-mono text-gray-400">#{gb.bookingId}</span>
                                  <span className="font-semibold">{new Date(gb.bookingDates[0].startTime).toLocaleDateString()}</span>
                                </div>
                              ))}
                           </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )) : (
                <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200 text-gray-400 font-medium">
                  {selectedVenue ? "No bookings found." : "Select a venue above."}
                </div>
              )}
            </div>

            <Pagination
              currentPage={bookingsPage}
              totalPages={bookingsTotalPages}
              onPageChange={setBookingsPage}
            />
          </>
        ) : (
          <>
            {/* Desktop Reservations Table */}
            <div className="hidden lg:block bg-white shadow-lg rounded-xl overflow-x-auto border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Customer</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Event Date</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Booked On</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Payment</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReservations.length > 0 ? filteredReservations.map((reservation) => (
                    <tr key={reservation._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {(typeof reservation.user === 'object' && reservation.user?.fullName) || reservation.walkInUserDetails?.fullName}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="block">{new Date(reservation.bookingDates[0].startTime).toLocaleDateString()}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{new Date(reservation.bookingDates[0].startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(reservation.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                            reservation.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                        }`}>
                          {reservation.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-xs font-medium text-gray-600 uppercase tracking-tight">
                        {reservation.paymentStatus}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end items-center space-x-2">
                          {reservation.cancellationRequest?.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleConfirmCancellation(reservation._id, true)}
                                className="text-xs font-bold text-green-600 hover:text-green-800 bg-green-50 px-3 py-1.5 rounded-lg transition-colors border border-green-100"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => handleRejectCancellation(reservation._id, true)}
                                className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-red-100"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <>
                              {reservation.status === 'ACTIVE' && (
                                <button
                                  onClick={() => handleDirectCancel(reservation._id, true)}
                                  className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-red-100"
                                >
                                  Cancel
                                </button>
                              )}
                              {reservation.status.toLowerCase() === 'cancelled' && (
                                <button
                                  onClick={() => openRefundModal(reservation, 'reservation')}
                                  disabled={isRefundComplete(reservation)}
                                  className="text-xs font-bold text-orange-600 hover:text-orange-800 bg-orange-50 px-3 py-1.5 rounded-lg transition-colors border border-orange-100 disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
                                >
                                  Refund
                                </button>
                              )}
                            </>
                          )}
                          <button
                            onClick={() => openRescheduleModal(reservation, 'reservation')}
                            disabled={hasBeenRefunded(reservation)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-blue-100 disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
                          >
                            Reschedule
                          </button>
                          {reservation.status === 'ACTIVE' && (
                            <button
                              onClick={() => {
                                setSelectedReservationId(reservation.reservationId);
                                setIsConversionModalOpen(true);
                              }}
                              className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary-dark shadow-sm transition-all"
                            >
                              Convert
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center text-gray-500">
                         {selectedVenue ? "No reservations found." : "Select a venue."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Reservation Cards */}
            <div className="lg:hidden space-y-4">
              {filteredReservations.length > 0 ? filteredReservations.map((res) => (
                <div key={res._id} className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">#{res.reservationId}</span>
                      <h3 className="text-base font-bold text-gray-900">{(typeof res.user === 'object' && res.user?.fullName) || res.walkInUserDetails?.fullName}</h3>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                      res.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {res.status}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="text-xs text-gray-600">
                      <p className="font-semibold text-gray-800">{new Date(res.bookingDates[0].startTime).toLocaleDateString()}</p>
                      <p className="text-gray-400 font-medium">Payment: {res.paymentStatus}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {res.cancellationRequest?.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleConfirmCancellation(res._id, true)}
                            className="flex-1 py-2 text-xs font-bold text-green-600 bg-green-50 rounded-lg border border-green-100"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => handleRejectCancellation(res._id, true)}
                            className="flex-1 py-2 text-xs font-bold text-red-600 bg-red-50 rounded-lg border border-red-100"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <>
                          {res.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleDirectCancel(res._id, true)}
                              className="flex-1 py-2 text-xs font-bold text-red-500 bg-red-50 rounded-lg border border-red-100"
                            >
                              Cancel
                            </button>
                          )}
                          {res.status.toLowerCase() === 'cancelled' && (
                            <button
                              onClick={() => openRefundModal(res, 'reservation')}
                              disabled={isRefundComplete(res)}
                              className="flex-1 py-2 text-xs font-bold text-orange-600 bg-orange-50 rounded-lg border border-orange-100 disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
                            >
                              Refund
                            </button>
                          )}
                        </>
                      )}
                      <button
                        onClick={() => openRescheduleModal(res, 'reservation')}
                        disabled={hasBeenRefunded(res)}
                        className="flex-1 py-2 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg border border-blue-100 disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
                      >
                        Reschedule
                      </button>
                      {res.status === 'ACTIVE' && (
                        <button
                          onClick={() => {
                            setSelectedReservationId(res.reservationId);
                            setIsConversionModalOpen(true);
                          }}
                          className="flex-1 py-2 bg-primary text-white text-xs font-bold rounded-lg"
                        >
                          Convert
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200 text-gray-400 font-medium">
                  No reservations found.
                </div>
              )}
            </div>

            <Pagination
              currentPage={reservationsPage}
              totalPages={reservationsTotalPages}
              onPageChange={setReservationsPage}
            />
          </>
        )}
        </div>
      )}
      <BookingModal
        key={isBookingModalOpen ? 'open' : 'closed'}
        isOpen={isBookingModalOpen}
        onClose={() => closeBookingModal()}
        onSubmit={handleCreateBooking}
      />
      {selectedReservationId && (
        <ConversionModal
          isOpen={isConversionModalOpen}
          onClose={() => setIsConversionModalOpen(false)}
          reservationId={selectedReservationId}
          onSuccess={() => fetchReservations(selectedVenue, reservationsPage)}
        />
      )}
      <RescheduleModal
        isOpen={isRescheduleModalOpen}
        booking={selectedBookingToReschedule}
        type={rescheduleType}
        onClose={() => setIsRescheduleModalOpen(false)}
        onSuccess={() => {
          if (selectedVenue) {
            if (rescheduleType === 'reservation') fetchReservations(selectedVenue, reservationsPage);
            else fetchBookings(selectedVenue, bookingsPage);
          }
        }}
      />
      <RefundModal
        isOpen={isRefundModalOpen}
        item={selectedItemForRefund}
        type={refundType}
        onClose={() => setIsRefundModalOpen(false)}
        onSuccess={() => {
          if (selectedVenue) {
            if (refundType === 'reservation') fetchReservations(selectedVenue, reservationsPage);
            else fetchBookings(selectedVenue, bookingsPage);
          }
        }}
      />
      <PaymentLinkModal
        isOpen={isPaymentLinkModalOpen}
        onClose={() => setIsPaymentLinkModalOpen(false)}
        id={selectedPaymentId}
      />
    </div>
  );
};

const BookingsPageWithSuspense = () => (
  <Suspense fallback={
    <div className="flex items-center justify-center min-h-[400px]">
      <CustomLoader size={48} />
    </div>
  }>
    <BookingsPage />
  </Suspense>
);

export default BookingsPageWithSuspense;
