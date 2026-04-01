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
  ChevronDown,
  Type,
  Layout,
  Tag,
  FileText
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
    <div className="max-w-5xl mx-auto py-8 lg:py-12 px-4">
      {/* Header Area */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors mb-3 group font-bold text-xs uppercase tracking-widest">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Cancel
          </button>
          <h1 className="text-4xl font-black text-primary tracking-tight">Create New Event</h1>
          <p className="text-gray-500 font-medium mt-1">Experience a seamless way to build and manage your events.</p>
        </div>

        {/* Step Indicator Desktop */}
        <div className="hidden lg:flex items-center gap-3 bg-white p-2 rounded-[2rem] shadow-sm border border-gray-100">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-[10px] font-black transition-all duration-500 ${
                currentStep === step.id
                ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]"
                : currentStep > step.id ? "text-emerald-600 bg-emerald-50" : "text-gray-400"
              }`}
            >
              <step.icon size={14} strokeWidth={3} />
              <span className="uppercase tracking-[0.15em]">{step.title}</span>
              {currentStep > step.id && <CheckCircle2 size={12} strokeWidth={3} />}
            </div>
          ))}
        </div>
      </div>

      {/* Main Form Container */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-blue-900/5 overflow-hidden">
        {/* Mobile Progress Bar */}
        <div className="lg:hidden bg-gray-50/50 px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm shadow-lg shadow-primary/20">
                  {currentStep}
               </div>
               <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Step {currentStep}</p>
                  <span className="text-sm font-black text-gray-900 leading-none">{steps[currentStep-1].title}</span>
               </div>
            </div>
            <div className="flex gap-1">
               {steps.map(s => (
                  <div key={s.id} className={`w-1.5 h-1.5 rounded-full transition-all ${s.id === currentStep ? 'w-4 bg-primary' : s.id < currentStep ? 'bg-emerald-400' : 'bg-gray-200'}`}></div>
               ))}
            </div>
        </div>

        <div className="p-6 md:p-8 lg:p-10">
          {/* STEP 1: BASIC DETAILS */}
          {currentStep === 1 && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-500">
               {/* Section 1: Event Identity */}
               <div className="bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100 space-y-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 group/card">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                     <div className="w-10 h-10 rounded-xl bg-white text-primary flex items-center justify-center shadow-sm group-hover/card:bg-primary group-hover/card:text-white transition-all">
                        <Type size={20} />
                     </div>
                     <h3 className="text-xl font-black text-gray-900 tracking-tight">Event Identity</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
                     <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Event Name / Title</label>
                        <input
                          type="text"
                          name="title"
                          required
                          placeholder="e.g., Annual Tech Summit 2024"
                          className="w-full p-5 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                          value={basicInfo.title}
                          onChange={handleBasicChange}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                        <div className="relative">
                           <Layout size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" />
                           <input
                              type="text"
                              name="category"
                              placeholder="Music, Sports, AI..."
                              className="w-full pl-12 pr-5 py-5 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                              value={basicInfo.category}
                              onChange={handleBasicChange}
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Search Tags</label>
                        <div className="relative">
                           <Tag size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" />
                           <input
                              type="text"
                              name="tags"
                              placeholder="Comma separated tags"
                              className="w-full pl-12 pr-5 py-5 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                              value={basicInfo.tags}
                              onChange={handleBasicChange}
                           />
                        </div>
                     </div>
                  </div>
               </div>

               {/* Section 2: Date & Time */}
               <div className="bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100 space-y-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 group/card">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                     <div className="w-10 h-10 rounded-xl bg-white text-purple-600 flex items-center justify-center shadow-sm group-hover/card:bg-purple-600 group-hover/card:text-white transition-all">
                        <Calendar size={20} />
                     </div>
                     <h3 className="text-xl font-black text-gray-900 tracking-tight">Timeline</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Event Starts</label>
                        <div className="relative">
                           <Clock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" />
                           <input
                              type="datetime-local"
                              name="startDate"
                              className="w-full pl-12 pr-5 py-5 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                              value={basicInfo.startDate}
                              onChange={handleBasicChange}
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Event Ends</label>
                        <div className="relative">
                           <Clock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" />
                           <input
                              type="datetime-local"
                              name="endDate"
                              className="w-full pl-12 pr-5 py-5 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                              value={basicInfo.endDate}
                              onChange={handleBasicChange}
                           />
                        </div>
                     </div>
                  </div>
               </div>

               {/* Section 3: Location & Format */}
               <div className="bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100 space-y-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 group/card">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                     <div className="w-10 h-10 rounded-xl bg-white text-emerald-600 flex items-center justify-center shadow-sm group-hover/card:bg-emerald-600 group-hover/card:text-white transition-all">
                        <MapPin size={20} />
                     </div>
                     <h3 className="text-xl font-black text-gray-900 tracking-tight">Location & Format</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
                     <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Event Type</label>
                        <div className="grid grid-cols-3 gap-4">
                           {["PHYSICAL", "ONLINE", "HYBRID"].map((type) => (
                              <button
                                 key={type}
                                 type="button"
                                 onClick={() => setBasicInfo({...basicInfo, type: type as any})}
                                 className={`py-4 rounded-2xl text-xs font-black uppercase tracking-widest border-2 transition-all ${
                                    basicInfo.type === type
                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                    : "bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100"
                                 }`}
                              >
                                 {type}
                              </button>
                           ))}
                        </div>
                     </div>
                     {basicInfo.type !== "ONLINE" && (
                        <div className="space-y-2 md:col-span-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Venue Address</label>
                           <div className="relative">
                              <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" />
                              <input
                                 type="text"
                                 name="location"
                                 placeholder="Street address, City, State"
                                 className="w-full pl-12 pr-5 py-5 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                                 value={basicInfo.location}
                                 onChange={handleBasicChange}
                              />
                           </div>
                        </div>
                     )}
                     {basicInfo.type !== "PHYSICAL" && (
                        <div className="space-y-2 md:col-span-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Virtual Meeting Link</label>
                           <div className="relative">
                              <Globe size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" />
                              <input
                                 type="url"
                                 name="virtualLink"
                                 placeholder="https://zoom.us/j/..."
                                 className="w-full pl-12 pr-5 py-5 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                                 value={basicInfo.virtualLink}
                                 onChange={handleBasicChange}
                              />
                           </div>
                        </div>
                     )}
                     <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Total Capacity</label>
                        <div className="relative">
                           <Users size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" />
                           <input
                              type="number"
                              name="capacity"
                              className="w-full pl-12 pr-5 py-5 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                              value={basicInfo.capacity}
                              onChange={handleBasicChange}
                           />
                        </div>
                     </div>
                  </div>
               </div>

               {/* Section 4: Bio */}
               <div className="bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100 space-y-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 group/card">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                     <div className="w-10 h-10 rounded-xl bg-white text-rose-600 flex items-center justify-center shadow-sm group-hover/card:bg-rose-600 group-hover/card:text-white transition-all">
                        <FileText size={20} />
                     </div>
                     <h3 className="text-xl font-black text-gray-900 tracking-tight">Event Description</h3>
                  </div>
                  <textarea
                    name="description"
                    rows={6}
                    placeholder="Describe your event in detail. What should attendees expect?"
                    className="w-full p-6 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                    value={basicInfo.description}
                    onChange={handleBasicChange}
                  />
               </div>
            </div>
          )}

          {/* STEP 2: MEDIA & SEO */}
          {currentStep === 2 && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-500">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100 space-y-8 hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 transition-all group/card">
                     <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                        <div className="w-10 h-10 rounded-xl bg-white text-primary flex items-center justify-center shadow-sm group-hover/card:bg-primary group-hover/card:text-white transition-all">
                           <ImageIcon size={20} />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Visual Identity</h3>
                     </div>

                     <div className="bg-white rounded-[2rem] p-8 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center space-y-4 hover:bg-blue-50 hover:border-primary/20 transition-all cursor-pointer group/upload shadow-sm">
                        <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-primary transition-all">
                           <Plus size={32} />
                        </div>
                        <div className="text-center">
                           <p className="text-sm font-black text-gray-900 uppercase tracking-wider">Upload Event Banner</p>
                           <p className="text-[10px] text-gray-400 font-bold mt-1">Recommended: 1920x1080 (JPG, PNG)</p>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Banner Image URL (Manual)</label>
                        <input
                           type="text"
                           name="bannerUrl"
                           placeholder="https://..."
                           className="w-full p-5 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                           value={mediaInfo.bannerUrl}
                           onChange={handleMediaChange}
                        />
                     </div>
                  </div>

                  <div className="bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100 space-y-8 hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 transition-all group/card">
                     <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                        <div className="w-10 h-10 rounded-xl bg-white text-emerald-600 flex items-center justify-center shadow-sm group-hover/card:bg-emerald-600 group-hover/card:text-white transition-all">
                           <Search size={20} />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Discovery & Meta</h3>
                     </div>

                     <div className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Meta Title</label>
                           <input
                              type="text"
                              name="seoTitle"
                              placeholder="Keep it descriptive under 60 chars"
                              className="w-full p-5 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10"
                              value={mediaInfo.seoTitle}
                              onChange={handleMediaChange}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Social Preview Image URL</label>
                           <input
                              type="text"
                              name="socialImage"
                              placeholder="Image for FB/Twitter previews"
                              className="w-full p-5 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10"
                              value={mediaInfo.socialImage}
                              onChange={handleMediaChange}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Meta Description</label>
                           <textarea
                              name="seoDescription"
                              rows={4}
                              placeholder="Brief summary for search engines"
                              className="w-full p-5 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10"
                              value={mediaInfo.seoDescription}
                              onChange={handleMediaChange}
                           />
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* STEP 3: SCHEDULE */}
          {currentStep === 3 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                     <h3 className="text-2xl font-black text-gray-900 tracking-tight">Event Timeline</h3>
                     <p className="text-sm text-gray-500 font-medium">Add sessions, keynotes, or breaks to your event.</p>
                  </div>
                  <button
                    onClick={addSession}
                    className="flex items-center gap-2 bg-primary text-white font-black px-6 py-4 rounded-2xl hover:bg-opacity-90 transition-all shadow-xl shadow-primary/20 text-xs uppercase tracking-widest"
                  >
                    <Plus size={16} />
                    Add Session
                  </button>
               </div>

               <div className="space-y-6">
                {sessions.map((session, index) => (
                    <div key={session.id} className="relative pl-12 group">
                        {/* Timeline Connector */}
                        <div className="absolute left-5 top-0 bottom-0 w-[2px] bg-gray-100"></div>
                        <div className="absolute left-2.5 top-8 w-5 h-5 rounded-full bg-primary ring-4 ring-blue-50 border-2 border-white z-10"></div>

                        <div className="bg-gray-50 p-8 rounded-[2rem] space-y-6 border-2 border-transparent group-hover:border-primary/10 group-hover:bg-white transition-all hover:shadow-xl hover:shadow-blue-900/5">
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-xl">Session #{index+1}</span>
                              {sessions.length > 1 && (
                                 <button onClick={() => removeSession(session.id)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-rose-500 bg-white rounded-xl shadow-sm hover:shadow transition-all">
                                    <Trash2 size={18} />
                                 </button>
                              )}
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-2 md:col-span-2">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Session Title</label>
                                 <input
                                 type="text"
                                 placeholder="e.g., Welcome Keynote: Future of Gobokin"
                                 className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                                 value={session.title}
                                 onChange={(e) => updateSession(session.id, "title", e.target.value)}
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Start Time</label>
                                 <input
                                 type="datetime-local"
                                 className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10"
                                 value={session.startTime}
                                 onChange={(e) => updateSession(session.id, "startTime", e.target.value)}
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">End Time</label>
                                 <input
                                 type="datetime-local"
                                 className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10"
                                 value={session.endTime}
                                 onChange={(e) => updateSession(session.id, "endTime", e.target.value)}
                                 />
                              </div>
                           </div>
                        </div>
                    </div>
                ))}
               </div>
            </div>
          )}

          {/* STEP 4: TICKETING */}
          {currentStep === 4 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                     <h3 className="text-2xl font-black text-gray-900 tracking-tight">Ticket Management</h3>
                     <p className="text-sm text-gray-500 font-medium">Define how attendees will pay and access your event.</p>
                  </div>
                  <button
                    onClick={addTicket}
                    className="flex items-center gap-2 bg-emerald-600 text-white font-black px-6 py-4 rounded-2xl hover:bg-opacity-90 transition-all shadow-xl shadow-emerald-900/10 text-xs uppercase tracking-widest"
                  >
                    <Plus size={16} />
                    New Ticket Tier
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                {tickets.map((ticket, index) => (
                    <div key={ticket.id} className="p-8 bg-gray-50/50 rounded-[2.5rem] border border-gray-100 space-y-8 relative group border-2 border-transparent hover:border-emerald-500/10 hover:bg-white transition-all hover:shadow-2xl hover:shadow-emerald-900/5">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs uppercase">
                                 Tier
                              </div>
                              <h4 className="font-black text-gray-900 uppercase tracking-widest text-xs">#{index+1} {ticket.name || 'Untitled'}</h4>
                           </div>
                           {tickets.length > 1 && (
                              <button onClick={() => removeTicket(ticket.id)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-rose-500 bg-white rounded-xl shadow-sm hover:shadow transition-all">
                                 <Trash2 size={18} />
                              </button>
                           )}
                        </div>

                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tier Name</label>
                              <input
                                 type="text"
                                 placeholder="e.g., VIP Early Bird"
                                 className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/5"
                                 value={ticket.name}
                                 onChange={(e) => updateTicket(ticket.id, "name", e.target.value)}
                              />
                           </div>

                           <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Type</label>
                                 <select
                                    className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/5"
                                    value={ticket.type}
                                    onChange={(e) => updateTicket(ticket.id, "type", e.target.value as any)}
                                 >
                                    <option value="FREE">Free</option>
                                    <option value="PAID">Paid</option>
                                 </select>
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Price (₦)</label>
                                 <input
                                    type="number"
                                    disabled={ticket.type === "FREE"}
                                    className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 disabled:opacity-40"
                                    value={ticket.price}
                                    onChange={(e) => updateTicket(ticket.id, "price", parseFloat(e.target.value))}
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Inventory</label>
                                 <input
                                    type="number"
                                    className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/5"
                                    value={ticket.totalQuantity}
                                    onChange={(e) => updateTicket(ticket.id, "totalQuantity", parseInt(e.target.value))}
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Min Batch</label>
                                 <input
                                    type="number"
                                    className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/5"
                                    value={ticket.groupSize}
                                    onChange={(e) => updateTicket(ticket.id, "groupSize", parseInt(e.target.value))}
                                 />
                              </div>
                           </div>
                        </div>
                    </div>
                ))}
               </div>
            </div>
          )}

          {/* STEP 5: REGISTRATION */}
          {currentStep === 5 && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Left Column: Flow Strategy */}
                  <div className="bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100 space-y-8 hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 transition-all group/card">
                     <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                        <div className="w-10 h-10 rounded-xl bg-white text-primary flex items-center justify-center shadow-sm group-hover/card:bg-primary group-hover/card:text-white transition-all">
                           <ShieldCheck size={20} />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Checkout Strategy</h3>
                     </div>

                     <div className="space-y-4">
                        <button
                          onClick={() => setRegistration({...registration, mode: "FULL_DETAILS"})}
                          className={`w-full p-8 rounded-[2rem] border-4 text-left transition-all ${
                            registration.mode === "FULL_DETAILS"
                            ? "border-primary bg-blue-50 ring-8 ring-primary/5"
                            : "border-gray-50 hover:border-gray-100 bg-white"
                          }`}
                        >
                           <div className="flex items-center gap-4 mb-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${registration.mode === "FULL_DETAILS" ? "bg-primary text-white shadow-lg" : "bg-gray-100 text-gray-400"}`}>
                                 <Users size={18} />
                              </div>
                              <p className="font-black text-gray-900 text-lg">Comprehensive Mode</p>
                           </div>
                           <p className="text-xs text-gray-500 font-medium leading-relaxed pl-14">Collect full details for every attendee. Recommended for conferences, workshops, or high-stakes events.</p>
                        </button>

                        <button
                          onClick={() => setRegistration({...registration, mode: "BASIC_QUANTITY"})}
                          className={`w-full p-8 rounded-[2rem] border-4 text-left transition-all ${
                            registration.mode === "BASIC_QUANTITY"
                            ? "border-primary bg-blue-50 ring-8 ring-primary/5"
                            : "border-gray-50 hover:border-gray-100 bg-white"
                          }`}
                        >
                           <div className="flex items-center gap-4 mb-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${registration.mode === "BASIC_QUANTITY" ? "bg-primary text-white shadow-lg" : "bg-gray-100 text-gray-400"}`}>
                                 <Ticket size={18} />
                              </div>
                              <p className="font-black text-gray-900 text-lg">Express Mode</p>
                           </div>
                           <p className="text-xs text-gray-500 font-medium leading-relaxed pl-14">Best for concerts or parties. Only collect data from the buyer and a total count for guests.</p>
                        </button>
                     </div>
                  </div>

                  {/* Right Column: Grouping Logic */}
                  <div className="bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100 space-y-8 hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 transition-all group/card">
                     <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                        <div className="w-10 h-10 rounded-xl bg-white text-amber-600 flex items-center justify-center shadow-sm group-hover/card:bg-amber-600 group-hover/card:text-white transition-all">
                           <Users size={20} />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Team & Grouping</h3>
                     </div>

                     <div className="space-y-4">
                        <label className="flex items-center gap-5 p-8 bg-gray-50 rounded-[2rem] cursor-pointer hover:bg-gray-100 transition-colors">
                           <input
                            type="checkbox"
                            className="w-8 h-8 rounded-xl border-gray-200 text-primary focus:ring-primary cursor-pointer shadow-sm"
                            checked={registration.isGroupingEnabled}
                            onChange={(e) => setRegistration({...registration, isGroupingEnabled: e.target.checked})}
                           />
                           <div>
                              <p className="text-lg font-black text-gray-900">Enable Attendee Teams</p>
                              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">Allow users to form or join groups during checkout</p>
                           </div>
                        </label>

                        {registration.isGroupingEnabled && (
                           <div className="ml-10 p-8 bg-white border-2 border-primary/10 rounded-[2rem] animate-in slide-in-from-left-4">
                              <label className="flex items-center gap-5 cursor-pointer">
                                 <input
                                    type="checkbox"
                                    className="w-6 h-6 rounded-lg border-gray-200 text-primary focus:ring-primary cursor-pointer shadow-sm"
                                    checked={registration.enforceUniqueGroupNames}
                                    onChange={(e) => setRegistration({...registration, enforceUniqueGroupNames: e.target.checked})}
                                 />
                                 <div>
                                    <p className="font-black text-gray-900 uppercase tracking-widest text-xs">Strict Team Names</p>
                                    <p className="text-[10px] text-gray-400 font-bold">Prevent duplicate team/group identifiers</p>
                                 </div>
                              </label>
                           </div>
                        )}
                     </div>
                  </div>
               </div>

               {/* Custom Fields Section */}
               <div className="bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100 space-y-8 hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 transition-all group/card">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
                     <div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Custom Data Collection</h3>
                        <p className="text-sm text-gray-500 font-medium">Capture specific attendee data like dietary needs.</p>
                     </div>
                     <button
                       onClick={addField}
                       className="flex items-center gap-2 bg-gray-900 text-white font-black px-6 py-4 rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-900/10 text-xs uppercase tracking-widest"
                     >
                       <Plus size={16} />
                       Add Field
                     </button>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                     {registration.fields.map((field, idx) => (
                        <div key={idx} className="flex flex-col lg:flex-row items-center gap-4 lg:gap-8 p-6 bg-white rounded-3xl group relative border border-gray-100 shadow-sm hover:border-primary/20 transition-all">
                           <div className="flex-1 w-full space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Field Display Name</label>
                              <input
                                 type="text"
                                 placeholder="e.g., T-Shirt Size"
                                 className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold shadow-sm"
                                 value={field.label}
                                 onChange={(e) => updateField(idx, "label", e.target.value)}
                                 disabled={idx < 2}
                              />
                           </div>
                           <div className="w-full lg:w-48 space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Input Style</label>
                              <div className="relative">
                                 <select
                                    className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold shadow-sm appearance-none"
                                    value={field.type}
                                    onChange={(e) => updateField(idx, "type", e.target.value as any)}
                                    disabled={idx < 2}
                                 >
                                    <option value="text">Text Input</option>
                                    <option value="number">Numeric</option>
                                    <option value="select">Dropdown</option>
                                    <option value="checkbox">Checkbox</option>
                                 </select>
                                 <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                              </div>
                           </div>
                           <div className="flex items-center gap-8 px-4 h-16">
                              <label className="flex items-center gap-3 cursor-pointer">
                                 <input
                                    type="checkbox"
                                    checked={field.required}
                                    onChange={(e) => updateField(idx, "required", e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-200 text-primary cursor-pointer shadow-sm"
                                    disabled={idx < 2}
                                 />
                                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Required</span>
                              </label>
                              <label className="flex items-center gap-3 cursor-pointer">
                                 <input
                                    type="checkbox"
                                    checked={field.isPerAttendee}
                                    onChange={(e) => updateField(idx, "isPerAttendee", e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-200 text-primary cursor-pointer shadow-sm"
                                    disabled={idx < 2}
                                 />
                                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Per Attendee</span>
                              </label>
                           </div>
                           {idx >= 2 && (
                              <button
                                 onClick={() => removeField(idx)}
                                 className="w-12 h-12 bg-white text-gray-400 hover:text-rose-500 rounded-2xl flex items-center justify-center shadow-sm hover:shadow transition-all"
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

          {/* STEP 6: REVIEW */}
          {currentStep === 6 && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-500">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  {/* Summary Details */}
                  <div className="lg:col-span-2 space-y-8">
                     <div className="bg-gray-50/50 rounded-[2.5rem] p-8 md:p-10 space-y-10 border border-gray-100 shadow-sm relative overflow-hidden transition-all hover:bg-white hover:shadow-xl">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>

                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                           <div className="space-y-1">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Event Title</p>
                              <h4 className="text-2xl font-black text-gray-900 leading-tight">{basicInfo.title || "Untitled Event"}</h4>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Category</p>
                              <span className="bg-primary text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest">
                                 {basicInfo.category || "General"}
                              </span>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Launch Date</p>
                              <p className="text-lg font-bold text-gray-900">
                                 {basicInfo.startDate ? new Date(basicInfo.startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : "Not Set"}
                              </p>
                              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                                 {basicInfo.startDate ? new Date(basicInfo.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                              </p>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Venue / Format</p>
                              <p className="text-lg font-bold text-gray-900">{basicInfo.type}</p>
                              <p className="text-xs text-gray-500 font-medium line-clamp-1 mt-1">{basicInfo.location || basicInfo.virtualLink || "Address pending"}</p>
                           </div>
                        </div>

                        <div className="relative z-10 pt-10 border-t border-gray-200/60">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Ticketing Structure</p>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {tickets.map((t, i) => (
                                 <div key={i} className="bg-white p-5 rounded-3xl border border-gray-200 flex items-center justify-between group hover:border-emerald-500/20 transition-all shadow-lg hover:shadow-emerald-900/5">
                                    <div>
                                       <p className="text-sm font-black text-gray-900 group-hover:text-emerald-600 transition-colors">{t.name}</p>
                                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t.type} • {t.totalQuantity} units</p>
                                    </div>
                                    <p className="text-lg font-black text-gray-900">₦{t.price.toLocaleString()}</p>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Sidebar Actions */}
                  <div className="space-y-6">
                     <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white space-y-8 shadow-2xl shadow-blue-900/20 relative overflow-hidden">
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/20 rounded-full blur-3xl"></div>
                        <div className="relative z-10 space-y-4">
                           <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-primary backdrop-blur-md mb-6">
                              <ShieldCheck size={32} />
                           </div>
                           <h4 className="text-2xl font-black tracking-tight leading-tight">Ready for Launch?</h4>
                           <p className="text-gray-400 text-sm leading-relaxed font-medium">Once published, your event will immediately go live on the Gobokin discovery engine.</p>
                        </div>

                        <div className="relative z-10 space-y-3">
                           <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                              <CheckCircle2 size={14} />
                              Social Ready
                           </div>
                           <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                              <CheckCircle2 size={14} />
                              Secure Checkout
                           </div>
                        </div>
                     </div>

                     <div className="bg-amber-50 p-8 rounded-[2rem] border-2 border-amber-100">
                        <p className="text-xs text-amber-800 font-bold italic leading-relaxed underline-offset-4 decoration-amber-200">
                              &quot;Review your refund policy in settings. This event will inherit your global defaults.&quot;
                        </p>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="bg-gray-50 px-6 md:px-12 py-10 border-t border-gray-100 flex items-center justify-between">
           <button
             onClick={() => setCurrentStep(currentStep - 1)}
             disabled={currentStep === 1 || loading}
             className={`flex items-center gap-3 font-black text-xs uppercase tracking-[0.2em] transition-all px-8 py-4 rounded-2xl border-2 ${
               currentStep === 1 ? "opacity-0 invisible" : "bg-white text-gray-500 border-transparent hover:bg-gray-100 hover:text-gray-900"
             }`}
           >
             <ArrowLeft size={16} />
             Previous
           </button>

           <div className="flex items-center gap-6">
               <span className="hidden sm:block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {currentStep < 6 ? `Next: ${steps[currentStep].title}` : 'Last Step'}
               </span>
               {currentStep < 6 ? (
                  <button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="flex items-center gap-3 bg-primary text-white font-black px-12 py-5 rounded-2xl hover:bg-opacity-90 transition-all shadow-2xl shadow-primary/30 uppercase tracking-[0.2em] text-xs group"
                  >
                    Continue
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
               ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center gap-3 bg-emerald-600 text-white font-black px-12 py-5 rounded-2xl hover:bg-opacity-90 transition-all shadow-2xl shadow-emerald-900/30 uppercase tracking-[0.2em] text-xs disabled:opacity-50"
                  >
                    {loading ? "Launching..." : "Publish Event"}
                    <ShieldCheck size={18} />
                  </button>
               )}
           </div>
        </div>
      </div>

      {/* Visual Support Badges */}
      <div className="mt-12 flex flex-wrap items-center justify-center gap-10 opacity-30 grayscale pointer-events-none px-4">
          <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.25em] text-gray-600">
              <ShieldCheck size={16} />
              Verified Payment
          </div>
          <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.25em] text-gray-600">
              <Globe size={16} />
              Global Engine
          </div>
          <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.25em] text-gray-600">
              <Share2 size={16} />
              Social Optimization
          </div>
      </div>
    </div>
  );
};

export default CreateEvent;
