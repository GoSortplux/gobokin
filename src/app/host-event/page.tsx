"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Type,
  Layout,
  Tag,
  Calendar,
  Clock,
  MapPin,
  Globe,
  Users,
  ChevronDown,
  Info,
  ShieldCheck,
  User,
  Plus,
  Trash2,
  FileText,
  CheckCircle2,
  Sparkles,
  Zap,
  Eye,
  EyeOff,
  Image as ImageIcon,
  XCircle
} from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { EventType, RegistrationMode, Speaker } from "@/types";
import Swal from "@/utils/sweetalert";

const steps = [
  { id: 1, title: "Identity", icon: Type },
  { id: 2, title: "Speakers", icon: Users },
  { id: 3, title: "Settings", icon: ShieldCheck },
  { id: 4, title: "Narrative", icon: FileText },
];

const STORAGE_KEY = "gobokin_hosting_draft";

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
    isPublic: boolean;
  };
  speakers: Speaker[];
  agendaEnabled: boolean;
}

const LivePreview = ({ basicInfo, speakers, agendaEnabled }: LivePreviewProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!agendaEnabled && activeTab === "schedule") {
      setActiveTab("overview");
    }
  }, [agendaEnabled, activeTab]);

  const tabs = ["overview", "speakers"];

  return (
    <div className="sticky top-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/50 overflow-hidden h-[calc(100vh-12rem)] overflow-y-auto no-scrollbar transition-all duration-500 hover:shadow-gray-300/50">
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-50 px-8 py-5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Live Preview</span>
        </div>
      </div>

      <div className="p-6 space-y-10">
        {/* Banner Placeholder */}
        <div className="relative aspect-video rounded-[2rem] overflow-hidden shadow-inner bg-gray-50 group">
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-3">
              <ImageIcon size={40} strokeWidth={1.5} />
              <p className="text-[10px] font-bold uppercase tracking-widest text-center px-4">Banner will be added in Step 5</p>
            </div>
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
            {basicInfo.isPublic === false && (
                <span className="px-3.5 py-1.5 rounded-full bg-gray-100 text-gray-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-gray-200">
                    <EyeOff size={10} />
                    Private
                </span>
            )}
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
           <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-gray-50 rounded-2xl border border-gray-100 w-fit">
              {tabs.map(tab => (
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
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-primary rounded-full"></div>
                        <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">About Event</p>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap font-medium">
                        {basicInfo.description || "Enter a description in Step 4 to see it here..."}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "speakers" && (
                  <div className="grid grid-cols-1 gap-6 animate-in fade-in duration-500">
                      {speakers.length === 0 ? (
                          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest text-center py-10">No speakers added yet</p>
                      ) : (
                        speakers.map((speaker, i) => (
                            <div key={i} className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-3xl border border-gray-100/50">
                                <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-300">
                                    <User size={24} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-black text-gray-900 truncate leading-tight">{speaker.name || "Unnamed Speaker"}</p>
                                    <p className="text-[9px] font-bold text-primary uppercase tracking-widest mt-0.5 truncate">{speaker.title || "Position"}</p>
                                </div>
                            </div>
                        ))
                      )}
                  </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

const HostEventPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    basicInfo: {
      title: "",
      slug: "",
      category: "",
      tags: "",
      startDate: "",
      endDate: "",
      type: "PHYSICAL" as EventType,
      location: "",
      virtualLink: "",
      capacity: 0,
      agendaEnabled: false,
      isPublic: true,
      isFeatured: false,
      description: "",
    },
    speakers: [] as Speaker[],
    registration: {
      mode: "FULL_DETAILS" as RegistrationMode,
    }
  });

  // Load Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/events/utils/categories");
        const data = response.data.data || [];
        const categoryNames = data.map((cat: string | { name: string }) =>
          typeof cat === 'string' ? cat : cat.name
        );
        setCategories(categoryNames);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Load Draft
  useEffect(() => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      try {
        setFormData(JSON.parse(savedDraft));
      } catch (e) {
        console.error("Failed to parse draft:", e);
      }
    }
  }, []);

  // Persist Draft
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const handleChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev as any)[section],
        [field]: value
      }
    }));
  };

  const addSpeaker = () => {
    setFormData(prev => ({
      ...prev,
      speakers: [...prev.speakers, { name: "", title: "", bio: "", imageUrl: "" }]
    }));
  };

  const updateSpeaker = (index: number, field: keyof Speaker, value: string) => {
    const newSpeakers = [...formData.speakers];
    newSpeakers[index] = { ...newSpeakers[index], [field]: value };
    setFormData(prev => ({ ...prev, speakers: newSpeakers }));
  };

  const removeSpeaker = (index: number) => {
    setFormData(prev => ({
      ...prev,
      speakers: prev.speakers.filter((_, i) => i !== index)
    }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      handleFinalize();
    }
  };

  const handleFinalize = () => {
    // If not logged in or not an organizer
    const isOrganizer = user?.role?.includes('organizer');

    if (!user) {
        localStorage.setItem("gobokin_host_event_resume", "true");
        localStorage.setItem("returnUrl", "/apply-organizer");
        router.push("/auth/register");
    } else if (!isOrganizer) {
        localStorage.setItem("gobokin_host_event_resume", "true");
        router.push("/apply-organizer");
    } else {
        // Already an organizer
        localStorage.setItem("gobokin_event_creation_draft_auto_resume", "true");
        router.push("/organizer/dashboard/events/create");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20 px-4">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8 px-4">
          <div>
            <h1 className="text-5xl font-black text-primary tracking-tight leading-none mb-3 uppercase">Host Your Vision</h1>
            <p className="text-gray-500 font-medium text-lg">Bring your event to life in 4 simple steps.</p>
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
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 mb-10 px-4 md:px-10 overflow-x-auto no-scrollbar">
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center gap-3 group relative">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                  currentStep === step.id
                    ? "bg-primary text-white shadow-xl shadow-primary/30 scale-110"
                    : currentStep > step.id
                    ? "bg-secondary/10 text-secondary border border-secondary/20"
                    : "bg-gray-50 text-gray-300 border border-gray-100"
                }`}
              >
                <step.icon size={24} strokeWidth={currentStep === step.id ? 3 : 2} />
                {currentStep > step.id && (
                  <div className="absolute -top-1 -right-1 bg-secondary text-white rounded-full p-1 border-2 border-white">
                    <CheckCircle2 size={12} strokeWidth={4} />
                  </div>
                )}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${
                currentStep === step.id ? "text-primary" : "text-gray-400"
              }`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start">
        {/* Form Container */}
        <div className="flex-1 bg-white rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="p-8 md:p-10 lg:p-12">
            {currentStep === 1 && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Event Title</label>
                    <input
                      type="text"
                      placeholder="e.g., Summer Music Festival"
                      className="w-full p-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-sm"
                      value={formData.basicInfo.title}
                      onChange={(e) => handleChange("basicInfo", "title", e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Category</label>
                    <div className="relative">
                      <select
                        className="w-full p-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold appearance-none outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 shadow-sm"
                        value={formData.basicInfo.category}
                        onChange={(e) => handleChange("basicInfo", "category", e.target.value)}
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat, idx) => (
                          <option key={idx} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <ChevronDown size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Keywords / Tags</label>
                    <input
                      type="text"
                      placeholder="Music, Festival, Outdoor, Fun (comma separated)"
                      className="w-full p-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-sm"
                      value={formData.basicInfo.tags}
                      onChange={(e) => handleChange("basicInfo", "tags", e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      className="w-full p-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-sm"
                      value={formData.basicInfo.startDate}
                      onChange={(e) => handleChange("basicInfo", "startDate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">End Date & Time</label>
                    <input
                      type="datetime-local"
                      className="w-full p-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-sm"
                      value={formData.basicInfo.endDate}
                      onChange={(e) => handleChange("basicInfo", "endDate", e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-10 border-t border-gray-100 space-y-8">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Event Format</label>
                  <div className="grid grid-cols-3 gap-4">
                    {["PHYSICAL", "ONLINE", "HYBRID"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleChange("basicInfo", "type", type)}
                        className={`py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                          formData.basicInfo.type === type
                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                            : "bg-white text-gray-400 border-gray-100 hover:bg-gray-50"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  {formData.basicInfo.type !== "ONLINE" && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Venue Address</label>
                      <div className="relative">
                        <MapPin size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" />
                        <input
                          type="text"
                          placeholder="Street, City, State"
                          className="w-full pl-14 pr-6 py-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-sm"
                          value={formData.basicInfo.location}
                          onChange={(e) => handleChange("basicInfo", "location", e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Max Capacity</label>
                    <div className="relative">
                      <Users size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" />
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full pl-14 pr-6 py-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-sm"
                        value={formData.basicInfo.capacity}
                        onChange={(e) => handleChange("basicInfo", "capacity", parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-12 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Speakers & Guests</h3>
                    <p className="text-sm text-gray-400 font-medium">Add people who will be speaking or performing.</p>
                  </div>
                  <button
                    onClick={addSpeaker}
                    className="flex items-center gap-3 bg-gray-900 text-white font-black px-8 py-5 rounded-3xl hover:bg-black transition-all shadow-xl shadow-gray-900/20 text-[10px] uppercase tracking-widest"
                  >
                    <Plus size={18} />
                    Add Speaker
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {formData.speakers.map((speaker, idx) => (
                    <div key={idx} className="p-8 bg-gray-50 rounded-[2.5rem] space-y-6 relative group border border-transparent hover:border-primary/10 hover:bg-white transition-all">
                      <button
                        onClick={() => removeSpeaker(idx)}
                        className="absolute top-6 right-6 text-gray-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                      <div className="space-y-4">
                        <input
                          type="text"
                          placeholder="Speaker Name"
                          className="w-full p-5 bg-white border border-gray-300 rounded-2xl text-sm font-bold outline-none focus:border-primary shadow-sm"
                          value={speaker.name}
                          onChange={(e) => updateSpeaker(idx, "name", e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Job Title / Organization"
                          className="w-full p-5 bg-white border border-gray-300 rounded-2xl text-sm font-bold outline-none focus:border-primary shadow-sm"
                          value={speaker.title}
                          onChange={(e) => updateSpeaker(idx, "title", e.target.value)}
                        />
                        <textarea
                          placeholder="Short bio..."
                          rows={3}
                          className="w-full p-5 bg-white border border-gray-300 rounded-2xl text-sm font-bold outline-none focus:border-primary resize-none shadow-sm"
                          value={speaker.bio}
                          onChange={(e) => updateSpeaker(idx, "bio", e.target.value)}
                        />
                      </div>
                      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-relaxed">
                          Image upload will be available in the organizer dashboard.
                        </p>
                      </div>
                    </div>
                  ))}
                  {formData.speakers.length === 0 && (
                    <div className="md:col-span-2 py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300">
                      <Users size={48} strokeWidth={1} />
                      <p className="text-xs font-black uppercase tracking-[0.3em] mt-4">No speakers added yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-12 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 bg-gray-50 rounded-[2.5rem] flex items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-white text-secondary flex items-center justify-center shadow-sm border border-gray-100">
                        <Calendar size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Agenda Mode</h4>
                        <p className="text-[10px] text-gray-400 font-medium">Enable session schedule</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleChange("basicInfo", "agendaEnabled", !formData.basicInfo.agendaEnabled)}
                      className={`w-14 h-8 rounded-full transition-all relative ${formData.basicInfo.agendaEnabled ? "bg-secondary" : "bg-gray-200"}`}
                    >
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${formData.basicInfo.agendaEnabled ? "left-7" : "left-1"}`} />
                    </button>
                  </div>

                  <div className="p-8 bg-gray-50 rounded-[2.5rem] flex items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-white text-primary flex items-center justify-center shadow-sm border border-gray-100">
                        <Globe size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Public Listing</h4>
                        <p className="text-[10px] text-gray-400 font-medium">Visible to everyone</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleChange("basicInfo", "isPublic", !formData.basicInfo.isPublic)}
                      className={`w-14 h-8 rounded-full transition-all relative ${formData.basicInfo.isPublic ? "bg-primary" : "bg-gray-200"}`}
                    >
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${formData.basicInfo.isPublic ? "left-7" : "left-1"}`} />
                    </button>
                  </div>

                  <div className="p-8 bg-gray-50 rounded-[2.5rem] md:col-span-2 space-y-6">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-white text-amber-500 flex items-center justify-center shadow-sm border border-gray-100">
                        <Sparkles size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Registration Mode</h4>
                        <p className="text-[10px] text-gray-400 font-medium">How do guests register?</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => handleChange("registration", "mode", "FULL_DETAILS")}
                        className={`p-6 rounded-3xl text-left border-2 transition-all ${
                          formData.registration.mode === "FULL_DETAILS"
                            ? "bg-white border-primary shadow-xl shadow-primary/10"
                            : "bg-gray-100/50 border-transparent text-gray-400"
                        }`}
                      >
                        <p className="text-[10px] font-black uppercase tracking-widest mb-2">Full Details</p>
                        <p className="text-[11px] font-medium leading-relaxed">Collect information for every single attendee in an order.</p>
                      </button>
                      <button
                        onClick={() => handleChange("registration", "mode", "BASIC_QUANTITY")}
                        className={`p-6 rounded-3xl text-left border-2 transition-all ${
                          formData.registration.mode === "BASIC_QUANTITY"
                            ? "bg-white border-primary shadow-xl shadow-primary/10"
                            : "bg-gray-100/50 border-transparent text-gray-400"
                        }`}
                      >
                        <p className="text-[10px] font-black uppercase tracking-widest mb-2">Basic Quantity</p>
                        <p className="text-[11px] font-medium leading-relaxed">Only collect the buyer's information, regardless of quantity.</p>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-12 animate-in fade-in duration-500">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 text-secondary flex items-center justify-center shadow-sm border border-gray-100">
                      <FileText size={24} />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Tell Your Story</h3>
                  </div>
                  <textarea
                    rows={12}
                    placeholder="Provide a detailed description of your event. What can attendees expect? What's the main attraction?"
                    className="w-full p-8 bg-white border border-gray-300 rounded-[2.5rem] text-sm font-bold focus:border-secondary focus:ring-4 focus:ring-secondary/5 transition-all outline-none min-h-[300px] shadow-sm"
                    value={formData.basicInfo.description}
                    onChange={(e) => handleChange("basicInfo", "description", e.target.value)}
                  />
                </div>

                <div className="bg-amber-50 border border-amber-100 p-8 rounded-[2rem] flex items-start gap-6">
                  <Zap className="text-amber-500 shrink-0 mt-1" size={24} />
                  <div className="space-y-2">
                    <h4 className="font-black text-amber-900 text-sm uppercase tracking-widest">One Final Step</h4>
                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                      You've successfully outlined your event! To protect your vision and start selling tickets, we need you to create an account and a quick organizer profile. Your progress will be saved automatically.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 px-8 py-10 md:px-12 flex items-center justify-between border-t border-gray-100">
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={currentStep === 1}
              className={`flex items-center gap-3 font-black text-[10px] uppercase tracking-widest px-10 py-5 rounded-3xl border-2 border-gray-200 transition-all ${
                currentStep === 1 ? "opacity-0 invisible" : "bg-white text-gray-400 hover:text-gray-900 hover:border-gray-900"
              }`}
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-4 bg-primary text-white font-black px-14 py-6 rounded-[2.5rem] hover:bg-opacity-90 transition-all shadow-xl shadow-primary/30 uppercase tracking-[0.2em] text-[11px] group"
            >
              {currentStep === 4 ? "Register to Finalize Event" : "Next Step"}
              <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-500" />
            </button>
          </div>
        </div>

        {/* Live Preview Pane (Desktop) */}
        {showPreview && (
          <div className="hidden lg:block w-[400px] xl:w-[480px] shrink-0 animate-in fade-in slide-in-from-right-12 duration-1000 ease-out">
            <LivePreview
              basicInfo={formData.basicInfo}
              speakers={formData.speakers}
              agendaEnabled={formData.basicInfo.agendaEnabled}
            />
          </div>
        )}
        </div>
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
              basicInfo={formData.basicInfo}
              speakers={formData.speakers}
              agendaEnabled={formData.basicInfo.agendaEnabled}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default HostEventPage;
