
'use client';

import React, { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/services/api';
import { translateError } from '@/utils/errors';
import AdminBookingDetailsModal from '@/components/admin/AdminBookingDetailsModal';
import AdminBookingModal from '@/components/admin/AdminBookingModal';
import ConversionModal from '@/components/shared/ConversionModal';
import PaymentLinkModal from '@/components/shared/PaymentLinkModal';
import { Search, ChevronDown, Eye, Share2, CreditCard, User, List, RefreshCcw, FileText, Phone, Mail } from 'lucide-react';
import CustomLoader from '@/components/CustomLoader';
import Swal from "@/utils/sweetalert";
import { Booking, Venue, Reservation, UserProfile } from '@/types';

const ITEMS_PER_PAGE = 10;

type GroupedItem = Booking & {
  isGroup?: boolean;
  groupBookings?: Booking[];
  isReservation?: boolean;
};

const BookingsPage = () => {
  const searchParams = useSearchParams();
  const venueIdFromQuery = searchParams.get('hallId');
  const initialSearch = searchParams.get('search') || '';
  const [activeTab, setActiveTab] = useState('bookings');
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedVenue, setSelectedVenue] = useState(venueIdFromQuery || '');
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPaymentLinkModalOpen, setIsPaymentLinkModalOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState("");
  const [isConversionModalOpen, setIsConversionModalOpen] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const LIMIT = 10000; // Fetch all for local filtering/searching as per Super Admin pattern
      if (activeTab === 'bookings' || activeTab === 'cancellations') {
        let bookingsRes;
        if (selectedVenue) {
          bookingsRes = await api.get(`/halls/${selectedVenue}/bookings?limit=${LIMIT}`);
          const normalizedBookings = (bookingsRes.data.data.bookings || []).map((booking: Booking) => ({
            ...booking,
            venue: booking.hall,
          }));
          setAllBookings(normalizedBookings);
        } else {
          bookingsRes = await api.get(`/admin/bookings?limit=${LIMIT}`);
          setAllBookings(bookingsRes.data.data.bookings || []);
        }
      } else if (activeTab === 'reservations') {
        if (selectedVenue) {
          const reservationsRes = await api.get(`/reservations/halls/${selectedVenue}?limit=${LIMIT}`);
          setReservations(reservationsRes.data.data.reservations || []);
        } else {
          setReservations([]);
        }
      } else if (activeTab === 'pending') {
        let bookingsRes;
        if (selectedVenue) {
          bookingsRes = await api.get(`/halls/${selectedVenue}/bookings?paymentStatus=pending&limit=${LIMIT}`);
          const normalizedBookings = (bookingsRes.data.data.bookings || []).map((booking: Booking) => ({
            ...booking,
            venue: booking.hall,
          }));
          setAllBookings(normalizedBookings);

          const reservationsRes = await api.get(`/reservations/halls/${selectedVenue}?limit=${LIMIT}`);
          const allRes = reservationsRes.data.data.reservations || [];
          setReservations(allRes.filter((r: Reservation) =>
            r.paymentStatus?.toLowerCase() === 'pending' ||
            r.status?.toLowerCase() === 'pending'
          ));
        } else {
          bookingsRes = await api.get(`/admin/bookings?limit=${LIMIT}&paymentStatus=pending`);
          setAllBookings(bookingsRes.data.data.bookings || []);
          setReservations([]);
        }
      }

      if (activeTab === 'cancellations') {
        if (selectedVenue) {
          const reservationsRes = await api.get(`/reservations/halls/${selectedVenue}?limit=${LIMIT}`);
          setReservations(reservationsRes.data.data.reservations || []);
        } else {
          setReservations([]);
        }
      }
    } catch (err: unknown) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  }, [selectedVenue, activeTab]);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const hallsRes = await api.get('/halls');
        if (hallsRes.data && Array.isArray(hallsRes.data.data)) {
          setVenues(hallsRes.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch venues", err);
      }
    };
    fetchVenues();
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const filteredBookings = useMemo(() => {
    if (!searchTerm) return allBookings;
    return allBookings.filter(
      (booking) =>
        booking.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (booking.recurringBookingId && booking.recurringBookingId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (booking.eventDetails || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof booking.user === "object" && (booking.user as { fullName?: string })?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        booking.walkInUserDetails?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allBookings, searchTerm]);

  const filteredReservations = useMemo(() => {
    if (!searchTerm) return reservations;
    return reservations.filter(
      (reservation) =>
        reservation.reservationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof reservation.user === 'object' && (reservation.user as { fullName?: string })?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        reservation.walkInUserDetails?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [reservations, searchTerm]);

  const groupedBookings = useMemo(() => {
    const groups: Record<string, Booking[]> = {};
    const result: GroupedItem[] = [];

    const bookingsToGroup = activeTab === 'pending'
      ? filteredBookings.filter(b =>
          b.paymentStatus?.toLowerCase() === 'pending' ||
          (b.status || b.bookingStatus)?.toLowerCase() === 'pending'
        )
      : activeTab === 'cancellations'
        ? filteredBookings.filter(b => b.cancellationRequest?.status === 'pending')
        : filteredBookings;

    bookingsToGroup.forEach(booking => {
      if (booking.isRecurring && booking.recurringBookingId) {
        if (!groups[booking.recurringBookingId]) {
          groups[booking.recurringBookingId] = [];
        }
        groups[booking.recurringBookingId].push(booking);
      } else {
        result.push({ ...booking, isGroup: false });
      }
    });

    if (activeTab === 'pending') {
      reservations.forEach(r => {
        result.push({
          ...(r as unknown as Booking),
          isGroup: false,
          isReservation: true,
          bookingId: r.reservationId
        });
      });
    } else if (activeTab === 'cancellations') {
      reservations.filter(r => r.cancellationRequest?.status === 'pending').forEach(r => {
        result.push({
          ...(r as unknown as Booking),
          isGroup: false,
          isReservation: true,
          bookingId: r.reservationId
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
            endTime: last.bookingDates[0].endTime
          }
        ],
        groupBookings: groupBookings
      });
    });

    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return result;
  }, [filteredBookings, activeTab, reservations]);

  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return groupedBookings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [groupedBookings, currentPage]);

  const paginatedReservations = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReservations.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredReservations, currentPage]);

  // Handle local total pages
  const effectiveTotalPages = useMemo(() => {
    const dataToPaginate = (activeTab === 'reservations') ? filteredReservations : groupedBookings;
    return Math.max(1, Math.ceil(dataToPaginate.length / ITEMS_PER_PAGE));
  }, [activeTab, groupedBookings, filteredReservations]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= effectiveTotalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
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
        fetchAllData();
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
        fetchAllData();
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
        fetchAllData();
      } catch (err) {
        console.error('Failed to reject cancellation:', err);
        Swal.fire('Error', translateError(err), 'error');
      }
    }
  };

  const handleCloseModal = (refresh = false) => {
    setIsModalOpen(false);
    setSelectedBooking(null);
    if (refresh) {
      fetchAllData();
    }
  };

  const getHallName = (venue: string | Venue) => {
    const id = typeof venue === 'string' ? venue : venue._id || venue.id;
    return venues.find(h => h._id === id || h.id === id)?.name || 'N/A';
  };

  const handleCreateBooking = async (formData: Record<string, unknown>, type: string) => {
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
      if (type === 'reservation') {
        setActiveTab('reservations');
      }
      fetchAllData();
      setIsCreateModalOpen(false);
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
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Booking Management</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-primary-dark transition-all transform active:scale-95"
        >
          Create Booking
        </button>
      </div>

      <div className="bg-white p-8 shadow-xl rounded-3xl border border-gray-100">
        <div className="bg-gray-50 p-1.5 rounded-2xl inline-flex mb-8 border border-gray-100 overflow-x-auto no-scrollbar max-w-full">
          <button
            className={`px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-all rounded-xl whitespace-nowrap ${activeTab === 'bookings' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => setActiveTab('bookings')}
          >
            Bookings
          </button>
          <button
            className={`px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-all rounded-xl whitespace-nowrap ${activeTab === 'reservations' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => setActiveTab('reservations')}
          >
            Reservations
          </button>
          <button
            className={`px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-all rounded-xl whitespace-nowrap ${activeTab === 'pending' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending
          </button>
          <button
            className={`px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-all rounded-xl whitespace-nowrap ${activeTab === 'cancellations' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => setActiveTab('cancellations')}
          >
            Cancellations
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
             <CustomLoader size={48} className="mb-4" />
             <p className="text-gray-500 font-medium">Fetching platform data...</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-gray-50 p-4 rounded-xl">
              <div className="relative w-full md:w-1/2">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by ID, customer or event..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary w-full text-gray-900 bg-white"
                />
              </div>
              <div className="w-full md:w-1/3">
                <select
                  value={selectedVenue}
                  onChange={(e) => {
                    setSelectedVenue(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="block w-full p-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="">All Venues</option>
                  {venues.map((venue) => (
                    <option key={venue._id} value={venue._id}>{venue.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {(activeTab === 'bookings' || activeTab === 'pending' || activeTab === 'cancellations') ? (
              <>
            {/* Desktop Table */}
            <div className="hidden xl:block overflow-x-auto shadow-sm border border-gray-100 rounded-xl">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-4 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Booking</th>
                    <th className="py-4 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Venue</th>
                    <th className="py-4 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Event</th>
                    <th className="py-4 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Event Date</th>
                    <th className="py-4 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Booked On</th>
                    <th className="py-4 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                    <th className="py-4 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Amount</th>
                    <th className="py-4 px-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {paginatedBookings.length > 0 ? (
                    paginatedBookings.map((booking) => (
                      <React.Fragment key={booking._id}>
                        <tr onClick={() => setExpandedBookingId(expandedBookingId === booking._id ? null : booking._id)} className="cursor-pointer hover:bg-blue-50/30 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-1.5">
                              <span className="font-mono text-xs font-black text-gray-900 uppercase">#{booking.bookingId}</span>
                              {(booking as Booking & { isReservation?: boolean }).isReservation && (
                                <span className="px-2 py-0.5 w-fit text-[9px] font-black uppercase rounded-full bg-orange-100 text-orange-700">Reservation</span>
                              )}
                              {booking.isRecurring && (
                                <span className="px-2 py-0.5 w-fit text-[9px] font-black uppercase rounded-full bg-indigo-100 text-indigo-700">Recurring</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-700 font-medium">{getHallName(booking.hall)}</td>
                          <td className="py-4 px-4">
                            <div className="text-sm font-bold text-gray-900">{(booking.user as {fullName: string})?.fullName || booking.walkInUserDetails?.fullName}</div>
                            <div className="text-xs text-gray-400 line-clamp-1 italic">{booking.eventDetails || 'Private Event'}</div>
                          </td>
                          <td className="py-4 px-4">
                            {booking.isGroup ? (
                              <div className="text-xs font-medium text-gray-600">
                                <div>{new Date(booking.bookingDates[0].startTime).toLocaleDateString()}</div>
                                <div className="text-blue-600 font-bold">Series: {booking.groupBookings?.length} days</div>
                              </div>
                            ) : (
                              <div className="text-xs font-medium text-gray-600">
                                <div className="font-bold text-gray-900">{new Date(booking.bookingDates[0].startTime).toLocaleDateString()}</div>
                                <div>{new Date(booking.bookingDates[0].startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-xs font-medium text-gray-900">
                              {new Date(booking.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-1.5">
                              <span className={`px-2.5 py-1 w-fit text-[10px] font-black rounded-full uppercase tracking-tighter ${
                                (booking.status || booking.bookingStatus) === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                (booking.status || booking.bookingStatus) === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                'bg-rose-50 text-rose-700 border border-rose-100'
                              }`}>{booking.status || booking.bookingStatus}</span>
                              {booking.paymentStatus && (
                                <span className={`px-2.5 py-1 w-fit text-[10px] font-black rounded-full uppercase tracking-tighter ${
                                  booking.paymentStatus.toLowerCase() === 'paid' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-gray-50 text-gray-700 border border-gray-100'
                                }`}>
                                  {booking.paymentStatus}
                                </span>
                              )}
                              {booking.payout ? (
                                <span className={`px-2 py-0.5 w-fit text-[9px] font-black rounded-full uppercase tracking-tight ${
                                  booking.payout.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}>
                                  Payout: {booking.payout.status}
                                </span>
                              ) : booking.bookingType?.toLowerCase() === 'walk-in' ? (
                                <span className="px-2 py-0.5 w-fit text-[9px] font-black rounded-full uppercase tracking-tight bg-purple-50 text-purple-700 border border-purple-100">
                                  Offline Booking
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-400 font-bold uppercase">N/A</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm font-black text-gray-900 whitespace-nowrap">₦{booking.totalPrice?.toLocaleString()}</td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex justify-end items-center gap-2">
                              {activeTab === 'pending' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPaymentId(booking.isGroup ? (booking.recurringBookingId || booking.bookingId) : booking.bookingId);
                                    setIsPaymentLinkModalOpen(true);
                                  }}
                                  className="p-2 text-primary hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1.5 border border-blue-100 bg-white shadow-sm"
                                  title="Generate Payment Link"
                                >
                                  <Share2 size={16} />
                                  <span className="text-[10px] font-bold uppercase">Link</span>
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
                                booking.status?.toLowerCase() !== 'cancelled' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDirectCancel(booking._id, booking.isReservation);
                                    }}
                                    className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-red-100"
                                  >
                                    Cancel
                                  </button>
                                )
                              )}
                              <button onClick={(e) => { e.stopPropagation(); handleViewDetails(booking); }} className="p-2 text-primary hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center space-x-1">
                                <Eye size={16} />
                                <span className="text-xs font-bold uppercase">View</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedBookingId === booking._id && (
                          <tr>
                            <td colSpan={8} className="p-6 bg-gray-50 border-y border-gray-100">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {/* Column 1: Payment & Payout */}
                                <div className="space-y-6">
                                  <div>
                                    <h4 className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                                      <CreditCard size={14} /> Payment Information
                                    </h4>
                                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3 text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Method</span>
                                        <span className="font-bold text-gray-800">{booking.paymentMethod || 'Manual'}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Status</span>
                                        <span className="font-bold text-gray-800 uppercase">{booking.paymentStatus}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Origin</span>
                                        <span className="font-bold text-gray-800 capitalize">{booking.bookingType || 'Standard'}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {booking.payout ? (
                                    <div>
                                      <h4 className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                                        <RefreshCcw size={14} className="text-emerald-500" /> Payout Information
                                      </h4>
                                      <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 shadow-sm space-y-3 text-xs">
                                        <div className="flex justify-between border-b border-emerald-100/50 pb-2">
                                          <span className="text-emerald-700">Payout Amount</span>
                                          <span className="font-black text-emerald-900">₦{booking.payout.amount.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-emerald-700">Status</span>
                                          <span className={`font-black uppercase ${booking.payout.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {booking.payout.status}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-emerald-700">Date</span>
                                          <span className="font-bold text-emerald-800">{new Date(booking.payout.payoutDate).toLocaleDateString()}</span>
                                        </div>
                                        <div className="pt-2 space-y-2 border-t border-emerald-100/50">
                                          <div className="flex flex-col">
                                            <span className="text-[10px] text-emerald-600 uppercase font-bold">Bank Details</span>
                                            <span className="font-bold text-emerald-900">{booking.payout.bankName} - {booking.payout.accountNumber}</span>
                                            <span className="text-emerald-700 italic">{booking.payout.accountName}</span>
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-[10px] text-emerald-600 uppercase font-bold">Sub-Account</span>
                                            <span className="font-mono text-emerald-800">{booking.payout.subAccountCode}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ) : booking.bookingType?.toLowerCase() === 'walk-in' ? (
                                    <div>
                                      <h4 className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                                        <RefreshCcw size={14} className="text-purple-500" /> Payout Information
                                      </h4>
                                      <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 shadow-sm text-center">
                                        <p className="text-[10px] font-black text-purple-700 uppercase tracking-widest">Offline Booking</p>
                                        <p className="text-[9px] text-purple-500 font-medium mt-1">Payment Handled Locally</p>
                                      </div>
                                    </div>
                              ) : (
                                <div className="py-4 text-center bg-white rounded-lg border border-dashed border-gray-200 text-[10px] text-gray-400 font-bold uppercase">No Payout Info</div>
                              )}
                                </div>

                                {/* Column 2: Financials & Facilities */}
                                <div className="space-y-6">
                                  <div>
                                    <h4 className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                                      <FileText size={14} /> Financial Breakdown
                                    </h4>
                                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3 text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Original Price</span>
                                        <span className="font-medium text-gray-800">₦{(booking.originalPrice || booking.totalPrice || 0).toLocaleString()}</span>
                                      </div>
                                      {booking.hallPrice !== undefined && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">Venue Base Price</span>
                                          <span className="font-medium text-gray-800">₦{booking.hallPrice.toLocaleString()}</span>
                                        </div>
                                      )}
                                      {booking.facilitiesPrice !== undefined && booking.facilitiesPrice > 0 && (
                                        <div className="flex justify-between text-blue-600">
                                          <span className="font-medium">Facilities Total</span>
                                          <span className="font-bold">+ ₦{booking.facilitiesPrice.toLocaleString()}</span>
                                        </div>
                                      )}
                                      {booking.discountAmount ? (
                                        <div className="flex justify-between text-rose-600">
                                          <span className="font-medium">Discount ({booking.discountPercentage}%)</span>
                                          <span className="font-bold">- ₦{booking.discountAmount.toLocaleString()}</span>
                                        </div>
                                      ) : null}
                                      <div className="flex justify-between pt-2 border-t border-gray-100">
                                        <span className="font-black text-gray-900 uppercase">Total Charged</span>
                                        <span className="font-black text-gray-900">₦{booking.totalPrice?.toLocaleString()}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {booking.selectedFacilities && booking.selectedFacilities.length > 0 && (
                                    <div>
                                      <h4 className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                                        <List size={14} /> Selected Facilities
                                      </h4>
                                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-xs">
                                        <ul className="space-y-2">
                                          {booking.selectedFacilities.map((f, idx) => (
                                            <li key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                                              <span className="font-medium text-gray-800">{f.name} (x{f.quantity})</span>
                                              <span className="font-bold text-gray-900">₦{f.cost.toLocaleString()}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Column 3: Customer & Timeline */}
                                <div className="space-y-6">
                                  <div>
                                    <h4 className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                                      <User size={14} /> Customer Details
                                    </h4>
                                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4 text-xs">
                                      {typeof booking.user === 'object' && booking.user && (
                                        <>
                                          <div className="flex items-start gap-3">
                                            <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                              <User size={16} />
                                            </div>
                                            <div className="overflow-hidden">
                                              <p className="font-black text-gray-900 truncate">{(booking.user as UserProfile).fullName}</p>
                                              <p className="text-gray-500 uppercase text-[10px] font-bold">Registered User</p>
                                            </div>
                                          </div>
                                          <div className="space-y-2 pl-11">
                                            <div className="flex items-center gap-2 text-gray-600 overflow-hidden">
                                              <Mail size={12} className="shrink-0" />
                                              <span className="truncate">{(booking.user as UserProfile).email}</span>
                                            </div>
                                            {(booking.user as UserProfile).phone && (
                                              <div className="flex items-center gap-2 text-gray-600">
                                                <Phone size={12} className="shrink-0" />
                                                <span>{(booking.user as UserProfile).phone}</span>
                                              </div>
                                            )}
                                          </div>
                                        </>
                                      )}
                                      {booking.walkInUserDetails && (
                                        <div className="pt-4 border-t border-gray-100">
                                          <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Walk-in Details</p>
                                          <div className="space-y-1">
                                            <p className="font-bold text-gray-800">{booking.walkInUserDetails.fullName}</p>
                                            <p className="text-gray-600">{booking.walkInUserDetails.email}</p>
                                            <p className="text-gray-600">{booking.walkInUserDetails.phone}</p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {booking.refundDetails && booking.refundDetails.totalRefundedAmount > 0 && (
                                    <div>
                                      <h4 className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 text-rose-500">
                                        <RefreshCcw size={14} /> Refund History
                                      </h4>
                                      <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 shadow-sm text-xs space-y-3">
                                        <div className="flex justify-between items-center text-rose-700">
                                          <span className="font-bold">Total Refunded</span>
                                          <span className="font-black text-rose-900">₦{booking.refundDetails.totalRefundedAmount.toLocaleString()}</span>
                                        </div>
                                        <div className="max-h-32 overflow-y-auto space-y-2 pr-1">
                                          {booking.refundDetails.refundHistory.map((refund, idx) => (
                                            <div key={idx} className="bg-white p-2 rounded-lg border border-rose-100 text-[10px]">
                                              <div className="flex justify-between font-bold">
                                                <span>₦{refund.amount.toLocaleString()}</span>
                                                <span>{typeof refund.date === 'string' ? new Date(refund.date).toLocaleDateString() : 'N/A'}</span>
                                              </div>
                                              <p className="text-gray-500 mt-1 italic">&quot;{refund.note}&quot;</p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {booking.isGroup && (
                                    <div>
                                      <h4 className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                                        <List size={14} /> Recurring Timeline
                                      </h4>
                                      <div className="max-h-40 overflow-y-auto border rounded-xl bg-white p-3 shadow-inner">
                                        <table className="min-w-full text-xs">
                                          <tbody className="divide-y divide-gray-50">
                                            {booking.groupBookings?.map((gb) => (
                                              <tr key={gb._id}>
                                                <td className="py-2 font-mono text-gray-400">#{gb.bookingId}</td>
                                                <td className="py-2 text-right font-bold text-gray-700">
                                                  {new Date(gb.bookingDates[0].startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-20 text-center text-gray-400 font-medium italic">No matches found in platform archives.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards */}
            <div className="xl:hidden space-y-4">
               {paginatedBookings.length > 0 ? (
                 paginatedBookings.map((booking) => (
                   <div key={booking._id} className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
                   <div className="p-5 cursor-pointer" onClick={() => setExpandedBookingId(expandedBookingId === booking._id ? null : booking._id)}>
                         <div className="flex justify-between items-start mb-4">
                            <div>
                               <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono text-[10px] font-black text-gray-400 uppercase">#{booking.bookingId}</span>
                                  {booking.isRecurring && <span className="bg-indigo-50 text-indigo-700 text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase">Recurring</span>}
                               </div>
                               <h3 className="text-lg font-black text-gray-900 leading-tight">{(booking.user as {fullName: string})?.fullName || booking.walkInUserDetails?.fullName}</h3>
                               <p className="text-xs text-gray-400 font-medium line-clamp-1">{getHallName(booking.hall)}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`px-2 py-1 text-[9px] font-black rounded-full uppercase tracking-tighter ${
                                (booking.status || booking.bookingStatus) === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                                (booking.status || booking.bookingStatus) === 'pending' ? 'bg-amber-100 text-amber-700' :
                                'bg-rose-100 text-rose-700'
                              }`}>{booking.status || booking.bookingStatus}</span>
                              {booking.paymentStatus && (
                                <span className={`px-2 py-1 text-[8px] font-black rounded-full uppercase tracking-tighter ${
                                  booking.paymentStatus.toLowerCase() === 'paid' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {booking.paymentStatus}
                                </span>
                              )}
                              {booking.payout ? (
                                <span className={`px-2 py-1 text-[8px] font-black rounded-full uppercase tracking-tighter ${
                                  booking.payout.status === 'completed' ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-700 border border-amber-200'
                                }`}>
                                  Payout: {booking.payout.status}
                                </span>
                              ) : booking.bookingType?.toLowerCase() === 'walk-in' ? (
                                <span className="px-2 py-1 text-[8px] font-black rounded-full uppercase tracking-tighter bg-purple-100 text-purple-700 border border-purple-200">
                                  Offline Booking
                                </span>
                              ) : null}
                            </div>
                         </div>

                         <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50">
                            <div>
                               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Event Date</p>
                               <p className="text-xs font-bold text-gray-800">{new Date(booking.bookingDates[0].startTime).toLocaleDateString()}</p>
                               {booking.isGroup ? <p className="text-[10px] text-blue-600 font-bold">Series: {booking.groupBookings?.length} events</p> : <p className="text-[10px] text-gray-500">{new Date(booking.bookingDates[0].startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>}
                            </div>
                            <div>
                               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Financials</p>
                               <p className="text-sm font-black text-gray-900">₦{booking.totalPrice?.toLocaleString()}</p>
                               <p className="text-[10px] text-gray-500 uppercase font-bold">{booking.paymentStatus}</p>
                            </div>
                         </div>

                         <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-3">
                              <button onClick={(e) => { e.stopPropagation(); handleViewDetails(booking); }} className="text-xs font-bold uppercase text-primary tracking-widest hover:underline flex items-center">
                                <Eye size={14} className="mr-1.5" /> Platform Details
                              </button>
                              {activeTab === 'pending' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPaymentId(booking.isGroup ? (booking.recurringBookingId || booking.bookingId) : booking.bookingId);
                                    setIsPaymentLinkModalOpen(true);
                                  }}
                                  className="text-xs font-bold uppercase text-primary tracking-widest hover:underline flex items-center"
                                >
                                  <Share2 size={14} className="mr-1.5" /> Share Link
                                </button>
                              )}
                              {activeTab === 'cancellations' ? (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleConfirmCancellation(booking._id, booking.isReservation);
                                    }}
                                    className="text-xs font-bold uppercase text-green-600 tracking-widest hover:underline"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRejectCancellation(booking._id, booking.isReservation);
                                    }}
                                    className="text-xs font-bold uppercase text-red-600 tracking-widest hover:underline"
                                  >
                                    Reject
                                  </button>
                                </>
                              ) : (
                                booking.status?.toLowerCase() !== 'cancelled' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDirectCancel(booking._id, booking.isReservation);
                                    }}
                                    className="text-xs font-bold uppercase text-red-500 tracking-widest hover:underline"
                                  >
                                    Cancel
                                  </button>
                                )
                              )}
                            </div>
                            <ChevronDown size={16} className={`text-gray-300 transition-transform ${expandedBookingId === booking._id ? 'rotate-180' : ''}`} />
                         </div>
                      </div>

                      {expandedBookingId === booking._id && (
                        <div className="bg-gray-50/50 p-5 border-t border-gray-50 space-y-6">
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Event Scope</p>
                              <p className="text-xs text-gray-700 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">{booking.eventDetails || 'Generic Venue Booking'}</p>
                            </div>

                            {/* Mobile Payout */}
                            {booking.payout ? (
                              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 shadow-sm space-y-3">
                                <h4 className="flex items-center gap-2 text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                                  <RefreshCcw size={14} /> Payout Information
                                </h4>
                                <div className="space-y-2 text-[11px]">
                                  <div className="flex justify-between font-black text-emerald-900">
                                    <span>Amount</span>
                                    <span>₦{booking.payout.amount.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-emerald-700">Status</span>
                                    <span className={`uppercase font-black ${booking.payout.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                      {booking.payout.status}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-emerald-700">
                                    <span>Date</span>
                                    <span className="font-bold text-emerald-800">{new Date(booking.payout.payoutDate).toLocaleDateString()}</span>
                                  </div>
                                  <div className="pt-2 border-t border-emerald-100/50 text-emerald-800">
                                    <p className="font-bold">{booking.payout.bankName} - {booking.payout.accountNumber}</p>
                                    <p className="italic opacity-80">{booking.payout.accountName}</p>
                                  </div>
                                </div>
                              </div>
                            ) : booking.bookingType?.toLowerCase() === 'walk-in' ? (
                              <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 shadow-sm space-y-2">
                                <h4 className="flex items-center gap-2 text-[10px] font-black text-purple-700 uppercase tracking-widest">
                                  <RefreshCcw size={14} /> Payout Information
                                </h4>
                                <div className="text-center">
                                  <p className="text-[10px] font-black text-purple-700 uppercase tracking-widest">Offline Booking</p>
                                  <p className="text-[9px] text-purple-500 font-medium mt-1">Payment Handled Locally</p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-32 bg-gray-50 rounded-xl border-2 border-dashed border-gray-100 text-gray-400">
                                <p className="text-[10px] font-bold uppercase tracking-widest">No Payout Data</p>
                              </div>
                            )}

                            {/* Mobile Financials */}
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                              <h4 className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <FileText size={14} /> Financial Breakdown
                              </h4>
                              <div className="space-y-2 text-[11px]">
                                <div className="flex justify-between text-gray-500">
                                  <span>Base Price</span>
                                  <span>₦{(booking.hallPrice || booking.originalPrice || booking.totalPrice || 0).toLocaleString()}</span>
                                </div>
                                {booking.facilitiesPrice !== undefined && booking.facilitiesPrice > 0 && (
                                  <div className="flex justify-between text-blue-600">
                                    <span>Facilities</span>
                                    <span>+ ₦{booking.facilitiesPrice.toLocaleString()}</span>
                                  </div>
                                )}
                                {booking.discountAmount ? (
                                  <div className="flex justify-between text-rose-600">
                                    <span>Discount ({booking.discountPercentage}%)</span>
                                    <span>- ₦{booking.discountAmount.toLocaleString()}</span>
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            {/* Mobile Contact */}
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                              <h4 className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <User size={14} /> Contact Details
                              </h4>
                              <div className="text-[11px] space-y-2">
                                {typeof booking.user === 'object' && booking.user && (
                                  <>
                                    <div className="flex items-center gap-2 text-gray-800 font-bold">
                                      <Mail size={12} className="text-gray-400" />
                                      <span className="truncate">{(booking.user as UserProfile).email}</span>
                                    </div>
                                    {(booking.user as UserProfile).phone && (
                                      <div className="flex items-center gap-2 text-gray-800 font-bold">
                                        <Phone size={12} className="text-gray-400" />
                                        <span>{(booking.user as UserProfile).phone}</span>
                                      </div>
                                    )}
                                  </>
                                )}
                                {booking.walkInUserDetails && (
                                  <div className="pt-2 border-t border-gray-50 text-gray-600">
                                    <p className="font-bold text-gray-800">{booking.walkInUserDetails.fullName}</p>
                                    <p>{booking.walkInUserDetails.phone}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {booking.isGroup && (
                              <div>
                                 <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Occurrence History</p>
                                 <div className="bg-white rounded-xl border border-gray-100 p-2 space-y-1.5 max-h-32 overflow-y-auto shadow-inner">
                                    {booking.groupBookings?.map(gb => (
                                      <div key={gb._id} className="flex justify-between items-center text-[10px] p-1.5 hover:bg-gray-50 rounded">
                                         <span className="font-mono font-bold text-gray-400">#{gb.bookingId}</span>
                                         <span className="font-black text-gray-800">{new Date(gb.bookingDates[0].startTime).toLocaleDateString()}</span>
                                      </div>
                                    ))}
                                 </div>
                              </div>
                            )}
                        </div>
                      )}
                   </div>
                 ))
               ) : (
                 <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                    <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">No matching records</p>
                 </div>
               )}
            </div>

              </>
            ) : (
              <div className="space-y-4">
                 <div className="hidden xl:block overflow-x-auto shadow-sm border border-gray-100 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="py-4 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Reservation</th>
                          <th className="py-4 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Venue</th>
                          <th className="py-4 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Customer</th>
                          <th className="py-4 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Event Date</th>
                          <th className="py-4 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Booked On</th>
                          <th className="py-4 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                          <th className="py-4 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Amount</th>
                          <th className="py-4 px-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {paginatedReservations.length > 0 ? (
                          paginatedReservations.map((reservation) => (
                            <tr key={reservation._id} className="hover:bg-blue-50/30 transition-colors">
                              <td className="py-4 px-4">
                                <span className="font-mono text-xs font-black text-gray-900 uppercase">#{reservation.reservationId}</span>
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-700 font-medium">{getHallName(reservation.hall)}</td>
                              <td className="py-4 px-4">
                                <div className="text-sm font-bold text-gray-900">{(reservation.user as {fullName: string})?.fullName || reservation.walkInUserDetails?.fullName}</div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-xs font-medium text-gray-600">
                                   <div className="font-bold text-gray-900">{new Date(reservation.bookingDates[0].startTime).toLocaleDateString()}</div>
                                   <div>{new Date(reservation.bookingDates[0].startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-xs font-medium text-gray-900">
                                  {new Date(reservation.createdAt).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                 <span className={`px-2.5 py-1 text-[10px] font-black rounded-full uppercase tracking-tighter ${
                                   reservation.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                   reservation.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                   'bg-rose-50 text-rose-700 border border-rose-100'
                                 }`}>{reservation.status}</span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{reservation.paymentStatus}</div>
                                <div className="text-xs font-bold text-gray-900 whitespace-nowrap">₦{reservation.paidAmount?.toLocaleString() || 0}</div>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <div className="flex justify-end items-center gap-2">
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
                                      {reservation.status === 'ACTIVE' && (
                                        <button
                                          onClick={() => { setSelectedReservationId(reservation.reservationId); setIsConversionModalOpen(true); }}
                                          className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-4 py-2 rounded-lg hover:bg-emerald-100 transition-all uppercase border border-emerald-100"
                                        >
                                          Convert
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="py-20 text-center text-gray-400 font-medium italic">
                               {!selectedVenue ? 'Please select a venue to view reservations.' : 'No active reservations found for this match.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                 </div>

                 {/* Mobile Reservations */}
                 <div className="xl:hidden space-y-4">
                    {paginatedReservations.length > 0 ? (
                       paginatedReservations.map(res => (
                         <div key={res._id} className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
                            <div className="p-5">
                               <div className="flex justify-between items-start mb-4">
                                  <div>
                                     <span className="font-mono text-[10px] font-black text-gray-400 uppercase">#{res.reservationId}</span>
                                     <h3 className="text-lg font-black text-gray-900 leading-tight">{(res.user as {fullName: string})?.fullName || res.walkInUserDetails?.fullName}</h3>
                                     <p className="text-xs text-gray-400 font-medium line-clamp-1">{getHallName(res.hall)}</p>
                                  </div>
                                  <span className={`px-2 py-1 text-[9px] font-black rounded-full uppercase tracking-tighter ${
                                    res.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                                    res.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                    'bg-rose-100 text-rose-700'
                                  }`}>{res.status}</span>
                               </div>

                               <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50">
                                  <div>
                                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Event Date</p>
                                     <p className="text-xs font-bold text-gray-800">{new Date(res.bookingDates[0].startTime).toLocaleDateString()}</p>
                                     <p className="text-[10px] text-gray-500">{new Date(res.bookingDates[0].startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                  </div>
                                  <div>
                                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Financials</p>
                                     <p className="text-sm font-black text-gray-900">₦{res.paidAmount?.toLocaleString() || 0}</p>
                                     <p className="text-[10px] text-gray-500 uppercase font-bold">{res.paymentStatus}</p>
                                  </div>
                               </div>

                               <div className="flex items-center justify-end mt-4 gap-3">
                                 {res.cancellationRequest?.status === 'pending' ? (
                                    <>
                                      <button
                                        onClick={() => handleConfirmCancellation(res._id, true)}
                                        className="text-xs font-bold uppercase text-green-600 tracking-widest hover:underline"
                                      >
                                        Confirm
                                      </button>
                                      <button
                                        onClick={() => handleRejectCancellation(res._id, true)}
                                        className="text-xs font-bold uppercase text-red-600 tracking-widest hover:underline"
                                      >
                                        Reject
                                      </button>
                                    </>
                                 ) : (
                                   <>
                                     {res.status === 'ACTIVE' && (
                                        <button
                                          onClick={() => handleDirectCancel(res._id, true)}
                                          className="text-xs font-bold uppercase text-red-500 tracking-widest hover:underline"
                                        >
                                          Cancel
                                        </button>
                                      )}
                                     {res.status === 'ACTIVE' && (
                                        <button
                                          onClick={() => { setSelectedReservationId(res.reservationId); setIsConversionModalOpen(true); }}
                                          className="bg-primary text-white text-[10px] font-black px-5 py-2.5 rounded-xl uppercase tracking-widest active:scale-95 transition-all shadow-sm shadow-blue-200"
                                        >
                                          Convert
                                        </button>
                                      )}
                                   </>
                                 )}
                               </div>
                            </div>
                         </div>
                       ))
                    ) : (
                      <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                         <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">
                            {!selectedVenue ? 'Select a venue above' : 'No reservations found'}
                         </p>
                      </div>
                    )}
                 </div>
              </div>
            )}

            <div className="mt-8 flex justify-between items-center bg-gray-50 p-4 rounded-xl">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-5 py-2.5 bg-white text-gray-700 font-bold text-sm rounded-xl shadow-sm border border-gray-200 disabled:opacity-50 transition-all hover:bg-gray-50">
                Previous
              </button>
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Page {currentPage} / {effectiveTotalPages}</span>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === effectiveTotalPages} className="px-5 py-2.5 bg-white text-gray-700 font-bold text-sm rounded-xl shadow-sm border border-gray-200 disabled:opacity-50 transition-all hover:bg-gray-50">
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {isModalOpen && selectedBooking && (
        <AdminBookingDetailsModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            booking={selectedBooking}
            venues={venues}
        />
      )}
      <AdminBookingModal
        key={isCreateModalOpen ? 'open' : 'closed'}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateBooking}
      />
      {selectedReservationId && (
        <ConversionModal
          isOpen={isConversionModalOpen}
          onClose={() => setIsConversionModalOpen(false)}
          reservationId={selectedReservationId}
          onSuccess={fetchAllData}
        />
      )}
      <PaymentLinkModal
        isOpen={isPaymentLinkModalOpen}
        onClose={() => setIsPaymentLinkModalOpen(false)}
        id={selectedPaymentId}
      />
    </div>
  );
};

const BookingsPageWithSuspense = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <BookingsPage />
  </Suspense>
);

export default BookingsPageWithSuspense;
