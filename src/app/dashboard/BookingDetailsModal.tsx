"use client";

import React from 'react';
import { X } from 'lucide-react';
import { Booking, Reservation } from '@/types';
import UnifiedReceipt from '@/components/shared/UnifiedReceipt';

interface BookingDetailsModalProps {
  booking: Booking | Reservation | null;
  onClose: () => void;
}

const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({ booking, onClose }) => {
  if (!booking) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 lg:p-8">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-4xl z-10 animate-in fade-in zoom-in duration-300">
        <button
          onClick={onClose}
          className="absolute -top-14 right-0 lg:-right-14 text-white hover:text-gray-300 transition-colors bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/20 shadow-xl"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="max-h-[85vh] overflow-y-auto rounded-[2.5rem] no-scrollbar shadow-2xl">
           <UnifiedReceipt data={booking} />
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsModal;
