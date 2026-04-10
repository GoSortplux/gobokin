
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { X, Trash2, ChevronDown } from 'lucide-react';
import api from '@/services/api';
import { translateError } from '@/utils/errors';
import Swal from "@/utils/sweetalert";
import Calendar from '../Calendar';
import CustomLoader from '../CustomLoader';
import { useBookingAvailability } from '@/hooks/useBookingAvailability';
import { ReferralSource } from '@/types';
import {
  format,
  addDays,
  addMonths,
  eachDayOfInterval,
  getDay,
  getDate,
  startOfMonth,
  parseISO
} from 'date-fns';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: Record<string, unknown>, type: string) => void;
  userRole: 'admin' | 'vendor';
}

interface FacilityItem {
  _id: string;
  facility?: {
    _id: string;
    name: string;
  };
  name: string;
  cost: number;
  chargeMethod: string;
  quantity: number;
  chargePerUnit: boolean;
  variantName?: string;
  description?: string;
}

interface HallItem {
  _id: string;
  name: string;
  facilities: FacilityItem[];
  pricing: {
    dailyRate?: number;
    hourlyRate?: number;
  };
  recurringBookingDiscount?: {
    percentage: number;
    minBookings: number;
  };
  allowRecurringBookings?: boolean;
  reservationFeePercentage?: number;
  openingHour?: number;
  closingHour?: number;
  isTaxEnabled?: boolean;
  serviceChargePercentage?: number;
  vatPercentage?: number;
}

interface QuoteData {
  totalPrice: number;
  hallPrice: number;
  facilitiesPrice: number;
  discountAmount: number;
  discountType?: string;
  serviceCharge?: number;
  vat?: number;
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


const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatLabel = (label: string) => {
  if (label === 'POS') return 'POS';
  return label
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

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

const parseTimeToHours = (timeStr: string) => {
  if (!timeStr) return 0;
  if (timeStr.includes('T')) {
    const date = new Date(timeStr);
    return date.getHours() + date.getMinutes() / 60;
  }
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) + (m || 0) / 60;
};

const SharedBookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, onSubmit, userRole }) => {
  const [activeTab, setActiveTab] = useState('reservation');
  const [venues, setVenues] = useState<HallItem[]>([]);
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [error, setError] = useState('');
  const [hallPrice, setHallPrice] = useState(0);
  const [facilitiesPrice, setFacilitiesPrice] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isCalculatingQuote, setIsCalculatingQuote] = useState(false);
  const [usePerDateTimes, setUsePerDateTimes] = useState(false);
  const [dateTimes, setDateTimes] = useState<Record<string, { startTime: string; endTime: string }>>({});
  const [paymentOptions, setPaymentOptions] = useState<{ paymentMethods: string[]; paymentStatuses: string[] }>({ paymentMethods: [], paymentStatuses: [] });
  const [referralSources, setReferralSources] = useState<ReferralSource[]>([]);
  const [displayedMonth, setDisplayedMonth] = useState(new Date());
  const [recurrencePattern, setRecurrencePattern] = useState<'none' | 'weekly' | 'monthly-fixed' | 'monthly-relative'>('none');
  const [formData, setFormData] = useState({
    hall: '',
    startTime: '',
    endTime: '',
    eventDetails: '',
    startDate: '',
    recurrenceType: 'specific-dates',
    daysOfWeek: [] as number[],
    dayOfMonth: null as number | null,
    dates: [] as string[],
    recurringEndDate: '',
    fullName: '',
    email: '',
    phone: '',
    paymentMethod: 'CASH',
    paymentStatus: 'pending',
    selectedFacilities: [] as { facilityId: string; quantity: number }[],
    manualDiscount: 0,
    referralCode: '',
    referralSource: '',
    referralSourceOther: '',
  });

  const selectedVenueObj = useMemo(() => venues.find(h => h._id === formData.hall) || null, [venues, formData.hall]);
  const selectedDatesArray = useMemo(() => formData.dates.map(date => parseLocalDate(date)), [formData.dates]);
  // @ts-expect-error - selectedVenueObj matches required properties of Venue
  const { getDateAvailability, disabledHours, getDisabledHoursForDate } = useBookingAvailability(selectedVenueObj, selectedDatesArray, displayedMonth);

  const taxDetails = useMemo(() => {
    if (!selectedVenueObj?.isTaxEnabled) return { serviceCharge: 0, vat: 0, totalWithTax: 0 };

    if (quoteData) {
      return {
        serviceCharge: quoteData.serviceCharge || 0,
        vat: quoteData.vat || 0,
        totalWithTax: quoteData.totalPrice || 0
      };
    }

    const baseSubtotal = (hallPrice || 0) + (facilitiesPrice || 0) - (discountAmount || 0);

    const serviceCharge = baseSubtotal * (selectedVenueObj.serviceChargePercentage || 0) / 100;
    const vat = baseSubtotal * (selectedVenueObj.vatPercentage || 0) / 100;

    return {
      serviceCharge,
      vat,
      totalWithTax: baseSubtotal + serviceCharge + vat
    };
  }, [selectedVenueObj, quoteData, hallPrice, facilitiesPrice, discountAmount]);

  const handleBookFullDay = useCallback((checked: boolean) => {
    if (!selectedVenueObj) return;
    const open = `${(selectedVenueObj.openingHour || 0).toString().padStart(2, '0')}:00`;
    const close = `${(selectedVenueObj.closingHour || 24).toString().padStart(2, '0')}:00`;

    if (checked) {
      setFormData(prev => ({ ...prev, startTime: open, endTime: close }));
      if (usePerDateTimes && formData.dates.length > 0) {
        setDateTimes(prev => {
          const updated = { ...prev };
          formData.dates.forEach(date => {
            updated[date] = { startTime: open, endTime: close };
          });
          return updated;
        });
      }
    } else {
      setFormData(prev => ({ ...prev, startTime: '', endTime: '' }));
      if (usePerDateTimes && formData.dates.length > 0) {
        setDateTimes(prev => {
          const updated = { ...prev };
          formData.dates.forEach(date => {
            updated[date] = { startTime: '', endTime: '' };
          });
          return updated;
        });
      }
    }
  }, [selectedVenueObj, usePerDateTimes, formData.dates]);

  const FullDayCheckbox = ({ isChecked, onChange, labelClass = "text-sm", containerClass = "bg-primary/5 p-3 rounded-lg border border-primary/10" }: { isChecked: boolean; onChange: (checked: boolean) => void; labelClass?: string; containerClass?: string }) => {
    const open = (selectedVenueObj?.openingHour || 0).toString().padStart(2, '0') + ':00';
    const close = (selectedVenueObj?.closingHour || 24).toString().padStart(2, '0') + ':00';

    return (
      <label className={`flex items-center font-bold text-primary cursor-pointer hover:opacity-80 transition-opacity ${labelClass} ${containerClass}`}>
        <input
          type="checkbox"
          className="mr-2 h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
          checked={isChecked}
          onChange={(e) => onChange(e.target.checked)}
        />
        Book Full Day ({open} - {close})
      </label>
    );
  };

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
    const checkScroll = () => {
      if (formData.dates.length > 0 && scrollContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const isScrollable = scrollHeight > clientHeight + 10;
        const hasNotScrolledMuch = scrollTop < 50;
        setShowScrollIndicator(isScrollable && hasNotScrolledMuch);
      } else {
        setShowScrollIndicator(false);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      const timeoutId = setTimeout(checkScroll, 500);
      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
        clearTimeout(timeoutId);
      };
    }
  }, [formData.dates, isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Reset form state
      setActiveTab('reservation');
      setHallPrice(0);
      setFacilitiesPrice(0);
      setTotalPrice(0);
      setDiscountAmount(0);
      setUsePerDateTimes(false);
      setDateTimes({});
      setRecurrencePattern('none');
      setFormData({
        hall: '',
        startTime: '',
        endTime: '',
        eventDetails: '',
        startDate: '',
        recurrenceType: 'specific-dates',
        daysOfWeek: [],
        dayOfMonth: null,
        dates: [],
        recurringEndDate: '',
        fullName: '',
        email: '',
        phone: '',
        paymentMethod: 'CASH',
        paymentStatus: 'pending',
        selectedFacilities: [],
        manualDiscount: 0,
        referralCode: '',
        referralSource: '',
        referralSourceOther: '',
      });
      setError('');

      const fetchVenues = async () => {
        try {
          const endpoint = userRole === 'admin' ? '/halls' : '/halls/by-owner';
          const response = await api.get(endpoint);
          setVenues(response.data.data || []);
        } catch (err) {
          console.error('Failed to fetch venues:', err);
          setError(translateError(err));
        }
      };
      fetchVenues();

      const fetchPaymentOptions = async () => {
        try {
          const response = await api.get('/settings/payment-options');
          let data = response.data.data;
          if (userRole === 'vendor') {
            data = {
              ...data,
              paymentStatuses: data.paymentStatuses.filter((s: string) => !['failed', 'refunded'].includes(s))
            };
          }
          setPaymentOptions(data);
        } catch (err: unknown) {
          console.error('Failed to fetch payment options:', err);
          const fallbackStatuses = userRole === 'vendor'
            ? ['pending', 'paid']
            : ['pending', 'paid', 'failed', 'refunded'];
          setPaymentOptions({
            paymentMethods: ['CASH', 'BANK_TRANSFER', 'POS', 'ONLINE', 'CHEQUE'],
            paymentStatuses: fallbackStatuses,
          });
        }
      };

      const fetchReferralSources = async () => {
        try {
          const response = await api.get('/settings/referral-sources');
          const data = response.data.data;
          let sources: ReferralSource[] = [];

          if (Array.isArray(data)) {
            sources = data;
          } else if (data && Array.isArray(data.referralSources)) {
            sources = data.referralSources;
          }

          setReferralSources(sources);

          const defaultSource = sources.find((s: ReferralSource) => s.isDefault);
          if (defaultSource) {
            setFormData(prev => ({ ...prev, referralSource: defaultSource._id }));
          }
        } catch (err) {
          console.error('Failed to fetch referral sources:', err);
        }
      };

      fetchPaymentOptions();
      fetchReferralSources();
    }
  }, [isOpen, userRole]);

  useEffect(() => {
    if (formData.hall) {
      const selectedVenue = venues.find((h) => h._id === formData.hall);
      if (selectedVenue) {
        setFacilities(selectedVenue.facilities);
      }
    }
  }, [formData.hall, venues]);

  useEffect(() => {
    if (formData.paymentMethod?.toUpperCase() === 'ONLINE') {
      setFormData(prev => ({ ...prev, paymentStatus: 'pending' }));
    }
  }, [formData.paymentMethod]);

  useEffect(() => {
    let type = 'specific-dates';
    if (recurrencePattern === 'weekly') type = 'weekly';
    else if (recurrencePattern === 'monthly-fixed' || recurrencePattern === 'monthly-relative') type = 'monthly';

    setFormData(prev => ({ ...prev, recurrenceType: type }));
  }, [recurrencePattern]);

  useEffect(() => {
    const calculateTotalPrice = () => {
      const selectedVenue = venues.find((h) => h._id === formData.hall);
      if (!selectedVenue) {
        setHallPrice(0);
        setFacilitiesPrice(0);
        setTotalPrice(0);
        return;
      }

      let durationInHours = 0;
      let durationInDays = 0;

      if ((activeTab === 'reservation' || activeTab === 'walk-in' || activeTab === 'recurring') && formData.dates.length > 0) {
        durationInDays = formData.dates.length;
        formData.dates.forEach(date => {
          const times = usePerDateTimes && dateTimes[date] ? dateTimes[date] : { startTime: formData.startTime, endTime: formData.endTime };
          if (times.startTime && times.endTime) {
            const [startH, startM] = times.startTime.split(':').map(Number);
            const [endH, endM] = times.endTime.split(':').map(Number);
            const diff = (endH + endM / 60) - (startH + startM / 60);
            if (diff > 0) durationInHours += diff;
          }
        });
      } else if (formData.startTime && formData.endTime) {
        const start = formData.startTime.includes('T') ? new Date(formData.startTime) : new Date(`1970-01-01T${formData.startTime}:00`);
        const end = formData.endTime.includes('T') ? new Date(formData.endTime) : new Date(`1970-01-01T${formData.endTime}:00`);
        durationInHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        durationInDays = Math.ceil(durationInHours / 24) || 1;
      }

      if (durationInHours <= 0 && durationInDays <= 0) {
        setHallPrice(0);
        setFacilitiesPrice(0);
        setTotalPrice(0);
        return;
      }

      const dailyRate = selectedVenue.pricing.dailyRate || 0;
      const hourlyRate = selectedVenue.pricing.hourlyRate || 0;
      const openTime = `${(selectedVenue.openingHour || 0).toString().padStart(2, '0')}:00`;
      const closeTime = `${(selectedVenue.closingHour || 24).toString().padStart(2, '0')}:00`;

      let calculatedHallPrice = 0;
      if ((activeTab === 'reservation' || activeTab === 'walk-in' || activeTab === 'recurring') && formData.dates.length > 0) {
        formData.dates.forEach(date => {
          const times = usePerDateTimes && dateTimes[date] ? dateTimes[date] : { startTime: formData.startTime, endTime: formData.endTime };
          if (times.startTime && times.endTime) {
            const startHours = parseTimeToHours(times.startTime);
            const endHours = parseTimeToHours(times.endTime);
            const openHours = parseTimeToHours(openTime);
            const closeHours = parseTimeToHours(closeTime);

            const isFullDay = startHours === openHours && endHours === closeHours;
            if ((isFullDay || hourlyRate <= 0) && dailyRate > 0) {
              calculatedHallPrice += dailyRate;
            } else if (hourlyRate > 0) {
              const diff = endHours - startHours;
              if (diff > 0) calculatedHallPrice += (hourlyRate * diff);
            }
          }
        });
      } else if (formData.startTime && formData.endTime) {
        const startHours = parseTimeToHours(formData.startTime);
        const endHours = parseTimeToHours(formData.endTime);
        const openHours = parseTimeToHours(openTime);
        const closeHours = parseTimeToHours(closeTime);

        const isFullDay = startHours === openHours && endHours === closeHours;
        const hours = endHours - startHours;
        const days = Math.ceil(hours / 24) || 1;

        if ((isFullDay || hourlyRate <= 0) && dailyRate > 0) {
          calculatedHallPrice = dailyRate * days;
        } else if (hourlyRate > 0) {
          calculatedHallPrice = hourlyRate * (hours > 0 ? hours : 0);
        }
      }
      setHallPrice(calculatedHallPrice);

      let currentFacilitiesPrice = 0;
      formData.selectedFacilities.forEach(sf => {
        const facility = (facilities as FacilityItem[]).find(f => (f.facility?._id || f._id) === sf.facilityId);
        if (facility) {
          const multiplier = facility.chargePerUnit ? sf.quantity : 1;
          switch (facility.chargeMethod) {
            case 'flat':
              currentFacilitiesPrice += facility.cost * multiplier;
              break;
            case 'per_hour':
              currentFacilitiesPrice += facility.cost * multiplier * durationInHours;
              break;
            case 'per_day':
              currentFacilitiesPrice += facility.cost * multiplier * durationInDays;
              break;
            default:
              break;
          }
        }
      });
      setFacilitiesPrice(currentFacilitiesPrice);

      const subTotal = calculatedHallPrice + currentFacilitiesPrice;
      let calculatedDiscount = 0;

      if (activeTab === 'recurring' && selectedVenue.allowRecurringBookings && selectedVenue.recurringBookingDiscount) {
        const { percentage, minBookings } = selectedVenue.recurringBookingDiscount;
        if (formData.dates.length >= minBookings) {
          calculatedDiscount = subTotal * (percentage / 100);
        }
      } else if ((activeTab === 'walk-in' || activeTab === 'reservation') && formData.manualDiscount > 0) {
        calculatedDiscount = subTotal * (formData.manualDiscount / 100);
      }

      setDiscountAmount(calculatedDiscount);
      setTotalPrice(subTotal - calculatedDiscount);
    };

    calculateTotalPrice();
  }, [formData.hall, formData.startTime, formData.endTime, formData.dates, formData.selectedFacilities, venues, facilities, activeTab, usePerDateTimes, dateTimes, formData.manualDiscount]);

  useEffect(() => {
    const fetchQuote = async () => {
      if (!formData.hall || formData.dates.length === 0) {
        setQuoteData(null);
        return;
      }

      // Basic validation for times if not using per-date times
      if (!usePerDateTimes && (!formData.startTime || !formData.endTime)) {
        return;
      }

      setIsCalculatingQuote(true);
      try {
        const bookingDates = formData.dates.map(dateStr => {
          const times = usePerDateTimes && dateTimes[dateStr] ? dateTimes[dateStr] : { startTime: formData.startTime, endTime: formData.endTime };
          if (!times.startTime || !times.endTime) return null;

          const [startH, startM] = times.startTime.split(':').map(Number);
          const [endH, endM] = times.endTime.split(':').map(Number);
          const start = parseLocalDate(dateStr);
          start.setHours(startH, startM, 0, 0);
          const end = parseLocalDate(dateStr);
          end.setHours(endH, endM, 0, 0);

          return {
            startTime: start.toISOString(),
            endTime: end.toISOString(),
          };
        }).filter(Boolean);

        if (bookingDates.length === 0) {
          setIsCalculatingQuote(false);
          return;
        }

        let applicableManualDiscount = 0;

        if (activeTab === 'recurring' && selectedVenueObj?.allowRecurringBookings && selectedVenueObj?.recurringBookingDiscount) {
          if (formData.dates.length >= selectedVenueObj.recurringBookingDiscount.minBookings) {
            applicableManualDiscount = selectedVenueObj.recurringBookingDiscount.percentage;
          }
        } else if (activeTab === 'walk-in' || activeTab === 'reservation') {
          applicableManualDiscount = formData.manualDiscount;
        }

        const payload = {
          hallId: formData.hall,
          bookingDates,
          selectedFacilities: formData.selectedFacilities,
          isRecurring: activeTab === 'recurring' || formData.dates.length > 1,
          manualDiscount: applicableManualDiscount,
          paymentMethod: formData.paymentMethod
        };

        const response = await api.post('/bookings/calculate-quote', payload);
        setQuoteData(response.data.data);
      } catch (err) {
        console.error('Failed to fetch quote:', err);
      } finally {
        setIsCalculatingQuote(false);
      }
    };

    const timer = setTimeout(() => {
      fetchQuote();
    }, 500); // Debounce quote calculation

    return () => clearTimeout(timer);
  }, [formData.hall, formData.dates, formData.startTime, formData.endTime, formData.selectedFacilities, formData.paymentMethod, activeTab, usePerDateTimes, dateTimes, formData.manualDiscount, selectedVenueObj?.allowRecurringBookings, selectedVenueObj?.recurringBookingDiscount]);

  const generateRecurringDates = useCallback((startDate: Date, endDate: Date, pattern: string) => {
    if (!startDate || !endDate || endDate < startDate || pattern === 'none') return [startDate];

    const dates: Date[] = [];
    let current = startDate;

    if (pattern === 'weekly') {
      const targetDay = getDay(startDate);
      const interval = eachDayOfInterval({ start: startDate, end: endDate });
      return interval.filter(d => getDay(d) === targetDay);
    } else if (pattern === 'monthly-fixed') {
      let n = 0;
      while (current <= endDate) {
        dates.push(current);
        n++;
        current = addMonths(startDate, n);
        if (current > endDate) break;
      }
    } else if (pattern === 'monthly-relative') {
      const targetDay = getDay(startDate);
      const targetNth = Math.floor((getDate(startDate) - 1) / 7) + 1;

      while (current <= endDate) {
        dates.push(current);
        const nextMonth = startOfMonth(addMonths(current, 1));
        let found = false;
        let count = 0;
        for (let i = 0; i < 31; i++) {
          const d = addDays(nextMonth, i);
          if (d.getMonth() !== nextMonth.getMonth()) break;
          if (getDay(d) === targetDay) {
            count++;
            if (count === targetNth) {
              current = d;
              found = true;
              break;
            }
          }
        }
        if (!found || current > endDate) break;
      }
    }
    return dates;
  }, []);

  const applyRecurrence = useCallback(() => {
    if (formData.dates.length === 0 || recurrencePattern === 'none' || !formData.recurringEndDate) return;

    const startDate = parseLocalDate(formData.dates[0]);
    const endDate = parseLocalDate(formData.recurringEndDate);

    const newDates = generateRecurringDates(startDate, endDate, recurrencePattern);

    let daysOfWeek = formData.daysOfWeek;
    let dayOfMonth = formData.dayOfMonth;

    if (recurrencePattern === 'weekly') {
      daysOfWeek = [getDay(startDate)];
    } else if (recurrencePattern === 'monthly-fixed') {
      dayOfMonth = getDate(startDate);
    }

    setFormData(prev => ({
      ...prev,
      dates: newDates.map(d => format(d, 'yyyy-MM-dd')),
      daysOfWeek,
      dayOfMonth
    }));

    Swal.fire({
      icon: 'success',
      title: 'Pattern Applied',
      text: `${newDates.length} dates have been generated.`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000
    });
  }, [formData.dates, formData.recurringEndDate, recurrencePattern, generateRecurringDates, formData.daysOfWeek, formData.dayOfMonth]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const removeDate = (dateToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      dates: prev.dates.filter(d => d !== dateToRemove)
    }));
    const newDateTimes = { ...dateTimes };
    delete newDateTimes[dateToRemove];
    setDateTimes(newDateTimes);
  };

  const handleDateTimeChange = (dateStr: string, field: 'startTime' | 'endTime', value: string) => {
    setDateTimes(prev => ({
      ...prev,
      [dateStr]: {
        ...(prev[dateStr] || { startTime: formData.startTime, endTime: formData.endTime }),
        [field]: value
      }
    }));
  };

  const generateBookingDates = (dates: string[], usePerDateTimes: boolean, dateTimes: Record<string, { startTime: string; endTime: string }>, globalStartTime: string, globalEndTime: string) => {
    const bookingDates = [];
    for (const dateStr of dates) {
      const times = usePerDateTimes && dateTimes[dateStr] ? dateTimes[dateStr] : { startTime: globalStartTime, endTime: globalEndTime };
      const [startH, startM] = times.startTime.split(':').map(Number);
      const [endH, endM] = times.endTime.split(':').map(Number);
      const start = parseLocalDate(dateStr);
      start.setHours(startH, startM, 0, 0);
      const end = parseLocalDate(dateStr);
      end.setHours(endH, endM, 0, 0);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error(`Invalid date or time selection for ${dateStr}.`);
      }

      bookingDates.push({
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });
    }
    return bookingDates;
  };

  const showConfirmation = async (type: 'recurring' | 'walk-in' | 'reservation') => {
    const selectedVenue = venues.find(v => v._id === formData.hall);
    const displayDates = formData.dates.length > 5
      ? `${formData.dates.slice(0, 5).join(', ')} ... (+${formData.dates.length - 5} more)`
      : formData.dates.join(', ');

    const total = (quoteData?.feeBreakdown.totalAmount || totalPrice).toLocaleString();
    const reservationFee = (type === 'reservation' && quoteData?.reservationFeeDetails)
      ? `<p><strong>Reservation Fee:</strong> ₦${quoteData.reservationFeeDetails.totalAmount.toLocaleString()}</p>`
      : '';

    const title = type === 'reservation' ? 'Confirm Reservation' : 'Confirm Booking';
    const actionText = type === 'reservation' ? 'Reserve it!' : 'Create it!';

    const result = await Swal.fire({
      title,
      html: `
        <div class="text-left space-y-2 text-sm">
          <p><strong>Venue:</strong> ${selectedVenue?.name || 'N/A'}</p>
          <p><strong>Customer:</strong> ${formData.fullName || 'N/A'}</p>
          <p><strong>Dates:</strong> ${displayDates}</p>
          <p><strong>Total Price:</strong> ₦${total}</p>
          ${reservationFee}
          <p class="mt-4 text-xs text-gray-500">Are you sure you want to create this ${type}?</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Yes, ${actionText}`,
      cancelButtonText: 'No, Cancel',
      confirmButtonColor: '#295FA7',
    });

    return result.isConfirmed;
  };

  const handleRecurringSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const {
      hall: venue,
      startTime,
      endTime,
      eventDetails,
      recurrenceType,
      daysOfWeek,
      dayOfMonth,
      dates,
      recurringEndDate,
      fullName,
      email,
      phone,
      paymentMethod,
      paymentStatus,
      selectedFacilities,
      referralCode,
      referralSource,
      referralSourceOther,
    } = formData;

    if (dates.length === 0) {
      setError('Please select at least one date for recurring booking.');
      return;
    }

    if (usePerDateTimes) {
      for (const dateStr of dates) {
        const times = dateTimes[dateStr];
        if (!times || !times.startTime || !times.endTime) {
          setError(`Please select start and end times for ${dateStr}.`);
          return;
        }
      }
    } else if (!startTime || !endTime) {
      setError('Please select start and end times.');
      return;
    }

    if (!(await showConfirmation('recurring'))) return;

    const walkInUserDetails = { fullName, email, phone };
    let bookingDates;
    try {
      bookingDates = generateBookingDates(dates, usePerDateTimes, dateTimes, startTime, endTime);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      return;
    }

    let applicableDiscount = 0;
    if (selectedVenueObj?.allowRecurringBookings && selectedVenueObj?.recurringBookingDiscount) {
      if (dates.length >= selectedVenueObj.recurringBookingDiscount.minBookings) {
        applicableDiscount = selectedVenueObj.recurringBookingDiscount.percentage;
      }
    }

    const bookingPayload: Record<string, unknown> = {
      hallId: venue,
      eventDetails,
      walkInUserDetails,
      paymentMethod,
      paymentStatus,
      selectedFacilities,
      bookingDates,
      startTime: bookingDates[0].startTime,
      endTime: bookingDates[0].endTime,
      manualDiscount: applicableDiscount,
      discountPercentage: applicableDiscount,
      referralCode,
      referralSource,
      referralSourceOther,
    };

    if (recurrenceType === 'weekly' || recurrenceType === 'monthly') {
      const recurrenceRule: Record<string, unknown> = {
        endDate: recurringEndDate || format(parseISO(bookingDates[bookingDates.length - 1].endTime), 'yyyy-MM-dd'),
      };
      if (recurrenceType === 'weekly') {
        recurrenceRule.frequency = 'weekly';
        recurrenceRule.daysOfWeek = daysOfWeek;
      } else { // monthly
        recurrenceRule.frequency = 'monthly';
        recurrenceRule.dayOfMonth = dayOfMonth;
      }
      bookingPayload.recurrenceRule = recurrenceRule;
    }

    setError('');
    onSubmit(bookingPayload, 'recurring');
  };

  const handleFacilityChange = (facility: FacilityItem) => {
    setFormData((prev) => {
      const selectedFacilities = prev.selectedFacilities;
      const facilityIdToUse = facility.facility?._id || facility._id;
      if (!facilityIdToUse) return prev;

      const isSelected = selectedFacilities.some((f) => f.facilityId === facilityIdToUse);
      if (isSelected) {
        return {
          ...prev,
          selectedFacilities: selectedFacilities.filter((f) => f.facilityId !== facilityIdToUse),
        };
      } else {
        return {
          ...prev,
          selectedFacilities: [...selectedFacilities, { facilityId: facilityIdToUse, quantity: 1 }],
        };
      }
    });
  };

  const handleQuantityChange = (facilityId: string, quantity: number) => {
    const newQuantity = Math.max(1, quantity);
    setFormData((prev) => ({
      ...prev,
      selectedFacilities: prev.selectedFacilities.map((f) =>
        f.facilityId === facilityId ? { ...f, quantity: newQuantity } : f
      ),
    }));
  };

  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { hall: venue, startTime, endTime, dates, eventDetails, fullName, email, phone, paymentMethod, paymentStatus, selectedFacilities, referralCode, referralSource, referralSourceOther } = formData;

    if (dates.length === 0) {
      setError('Please select at least one date.');
      return;
    }

    if (usePerDateTimes) {
      for (const dateStr of dates) {
        const times = dateTimes[dateStr];
        if (!times || !times.startTime || !times.endTime) {
          setError(`Please select start and end times for ${dateStr}.`);
          return;
        }
      }
    } else if (!startTime || !endTime) {
      setError('Please select start and end times.');
      return;
    }

    if (!(await showConfirmation('walk-in'))) return;
    setError('');

    const walkInUserDetails = { fullName, email, phone };
    let bookingDates;
    try {
      bookingDates = generateBookingDates(dates, usePerDateTimes, dateTimes, startTime, endTime);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      return;
    }

    onSubmit({
      hallId: venue,
      bookingDates,
      startTime: bookingDates[0].startTime,
      endTime: bookingDates[0].endTime,
      eventDetails,
      walkInUserDetails,
      paymentMethod,
      paymentStatus,
      selectedFacilities,
      manualDiscount: formData.manualDiscount,
      discountPercentage: formData.manualDiscount,
      referralCode,
      referralSource,
      referralSourceOther,
    }, 'walk-in');
  };

  const handleReservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { hall: venue, startTime, endTime, dates, eventDetails, fullName, email, phone, paymentMethod, paymentStatus, selectedFacilities, referralCode, referralSource, referralSourceOther } = formData;

    if (dates.length === 0) {
      setError('Please select at least one date.');
      return;
    }

    if (usePerDateTimes) {
      for (const dateStr of dates) {
        const times = dateTimes[dateStr];
        if (!times || !times.startTime || !times.endTime) {
          setError(`Please select start and end times for ${dateStr}.`);
          return;
        }
      }
    } else if (!startTime || !endTime) {
      setError('Please select start and end times.');
      return;
    }

    if (!(await showConfirmation('reservation'))) return;
    setError('');

    const walkInUserDetails = { fullName, email, phone };
    let bookingDates;
    try {
      bookingDates = generateBookingDates(dates, usePerDateTimes, dateTimes, startTime, endTime);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      return;
    }

    onSubmit({
      hallId: venue,
      bookingDates,
      startTime: bookingDates[0].startTime,
      endTime: bookingDates[0].endTime,
      eventDetails,
      walkInUserDetails,
      paymentMethod,
      paymentStatus,
      selectedFacilities,
      manualDiscount: formData.manualDiscount,
      discountPercentage: formData.manualDiscount,
      referralCode,
      referralSource,
      referralSourceOther,
    }, 'reservation');
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
        ref={scrollContainerRef}
        className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2 rounded-xl transition-all cursor-pointer"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Create <span className="text-primary not-italic">Booking</span></h2>
          <p className="text-sm text-gray-500 font-medium">Schedule a new event on the platform.</p>
        </div>
        {showScrollIndicator && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[110] pointer-events-none animate-bounce flex flex-col items-center">
            <span className="bg-primary/90 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg mb-2 uppercase tracking-widest backdrop-blur-sm">
              Scroll for Submit
            </span>
            <div className="bg-primary p-2 rounded-full shadow-xl">
              <ChevronDown className="h-6 w-6 text-white" />
            </div>
          </div>
        )}
        <div className="flex bg-gray-50 p-1.5 rounded-2xl mb-8 border border-gray-100">
          <button
            className={`flex-1 px-2 sm:px-4 py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest transition-all rounded-xl ${activeTab === 'recurring' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => setActiveTab('recurring')}
          >
            Recurring
          </button>
          <button
            className={`flex-1 px-2 sm:px-4 py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest transition-all rounded-xl ${activeTab === 'walk-in' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => setActiveTab('walk-in')}
          >
            Walk-in
          </button>
          <button
            className={`flex-1 px-2 sm:px-4 py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest transition-all rounded-xl ${activeTab === 'reservation' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => setActiveTab('reservation')}
          >
            Reservation
          </button>
        </div>
        {error && <p className="mb-4 bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-bold border border-rose-100 animate-pulse">{error}</p>}
        <div>
          {activeTab === 'reservation' && (
            <form onSubmit={handleReservationSubmit} className="space-y-4">
               <div>
                <label className="block text-sm font-medium text-gray-800">Venue</label>
                <select name="hall" value={formData.hall} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900">
                  <option value="">Select a venue</option>
                  {venues.map((venue: HallItem) => (
                    <option key={venue._id} value={venue._id}>
                      {venue.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800">Select Dates</label>
                <Calendar
                  unavailableDates={[]}
                  disableToday={true}
                  getDateAvailability={getDateAvailability}
                  selectedDates={formData.dates.map(date => parseLocalDate(date))}
                  displayedMonth={displayedMonth}
                  onMonthChange={setDisplayedMonth}
                  onChange={(dates) => {
                    if (dates) {
                      setFormData(prev => ({
                        ...prev,
                        dates: dates.map(d => format(d, 'yyyy-MM-dd'))
                      }));
                    }
                  }}
                />
                <AvailabilityLegend />
              </div>

              {!usePerDateTimes && (
                <div className="space-y-4">
                  <FullDayCheckbox
                    isChecked={formData.startTime === `${(selectedVenueObj?.openingHour || 0).toString().padStart(2, '0')}:00` && formData.endTime === `${(selectedVenueObj?.closingHour || 24).toString().padStart(2, '0')}:00`}
                    onChange={handleBookFullDay}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-800">Start Time</label>
                      <select
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-1 focus:ring-primary outline-none"
                      >
                        <option value="">Select Time</option>
                        {selectedVenueObj && generateTimeOptions(selectedVenueObj.openingHour || 0, selectedVenueObj.closingHour || 24, disabledHours)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800">End Time</label>
                      <select
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-1 focus:ring-primary outline-none"
                      >
                        <option value="">Select Time</option>
                        {selectedVenueObj && generateTimeOptions(selectedVenueObj.openingHour || 0, selectedVenueObj.closingHour || 24, disabledHours)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {formData.dates.length > 1 && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="usePerDateTimesRes"
                    checked={usePerDateTimes}
                    onChange={(e) => setUsePerDateTimes(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="usePerDateTimesRes" className="text-sm font-medium text-gray-800">
                    Set different times for each date
                  </label>
                </div>
              )}

              {usePerDateTimes && formData.dates.length > 0 && (
                <div className="space-y-4 p-4 border rounded-md bg-gray-50 max-h-60 overflow-y-auto">
                  <h4 className="text-sm font-semibold text-gray-800">Date-specific Times</h4>
                  {formData.dates.map((dateStr) => {
                    const times = dateTimes[dateStr] || { startTime: formData.startTime, endTime: formData.endTime };
                    const dateDisabledHours = getDisabledHoursForDate(parseLocalDate(dateStr));
                    const open = `${(selectedVenueObj?.openingHour || 0).toString().padStart(2, '0')}:00`;
                    const close = `${(selectedVenueObj?.closingHour || 24).toString().padStart(2, '0')}:00`;
                    const isFullDay = times.startTime === open && times.endTime === close;

                    return (
                      <div key={dateStr} className="flex flex-col space-y-2 border-b pb-2 last:border-b-0">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-600">{dateStr}</span>
                          <FullDayCheckbox
                            isChecked={isFullDay}
                            containerClass=""
                            labelClass="text-[10px]"
                            onChange={(checked) => {
                              if (checked) {
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
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <select
                              value={times.startTime}
                              onChange={(e) => handleDateTimeChange(dateStr, 'startTime', e.target.value)}
                              className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-1 focus:ring-primary outline-none"
                            >
                              <option value="">Start</option>
                              {selectedVenueObj && generateTimeOptions(selectedVenueObj.openingHour || 0, selectedVenueObj.closingHour || 24, dateDisabledHours)}
                            </select>
                          </div>
                          <div>
                            <select
                              value={times.endTime}
                              onChange={(e) => handleDateTimeChange(dateStr, 'endTime', e.target.value)}
                              className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-1 focus:ring-primary outline-none"
                            >
                              <option value="">End</option>
                              {selectedVenueObj && generateTimeOptions(selectedVenueObj.openingHour || 0, selectedVenueObj.closingHour || 24, dateDisabledHours)}
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800">Event Details</label>
                  <input type="text" name="eventDetails" placeholder="Enter Event Details" value={formData.eventDetails} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800">Discount Percentage (%)</label>
                  <input
                    type="number"
                    name="manualDiscount"
                    placeholder="e.g. 10"
                    min="0"
                    max="100"
                    value={formData.manualDiscount}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>
              <fieldset className="border p-4 rounded-md">
                <legend className="text-lg font-medium text-gray-800">Walk-in User Details</legend>
                <div>
                  <label className="block text-sm font-medium text-gray-800">Full Name</label>
                  <input type="text" name="fullName" placeholder="Enter Full Name" value={formData.fullName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800">Email</label>
                  <input type="email" name="email" placeholder="Enter Email Address" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800">Phone</label>
                  <input type="tel" name="phone" placeholder="Enter Phone Number" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900" />
                </div>
              </fieldset>
              <fieldset className="border p-4 rounded-md">
                <legend className="text-sm font-bold text-primary uppercase tracking-widest px-2">Referral Tracking</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Referral Code</label>
                    <input
                      type="text"
                      name="referralCode"
                      placeholder="e.g. GBK-123"
                      value={formData.referralCode}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Referral Source</label>
                    <select
                      name="referralSource"
                      value={formData.referralSource}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:ring-1 focus:ring-primary outline-none"
                    >
                      <option value="">Select Source</option>
                      {referralSources.map(source => (
                        <option key={source._id} value={source._id}>{source.name}</option>
                      ))}
                    </select>
                  </div>
                  {formData.referralSource === 'others' && (
                    <div className="col-span-full">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Specify Other Source</label>
                      <input
                        type="text"
                        name="referralSourceOther"
                        placeholder="Please specify..."
                        value={formData.referralSourceOther}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                  )}
                </div>
              </fieldset>
              <div>
                <label className="block text-sm font-medium text-gray-800">Facilities</label>
                <div className="max-h-48 overflow-y-auto pr-2">
                  <div className="grid grid-cols-1 gap-y-3">
                    {facilities.map((facility) => {
                      const facilityIdToUse = facility.facility?._id || facility._id;
                      if (!facilityIdToUse) return null;
                      const isSelected = formData.selectedFacilities.some(f => f.facilityId === facilityIdToUse);
                      const selectedFacility = formData.selectedFacilities.find(f => f.facilityId === facilityIdToUse);
                      return (
                        <div key={facility._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                          <label className="flex items-center space-x-3 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-[#295FA7] focus:ring-[#295FA7]"
                              checked={isSelected}
                              onChange={() => handleFacilityChange(facility)}
                            />
                            <span className="text-gray-700">
                              {facility.facility?.name || facility.name}
                              {facility.variantName && (
                                <span className="text-gray-500 text-xs ml-1 font-normal">({facility.variantName})</span>
                              )}
                            </span>
                            <span className="text-gray-500 font-medium">
                              + ₦{facility.cost.toLocaleString()}{facility.chargeMethod === 'per_day' ? '/day' : (facility.chargeMethod === 'per_hour' ? '/hour' : '')}
                            </span>
                          </label>
                          {isSelected && (
                            <div className="w-24">
                              <select
                                value={selectedFacility?.quantity || 1}
                                onChange={(e) => handleQuantityChange(facilityIdToUse, parseInt(e.target.value, 10))}
                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#295FA7]"
                              >
                                {Array.from({ length: facility.quantity || 1 }, (_, i) => i + 1).map(n => (
                                  <option key={n} value={n}>{n}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800">Payment Method</label>
                  <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900">
                    {paymentOptions.paymentMethods.map((method: string) => (
                      <option key={method} value={method}>
                        {formatLabel(method)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800">Payment Status</label>
                  <select
                    name="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={handleChange}
                    disabled={formData.paymentMethod.toUpperCase() === 'ONLINE'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {paymentOptions.paymentStatuses.map((status: string) => (
                      <option key={status} value={status}>
                        {formatLabel(status)}
                      </option>
                    ))}
                  </select>
                  {formData.paymentMethod.toUpperCase() === 'ONLINE' && (
                    <p className="text-[10px] text-amber-600 mt-1 font-medium italic">Online payments must start as &apos;pending&apos;.</p>
                  )}
                </div>
              </div>


              <div className="mt-8 pt-6 border-t border-gray-100">
                {isCalculatingQuote ? (
                  <div className="flex items-center gap-2 text-primary">
                    <CustomLoader size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Recalculating Quote...</span>
                  </div>
                ) : quoteData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Venue Rental:</span>
                        <span className="font-bold text-gray-900">₦{quoteData.hallPrice.toLocaleString()}</span>
                      </div>
                      {quoteData.facilitiesPrice > 0 && (
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Facilities:</span>
                          <span className="font-bold text-gray-900">₦{quoteData.facilitiesPrice.toLocaleString()}</span>
                        </div>
                      )}
                      {quoteData.discountAmount > 0 && (
                        <div className="flex justify-between text-xs text-green-600">
                          <span>Discount:</span>
                          <span className="font-bold">-₦{quoteData.discountAmount.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedVenueObj?.isTaxEnabled && (selectedVenueObj.serviceChargePercentage || 0) > 0 && (
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Service Charge ({selectedVenueObj.serviceChargePercentage}%):</span>
                          <span className="font-bold text-gray-900">₦{taxDetails.serviceCharge.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedVenueObj?.isTaxEnabled && (selectedVenueObj.vatPercentage || 0) > 0 && (
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>VAT ({selectedVenueObj.vatPercentage}%):</span>
                          <span className="font-bold text-gray-900">₦{taxDetails.vat.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[10px] text-amber-600">
                        <span>Transaction Fee:</span>
                        <span className="font-bold">Transaction fees may apply</span>
                      </div>
                    </div>
                    <div className="flex flex-col justify-end space-y-3">
                      <div className="text-right">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Total Amount Due</span>
                        <span className="text-3xl font-black text-primary italic leading-none">
                          ₦{(selectedVenueObj?.isTaxEnabled ? taxDetails.totalWithTax : (quoteData.feeBreakdown?.serviceTotal || quoteData.totalPrice)).toLocaleString()}
                        </span>
                        <p className="text-[10px] text-gray-400 font-medium mt-1">Excludes transaction fees</p>
                      </div>
                      {quoteData.reservationFeeDetails && (
                        <div className="text-right bg-primary/5 p-3 rounded-2xl border border-primary/10">
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest block mb-1">Part Payment ({quoteData.reservationFeeDetails.percentage}%)</span>
                          <span className="text-xl font-black text-primary">₦{quoteData.reservationFeeDetails.serviceTotal.toLocaleString()}</span>
                          <p className="text-[10px] text-primary/60 font-medium">Excludes transaction fees</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm">Venue Price: ₦{hallPrice.toLocaleString()}</div>
                      <div className="text-sm">Facilities Price: ₦{facilitiesPrice.toLocaleString()}</div>
                      {discountAmount > 0 && (
                        <div className="text-sm text-green-600 font-medium">Discount Applied: -₦{discountAmount.toLocaleString()}</div>
                      )}
                      <div className="text-sm font-bold">Total Price: ₦{totalPrice.toLocaleString()}</div>
                    </div>
                  </div>
                )}
                <div className="flex justify-end mt-6">
                  <button type="submit" disabled={isCalculatingQuote || formData.dates.length === 0} className="px-8 py-4 rounded-2xl text-white bg-primary hover:bg-primary/90 font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50">
                    Reserve with Part Payment
                  </button>
                </div>
              </div>
            </form>
          )}
          {activeTab === 'recurring' && (
            <form onSubmit={handleRecurringSubmit} className="space-y-4">
               <div>
                <label className="block text-sm font-medium text-gray-800">Venue</label>
                <select name="hall" value={formData.hall} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900">
                  <option value="">Select a venue</option>
                  {venues.map((venue: HallItem) => (
                    <option key={venue._id} value={venue._id}>
                      {venue.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800">Event Details</label>
                <input type="text" name="eventDetails" placeholder="Enter Event Details" value={formData.eventDetails} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800">Select Dates</label>
                <p className="text-xs text-gray-500 mb-2">Select the starting date first, then apply a repeat pattern if needed.</p>
                <Calendar
                  unavailableDates={[]}
                  disableToday={true}
                  getDateAvailability={getDateAvailability}
                  selectedDates={formData.dates.map(date => parseLocalDate(date))}
                  displayedMonth={displayedMonth}
                  onMonthChange={setDisplayedMonth}
                  onChange={(dates) => {
                    if (dates) {
                      setFormData(prev => ({
                        ...prev,
                        dates: dates.map(d => format(d, 'yyyy-MM-dd'))
                      }));
                    }
                  }}
                />
                <AvailabilityLegend />
              </div>

              {formData.dates.length > 0 && (
                <div className="p-4 border rounded-md bg-blue-50 space-y-3">
                   <label className="block text-sm font-bold text-gray-800">Repeat this booking?</label>
                   <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setRecurrencePattern('none')} className={`px-3 py-2 text-sm rounded transition-colors ${recurrencePattern === 'none' ? 'bg-primary text-white font-semibold' : 'bg-white border text-gray-700 hover:bg-gray-50'}`}>No Repeat</button>
                      <button type="button" onClick={() => setRecurrencePattern('weekly')} className={`px-3 py-2 text-sm rounded transition-colors ${recurrencePattern === 'weekly' ? 'bg-primary text-white font-semibold' : 'bg-white border text-gray-700 hover:bg-gray-50'}`}>Weekly</button>
                      <button type="button" onClick={() => setRecurrencePattern('monthly-fixed')} className={`px-3 py-2 text-sm rounded transition-colors ${recurrencePattern === 'monthly-fixed' ? 'bg-primary text-white font-semibold' : 'bg-white border text-gray-700 hover:bg-gray-50'}`}>Monthly (Fixed Date)</button>
                      <button type="button" onClick={() => setRecurrencePattern('monthly-relative')} className={`px-3 py-2 text-sm rounded transition-colors ${recurrencePattern === 'monthly-relative' ? 'bg-primary text-white font-semibold' : 'bg-white border text-gray-700 hover:bg-gray-50'}`}>Monthly (Relative Day)</button>
                   </div>

                   {recurrencePattern !== 'none' && (
                     <div className="mt-2 space-y-2">
                        <label className="block text-sm font-medium text-gray-800">Repeat Until</label>
                        <input
                          type="date"
                          name="recurringEndDate"
                          value={formData.recurringEndDate}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900"
                        />
                        <button
                          type="button"
                          onClick={applyRecurrence}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-bold shadow-sm transition-colors"
                        >
                          Generate & Apply Pattern
                        </button>
                        <p className="text-[10px] text-gray-500 italic">This will populate the calendar based on the first selected date.</p>
                     </div>
                   )}
                </div>
              )}

              {!usePerDateTimes && (
                <div className="space-y-4">
                  <FullDayCheckbox
                    isChecked={formData.startTime === `${(selectedVenueObj?.openingHour || 0).toString().padStart(2, '0')}:00` && formData.endTime === `${(selectedVenueObj?.closingHour || 24).toString().padStart(2, '0')}:00`}
                    onChange={handleBookFullDay}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-800">Start Time</label>
                      <select
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-1 focus:ring-primary outline-none"
                      >
                        <option value="">Select Time</option>
                        {selectedVenueObj && generateTimeOptions(selectedVenueObj.openingHour || 0, selectedVenueObj.closingHour || 24, disabledHours)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800">End Time</label>
                      <select
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-1 focus:ring-primary outline-none"
                      >
                        <option value="">Select Time</option>
                        {selectedVenueObj && generateTimeOptions(selectedVenueObj.openingHour || 0, selectedVenueObj.closingHour || 24, disabledHours)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {formData.dates.length > 1 && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="usePerDateTimesRec"
                    checked={usePerDateTimes}
                    onChange={(e) => setUsePerDateTimes(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="usePerDateTimesRec" className="text-sm font-medium text-gray-800">
                    Set different times for each date
                  </label>
                </div>
              )}

              {formData.dates.length > 0 && (
                <div className="space-y-4 p-4 border rounded-md bg-gray-50 max-h-60 overflow-y-auto">
                  <h4 className="text-sm font-semibold text-gray-800">Selected Dates & Times</h4>
                  {formData.dates.map((dateStr) => {
                    const times = dateTimes[dateStr] || { startTime: formData.startTime, endTime: formData.endTime };
                    const open = `${(selectedVenueObj?.openingHour || 0).toString().padStart(2, '0')}:00`;
                    const close = `${(selectedVenueObj?.closingHour || 24).toString().padStart(2, '0')}:00`;
                    const isFullDay = times.startTime === open && times.endTime === close;

                    return (
                      <div key={dateStr} className="flex flex-col space-y-2 border-b pb-2 last:border-b-0">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-gray-600">{dateStr}</span>
                            <FullDayCheckbox
                              isChecked={isFullDay}
                              containerClass=""
                              labelClass="text-[10px]"
                              onChange={(checked) => {
                                if (checked) {
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
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDate(dateStr)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Remove date"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        {usePerDateTimes && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <select
                                value={times.startTime}
                                onChange={(e) => handleDateTimeChange(dateStr, 'startTime', e.target.value)}
                                className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-1 focus:ring-primary outline-none"
                              >
                                <option value="">Start</option>
                                {selectedVenueObj && generateTimeOptions(selectedVenueObj.openingHour || 0, selectedVenueObj.closingHour || 24, getDisabledHoursForDate(parseLocalDate(dateStr)))}
                              </select>
                            </div>
                            <div>
                              <select
                                value={times.endTime}
                                onChange={(e) => handleDateTimeChange(dateStr, 'endTime', e.target.value)}
                                className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-1 focus:ring-primary outline-none"
                              >
                                <option value="">End</option>
                                {selectedVenueObj && generateTimeOptions(selectedVenueObj.openingHour || 0, selectedVenueObj.closingHour || 24, getDisabledHoursForDate(parseLocalDate(dateStr)))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <fieldset className="border p-4 rounded-md">
                <legend className="text-lg font-medium text-gray-800">User Details</legend>
                <div>
                  <label className="block text-sm font-medium text-gray-800">Full Name</label>
                  <input type="text" name="fullName" placeholder="Enter Full Name" value={formData.fullName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800">Email</label>
                  <input type="email" name="email" placeholder="Enter Email Address" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800">Phone</label>
                  <input type="tel" name="phone" placeholder="Enter Phone Number" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900" />
                </div>
              </fieldset>
              <fieldset className="border p-4 rounded-md">
                <legend className="text-sm font-bold text-primary uppercase tracking-widest px-2">Referral Tracking</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Referral Code</label>
                    <input
                      type="text"
                      name="referralCode"
                      placeholder="e.g. GBK-123"
                      value={formData.referralCode}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Referral Source</label>
                    <select
                      name="referralSource"
                      value={formData.referralSource}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:ring-1 focus:ring-primary outline-none"
                    >
                      <option value="">Select Source</option>
                      {referralSources.map(source => (
                        <option key={source._id} value={source._id}>{source.name}</option>
                      ))}
                      <option value="others">Others</option>
                    </select>
                  </div>
                  {formData.referralSource === 'others' && (
                    <div className="col-span-full">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Specify Other Source</label>
                      <input
                        type="text"
                        name="referralSourceOther"
                        placeholder="Please specify..."
                        value={formData.referralSourceOther}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                  )}
                </div>
              </fieldset>

              <div>
                <label className="block text-sm font-medium text-gray-800">Facilities</label>
                <div className="max-h-48 overflow-y-auto pr-2">
                  <div className="grid grid-cols-1 gap-y-3">
                    {facilities.map((facility) => {
                      const facilityIdToUse = facility.facility?._id || facility._id;
                      if (!facilityIdToUse) return null;
                      const isSelected = formData.selectedFacilities.some(f => f.facilityId === facilityIdToUse);
                      const selectedFacility = formData.selectedFacilities.find(f => f.facilityId === facilityIdToUse);
                      return (
                        <div key={facility._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                          <label className="flex items-center space-x-3 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-[#295FA7] focus:ring-[#295FA7]"
                              checked={isSelected}
                              onChange={() => handleFacilityChange(facility)}
                            />
                            <span className="text-gray-700">
                              {facility.facility?.name || facility.name}
                              {facility.variantName && (
                                <span className="text-gray-500 text-xs ml-1 font-normal">({facility.variantName})</span>
                              )}
                            </span>
                            <span className="text-gray-500 font-medium">
                              + ₦{facility.cost.toLocaleString()}{facility.chargeMethod === 'per_day' ? '/day' : (facility.chargeMethod === 'per_hour' ? '/hour' : '')}
                            </span>
                          </label>
                          {isSelected && (
                            <div className="w-24">
                              <select
                                value={selectedFacility?.quantity || 1}
                                onChange={(e) => handleQuantityChange(facilityIdToUse, parseInt(e.target.value, 10))}
                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#295FA7]"
                              >
                                {Array.from({ length: facility.quantity || 1 }, (_, i) => i + 1).map(n => (
                                  <option key={n} value={n}>{n}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800">Payment Method</label>
                  <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900">
                    {paymentOptions.paymentMethods.map((method: string) => (
                      <option key={method} value={method}>
                        {formatLabel(method)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800">Payment Status</label>
                  <select
                    name="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={handleChange}
                    disabled={formData.paymentMethod.toUpperCase() === 'ONLINE'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {paymentOptions.paymentStatuses.map((status: string) => (
                      <option key={status} value={status}>
                        {formatLabel(status)}
                      </option>
                    ))}
                  </select>
                  {formData.paymentMethod.toUpperCase() === 'ONLINE' && (
                    <p className="text-[10px] text-amber-600 mt-1 font-medium italic">Online payments must start as &apos;pending&apos;.</p>
                  )}
                </div>
              </div>


              <div className="mt-8 pt-6 border-t border-gray-100">
                {isCalculatingQuote ? (
                  <div className="flex items-center gap-2 text-primary">
                    <CustomLoader size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Recalculating Quote...</span>
                  </div>
                ) : quoteData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Venue Rental:</span>
                        <span className="font-bold text-gray-900">₦{quoteData.hallPrice.toLocaleString()}</span>
                      </div>
                      {quoteData.facilitiesPrice > 0 && (
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Facilities:</span>
                          <span className="font-bold text-gray-900">₦{quoteData.facilitiesPrice.toLocaleString()}</span>
                        </div>
                      )}
                      {quoteData.discountAmount > 0 && (
                        <div className="flex justify-between text-xs text-green-600">
                          <span>Discount:</span>
                          <span className="font-bold">-₦{quoteData.discountAmount.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedVenueObj?.isTaxEnabled && (selectedVenueObj.serviceChargePercentage || 0) > 0 && (
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Service Charge ({selectedVenueObj.serviceChargePercentage}%):</span>
                          <span className="font-bold text-gray-900">₦{taxDetails.serviceCharge.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedVenueObj?.isTaxEnabled && (selectedVenueObj.vatPercentage || 0) > 0 && (
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>VAT ({selectedVenueObj.vatPercentage}%):</span>
                          <span className="font-bold text-gray-900">₦{taxDetails.vat.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[10px] text-amber-600">
                        <span>Transaction Fee:</span>
                        <span className="font-bold">Transaction fees may apply</span>
                      </div>
                    </div>
                    <div className="flex flex-col justify-end space-y-3">
                      <div className="text-right">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Total Amount Due</span>
                        <span className="text-3xl font-black text-primary italic leading-none">
                          ₦{(selectedVenueObj?.isTaxEnabled ? taxDetails.totalWithTax : (quoteData.feeBreakdown?.serviceTotal || quoteData.totalPrice)).toLocaleString()}
                        </span>
                        <p className="text-[10px] text-gray-400 font-medium mt-1">Excludes transaction fees</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm">Venue Price: ₦{hallPrice.toLocaleString()}</div>
                      <div className="text-sm">Facilities Price: ₦{facilitiesPrice.toLocaleString()}</div>
                      {discountAmount > 0 && (
                        <div className="text-sm text-green-600 font-medium">Discount Applied: -₦{discountAmount.toLocaleString()}</div>
                      )}
                      <div className="text-sm font-bold">Total Price: ₦{totalPrice.toLocaleString()}</div>
                    </div>
                  </div>
                )}
                <div className="flex justify-end mt-6">
                  <button type="submit" disabled={isCalculatingQuote || formData.dates.length === 0} className="px-8 py-4 rounded-2xl text-white bg-primary hover:bg-primary/90 font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50">
                    Create Recurring Booking
                  </button>
                </div>
              </div>
            </form>
          )}
          {activeTab === 'walk-in' && (
            <form onSubmit={handleWalkInSubmit} className="space-y-4">
               <div>
                <label className="block text-sm font-medium text-gray-800">Venue</label>
                <select name="hall" value={formData.hall} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900">
                  <option value="">Select a venue</option>
                  {venues.map((venue: HallItem) => (
                    <option key={venue._id} value={venue._id}>
                      {venue.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800">Select Dates</label>
                <Calendar
                  unavailableDates={[]}
                  disableToday={true}
                  getDateAvailability={getDateAvailability}
                  selectedDates={formData.dates.map(date => parseLocalDate(date))}
                  displayedMonth={displayedMonth}
                  onMonthChange={setDisplayedMonth}
                  onChange={(dates) => {
                    if (dates) {
                      setFormData(prev => ({
                        ...prev,
                        dates: dates.map(d => format(d, 'yyyy-MM-dd'))
                      }));
                    }
                  }}
                />
                <AvailabilityLegend />
              </div>

              {!usePerDateTimes && (
                <div className="space-y-4">
                  <FullDayCheckbox
                    isChecked={formData.startTime === `${(selectedVenueObj?.openingHour || 0).toString().padStart(2, '0')}:00` && formData.endTime === `${(selectedVenueObj?.closingHour || 24).toString().padStart(2, '0')}:00`}
                    onChange={handleBookFullDay}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-800">Start Time</label>
                      <select
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-1 focus:ring-primary outline-none"
                      >
                        <option value="">Select Time</option>
                        {selectedVenueObj && generateTimeOptions(selectedVenueObj.openingHour || 0, selectedVenueObj.closingHour || 24, disabledHours)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800">End Time</label>
                      <select
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-1 focus:ring-primary outline-none"
                      >
                        <option value="">Select Time</option>
                        {selectedVenueObj && generateTimeOptions(selectedVenueObj.openingHour || 0, selectedVenueObj.closingHour || 24, disabledHours)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {formData.dates.length > 1 && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="usePerDateTimesWalk"
                    checked={usePerDateTimes}
                    onChange={(e) => setUsePerDateTimes(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="usePerDateTimesWalk" className="text-sm font-medium text-gray-800">
                    Set different times for each date
                  </label>
                </div>
              )}

              {usePerDateTimes && formData.dates.length > 0 && (
                <div className="space-y-4 p-4 border rounded-md bg-gray-50 max-h-60 overflow-y-auto">
                  <h4 className="text-sm font-semibold text-gray-800">Date-specific Times</h4>
                  {formData.dates.map((dateStr) => {
                    const times = dateTimes[dateStr] || { startTime: formData.startTime, endTime: formData.endTime };
                    const dateDisabledHours = getDisabledHoursForDate(parseLocalDate(dateStr));
                    const open = `${(selectedVenueObj?.openingHour || 0).toString().padStart(2, '0')}:00`;
                    const close = `${(selectedVenueObj?.closingHour || 24).toString().padStart(2, '0')}:00`;
                    const isFullDay = times.startTime === open && times.endTime === close;

                    return (
                      <div key={dateStr} className="flex flex-col space-y-2 border-b pb-2 last:border-b-0">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-600">{dateStr}</span>
                          <FullDayCheckbox
                            isChecked={isFullDay}
                            containerClass=""
                            labelClass="text-[10px]"
                            onChange={(checked) => {
                              if (checked) {
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
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <select
                              value={times.startTime}
                              onChange={(e) => handleDateTimeChange(dateStr, 'startTime', e.target.value)}
                              className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-1 focus:ring-primary outline-none"
                            >
                              <option value="">Start</option>
                              {selectedVenueObj && generateTimeOptions(selectedVenueObj.openingHour || 0, selectedVenueObj.closingHour || 24, dateDisabledHours)}
                            </select>
                          </div>
                          <div>
                            <select
                              value={times.endTime}
                              onChange={(e) => handleDateTimeChange(dateStr, 'endTime', e.target.value)}
                              className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-1 focus:ring-primary outline-none"
                            >
                              <option value="">End</option>
                              {selectedVenueObj && generateTimeOptions(selectedVenueObj.openingHour || 0, selectedVenueObj.closingHour || 24, dateDisabledHours)}
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800">Event Details</label>
                  <input type="text" name="eventDetails" placeholder="Enter Event Details" value={formData.eventDetails} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800">Discount Percentage (%)</label>
                  <input
                    type="number"
                    name="manualDiscount"
                    placeholder="e.g. 10"
                    min="0"
                    max="100"
                    value={formData.manualDiscount}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>
              <fieldset className="border p-4 rounded-md">
                <legend className="text-lg font-medium text-gray-800">Walk-in User Details</legend>
                <div>
                  <label className="block text-sm font-medium text-gray-800">Full Name</label>
                  <input type="text" name="fullName" placeholder="Enter Full Name" value={formData.fullName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800">Email</label>
                  <input type="email" name="email" placeholder="Enter Email Address" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800">Phone</label>
                  <input type="tel" name="phone" placeholder="Enter Phone Number" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900" />
                </div>
              </fieldset>
              <fieldset className="border p-4 rounded-md">
                <legend className="text-sm font-bold text-primary uppercase tracking-widest px-2">Referral Tracking</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Referral Code</label>
                    <input
                      type="text"
                      name="referralCode"
                      placeholder="e.g. GBK-123"
                      value={formData.referralCode}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Referral Source</label>
                    <select
                      name="referralSource"
                      value={formData.referralSource}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:ring-1 focus:ring-primary outline-none"
                    >
                      <option value="">Select Source</option>
                      {referralSources.map(source => (
                        <option key={source._id} value={source._id}>{source.name}</option>
                      ))}
                      <option value="others">Others</option>
                    </select>
                  </div>
                  {formData.referralSource === 'others' && (
                    <div className="col-span-full">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Specify Other Source</label>
                      <input
                        type="text"
                        name="referralSourceOther"
                        placeholder="Please specify..."
                        value={formData.referralSourceOther}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                  )}
                </div>
              </fieldset>
              <div>
                <label className="block text-sm font-medium text-gray-800">Facilities</label>
                <div className="max-h-48 overflow-y-auto pr-2">
                  <div className="grid grid-cols-1 gap-y-3">
                    {facilities.map((facility) => {
                      const facilityIdToUse = facility.facility?._id || facility._id;
                      if (!facilityIdToUse) return null;
                      const isSelected = formData.selectedFacilities.some(f => f.facilityId === facilityIdToUse);
                      const selectedFacility = formData.selectedFacilities.find(f => f.facilityId === facilityIdToUse);
                      return (
                        <div key={facility._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                          <label className="flex items-center space-x-3 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-[#295FA7] focus:ring-[#295FA7]"
                              checked={isSelected}
                              onChange={() => handleFacilityChange(facility)}
                            />
                            <span className="text-gray-700">
                              {facility.facility?.name || facility.name}
                              {facility.variantName && (
                                <span className="text-gray-500 text-xs ml-1 font-normal">({facility.variantName})</span>
                              )}
                            </span>
                            <span className="text-gray-500 font-medium">
                              + ₦{facility.cost.toLocaleString()}{facility.chargeMethod === 'per_day' ? '/day' : (facility.chargeMethod === 'per_hour' ? '/hour' : '')}
                            </span>
                          </label>
                          {isSelected && (
                            <div className="w-24">
                              <select
                                value={selectedFacility?.quantity || 1}
                                onChange={(e) => handleQuantityChange(facilityIdToUse, parseInt(e.target.value, 10))}
                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#295FA7]"
                              >
                                {Array.from({ length: facility.quantity || 1 }, (_, i) => i + 1).map(n => (
                                  <option key={n} value={n}>{n}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800">Payment Method</label>
                  <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900">
                    {paymentOptions.paymentMethods.map((method: string) => (
                      <option key={method} value={method}>
                        {formatLabel(method)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800">Payment Status</label>
                  <select
                    name="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={handleChange}
                    disabled={formData.paymentMethod.toUpperCase() === 'ONLINE'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {paymentOptions.paymentStatuses.map((status: string) => (
                      <option key={status} value={status}>
                        {formatLabel(status)}
                      </option>
                    ))}
                  </select>
                  {formData.paymentMethod.toUpperCase() === 'ONLINE' && (
                    <p className="text-[10px] text-amber-600 mt-1 font-medium italic">Online payments must start as &apos;pending&apos;.</p>
                  )}
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-gray-100">
                {isCalculatingQuote ? (
                  <div className="flex items-center gap-2 text-primary">
                    <CustomLoader size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Recalculating Quote...</span>
                  </div>
                ) : quoteData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Venue Rental:</span>
                        <span className="font-bold text-gray-900">₦{quoteData.hallPrice.toLocaleString()}</span>
                      </div>
                      {quoteData.facilitiesPrice > 0 && (
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Facilities:</span>
                          <span className="font-bold text-gray-900">₦{quoteData.facilitiesPrice.toLocaleString()}</span>
                        </div>
                      )}
                      {quoteData.discountAmount > 0 && (
                        <div className="flex justify-between text-xs text-green-600">
                          <span>Discount:</span>
                          <span className="font-bold">-₦{quoteData.discountAmount.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedVenueObj?.isTaxEnabled && (selectedVenueObj.serviceChargePercentage || 0) > 0 && (
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Service Charge ({selectedVenueObj.serviceChargePercentage}%):</span>
                          <span className="font-bold text-gray-900">₦{taxDetails.serviceCharge.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedVenueObj?.isTaxEnabled && (selectedVenueObj.vatPercentage || 0) > 0 && (
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>VAT ({selectedVenueObj.vatPercentage}%):</span>
                          <span className="font-bold text-gray-900">₦{taxDetails.vat.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[10px] text-amber-600">
                        <span>Transaction Fee:</span>
                        <span className="font-bold">Transaction fees may apply</span>
                      </div>
                    </div>
                    <div className="flex flex-col justify-end space-y-3">
                      <div className="text-right">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Total Amount Due</span>
                        <span className="text-3xl font-black text-primary italic leading-none">
                          ₦{(selectedVenueObj?.isTaxEnabled ? taxDetails.totalWithTax : (quoteData.feeBreakdown?.serviceTotal || quoteData.totalPrice)).toLocaleString()}
                        </span>
                        <p className="text-[10px] text-gray-400 font-medium mt-1">Excludes transaction fees</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm">Venue Price: ₦{hallPrice.toLocaleString()}</div>
                      <div className="text-sm">Facilities Price: ₦{facilitiesPrice.toLocaleString()}</div>
                      {discountAmount > 0 && (
                        <div className="text-sm text-green-600 font-medium">Discount Applied: -₦{discountAmount.toLocaleString()}</div>
                      )}
                      <div className="text-sm font-bold">Total Price: ₦{totalPrice.toLocaleString()}</div>
                    </div>
                  </div>
                )}
                <div className="flex justify-end mt-6">
                  <button type="submit" disabled={isCalculatingQuote || formData.dates.length === 0} className="px-8 py-4 rounded-2xl text-white bg-primary hover:bg-primary/90 font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50">
                    Pay in Full
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SharedBookingModal;
