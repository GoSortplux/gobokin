"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Calendar,
  MapPin,
  Globe,
  Users,
  Ticket,
  Layers,
  Trash2,
  Plus,
  Info
} from "lucide-react";
import api from "@/services/api";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";
import { EventType, RegistrationMode, TicketType } from "@/types";

const steps = [
  { id: 1, title: "Basic Info", icon: Info },
  { id: 2, title: "Sessions", icon: Calendar },
  { id: 3, title: "Ticketing", icon: Ticket },
  { id: 4, title: "Registration", icon: Layers },
];

const CreateEvent = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [basicInfo, setBasicInfo] = useState({
    title: "",
    description: "",
    type: "PHYSICAL" as EventType,
    startDate: "",
    endDate: "",
    location: "",
    virtualLink: "",
    capacity: 0,
    category: "",
  });

  const [sessions, setSessions] = useState([{
    id: "1",
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
  }]);

  const [tickets, setTickets] = useState([{
    id: "1",
    name: "General Admission",
    price: 0,
    type: "FREE" as TicketType,
    totalQuantity: 0,
    groupSize: 1,
  }]);

  const [registration, setRegistration] = useState({
    mode: "FULL_DETAILS" as RegistrationMode,
    isGroupingEnabled: false,
    enforceUniqueGroupNames: true,
    fields: [
      { name: "full-name", label: "Full Name", type: "text", required: true, isPerAttendee: true },
      { name: "email", label: "Email Address", type: "text", required: true, isPerAttendee: true },
    ] as any[],
  });

  // Basic Info Handlers
  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBasicInfo(prev => ({ ...prev, [name]: name === "capacity" ? parseInt(value) || 0 : value }));
  };

  // Session Handlers
  const addSession = () => {
    setSessions([...sessions, { id: Math.random().toString(), title: "", description: "", startTime: "", endTime: "", location: "" }]);
  };

  const removeSession = (id: string) => {
    if (sessions.length > 1) setSessions(sessions.filter(s => s.id !== id));
  };

  const updateSession = (id: string, field: string, value: string) => {
    setSessions(sessions.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // Ticket Handlers
  const addTicket = () => {
    setTickets([...tickets, { id: Math.random().toString(), name: "", price: 0, type: "PAID", totalQuantity: 0, groupSize: 1 }]);
  };

  const removeTicket = (id: string) => {
    if (tickets.length > 1) setTickets(tickets.filter(t => t.id !== id));
  };

  const updateTicket = (id: string, field: string, value: any) => {
    setTickets(tickets.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  // Registration Field Handlers
  const addField = () => {
    setRegistration({
      ...registration,
      fields: [...registration.fields, { name: "", label: "", type: "text", required: false, isPerAttendee: false }]
    });
  };

  const removeField = (index: number) => {
    if (index > 1) { // Don't remove Name and Email
      const newFields = [...registration.fields];
      newFields.splice(index, 1);
      setRegistration({ ...registration, fields: newFields });
    }
  };

  const updateField = (index: number, field: string, value: any) => {
    const newFields = [...registration.fields];
    newFields[index] = { ...newFields[index], [field]: value };
    setRegistration({ ...registration, fields: newFields });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      Swal.showLoading();
      const payload = {
        ...basicInfo,
        sessions: sessions.map(({ id, ...rest }) => rest),
        tickets: tickets.map(({ id, ...rest }) => rest),
        registrationMode: registration.mode,
        isGroupingEnabled: registration.isGroupingEnabled,
        enforceUniqueGroupNames: registration.enforceUniqueGroupNames,
        registrationFields: registration.fields,
      };

      const response = await api.post("/events", payload);

      await Swal.fire({
        title: "Event Created!",
        text: "Your event has been successfully created.",
        icon: "success",
        confirmButtonColor: "#295FA7",
      });

      router.push(`/organizer/dashboard/events/${response.data.data.id}`);
    } catch (error) {
      console.error("Failed to create event:", error);
      Swal.fire("Error", translateError(error), "error");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-2 group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Back to Events
          </button>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Create New Event</h1>
        </div>
        <div className="hidden md:flex items-center gap-1 bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                currentStep === step.id ? "bg-primary text-white shadow-md" : "text-gray-400"
              }`}
            >
              <step.icon size={16} />
              {step.title}
              {currentStep > step.id && <CheckCircle2 size={14} className="text-emerald-400" />}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-blue-900/5 overflow-hidden">
        {/* Step Content */}
        <div className="p-8">
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">Event Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder="e.g., Annual Tech Summit 2024"
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    value={basicInfo.title}
                    onChange={handleBasicChange}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Event Type</label>
                  <select
                    name="type"
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    value={basicInfo.type}
                    onChange={handleBasicChange}
                  >
                    <option value="PHYSICAL">Physical Event</option>
                    <option value="ONLINE">Online Event</option>
                    <option value="HYBRID">Hybrid (Both)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Category</label>
                  <input
                    type="text"
                    name="category"
                    placeholder="e.g., Technology"
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    value={basicInfo.category}
                    onChange={handleBasicChange}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    value={basicInfo.startDate}
                    onChange={handleBasicChange}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">End Date & Time</label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    value={basicInfo.endDate}
                    onChange={handleBasicChange}
                  />
                </div>

                {basicInfo.type !== "ONLINE" && (
                   <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <MapPin size={16} className="text-primary" />
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      placeholder="Street address, City, State"
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                      value={basicInfo.location}
                      onChange={handleBasicChange}
                    />
                  </div>
                )}

                {basicInfo.type !== "PHYSICAL" && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <Globe size={16} className="text-primary" />
                      Virtual Link (Zoom, Meet, etc.)
                    </label>
                    <input
                      type="url"
                      name="virtualLink"
                      placeholder="https://zoom.us/j/..."
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                      value={basicInfo.virtualLink}
                      onChange={handleBasicChange}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Users size={16} className="text-primary" />
                    Overall Capacity
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    value={basicInfo.capacity}
                    onChange={handleBasicChange}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">Description</label>
                  <textarea
                    name="description"
                    rows={4}
                    placeholder="Tell us about your event..."
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    value={basicInfo.description}
                    onChange={handleBasicChange}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black text-gray-900">Event Sessions</h3>
                  <button
                    onClick={addSession}
                    className="flex items-center gap-2 text-primary font-bold text-sm bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    <Plus size={16} />
                    Add Session
                  </button>
               </div>

               {sessions.map((session, index) => (
                 <div key={session.id} className="p-6 bg-gray-50 rounded-3xl space-y-4 relative group">
                    {sessions.length > 1 && (
                      <button
                        onClick={() => removeSession(session.id)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Session Title</label>
                        <input
                          type="text"
                          placeholder="e.g., Keynote: The Future of AI"
                          className="w-full p-3 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                          value={session.title}
                          onChange={(e) => updateSession(session.id, "title", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Start Time</label>
                        <input
                          type="datetime-local"
                          className="w-full p-3 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                          value={session.startTime}
                          onChange={(e) => updateSession(session.id, "startTime", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">End Time</label>
                        <input
                          type="datetime-local"
                          className="w-full p-3 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                          value={session.endTime}
                          onChange={(e) => updateSession(session.id, "endTime", e.target.value)}
                        />
                      </div>
                    </div>
                 </div>
               ))}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black text-gray-900">Ticket Types</h3>
                  <button
                    onClick={addTicket}
                    className="flex items-center gap-2 text-primary font-bold text-sm bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    <Plus size={16} />
                    Add Ticket
                  </button>
               </div>

               {tickets.map((ticket, index) => (
                 <div key={ticket.id} className="p-6 bg-gray-50 rounded-3xl space-y-4 relative group">
                    {tickets.length > 1 && (
                      <button
                        onClick={() => removeTicket(ticket.id)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ticket Name</label>
                        <input
                          type="text"
                          placeholder="e.g., Early Bird, VIP"
                          className="w-full p-3 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                          value={ticket.name}
                          onChange={(e) => updateTicket(ticket.id, "name", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ticket Type</label>
                        <select
                          className="w-full p-3 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                          value={ticket.type}
                          onChange={(e) => updateTicket(ticket.id, "type", e.target.value)}
                        >
                          <option value="FREE">Free</option>
                          <option value="PAID">Paid</option>
                        </select>
                      </div>
                      {ticket.type === "PAID" && (
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Price (₦)</label>
                          <input
                            type="number"
                            className="w-full p-3 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                            value={ticket.price}
                            onChange={(e) => updateTicket(ticket.id, "price", parseFloat(e.target.value))}
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quantity Available</label>
                        <input
                          type="number"
                          className="w-full p-3 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                          value={ticket.totalQuantity}
                          onChange={(e) => updateTicket(ticket.id, "totalQuantity", parseInt(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Group Size</label>
                        <input
                          type="number"
                          className="w-full p-3 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                          value={ticket.groupSize}
                          onChange={(e) => updateTicket(ticket.id, "groupSize", parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                 </div>
               ))}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-4">
                     <h3 className="text-lg font-black text-gray-900">Registration Mode</h3>
                     <div className="grid grid-cols-1 gap-3">
                        <button
                          onClick={() => setRegistration({...registration, mode: "FULL_DETAILS"})}
                          className={`p-4 rounded-2xl border-2 text-left transition-all ${
                            registration.mode === "FULL_DETAILS" ? "border-primary bg-blue-50 ring-2 ring-primary/10" : "border-gray-100 hover:border-gray-200"
                          }`}
                        >
                           <p className="font-bold text-gray-900">Full Details</p>
                           <p className="text-xs text-gray-500">Collect info for every individual attendee.</p>
                        </button>
                        <button
                           onClick={() => setRegistration({...registration, mode: "BASIC_QUANTITY"})}
                           className={`p-4 rounded-2xl border-2 text-left transition-all ${
                            registration.mode === "BASIC_QUANTITY" ? "border-primary bg-blue-50 ring-2 ring-primary/10" : "border-gray-100 hover:border-gray-200"
                          }`}
                        >
                           <p className="font-bold text-gray-900">Basic Quantity</p>
                           <p className="text-xs text-gray-500">Only collect buyer info + ticket count.</p>
                        </button>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <h3 className="text-lg font-black text-gray-900">Grouping Settings</h3>
                     <div className="space-y-4">
                        <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl cursor-pointer">
                           <input
                            type="checkbox"
                            className="w-5 h-5 rounded-lg border-gray-300 text-primary focus:ring-primary"
                            checked={registration.isGroupingEnabled}
                            onChange={(e) => setRegistration({...registration, isGroupingEnabled: e.target.checked})}
                           />
                           <div>
                              <p className="text-sm font-bold text-gray-900">Enable Team Grouping</p>
                              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Allow attendees to form teams</p>
                           </div>
                        </label>
                        {registration.isGroupingEnabled && (
                          <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl cursor-pointer ml-8 animate-in slide-in-from-left-4">
                            <input
                              type="checkbox"
                              className="w-5 h-5 rounded-lg border-gray-300 text-primary focus:ring-primary"
                              checked={registration.enforceUniqueGroupNames}
                              onChange={(e) => setRegistration({...registration, enforceUniqueGroupNames: e.target.checked})}
                            />
                            <p className="text-sm font-bold text-gray-900">Enforce Unique Team Names</p>
                          </label>
                        )}
                     </div>
                  </div>
               </div>

               <div className="space-y-4 pt-8 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-gray-900">Custom Registration Fields</h3>
                    <button
                      onClick={addField}
                      className="flex items-center gap-2 text-primary font-bold text-sm bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors"
                    >
                      <Plus size={16} />
                      Add Custom Field
                    </button>
                  </div>

                  <div className="space-y-3">
                    {registration.fields.map((field, idx) => (
                      <div key={idx} className="flex flex-col md:flex-row gap-3 p-4 bg-gray-50 rounded-2xl items-end md:items-center group">
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Field Label</label>
                          <input
                            type="text"
                            placeholder="e.g., Company Name"
                            className="w-full p-3 bg-white border border-gray-100 rounded-xl text-sm"
                            value={field.label}
                            onChange={(e) => updateField(idx, "label", e.target.value)}
                            disabled={idx < 2}
                          />
                        </div>
                        <div className="w-full md:w-40 space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Type</label>
                          <select
                            className="w-full p-3 bg-white border border-gray-100 rounded-xl text-sm"
                            value={field.type}
                            onChange={(e) => updateField(idx, "type", e.target.value)}
                            disabled={idx < 2}
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="select">Select Dropdown</option>
                            <option value="checkbox">Checkbox</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-4 px-2 h-11">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateField(idx, "required", e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-primary"
                              disabled={idx < 2}
                            />
                            <span className="text-xs font-bold text-gray-600">Required</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.isPerAttendee}
                              onChange={(e) => updateField(idx, "isPerAttendee", e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-primary"
                              disabled={idx < 2}
                            />
                            <span className="text-xs font-bold text-gray-600">Per Attendee</span>
                          </label>
                        </div>
                        {idx >= 2 && (
                          <button
                            onClick={() => removeField(idx)}
                            className="p-3 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-8 bg-gray-50 flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1 || loading}
            className={`flex items-center gap-2 font-bold px-6 py-3 rounded-2xl transition-all ${
              currentStep === 1 ? "opacity-0 invisible" : "text-gray-500 hover:text-gray-700 bg-white shadow-sm border border-gray-100"
            }`}
          >
            <ArrowLeft size={18} />
            Previous
          </button>

          {currentStep < 4 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 bg-primary text-white font-bold px-8 py-3 rounded-2xl hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20"
            >
              Continue
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 bg-emerald-600 text-white font-bold px-8 py-3 rounded-2xl hover:bg-opacity-90 transition-all shadow-lg shadow-emerald-900/10 disabled:opacity-50"
            >
              {loading ? "Creating Event..." : "Launch Event"}
              <CheckCircle2 size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
