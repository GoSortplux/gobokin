"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Users,
  Mail,
  Phone,
  Info,
  ShieldCheck,
  CreditCard,
  Ticket,
  Tag
} from "lucide-react";
import api from "@/services/api";
import { Event, Ticket as TicketType, RegistrationField, PricingBreakdown } from "@/types";
import CustomLoader from "@/components/CustomLoader";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";
import { useAuth } from "@/context/AuthContext";
import LoginRequiredModal from "@/components/auth/LoginRequiredModal";
import CheckoutBreakdownModal from "@/components/shared/CheckoutBreakdownModal";

const NIGERIA_ID = '69aff562d1c0a2766615663c';

const isNigeria = (countryValue: string, countries: { _id: string; name: string }[]) => {
  if (!countryValue) return false;
  return countryValue === NIGERIA_ID || countries.find(c => c._id === countryValue)?.name === 'Nigeria';
};

const RegistrationForm = () => {
  const { organizerSlug, eventSlug } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const ticketId = searchParams.get("ticketId");
  const quantity = parseInt(searchParams.get("qty") || "1");

  const [event, setEvent] = useState<Event | null>(null);
  const [ticket, setTicket] = useState<TicketType | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [pricingBreakdown, setPricingBreakdown] = useState<PricingBreakdown | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState("");

  // Dynamic data for selects
  const [countries, setCountries] = useState<{ _id: string; name: string }[]>([]);
  const [states, setStates] = useState<Record<string, { _id: string; name: string }[]>>({}); // countryId -> states
  const [lgas, setLgas] = useState<Record<string, { _id: string; name: string }[]>>({}); // stateId -> lgas

  // Registration data state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attendees, setAttendees] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sharedData, setSharedData] = useState<Record<string, any>>({});
  const [discountCode, setDiscountCode] = useState("");

  useEffect(() => {
    const fetchRegistrationData = async () => {
      try {
        setLoading(true);

        const response = await api.get(`/events/e/${organizerSlug}/${eventSlug}`);
        const eventData = response.data.data as Event;
        setEvent(eventData);

        // Fetch initial dynamic data for fields that don't depend on anything
        const independentDynamicFields = (eventData.registrationFields || []).filter(f => f.source && !f.dependsOn);

        for (const field of independentDynamicFields) {
          if (field.source === 'COUNTRIES') {
            try {
              const countriesRes = await api.get('/locations/countries');
              // Filter out invalid/empty data
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const filteredCountries = (countriesRes.data.data || []).filter((c: any) => c && c.name && c._id);
              setCountries(filteredCountries);
            } catch (err) {
              console.error("Failed to fetch countries:", err);
            }
          }
          // Add other independent sources here if they exist in the future
        }

        const selectedTicket = eventData.tickets?.find(t => t.id === ticketId);
        setTicket(selectedTicket || null);

        if (selectedTicket) {
          const now = new Date();
          const sStart = selectedTicket.salesStart ? new Date(selectedTicket.salesStart) : null;
          const sEnd = selectedTicket.salesEnd ? new Date(selectedTicket.salesEnd) : null;

          if (sStart && now < sStart) {
            Swal.fire({
              title: "Sale Not Started",
              text: "The ticket sale for this event has not yet started.",
              icon: "info",
              confirmButtonText: "Return to Event",
              confirmButtonColor: "#295FA7",
            }).then(() => {
              router.push(`/events/${organizerSlug}/${eventSlug}`);
            });
            return;
          }

          if (sEnd && now > sEnd) {
            Swal.fire({
              title: "Sale Ended",
              text: "The ticket sale for this event has ended.",
              icon: "warning",
              confirmButtonText: "Return to Event",
              confirmButtonColor: "#295FA7",
            }).then(() => {
              router.push(`/events/${organizerSlug}/${eventSlug}`);
            });
            return;
          }

          const maxLimit = Math.min(
            selectedTicket.availableQuantity || 0,
            selectedTicket.maxPerOrder && selectedTicket.maxPerOrder > 0 ? selectedTicket.maxPerOrder : Infinity
          );

          if (quantity > maxLimit) {
            Swal.fire({
              title: "Limit Exceeded",
              text: `You can only purchase a maximum of ${maxLimit} tickets for this event.`,
              icon: "warning",
              confirmButtonText: "Return to Event",
              confirmButtonColor: "#295FA7",
            }).then(() => {
              router.push(`/events/${organizerSlug}/${eventSlug}`);
            });
            return;
          }
        }

        // Check for draft data
        const draftKey = `gobokin_registration_draft_${eventData.id}`;
        const draftDataString = localStorage.getItem(draftKey);
        let draftData = null;
        if (draftDataString) {
          try {
            draftData = JSON.parse(draftDataString);
            localStorage.removeItem(draftKey);
          } catch (e) {
            console.error("Failed to parse registration draft", e);
          }
        }

        if (draftData) {
          setAttendees(draftData.attendees);
          setSharedData(draftData.sharedData);
        } else {
          // Initialize attendees array based on quantity and actual fields
          const initialAttendees = Array.from({ length: quantity }, () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const attendeeObj: any = {};
            (eventData.registrationFields || []).forEach(f => {
              if (f.isPerAttendee) {
                attendeeObj[f.name] = f.type === 'checkbox' ? false : "";
              }
            });
            // Defensive fallbacks for buyerInfo requirements
            const fullNameKey = (eventData.registrationFields || []).find(f => f.name === 'fullName' || f.name === 'full-name')?.name || 'fullName';
            if (!attendeeObj[fullNameKey]) attendeeObj[fullNameKey] = "";
            if (!attendeeObj["email"]) attendeeObj["email"] = "";
            return attendeeObj;
          });
          setAttendees(initialAttendees);

          // Initialize shared data
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const initialShared: any = {};
          (eventData.registrationFields || []).forEach(f => {
            if (!f.isPerAttendee) {
              initialShared[f.name] = f.type === 'checkbox' ? false : "";
            }
          });
          setSharedData(initialShared);
        }

      } catch (error) {
        console.error("Failed to fetch registration data:", error);
        Swal.fire("Error", translateError(error), "error");
      } finally {
        setLoading(false);
      }
    };
    fetchRegistrationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizerSlug, eventSlug, ticketId, quantity]);

  const fetchDependentData = async (field: RegistrationField, parentValue: string) => {
    if (!parentValue) return;

    if (field.source === 'STATES') {
      if (!isNigeria(parentValue, countries)) return;

      if (!states[parentValue]) {
        try {
          const res = await api.get(`/locations/states/${parentValue}`);
          // Filter out invalid/empty data
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const filteredStates = (res.data.data || []).filter((s: any) => s && s.name && s._id);
          setStates(prev => ({ ...prev, [parentValue]: filteredStates }));
        } catch (err) {
          console.error("Failed to fetch states:", err);
        }
      }
    } else if (field.source === 'LGAS') {
      // Check if parent state is Nigerian (exists in our states cache)
      const isNigerianState = Object.values(states).some(list => list.some(s => s._id === parentValue));
      if (!isNigerianState) return;

      if (!lgas[parentValue]) {
        try {
          const res = await api.get(`/locations/lgas/${parentValue}`);
          // Filter out invalid/empty data
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const filteredLgas = (res.data.data || []).filter((l: any) => l && l.name && l._id);
          setLgas(prev => ({ ...prev, [parentValue]: filteredLgas }));
        } catch (err) {
          console.error("Failed to fetch LGAs:", err);
        }
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAttendeeChange = (index: number, field: RegistrationField, value: any) => {
    const fieldName = field.name;

    setAttendees(prev => {
      const newAttendees = [...prev];
      const attendee = { ...newAttendees[index] };
      attendee[fieldName] = value;

      const resetDependents = (name: string) => {
        (event?.registrationFields || []).forEach(f => {
          if (f.dependsOn === name && f.isPerAttendee) {
            attendee[f.name] = f.type === 'checkbox' ? false : "";
            resetDependents(f.name);
          }
        });
      };

      resetDependents(fieldName);
      newAttendees[index] = attendee;
      return newAttendees;
    });

    // Fetch dependent data if needed
    const dependentFields = (event?.registrationFields || []).filter(f => f.dependsOn === fieldName);
    dependentFields.forEach(f => fetchDependentData(f, value));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSharedChange = (field: RegistrationField, value: any) => {
    const fieldName = field.name;

    setSharedData(prev => {
      const newShared = { ...prev, [fieldName]: value };
      const resetDependents = (name: string) => {
        (event?.registrationFields || []).forEach(f => {
          if (f.dependsOn === name && !f.isPerAttendee) {
            newShared[f.name] = f.type === 'checkbox' ? false : "";
            resetDependents(f.name);
          }
        });
      };
      resetDependents(fieldName);
      return newShared;
    });

    // Reset dependent fields in attendees as well
    setAttendees(prev => prev.map(att => {
        const newAtt = { ...att };
        const resetAttDependents = (name: string) => {
            (event?.registrationFields || []).forEach(f => {
                if (f.dependsOn === name && f.isPerAttendee) {
                    newAtt[f.name] = f.type === 'checkbox' ? false : "";
                    resetAttDependents(f.name);
                }
            });
        };
        resetAttDependents(fieldName);
        return newAtt;
    }));

    // Fetch dependent data if needed
    const dependentFields = (event?.registrationFields || []).filter(f => f.dependsOn === fieldName);
    dependentFields.forEach(f => fetchDependentData(f, value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      // Save draft to localStorage
      const draftKey = `gobokin_registration_draft_${event?.id}`;
      localStorage.setItem(draftKey, JSON.stringify({
        attendees,
        sharedData
      }));
      setShowLoginModal(true);
      return;
    }

    setSubmitting(true);

    try {
      Swal.showLoading();

      // Find the key used for full name (could be 'full-name' or 'fullName')
      const fullNameKey = (event?.registrationFields || []).find(f => f.name === 'fullName' || f.name === 'full-name')?.name || 'fullName';

      // Map attendees to ensure both 'fullName' (for backend structure) and original dynamic key exist
      const mappedAttendees = attendees.map(att => ({
        ...att,
        fullName: att[fullNameKey],
      }));

      const payload = {
        ticketId: ticketId,
        quantity: quantity,
        buyerInfo: {
          ...attendees[0],
          fullName: attendees[0][fullNameKey],
          email: attendees[0]["email"],
          phone: attendees[0]["phone"],
        },
        attendees: mappedAttendees,
        sharedData: sharedData,
        discountCode: discountCode || undefined,
      };

      const response = await api.post(`/events/${event?.id}/orders`, payload);
      const orderData = response.data.data;

      // If order is successful, check if it's a free ticket or needs payment
      if (Number(ticket?.price) === 0) {
        await Swal.fire({
          title: "Registration Successful!",
          text: "Your ticket has been sent to your email.",
          icon: "success",
          confirmButtonColor: "#295FA7",
        });
        router.push("/dashboard?tab=events");
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const registrationIds = orderData.registrations.map((reg: any) => reg.id);
        const paymentRes = await api.post("/events/payments/initialize", {
           registrationIds: registrationIds
        });

        const { checkoutUrl, pricingBreakdown } = paymentRes.data.data;

        if (checkoutUrl && pricingBreakdown) {
          setPricingBreakdown(pricingBreakdown);
          setCheckoutUrl(checkoutUrl);
          setShowBreakdownModal(true);
          setSubmitting(false);
          Swal.close();
        } else if (checkoutUrl) {
           window.location.href = checkoutUrl;
        } else {
           throw new Error("Failed to get payment checkout URL");
        }
      }
    } catch (error) {
      console.error("Registration failed:", error);
      Swal.fire("Registration Error", translateError(error), "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen pt-32 flex items-center justify-center bg-gray-50"><CustomLoader /></div>;
  if (!event || !ticket) return <div className="p-20 text-center bg-gray-50"><h3 className="text-xl font-bold">Registration data missing</h3></div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-24">
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Sign in required"
        message="You need to sign in to complete your ticket purchase."
      />
      {pricingBreakdown && (
        <CheckoutBreakdownModal
          isOpen={showBreakdownModal}
          onClose={() => setShowBreakdownModal(false)}
          onConfirm={() => {
            window.location.href = checkoutUrl;
          }}
          breakdown={pricingBreakdown}
        />
      )}
      <div className="container mx-auto px-4 max-w-4xl">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold mb-8 group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back to Event
        </button>

        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl shadow-blue-900/10 overflow-hidden">
          {/* Header */}
          <div className="bg-primary p-12 text-white relative">
             <div className="relative z-10">
                <p className="text-xs font-black uppercase tracking-widest text-blue-100 mb-2">Registering for</p>
                <h1 className="text-3xl lg:text-4xl font-black mb-6">{event.title}</h1>
                <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-blue-50">
                   <div className="flex items-center gap-2">
                      <Ticket size={18} />
                      {ticket.name} x {quantity}
                   </div>
                   <div className="flex items-center gap-2">
                      <Info size={18} />
                      {event.registrationMode.replace('_', ' ')} Registration
                   </div>
                </div>
             </div>
             {/* Decorative */}
             <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none"></div>
          </div>

          <div className="p-8 lg:p-12">
            <form onSubmit={handleSubmit} className="space-y-12">
              <div className="space-y-8">
                 {/* Group Details Section */}
                 {event.isGroupingEnabled && (event.registrationFields || []).some(f => !f.isPerAttendee) && (
                    <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                       <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary font-black">
                            <Users size={20} />
                          </div>
                          <h4 className="font-black text-gray-900">Group Details</h4>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {(event.registrationFields || []).filter(f => !f.isPerAttendee).map((field) => {
                            // Determine if we should show a text input instead of a select for location fields
                            const countryField = (event.registrationFields || []).find(f => f.source === 'COUNTRIES');
                            const countryValue = countryField ? sharedData[countryField.name] : null;
                            const isNotNigeria = countryValue && !isNigeria(countryValue, countries);

                            let displayLabel = field.label;
                            if (isNotNigeria) {
                              if (field.source === 'STATES') displayLabel = 'Province/State';
                              else if (field.source === 'LGAS') displayLabel = 'City';
                            }

                            return (
                              <div key={field.name} className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                                  {displayLabel} {field.required && <span className="text-red-500">*</span>}
                                </label>
                                <div className="relative">
                                   {(field.name === 'full-name' || field.name === 'fullName') && <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />}
                                   {field.name === 'email' && <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />}
                                   {field.name === 'phone' && <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />}

                                   {((field.type === 'text' || field.type === 'number') && !field.source) ||
                                    ((field.source === 'STATES' || field.source === 'LGAS') && isNotNigeria) ? (
                                      <input
                                        type={field.type === 'number' ? 'number' : 'text'}
                                        name={field.name}
                                        placeholder={`Enter ${displayLabel}`}
                                        required={field.required}
                                        className={`w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all ${['full-name', 'fullName', 'email', 'phone'].includes(field.name) ? 'pl-12' : ''}`}
                                        value={sharedData[field.name] || ""}
                                        onChange={(e) => handleSharedChange(field, e.target.value)}
                                      />
                                    ) : (field.type === 'select' || !!field.source) ? (
                                      <select
                                        required={field.required}
                                        className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                                        value={sharedData[field.name] || ""}
                                        onChange={(e) => handleSharedChange(field, e.target.value)}
                                      >
                                         <option value="">Please select...</option>
                                         {field.source === 'COUNTRIES' ? (
                                            countries.map((c) => (
                                              <option key={c._id} value={c._id}>{c.name}</option>
                                            ))
                                         ) : field.source === 'STATES' ? (
                                           (() => {
                                             const parentValue = sharedData[field.dependsOn!];
                                             return states[parentValue]?.map((s) => (
                                               <option key={s._id} value={s._id}>{s.name}</option>
                                             ));
                                           })()
                                         ) : field.source === 'LGAS' ? (
                                           (() => {
                                              const parentValue = sharedData[field.dependsOn!];
                                              return lgas[parentValue]?.map((l) => (
                                                <option key={l._id} value={l._id}>{l.name}</option>
                                              ));
                                           })()
                                         ) : (
                                           field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)
                                         )}
                                      </select>
                                    ) : (
                                      <div className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl">
                                         <input
                                          type="checkbox"
                                          checked={sharedData[field.name] || false}
                                          onChange={(e) => handleSharedChange(field, e.target.checked)}
                                          className="w-5 h-5 rounded border-gray-300 text-primary"
                                         />
                                         <span className="text-sm font-medium text-gray-700">{field.label}</span>
                                      </div>
                                    )}
                                </div>
                              </div>
                            );
                          })}
                       </div>
                    </div>
                 )}

                 {/* Attendee Details Section */}
                 {attendees.map((attendee, index) => {
                    const hasGroupFields = (event.registrationFields || []).some(f => !f.isPerAttendee);
                    const hasAttendeeFields = (event.registrationFields || []).some(f => f.isPerAttendee);

                    // If grouping is enabled, we show attendee card if there are per-attendee fields
                    // If grouping is disabled, we show attendee card if there are ANY fields (since shared fields show for attendee 0)
                    const showAttendeeCard = event.isGroupingEnabled ? hasAttendeeFields : (hasAttendeeFields || (index === 0 && hasGroupFields));

                    if (!showAttendeeCard) return null;

                    return (
                       <div
                          key={index}
                          className={`p-8 ${event.isGroupingEnabled ? 'bg-secondary/5 border-secondary/10' : 'bg-gray-50 border-gray-100'} rounded-[2.5rem] border space-y-6 animate-in slide-in-from-bottom-4 duration-500`}
                          style={{ animationDelay: `${(index + (event.isGroupingEnabled ? 1 : 0)) * 100}ms` }}
                       >
                          <div className="flex items-center gap-3 mb-2">
                             <div className={`w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center ${event.isGroupingEnabled ? 'text-secondary' : 'text-primary'} font-black relative`}>
                               {index + 1}
                               {event.isGroupingEnabled && (
                                 <div className="absolute -top-1 -right-1 w-4 h-4 bg-secondary text-white rounded-full flex items-center justify-center">
                                   <User size={10} strokeWidth={3} />
                                 </div>
                               )}
                             </div>
                             <h4 className="font-black text-gray-900">Attendee #{index + 1} Details</h4>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             {(event.registrationFields || []).map((field) => {
                               // When grouping is enabled, non-per-attendee fields are in the Group Details card
                               if (event.isGroupingEnabled && !field.isPerAttendee) return null;

                               // When grouping is NOT enabled, non-per-attendee fields only show for the first attendee
                               if (!event.isGroupingEnabled && !field.isPerAttendee && index !== 0) return null;

                               // Determine if we should show a text input instead of a select for location fields
                               const countryField = (event.registrationFields || []).find(f => f.source === 'COUNTRIES');
                               const countryValue = countryField ? (countryField.isPerAttendee ? attendees[index][countryField.name] : sharedData[countryField.name]) : null;
                               const isNotNigeria = countryValue && !isNigeria(countryValue, countries);

                               let displayLabel = field.label;
                               if (isNotNigeria) {
                                 if (field.source === 'STATES') displayLabel = 'Province/State';
                                 else if (field.source === 'LGAS') displayLabel = 'City';
                               }

                               return (
                                 <div key={field.name} className="space-y-2">
                                   <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                                     {displayLabel} {field.required && <span className="text-red-500">*</span>}
                                   </label>
                                   <div className="relative">
                                      {(field.name === 'full-name' || field.name === 'fullName') && <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />}
                                      {field.name === 'email' && <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />}
                                      {field.name === 'phone' && <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />}

                                      {((field.type === 'text' || field.type === 'number') && !field.source) ||
                                       ((field.source === 'STATES' || field.source === 'LGAS') && isNotNigeria) ? (
                                         <input
                                           type={field.type === 'number' ? 'number' : 'text'}
                                           name={field.name}
                                           placeholder={`Enter ${displayLabel}`}
                                           required={field.required}
                                           className={`w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all ${['full-name', 'fullName', 'email', 'phone'].includes(field.name) ? 'pl-12' : ''}`}
                                           value={field.isPerAttendee ? attendees[index][field.name] || "" : sharedData[field.name] || ""}
                                           onChange={(e) => field.isPerAttendee ? handleAttendeeChange(index, field, e.target.value) : handleSharedChange(field, e.target.value)}
                                         />
                                       ) : (field.type === 'select' || !!field.source) ? (
                                         <select
                                           required={field.required}
                                           className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                                           value={field.isPerAttendee ? attendees[index][field.name] || "" : sharedData[field.name] || ""}
                                           onChange={(e) => field.isPerAttendee ? handleAttendeeChange(index, field, e.target.value) : handleSharedChange(field, e.target.value)}
                                         >
                                            <option value="">Please select...</option>
                                            {field.source === 'COUNTRIES' ? (
                                               countries.map((c) => (
                                                 <option key={c._id} value={c._id}>{c.name}</option>
                                               ))
                                            ) : field.source === 'STATES' ? (
                                              (() => {
                                                const parentValue = field.isPerAttendee ? attendees[index][field.dependsOn!] : sharedData[field.dependsOn!];
                                                return states[parentValue]?.map((s) => (
                                                  <option key={s._id} value={s._id}>{s.name}</option>
                                                ));
                                              })()
                                            ) : field.source === 'LGAS' ? (
                                              (() => {
                                                 const parentValue = field.isPerAttendee ? attendees[index][field.dependsOn!] : sharedData[field.dependsOn!];
                                                 return lgas[parentValue]?.map((l) => (
                                                   <option key={l._id} value={l._id}>{l.name}</option>
                                                 ));
                                              })()
                                            ) : (
                                              field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)
                                            )}
                                         </select>
                                       ) : (
                                         <div className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl">
                                            <input
                                             type="checkbox"
                                             checked={field.isPerAttendee ? attendees[index][field.name] || false : sharedData[field.name] || false}
                                             onChange={(e) => field.isPerAttendee ? handleAttendeeChange(index, field, e.target.checked) : handleSharedChange(field, e.target.checked)}
                                             className="w-5 h-5 rounded border-gray-300 text-primary"
                                            />
                                            <span className="text-sm font-medium text-gray-700">{field.label}</span>
                                         </div>
                                       )}
                                   </div>
                                 </div>
                               );
                             })}
                          </div>
                       </div>
                    );
                 })}
              </div>

              {/* Discount Code Section */}
              <div className="p-8 bg-white rounded-[2.5rem] border border-gray-100 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Tag size={20} />
                  </div>
                  <h4 className="font-black text-gray-900">Discount Code</h4>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                    Voucher / Promo Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter discount code"
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all font-bold tracking-widest uppercase"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  />
                  <p className="text-[10px] font-bold text-gray-400 ml-1">If you have a referral or promo code, enter it here.</p>
                </div>
              </div>

              {/* Order Summary Footer */}
              <div className="pt-12 border-t border-gray-100">
                 <div className="bg-gray-900 rounded-[2.5rem] p-8 lg:p-12 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 skew-x-12"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                       <div className="space-y-4 text-center md:text-left">
                          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Order Summary</p>
                          <div className="flex items-center justify-center md:justify-start gap-4">
                             <h2 className="text-4xl lg:text-5xl font-black">₦{((ticket.price || 0) * quantity).toLocaleString()}</h2>
                             <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest">
                                {ticket.name} x {quantity}
                             </div>
                          </div>
                          <div className="flex items-center gap-6 justify-center md:justify-start text-xs font-bold text-gray-400 uppercase tracking-widest">
                             <div className="flex items-center gap-2">
                                <ShieldCheck size={16} className="text-emerald-400" />
                                Secure Checkout
                             </div>
                             <div className="flex items-center gap-2">
                                <CreditCard size={16} className="text-blue-400" />
                                Instant Ticket
                             </div>
                          </div>
                       </div>

                       <button
                         type="submit"
                         disabled={submitting}
                         className="w-full md:w-auto bg-white text-gray-900 font-black px-12 py-6 rounded-[2rem] hover:bg-primary hover:text-white transition-all shadow-xl text-lg flex items-center justify-center gap-3 group disabled:opacity-50"
                       >
                         {submitting ? "Processing..." : ticket.price === 0 ? "Get Tickets Now" : "Pay & Register Now"}
                         <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                       </button>
                    </div>
                 </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;
