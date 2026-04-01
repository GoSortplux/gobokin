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
  Info,
  Image as ImageIcon,
  Share2,
  Search,
  ShieldCheck,
  Clock,
  ExternalLink,
  ChevronDown,
  Eye
} from "lucide-react";
import api from "@/services/api";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";
import { EventType, RegistrationMode, TicketType } from "@/types";

const steps = [
  { id: 1, title: "Basic Details", icon: Info },
  { id: 2, title: "Media & SEO", icon: ImageIcon },
  { id: 3, title: "Schedule", icon: Calendar },
  { id: 4, title: "Ticketing", icon: Ticket },
  { id: 5, title: "Registration", icon: Layers },
  { id: 6, title: "Review", icon: CheckCircle2 },
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
    tags: "",
  });

  const [mediaInfo, setMediaInfo] = useState({
    bannerUrl: "",
    seoTitle: "",
    seoDescription: "",
    socialImage: "",
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
    description: "",
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

  // Handlers
  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBasicInfo(prev => ({ ...prev, [name]: name === "capacity" ? parseInt(value) || 0 : value }));
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMediaInfo(prev => ({ ...prev, [name]: value }));
  };

  const addSession = () => {
    setSessions([...sessions, { id: Math.random().toString(), title: "", description: "", startTime: "", endTime: "", location: "" }]);
  };

  const removeSession = (id: string) => {
    if (sessions.length > 1) setSessions(sessions.filter(s => s.id !== id));
  };

  const updateSession = (id: string, field: string, value: string) => {
    setSessions(sessions.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addTicket = () => {
    setTickets([...tickets, { id: Math.random().toString(), name: "", price: 0, type: "PAID", totalQuantity: 0, groupSize: 1, description: "" }]);
  };

  const removeTicket = (id: string) => {
    if (tickets.length > 1) setTickets(tickets.filter(t => t.id !== id));
  };

  const updateTicket = (id: string, field: string, value: any) => {
    setTickets(tickets.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

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
        ...mediaInfo,
        tags: basicInfo.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ""),
        sessions: sessions.map(({ id, ...rest }) => rest),
        tickets: tickets.map(({ id, ...rest }) => rest),
        registrationMode: registration.mode,
        isGroupingEnabled: registration.isGroupingEnabled,
        enforceUniqueGroupNames: registration.enforceUniqueGroupNames,
        registrationFields: registration.fields,
      };

      const response = await api.post("/events", payload);

      await Swal.fire({
        title: "Event Launched!",
        text: "Your event has been successfully created and is now live.",
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

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors mb-4 group font-bold">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Exit Creator
          </button>
          <h1 className="text-4xl font-black text-primary tracking-tight">Create New Event</h1>
          <p className="text-gray-500 font-medium mt-1">Set the stage for an unforgettable experience.</p>
        </div>

        <div className="hidden lg:flex items-center gap-1 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-500 ${
                currentStep === step.id
                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                : currentStep > step.id ? "text-emerald-500 bg-emerald-50" : "text-gray-400"
              }`}
            >
              <step.icon size={14} />
              <span className="uppercase tracking-widest">{step.title}</span>
              {currentStep > step.id && <CheckCircle2 size={14} />}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-blue-900/5 overflow-hidden">
        {/* Step Progress Mobile */}
        <div className="lg:hidden bg-gray-50 px-8 py-4 border-b border-gray-100 flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Step {currentStep} of {steps.length}</span>
            <span className="text-sm font-black text-primary">{steps[currentStep-1].title}</span>
        </div>

        {/* Step Content */}
        <div className="p-8 lg:p-12">
          {currentStep === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Event Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder="e.g., Annual Tech Summit 2024"
                    className="w-full p-5 bg-gray-50 border-none rounded-3xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all placeholder:font-medium"
                    value={basicInfo.title}
                    onChange={handleBasicChange}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Event Type</label>
                  <div className="relative">
                    <select
                        name="type"
                        className="w-full p-5 bg-gray-50 border-none rounded-3xl text-sm font-bold focus:ring-4 focus:ring-primary/10 appearance-none"
                        value={basicInfo.type}
                        onChange={handleBasicChange}
                    >
                        <option value="PHYSICAL">Physical Event</option>
                        <option value="ONLINE">Online Event</option>
                        <option value="HYBRID">Hybrid (Both)</option>
                    </select>
                    <ChevronDown size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Category</label>
                  <input
                    type="text"
                    name="category"
                    placeholder="e.g., Technology, Music, Sports"
                    className="w-full p-5 bg-gray-50 border-none rounded-3xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all placeholder:font-medium"
                    value={basicInfo.category}
                    onChange={handleBasicChange}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Starts</label>
                  <div className="relative">
                    <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" />
                    <input
                        type="datetime-local"
                        name="startDate"
                        className="w-full pl-12 pr-5 py-5 bg-gray-50 border-none rounded-3xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                        value={basicInfo.startDate}
                        onChange={handleBasicChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Ends</label>
                  <div className="relative">
                    <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" />
                    <input
                        type="datetime-local"
                        name="endDate"
                        className="w-full pl-12 pr-5 py-5 bg-gray-50 border-none rounded-3xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                        value={basicInfo.endDate}
                        onChange={handleBasicChange}
                    />
                  </div>
                </div>

                {basicInfo.type !== "ONLINE" && (
                   <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Physical Location</label>
                    <div className="relative">
                        <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" />
                        <input
                        type="text"
                        name="location"
                        placeholder="Street address, City, State"
                        className="w-full pl-12 pr-5 py-5 bg-gray-50 border-none rounded-3xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all placeholder:font-medium"
                        value={basicInfo.location}
                        onChange={handleBasicChange}
                        />
                    </div>
                  </div>
                )}

                {basicInfo.type !== "PHYSICAL" && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Meeting/Virtual Link</label>
                    <div className="relative">
                        <Globe size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" />
                        <input
                        type="url"
                        name="virtualLink"
                        placeholder="https://zoom.us/j/..."
                        className="w-full pl-12 pr-5 py-5 bg-gray-50 border-none rounded-3xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all placeholder:font-medium"
                        value={basicInfo.virtualLink}
                        onChange={handleBasicChange}
                        />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Total Capacity</label>
                  <div className="relative">
                      <Users size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" />
                      <input
                        type="number"
                        name="capacity"
                        className="w-full pl-12 pr-5 py-5 bg-gray-50 border-none rounded-3xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                        value={basicInfo.capacity}
                        onChange={handleBasicChange}
                      />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Tags (comma separated)</label>
                  <div className="relative">
                      <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" />
                      <input
                        type="text"
                        name="tags"
                        placeholder="AI, Conference, Networking"
                        className="w-full pl-12 pr-5 py-5 bg-gray-50 border-none rounded-3xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all placeholder:font-medium"
                        value={basicInfo.tags}
                        onChange={handleBasicChange}
                      />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-black text-gray-700 uppercase tracking-wider ml-1">Event Bio / Description</label>
                  <textarea
                    name="description"
                    rows={5}
                    placeholder="Describe your event in detail. What should attendees expect?"
                    className="w-full p-5 bg-gray-50 border-none rounded-3xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all placeholder:font-medium"
                    value={basicInfo.description}
                    onChange={handleBasicChange}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-primary flex items-center justify-center">
                                <ImageIcon size={20} />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Banner Image</h3>
                        </div>
                        <div className="relative group">
                            <div className="w-full aspect-video rounded-[2.5rem] bg-gray-50 border-4 border-dashed border-gray-200 flex flex-col items-center justify-center gap-4 transition-all group-hover:bg-blue-50 group-hover:border-primary/20">
                                <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-primary transition-all">
                                    <Plus size={32} />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-black text-gray-900 uppercase tracking-wider">Upload Event Banner</p>
                                    <p className="text-xs text-gray-400 font-medium mt-1">Recommended: 1920x1080 (JPG or PNG)</p>
                                </div>
                            </div>
                            <input
                                type="text"
                                name="bannerUrl"
                                placeholder="Or enter Image URL"
                                className="w-full mt-4 p-4 bg-gray-50 border-none rounded-2xl text-xs font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                                value={mediaInfo.bannerUrl}
                                onChange={handleMediaChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Search size={20} />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">SEO & Social Meta</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.15em] ml-1">Meta Title</label>
                                <input
                                    type="text"
                                    name="seoTitle"
                                    placeholder="Keep it under 60 characters"
                                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10"
                                    value={mediaInfo.seoTitle}
                                    onChange={handleMediaChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.15em] ml-1">Meta Description</label>
                                <textarea
                                    name="seoDescription"
                                    rows={3}
                                    placeholder="Briefly summarize for search engines"
                                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10"
                                    value={mediaInfo.seoDescription}
                                    onChange={handleMediaChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.15em] ml-1">Social Sharing Image URL</label>
                                <input
                                    type="text"
                                    name="socialImage"
                                    placeholder="URL for WhatsApp/Facebook preview"
                                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10"
                                    value={mediaInfo.socialImage}
                                    onChange={handleMediaChange}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
               <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Event Schedule</h3>
                    <p className="text-sm text-gray-500 font-medium">Break down your event into specific sessions.</p>
                  </div>
                  <button
                    onClick={addSession}
                    className="flex items-center gap-2 text-primary font-black text-sm bg-blue-50 px-6 py-3 rounded-2xl hover:bg-blue-100 transition-all border border-blue-100"
                  >
                    <Plus size={18} />
                    Add New Session
                  </button>
               </div>

               <div className="space-y-6">
                {sessions.map((session) => (
                    <div key={session.id} className="p-8 bg-gray-50 rounded-[2.5rem] space-y-6 relative group border-2 border-transparent hover:border-primary/10 hover:bg-white transition-all hover:shadow-xl hover:shadow-blue-900/5">
                        {sessions.length > 1 && (
                        <button
                            onClick={() => removeSession(session.id)}
                            className="absolute top-6 right-6 w-10 h-10 bg-white text-gray-400 hover:text-rose-500 rounded-xl flex items-center justify-center shadow-sm hover:shadow transition-all"
                        >
                            <Trash2 size={18} />
                        </button>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Session Title</label>
                            <input
                            type="text"
                            placeholder="e.g., Keynote: The Future of AI"
                            className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                            value={session.title}
                            onChange={(e) => updateSession(session.id, "title", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Clock size={12} className="text-primary" />
                                Start Time
                            </label>
                            <input
                            type="datetime-local"
                            className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                            value={session.startTime}
                            onChange={(e) => updateSession(session.id, "startTime", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Clock size={12} className="text-rose-400" />
                                End Time
                            </label>
                            <input
                            type="datetime-local"
                            className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                            value={session.endTime}
                            onChange={(e) => updateSession(session.id, "endTime", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Session Summary / Description</label>
                            <textarea
                                placeholder="Describe what happens in this session..."
                                className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                                value={session.description}
                                onChange={(e) => updateSession(session.id, "description", e.target.value)}
                            />
                        </div>
                        </div>
                    </div>
                ))}
               </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
               <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Ticket Tiers</h3>
                    <p className="text-sm text-gray-500 font-medium">Define your pricing and inventory structure.</p>
                  </div>
                  <button
                    onClick={addTicket}
                    className="flex items-center gap-2 text-primary font-black text-sm bg-blue-50 px-6 py-3 rounded-2xl hover:bg-blue-100 transition-all border border-blue-100"
                  >
                    <Plus size={18} />
                    Create New Tier
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tickets.map((ticket) => (
                    <div key={ticket.id} className="p-8 bg-gray-50 rounded-[2.5rem] space-y-6 relative group border-2 border-transparent hover:border-emerald-500/10 hover:bg-white transition-all hover:shadow-xl hover:shadow-emerald-900/5">
                        {tickets.length > 1 && (
                            <button
                                onClick={() => removeTicket(ticket.id)}
                                className="absolute top-6 right-6 w-10 h-10 bg-white text-gray-400 hover:text-rose-500 rounded-xl flex items-center justify-center shadow-sm hover:shadow transition-all"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tier Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., VIP, Early Bird"
                                        className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10"
                                        value={ticket.name}
                                        onChange={(e) => updateTicket(ticket.id, "name", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Type</label>
                                    <select
                                        className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10"
                                        value={ticket.type}
                                        onChange={(e) => updateTicket(ticket.id, "type", e.target.value as any)}
                                    >
                                        <option value="FREE">Free Ticket</option>
                                        <option value="PAID">Paid Ticket</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Price (₦)</label>
                                    <input
                                        type="number"
                                        disabled={ticket.type === "FREE"}
                                        className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 disabled:opacity-50"
                                        value={ticket.price}
                                        onChange={(e) => updateTicket(ticket.id, "price", parseFloat(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Inventory</label>
                                    <input
                                        type="number"
                                        placeholder="Quantity"
                                        className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10"
                                        value={ticket.totalQuantity}
                                        onChange={(e) => updateTicket(ticket.id, "totalQuantity", parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Batch Size</label>
                                    <input
                                        type="number"
                                        placeholder="Min per order"
                                        className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10"
                                        value={ticket.groupSize}
                                        onChange={(e) => updateTicket(ticket.id, "groupSize", parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description (What&apos;s included?)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Complimentary drinks, Front row seats"
                                        className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10"
                                        value={ticket.description}
                                        onChange={(e) => updateTicket(ticket.id, "description", e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
               </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                     <h3 className="text-2xl font-black text-gray-900 tracking-tight">Checkout Strategy</h3>
                     <div className="grid grid-cols-1 gap-4">
                        <button
                          onClick={() => setRegistration({...registration, mode: "FULL_DETAILS"})}
                          className={`p-6 rounded-[2rem] border-4 text-left transition-all ${
                            registration.mode === "FULL_DETAILS"
                            ? "border-primary bg-blue-50 ring-4 ring-primary/5"
                            : "border-gray-50 hover:border-gray-100"
                          }`}
                        >
                           <div className="flex items-center gap-3 mb-2">
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center ${registration.mode === "FULL_DETAILS" ? "bg-primary text-white" : "bg-gray-100 text-gray-400"}`}>
                                    <Users size={16} />
                               </div>
                               <p className="font-black text-gray-900 tracking-tight">Comprehensive Mode</p>
                           </div>
                           <p className="text-xs text-gray-500 font-medium leading-relaxed">Perfect for conferences. Collect detailed information for every single attendee in the order.</p>
                        </button>

                        <button
                           onClick={() => setRegistration({...registration, mode: "BASIC_QUANTITY"})}
                           className={`p-6 rounded-[2rem] border-4 text-left transition-all ${
                            registration.mode === "BASIC_QUANTITY"
                            ? "border-primary bg-blue-50 ring-4 ring-primary/5"
                            : "border-gray-50 hover:border-gray-100"
                          }`}
                        >
                           <div className="flex items-center gap-3 mb-2">
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center ${registration.mode === "BASIC_QUANTITY" ? "bg-primary text-white" : "bg-gray-100 text-gray-400"}`}>
                                    <Ticket size={16} />
                               </div>
                               <p className="font-black text-gray-900 tracking-tight">Express Mode</p>
                           </div>
                           <p className="text-xs text-gray-500 font-medium leading-relaxed">Best for concerts or parties. Only collect data from the buyer, plus total ticket count.</p>
                        </button>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <h3 className="text-2xl font-black text-gray-900 tracking-tight">Social & Team Logic</h3>
                     <div className="space-y-4">
                        <label className="flex items-center gap-4 p-6 bg-gray-50 rounded-[2rem] cursor-pointer hover:bg-gray-100 transition-colors">
                           <input
                            type="checkbox"
                            className="w-6 h-6 rounded-lg border-gray-200 text-primary focus:ring-primary cursor-pointer"
                            checked={registration.isGroupingEnabled}
                            onChange={(e) => setRegistration({...registration, isGroupingEnabled: e.target.checked})}
                           />
                           <div>
                              <p className="text-sm font-black text-gray-900">Enable Attendee Teams</p>
                              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-0.5">Allow users to form or join groups</p>
                           </div>
                        </label>
                        {registration.isGroupingEnabled && (
                          <label className="flex items-center gap-4 p-6 bg-white border-2 border-primary/10 rounded-[2rem] cursor-pointer ml-8 animate-in slide-in-from-left-6">
                            <input
                              type="checkbox"
                              className="w-6 h-6 rounded-lg border-gray-200 text-primary focus:ring-primary cursor-pointer"
                              checked={registration.enforceUniqueGroupNames}
                              onChange={(e) => setRegistration({...registration, enforceUniqueGroupNames: e.target.checked})}
                            />
                            <div>
                                <p className="text-sm font-black text-gray-900">Strict Team Names</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Prevent duplicate team names</p>
                            </div>
                          </label>
                        )}
                     </div>
                  </div>
               </div>

               <div className="space-y-6 pt-12 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Custom Data Collection</h3>
                        <p className="text-sm text-gray-500 font-medium">Add specialized fields to your checkout form.</p>
                    </div>
                    <button
                      onClick={addField}
                      className="flex items-center gap-2 text-primary font-black text-sm bg-blue-50 px-6 py-3 rounded-2xl hover:bg-blue-100 transition-all border border-blue-100"
                    >
                      <Plus size={18} />
                      Add Field
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {registration.fields.map((field, idx) => (
                      <div key={idx} className="flex flex-col lg:flex-row gap-4 p-6 bg-gray-50 rounded-[2rem] items-start lg:items-center group relative border-2 border-transparent hover:border-gray-200 transition-all">
                        <div className="flex-1 w-full space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Field Label</label>
                          <input
                            type="text"
                            placeholder="e.g., Company Name, T-Shirt Size"
                            className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold"
                            value={field.label}
                            onChange={(e) => updateField(idx, "label", e.target.value)}
                            disabled={idx < 2}
                          />
                        </div>
                        <div className="w-full lg:w-48 space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Input Type</label>
                          <div className="relative">
                            <select
                                className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold appearance-none"
                                value={field.type}
                                onChange={(e) => updateField(idx, "type", e.target.value as any)}
                                disabled={idx < 2}
                            >
                                <option value="text">Text Input</option>
                                <option value="number">Numeric</option>
                                <option value="select">Dropdown</option>
                                <option value="checkbox">Checkbox</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          </div>
                        </div>
                        <div className="flex items-center gap-6 px-2 h-14">
                          <label className="flex items-center gap-2 cursor-pointer group/check">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateField(idx, "required", e.target.checked)}
                              className="w-5 h-5 rounded border-gray-200 text-primary cursor-pointer"
                              disabled={idx < 2}
                            />
                            <span className="text-xs font-black text-gray-600 uppercase tracking-wider">Required</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer group/check">
                            <input
                              type="checkbox"
                              checked={field.isPerAttendee}
                              onChange={(e) => updateField(idx, "isPerAttendee", e.target.checked)}
                              className="w-5 h-5 rounded border-gray-200 text-primary cursor-pointer"
                              disabled={idx < 2}
                            />
                            <span className="text-xs font-black text-gray-600 uppercase tracking-wider">Per Attendee</span>
                          </label>
                        </div>
                        {idx >= 2 && (
                          <button
                            onClick={() => removeField(idx)}
                            className="p-3 text-gray-400 hover:text-rose-500 transition-colors bg-white rounded-xl shadow-sm lg:shadow-none"
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

          {currentStep === 6 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
               <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Review & Publish</h3>
                  <p className="text-sm text-gray-500 font-medium">Almost there! Please verify your event details.</p>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                     <div className="bg-gray-50 p-8 rounded-[2.5rem] space-y-6">
                        <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
                           <Info size={20} className="text-primary" />
                           <h4 className="font-black text-gray-900 uppercase tracking-widest text-xs">Core Information</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Title</p>
                              <p className="text-sm font-bold text-gray-900">{basicInfo.title || "Untitled Event"}</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Category</p>
                              <p className="text-sm font-bold text-gray-900">{basicInfo.category || "Uncategorized"}</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Date & Time</p>
                              <p className="text-sm font-bold text-gray-900">
                                 {basicInfo.startDate ? new Date(basicInfo.startDate).toLocaleString() : "Not set"}
                              </p>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Type</p>
                              <p className="text-sm font-bold text-gray-900">{basicInfo.type}</p>
                           </div>
                        </div>
                     </div>

                     <div className="bg-gray-50 p-8 rounded-[2.5rem] space-y-6">
                        <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
                           <Ticket size={20} className="text-emerald-600" />
                           <h4 className="font-black text-gray-900 uppercase tracking-widest text-xs">Ticket Strategy</h4>
                        </div>
                        <div className="space-y-4">
                           {tickets.map((t, i) => (
                              <div key={i} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100">
                                 <div>
                                    <p className="text-sm font-black text-gray-900">{t.name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t.type} • {t.totalQuantity} Units</p>
                                 </div>
                                 <p className="font-black text-primary">₦{t.price.toLocaleString()}</p>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className="space-y-8">
                     <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] space-y-6 shadow-xl shadow-gray-900/20">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                           <Eye size={24} className="text-primary" />
                        </div>
                        <div>
                           <h4 className="text-lg font-black tracking-tight">Public Preview</h4>
                           <p className="text-xs text-gray-400 font-medium mt-1 leading-relaxed">
                              Once launched, your event will be visible to thousands of potential attendees on our discovery platform.
                           </p>
                        </div>
                        <div className="pt-4 space-y-3">
                           <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                              <CheckCircle2 size={12} />
                              Instant Confirmation
                           </div>
                           <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                              <CheckCircle2 size={12} />
                              Social Sharing Enabled
                           </div>
                           <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                              <CheckCircle2 size={12} />
                              Secure Payouts
                           </div>
                        </div>
                     </div>

                     <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100">
                        <p className="text-xs text-blue-800 font-bold leading-relaxed italic">
                           &quot;Double-check your ticket prices and dates. Once sales start, some details might be restricted for editing.&quot;
                        </p>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-8 lg:p-12 bg-gray-50 flex items-center justify-between border-t border-gray-100">
          <button
            onClick={() => setCurrentStep(currentStep - 1)}
            disabled={currentStep === 1 || loading}
            className={`flex items-center gap-2 font-black px-8 py-4 rounded-2xl transition-all uppercase tracking-widest text-xs ${
              currentStep === 1 ? "opacity-0 invisible" : "text-gray-500 hover:text-gray-900 bg-white shadow-sm border border-gray-100"
            }`}
          >
            <ArrowLeft size={18} />
            Previous
          </button>

          <div className="flex items-center gap-4">
              <span className="hidden md:block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                {currentStep < 6 ? `Next: ${steps[currentStep].title}` : 'Final Step'}
              </span>
              {currentStep < 6 ? (
                <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex items-center gap-3 bg-primary text-white font-black px-10 py-4 rounded-2xl hover:bg-opacity-90 transition-all shadow-xl shadow-primary/20 uppercase tracking-widest text-xs group"
                >
                {currentStep === 5 ? "Review Details" : "Continue"}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
            ) : (
                <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-3 bg-emerald-600 text-white font-black px-10 py-4 rounded-2xl hover:bg-opacity-90 transition-all shadow-xl shadow-emerald-900/10 disabled:opacity-50 uppercase tracking-widest text-xs"
                >
                {loading ? "Launching..." : "Launch Event"}
                <ShieldCheck size={18} />
                </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12 flex items-center justify-center gap-8 opacity-40 grayscale pointer-events-none">
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest">
              <ShieldCheck size={14} />
              Secure Payment
          </div>
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest">
              <ExternalLink size={14} />
              Public Discovery
          </div>
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest">
              <Share2 size={14} />
              Social Ready
          </div>
      </div>
    </div>
  );
};

export default CreateEvent;
