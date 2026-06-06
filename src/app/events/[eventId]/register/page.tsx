"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  User,
  Mail,
  Phone,
  Info,
  ShieldCheck,
  CreditCard,
  Ticket
} from "lucide-react";
import api from "@/services/api";
import { Event, Ticket as TicketType, RegistrationField } from "@/types";
import CustomLoader from "@/components/CustomLoader";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";

const RegistrationForm = () => {
  const { eventId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const ticketId = searchParams.get("ticketId");
  const quantity = parseInt(searchParams.get("qty") || "1");

  const [event, setEvent] = useState<Event | null>(null);
  const [ticket, setTicket] = useState<TicketType | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dynamic data for selects
  const [countries, setCountries] = useState<{ _id: string; name: string }[]>([]);
  const [states, setStates] = useState<Record<string, { _id: string; name: string }[]>>({}); // countryId -> states
  const [lgas, setLgas] = useState<Record<string, { _id: string; name: string }[]>>({}); // stateId -> lgas

  // Registration data state
  const [attendees, setAttendees] = useState<any[]>([]);
  const [sharedData, setSharedData] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchRegistrationData = async () => {
      try {
        setLoading(true);

        const response = await api.get(`/events/${eventId}`);
        const eventData = response.data.data as Event;
        setEvent(eventData);

        // Fetch initial dynamic data for fields that don't depend on anything
        const independentDynamicFields = (eventData.registrationFields || []).filter(f => f.source && !f.dependsOn);

        for (const field of independentDynamicFields) {
          if (field.source === 'COUNTRIES') {
            try {
              const countriesRes = await api.get('/locations/countries');
              // Filter out invalid/empty data
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
              router.push(`/events/${eventId}`);
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
              router.push(`/events/${eventId}`);
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
              router.push(`/events/${eventId}`);
            });
            return;
          }
        }

        // Initialize attendees array based on quantity and actual fields
        const initialAttendees = Array.from({ length: quantity }, () => {
          const attendeeObj: any = {};
          (eventData.registrationFields || []).forEach(f => {
            if (f.isPerAttendee) {
              attendeeObj[f.name] = f.type === 'checkbox' ? false : "";
            }
          });
          // Defensive fallbacks for buyerInfo requirements
          if (!attendeeObj["full-name"]) attendeeObj["full-name"] = "";
          if (!attendeeObj["email"]) attendeeObj["email"] = "";
          return attendeeObj;
        });
        setAttendees(initialAttendees);

        // Initialize shared data
        const initialShared: any = {};
        (eventData.registrationFields || []).forEach(f => {
          if (!f.isPerAttendee) {
            initialShared[f.name] = f.type === 'checkbox' ? false : "";
          }
        });
        setSharedData(initialShared);

      } catch (error) {
        console.error("Failed to fetch registration data:", error);
        Swal.fire("Error", translateError(error), "error");
      } finally {
        setLoading(false);
      }
    };
    fetchRegistrationData();
  }, [eventId, ticketId, quantity]);

  const fetchDependentData = async (field: RegistrationField, parentValue: string) => {
    if (!parentValue) return;

    if (field.source === 'STATES' && !states[parentValue]) {
      try {
        const res = await api.get(`/locations/states/${parentValue}`);
        // Filter out invalid/empty data
        const filteredStates = (res.data.data || []).filter((s: any) => s && s.name && s._id);
        setStates(prev => ({ ...prev, [parentValue]: filteredStates }));
      } catch (err) {
        console.error("Failed to fetch states:", err);
      }
    } else if (field.source === 'LGAS' && !lgas[parentValue]) {
      try {
        const res = await api.get(`/locations/lgas/${parentValue}`);
        // Filter out invalid/empty data
        const filteredLgas = (res.data.data || []).filter((l: any) => l && l.name && l._id);
        setLgas(prev => ({ ...prev, [parentValue]: filteredLgas }));
      } catch (err) {
        console.error("Failed to fetch LGAs:", err);
      }
    }
  };

  const handleAttendeeChange = (index: number, field: RegistrationField, value: any) => {
    const fieldName = field.name;
    const newAttendees = [...attendees];
    const attendee = { ...newAttendees[index] };
    attendee[fieldName] = value;

    // Recursive reset of dependent fields
    const resetDependents = (name: string) => {
      (event?.registrationFields || []).forEach(f => {
        if (f.dependsOn === name && f.isPerAttendee) {
          attendee[f.name] = "";
          resetDependents(f.name);
        }
      });
    };

    resetDependents(fieldName);
    newAttendees[index] = attendee;
    setAttendees(newAttendees);

    // Fetch dependent data if needed
    const dependentFields = (event?.registrationFields || []).filter(f => f.dependsOn === fieldName);
    dependentFields.forEach(f => fetchDependentData(f, value));
  };

  const handleSharedChange = (field: RegistrationField, value: any) => {
    const fieldName = field.name;
    setSharedData(prev => {
      const newShared = { ...prev, [fieldName]: value };

      const resetDependents = (name: string) => {
        (event?.registrationFields || []).forEach(f => {
          if (f.dependsOn === name && !f.isPerAttendee) {
            newShared[f.name] = "";
            resetDependents(f.name);
          }
        });
      };

      resetDependents(fieldName);
      return newShared;
    });

    // Reset dependent fields in attendees as well
    setAttendees(prevAttendees => prevAttendees.map(att => {
        const newAtt = { ...att };
        const resetAttDependents = (name: string) => {
            (event?.registrationFields || []).forEach(f => {
                if (f.dependsOn === name && f.isPerAttendee) {
                    newAtt[f.name] = "";
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
    setSubmitting(true);

    try {
      Swal.showLoading();

      // Map attendees to use 'fullName' instead of 'full-name' and include buyerInfo
      const mappedAttendees = attendees.map(att => ({
        ...att,
        fullName: att["full-name"],
      }));

      const payload = {
        ticketId: ticketId,
        quantity: quantity,
        buyerInfo: {
          fullName: attendees[0]["full-name"],
          email: attendees[0]["email"],
          phone: attendees[0]["phone"],
        },
        attendees: mappedAttendees,
        sharedData: sharedData,
      };

      const response = await api.post(`/events/${eventId}/orders`, payload);
      const orderData = response.data.data;

      // If order is successful, check if it's a free ticket or needs payment
      // Use Number() to handle cases where price might be a string "0"
      if (Number(ticket?.price) === 0) {
        await Swal.fire({
          title: "Registration Successful!",
          text: "Your ticket has been sent to your email.",
          icon: "success",
          confirmButtonColor: "#295FA7",
        });
        router.push("/dashboard?tab=events");
      } else {
        // Extract registration IDs for payment initialization
        const registrationIds = orderData.registrations.map((reg: any) => reg.id);

        // Initialize payment
        const paymentRes = await api.post("/events/payments/initialize", {
           orderId: orderData.order.id,
           registrationIds: registrationIds
        });

        if (paymentRes.data.data.checkoutUrl) {
           window.location.href = paymentRes.data.data.checkoutUrl;
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
                 {attendees.map((attendee, index) => (
                    <div key={index} className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-6 animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                       <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary font-black">
                            {index + 1}
                          </div>
                          <h4 className="font-black text-gray-900">Attendee #{index + 1} Details</h4>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {(event.registrationFields || []).map((field) => {
                            // Logic:
                            // 1. If field is per-attendee, show for all attendees.
                            // 2. If field is NOT per-attendee, show ONLY for the first attendee (index 0).
                            if (!field.isPerAttendee && index !== 0) return null;

                            return (
                              <div key={field.name} className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                                  {field.label} {field.required && <span className="text-red-500">*</span>}
                                </label>
                                <div className="relative">
                                   {field.name === 'full-name' && <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />}
                                   {field.name === 'email' && <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />}
                                   {field.name === 'phone' && <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />}

                                   {(field.type === 'text' || field.type === 'number') && !field.source ? (
                                      <input
                                        type={field.type}
                                        required={field.required}
                                        className={`w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all ${['full-name', 'email', 'phone'].includes(field.name) ? 'pl-12' : ''}`}
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
                 ))}
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
