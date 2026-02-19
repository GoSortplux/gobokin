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
      <h2 className="text-2xl lg:text-3xl font-bold mb-6 text-gray-800">My Reservations</h2>
      {reservations.length === 0 ? (
        <p className="text-gray-500">You have no reservations.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
