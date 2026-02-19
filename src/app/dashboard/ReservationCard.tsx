
"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Reservation, Venue } from "@/types";
import api from "@/services/api";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";

interface ReservationCardProps {
  reservation: Reservation;
  onCompleteBooking: (reservation: Reservation) => void;
  onViewReceipt: (id: string) => void;
  onRefresh?: () => void;
}

const ReservationCard: React.FC<ReservationCardProps> = ({ reservation, onCompleteBooking, onViewReceipt, onRefresh }) => {
  const router = useRouter();
  const venue = typeof reservation.hall === "object" ? (reservation.hall as Venue) : null;
  const hallName = venue ? venue.name : "Venue details unavailable";

  const handleRequestCancellation = async () => {
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
        await api.patch(`/reservations/${reservation._id}/request-cancellation`, { reason });
        Swal.fire('Requested!', 'Your cancellation request has been sent.', 'success');
        if (onRefresh) onRefresh();
      } catch (error) {
        console.error('Failed to request cancellation:', error);
        Swal.fire('Error', translateError(error), 'error');
      }
    }
  };

  const handleWithdrawCancellation = async () => {
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
        await api.patch(`/reservations/${reservation._id}/withdraw-cancellation`);
        Swal.fire('Withdrawn!', 'Your cancellation request has been withdrawn.', 'success');
        if (onRefresh) onRefresh();
      } catch (error) {
        console.error('Failed to withdraw cancellation:', error);
        Swal.fire('Error', translateError(error), 'error');
      }
    }
  };

  const cancellationStatus = reservation.cancellationRequest?.status || 'not-requested';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800">
          {hallName}
        </h3>
        <p className="text-gray-600 mt-2">Reservation ID: {reservation.reservationId}</p>
        <p className="text-gray-600">
          Date:{" "}
          {reservation.bookingDates?.[0]?.startTime
            ? new Date(reservation.bookingDates[0].startTime).toLocaleDateString()
            : "N/A"}
        </p>
        <p className="text-sm text-gray-500">
          Status:{" "}
          <span
            className={`font-semibold ${
              reservation.status === "ACTIVE"
                ? "text-green-600"
                : reservation.status === "CONVERTED"
                ? "text-blue-600"
                : "text-red-600"
            }`}
          >
            {reservation.status === "CONVERTED" ? "Fully Paid" : reservation.status}
          </span>
        </p>
        <p className="text-md font-semibold text-gray-900 mt-2">
          Price: ₦{reservation.totalPrice.toLocaleString()}
        </p>
        <div className="mt-4 flex flex-col space-y-2">
          <div className="flex justify-end space-x-2">
            {reservation.status === "ACTIVE" && (
              <button
                onClick={() => onCompleteBooking(reservation)}
                disabled={!venue}
                className={`px-4 py-2 rounded-md transition-colors flex-1 ${
                  !venue
                    ? "bg-primary/50 text-white cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary-dark"
                }`}
              >
                Complete Booking
              </button>
            )}
            <button
              onClick={() => {
                if (reservation.paymentStatus === 'pending') {
                  router.push(`/booking/details/${reservation.reservationId}`);
                } else {
                  onViewReceipt(reservation.reservationId);
                }
              }}
              disabled={!venue}
              className={`px-4 py-2 rounded-md transition-colors flex-1 ${
                !venue
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              {reservation.paymentStatus === 'pending' ? 'View Details' : 'View Receipt'}
            </button>
          </div>

          {reservation.status === 'ACTIVE' && (
            <div className="w-full">
              {cancellationStatus === 'not-requested' ? (
                <button
                  onClick={handleRequestCancellation}
                  className="w-full py-2 px-4 bg-red-50 text-red-600 font-semibold rounded-md hover:bg-red-100 transition-colors duration-300 text-sm"
                >
                  Request Cancellation
                </button>
              ) : cancellationStatus === 'pending' ? (
                <button
                  onClick={handleWithdrawCancellation}
                  className="w-full py-2 px-4 bg-yellow-50 text-yellow-700 font-semibold rounded-md hover:bg-yellow-100 transition-colors duration-300 text-sm"
                >
                  Withdraw Cancellation Request
                </button>
              ) : (
                <div className={`w-full py-2 px-4 rounded-md text-sm font-semibold text-center ${
                  cancellationStatus === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  Cancellation {cancellationStatus.charAt(0).toUpperCase() + cancellationStatus.slice(1)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReservationCard;
