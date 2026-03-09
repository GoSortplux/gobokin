'use client';

import { FC, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, ChevronDown } from 'lucide-react';
import api from '@/services/api';
import CustomLoader from './CustomLoader';
import Calendar from './Calendar';
import { Venue, Facility } from '@/types';
import FacilityIcon from './FacilityIcon';
import { useBookingAvailability } from '@/hooks/useBookingAvailability';
import { useAuth } from '@/context/AuthContext';
import Swal from "@/utils/sweetalert";
import PolicyModal from './PolicyModal';

interface BookingModalProps {
  hallId: string;
  hallSlug?: string;
  isOpen: boolean;
  onClose: () => void;
  bookingMode?: 'book' | 'reserve';
  initialSelectedDates?: Date[];
  initialStep?: number;
  initialEventDetails?: string;
  initialStartTime?: string;
  initialEndTime?: string;
  initialSelectedFacilities?: FacilityWithQuantity[];
  initialUsePerDateTimes?: boolean;
  initialDateTimes?: Record<string, { startTime: string; endTime: string }>;
}

export interface FacilityWithQuantity extends Facility {
  quantity: number;
}

interface QuoteData {
  totalPrice: number;
  hallPrice: number;
  facilitiesPrice: number;
  discountAmount: number;
  discountType?: string;
  feeBreakdown: {
    serviceTotal: number;
    transactionFee: number;
    totalAmount: number;
  };
  reservationFeeDetails?: {
    serviceTotal: number;
    transactionFee: number;
    totalAmount: number;
    percentage: number;
  };
}

const BookingModal: FC<BookingModalProps> = ({
  hallId,
  hallSlug,
  isOpen,
  onClose,
  bookingMode = 'book',
  initialSelectedDates,
  initialStep,
  initialEventDetails = '',
  initialStartTime = '',
  initialEndTime = '',
  initialSelectedFacilities = [],
  initialUsePerDateTimes = false,
  initialDateTimes = {}
}) => {
  const [venue, setHall] = useState<Venue | null>(null);
  const [step, setStep] = useState(initialStep || 1);
  const [selectedDates, setSelectedDates] = useState<Date[] | undefined>(initialSelectedDates);
  const [displayedMonth, setDisplayedMonth] = useState<Date>(new Date());
  const [eventDetails, setEventDetails] = useState(initialEventDetails);
  const [selectedFacilities, setSelectedFacilities] = useState<FacilityWithQuantity[]>(initialSelectedFacilities);
  const [totalPrice, setTotalPrice] = useState(0);
  const [hallCost, setHallCost] = useState(0);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isCalculatingQuote, setIsCalculatingQuote] = useState(false);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [usePerDateTimes, setUsePerDateTimes] = useState(initialUsePerDateTimes);
  const [dateTimes, setDateTimes] = useState<Record<string, { startTime: string; endTime: string }>>(initialDateTimes);
  const [durationInHours, setDurationInHours] = useState(0);

  const totalHours = useMemo(() => {
    if (!selectedDates || selectedDates.length === 0) return 0;
    let total = 0;
    selectedDates.forEach(date => {
      const dateStr = date.toDateString();
      const times = usePerDateTimes && dateTimes[dateStr] ? dateTimes[dateStr] : { startTime, endTime };
      if (times.startTime && times.endTime) {
        const [startH, startM] = times.startTime.split(':').map(Number);
        const [endH, endM] = times.endTime.split(':').map(Number);
        const diff = (endH + endM / 60) - (startH + startM / 60);
        if (diff > 0) total += diff;
      }
    });
    return total;
  }, [selectedDates, usePerDateTimes, dateTimes, startTime, endTime]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRefundPolicy, setShowRefundPolicy] = useState(false);
  const [hasAcceptedRefundPolicy, setHasAcceptedRefundPolicy] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const { disabledHours, getDateAvailability, getDisabledHoursForDate } = useBookingAvailability(venue, selectedDates, displayedMonth);

  const isAllFullyAvailable = useMemo(() => {
    if (!selectedDates || selectedDates.length === 0) return false;
    return selectedDates.every(date => getDateAvailability(date) === 'fully available');
  }, [selectedDates, getDateAvailability]);

  const handleBookFullDay = (checked: boolean) => {
    if (!venue) return;
    const open = `${(venue.openingHour || 0).toString().padStart(2, '0')}:00`;
    const close = `${(venue.closingHour || 24).toString().padStart(2, '0')}:00`;

    if (checked) {
      setStartTime(open);
      setEndTime(close);
      // If we are in per-date mode, we also update all fully available dates
      if (usePerDateTimes && selectedDates) {
        setDateTimes(prev => {
          const updated = { ...prev };
          selectedDates.forEach(date => {
            if (getDateAvailability(date) === 'fully available') {
              updated[date.toDateString()] = { startTime: open, endTime: close };
            }
          });
          return updated;
        });
      }
    } else {
      setStartTime('');
      setEndTime('');
      if (usePerDateTimes && selectedDates) {
        setDateTimes(prev => {
          const updated = { ...prev };
          selectedDates.forEach(date => {
            if (getDateAvailability(date) === 'fully available') {
              updated[date.toDateString()] = { startTime: '', endTime: '' };
            }
          });
          return updated;
        });
      }
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

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
    if (startTime && endTime) {
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      const duration = (endHour + endMinute / 60) - (startHour + startMinute / 60);
      if (duration > 0) {
        setDurationInHours(duration);
      } else {
        setDurationInHours(0);
      }
    }
  }, [startTime, endTime]);

  const calculateFacilityCost = useCallback((facility: FacilityWithQuantity) => {
    const numberOfDays = selectedDates?.length || 1;
    const multiplier = facility.chargePerUnit ? (facility.quantity || 1) : 1;

    if (facility.chargeMethod === 'per_day') {
      return facility.cost * numberOfDays * multiplier;
    }
    if (facility.chargeMethod === 'per_hour') {
      let totalDuration = 0;
      if (usePerDateTimes && selectedDates) {
        selectedDates.forEach(date => {
          const times = dateTimes[date.toDateString()] || { startTime, endTime };
          if (times.startTime && times.endTime) {
            const [startH, startM] = times.startTime.split(':').map(Number);
            const [endH, endM] = times.endTime.split(':').map(Number);
            const diff = (endH + endM / 60) - (startH + startM / 60);
            if (diff > 0) totalDuration += diff;
          }
        });
      } else {
        totalDuration = durationInHours * numberOfDays;
      }
      return facility.cost * totalDuration * multiplier;
    }
    return facility.cost * multiplier;
  }, [selectedDates, usePerDateTimes, dateTimes, startTime, endTime, durationInHours]);

  useEffect(() => {
    if (venue && selectedDates && selectedDates.length > 0) {
      const dailyRate = venue.pricing.dailyRate || 0;
      const hourlyRate = venue.pricing.hourlyRate || 0;
      const numberOfDays = selectedDates.length;
      const openTime = `${(venue.openingHour || 0).toString().padStart(2, '0')}:00`;
      const closeTime = `${(venue.closingHour || 24).toString().padStart(2, '0')}:00`;

      let calculatedHallCost = 0;
      if (usePerDateTimes) {
        selectedDates.forEach(date => {
          const times = dateTimes[date.toDateString()] || { startTime, endTime };
          if (times.startTime && times.endTime) {
            const isFullDay = times.startTime === openTime && times.endTime === closeTime;
            if ((isFullDay || hourlyRate <= 0) && dailyRate > 0) {
              calculatedHallCost += dailyRate;
            } else if (hourlyRate > 0) {
              const [startH, startM] = times.startTime.split(':').map(Number);
              const [endH, endM] = times.endTime.split(':').map(Number);
              const diff = (endH + endM / 60) - (startH + startM / 60);
              if (diff > 0) calculatedHallCost += (hourlyRate * diff);
            }
          }
        });
      } else {
        const isFullDay = startTime === openTime && endTime === closeTime;
        if ((isFullDay || hourlyRate <= 0) && dailyRate > 0) {
          calculatedHallCost = dailyRate * numberOfDays;
        } else if (hourlyRate > 0) {
          calculatedHallCost = hourlyRate * durationInHours * numberOfDays;
        }
      }
      setHallCost(calculatedHallCost);

      const facilitiesCost = selectedFacilities.reduce((total, facility) => {
        return total + calculateFacilityCost(facility);
      }, 0);

      const subTotal = calculatedHallCost + facilitiesCost;
      let calculatedDiscount = 0;

      if (venue.recurringBookingDiscount) {
        const { percentage, minBookings } = venue.recurringBookingDiscount;
        if (selectedDates.length >= minBookings) {
          calculatedDiscount = subTotal * (percentage / 100);
        }
      }

      setTotalPrice(subTotal - calculatedDiscount);
    } else {
      setHallCost(0);
      setTotalPrice(0);
    }
  }, [venue, selectedDates, selectedFacilities, durationInHours, usePerDateTimes, dateTimes, startTime, endTime, calculateFacilityCost]);

  useEffect(() => {
    if (isOpen) {
      setStep(initialStep || 1);
      setSelectedDates(initialSelectedDates);
      if (initialSelectedDates && initialSelectedDates.length > 0) {
        setDisplayedMonth(new Date(initialSelectedDates[0]));
      }
      setEventDetails(initialEventDetails || '');
      setSelectedFacilities(initialSelectedFacilities || []);
      setStartTime(initialStartTime || '');
      setEndTime(initialEndTime || '');
      setUsePerDateTimes(initialUsePerDateTimes || false);
      setDateTimes(initialDateTimes || {});
      setError('');
      setLoading(false);
      setHasAcceptedRefundPolicy(false);
      setShowScrollIndicator(false);

      const fetchHallDetails = async () => {
        try {
          const response = await api.get(`/halls/${hallId}`);
          setHall(response.data.data);
        } catch (err: unknown) {
          console.error('Failed to fetch venue details:', err);
          setError(err instanceof Error ? err.message : 'Failed to load venue information. Please try again.');
        }
      };
      fetchHallDetails();
    }
    // Only re-run when modal is opened/closed or hallId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hallId, isOpen]);

  const handleFacilityChange = (facility: Facility) => {
    setSelectedFacilities((prevSelected) => {
      const isSelected = prevSelected.some((f) => f._id === facility._id);
      if (isSelected) {
        return prevSelected.filter((f) => f._id !== facility._id);
      } else {
        return [...prevSelected, { ...facility, quantity: 1 }];
      }
    });
  };

  const handleQuantityChange = (facilityId: string, quantity: number) => {
    const newQuantity = Math.max(1, quantity);
    setSelectedFacilities((prevSelected) =>
      prevSelected.map((f) =>
        f._id === facilityId ? { ...f, quantity: newQuantity } : f
      )
    );
  };

  const handleDateTimeChange = (dateStr: string, field: 'startTime' | 'endTime', value: string) => {
    setDateTimes(prev => ({
      ...prev,
      [dateStr]: {
        ...(prev[dateStr] || { startTime, endTime }),
        [field]: value
      }
    }));
  };

  const handlePayment = async (paymentType: 'book' | 'reserve') => {
    if (!user) {
      // Save state to localStorage before redirecting
      const bookingState = {
        hallId,
        hallSlug,
        bookingMode,
        selectedDates,
        eventDetails,
        startTime,
        endTime,
        selectedFacilities,
        step,
        usePerDateTimes,
        dateTimes,
      };
      localStorage.setItem('pendingBooking', JSON.stringify(bookingState));
      localStorage.setItem('returnUrl', window.location.pathname + window.location.search);

      Swal.fire({
        title: 'You are almost there! ....',
        text: 'Please log in to continue.',
        icon: 'info',
        confirmButtonText: 'Log In',
      }).then(result => {
        if (result.isConfirmed) {
          router.push('/auth/login');
        }
      });
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!selectedDates || selectedDates.length === 0) {
        setError('Please select at least one date.');
        setLoading(false);
        return;
      }

      const bookingDates = selectedDates.map(date => {
        const dateStr = date.toDateString();
        const times = usePerDateTimes && dateTimes[dateStr] ? dateTimes[dateStr] : { startTime, endTime };

        const [startHour, startMinute] = times.startTime.split(':').map(Number);
        const [endHour, endMinute] = times.endTime.split(':').map(Number);

        const startDate = new Date(date);
        startDate.setHours(startHour, startMinute, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(endHour, endMinute, 0, 0);
        return {
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        };
      });

      const facilitiesPayload = selectedFacilities.map(f => ({
        facilityId: f.facility?._id || f._id,
        quantity: f.quantity,
      }));

      const payload = {
        hallId,
        bookingDates,
        startTime: bookingDates[0].startTime,
        endTime: bookingDates[0].endTime,
        eventDetails,
        selectedFacilities: facilitiesPayload,
      };

      let paymentUrl: string | undefined;

      if (paymentType === 'reserve') {
        const reservationResponse = await api.post('/reservations', payload);
        localStorage.setItem('bookingConfirmation', JSON.stringify(reservationResponse.data.data));
        const reservationId = reservationResponse.data.data.reservationId;
        const paymentResponse = await api.post(`/payments/reservations/${reservationId}/pay`);
        paymentUrl = `${paymentResponse.data.data.checkoutUrl}?type=reservation`;
      } else {
        const bookingResponse = await api.post('/bookings', payload);
        localStorage.setItem('bookingConfirmation', JSON.stringify(bookingResponse.data.data));
        const bookingId = bookingResponse.data.data.bookingId;
        const paymentResponse = await api.post(`/payments/initialize/${bookingId}`);
        paymentUrl = paymentResponse.data.data.checkoutUrl;
      }

      if (paymentUrl) {
        Swal.close();
        window.location.href = paymentUrl;
      } else {
        setError('Could not retrieve payment URL. Please try again.');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
      Swal.fire('Error', errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => handlePayment('book');
  const handleReserveNow = () => handlePayment('reserve');

  const fetchQuote = useCallback(async () => {
    if (!selectedDates || selectedDates.length === 0) return;

    setIsCalculatingQuote(true);
    setError('');
    try {
      const bookingDates = selectedDates.map(date => {
        const dateStr = date.toDateString();
        const times = usePerDateTimes && dateTimes[dateStr] ? dateTimes[dateStr] : { startTime, endTime };
        const [startHour, startMinute] = times.startTime.split(':').map(Number);
        const [endHour, endMinute] = times.endTime.split(':').map(Number);
        const startDate = new Date(date);
        startDate.setHours(startHour, startMinute, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(endHour, endMinute, 0, 0);
        return {
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        };
      });

      const facilitiesPayload = selectedFacilities.map(f => ({
        facilityId: f.facility?._id || f._id,
        quantity: f.quantity,
      }));

      const payload = {
        hallId,
        bookingDates,
        selectedFacilities: facilitiesPayload,
        isRecurring: selectedDates.length > 1,
        manualDiscount: 0
      };

      const response = await api.post('/bookings/calculate-quote', payload);
      setQuoteData(response.data.data);
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Failed to fetch quote:', err);
      setError(err.response?.data?.message || 'Failed to calculate booking quote.');
    } finally {
      setIsCalculatingQuote(false);
    }
  }, [selectedDates, usePerDateTimes, dateTimes, startTime, endTime, selectedFacilities, hallId]);

  useEffect(() => {
    if (isOpen && step === 3 && !quoteData && !isCalculatingQuote) {
      fetchQuote();
    }
  }, [isOpen, step, quoteData, isCalculatingQuote, fetchQuote]);

  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const isScrollable = scrollHeight > clientHeight + 10;
        const hasNotScrolledMuch = scrollTop < 50;

        // Show indicator if scrollable and at top
        // For step 1, also require dates to be selected
        if (step === 1) {
          setShowScrollIndicator(isScrollable && hasNotScrolledMuch && !!selectedDates && selectedDates.length > 0);
        } else {
          setShowScrollIndicator(isScrollable && hasNotScrolledMuch);
        }
      } else {
        setShowScrollIndicator(false);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      // Also check on window resize as it might change scrollability
      window.addEventListener('resize', checkScroll);
      // Initial check with a slight delay to allow content to render
      const timeoutId = setTimeout(checkScroll, 500);
      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
        clearTimeout(timeoutId);
      };
    }
  }, [step, selectedDates, isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (step === 2) {
      if (usePerDateTimes && selectedDates) {
        for (const date of selectedDates) {
          const times = dateTimes[date.toDateString()] || { startTime, endTime };
          if (!times.startTime || !times.endTime) {
            setError(`Please select start and end times for ${date.toLocaleDateString()}.`);
            return;
          }
        }
      } else if (!startTime || !endTime) {
        setError('Please select start and end times.');
        return;
      }

      setError('');
      // Set calculating state before moving to step 3 to ensure loader shows immediately
      setIsCalculatingQuote(true);
      nextStep();
      await fetchQuote();
      return;
    }
    setError('');
    if (step < 3) {
      nextStep();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center text-gray-800 transition-opacity duration-300">
      <div className="absolute inset-0 bg-black/0 cursor-pointer" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        ref={scrollContainerRef}
        className={`relative z-10 bg-white rounded-t-2xl lg:rounded-xl shadow-2xl p-4 lg:p-8 w-full max-w-4xl transform transition-all duration-300 max-h-[95vh] overflow-y-auto border border-gray-200`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Book Your Venue</h2>
            <p className="text-gray-500 text-sm mt-1">Complete the steps below to secure your space.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8 relative">
          <div className="flex justify-between items-center max-w-xl mx-auto">
            {[
              { id: 1, label: 'Select Dates' },
              { id: 2, label: 'Details' },
              { id: 3, label: 'Review & Pay' }
            ].map((s) => (
              <div key={s.id} className="flex flex-col items-center relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  step >= s.id ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-gray-200 text-gray-500'
                }`}>
                  {s.id}
                </div>
                <span className={`text-[10px] uppercase tracking-wider font-bold mt-2 ${
                  step >= s.id ? 'text-primary' : 'text-gray-400'
                }`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          {/* Progress Line */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 w-full max-w-[400px] lg:max-w-[480px] h-0.5 bg-gray-200 -z-0">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${(step - 1) * 50}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

          {showScrollIndicator && (
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[110] pointer-events-none animate-bounce flex flex-col items-center">
              <span className="bg-primary/90 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg mb-2 uppercase tracking-widest backdrop-blur-sm">
                {step === 3 ? 'Scroll to Confirm' : 'Scroll for Next Step'}
              </span>
              <div className="bg-primary p-2 rounded-full shadow-xl">
                <ChevronDown className="h-6 w-6 text-white" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col lg:flex-row gap-12 items-start">
              <div className="flex-1 w-full bg-white rounded-2xl border border-gray-100 p-2 shadow-sm">
                <Calendar
                  unavailableDates={[]}
                  disableToday={true}
                  selectedDates={selectedDates}
                  onChange={(dates) => setSelectedDates(dates)}
                  getDateAvailability={getDateAvailability}
                  displayedMonth={displayedMonth}
                  onMonthChange={setDisplayedMonth}
                />
              </div>

              <div className="w-full lg:w-80 space-y-8">
                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Availability Legend</h3>
                  <div className="space-y-4">
                    {[
                      { color: 'bg-green-500', label: 'Available', sub: 'All slots are open for booking' },
                      { color: 'bg-orange-500', label: 'Partially Booked', sub: 'Some hours are already taken' },
                      { color: 'bg-red-500', label: 'Fully Booked', sub: 'No available slots on this day' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start group">
                        <div className={`w-3 h-3 rounded-full mt-1 mr-3 ${item.color} shadow-sm`} />
                        <div>
                          <p className="text-sm font-bold text-gray-700 group-hover:text-primary transition-colors">{item.label}</p>
                          <p className="text-[10px] text-gray-400 leading-tight">{item.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
                  <h4 className="text-primary font-bold text-sm mb-2">Need help?</h4>
                  <p className="text-xs text-primary/70 leading-relaxed">
                    Select the dates you&apos;d like to book on the calendar. You can select multiple dates for recurring events.
                  </p>
                </div>

                {selectedDates && selectedDates.length > 0 && (
                  <div className="animate-in fade-in slide-in-from-bottom-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Selected</span>
                    <div className="text-2xl font-black text-gray-900">
                      {selectedDates.length} {selectedDates.length === 1 ? 'Date' : 'Dates'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Event Details & Times */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center mr-2 text-sm">1</span>
                    Event Details
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <label htmlFor="eventDetails" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      What are you hosting?
                    </label>
                    <input
                      type="text"
                      id="eventDetails"
                      value={eventDetails}
                      onChange={(e) => setEventDetails(e.target.value)}
                      placeholder="e.g. Wedding Reception, Corporate Meeting"
                      className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all sm:text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center mr-2 text-sm">2</span>
                    Select Times
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    {!usePerDateTimes ? (
                      <div className="space-y-4">
                        {isAllFullyAvailable && (
                          <label className="flex items-center text-sm font-bold text-primary cursor-pointer hover:opacity-80 transition-opacity mb-4 bg-primary/5 p-3 rounded-lg border border-primary/10">
                            <input
                              type="checkbox"
                              className="mr-2 h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                              checked={startTime === `${(venue?.openingHour || 0).toString().padStart(2, '0')}:00` && endTime === `${(venue?.closingHour || 24).toString().padStart(2, '0')}:00`}
                              onChange={(e) => handleBookFullDay(e.target.checked)}
                            />
                            Book Full Day ({(venue?.openingHour || 0).toString().padStart(2, '0')}:00 - {(venue?.closingHour || 24).toString().padStart(2, '0')}:00)
                          </label>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="startTime" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Start Time</label>
                          <select
                            id="startTime"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="block w-full px-3 py-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all sm:text-sm"
                            required
                          >
                            <option value="">Select</option>
                            {venue && generateTimeOptions(venue.openingHour || 0, venue.closingHour || 24, disabledHours)}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="endTime" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">End Time</label>
                          <select
                            id="endTime"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="block w-full px-3 py-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all sm:text-sm"
                            required
                          >
                            <option value="">Select</option>
                            {venue && generateTimeOptions(venue.openingHour || 0, venue.closingHour || 24, disabledHours)}
                          </select>
                        </div>
                      </div>
                    </div>
                    ) : (
                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {selectedDates?.map((date) => {
                          const dateStr = date.toDateString();
                          const times = dateTimes[dateStr] || { startTime, endTime };
                          const dateDisabledHours = getDisabledHoursForDate(date);
                          const isFullyAvailable = getDateAvailability(date) === 'fully available';
                          const open = `${(venue?.openingHour || 0).toString().padStart(2, '0')}:00`;
                          const close = `${(venue?.closingHour || 24).toString().padStart(2, '0')}:00`;
                          const isFullDay = times.startTime === open && times.endTime === close;

                          return (
                            <div key={dateStr} data-testid={`date-row-${dateStr}`} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                              <div className="flex justify-between items-center mb-2">
                                <p className="text-xs font-bold text-primary">{dateStr}</p>
                                {isFullyAvailable && (
                                  <label data-testid="full-day-checkbox" className="flex items-center text-[10px] font-bold text-primary cursor-pointer">
                                    <input
                                      type="checkbox"
                                      className="mr-1 h-3 w-3 text-primary rounded border-gray-300 focus:ring-primary"
                                      checked={isFullDay}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setDateTimes(prev => ({
                                            ...prev,
                                            [dateStr]: { startTime: open, endTime: close }
                                          }));
                                        } else {
                                          setDateTimes(prev => ({
                                            ...prev,
                                            [dateStr]: { startTime: '', endTime: '' }
                                          }));
                                        }
                                      }}
                                    />
                                    Full Day
                                  </label>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <select
                                  value={times.startTime}
                                  onChange={(e) => handleDateTimeChange(dateStr, 'startTime', e.target.value)}
                                  className="w-full px-2 py-2 border border-gray-200 rounded-md text-sm"
                                >
                                  <option value="">Start</option>
                                  {venue && generateTimeOptions(venue.openingHour || 0, venue.closingHour || 24, dateDisabledHours)}
                                </select>
                                <select
                                  value={times.endTime}
                                  onChange={(e) => handleDateTimeChange(dateStr, 'endTime', e.target.value)}
                                  className="w-full px-2 py-2 border border-gray-200 rounded-md text-sm"
                                >
                                  <option value="">End</option>
                                  {venue && generateTimeOptions(venue.openingHour || 0, venue.closingHour || 24, dateDisabledHours)}
                                </select>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {selectedDates && selectedDates.length > 1 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <label className="flex items-center text-sm font-medium text-gray-600 cursor-pointer hover:text-primary transition-colors">
                          <input
                            type="checkbox"
                            className="mr-2 h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                            checked={usePerDateTimes}
                            onChange={(e) => setUsePerDateTimes(e.target.checked)}
                          />
                          Different times for each date
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Facilities */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center mr-2 text-sm">3</span>
                    Add Facilities
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 min-h-[300px]">
                    {venue && venue.facilities.length > 0 ? (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {venue.facilities.map((facility) => {
                          const isSelected = selectedFacilities.some(f => f._id === facility._id);
                          const selectedFacility = selectedFacilities.find(f => f._id === facility._id);
                          return (
                            <div key={facility._id} className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                              isSelected ? 'bg-white border-primary shadow-sm' : 'bg-white/50 border-gray-100 hover:border-gray-200'
                            }`}>
                              <label className="flex items-center space-x-3 text-sm cursor-pointer flex-1">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                  isSelected ? 'bg-primary border-primary text-white' : 'bg-white border-gray-300'
                                }`}>
                                  {isSelected && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                  <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={isSelected}
                                    onChange={() => handleFacilityChange(facility)}
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <span className={`font-bold ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                                    {facility.facility?.name || facility.name}
                                    {facility.variantName && (
                                      <span className="text-gray-500 text-xs ml-1 font-normal">({facility.variantName})</span>
                                    )}
                                  </span>
                                  <span className="text-[10px] text-gray-500 font-medium">
                                    + ₦{facility.cost.toLocaleString()}{facility.chargeMethod === 'per_day' ? '/day' : (facility.chargeMethod === 'per_hour' ? '/hour' : '')}
                                  </span>
                                </div>
                              </label>
                              {isSelected && (
                                <div className="ml-4">
                                  <select
                                    value={selectedFacility?.quantity || 1}
                                    onChange={(e) => handleQuantityChange(facility._id, parseInt(e.target.value, 10))}
                                    className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs font-bold text-gray-900 focus:ring-1 focus:ring-primary outline-none"
                                  >
                                    {Array.from({ length: facility.quantity }, (_, index) => index + 1).map(n =>
                                      <option key={n} value={n}>{n}</option>
                                    )}
                                  </select>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
                        <p className="text-sm italic">No extra facilities available for this venue.</p>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>

            {/* Step 2 Duration & Price Feedback */}
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex gap-12">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1 text-center sm:text-left">Selected Dates</span>
                      <div className="text-xl font-black text-gray-900 text-center sm:text-left">
                        {selectedDates?.length || 0} {selectedDates?.length === 1 ? 'Date' : 'Dates'}
                      </div>
                    </div>
                    {totalHours > 0 && (
                      <div className="animate-in zoom-in duration-300">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1 text-center sm:text-left">Total Duration</span>
                        <div className="text-xl font-black text-primary text-center sm:text-left">
                          {totalHours} {totalHours === 1 ? 'Hour' : 'Hours'}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center sm:items-end">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Estimated Total</span>
                    <div className="text-2xl font-black text-gray-900">
                      ₦{totalPrice.toLocaleString()}
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium">Excludes transaction fees</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              {isCalculatingQuote ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <CustomLoader />
                  <p className="mt-4 text-gray-500 font-medium animate-pulse">Finalizing your summary...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  {/* Left Column: Booking Details (3/5 width) */}
                  <div className="lg:col-span-3 space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wider text-xs flex items-center">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                        Event & Venue Details
                      </h3>
                      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4">
                        <div className="flex justify-between items-start">
                          <span className="text-gray-500 text-sm">Venue</span>
                          <span className="font-bold text-gray-900 text-right">{venue?.name}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-gray-500 text-sm">Event</span>
                          <span className="font-bold text-gray-900 text-right">{eventDetails}</span>
                        </div>
                        <div className="pt-4 border-t border-gray-200">
                          <span className="text-gray-500 text-sm block mb-3">Selected Dates & Times</span>
                          <div className="space-y-2">
                            {selectedDates?.map(date => {
                              const dateStr = date.toDateString();
                              const times = usePerDateTimes && dateTimes[dateStr] ? dateTimes[dateStr] : { startTime, endTime };

                              let dateDuration = 0;
                              if (times.startTime && times.endTime) {
                                const [startH, startM] = times.startTime.split(':').map(Number);
                                const [endH, endM] = times.endTime.split(':').map(Number);
                                dateDuration = (endH + endM / 60) - (startH + startM / 60);
                              }

                              return (
                                <div key={dateStr} className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100 text-sm shadow-sm">
                                  <div className="flex flex-col">
                                    <span className="font-medium text-gray-700">{date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                    {dateDuration > 0 && (
                                      <span className="text-[10px] text-gray-400 font-medium">{dateDuration} {dateDuration === 1 ? 'Hour' : 'Hours'}</span>
                                    )}
                                  </div>
                                  <span className="font-black text-primary">{times.startTime} - {times.endTime}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedFacilities.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                           <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Added Facilities</h3>
                           <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">{selectedFacilities.length} Item{selectedFacilities.length > 1 ? 's' : ''}</span>
                        </div>
                        <div className="bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100 shadow-inner">
                          {selectedFacilities.map(f => (
                            <div key={f._id} className="p-4 flex items-center justify-between hover:bg-white transition-colors group relative">
                               <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-primary shadow-sm group-hover:shadow-md group-hover:border-primary/20 transition-all duration-300">
                                     <FacilityIcon name={f.facility?.name || f.name} />
                                  </div>
                                  <div>
                                     <p className="text-sm font-black text-gray-900 leading-tight tracking-tight uppercase">
                                        {f.facility?.name || f.name}
                                        {f.variantName && (
                                          <span className="text-[11px] text-primary font-bold ml-1">({f.variantName})</span>
                                        )}
                                     </p>
                                     <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider italic">Qty: {f.quantity}</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                        <span className="text-[10px] text-gray-500 font-semibold italic">
                                          ₦{f.cost.toLocaleString()}{f.chargeMethod === 'per_day' ? '/day' : (f.chargeMethod === 'per_hour' ? '/hour' : '')}
                                        </span>
                                     </div>
                                  </div>
                               </div>
                               <div className="text-right">
                                  <span className="text-sm font-black text-gray-900 tracking-tight">₦{calculateFacilityCost(f).toLocaleString()}</span>
                                  <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5 tracking-tighter">Subtotal</p>
                               </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Pricing & Checkout (2/5 width) */}
                  <div className="lg:col-span-2">
                    <div className="bg-gray-900 text-white rounded-3xl p-6 lg:p-8 shadow-xl sticky top-0">
                      <h3 className="text-xl font-bold mb-6 text-white/90">Payment Summary</h3>

                      {quoteData ? (
                        <div className="space-y-4">
                          <div className="flex justify-between text-sm text-white/60">
                            <span>Venue Price</span>
                            <span className="font-bold text-white">₦{(quoteData.hallPrice || 0).toLocaleString()}</span>
                          </div>
                          {quoteData.facilitiesPrice > 0 && (
                            <div className="flex justify-between text-sm text-white/60">
                              <span>Facilities</span>
                              <span className="font-bold text-white">₦{quoteData.facilitiesPrice.toLocaleString()}</span>
                            </div>
                          )}
                          {quoteData.discountAmount > 0 && (
                            <div className="flex justify-between text-sm text-green-400">
                              <span>Discount</span>
                              <span className="font-bold">-₦{quoteData.discountAmount.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="h-px bg-white/10 my-4" />
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
                            <span className="text-white/60 text-sm font-medium">Total Price</span>
                            <div className="sm:text-right">
                              <div className="text-3xl md:text-4xl font-black text-white leading-tight">
                                ₦{(quoteData.feeBreakdown?.serviceTotal || quoteData.totalPrice).toLocaleString()}
                              </div>
                              <p className="text-[10px] text-white/40 mt-1 font-medium">Excludes transaction fees</p>
                            </div>
                          </div>

                          <div className="bg-white/5 rounded-xl p-3 mt-4 space-y-1">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-white/40 italic">Transaction Fee (VAT/STAMP DUTY)</span>
                              <span className="text-white/60 font-bold">Transaction fees may apply</span>
                            </div>
                            <p className="text-[10px] text-white/30 italic leading-tight">
                              Please note that transaction fees are included in the final amount.
                            </p>
                          </div>

                          {bookingMode === 'reserve' && quoteData.reservationFeeDetails && (
                            <div className="mt-8 pt-6 border-t border-white/10">
                              <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/20 px-2 py-1 rounded">Reservation Payment</span>
                                <span className="text-xs font-black text-white">{quoteData.reservationFeeDetails.percentage}% Required</span>
                              </div>
                              <div className="flex justify-between items-end">
                                <span className="text-white/60 text-sm">To Pay Now</span>
                                <div className="text-right">
                                  <div className="text-2xl font-black text-white">
                                    ₦{quoteData.reservationFeeDetails.serviceTotal.toLocaleString()}
                                  </div>
                                  <p className="text-[10px] text-white/40">Excludes transaction fees</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Fallback when quoteData is not yet loaded */
                        <div className="space-y-4">
                          <div className="flex justify-between text-sm text-white/60">
                            <span>Venue Price</span>
                            <span className="font-bold text-white">₦{hallCost.toLocaleString()}</span>
                          </div>
                          {selectedFacilities.length > 0 && (
                            <div className="flex justify-between text-sm text-white/60">
                              <span>Facilities</span>
                              <span className="font-bold text-white">₦{(totalPrice - hallCost).toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 pt-4 border-t border-white/10">
                            <span className="text-white/60 text-sm font-medium">Total Price</span>
                            <div className="text-3xl font-black text-white">₦{totalPrice.toLocaleString()}</div>
                          </div>
                        </div>
                      )}

                      <div className="mt-8 pt-6 border-t border-white/10">
                        <label className="flex items-start cursor-pointer group mb-6">
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
                            checked={hasAcceptedRefundPolicy}
                            onChange={(e) => setHasAcceptedRefundPolicy(e.target.checked)}
                          />
                          <div className="ml-3 text-xs text-white/60 leading-relaxed group-hover:text-white/80 transition-colors">
                            I agree to the <button type="button" onClick={() => setShowRefundPolicy(true)} className="text-primary font-bold hover:underline">Refund & Cancellation Policy</button>
                          </div>
                        </label>

                        {bookingMode === 'reserve' ? (
                          <button
                            type="button"
                            onClick={handleReserveNow}
                            disabled={loading || !hasAcceptedRefundPolicy}
                            className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center uppercase tracking-widest text-sm"
                          >
                            {loading ? <CustomLoader size={20} /> : 'Reserve Now'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleBookNow}
                            disabled={loading || !hasAcceptedRefundPolicy}
                            className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center uppercase tracking-widest text-sm"
                          >
                            {loading ? <CustomLoader size={20} /> : 'Confirm & Pay'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-100">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-8 py-3 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              )}
            </div>

            <div className="flex gap-x-4">
              {step < 3 ? (
                <button
                  type="submit"
                  disabled={isCalculatingQuote || (step === 1 && (!selectedDates || selectedDates.length === 0))}
                  className="px-10 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-95 flex items-center uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCalculatingQuote ? (
                    <CustomLoader size={16} />
                  ) : (
                    <>
                      Next Step
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              ) : null}
            </div>
          </div>
        </form>
      </div>

      {showRefundPolicy && (
        <PolicyModal
          isOpen={showRefundPolicy}
          type="general"
          slug="refund-policy"
          compact={true}
          skipUserUpdate={true}
          onAccept={() => {
            setHasAcceptedRefundPolicy(true);
            setShowRefundPolicy(false);
          }}
          onClose={() => setShowRefundPolicy(false)}
        />
      )}
    </div>
  );
};

export default BookingModal;
