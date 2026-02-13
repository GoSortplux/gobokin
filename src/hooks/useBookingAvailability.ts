
import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '@/services/api';
import { Hall, UnavailableDate } from '@/types';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export const useBookingAvailability = (hall: Hall | null, selectedDates: Date[] | undefined, displayedMonth: Date) => {
  const [unavailableDates, setUnavailableDates] = useState<UnavailableDate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUnavailableDates = async () => {
      if (!hall) {
        setUnavailableDates([]);
        return;
      }
      setLoading(true);

      const startDate = format(startOfMonth(displayedMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(displayedMonth), 'yyyy-MM-dd');

      try {
        const response = await api.get(`/halls/${hall._id}/unavailable-dates`, {
          params: { startDate, endDate },
        });
        setUnavailableDates(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch unavailable dates:', error);
        setUnavailableDates([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUnavailableDates();
  }, [hall, displayedMonth]);

  const getDisabledHoursForDate = useCallback((date: Date) => {
    if (!hall || !Array.isArray(unavailableDates)) {
      return [];
    }
    const openingHour = hall.openingHour || 0;
    const closingHour = hall.closingHour || 24;
    const disabledSet = new Set<number>();

    const targetDay = new Date(date).setHours(0, 0, 0, 0);
    const dayEnd = new Date(date).setHours(23, 59, 59, 999);

    const today = new Date().setHours(0, 0, 0, 0);
    if (targetDay === today) {
      const currentHour = new Date().getHours();
      for (let i = 0; i < currentHour; i++) {
        disabledSet.add(i);
      }
    }

    for (const unavailable of unavailableDates) {
      const bufferStart = new Date(unavailable.bufferTime.startTime);
      const bufferEnd = new Date(unavailable.bufferTime.endTime);

      if (bufferStart.getTime() <= dayEnd && bufferEnd.getTime() >= targetDay) {
        if (unavailable.reason === 'Owner Reservation (Blocked)') {
          // If it's an owner block, we still only block the hours it touches (including buffer)
          // but usually owners want the whole day.
          // However, for consistency with getDateAvailability, we'll check overlap.
          const checkStart = unavailable.eventTime ? new Date(unavailable.eventTime.startTime) : bufferStart;
          const checkEnd = unavailable.eventTime ? new Date(unavailable.eventTime.endTime) : bufferEnd;

          if (checkStart.getTime() <= dayEnd && checkEnd.getTime() >= targetDay) {
            for (let i = openingHour; i < closingHour; i++) {
              disabledSet.add(i);
            }
            continue; // Already blocked all hours for this day from this record
          }
        }

        const actualStart = new Date(Math.max(bufferStart.getTime(), targetDay));
        const actualEnd = new Date(Math.min(bufferEnd.getTime(), dayEnd));

        const startHour = actualStart.getHours();
        let endHour = actualEnd.getHours();
        if (actualEnd.getTime() > new Date(actualEnd).setHours(endHour, 0, 0, 0)) {
          endHour += 1;
        }
        if (bufferEnd.getTime() > dayEnd) {
          endHour = 24;
        }

        const finalBlockStart = Math.max(openingHour, startHour);
        const finalBlockEnd = Math.min(closingHour, endHour);

        for (let i = finalBlockStart; i < finalBlockEnd; i++) {
          disabledSet.add(i);
        }
      }
    }

    return Array.from(disabledSet).sort((a, b) => a - b);
  }, [unavailableDates, hall]);

  const disabledHours = useMemo(() => {
    if (!hall || !selectedDates || selectedDates.length === 0 || !Array.isArray(unavailableDates)) {
      return [];
    }
    const disabledSet = new Set<number>();

    selectedDates.forEach(date => {
      const hours = getDisabledHoursForDate(date);
      hours.forEach(h => disabledSet.add(h));
    });

    return Array.from(disabledSet).sort((a, b) => a - b);
  }, [unavailableDates, hall, selectedDates, getDisabledHoursForDate]);

  const getDateAvailability = useCallback((date: Date): 'fully booked' | 'partially booked' | 'fully available' => {
    if (!hall || !Array.isArray(unavailableDates)) return 'fully available';

    const openingHour = hall.openingHour || 0;
    const closingHour = hall.closingHour || 24;
    const totalHours = closingHour - openingHour;

    const dayStart = new Date(date).setHours(0, 0, 0, 0);
    const dayEnd = new Date(date).setHours(23, 59, 59, 999);

    const blockedIntervals: { start: number; end: number }[] = [];
    let isOwnerBlocked = false;

    for (const unavailable of unavailableDates) {
      const bufferStart = new Date(unavailable.bufferTime.startTime);
      const bufferEnd = new Date(unavailable.bufferTime.endTime);

      if (bufferStart.getTime() <= dayEnd && bufferEnd.getTime() >= dayStart) {
        if (unavailable.reason === 'Owner Reservation (Blocked)') {
          // Check if the actual event (not just buffer) touches this day
          const eventStart = unavailable.eventTime ? new Date(unavailable.eventTime.startTime) : bufferStart;
          const eventEnd = unavailable.eventTime ? new Date(unavailable.eventTime.endTime) : bufferEnd;

          if (eventStart.getTime() <= dayEnd && eventEnd.getTime() >= dayStart) {
            isOwnerBlocked = true;
            break; // Found an owner block, whole day is booked
          }
        }

        const actualStart = new Date(Math.max(bufferStart.getTime(), dayStart));
        const actualEnd = new Date(Math.min(bufferEnd.getTime(), dayEnd));

        const startHour = actualStart.getHours();
        let endHour = actualEnd.getHours();
        if (actualEnd.getTime() > new Date(actualEnd).setHours(endHour, 0, 0, 0)) {
          endHour += 1;
        }
        if (bufferEnd.getTime() > dayEnd) {
          endHour = 24;
        }

        const finalBlockStart = Math.max(openingHour, startHour);
        const finalBlockEnd = Math.min(closingHour, endHour);

        if (finalBlockStart < finalBlockEnd) {
          blockedIntervals.push({ start: finalBlockStart, end: finalBlockEnd });
        }
      }
    }

    if (isOwnerBlocked) {
      return 'fully booked';
    }

    if (blockedIntervals.length === 0) {
      return 'fully available';
    }

    blockedIntervals.sort((a, b) => a.start - b.start);

    const mergedIntervals = [blockedIntervals[0]];

    for (let i = 1; i < blockedIntervals.length; i++) {
      const lastMerged = mergedIntervals[mergedIntervals.length - 1];
      const current = blockedIntervals[i];

      if (current.start < lastMerged.end) {
        lastMerged.end = Math.max(lastMerged.end, current.end);
      } else {
        mergedIntervals.push(current);
      }
    }

    const totalBlockedHours = mergedIntervals.reduce((total, interval) => {
      return total + (interval.end - interval.start);
    }, 0);

    const availableHours = totalHours - totalBlockedHours;

    if (availableHours <= 0) {
      return 'fully booked';
    } else if (availableHours < totalHours) {
      return 'partially booked';
    } else {
      return 'fully available';
    }
  }, [unavailableDates, hall]);

  return { disabledHours, loading, getDateAvailability, getDisabledHoursForDate };
};
