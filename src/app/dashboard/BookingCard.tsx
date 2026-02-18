"use client";
import React from "react";
import { Booking, Hall } from "@/types";
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
  const [completingPayment, setCompletingPayment] = React.useState(false);
  const hall = typeof booking.hall === 'object' ? (booking.hall as Hall) : null;
  const hallName = hall ? hall.name : "Hall details unavailable";

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

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300">
        <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800">
          {hallName}
        </h3>
        <p className="text-gray-600 mt-2">Booking ID: {booking.bookingId}</p>
        <p className="text-gray-600">
          Date:{" "}
          {booking.bookingDates?.[0]?.startTime
            ? new Date(booking.bookingDates[0].startTime).toLocaleDateString()
            : "N/A"}
        </p>
        <div className="mt-4 flex flex-col space-y-2">
          <div className="flex justify-end space-x-2">
            {isPast && (
              <button
                onClick={() => onReview(booking)}
                disabled={!hall}
                className={`py-2 px-4 rounded-md transition-colors duration-300 text-center flex-1 ${
                  !hall
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-opacity-90"
                }`}
              >
                {booking.review ? "View Review" : "Review Hall"}
              </button>
            )}
            {!isPast && booking.paymentStatus === "pending" && booking.status !== "cancelled" && (
              <button
                onClick={handleCompletePayment}
                disabled={!hall}
                className={`py-2 px-4 rounded-md transition-colors duration-300 text-center flex-1 ${
                  !hall
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-opacity-90"
                }`}
              >
                Complete Payment
              </button>
            )}
            <button
              onClick={() => onViewReceipt(booking.bookingId)}
              disabled={!hall}
              className={`py-2 px-4 rounded-md transition-colors duration-300 text-center flex-1 ${
                !hall
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              View Receipt
            </button>
          </div>

          {!isPast && booking.status !== 'cancelled' && booking.paymentStatus !== 'pending' && (
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

export default BookingCard;
