"use client";
import React, { useState, useEffect } from "react";
import { X, User, Mail, Phone, Ticket, CreditCard, CheckCircle2, ShieldCheck, Globe, MapPin } from "lucide-react";
import api from "@/services/api";
import CustomLoader from "@/components/CustomLoader";
import { Ticket as TicketType, RegistrationField } from "@/types";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";

interface WalkInRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  tickets: TicketType[];
  registrationFields?: RegistrationField[];
  onSuccess: () => void;
}

const NIGERIA_ID = '69aff562d1c0a2766615663c';

const isNigeria = (countryValue: string, countries: { _id: string; name: string }[]) => {
  if (!countryValue) return false;
  return countryValue === NIGERIA_ID || countries.find(c => c._id === countryValue)?.name === 'Nigeria';
};

const isFullWidthField = (field: RegistrationField) => {
  return (
    field.name === 'fullName' ||
    field.name === 'full-name' ||
    field.name === 'email' ||
    field.type === 'textarea' ||
    field.type === 'checkbox'
  );
};

const WalkInRegistrationModal = ({
  isOpen,
  onClose,
  eventId,
  tickets,
  registrationFields,
  onSuccess
}: WalkInRegistrationModalProps) => {
  const [loading, setLoading] = useState(false);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [fields, setFields] = useState<RegistrationField[]>([]);

  const [countries, setCountries] = useState<{ _id: string; name: string }[]>([]);
  const [states, setStates] = useState<Record<string, { _id: string; name: string }[]>>({}); // countryId -> states
  const [lgas, setLgas] = useState<Record<string, { _id: string; name: string }[]>>({}); // stateId -> lgas

  const [formData, setFormData] = useState<{
    ticketId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    attendeeData: Record<string, any>;
    paymentMethod: string;
    autoCheckIn: boolean;
  }>({
    ticketId: "",
    attendeeData: {},
    paymentMethod: "CASH",
    autoCheckIn: true,
  });

  // Load fields and initialize values when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadFieldsAndInitialize = async () => {
      setFieldsLoading(true);
      let activeFields: RegistrationField[] = [];

      if (registrationFields && registrationFields.length > 0) {
        activeFields = registrationFields;
      } else {
        try {
          const res = await api.get(`/events/${eventId}`);
          activeFields = res.data?.data?.registrationFields || [];
        } catch (err) {
          console.error("Failed to fetch event registration fields inside walk-in modal:", err);
        }
      }

      // Fallback defaults if no fields exist
      if (!activeFields || activeFields.length === 0) {
        activeFields = [
          { name: "fullName", label: "Full Name", type: "text", required: true, isPerAttendee: true },
          { name: "email", label: "Email Address", type: "text", required: true, isPerAttendee: true },
          { name: "phone", label: "Phone Number", type: "text", required: true, isPerAttendee: true }
        ];
      }

      setFields(activeFields);

      // Initialize form values
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const initialAttendeeData: Record<string, any> = {};
      activeFields.forEach(field => {
        initialAttendeeData[field.name] = field.type === "checkbox" && field.options && field.options.length > 0 ? [] : "";
      });

      setFormData(prev => ({
        ...prev,
        attendeeData: {
          ...initialAttendeeData,
          ...prev.attendeeData
        }
      }));

      // Fetch countries if needed
      const hasCountriesField = activeFields.some(f => f.source === 'COUNTRIES');
      if (hasCountriesField) {
        try {
          const countriesRes = await api.get('/locations/countries');
          const filteredCountries = (countriesRes.data.data || []).filter((c: { _id: string; name: string }) => c && c.name && c._id);
          setCountries(filteredCountries);
        } catch (err) {
          console.error("Failed to fetch countries inside walk-in modal:", err);
        }
      }

      setFieldsLoading(false);
    };

    loadFieldsAndInitialize();
  }, [isOpen, eventId, registrationFields]);

  if (!isOpen) return null;

  const fetchDependentData = async (field: RegistrationField, parentValue: string) => {
    if (!parentValue) return;

    if (field.source === 'STATES') {
      if (!isNigeria(parentValue, countries)) return;

      if (!states[parentValue]) {
        try {
          const res = await api.get(`/locations/states/${parentValue}`);
          const filteredStates = (res.data.data || []).filter((s: { _id: string; name: string }) => s && s.name && s._id);
          setStates(prev => ({ ...prev, [parentValue]: filteredStates }));
        } catch (err) {
          console.error("Failed to fetch states inside walk-in modal:", err);
        }
      }
    } else if (field.source === 'LGAS') {
      const isNigerianState = Object.values(states).some(list => list.some(s => s._id === parentValue));
      if (!isNigerianState) return;

      if (!lgas[parentValue]) {
        try {
          const res = await api.get(`/locations/lgas/${parentValue}`);
          const filteredLgas = (res.data.data || []).filter((l: { _id: string; name: string }) => l && l.name && l._id);
          setLgas(prev => ({ ...prev, [parentValue]: filteredLgas }));
        } catch (err) {
          console.error("Failed to fetch LGAs inside walk-in modal:", err);
        }
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFieldChange = (field: RegistrationField, value: any) => {
    const fieldName = field.name;
    setFormData(prev => {
      const newAttendeeData = {
        ...prev.attendeeData,
        [fieldName]: value
      };

      // Reset dependent fields if any
      const dependentFields = fields.filter(f => f.dependsOn === fieldName);
      dependentFields.forEach(f => {
        newAttendeeData[f.name] = f.type === "checkbox" && f.options && f.options.length > 0 ? [] : "";
      });

      return {
        ...prev,
        attendeeData: newAttendeeData
      };
    });

    const dependentFields = fields.filter(f => f.dependsOn === fieldName);
    dependentFields.forEach(f => {
      fetchDependentData(f, value);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ticketId) {
      Swal.fire("Error", "Please select a ticket type", "error");
      return;
    }

    try {
      setLoading(true);
      Swal.showLoading();

      // Find core field names from configuration to extract their values
      const fullNameKey = fields.find(f => f.name === 'fullName' || f.name === 'full-name')?.name || 'fullName';
      const emailKey = fields.find(f => f.name === 'email')?.name || 'email';
      const phoneKey = fields.find(f => f.name === 'phone')?.name || 'phone';

      // Build safe finalAttendeeData with core keys guaranteed and also custom values preserved
      const finalAttendeeData = {
        ...formData.attendeeData,
        fullName: formData.attendeeData[fullNameKey] || formData.attendeeData.fullName || "",
        email: formData.attendeeData[emailKey] || formData.attendeeData.email || "",
        phone: formData.attendeeData[phoneKey] || formData.attendeeData.phone || "",
      };

      const payload = {
        ticketId: formData.ticketId,
        attendeeData: finalAttendeeData,
        paymentMethod: formData.paymentMethod,
        guestCategoryId: formData.ticketId, // Assuming guestCategoryId is same as ticketId for walk-ins
        autoCheckIn: formData.autoCheckIn
      };

      await api.post(`/events/${eventId}/walk-in`, payload);

      await Swal.fire({
        title: "Registration Successful!",
        text: formData.autoCheckIn
          ? "The guest has been registered and checked in successfully."
          : "The guest has been registered and can now be checked in.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false
      });

      onSuccess();
      onClose();

      // Reset
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resetAttendeeData: Record<string, any> = {};
      fields.forEach(f => {
        resetAttendeeData[f.name] = f.type === "checkbox" && f.options && f.options.length > 0 ? [] : "";
      });

      setFormData({
        ticketId: "",
        attendeeData: resetAttendeeData,
        paymentMethod: "CASH",
        autoCheckIn: true,
      });
    } catch (error) {
      console.error("Walk-in registration failed:", error);
      Swal.fire("Registration Failed", translateError(error), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white w-full max-w-3xl rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-primary p-5 sm:p-7 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 sm:top-5 right-4 sm:right-6 p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="flex items-center gap-3 sm:gap-4 mb-1 sm:mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-md">
              <User className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase italic">
                Walk-in <span className="text-white not-italic">Registration</span>
              </h2>
              <p className="text-white/70 text-[11px] sm:text-sm font-medium">Manual Guest Entry</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7 space-y-6 sm:space-y-7 overflow-y-auto no-scrollbar flex-1">
          <form id="walk-in-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Ticket Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Ticket Type</label>
              <div className="grid grid-cols-1 gap-3">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, ticketId: ticket.id || "" })}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                      formData.ticketId === ticket.id
                        ? "border-primary bg-blue-50 shadow-md"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.ticketId === ticket.id ? "bg-primary text-white" : "bg-gray-100 text-gray-400"}`}>
                        <Ticket size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{ticket.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                          {Number(ticket.price) > 0 ? `₦${Number(ticket.price).toLocaleString()}` : "FREE"}
                        </p>
                      </div>
                    </div>
                    {formData.ticketId === ticket.id && <CheckCircle2 size={20} className="text-primary" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Guest/Attendee Details Form Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-l-4 border-primary pl-3">
                Guest Details
              </h3>

              {fieldsLoading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <CustomLoader className="w-8 h-8 text-primary" />
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Loading fields...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fields.map((field) => {
                    const displayLabel = field.label;

                    // Determine if we should show a text input instead of a select for location fields
                    const countryField = fields.find(f => f.source === 'COUNTRIES');
                    const countryValue = countryField ? formData.attendeeData[countryField.name] : null;
                    const isNotNigeria = countryValue && !isNigeria(countryValue, countries);
                    const hasCountryField = !!countryField;

                    let resolvedLabel = displayLabel;
                    if (isNotNigeria) {
                      if (field.source === 'STATES') resolvedLabel = 'Province/State';
                      else if (field.source === 'LGAS') resolvedLabel = 'City';
                    }

                    const isFullWidth = isFullWidthField(field);

                    const showTextInput =
                      ((field.type === 'text' || field.type === 'number') && !field.source) ||
                      ((field.source === 'STATES' || field.source === 'LGAS') && isNotNigeria) ||
                      (field.source === 'STATES' && !hasCountryField);

                    const showSelect = (field.type === 'select' || !!field.source) && !showTextInput;
                    const showCheckboxGroup = (field.type === 'checkbox' && field.options && field.options.length > 0);
                    const showSingleCheckbox = (field.type === 'checkbox') && !showCheckboxGroup;
                    const showTextarea = field.type === 'textarea';

                    // Decide icon
                    let IconComponent = null;
                    if (field.name === 'fullName' || field.name === 'full-name') IconComponent = User;
                    else if (field.name === 'email') IconComponent = Mail;
                    else if (field.name === 'phone') IconComponent = Phone;
                    else if (field.source === 'COUNTRIES') IconComponent = Globe;
                    else if (field.source === 'STATES' || field.source === 'LGAS') IconComponent = MapPin;

                    return (
                      <div key={field.name} className={`${isFullWidth ? "md:col-span-2" : ""} space-y-2`}>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                          {resolvedLabel} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <div className="relative">
                          {IconComponent && (
                            <IconComponent size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                          )}

                          {showTextInput ? (
                            <input
                              required={field.required}
                              type={field.type === 'number' ? 'number' : 'text'}
                              placeholder={`Enter ${resolvedLabel}`}
                              className={`w-full pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-primary transition-all outline-none ${IconComponent ? "pl-12" : "px-6"}`}
                              value={formData.attendeeData[field.name] ?? ""}
                              onChange={(e) => handleFieldChange(field, e.target.value)}
                            />
                          ) : showSelect ? (
                            <select
                              required={field.required}
                              className={`w-full pr-10 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-primary transition-all outline-none appearance-none ${IconComponent ? "pl-12" : "px-6"}`}
                              value={formData.attendeeData[field.name] ?? ""}
                              onChange={(e) => handleFieldChange(field, e.target.value)}
                            >
                              <option value="">Select {resolvedLabel}...</option>
                              {field.source === 'COUNTRIES' ? (
                                countries.map((c) => (
                                  <option key={c._id} value={c._id}>{c.name}</option>
                                ))
                              ) : field.source === 'STATES' ? (
                                (() => {
                                  const parentValue = formData.attendeeData[field.dependsOn!];
                                  return states[parentValue]?.map((s) => (
                                    <option key={s._id} value={s._id}>{s.name}</option>
                                  ));
                                })()
                              ) : field.source === 'LGAS' ? (
                                (() => {
                                  const parentValue = formData.attendeeData[field.dependsOn!];
                                  return lgas[parentValue]?.map((l) => (
                                    <option key={l._id} value={l._id}>{l.name}</option>
                                  ));
                                })()
                              ) : (
                                field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)
                              )}
                            </select>
                          ) : showTextarea ? (
                            <textarea
                              required={field.required}
                              placeholder={`Enter ${resolvedLabel}`}
                              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-primary transition-all outline-none min-h-[100px]"
                              value={formData.attendeeData[field.name] ?? ""}
                              onChange={(e) => handleFieldChange(field, e.target.value)}
                            />
                          ) : showCheckboxGroup ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {field.options?.map((opt) => {
                                const currentValue = formData.attendeeData[field.name] || [];
                                const isChecked = Array.isArray(currentValue)
                                  ? currentValue.includes(opt)
                                  : currentValue === opt;

                                return (
                                  <label key={opt} className="flex items-center gap-3 p-3.5 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer hover:bg-white hover:border-primary/20 hover:shadow-sm transition-all">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const arr = Array.isArray(currentValue) ? [...currentValue] : (currentValue ? [currentValue] : []);
                                        if (e.target.checked) {
                                          if (!arr.includes(opt)) arr.push(opt);
                                        } else {
                                          const indexOpt = arr.indexOf(opt);
                                          if (indexOpt > -1) arr.splice(indexOpt, 1);
                                        }
                                        handleFieldChange(field, arr);
                                      }}
                                      className="w-5 h-5 rounded border-gray-300 text-primary cursor-pointer shrink-0"
                                    />
                                    <span className="text-sm font-bold text-gray-700 break-words">{opt}</span>
                                  </label>
                                );
                              })}
                            </div>
                          ) : showSingleCheckbox ? (
                            <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                              <input
                                type="checkbox"
                                checked={!!formData.attendeeData[field.name]}
                                onChange={(e) => handleFieldChange(field, e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 text-primary"
                              />
                              <span className="text-sm font-bold text-gray-700">{field.label}</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Auto Check-in Toggle */}
            <div className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all duration-300 group/checkin">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${formData.autoCheckIn ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-gray-300 border border-gray-100'}`}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Check-in guest immediately</h4>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">Automated Arrival Process</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, autoCheckIn: !prev.autoCheckIn }))}
                className={`w-14 h-8 rounded-full transition-all relative ${formData.autoCheckIn ? 'bg-primary' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${formData.autoCheckIn ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Method</label>
              <div className="flex gap-3">
                {["CASH", "TRANSFER", "POS"].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: method })}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-xs transition-all ${
                      formData.paymentMethod === method
                        ? "border-primary bg-blue-50 text-primary"
                        : "border-gray-100 text-gray-400 hover:border-gray-200"
                    }`}
                  >
                    <CreditCard size={14} />
                    {method}
                  </button>
                ))}
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-7 bg-gray-50/80 backdrop-blur-md border-t border-gray-100 shrink-0">
          <div className="flex justify-end gap-3 sm:gap-4">
            <button
              onClick={onClose}
              className="px-4 sm:px-6 py-2.5 sm:py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              form="walk-in-form"
              type="submit"
              disabled={loading || fieldsLoading}
              className="px-6 sm:px-10 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.2em] shadow-xl shadow-emerald-900/20 hover:shadow-emerald-900/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <CustomLoader className="w-3 h-3" />
                  Processing...
                </>
              ) : (
                <>
                  Complete Registration
                  <CheckCircle2 size={16} className="group-hover:rotate-12 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalkInRegistrationModal;
