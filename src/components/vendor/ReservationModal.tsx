
'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Calendar from '../Calendar';
import { format } from 'date-fns';
import api from '@/services/api';
import { useBookingAvailability } from '@/hooks/useBookingAvailability';
import { Hall } from '@/types';

const AvailabilityLegend = () => (
  <div className="mt-4 p-4 border border-gray-100 rounded-2xl bg-gray-50/50 w-full shadow-inner">
    <h3 className="font-bold text-[10px] uppercase tracking-widest mb-3 text-gray-400">Availability Legend</h3>
    <div className="flex flex-wrap gap-4">
      <div className="flex items-center">
        <span className="w-3.5 h-3.5 rounded-lg bg-[#fee2e2] mr-2 border border-red-200 shadow-sm"></span>
        <span className="text-[11px] font-bold text-gray-600 uppercase">Booked</span>
      </div>
      <div className="flex items-center">
        <span className="w-3.5 h-3.5 rounded-lg bg-[#fef3c7] mr-2 border border-[#B68945] border-dashed shadow-sm"></span>
        <span className="text-[11px] font-bold text-gray-600 uppercase">Partial</span>
      </div>
      <div className="flex items-center">
        <span className="w-3.5 h-3.5 rounded-lg bg-[#ecfdf5] mr-2 border border-emerald-200 shadow-sm"></span>
        <span className="text-[11px] font-bold text-gray-600 uppercase">Available</span>
      </div>
    </div>
  </div>
);

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reservationData: Record<string, unknown>) => void;
  hallId: string;
}

const ReservationModal: React.FC<ReservationModalProps> = ({ isOpen, onClose, onSubmit, hallId }) => {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [displayedMonth, setDisplayedMonth] = useState(new Date());
  const [hall, setHall] = useState<Hall | null>(null);

  const { getDateAvailability } = useBookingAvailability(hall, undefined, displayedMonth);

  useEffect(() => {
    if (isOpen && hallId) {
      const fetchHall = async () => {
        try {
          const response = await api.get(`/halls/${hallId}`);
          setHall(response.data.data);
        } catch (err) {
          console.error('Failed to fetch hall:', err);
        }
      };
      fetchHall();
    } else if (!isOpen) {
      // Reset state when modal is closed
      setSelectedDates([]);
      setDisplayedMonth(new Date());
    }
  }, [isOpen, hallId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDates.length === 0) {
      alert('Please select at least one date.');
      return;
    }

    const openingHour = hall?.openingHour || 0;
    const closingHour = hall?.closingHour || 24;

    const bookingDates = selectedDates.map((date) => {
      const start = new Date(date);
      start.setHours(openingHour, 0, 0, 0);
      const end = new Date(date);
      end.setHours(closingHour, 0, 0, 0);
      return {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      };
    });

    onSubmit({
      hallId,
      bookingDates,
      eventDetails: 'Owner Reservation (Blocked)',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md relative z-10 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2 rounded-xl transition-all cursor-pointer"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
        <div className="mb-8">
          <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">Block <span className="text-primary not-italic">Dates</span></h2>
          <p className="text-sm text-gray-500 font-medium">Temporarily unavailable for bookings.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">Select Dates to Block</label>
            <Calendar
              selectedDates={selectedDates}
              onChange={(dates) => setSelectedDates(dates || [])}
              displayedMonth={displayedMonth}
              onMonthChange={setDisplayedMonth}
              unavailableDates={[]}
              getDateAvailability={getDateAvailability}
            />
            <AvailabilityLegend />
          </div>
          {selectedDates.length > 0 && (
            <div className="text-sm text-gray-600">
              Selected: {selectedDates.map(d => format(d, 'MMM d')).join(', ')}
            </div>
          )}
          <div className="flex justify-end space-x-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md text-white bg-primary hover:bg-primary-dark transition-colors cursor-pointer"
            >
              Confirm Block
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReservationModal;
