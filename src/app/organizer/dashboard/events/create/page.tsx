"use client";
import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  FileText,
  Eye,
  EyeOff,
  Zap,
  Sparkles,
  UploadCloud,
  Upload,
  Coins,
  History,
  MousePointer2
} from "lucide-react";
import api from "@/services/api";
import axios from "axios";
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

interface LivePreviewProps {
  basicInfo: {
    title: string;
    description: string;
    type: string;
    startDate: string;
    endDate: string;
    location: string;
    virtualLink: string;
    capacity: number;
    category: string;
  };
  mediaInfo: {
    bannerUrl: string;
    seoTitle: string;
    seoDescription: string;
  };
  sessions: {
    title: string;
    startTime: string;
  }[];
  tickets: {
    name: string;
    price: number;
    type: string;
  }[];
}

const LivePreview = ({ basicInfo, mediaInfo, sessions, tickets }: LivePreviewProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="sticky top-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/50 overflow-hidden h-[calc(100vh-4rem)] overflow-y-auto no-scrollbar transition-all duration-500 hover:shadow-gray-300/50">
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-50 px-8 py-5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Live Preview</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-[8px] font-black text-primary bg-primary/5 px-2.5 py-1 rounded-full uppercase tracking-widest border border-primary/10">Attendee View</span>
        </div>
      </div>

      <div className="p-6 space-y-10">
        {/* Banner */}
        <div className="relative aspect-video rounded-[2rem] overflow-hidden shadow-inner bg-gray-50 group">
          {mediaInfo.bannerUrl ? (
            <Image src={mediaInfo.bannerUrl} alt="Preview" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-3">
              <ImageIcon size={40} strokeWidth={1.5} />
              <p className="text-[10px] font-bold uppercase tracking-widest">Banner Placeholder</p>
            </div>
          )}
          <div className="absolute top-4 left-4">
             <div className="bg-white/95 backdrop-blur-sm px-3.5 py-2 rounded-2xl shadow-xl shadow-black/5 flex items-center gap-3 border border-white">
                <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex flex-col items-center justify-center leading-none">
                   <span className="text-[8px] font-black uppercase tracking-widest mb-0.5">
                     {basicInfo.startDate ? new Date(basicInfo.startDate).toLocaleDateString(undefined, { month: 'short' }) : 'MON'}
                   </span>
                   <span className="text-base font-black">
                     {basicInfo.startDate ? new Date(basicInfo.startDate).toLocaleDateString(undefined, { day: 'numeric' }) : '00'}
                   </span>
                </div>
                <div className="h-6 w-[1px] bg-gray-100"></div>
                <div>
                   <p className="text-[10px] font-black text-gray-900 leading-tight">
                     {basicInfo.startDate ? new Date(basicInfo.startDate).toLocaleDateString(undefined, { weekday: 'long' }) : 'Day'}
                   </p>
                   <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                     {basicInfo.startDate ? new Date(basicInfo.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00'}
                   </p>
                </div>
             </div>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/10">
              {basicInfo.category || "Category"}
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-secondary/5 text-secondary text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-secondary/10">
              <Zap size={10} />
              {basicInfo.type}
            </span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">
            {basicInfo.title || "Your Event Title"}
          </h2>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 transition-all hover:bg-white hover:shadow-lg hover:shadow-gray-200/20">
              <div className="w-10 h-10 bg-white text-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100">
                <MapPin size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Location</p>
                <p className="text-[11px] font-bold text-gray-700 truncate leading-none">{basicInfo.location || basicInfo.virtualLink || "Location pending"}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 transition-all hover:bg-white hover:shadow-lg hover:shadow-gray-200/20">
              <div className="w-10 h-10 bg-white text-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100">
                <Users size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Capacity</p>
                <p className="text-[11px] font-bold text-gray-700 leading-none">{basicInfo.capacity || 0} Slots Available</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="space-y-6">
           <div className="flex items-center gap-1.5 p-1.5 bg-gray-50 rounded-2xl border border-gray-100 w-fit">
              {["overview", "schedule", "tickets"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                    activeTab === tab ? "bg-white text-primary shadow-sm border border-gray-100" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {tab}
                </button>
              ))}
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm min-h-[250px] relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

              {activeTab === "overview" && (
                <div className="space-y-5 animate-in fade-in duration-500">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-primary rounded-full"></div>
                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">About Event</p>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap font-medium">
                    {basicInfo.description || "Enter a description to see it here..."}
                  </p>
                </div>
              )}

              {activeTab === "schedule" && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  {sessions.map((session, i) => (
                    <div key={i} className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-xs flex-shrink-0 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                          {i + 1}
                        </div>
                        {i !== sessions.length - 1 && <div className="flex-1 w-[1px] bg-gray-100 my-2"></div>}
                      </div>
                      <div className="space-y-1.5 min-w-0 pt-1">
                        <p className="text-[11px] font-black text-gray-900 truncate tracking-tight">{session.title || "Untitled Session"}</p>
                        <div className="flex items-center gap-2">
                            <Clock size={10} className="text-primary" />
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                            {session.startTime ? new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "tickets" && (
                <div className="space-y-4 animate-in fade-in duration-500">
                   {tickets.map((ticket, i) => (
                     <div key={i} className="p-5 rounded-[1.5rem] border border-gray-100 bg-gray-50/50 space-y-4 transition-all hover:bg-white hover:shadow-xl hover:shadow-gray-200/20 group">
                        <div className="flex justify-between items-center">
                          <p className="text-[11px] font-black text-gray-900 group-hover:text-primary transition-colors">{ticket.name || "Untitled Tier"}</p>
                          <span className="text-[8px] font-black text-secondary bg-secondary/5 px-2 py-1 rounded-lg uppercase tracking-widest border border-secondary/10">{ticket.type}</span>
                        </div>
                        <div className="flex items-end gap-1">
                            <p className="text-xl font-black text-gray-900 tracking-tight">₦{ticket.price.toLocaleString()}</p>
                            <span className="text-[9px] text-gray-400 font-bold mb-1 uppercase">/ pax</span>
                        </div>
                     </div>
                   ))}
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

const CreateEvent = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

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
    ] as { name: string; label: string; type: string; required: boolean; isPerAttendee: boolean }[],
  });

  // Media Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleBannerUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Get presigned URL
      const presignedResponse = await api.get('/halls/media/presigned-url', {
        params: { fileName: file.name, fileType: file.type }
      });
      const { uploadUrl, publicUrl } = presignedResponse.data.data;

      // 2. Upload to R2
      await axios.put(uploadUrl, file, {
        headers: { 'Content-Type': file.type },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || file.size));
          setUploadProgress(percent);
        }
      });

      // 3. Finalize
      await api.post('/halls/media/upload', {
        media: [{ url: publicUrl, fileType: file.type }]
      });

      setMediaInfo(prev => ({ ...prev, bannerUrl: publicUrl }));
      Swal.toast.fire({ icon: 'success', title: 'Banner uploaded successfully!' });
    } catch (error) {
      console.error('Upload failed:', error);
      Swal.fire('Error', 'Failed to upload banner. Please try again.', 'error');
    } finally {
      setIsUploading(false);
    }
  }, []);

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

  const removeSession = (sessionId: string) => {
    if (sessions.length > 1) setSessions(sessions.filter(s => s.id !== sessionId));
  };

  const updateSession = (sessionId: string, field: string, value: string) => {
    setSessions(sessions.map(s => s.id === sessionId ? { ...s, [field]: value } : s));
  };

  const addTicket = () => {
    setTickets([...tickets, { id: Math.random().toString(), name: "", price: 0, type: "PAID", totalQuantity: 0, groupSize: 1, description: "" }]);
  };

  const removeTicket = (ticketId: string) => {
    if (tickets.length > 1) setTickets(tickets.filter(t => t.id !== ticketId));
  };

  const updateTicket = (ticketId: string, field: string, value: string | number) => {
    setTickets(tickets.map(t => t.id === ticketId ? { ...t, [field]: value } : t));
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

  const updateField = (index: number, field: string, value: string | boolean) => {
    const newFields = [...registration.fields];
    newFields[index] = { ...newFields[index], [field]: value };
    setRegistration({ ...registration, fields: newFields });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      Swal.showLoading();
      const payload = {
        title: basicInfo.title,
        description: basicInfo.description,
        type: basicInfo.type,
        startDate: basicInfo.startDate,
        endDate: basicInfo.endDate,
        location: basicInfo.type === 'ONLINE' ? 'Virtual' : (basicInfo.location || 'Virtual'),
        virtualLink: basicInfo.virtualLink,
        capacity: basicInfo.capacity,
        category: basicInfo.category,
        bannerUrl: mediaInfo.bannerUrl,
        tags: basicInfo.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ""),
        sessions: sessions.map(({ id, ...rest }) => ({
          title: rest.title,
          description: rest.description,
          startTime: rest.startTime,
          endTime: rest.endTime,
          location: rest.location || (basicInfo.type === 'ONLINE' ? 'Virtual' : (basicInfo.location || 'Virtual'))
        })),
        tickets: tickets.map(({ id, ...rest }) => ({
          name: rest.name,
          price: rest.type === 'FREE' ? 0 : rest.price,
          type: rest.type,
          totalQuantity: rest.totalQuantity,
          groupSize: rest.groupSize,
          description: rest.description
        })),
        registrationMode: registration.mode,
        isGroupingEnabled: registration.isGroupingEnabled,
        enforceUniqueGroupNames: registration.enforceUniqueGroupNames,
        registrationFields: registration.fields.map(f => ({
          name: f.name || f.label.toLowerCase().replace(/\s+/g, '-'),
          label: f.label,
          type: f.type,
          required: f.required,
          isPerAttendee: f.isPerAttendee
        })),
      };

      const response = await api.post("/events", { data: payload });

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
    <div className="max-w-[1600px] mx-auto py-6 lg:py-10 px-4">
      {/* Header Area */}
      <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8 px-4">
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-primary transition-all mb-4 group font-black text-[10px] uppercase tracking-[0.2em]">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Overview
          </button>
          <h1 className="text-5xl font-black text-primary tracking-tight leading-none mb-3">Create Event</h1>
          <p className="text-gray-500 font-medium text-lg">Bring your vision to life in a few simple steps.</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                setIsPreviewModalOpen(true);
              } else {
                setShowPreview(!showPreview);
              }
            }}
            className="flex items-center gap-2.5 bg-white text-gray-500 font-black px-6 py-4 rounded-2xl border border-gray-100 shadow-sm hover:bg-gray-50 hover:text-primary transition-all text-[10px] uppercase tracking-[0.2em]"
          >
            <Eye size={16} />
            <span className="hidden sm:inline">{showPreview ? "Hide Preview" : "Show Preview"}</span>
            <span className="sm:hidden">Preview</span>
          </button>

          {/* Step Indicator Desktop */}
          <div className="hidden xl:flex items-center gap-1.5 bg-gray-50 p-2 rounded-[2.5rem] border border-gray-100">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-500 relative group cursor-help ${
                  currentStep === step.id
                  ? "bg-primary text-white shadow-xl shadow-primary/30 scale-110"
                  : currentStep > step.id ? "text-secondary bg-white border border-secondary/20" : "text-gray-300 hover:text-gray-400"
                }`}
              >
                <step.icon size={16} strokeWidth={currentStep === step.id ? 3 : 2} />
                {currentStep > step.id && (
                    <div className="absolute -top-1 -right-1 bg-secondary text-white rounded-full p-0.5 border-2 border-white">
                        <CheckCircle2 size={10} strokeWidth={4} />
                    </div>
                )}
                {/* Tooltip */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
                    {step.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 items-start px-2">
        {/* Main Form Container */}
        <div className={`flex-1 w-full bg-white rounded-[3rem] border border-gray-100 shadow-2xl shadow-gray-200/40 overflow-hidden transition-all duration-700 ease-in-out`}>
          {/* Mobile Progress Bar */}
          <div className="lg:hidden bg-white px-6 py-6 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-5">
                 <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-base shadow-xl shadow-primary/20">
                    {currentStep}
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Current Milestone</p>
                    <span className="text-base font-black text-gray-900 leading-none">{steps[currentStep-1].title}</span>
                 </div>
              </div>
              <div className="flex gap-1.5">
                 {steps.map(s => (
                    <div key={s.id} className={`w-2 h-2 rounded-full transition-all duration-500 ${s.id === currentStep ? 'w-6 bg-primary' : s.id < currentStep ? 'bg-secondary' : 'bg-gray-200'}`}></div>
                 ))}
              </div>
          </div>

          <div className="p-8 md:p-10 lg:p-12">
            {/* STEP 1: BASIC DETAILS */}
            {currentStep === 1 && (
              <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                 {/* Section 1: Event Identity */}
                 <div className="space-y-10 group/section">
                    <div className="flex items-center gap-5">
                       <div className="w-14 h-14 rounded-2xl bg-gray-50 text-primary flex items-center justify-center transition-all group-hover/section:bg-primary group-hover/section:text-white group-hover/section:rotate-3 shadow-sm border border-gray-100">
                          <Type size={24} />
                       </div>
                       <div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Event Identity</h3>
                            <p className="text-sm text-gray-400 font-medium">Define the core personality of your event.</p>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                       <div className="space-y-3 md:col-span-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Official Event Title</label>
                          <input
                            type="text"
                            name="title"
                            required
                            placeholder="e.g., Annual Tech Summit 2024"
                            className="w-full p-5 sm:p-6 bg-white border border-gray-300 rounded-[1.5rem] sm:rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none placeholder:text-gray-400 shadow-sm"
                            value={basicInfo.title}
                            onChange={handleBasicChange}
                          />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Event Category</label>
                          <div className="relative">
                             <Layout size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" />
                             <input
                                type="text"
                                name="category"
                                placeholder="Music, Sports, AI..."
                                className="w-full pl-14 pr-6 py-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none placeholder:text-gray-400 shadow-sm"
                                value={basicInfo.category}
                                onChange={handleBasicChange}
                             />
                          </div>
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Search Keywords</label>
                          <div className="relative">
                             <Tag size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" />
                             <input
                                type="text"
                                name="tags"
                                placeholder="Comma separated tags"
                                className="w-full pl-14 pr-6 py-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none placeholder:text-gray-400 shadow-sm"
                                value={basicInfo.tags}
                                onChange={handleBasicChange}
                             />
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Section 2: Date & Time */}
                 <div className="space-y-10 group/section">
                    <div className="flex items-center gap-5">
                       <div className="w-14 h-14 rounded-2xl bg-gray-50 text-primary flex items-center justify-center transition-all group-hover/section:bg-primary group-hover/section:text-white group-hover/section:-rotate-3 shadow-sm border border-gray-100">
                          <Calendar size={24} />
                       </div>
                       <div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Timeline</h3>
                            <p className="text-sm text-gray-400 font-medium">When should attendees mark their calendars?</p>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Event Commences</label>
                          <div className="relative">
                             <Clock size={18} className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-primary" />
                             <input
                                type="datetime-local"
                                name="startDate"
                                className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-5 sm:py-6 bg-white border border-gray-300 rounded-[1.5rem] sm:rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-sm"
                                value={basicInfo.startDate}
                                onChange={handleBasicChange}
                             />
                          </div>
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Event Concludes</label>
                          <div className="relative">
                             <Clock size={18} className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-primary" />
                             <input
                                type="datetime-local"
                                name="endDate"
                                className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-5 sm:py-6 bg-white border border-gray-300 rounded-[1.5rem] sm:rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-sm"
                                value={basicInfo.endDate}
                                onChange={handleBasicChange}
                             />
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Section 3: Location & Format */}
                 <div className="space-y-10 group/section">
                    <div className="flex items-center gap-5">
                       <div className="w-14 h-14 rounded-2xl bg-gray-50 text-primary flex items-center justify-center transition-all group-hover/section:bg-primary group-hover/section:text-white group-hover/section:scale-110 shadow-sm border border-gray-100">
                          <MapPin size={24} />
                       </div>
                       <div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Location & Format</h3>
                            <p className="text-sm text-gray-400 font-medium">Choose where the magic happens.</p>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-3 md:col-span-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Access Method</label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                             {["PHYSICAL", "ONLINE", "HYBRID"].map((type) => (
                                <button
                                   key={type}
                                   type="button"
                                   onClick={() => setBasicInfo({...basicInfo, type: type as EventType})}
                                   className={`py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] border-2 transition-all ${
                                      basicInfo.type === type
                                      ? "bg-primary text-white border-primary shadow-xl shadow-primary/20"
                                      : "bg-white border-gray-100 text-gray-400 hover:border-gray-200 hover:bg-gray-50"
                                   }`}
                                >
                                   {type}
                                </button>
                             ))}
                          </div>
                       </div>
                       {basicInfo.type !== "ONLINE" && (
                          <div className="space-y-3 md:col-span-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Physical Venue Address</label>
                             <div className="relative">
                                <MapPin size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" />
                                <input
                                   type="text"
                                   name="location"
                                   placeholder="Street address, City, State"
                                   className="w-full pl-14 pr-6 py-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none placeholder:text-gray-400 shadow-sm"
                                   value={basicInfo.location}
                                   onChange={handleBasicChange}
                                />
                             </div>
                          </div>
                       )}
                       {basicInfo.type !== "PHYSICAL" && (
                          <div className="space-y-3 md:col-span-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Digital Meeting Link</label>
                             <div className="relative">
                                <Globe size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" />
                                <input
                                   type="url"
                                   name="virtualLink"
                                   placeholder="https://zoom.us/j/..."
                                   className="w-full pl-14 pr-6 py-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none placeholder:text-gray-400 shadow-sm"
                                   value={basicInfo.virtualLink}
                                   onChange={handleBasicChange}
                                />
                             </div>
                          </div>
                       )}
                       <div className="space-y-3 md:col-span-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Attendee Capacity</label>
                          <div className="relative">
                             <Users size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" />
                             <input
                                type="number"
                                name="capacity"
                                className="w-full pl-14 pr-6 py-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-sm"
                                value={basicInfo.capacity}
                                onChange={handleBasicChange}
                             />
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Section 4: Bio */}
                 <div className="space-y-10 group/section">
                    <div className="flex items-center gap-5">
                       <div className="w-14 h-14 rounded-2xl bg-gray-50 text-secondary flex items-center justify-center transition-all group-hover/section:bg-secondary group-hover/section:text-white shadow-sm border border-gray-100">
                          <FileText size={24} />
                       </div>
                       <div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Detailed Narrative</h3>
                            <p className="text-sm text-gray-400 font-medium">Tell the story of your event.</p>
                       </div>
                    </div>
                    <textarea
                      name="description"
                      rows={8}
                      placeholder="Describe your event in detail. What should attendees expect?"
                      className="w-full p-8 bg-white border border-gray-300 rounded-[2.5rem] text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none placeholder:text-gray-400 min-h-[200px] shadow-sm"
                      value={basicInfo.description}
                      onChange={handleBasicChange}
                    />
                 </div>
              </div>
            )}

            {/* STEP 2: MEDIA & SEO */}
            {currentStep === 2 && (
              <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                 <div className="grid grid-cols-1 gap-12">
                    <div className="space-y-10">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-gray-50 text-primary flex items-center justify-center shadow-sm border border-gray-100">
                                <ImageIcon size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Visual Identity</h3>
                                <p className="text-sm text-gray-400 font-medium">Upload a captivating banner for your event.</p>
                            </div>
                        </div>

                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                          <div
                            className={`bg-gray-50 rounded-[3rem] p-8 border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center space-y-6 group/upload shadow-sm h-full relative overflow-hidden min-h-[400px]
                              ${isUploading ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-white hover:border-primary/30 cursor-pointer'}
                            `}
                          >
                            <input
                              type="file"
                              className="absolute inset-0 opacity-0 cursor-pointer z-20"
                              onChange={handleBannerUpload}
                              accept="image/*"
                              disabled={isUploading}
                            />

                            {mediaInfo.bannerUrl && !isUploading ? (
                               <div className="relative w-full h-full rounded-[2rem] overflow-hidden shadow-2xl group-hover/upload:scale-[0.98] transition-transform duration-500">
                                  <Image src={mediaInfo.bannerUrl} alt="Banner" fill className="object-cover" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                      <div className="bg-white px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 shadow-2xl flex items-center gap-3">
                                          <Upload size={16} />
                                          Update Banner
                                      </div>
                                  </div>
                               </div>
                            ) : isUploading ? (
                               <div className="flex flex-col items-center gap-6 animate-pulse w-full px-10">
                                   <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center text-primary">
                                        <UploadCloud size={40} className="animate-bounce" />
                                   </div>
                                   <div className="w-full space-y-3">
                                       <div className="flex justify-between text-[10px] font-black text-primary uppercase tracking-widest">
                                           <span>Uploading Art</span>
                                           <span>{uploadProgress}%</span>
                                       </div>
                                       <div className="w-full h-3 bg-primary/10 rounded-full overflow-hidden">
                                           <div
                                             className="h-full bg-primary transition-all duration-300"
                                             style={{ width: `${uploadProgress}%` }}
                                           />
                                       </div>
                                   </div>
                               </div>
                            ) : (
                               <>
                                  <div className="w-24 h-24 rounded-[2rem] bg-white shadow-xl shadow-gray-200 flex items-center justify-center text-gray-300 group-hover/upload:text-primary group-hover/upload:scale-110 group-hover/upload:rotate-3 transition-all duration-500">
                                    <Plus size={48} />
                                  </div>
                                  <div className="text-center space-y-2">
                                    <p className="text-xs font-black text-gray-900 uppercase tracking-[0.3em]">Drop your masterpiece here</p>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">or click to browse gallery</p>
                                  </div>
                                  <div className="flex items-center gap-4 pt-4">
                                      <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 text-[8px] font-black text-gray-400 uppercase tracking-widest">JPG</div>
                                      <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 text-[8px] font-black text-gray-400 uppercase tracking-widest">PNG</div>
                                      <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 text-[8px] font-black text-gray-400 uppercase tracking-widest">WEBP</div>
                                  </div>
                               </>
                            )}
                          </div>

                          <div className="space-y-10 flex flex-col justify-center">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Asset Source URL</label>
                                <div className="relative">
                                    <Globe size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
                                    <input
                                      type="text"
                                      name="bannerUrl"
                                      placeholder="https://..."
                                      className="w-full pl-14 pr-6 py-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none placeholder:text-gray-400 shadow-sm"
                                      value={mediaInfo.bannerUrl}
                                      onChange={handleMediaChange}
                                    />
                                </div>
                            </div>
                            <div className="bg-gray-900 p-10 rounded-[3rem] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                                <Sparkles className="text-primary mb-6" size={32} strokeWidth={1.5} />
                                <h4 className="text-lg font-black text-white tracking-tight mb-3">Optimization Protocol</h4>
                                <p className="text-sm text-gray-400 font-medium leading-relaxed">
                                    Our engine automatically compresses and serves your images via a global CDN. For best results, use a 16:9 aspect ratio image with at least 1920px width.
                                </p>
                            </div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-10">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-gray-50 text-secondary flex items-center justify-center shadow-sm border border-gray-100">
                                <Search size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Discovery Engine Optimization</h3>
                                <p className="text-sm text-gray-400 font-medium">Control how your event appears on search engines & social media.</p>
                            </div>
                        </div>

                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                          <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">SEO Title Tag</label>
                                <input
                                  type="text"
                                  name="seoTitle"
                                  placeholder="Catchy title for Google results"
                                  className="w-full p-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none placeholder:text-gray-400 shadow-sm"
                                  value={mediaInfo.seoTitle}
                                  onChange={handleMediaChange}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Social Preview Image</label>
                                <input
                                  type="text"
                                  name="socialImage"
                                  placeholder="URL for FB/Twitter card previews"
                                  className="w-full p-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none placeholder:text-gray-400 shadow-sm"
                                  value={mediaInfo.socialImage}
                                  onChange={handleMediaChange}
                                />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Meta Description</label>
                            <textarea
                                name="seoDescription"
                                rows={6}
                                placeholder="Write a brief summary to entice searchers..."
                                className="w-full p-8 bg-white border border-gray-300 rounded-[2.5rem] text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none h-full min-h-[150px] placeholder:text-gray-400 shadow-sm"
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
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                    <div>
                       <h3 className="text-4xl font-black text-gray-900 tracking-tight leading-none mb-3">Event Timeline</h3>
                       <p className="text-lg text-gray-500 font-medium">Add sessions, keynotes, or breaks to your event.</p>
                    </div>
                    <button
                      onClick={addSession}
                      className="flex items-center gap-3 bg-primary text-white font-black px-8 py-5 rounded-[2rem] hover:shadow-2xl hover:shadow-primary/30 transition-all text-[10px] uppercase tracking-[0.25em] active:scale-95 group"
                    >
                      <Plus size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                      Add Session
                    </button>
                 </div>

                 <div className="space-y-8">
                  {sessions.map((session, index) => (
                      <div key={session.id} className="relative group animate-in slide-in-from-left-8 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                          <div className="bg-gray-50/50 rounded-[3rem] p-8 md:p-12 space-y-10 border border-gray-100 transition-all duration-700 hover:bg-white hover:shadow-3xl hover:shadow-gray-200/50 relative overflow-hidden group/card">
                             {/* Floating Index Decor */}
                             <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover/card:opacity-100 transition-opacity"></div>

                             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-white text-primary flex items-center justify-center font-black text-xl shadow-xl shadow-gray-200/50 border border-gray-100 group-hover/card:bg-primary group-hover/card:text-white transition-all duration-500">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Session Protocol</p>
                                        <h4 className="text-xl font-black text-gray-900 tracking-tight">{session.title || 'Draft Session'}</h4>
                                    </div>
                                </div>
                                {sessions.length > 1 && (
                                   <button
                                     onClick={() => removeSession(session.id)}
                                     className="w-14 h-14 flex items-center justify-center text-gray-300 hover:text-secondary bg-white rounded-2xl shadow-sm hover:shadow-2xl hover:scale-110 transition-all border border-gray-100 group/trash"
                                   >
                                      <Trash2 size={20} className="group-hover/trash:rotate-12 transition-transform" />
                                   </button>
                                )}
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                                <div className="space-y-3 md:col-span-2">
                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                       <Type size={12} className="text-primary" />
                                       Session Title
                                   </label>
                                   <input
                                   type="text"
                                   placeholder="e.g., Welcome Keynote: Future of Gobokin"
                                   className="w-full p-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-sm"
                                   value={session.title}
                                   onChange={(e) => updateSession(session.id, "title", e.target.value)}
                                   />
                                </div>
                                <div className="space-y-3">
                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                       <History size={12} className="text-primary" />
                                       Starts At
                                   </label>
                                   <input
                                   type="datetime-local"
                                   className="w-full p-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-sm"
                                   value={session.startTime}
                                   onChange={(e) => updateSession(session.id, "startTime", e.target.value)}
                                   />
                                </div>
                                <div className="space-y-3">
                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                       <History size={12} className="text-primary" />
                                       Ends At
                                   </label>
                                   <input
                                   type="datetime-local"
                                   className="w-full p-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-sm"
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
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                    <div>
                       <h3 className="text-4xl font-black text-gray-900 tracking-tight leading-none mb-3">Ticket Vault</h3>
                       <p className="text-lg text-gray-500 font-medium">Configure access and monetization for your event.</p>
                    </div>
                    <button
                      onClick={addTicket}
                      className="flex items-center gap-3 bg-secondary text-white font-black px-8 py-5 rounded-[2rem] hover:bg-opacity-90 transition-all shadow-3xl shadow-secondary/30 text-[10px] uppercase tracking-[0.25em] active:scale-95 group"
                    >
                      <Plus size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                      Create Tier
                    </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
                  {tickets.map((ticket, index) => (
                      <div key={ticket.id} className="p-8 md:p-10 bg-gray-50/50 rounded-[3.5rem] border border-gray-100 space-y-10 relative group/ticket hover:bg-white hover:shadow-4xl hover:shadow-secondary/10 transition-all duration-700 animate-in zoom-in-95 duration-500">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-white text-secondary flex items-center justify-center shadow-xl shadow-gray-200/50 border border-gray-100 group-hover/ticket:bg-secondary group-hover/ticket:text-white transition-all duration-500">
                                   <Ticket size={24} strokeWidth={2} />
                                </div>
                                <div>
                                    <h4 className="font-black text-gray-900 uppercase tracking-[0.3em] text-[10px]">Tier #{index+1}</h4>
                                    <p className="text-sm font-black text-gray-400 mt-1">{ticket.name || 'Untitled Tier'}</p>
                                </div>
                             </div>
                             {tickets.length > 1 && (
                                <button
                                  onClick={() => removeTicket(ticket.id)}
                                  className="w-14 h-14 flex items-center justify-center text-gray-300 hover:text-secondary bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all border border-gray-100 group/trash"
                                >
                                   <Trash2 size={20} className="group-hover/trash:rotate-12 transition-transform" />
                                </button>
                             )}
                          </div>

                          <div className="space-y-8">
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <Type size={12} className="text-secondary" />
                                    Public Name
                                </label>
                                <input
                                   type="text"
                                   placeholder="e.g., VIP Early Bird"
                                   className="w-full p-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-secondary focus:ring-4 focus:ring-secondary/5 outline-none transition-all shadow-sm"
                                   value={ticket.name}
                                   onChange={(e) => updateTicket(ticket.id, "name", e.target.value)}
                                />
                             </div>

                             <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                       <MousePointer2 size={12} className="text-secondary" />
                                       Pricing Model
                                   </label>
                                   <div className="relative">
                                       <select
                                          className="w-full pl-5 pr-10 py-5 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-secondary focus:ring-4 focus:ring-secondary/5 outline-none appearance-none shadow-sm"
                                          value={ticket.type}
                                          onChange={(e) => updateTicket(ticket.id, "type", e.target.value as TicketType)}
                                       >
                                          <option value="FREE">Complimentary</option>
                                          <option value="PAID">Premium Access</option>
                                       </select>
                                       <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                                   </div>
                                </div>
                                <div className="space-y-3">
                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                       <Coins size={12} className="text-secondary" />
                                       Unit Price
                                   </label>
                                   <div className="relative">
                                       <span className="absolute left-5 top-1/2 -translate-y-1/2 text-secondary font-black text-xs">₦</span>
                                       <input
                                          type="number"
                                          disabled={ticket.type === "FREE"}
                                          className="w-full pl-10 pr-5 py-5 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-secondary focus:ring-4 focus:ring-secondary/5 disabled:bg-gray-100 disabled:opacity-50 outline-none shadow-sm"
                                          value={ticket.price}
                                          onChange={(e) => updateTicket(ticket.id, "price", parseFloat(e.target.value))}
                                       />
                                   </div>
                                </div>
                                <div className="space-y-3">
                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                       <Layers size={12} className="text-secondary" />
                                       Total Inventory
                                   </label>
                                   <input
                                      type="number"
                                      className="w-full px-5 py-5 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-secondary focus:ring-4 focus:ring-secondary/5 outline-none shadow-sm"
                                      value={ticket.totalQuantity}
                                      onChange={(e) => updateTicket(ticket.id, "totalQuantity", parseInt(e.target.value))}
                                   />
                                </div>
                                <div className="space-y-3">
                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                       <Users size={12} className="text-secondary" />
                                       Min Purchase
                                   </label>
                                   <input
                                      type="number"
                                      className="w-full px-5 py-5 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-secondary focus:ring-4 focus:ring-secondary/5 outline-none shadow-sm"
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
              <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Left Column: Flow Strategy */}
                    <div className="space-y-10 group/section">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-gray-50 text-primary flex items-center justify-center shadow-sm border border-gray-100">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Checkout Strategy</h3>
                                <p className="text-sm text-gray-400 font-medium">How do you want to collect data?</p>
                            </div>
                        </div>

                       <div className="space-y-6">
                          <button
                            onClick={() => setRegistration({...registration, mode: "FULL_DETAILS"})}
                            className={`w-full p-8 rounded-[2.5rem] border-4 text-left transition-all duration-500 relative overflow-hidden group ${
                              registration.mode === "FULL_DETAILS"
                              ? "border-primary bg-primary/[0.02] shadow-2xl shadow-primary/10"
                              : "border-transparent bg-gray-50 hover:bg-white hover:border-gray-100"
                            }`}
                          >
                             <div className="flex items-center gap-5 mb-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${registration.mode === "FULL_DETAILS" ? "bg-primary text-white shadow-xl shadow-primary/30" : "bg-white text-gray-300 shadow-sm border border-gray-100"}`}>
                                   <Users size={24} />
                                </div>
                                <div>
                                    <p className="font-black text-gray-900 text-xl tracking-tight">Comprehensive</p>
                                    <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Full Attendee Profile</p>
                                </div>
                             </div>
                             <p className="text-xs text-gray-400 font-medium leading-relaxed pl-[4.5rem]">Optimized for conferences and professional networking where you need data for every guest.</p>
                          </button>

                          <button
                            onClick={() => setRegistration({...registration, mode: "BASIC_QUANTITY"})}
                            className={`w-full p-8 rounded-[2.5rem] border-4 text-left transition-all duration-500 relative overflow-hidden group ${
                              registration.mode === "BASIC_QUANTITY"
                              ? "border-primary bg-primary/[0.02] shadow-2xl shadow-primary/10"
                              : "border-transparent bg-gray-50 hover:bg-white hover:border-gray-100"
                            }`}
                          >
                             <div className="flex items-center gap-5 mb-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${registration.mode === "BASIC_QUANTITY" ? "bg-primary text-white shadow-xl shadow-primary/30" : "bg-white text-gray-300 shadow-sm border border-gray-100"}`}>
                                   <Ticket size={24} />
                                </div>
                                <div>
                                    <p className="font-black text-gray-900 text-xl tracking-tight">Express Flow</p>
                                    <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Buyer Only Data</p>
                                </div>
                             </div>
                             <p className="text-xs text-gray-400 font-medium leading-relaxed pl-[4.5rem]">Designed for high-speed ticket sales like concerts or parties where guest data is optional.</p>
                          </button>
                       </div>
                    </div>

                    {/* Right Column: Grouping Logic */}
                    <div className="space-y-10 group/section">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-gray-50 text-secondary flex items-center justify-center shadow-sm border border-gray-100">
                                <Users size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Collaborative Booking</h3>
                                <p className="text-sm text-gray-400 font-medium">Enable social and group registrations.</p>
                            </div>
                        </div>

                       <div className="space-y-6">
                          <label className="flex items-center gap-6 p-8 bg-gray-50 rounded-[2.5rem] cursor-pointer hover:bg-white hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 border border-transparent hover:border-secondary/10">
                             <div className="relative">
                                <input
                                    type="checkbox"
                                    className="peer sr-only"
                                    checked={registration.isGroupingEnabled}
                                    onChange={(e) => setRegistration({...registration, isGroupingEnabled: e.target.checked})}
                                />
                                <div className="w-14 h-8 bg-gray-200 rounded-full peer-checked:bg-secondary transition-colors"></div>
                                <div className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full peer-checked:translate-x-6 transition-transform shadow-sm"></div>
                             </div>
                             <div>
                                <p className="text-lg font-black text-gray-900 tracking-tight">Activate Team Mode</p>
                                <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mt-1">Attendees can form or join squads</p>
                             </div>
                          </label>

                          {registration.isGroupingEnabled && (
                             <div className="p-8 bg-secondary/5 rounded-[2.5rem] border border-secondary/10 animate-in slide-in-from-top-4 duration-500">
                                <label className="flex items-center gap-5 cursor-pointer">
                                   <input
                                      type="checkbox"
                                      className="w-6 h-6 rounded-lg border-gray-200 text-secondary focus:ring-secondary cursor-pointer shadow-sm transition-all"
                                      checked={registration.enforceUniqueGroupNames}
                                      onChange={(e) => setRegistration({...registration, enforceUniqueGroupNames: e.target.checked})}
                                   />
                                   <div>
                                      <p className="font-black text-gray-900 uppercase tracking-widest text-[10px]">Strict Identity Check</p>
                                      <p className="text-[9px] text-secondary font-black uppercase tracking-widest mt-1">Unique team names only</p>
                                   </div>
                                </label>
                             </div>
                          )}

                          <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl"></div>
                                <h4 className="text-sm font-black uppercase tracking-widest mb-3">Community Feature</h4>
                                <p className="text-xs text-gray-400 leading-relaxed font-medium">Team mode increases viral reach as attendees invite their friends to join their squad.</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Custom Fields Section */}
                 <div className="space-y-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-10">
                       <div>
                          <h3 className="text-3xl font-black text-gray-900 tracking-tight">Intelligence Gathering</h3>
                          <p className="text-sm text-gray-500 font-medium">Capture custom data points from your attendees.</p>
                       </div>
                       <button
                         onClick={addField}
                         className="flex items-center gap-3 bg-gray-900 text-white font-black px-8 py-5 rounded-3xl hover:bg-black transition-all shadow-2xl shadow-gray-900/20 text-[10px] uppercase tracking-[0.2em]"
                       >
                         <Plus size={18} />
                         Add Dynamic Field
                       </button>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                       {registration.fields.map((field, idx) => (
                          <div key={idx} className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10 p-8 bg-gray-50 rounded-[3rem] group relative border border-transparent hover:border-primary/10 hover:bg-white transition-all duration-500 hover:shadow-xl hover:shadow-gray-200/50">
                             <div className="flex-1 w-full space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Label Name</label>
                                <input
                                   type="text"
                                   placeholder="e.g., T-Shirt Size"
                                   className="w-full p-5 bg-white border border-gray-300 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-sm"
                                   value={field.label}
                                   onChange={(e) => updateField(idx, "label", e.target.value)}
                                   disabled={idx < 2}
                                />
                             </div>
                             <div className="w-full lg:w-56 space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Input Archetype</label>
                                <div className="relative">
                                   <select
                                      className="w-full p-5 bg-white border border-gray-300 rounded-2xl text-sm font-bold appearance-none outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                                      value={field.type}
                                      onChange={(e) => updateField(idx, "type", e.target.value)}
                                      disabled={idx < 2}
                                   >
                                      <option value="text">Standard Text</option>
                                      <option value="number">Numeric Only</option>
                                      <option value="select">Dropdown Menu</option>
                                      <option value="checkbox">Multi-Selection</option>
                                   </select>
                                   <ChevronDown size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                                </div>
                             </div>
                             <div className="flex items-center gap-10 px-6 h-20 bg-white/50 rounded-2xl border border-gray-50">
                                <label className="flex items-center gap-3 cursor-pointer group/toggle">
                                   <input
                                      type="checkbox"
                                      checked={field.required}
                                      onChange={(e) => updateField(idx, "required", e.target.checked)}
                                      className="w-6 h-6 rounded-lg border-gray-200 text-primary cursor-pointer shadow-sm transition-all"
                                      disabled={idx < 2}
                                   />
                                   <span className="text-[10px] font-black text-gray-400 group-hover/toggle:text-gray-900 uppercase tracking-widest transition-colors">Mandatory</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group/toggle">
                                   <input
                                      type="checkbox"
                                      checked={field.isPerAttendee}
                                      onChange={(e) => updateField(idx, "isPerAttendee", e.target.checked)}
                                      className="w-6 h-6 rounded-lg border-gray-200 text-primary cursor-pointer shadow-sm transition-all"
                                      disabled={idx < 2}
                                   />
                                   <span className="text-[10px] font-black text-gray-400 group-hover/toggle:text-gray-900 uppercase tracking-widest transition-colors">Granular</span>
                                </label>
                             </div>
                             {idx >= 2 && (
                                <button
                                   onClick={() => removeField(idx)}
                                   className="w-14 h-14 bg-white text-gray-300 hover:text-secondary rounded-2xl flex items-center justify-center shadow-sm hover:shadow-xl hover:scale-110 transition-all border border-gray-100"
                                >
                                   <Trash2 size={20} />
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
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                 <div className="grid grid-cols-1 gap-12">
                    <div className="space-y-10">
                       <div className="bg-gray-900 rounded-[3.5rem] p-10 md:p-16 text-white relative overflow-hidden shadow-3xl shadow-gray-900/40 group">
                          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-[2000ms]"></div>
                          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

                          <div className="relative z-10 space-y-14">
                             <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 border-b border-white/5 pb-12">
                                <div>
                                   <div className="flex items-center gap-3 mb-4">
                                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Final Verification</p>
                                   </div>
                                   <h2 className="text-5xl font-black tracking-tight leading-tight max-w-2xl">{basicInfo.title || "Your Spectacular Event"}</h2>
                                </div>
                                <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center text-primary backdrop-blur-2xl border border-white/10 shadow-2xl">
                                   <ShieldCheck size={48} strokeWidth={1.5} />
                                </div>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                                <div className="space-y-3">
                                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Industry Category</p>
                                   <div className="inline-flex bg-primary/10 text-primary text-[11px] font-black px-6 py-2.5 rounded-2xl uppercase tracking-widest border border-primary/20">
                                      {basicInfo.category || "General"}
                                   </div>
                                </div>
                                <div className="space-y-3">
                                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Launch Chronology</p>
                                   <p className="text-2xl font-black tracking-tight italic">
                                      {basicInfo.startDate ? new Date(basicInfo.startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'long' }) : "Date TBD"}
                                   </p>
                                   <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                                        {basicInfo.startDate ? new Date(basicInfo.startDate).toLocaleDateString(undefined, { year: 'numeric' }) : ""}
                                   </p>
                                </div>
                                <div className="space-y-3">
                                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Event Infrastructure</p>
                                   <p className="text-2xl font-black tracking-tight">{basicInfo.type}</p>
                                   <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest line-clamp-1">{basicInfo.location || basicInfo.virtualLink || 'Global Access'}</p>
                                </div>
                             </div>

                             <div className="pt-12 border-t border-white/5">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-10">Economic Model</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                   {tickets.map((t, i) => (
                                      <div key={i} className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 flex items-center justify-between group/ticket hover:bg-white/10 transition-all duration-500">
                                         <div>
                                            <p className="text-lg font-black text-white tracking-tight">{t.name}</p>
                                            <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mt-1 group-hover/ticket:text-primary transition-colors">{t.type} • {t.totalQuantity} Units</p>
                                         </div>
                                         <p className="text-2xl font-black text-primary tracking-tighter">₦{t.price.toLocaleString()}</p>
                                      </div>
                                   ))}
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="bg-secondary/5 p-10 rounded-[3rem] border border-secondary/10 flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-secondary/5">
                          <div className="w-20 h-20 bg-secondary text-white rounded-[2rem] flex items-center justify-center flex-shrink-0 shadow-2xl shadow-secondary/40 rotate-3">
                             <CheckCircle2 size={40} strokeWidth={2} />
                          </div>
                          <div className="text-center md:text-left">
                             <h4 className="font-black text-secondary text-2xl uppercase tracking-tighter">Validation Engine: Ready</h4>
                             <p className="text-secondary/60 text-sm font-medium leading-relaxed mt-2 max-w-xl">
                                We&apos;ve scanned your event configuration and everything looks perfect. Your event is now eligible for premium placement in the Discovery Engine.
                             </p>
                          </div>
                          <div className="md:ml-auto">
                              <div className="flex -space-x-4">
                                  {[1,2,3,4].map(i => (
                                      <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center overflow-hidden grayscale">
                                          <Users size={20} className="text-gray-300" />
                                      </div>
                                  ))}
                              </div>
                              <p className="text-[10px] font-black text-secondary uppercase tracking-widest mt-2 text-center">Live Audience Ready</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="bg-white px-8 md:px-16 py-12 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-8">
             <button
               onClick={() => setCurrentStep(currentStep - 1)}
               disabled={currentStep === 1 || loading}
               className={`flex items-center gap-4 font-black text-[10px] uppercase tracking-[0.3em] transition-all px-10 py-5 rounded-3xl border-2 ${
                 currentStep === 1 ? "opacity-0 invisible" : "bg-white text-gray-400 border-gray-100 hover:text-gray-900 hover:border-gray-900 shadow-sm"
               }`}
             >
               <ArrowLeft size={16} />
               Retract
             </button>

             <div className="flex items-center gap-8">
                 <div className="hidden sm:flex flex-col items-end">
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em] mb-1">Upcoming Sequence</p>
                    <span className="text-xs font-black text-gray-900 uppercase tracking-widest">
                        {currentStep < 6 ? steps[currentStep].title : 'Mission Completion'}
                    </span>
                 </div>
                 {currentStep < 6 ? (
                    <button
                      onClick={() => setCurrentStep(currentStep + 1)}
                      className="flex items-center gap-4 bg-primary text-white font-black px-14 py-6 rounded-[2.5rem] hover:bg-opacity-90 transition-all shadow-3xl shadow-primary/30 uppercase tracking-[0.3em] text-[11px] group active:scale-95"
                    >
                      Advance
                      <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-500" />
                    </button>
                 ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex items-center gap-4 bg-secondary text-white font-black px-14 py-6 rounded-[2.5rem] hover:bg-opacity-90 transition-all shadow-3xl shadow-secondary/30 uppercase tracking-[0.3em] text-[11px] disabled:opacity-50 active:scale-95 group"
                    >
                      {loading ? "Igniting..." : "Broadcast Event"}
                      <ShieldCheck size={20} className="group-hover:rotate-12 transition-transform" />
                    </button>
                 )}
             </div>
          </div>
        </div>

        {/* Live Preview Pane (Desktop) */}
        {showPreview && (
          <div className="hidden lg:block w-[400px] xl:w-[480px] shrink-0 animate-in fade-in slide-in-from-right-12 duration-1000 ease-out">
            <LivePreview
              basicInfo={basicInfo}
              mediaInfo={mediaInfo}
              sessions={sessions}
              tickets={tickets}
            />
          </div>
        )}
      </div>

      {/* Live Preview Modal (Mobile) */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-[150] lg:hidden flex flex-col bg-white animate-in slide-in-from-bottom duration-500">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-30">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Event Preview</h3>
            <button
              onClick={() => setIsPreviewModalOpen(false)}
              className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900"
            >
              <XCircle size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <LivePreview
              basicInfo={basicInfo}
              mediaInfo={mediaInfo}
              sessions={sessions}
              tickets={tickets}
            />
          </div>
        </div>
      )}

      {/* Visual Support Badges */}
      <div className="mt-20 flex flex-wrap items-center justify-center gap-16 opacity-10 grayscale pointer-events-none px-4">
          <div className="flex items-center gap-3 font-black text-[11px] uppercase tracking-[0.3em] text-gray-900">
              <ShieldCheck size={20} strokeWidth={1.5} />
              Protocol Secured
          </div>
          <div className="flex items-center gap-3 font-black text-[11px] uppercase tracking-[0.3em] text-gray-900">
              <Globe size={20} strokeWidth={1.5} />
              Decentralized Edge
          </div>
          <div className="flex items-center gap-3 font-black text-[11px] uppercase tracking-[0.3em] text-gray-900">
              <Share2 size={20} strokeWidth={1.5} />
              Viral Propagation
          </div>
      </div>
    </div>
  );
};

export default CreateEvent;
