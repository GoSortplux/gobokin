'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '@/services/api';
import { translateError } from '@/utils/errors';
import Swal from "@/utils/sweetalert";
import Calendar from '../Calendar';
import { format } from 'date-fns';
import { useBookingAvailability } from '@/hooks/useBookingAvailability';
import { Hall, Booking, Reservation } from '@/types';

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

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | Reservation | null;
  onSuccess: () => void;
  type?: 'booking' | 'reservation';
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({ isOpen, onClose, booking, onSuccess, type }) => {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [eventDetails, setEventDetails] = useState('');
  const [displayedMonth, setDisplayedMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hall, setHall] = useState<Hall | null>(null);

  const { getDateAvailability, disabledHours } = useBookingAvailability(hall, selectedDates, displayedMonth);

  const generateTimeOptions = (openingHour: number, closingHour: number, disabled: number[]) => {
    const options = [];
    for (let i = openingHour; i <= closingHour; i++) {
      const time = `${i.toString().padStart(2, '0')}:00`;
      const isDisabled = disabled.includes(i);
      options.push(
        <option
          key={time}
          value={time}
          disabled={isDisabled}
          className={isDisabled ? 'text-gray-400' : ''}
          title={isDisabled ? 'Not Available/Booked' : 'Available'}
        >
          {time}
        </option>
      );
    }
    return options;
  };

  useEffect(() => {
    if (isOpen && booking) {
      // Initialize with existing data
      const firstDate = new Date(booking.bookingDates[0].startTime);
      setSelectedDates(booking.bookingDates.map(d => new Date(d.startTime)));
      setStartTime(format(firstDate, 'HH:mm'));
      setEndTime(format(new Date(booking.bookingDates[0].endTime), 'HH:mm'));
      setEventDetails((booking as Booking).eventDetails || '');
      setDisplayedMonth(firstDate);
      setError('');

      const fetchHall = async () => {
        try {
          const hallId = typeof booking.hall === 'string' ? booking.hall : booking.hall?._id;
          if (hallId) {
            const response = await api.get(`/halls/${hallId}`);
            setHall(response.data.data);
          }
        } catch (err) {
          console.error('Failed to fetch hall:', err);
        }
      };
      fetchHall();
    }
  }, [isOpen, booking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    if (selectedDates.length === 0) {
      setError('Please select at least one date.');
      return;
    }
    if (!startTime || !endTime) {
      setError('Please select start and end times.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const bookingDates = selectedDates.map(date => {
        const start = new Date(date);
        const [startH, startM] = startTime.split(':').map(Number);
        start.setHours(startH, startM, 0, 0);

        const end = new Date(date);
        const [endH, endM] = endTime.split(':').map(Number);
        end.setHours(endH, endM, 0, 0);

        return {
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        };
      });

      const endpoint = type === 'reservation'
        ? `/reservations/${booking._id}/reschedule`
        : `/bookings/${booking._id}/reschedule`;

      await api.post(endpoint, {
        bookingDates,
        eventDetails,
      });

      Swal.fire({
        icon: 'success',
        title: 'Rescheduled!',
        text: `The ${type || 'booking'} has been successfully rescheduled.`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to reschedule:', err);
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative z-10 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2 rounded-xl transition-all cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Reschedule {type === 'reservation' ? 'Reservation' : 'Booking'}</h2>
          <p className="text-sm text-gray-500">ID: {(booking as Booking).bookingId || (booking as Reservation).reservationId}</p>
        </div>

        {error && <p className="mb-4 bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-bold border border-rose-100">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select New Date(s)</label>
            <Calendar
              unavailableDates={[]}
              disableToday={true}
              getDateAvailability={getDateAvailability}
              selectedDates={selectedDates}
              displayedMonth={displayedMonth}
              onMonthChange={setDisplayedMonth}
              onChange={(dates) => setSelectedDates(dates || [])}
            />
            <AvailabilityLegend />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Start Time</label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-gray-900"
                required
              >
                <option value="">Select Time</option>
                {hall && generateTimeOptions(hall.openingHour || 0, hall.closingHour || 24, disabledHours)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">End Time</label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-gray-900"
                required
              >
                <option value="">Select Time</option>
                {hall && generateTimeOptions(hall.openingHour || 0, hall.closingHour || 24, disabledHours)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Event Details</label>
            <textarea
              value={eventDetails}
              onChange={(e) => setEventDetails(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              rows={3}
              placeholder="Update event details if needed"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {loading ? 'Rescheduling...' : 'Confirm Reschedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RescheduleModal;
