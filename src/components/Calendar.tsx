// components/Calendar.tsx
'use client';

import React from 'react';
import { DayPicker, Modifiers } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

interface CalendarProps {
  unavailableDates: Date[];
  disableToday?: boolean;
  selectedDates: Date[] | undefined;
  onChange: (dates: Date[] | undefined) => void;
  onDisabledDateClick?: (date: Date) => void;
  onDateClick?: (date: Date) => void;
  getDateAvailability?: (date: Date) => 'fully booked' | 'partially booked' | 'fully available';
  displayedMonth: Date;
  onMonthChange: (date: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({
  unavailableDates,
  disableToday = false,
  selectedDates,
  onChange,
  onDisabledDateClick,
  onDateClick,
  getDateAvailability,
  displayedMonth,
  onMonthChange,
}) => {
  const handleDayClick = (day: Date, modifiers: Modifiers) => {
    if (modifiers.disabled) {
      if (onDisabledDateClick) onDisabledDateClick(day);
    } else {
      if (onDateClick) onDateClick(day);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const disableBoundary = disableToday ? tomorrow : today;

  const customModifiers = {
    fully_booked: (date: Date) => (getDateAvailability ? getDateAvailability(date) === 'fully booked' : false),
    partially_booked: (date: Date) => (getDateAvailability ? getDateAvailability(date) === 'partially booked' : false),
    fully_available: (date: Date) => (getDateAvailability ? getDateAvailability(date) === 'fully available' : false),
    past: { before: disableBoundary },
  };

  return (
    <div className="custom-calendar-wrapper bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
      <style>{`
        .rdp {
          --rdp-cell-size: 40px;
          --rdp-accent-color: #295FA7;
          --rdp-background-color: #e7effa;
          margin: 0;
        }
        .rdp-months {
          justify-content: center;
        }
        .rdp-month_caption {
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 0.875rem;
          color: #111827;
          margin-bottom: 1rem;
        }
        .rdp-nav {
          color: #295FA7;
        }
        .rdp-weekday {
          font-size: 0.75rem;
          font-weight: 700;
          color: #9CA3AF;
          text-transform: uppercase;
        }
        .rdp-day {
          border-radius: 12px !important;
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.2s ease;
        }
        .rdp-day_disabled, .rdp-day_fully_booked {
          background-color: #fee2e2 !important;
          color: #991b1b !important;
          opacity: 0.6;
          cursor: not-allowed;
        }
        .rdp-day_partially_booked {
          background-color: #fef3c7 !important;
          color: #92400e !important;
          border: 1px dashed #B68945 !important;
        }
        .rdp-day_partially_booked:hover {
          background-color: #fde68a !important;
        }
        .rdp-day_fully_available {
          background-color: #ecfdf5 !important;
          color: #065f46 !important;
        }
        .rdp-day_fully_available:hover {
          background-color: #d1fae5 !important;
        }
        .rdp-day_past {
          background-color: #f9fafb !important;
          color: #d1d5db !important;
          cursor: not-allowed;
          opacity: 0.5;
        }
        .rdp-day_selected, .rdp-day_selected:hover,
        .rdp-day_selected.rdp-day_fully_available,
        .rdp-day_selected.rdp-day_partially_booked {
            background-color: #295FA7 !important;
            color: white !important;
            opacity: 1 !important;
            box-shadow: 0 4px 6px -1px rgb(41 95 167 / 0.3);
            transform: scale(1.05);
        }
        .rdp-day:hover:not(.rdp-day_disabled):not(.rdp-day_past) {
          background-color: #e7effa;
          color: #295FA7;
        }
      `}</style>
      <DayPicker
        mode="multiple"
        selected={selectedDates}
        onSelect={onChange}
        disabled={[
          ...(Array.isArray(unavailableDates) ? unavailableDates : []),
          { before: disableBoundary },
          (date: Date) => getDateAvailability?.(date) === 'fully booked'
        ]}
        onDayClick={handleDayClick}
        month={displayedMonth}
        onMonthChange={onMonthChange}
        modifiers={customModifiers}
        modifiersClassNames={{
          disabled: 'rdp-day_disabled',
          selected: 'rdp-day_selected',
          fully_booked: 'rdp-day_fully_booked',
          partially_booked: 'rdp-day_partially_booked',
          fully_available: 'rdp-day_fully_available',
          past: 'rdp-day_past',
        }}
      />
    </div>
  );
};

export default Calendar;