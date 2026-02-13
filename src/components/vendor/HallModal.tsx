
'use client';

import { useState, useEffect, useContext } from 'react';
import { X } from 'lucide-react';
import MediaUpload from './MediaUpload';
import { isVideo } from '@/utils/media';
import api from '@/services/api';
import Swal from "@/utils/sweetalert";
import { VendorContext } from '@/context/VendorContext';
import { useRouter } from 'next/navigation';

interface Facility {
  facility: string; // Changed from name to facility to store ID
  name: string; // To store the facility name for display
  available: boolean;
  chargeable: boolean;
  chargeMethod?: 'free' | 'flat' | 'per_hour';
  cost?: number;
  quantity?: number;
  chargePerUnit?: boolean;
}
interface APIFacility {
  _id: string;
  name: string;
}

interface APISuitability {
  _id: string;
  name: string;
}

interface HallData {
  _id?: string;
  id?: string;
  name?: string;
  description?: string;
  capacity?: number;
  openingHour?: string | number;
  closingHour?: string | number;
  location?: string;
  pricing?: {
    hourlyRate?: number;
    perHour?: number;
    dailyRate?: number;
    perDay?: number;
  };
  facilities?: Array<{
    facility?: string | { _id: string; name: string };
    name?: string;
    available: boolean;
    chargeable: boolean;
    chargeMethod?: 'free' | 'flat' | 'per_hour';
    cost?: number;
    quantity?: number;
    chargePerUnit?: boolean;
  }>;
  suitableFor?: Array<string | { _id: string }>;
  carParkCapacity?: number;
  hallSize?: string;
  rules?: string[] | string;
  country?: string;
  state?: string;
  localGovernment?: string;
  allowRecurringBookings?: boolean;
  isOnlineBookingEnabled?: boolean;
  recurringBookingDiscount?: {
    percentage?: number;
    minBookings?: number;
  };
  discountSettings?: {
    enabled: boolean;
    hourly: {
      minHours: number;
      percentage: number;
    };
    daily: {
      minDays: number;
      percentage: number;
    };
  };
  maxStaffManualDiscount?: number;
  images?: string[];
  videos?: string[];
}

interface HallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: Record<string, unknown>) => Promise<Record<string, unknown> | void> | void;
  hall?: HallData;
}

const parseHour = (timeStr: string | number) => {
  if (typeof timeStr === 'number') return timeStr;
  if (typeof timeStr === 'string' && timeStr.includes(':')) {
    return parseInt(timeStr.split(':')[0], 10);
  }
  return parseInt(String(timeStr), 10);
};

const HallModal: React.FC<HallModalProps> = ({ isOpen, onClose, onSubmit, hall }) => {
  const router = useRouter();
  const vendorContext = useContext(VendorContext);

  const resetForm = () => {
    setFormData({
      name: '',
      country: '',
      state: '',
      localGovernment: '',
      description: '',
      capacity: 0,
      openingHour: '09:00',
      closingHour: '23:00',
      location: '',
      hourlyRate: 0,
      dailyRate: 0,
      facilities: [] as Facility[],
      suitableFor: [] as string[],
      carParkCapacity: 0,
      hallSize: '',
      rules: '',
      allowRecurringBookings: false,
      isOnlineBookingEnabled: true,
      recurringBookingDiscount: {
        percentage: 0 as number | string,
        minBookings: 0 as number | string,
      },
      discountSettings: {
        enabled: false,
        hourly: {
          minHours: 0 as number | string,
          percentage: 0 as number | string,
        },
        daily: {
          minDays: 0 as number | string,
          percentage: 0 as number | string,
        },
      },
      maxStaffManualDiscount: 0 as number | string,
    });
    setCurrentStep(1);
    setHallId(null);
    setErrors({});
  };

  const handleClose = () => {
    if (!hall) {
      localStorage.removeItem('hallCreationProgress');
      resetForm();
    }
    onClose();
  };

  const subscription = vendorContext?.subscription;
  const [currentStep, setCurrentStep] = useState(1);
  const [hallId, setHallId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasUploadedImages, setHasUploadedImages] = useState(false);
  const [availableFacilities, setAvailableFacilities] = useState<APIFacility[]>([]);
  const [availableSuitabilities, setAvailableSuitabilities] = useState<APISuitability[]>([]);
  const [chargeMethods, setChargeMethods] = useState<string[]>([]);
  const [countries, setCountries] = useState<{ _id: string; name: string }[]>([]);
  const [states, setStates] = useState<{ _id: string; name: string }[]>([]);
  const [lgas, setLgas] = useState<{ _id: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    state: '',
    localGovernment: '',
    description: '',
    capacity: 0,
    openingHour: '09:00',
    closingHour: '23:00',
    location: '',
    hourlyRate: 0,
    dailyRate: 0,
    facilities: [] as Facility[],
    suitableFor: [] as string[],
    carParkCapacity: 0,
    hallSize: '',
    rules: '',
    allowRecurringBookings: false,
    isOnlineBookingEnabled: true,
    recurringBookingDiscount: {
      percentage: 0 as number | string,
      minBookings: 0 as number | string,
    },
    discountSettings: {
      enabled: false,
      hourly: {
        minHours: 0 as number | string,
        percentage: 0 as number | string,
      },
      daily: {
        minDays: 0 as number | string,
        percentage: 0 as number | string,
      },
    },
    maxStaffManualDiscount: 0 as number | string,
  });

  useEffect(() => {
    if (isOpen) {
      const fetchInitialData = async () => {
        try {
          // Fetch facilities and charge methods
          const facilitiesResponse = await api.get('/facilities');
          setAvailableFacilities(facilitiesResponse.data.data.facilities);
          setChargeMethods(facilitiesResponse.data.data.chargeMethods);

          // Fetch suitabilities
          const suitabilitiesResponse = await api.get('/suitabilities');
          setAvailableSuitabilities(suitabilitiesResponse.data.data);

          // Fetch countries
          const countriesResponse = await api.get('/locations/countries');
          setCountries(countriesResponse.data.data);
        } catch (error: unknown) {
          console.error('Failed to fetch initial data:', error);
          Swal.toast.fire({
            icon: 'error',
            title: error instanceof Error ? error.message : 'Failed to load necessary data. Please try again.',
          });
        }
      };
      fetchInitialData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.country) {
      const fetchStates = async () => {
        try {
          const response = await api.get(`/locations/states/${formData.country}`);
          setStates(response.data.data);
        } catch (error) {
          console.error('Failed to fetch states:', error);
        }
      };
      fetchStates();
    }
  }, [formData.country]);

  useEffect(() => {
    if (formData.state) {
      const fetchLgas = async () => {
        try {
          const response = await api.get(`/locations/lgas/${formData.state}`);
          setLgas(response.data.data);
        } catch (error) {
          console.error('Failed to fetch LGAs:', error);
        }
      };
      fetchLgas();
    }
  }, [formData.state]);

  useEffect(() => {
    // This effect handles the transition from step 2 to 3 after a hall is created.
    // It waits for hallId to be set before moving to the next step to avoid race conditions.
    if (hallId && !hall && currentStep === 2) {
      setCurrentStep(3);
    }
  }, [hallId, hall, currentStep]);

  useEffect(() => {
    if (hall) {
      // Map incoming hall facilities to the new structure
      const mappedFacilities = hall.facilities ? hall.facilities.map((fac) => ({
        facility: typeof fac.facility === 'object' ? fac.facility?._id : fac.facility || '', // Handle populated and non-populated facility
        name: typeof fac.facility === 'object' ? fac.facility?.name : (fac.name || ''), // Display name
        available: fac.available,
        chargeable: fac.chargeable,
        chargeMethod: fac.chargeMethod,
        cost: fac.cost,
        quantity: fac.quantity || 1,
        chargePerUnit: fac.chargePerUnit || false,
      })) : [];

      const formatTime = (time: string | number | undefined, defaultTime: string) => {
        if (time === undefined || time === null) return defaultTime;
        if (typeof time === 'number') {
          return `${String(time).padStart(2, '0')}:00`;
        }
        if (typeof time === 'string' && time.includes(':')) {
          return time;
        }
        return `${String(time).padStart(2, '0')}:00`;
      };

      const getID = (val: unknown) => {
        if (typeof val === 'object' && val !== null) {
          const obj = val as { _id?: string; id?: string };
          return obj._id || obj.id || '';
        }
        return (val as string) || '';
      };

      setFormData({
        name: hall.name || '',
        description: hall.description || '',
        capacity: hall.capacity || 0,
        openingHour: formatTime(hall.openingHour, '09:00'),
        closingHour: formatTime(hall.closingHour, '23:00'),
        location: hall.location || '',
        hourlyRate: hall.pricing?.hourlyRate || hall.pricing?.perHour || 0,
        dailyRate: hall.pricing?.dailyRate || hall.pricing?.perDay || 0,
        facilities: mappedFacilities as Facility[],
        suitableFor: hall.suitableFor ? hall.suitableFor.map((s) => typeof s === 'string' ? s : (s as { _id?: string; id?: string })._id || (s as { _id?: string; id?: string }).id || '') : [],
        carParkCapacity: hall.carParkCapacity || 0,
        hallSize: hall.hallSize || '',
        rules: Array.isArray(hall.rules) ? hall.rules.join('\n') : (hall.rules || ''),
        country: getID(hall.country),
        state: getID(hall.state),
        localGovernment: getID(hall.localGovernment),
        allowRecurringBookings: hall.allowRecurringBookings || false,
        isOnlineBookingEnabled: hall.isOnlineBookingEnabled !== undefined ? hall.isOnlineBookingEnabled : true,
        recurringBookingDiscount: {
          percentage: hall.recurringBookingDiscount?.percentage || 0,
          minBookings: hall.recurringBookingDiscount?.minBookings || 0,
        },
        discountSettings: {
          enabled: hall.discountSettings?.enabled || false,
          hourly: {
            minHours: hall.discountSettings?.hourly?.minHours || 0,
            percentage: hall.discountSettings?.hourly?.percentage || 0,
          },
          daily: {
            minDays: hall.discountSettings?.daily?.minDays || 0,
            percentage: hall.discountSettings?.daily?.percentage || 0,
          },
        },
        maxStaffManualDiscount: hall.maxStaffManualDiscount || 0,
      });
      setHallId(hall._id || hall.id || null);
    } else {
      const savedData = typeof window !== 'undefined' ? localStorage.getItem('hallCreationProgress') : null;
      if (savedData && isOpen) {
        try {
          const parsedData = JSON.parse(savedData);
          setFormData({
            name: '',
            description: '',
            capacity: 0,
            openingHour: '09:00',
            closingHour: '23:00',
            location: '',
            hourlyRate: 0,
            dailyRate: 0,
            facilities: [],
            suitableFor: [],
            carParkCapacity: 0,
            hallSize: '',
            rules: '',
            country: '',
            state: '',
            localGovernment: '',
            allowRecurringBookings: false,
            isOnlineBookingEnabled: true,
            recurringBookingDiscount: {
              percentage: 0,
              minBookings: 0,
            },
            discountSettings: {
              enabled: false,
              hourly: {
                minHours: 0,
                percentage: 0,
              },
              daily: {
                minDays: 0,
                percentage: 0,
              },
            },
            maxStaffManualDiscount: 0,
            ...parsedData
          });
          setCurrentStep(1);
          setHallId(null);
          return;
        } catch (e) {
          console.error("Failed to parse saved hall progress", e);
        }
      }

      setFormData({
        name: '',
        description: '',
        capacity: 0,
        openingHour: '09:00',
        closingHour: '23:00',
        location: '',
        hourlyRate: 0,
        dailyRate: 0,
        facilities: [],
        suitableFor: [],
        carParkCapacity: 0,
        hallSize: '',
        rules: '',
        country: '',
        state: '',
        localGovernment: '',
        allowRecurringBookings: false,
        isOnlineBookingEnabled: true,
        recurringBookingDiscount: {
          percentage: 0,
          minBookings: 0,
        },
        discountSettings: {
          enabled: false,
          hourly: {
            minHours: 0,
            percentage: 0,
          },
          daily: {
            minDays: 0,
            percentage: 0,
          },
        },
        maxStaffManualDiscount: 0,
      });
      setCurrentStep(1);
      setHallId(null);
    }
  }, [hall, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name === 'country') {
      setFormData(prev => ({ ...prev, country: value, state: '', localGovernment: '' }));
    } else if (name === 'state') {
      setFormData(prev => ({ ...prev, state: value, localGovernment: '' }));
    } else if (name.startsWith('recurringBookingDiscount.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        recurringBookingDiscount: {
          ...prev.recurringBookingDiscount,
          [field]: value,
        }
      }));
    } else if (name.startsWith('discountSettings.')) {
      const parts = name.split('.');
      if (parts.length === 2) {
        // Handle discountSettings.enabled
        setFormData(prev => ({
          ...prev,
          discountSettings: {
            ...prev.discountSettings,
            enabled: (e.target as HTMLInputElement).checked,
          }
        }));
      } else if (parts.length === 3) {
        // Handle discountSettings.hourly.minHours etc
        const category = parts[1] as 'hourly' | 'daily';
        const field = parts[2];
        setFormData(prev => ({
          ...prev,
          discountSettings: {
            ...prev.discountSettings,
            [category]: {
              ...prev.discountSettings[category],
              [field]: value,
            }
          }
        }));
      }
    } else if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFacilityChange = (index: number, field: keyof Facility, value: string | number | boolean) => {
    const newFacilities = [...formData.facilities];
    const facility = newFacilities[index];

    if (field === 'facility') {
      const selectedFacility = availableFacilities.find(f => f._id === value);
      facility.facility = selectedFacility?._id || '';
      facility.name = selectedFacility?.name || '';
    } else if (field === 'available' || field === 'chargeable' || field === 'chargePerUnit') {
      if (field === 'available') facility.available = value as boolean;
      if (field === 'chargeable') facility.chargeable = value as boolean;
      if (field === 'chargePerUnit') facility.chargePerUnit = value as boolean;

      if (field === 'chargeable' && !value) {
        // If chargeable is unchecked, reset charge method and cost
        delete facility.chargeMethod;
        delete facility.cost;
        facility.quantity = 1; // Reset quantity
        facility.chargePerUnit = false; // Reset charge per unit
      }
    } else if (field === 'cost' || field === 'quantity') {
      if (field === 'cost') facility.cost = Number(value);
      if (field === 'quantity') facility.quantity = Number(value);
    } else {
       // @ts-expect-error - field is valid
      facility[field] = value;
    }

    setFormData((prev) => ({ ...prev, facilities: newFacilities }));
  };

  const addFacility = () => {
    setFormData((prev) => ({
      ...prev,
      facilities: [
        ...prev.facilities,
        // Initialize with empty values, user will select a facility
        { facility: '', name: '', available: true, chargeable: false, quantity: 1, chargePerUnit: false },
      ],
    }));
  };

  const removeFacility = (index: number) => {
    const newFacilities = formData.facilities.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, facilities: newFacilities }));
  };

  const validateStep = (step: number, isUpdate: boolean = false) => {
    if (hall && !isUpdate) return true;
    const newErrors: Record<string, string> = {};

    if (step === 1 || isUpdate) {
      if (!formData.name.trim()) newErrors.name = 'Hall name is required';
      if (!formData.description.trim()) newErrors.description = 'Description is required';
      if (!formData.country) newErrors.country = 'Country is required';
      if (!formData.state) newErrors.state = 'State is required';
      if (!formData.localGovernment) newErrors.localGovernment = 'LGA is required';
      if (!formData.location.trim()) newErrors.location = 'Location is required';
      if (Number(formData.capacity) <= 0) newErrors.capacity = 'Capacity must be greater than 0';
      if (!formData.openingHour) newErrors.openingHour = 'Opening hour is required';
      if (!formData.closingHour) newErrors.closingHour = 'Closing hour is required';

      if (formData.openingHour && formData.closingHour) {
        if (formData.closingHour <= formData.openingHour) {
          newErrors.closingHour = 'Closing hour must be after opening hour';
        }
      }
    }

    if (step === 2 || isUpdate) {
      if (Number(formData.hourlyRate) <= 0) newErrors.hourlyRate = 'Hourly rate must be greater than 0';
      if (Number(formData.dailyRate) <= 0) newErrors.dailyRate = 'Daily rate must be greater than 0';
      if (Number(formData.carParkCapacity) <= 0) newErrors.carParkCapacity = 'Car park capacity must be greater than 0';
      if (!formData.hallSize.trim()) newErrors.hallSize = 'Hall size is required';
      if (formData.suitableFor.length === 0) newErrors.suitableFor = 'Select at least one suitability category';

      formData.facilities.forEach((fac, index) => {
        if (!fac.facility) {
          newErrors[`facility_${index}`] = 'Please select a facility';
        }
        if (fac.chargeable) {
          if (!fac.chargeMethod) newErrors[`facility_method_${index}`] = 'Charge method is required';
          if (fac.chargeMethod !== 'free') {
            if (!fac.cost || Number(fac.cost) <= 0) newErrors[`facility_cost_${index}`] = 'Cost must be greater than 0';
            if (!fac.quantity || Number(fac.quantity) <= 0) newErrors[`facility_qty_${index}`] = 'Quantity must be greater than 0';
          }
        }
      });

      if (formData.allowRecurringBookings) {
        if (!formData.recurringBookingDiscount.percentage || Number(formData.recurringBookingDiscount.percentage) <= 0) {
           newErrors['recurringBookingDiscount.percentage'] = 'Discount percentage must be greater than 0';
        }
        if (!formData.recurringBookingDiscount.minBookings || Number(formData.recurringBookingDiscount.minBookings) <= 0) {
           newErrors['recurringBookingDiscount.minBookings'] = 'Minimum bookings must be greater than 0';
        }
      }

      if (formData.discountSettings.enabled) {
        if (Number(formData.discountSettings.hourly.percentage) > 60) {
          newErrors['discountSettings.hourly.percentage'] = 'Discount percentage cannot exceed 60%';
        }
        if (Number(formData.discountSettings.daily.percentage) > 60) {
          newErrors['discountSettings.daily.percentage'] = 'Discount percentage cannot exceed 60%';
        }
      }
      if (Number(formData.maxStaffManualDiscount) > 60) {
        newErrors.maxStaffManualDiscount = 'Max staff discount cannot exceed 60%';
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      Swal.toast.fire({
        icon: 'error',
        title: 'Please fix the errors before proceeding.',
      });
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clean up facilities data before submission
    const facilitiesPayload = formData.facilities.map(({ name: _name, ...rest }) => {
      const facilityData: Record<string, unknown> = { ...rest };
      if (!facilityData.chargeable) {
        delete facilityData.chargeMethod;
        delete facilityData.cost;
      }
      return facilityData;
    });

    if (hall) {
      if (!validateStep(1, true)) {
        Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          text: 'Please fill in all required fields.',
          confirmButtonColor: '#295FA7'
        });
        return;
      }
      // If we are editing, just submit the whole form at once
      if (formData.allowRecurringBookings && (formData.recurringBookingDiscount.percentage === '' || formData.recurringBookingDiscount.minBookings === '')) {
        Swal.toast.fire({
          icon: 'error',
          title: 'Discount percentage and minimum bookings are required.',
        });
        return;
      }

      const { hourlyRate, dailyRate, facilities: _facilities, openingHour, closingHour, country, state, localGovernment, ...rest } = formData;
      const pricing = {
        hourlyRate: Number(hourlyRate),
        dailyRate: Number(dailyRate),
      };
      const rulesArray = formData.rules.split('\n').filter(rule => rule.trim() !== '');

      const payload: Record<string, unknown> = {
        ...rest,
        pricing,
        facilities: facilitiesPayload,
        rules: rulesArray,
        capacity: Number(formData.capacity),
        carParkCapacity: Number(formData.carParkCapacity),
        maxStaffManualDiscount: Number(formData.maxStaffManualDiscount),
        openingHour: parseHour(openingHour),
        closingHour: parseHour(closingHour),
        country,
        state,
        localGovernment,
        discountSettings: {
          enabled: formData.discountSettings.enabled,
          hourly: {
            minHours: Number(formData.discountSettings.hourly.minHours),
            percentage: Number(formData.discountSettings.hourly.percentage),
          },
          daily: {
            minDays: Number(formData.discountSettings.daily.minDays),
            percentage: Number(formData.discountSettings.daily.percentage),
          }
        }
      };

      if (formData.allowRecurringBookings) {
        payload.recurringBookingDiscount = {
          percentage: Number(formData.recurringBookingDiscount.percentage),
          minBookings: Number(formData.recurringBookingDiscount.minBookings),
        };
      } else {
        delete payload.recurringBookingDiscount;
      }

      // Call suitability update separately as requested
      const actualHallId = hall._id || hall.id;
      try {
        await api.patch(`/halls/${actualHallId}/suitability`, { suitableFor: formData.suitableFor });
      } catch (error) {
        console.error('Failed to update suitabilities:', error);
      }

      onSubmit(payload);
      return;
    }

    // Otherwise, handle the multi-step creation
    if (currentStep === 1) {
      handleNext();
    } else if (currentStep === 2) {
      if (!validateStep(2)) return;

      if (!subscription && !hall) {
        Swal.fire({
          title: 'Subscription Required',
          text: 'You need an active subscription to create a hall. We will save your progress so you can continue after subscribing.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Go to Subscriptions',
          cancelButtonText: 'Cancel',
        }).then((result) => {
          if (result.isConfirmed) {
            localStorage.setItem('hallCreationProgress', JSON.stringify(formData));
            router.push('/vendor/dashboard/settings?tab=licenses');
            onClose();
          }
        });
        return;
      }

      const rulesArray = formData.rules.split('\n').filter(rule => rule.trim() !== '');

      const payload: Record<string, unknown> = {
        name: formData.name,
        country: formData.country,
        state: formData.state,
        localGovernment: formData.localGovernment,
        description: formData.description,
        capacity: Number(formData.capacity),
        openingHour: parseHour(formData.openingHour),
        closingHour: parseHour(formData.closingHour),
        location: formData.location,
        pricing: {
          hourlyRate: Number(formData.hourlyRate),
          dailyRate: Number(formData.dailyRate),
        },
        facilities: facilitiesPayload,
        carParkCapacity: Number(formData.carParkCapacity),
        hallSize: formData.hallSize,
        rules: rulesArray,
        suitableFor: formData.suitableFor,
        allowRecurringBookings: formData.allowRecurringBookings,
        maxStaffManualDiscount: Number(formData.maxStaffManualDiscount),
        discountSettings: {
          enabled: formData.discountSettings.enabled,
          hourly: {
            minHours: Number(formData.discountSettings.hourly.minHours),
            percentage: Number(formData.discountSettings.hourly.percentage),
          },
          daily: {
            minDays: Number(formData.discountSettings.daily.minDays),
            percentage: Number(formData.discountSettings.daily.percentage),
          }
        }
      };

      if (formData.allowRecurringBookings) {
        payload.recurringBookingDiscount = {
          percentage: Number(formData.recurringBookingDiscount.percentage),
          minBookings: Number(formData.recurringBookingDiscount.minBookings),
        };
      }

      setIsSubmitting(true);
      try {
        const result = await onSubmit(payload) as { _id?: string; id?: string } | undefined;
        if (result && (result._id || result.id)) {
          setHallId((result._id || result.id) as string);
        }
        localStorage.removeItem('hallCreationProgress');
      } catch (error) {
        console.error('Failed to create hall:', error);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      const hallData = hall as HallData | undefined;
      if (!hasUploadedImages && (!hallData || (hallData.images?.length || 0) === 0)) {
        Swal.fire({
          title: 'No images uploaded',
          text: 'Are you sure you want to finish without uploading any images? A hall must have at least one image to be visible to customers.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, finish',
          cancelButtonText: 'Go back to upload',
        }).then((result) => {
          if (result.isConfirmed) {
            onClose();
          }
        });
        return;
      }
      onClose(); // Just close the modal on the final step
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2 rounded-xl transition-all cursor-pointer"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
        <div className="mb-8">
          <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">
            {hall ? (
              <>Edit <span className="text-primary not-italic">Hall</span></>
            ) : (
              <>Create <span className="text-primary not-italic">Hall</span></>
            )}
          </h2>
          <p className="text-sm text-gray-500 font-medium">
            {hall ? 'Update your venue information and settings.' : "Let's get started by setting up your new venue."}
          </p>
          {!hall && (
            <div className="flex items-center mt-6">
              <div className={`flex items-center ${currentStep >= 1 ? 'text-primary' : 'text-gray-700'}`}>
                <div className={`w-6 h-6 rounded-full border-2 ${currentStep >= 1 ? 'border-primary bg-primary/5' : 'border-gray-400'} flex items-center justify-center text-xs font-bold`}>1</div>
                <span className="ml-2 text-xs font-bold uppercase tracking-wider">Basic</span>
              </div>
              <div className="flex-1 h-px bg-gray-200 mx-4"></div>
              <div className={`flex items-center ${currentStep >= 2 ? 'text-primary' : 'text-gray-700'}`}>
                <div className={`w-6 h-6 rounded-full border-2 ${currentStep >= 2 ? 'border-primary bg-primary/5' : 'border-gray-400'} flex items-center justify-center text-xs font-bold`}>2</div>
                <span className="ml-2 text-xs font-bold uppercase tracking-wider">Pricing</span>
              </div>
              <div className="flex-1 h-px bg-gray-200 mx-4"></div>
              <div className={`flex items-center ${currentStep === 3 ? 'text-primary' : 'text-gray-700'}`}>
                <div className={`w-6 h-6 rounded-full border-2 ${currentStep === 3 ? 'border-primary bg-primary/5' : 'border-gray-400'} flex items-center justify-center text-xs font-bold`}>3</div>
                <span className="ml-2 text-xs font-bold uppercase tracking-wider">Media</span>
              </div>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {hall ? (
            <>
              {/* Render all fields for editing */}
              <div>
                <label className="block text-sm font-medium text-gray-800">Hall Name</label>
                <input type="text" name="name" placeholder="Enter Hall Name" value={formData.name} onChange={handleChange} className={`w-full px-4 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`} required />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800">Description</label>
                <textarea name="description" placeholder="Enter Description" value={formData.description} onChange={handleChange} className={`w-full px-4 py-2 border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`} rows={3} />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800">Country</label>
                  <select name="country" value={formData.country} onChange={handleChange} className={`w-full px-4 py-2 border ${errors.country ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900`}>
                    <option value="">Select Country</option>
                    {countries.map((country) => <option key={country._id} value={country._id}>{country.name}</option>)}
                  </select>
                  {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800">State</label>
                  <select name="state" value={formData.state} onChange={handleChange} className={`w-full px-4 py-2 border ${errors.state ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900`}>
                    <option value="">Select State</option>
                    {states.map((state) => <option key={state._id} value={state._id}>{state.name}</option>)}
                  </select>
                  {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800">LGA</label>
                  <select name="localGovernment" value={formData.localGovernment} onChange={handleChange} className={`w-full px-4 py-2 border ${errors.localGovernment ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900`}>
                    <option value="">Select LGA</option>
                    {lgas.map((lga) => <option key={lga._id} value={lga._id}>{lga.name}</option>)}
                  </select>
                  {errors.localGovernment && <p className="text-red-500 text-xs mt-1">{errors.localGovernment}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800">Location</label>
                  <input type="text" name="location" placeholder="Enter Location" value={formData.location} onChange={handleChange} className={`w-full px-4 py-2 border ${errors.location ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`} required />
                  {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800">Capacity</label>
                  <input type="number" name="capacity" placeholder="Enter Capacity" value={formData.capacity} onChange={handleChange} className={`w-full px-4 py-2 border ${errors.capacity ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`} required />
                  {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800">Opening Hour</label>
                  <input type="time" name="openingHour" placeholder="Enter Opening Hour" value={formData.openingHour} onChange={handleChange} className={`w-full px-4 py-2 border ${errors.openingHour ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`} />
                  {errors.openingHour && <p className="text-red-500 text-xs mt-1">{errors.openingHour}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800">Closing Hour</label>
                  <input type="time" name="closingHour" placeholder="Enter Closing Hour" value={formData.closingHour} onChange={handleChange} className={`w-full px-4 py-2 border ${errors.closingHour ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`} />
                  {errors.closingHour && <p className="text-red-500 text-xs mt-1">{errors.closingHour}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800">Price Per Hour</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">₦</span>
                    <input type="number" name="hourlyRate" placeholder="Enter Price Per Hour" value={formData.hourlyRate} onChange={handleChange} className={`w-full pl-7 pr-4 py-2 border ${errors.hourlyRate ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`} />
                  </div>
                  {errors.hourlyRate && <p className="text-red-500 text-xs mt-1">{errors.hourlyRate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800">Price Per Day</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">₦</span>
                    <input type="number" name="dailyRate" placeholder="Enter Price Per Day" value={formData.dailyRate} onChange={handleChange} className={`w-full pl-7 pr-4 py-2 border ${errors.dailyRate ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`} />
                  </div>
                  {errors.dailyRate && <p className="text-red-500 text-xs mt-1">{errors.dailyRate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800">Car Park Capacity</label>
                  <input type="number" name="carParkCapacity" placeholder="Enter Car Park Capacity" value={formData.carParkCapacity} onChange={handleChange} className={`w-full px-4 py-2 border ${errors.carParkCapacity ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`} />
                  {errors.carParkCapacity && <p className="text-red-500 text-xs mt-1">{errors.carParkCapacity}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800">Hall Size</label>
                  <input type="text" name="hallSize" placeholder="Enter Hall Size (e.g., 100 sqm)" value={formData.hallSize} onChange={handleChange} className={`w-full px-4 py-2 border ${errors.hallSize ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`} />
                  {errors.hallSize && <p className="text-red-500 text-xs mt-1">{errors.hallSize}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800">Rules (one rule per line)</label>
                <textarea name="rules" placeholder="Enter Hall Rules" value={formData.rules} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500" rows={3} />
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isOnlineBookingEnabled"
                    id="isOnlineBookingEnabled"
                    checked={formData.isOnlineBookingEnabled}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="isOnlineBookingEnabled" className="ml-2 block text-sm font-medium text-gray-800">
                    Enable Online Booking
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="allowRecurringBookings"
                    id="allowRecurringBookings"
                    checked={formData.allowRecurringBookings}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="allowRecurringBookings" className="ml-2 block text-sm font-medium text-gray-800">
                    Allow Recurring Bookings
                  </label>
                </div>
              </div>

              {formData.allowRecurringBookings && (
                <div className={`grid grid-cols-2 gap-4 p-4 border ${errors['recurringBookingDiscount.percentage'] || errors['recurringBookingDiscount.minBookings'] ? 'border-red-500' : 'border-gray-200'} rounded-md`}>
                  <div>
                    <label className="block text-sm font-medium text-gray-800">Discount Percentage</label>
                    <input
                      type="number"
                      name="recurringBookingDiscount.percentage"
                      placeholder="Enter Discount Percentage (e.g., 10)"
                      value={formData.recurringBookingDiscount.percentage}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border ${errors['recurringBookingDiscount.percentage'] ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`}
                    />
                    {errors['recurringBookingDiscount.percentage'] && <p className="text-red-500 text-xs mt-1">{errors['recurringBookingDiscount.percentage']}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800">Minimum Days Required for Discount</label>
                    <input
                      type="number"
                      name="recurringBookingDiscount.minBookings"
                      placeholder="Enter Minimum Days (e.g., 5)"
                      value={formData.recurringBookingDiscount.minBookings}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border ${errors['recurringBookingDiscount.minBookings'] ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`}
                    />
                    {errors['recurringBookingDiscount.minBookings'] && <p className="text-red-500 text-xs mt-1">{errors['recurringBookingDiscount.minBookings']}</p>}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="discountSettings.enabled"
                    id="discountSettings.enabled"
                    checked={formData.discountSettings.enabled}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="discountSettings.enabled" className="ml-2 block text-sm font-medium text-gray-800">
                    Apply Volume Discount
                  </label>
                </div>
              </div>

              {formData.discountSettings.enabled && (
                <div className="space-y-4 p-4 border border-gray-200 rounded-md">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Hourly Discount</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-800">Min Hours</label>
                      <input
                        type="number"
                        name="discountSettings.hourly.minHours"
                        placeholder="e.g., 5"
                        value={formData.discountSettings.hourly.minHours}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800">Percentage (%)</label>
                      <input
                        type="number"
                        name="discountSettings.hourly.percentage"
                        placeholder="e.g., 5"
                        value={formData.discountSettings.hourly.percentage}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border ${errors['discountSettings.hourly.percentage'] ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`}
                      />
                      {errors['discountSettings.hourly.percentage'] && <p className="text-red-500 text-xs mt-1">{errors['discountSettings.hourly.percentage']}</p>}
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Daily Discount</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-800">Min Days</label>
                      <input
                        type="number"
                        name="discountSettings.daily.minDays"
                        placeholder="e.g., 3"
                        value={formData.discountSettings.daily.minDays}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800">Percentage (%)</label>
                      <input
                        type="number"
                        name="discountSettings.daily.percentage"
                        placeholder="e.g., 10"
                        value={formData.discountSettings.daily.percentage}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border ${errors['discountSettings.daily.percentage'] ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`}
                      />
                      {errors['discountSettings.daily.percentage'] && <p className="text-red-500 text-xs mt-1">{errors['discountSettings.daily.percentage']}</p>}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-800">Max Staff Manual Discount (%)</label>
                <input
                  type="number"
                  name="maxStaffManualDiscount"
                  placeholder="e.g., 15"
                  value={formData.maxStaffManualDiscount}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${errors.maxStaffManualDiscount ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`}
                />
                {errors.maxStaffManualDiscount && <p className="text-red-500 text-xs mt-1">{errors.maxStaffManualDiscount}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">Suitable For</label>
                {errors.suitableFor && <p className="text-red-500 text-xs mb-1">{errors.suitableFor}</p>}
                <div className={`grid grid-cols-2 gap-2 p-3 border rounded-md ${errors.suitableFor ? 'border-red-500' : 'border-gray-300'} max-h-40 overflow-y-auto mb-4`}>
                  {availableSuitabilities.map((suitability) => (
                    <label key={suitability._id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.suitableFor.includes(suitability._id)}
                        onChange={(e) => {
                          const newSuitabilities = e.target.checked
                            ? [...formData.suitableFor, suitability._id]
                            : formData.suitableFor.filter(id => id !== suitability._id);
                          setFormData(prev => ({ ...prev, suitableFor: newSuitabilities }));
                        }}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{suitability.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-800">Facilities</label>
                  <button type="button" onClick={addFacility} className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200">Add Facility</button>
                </div>
                <div className="space-y-3 max-h-48 overflow-y-auto border p-3 rounded-md border-gray-300">
                  {formData.facilities.map((facility, index) => (
                    <div key={index} className="p-3 border rounded-md border-gray-300 flex flex-wrap gap-4 items-center">
                      {/* Facility Select */}
                      <div className="flex-1 min-w-[200px]">
                        <select
                          value={facility.facility}
                          onChange={(e) => handleFacilityChange(index, 'facility', e.target.value)}
                          className={`w-full px-2 py-1 border ${errors[`facility_${index}`] ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900`}
                        >
                          <option value="">Select Facility</option>
                          {availableFacilities.map((f) => (
                            <option key={f._id} value={f._id}>{f.name}</option>
                          ))}
                        </select>
                        {errors[`facility_${index}`] && <p className="text-red-500 text-[10px] mt-0.5">{errors[`facility_${index}`]}</p>}
                      </div>

                      {/* Checkboxes */}
                      <div className="flex items-center gap-x-4">
                        <label className="flex items-center whitespace-nowrap">
                          <input type="checkbox" checked={facility.available} onChange={(e) => handleFacilityChange(index, 'available', e.target.checked)} className="mr-1" />
                          <span className="text-sm">Available</span>
                        </label>
                        <label className="flex items-center whitespace-nowrap">
                          <input type="checkbox" checked={facility.chargeable} onChange={(e) => handleFacilityChange(index, 'chargeable', e.target.checked)} className="mr-1" />
                          <span className="text-sm">Chargeable</span>
                        </label>
                      </div>

                      {/* Remove Button */}
                      <div className="ml-auto">
                        <button type="button" onClick={() => removeFacility(index)} className="text-red-500 hover:text-red-700">X</button>
                      </div>

                      {/* Chargeable Fields */}
                      {facility.chargeable && (
                        <div className="w-full flex flex-wrap gap-4 items-center pt-3 mt-3 border-t border-gray-200">
                          <div className="flex-1 min-w-[150px]">
                            <select
                              value={facility.chargeMethod || ''}
                              onChange={(e) => handleFacilityChange(index, 'chargeMethod', e.target.value)}
                              className={`w-full px-2 py-1 border ${errors[`facility_method_${index}`] ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900`}
                            >
                              <option value="" disabled>Charge Method</option>
                              {chargeMethods.map((method) => (
                                <option key={method} value={method}>{method.replace('_', ' ')}</option>
                              ))}
                            </select>
                            {errors[`facility_method_${index}`] && <p className="text-red-500 text-[10px] mt-0.5">{errors[`facility_method_${index}`]}</p>}
                          </div>

                          {facility.chargeMethod !== 'free' && (
                            <>
                              <div className="flex-shrink-0 w-24">
                                <input
                                  type="number"
                                  placeholder="Enter Cost"
                                  value={facility.cost || ''}
                                  onChange={(e) => handleFacilityChange(index, 'cost', e.target.value)}
                                  className={`w-full px-2 py-1 border ${errors[`facility_cost_${index}`] ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`}
                                />
                                {errors[`facility_cost_${index}`] && <p className="text-red-500 text-[10px] mt-0.5">{errors[`facility_cost_${index}`]}</p>}
                              </div>
                              <div className="flex-shrink-0 w-24">
                                <input
                                  type="number"
                                  placeholder="Enter Qty"
                                  value={facility.quantity || ''}
                                  onChange={(e) => handleFacilityChange(index, 'quantity', e.target.value)}
                                  className={`w-full px-2 py-1 border ${errors[`facility_qty_${index}`] ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`}
                                />
                                {errors[`facility_qty_${index}`] && <p className="text-red-500 text-[10px] mt-0.5">{errors[`facility_qty_${index}`]}</p>}
                              </div>
                              <div className="flex items-center">
                                <label className="flex items-center whitespace-nowrap text-sm">
                                  <input
                                    type="checkbox"
                                    checked={!!facility.chargePerUnit}
                                    onChange={(e) => handleFacilityChange(index, 'chargePerUnit', e.target.checked)}
                                    className="mr-1"
                                  />
                                  Charge Per Unit
                                </label>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {hallId && (
                <MediaUpload
                  hallId={hallId}
                  initialImages={hall?.images || []}
                  initialVideos={hall?.videos || []}
                  onUploadSuccess={(urls) => {
                    const uploadedImages = urls.filter(url => !isVideo(url));
                    if (uploadedImages.length > 0) {
                      setHasUploadedImages(true);
                    }
                  }}
                />
              )}
            </>
          ) : (
            <>
              {currentStep === 1 && (
                <>
                  {/* Step 1 fields */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800">Hall Name</label>
                    <input type="text" name="name" placeholder="Enter Hall Name" value={formData.name} onChange={handleChange} className={`w-full px-4 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`} required />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800">Description</label>
                    <textarea name="description" placeholder="Enter Description" value={formData.description} onChange={handleChange} className={`w-full px-4 py-2 border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`} rows={3} />
                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-800">Country</label>
                      <select name="country" value={formData.country} onChange={handleChange} className={`w-full px-4 py-2 border ${errors.country ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900`}>
                        <option value="">Select Country</option>
                        {countries.map((country) => <option key={country._id} value={country._id}>{country.name}</option>)}
                      </select>
                      {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800">State</label>
                      <select name="state" value={formData.state} onChange={handleChange} className={`w-full px-4 py-2 border ${errors.state ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900`}>
                        <option value="">Select State</option>
                        {states.map((state) => <option key={state._id} value={state._id}>{state.name}</option>)}
                      </select>
                      {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800">LGA</label>
                      <select name="localGovernment" value={formData.localGovernment} onChange={handleChange} className={`w-full px-4 py-2 border ${errors.localGovernment ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900`}>
                        <option value="">Select LGA</option>
                        {lgas.map((lga) => <option key={lga._id} value={lga._id}>{lga.name}</option>)}
                      </select>
                      {errors.localGovernment && <p className="text-red-500 text-xs mt-1">{errors.localGovernment}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800">Location</label>
                      <input type="text" name="location" placeholder="Enter Location" value={formData.location} onChange={handleChange} className={`w-full px-4 py-2 border ${errors.location ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`} required />
                      {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800">Capacity</label>
                      <input type="number" name="capacity" placeholder="Enter Capacity" value={formData.capacity} onChange={handleChange} className={`w-full px-4 py-2 border ${errors.capacity ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`} required />
                      {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800">Opening Hour</label>
                      <input type="time" name="openingHour" placeholder="Enter Opening Hour" value={formData.openingHour} onChange={handleChange} className={`w-full px-4 py-2 border ${errors.openingHour ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`} />
                      {errors.openingHour && <p className="text-red-500 text-xs mt-1">{errors.openingHour}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800">Closing Hour</label>
                      <input type="time" name="closingHour" placeholder="Enter Closing Hour" value={formData.closingHour} onChange={handleChange} className={`w-full px-4 py-2 border ${errors.closingHour ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`} />
                      {errors.closingHour && <p className="text-red-500 text-xs mt-1">{errors.closingHour}</p>}
                    </div>
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <>
                  {/* Step 2 fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-800">Price Per Hour</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">₦</span>
                        <input type="number" name="hourlyRate" placeholder="Enter Price Per Hour" value={formData.hourlyRate} onChange={handleChange} className={`w-full pl-7 pr-4 py-2 border ${errors.hourlyRate ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`} />
                      </div>
                      {errors.hourlyRate && <p className="text-red-500 text-xs mt-1">{errors.hourlyRate}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800">Price Per Day</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">₦</span>
                        <input type="number" name="dailyRate" placeholder="Enter Price Per Day" value={formData.dailyRate} onChange={handleChange} className={`w-full pl-7 pr-4 py-2 border ${errors.dailyRate ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`} />
                      </div>
                      {errors.dailyRate && <p className="text-red-500 text-xs mt-1">{errors.dailyRate}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800">Car Park Capacity</label>
                      <input type="number" name="carParkCapacity" placeholder="Enter Car Park Capacity" value={formData.carParkCapacity} onChange={handleChange} className={`w-full px-4 py-2 border ${errors.carParkCapacity ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`} />
                      {errors.carParkCapacity && <p className="text-red-500 text-xs mt-1">{errors.carParkCapacity}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800">Hall Size</label>
                      <input type="text" name="hallSize" placeholder="Enter Hall Size (e.g., 100 sqm)" value={formData.hallSize} onChange={handleChange} className={`w-full px-4 py-2 border ${errors.hallSize ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`} />
                      {errors.hallSize && <p className="text-red-500 text-xs mt-1">{errors.hallSize}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800">Rules (one rule per line)</label>
                    <textarea name="rules" placeholder="Enter Hall Rules" value={formData.rules} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500" rows={3} />
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="isOnlineBookingEnabled"
                        id="isOnlineBookingEnabled"
                        checked={formData.isOnlineBookingEnabled}
                        onChange={handleChange}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <label htmlFor="isOnlineBookingEnabled" className="ml-2 block text-sm font-medium text-gray-800">
                        Enable Online Booking
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="allowRecurringBookings"
                        id="allowRecurringBookings"
                        checked={formData.allowRecurringBookings}
                        onChange={handleChange}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <label htmlFor="allowRecurringBookings" className="ml-2 block text-sm font-medium text-gray-800">
                        Allow Recurring Bookings
                      </label>
                    </div>
                  </div>

                  {formData.allowRecurringBookings && (
                    <div className="grid grid-cols-2 gap-4 p-4 border border-gray-200 rounded-md">
                      <div>
                        <label className="block text-sm font-medium text-gray-800">Discount Percentage</label>
                        <input
                          type="number"
                          name="recurringBookingDiscount.percentage"
                          placeholder="Enter Discount Percentage (e.g., 10)"
                          value={formData.recurringBookingDiscount.percentage}
                          onChange={handleChange}
                          className={`w-full px-4 py-2 border ${errors['recurringBookingDiscount.percentage'] ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`}
                        />
                        {errors['recurringBookingDiscount.percentage'] && <p className="text-red-500 text-xs mt-1">{errors['recurringBookingDiscount.percentage']}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-800">Minimum Days Required for Discount</label>
                        <input
                          type="number"
                          name="recurringBookingDiscount.minBookings"
                          placeholder="Enter Minimum Days (e.g., 5)"
                          value={formData.recurringBookingDiscount.minBookings}
                          onChange={handleChange}
                          className={`w-full px-4 py-2 border ${errors['recurringBookingDiscount.minBookings'] ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`}
                        />
                        {errors['recurringBookingDiscount.minBookings'] && <p className="text-red-500 text-xs mt-1">{errors['recurringBookingDiscount.minBookings']}</p>}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-6">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="discountSettings.enabled"
                        id="discountSettings.enabled-step"
                        checked={formData.discountSettings.enabled}
                        onChange={handleChange}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <label htmlFor="discountSettings.enabled-step" className="ml-2 block text-sm font-medium text-gray-800">
                        Apply Volume Discount
                      </label>
                    </div>
                  </div>

                  {formData.discountSettings.enabled && (
                    <div className="space-y-4 p-4 border border-gray-200 rounded-md">
                      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Hourly Discount</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-800">Min Hours</label>
                          <input
                            type="number"
                            name="discountSettings.hourly.minHours"
                            placeholder="e.g., 5"
                            value={formData.discountSettings.hourly.minHours}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-800">Percentage (%)</label>
                          <input
                            type="number"
                            name="discountSettings.hourly.percentage"
                            placeholder="e.g., 5"
                            value={formData.discountSettings.hourly.percentage}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border ${errors['discountSettings.hourly.percentage'] ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`}
                          />
                          {errors['discountSettings.hourly.percentage'] && <p className="text-red-500 text-xs mt-1">{errors['discountSettings.hourly.percentage']}</p>}
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Daily Discount</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-800">Min Days</label>
                          <input
                            type="number"
                            name="discountSettings.daily.minDays"
                            placeholder="e.g., 3"
                            value={formData.discountSettings.daily.minDays}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-800">Percentage (%)</label>
                          <input
                            type="number"
                            name="discountSettings.daily.percentage"
                            placeholder="e.g., 10"
                            value={formData.discountSettings.daily.percentage}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border ${errors['discountSettings.daily.percentage'] ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`}
                          />
                          {errors['discountSettings.daily.percentage'] && <p className="text-red-500 text-xs mt-1">{errors['discountSettings.daily.percentage']}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-800">Max Staff Manual Discount (%)</label>
                    <input
                      type="number"
                      name="maxStaffManualDiscount"
                      placeholder="e.g., 15"
                      value={formData.maxStaffManualDiscount}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border ${errors.maxStaffManualDiscount ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`}
                    />
                    {errors.maxStaffManualDiscount && <p className="text-red-500 text-xs mt-1">{errors.maxStaffManualDiscount}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">Suitable For</label>
                    <div className={`grid grid-cols-2 gap-2 p-3 border rounded-md ${errors.suitableFor ? 'border-red-500' : 'border-gray-300'} max-h-40 overflow-y-auto mb-1`}>
                      {availableSuitabilities.map((suitability) => (
                        <label key={suitability._id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.suitableFor.includes(suitability._id)}
                            onChange={(e) => {
                              const newSuitabilities = e.target.checked
                                ? [...formData.suitableFor, suitability._id]
                                : formData.suitableFor.filter(id => id !== suitability._id);
                              setFormData(prev => ({ ...prev, suitableFor: newSuitabilities }));
                            }}
                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">{suitability.name}</span>
                        </label>
                      ))}
                    </div>
                    {errors.suitableFor && <p className="text-red-500 text-xs mt-1 mb-4">{errors.suitableFor}</p>}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-800">Facilities</label>
                      <button type="button" onClick={addFacility} className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200">Add Facility</button>
                    </div>
                    <div className="space-y-3 max-h-48 overflow-y-auto border p-3 rounded-md border-gray-300">
                      {formData.facilities.map((facility, index) => (
                        <div key={index} className={`p-3 border rounded-md ${errors[`facility_${index}`] || errors[`facility_method_${index}`] || errors[`facility_cost_${index}`] || errors[`facility_qty_${index}`] ? 'border-red-500' : 'border-gray-300'} flex flex-wrap gap-4 items-center`}>
                          {/* Facility Select */}
                          <div className="flex-1 min-w-[200px]">
                            <select
                              value={facility.facility}
                              onChange={(e) => handleFacilityChange(index, 'facility', e.target.value)}
                              className={`w-full px-2 py-1 border ${errors[`facility_${index}`] ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900`}
                            >
                              <option value="">Select Facility</option>
                              {availableFacilities.map((f) => (
                                <option key={f._id} value={f._id}>{f.name}</option>
                              ))}
                            </select>
                            {errors[`facility_${index}`] && <p className="text-red-500 text-[10px] mt-0.5">{errors[`facility_${index}`]}</p>}
                          </div>

                          {/* Checkboxes */}
                          <div className="flex items-center gap-x-4">
                            <label className="flex items-center whitespace-nowrap">
                              <input type="checkbox" checked={facility.available} onChange={(e) => handleFacilityChange(index, 'available', e.target.checked)} className="mr-1" />
                              <span className="text-sm">Available</span>
                            </label>
                            <label className="flex items-center whitespace-nowrap">
                              <input type="checkbox" checked={facility.chargeable} onChange={(e) => handleFacilityChange(index, 'chargeable', e.target.checked)} className="mr-1" />
                              <span className="text-sm">Chargeable</span>
                            </label>
                          </div>

                          {/* Remove Button */}
                          <div className="ml-auto">
                            <button type="button" onClick={() => removeFacility(index)} className="text-red-500 hover:text-red-700">X</button>
                          </div>

                          {/* Chargeable Fields */}
                          {facility.chargeable && (
                            <div className="w-full flex flex-wrap gap-4 items-center pt-3 mt-3 border-t border-gray-200">
                              <div className="flex-1 min-w-[150px]">
                                <select
                                  value={facility.chargeMethod || ''}
                                  onChange={(e) => handleFacilityChange(index, 'chargeMethod', e.target.value)}
                                  className={`w-full px-2 py-1 border ${errors[`facility_method_${index}`] ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900`}
                                >
                                  <option value="" disabled>Charge Method</option>
                                  {chargeMethods.map((method) => (
                                    <option key={method} value={method}>{method.replace('_', ' ')}</option>
                                  ))}
                                </select>
                                {errors[`facility_method_${index}`] && <p className="text-red-500 text-[10px] mt-0.5">{errors[`facility_method_${index}`]}</p>}
                              </div>

                              {facility.chargeMethod !== 'free' && (
                                <>
                                  <div className="flex-shrink-0 w-24">
                                    <input
                                      type="number"
                                      placeholder="Enter Cost"
                                      value={facility.cost || ''}
                                      onChange={(e) => handleFacilityChange(index, 'cost', e.target.value)}
                                      className={`w-full px-2 py-1 border ${errors[`facility_cost_${index}`] ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`}
                                    />
                                    {errors[`facility_cost_${index}`] && <p className="text-red-500 text-[10px] mt-0.5">{errors[`facility_cost_${index}`]}</p>}
                                  </div>
                                  <div className="flex-shrink-0 w-24">
                                    <input
                                      type="number"
                                      placeholder="Enter Qty"
                                      value={facility.quantity || ''}
                                      onChange={(e) => handleFacilityChange(index, 'quantity', e.target.value)}
                                      className={`w-full px-2 py-1 border ${errors[`facility_qty_${index}`] ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500`}
                                    />
                                    {errors[`facility_qty_${index}`] && <p className="text-red-500 text-[10px] mt-0.5">{errors[`facility_qty_${index}`]}</p>}
                                  </div>
                                  <div className="flex items-center">
                                    <label className="flex items-center whitespace-nowrap text-sm">
                                      <input
                                        type="checkbox"
                                        checked={!!facility.chargePerUnit}
                                        onChange={(e) => handleFacilityChange(index, 'chargePerUnit', e.target.checked)}
                                        className="mr-1"
                                      />
                                      Charge Per Unit
                                    </label>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {currentStep === 3 && hallId && (
                <MediaUpload
                  hallId={hallId}
                  initialImages={(hall as HallData | undefined)?.images || []}
                  initialVideos={(hall as HallData | undefined)?.videos || []}
                  onUploadSuccess={(urls) => {
                    const uploadedImages = urls.filter(url => !isVideo(url));
                    if (uploadedImages.length > 0) {
                      setHasUploadedImages(true);
                    }
                  }}
                />
              )}
            </>
          )}

          <div className="flex justify-end mt-8 space-x-3">
            {!hall && currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all disabled:opacity-50"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-dark shadow-md shadow-primary/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : (hall ? 'Save Changes' : (currentStep === 1 || currentStep === 2 ? 'Continue' : 'Finish'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HallModal;
