"use client";
import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { translateError } from '@/utils/errors';
import ReservationCard from "@/app/dashboard/ReservationCard";
import BookingDetailsModal from "@/app/dashboard/BookingDetailsModal";
import Swal from "@/utils/sweetalert";
import { Booking, Reservation } from '@/types';

const ReservationsList = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchReservations = async () => {
    try {
      const response = await api.get('/reservations/my-reservations');
      const reservationsData = response.data.data.reservations || [];

      // Fetch venue details for each reservation
      const reservationsWithHallDetails = await Promise.all(
        (Array.isArray(reservationsData) ? reservationsData : []).map(async (reservation: Reservation) => {
          if (typeof reservation.hall === 'string') {
            try {
              const hallResponse = await api.get(`/halls/${reservation.hall}`);
              reservation.hall = hallResponse.data.data;
            } catch (hallError) {
              console.error(`Failed to fetch venue details for reservation ${reservation._id}`, hallError);
              // Keep the venue as an ID string if fetching fails
            }
          }
          return reservation;
        })
      );
      setReservations(reservationsWithHallDetails);
    } catch (err) {
      setError(translateError(err));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const [, setPaymentLoading] = useState<string | null>(null);

  const handleCompleteBooking = async (reservation: Reservation) => {
    setPaymentLoading(reservation.reservationId);
    try {
      const response = await api.post(`/reservations/${reservation.reservationId}/convert`);

      // Save the original reservation data to localStorage before redirecting
      localStorage.setItem('bookingConfirmation', JSON.stringify(reservation));

      const checkoutUrl = response.data.data.checkoutUrl;
      if (checkoutUrl) {
        Swal.close();
        window.location.href = `${checkoutUrl}?type=conversion`;
      } else {
        setError("We couldn't get the payment link. Please try again.");
      }
    } catch (err) {
      setError(translateError(err));
      console.error(err);
    } finally {
      setPaymentLoading(null);
    }
  };

  if (loading) {
    return <p>Loading reservations...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  const handleViewReceipt = async (reservationId: string) => {
    try {
      const response = await api.get(`/bookings/search/${reservationId}`);
      if (response.data.data) {
        const bookingData = { ...response.data.data, bookingId: response.data.data.reservationId };
        setSelectedReservation(bookingData);
        setIsModalOpen(true);
      } else {
        Swal.fire("Not Found", "Reservation details could not be found.", "error");
      }
    } catch (error) {
      console.error("Error fetching reservation details:", error);
      Swal.fire("Error", "Failed to fetch reservation details.", "error");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReservation(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">My Reservations</h2>
        <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500 font-medium bg-gray-100/50 px-4 py-2 rounded-full border border-gray-100">
           <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
           {reservations.length} Active Reservations
        </div>
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>
          </div>
          <p className="text-gray-900 font-bold text-xl">No reservations found</p>
          <p className="text-gray-500 mt-1">When you make a reservation, it will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reservations.map((reservation) => (
            <ReservationCard
              key={reservation._id}
              reservation={reservation}
              onCompleteBooking={handleCompleteBooking}
              onViewReceipt={handleViewReceipt}
              onRefresh={fetchReservations}
            />
          ))}
        </div>
      )}
      {isModalOpen && (
        <BookingDetailsModal
          booking={selectedReservation}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default ReservationsList;
