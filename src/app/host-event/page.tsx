"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  Zap
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

const HostEventPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black text-primary tracking-tight mb-4 uppercase">Host Your Vision</h1>
          <p className="text-gray-500 font-medium max-w-xl mx-auto">
            Fill in your event details. Once complete, you'll be guided to set up your organizer profile and finalize tickets.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 mb-10 px-10">
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

        {/* Form Container */}
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="p-8 md:p-12 lg:p-16">
            {currentStep === 1 && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Event Title</label>
                    <input
                      type="text"
                      placeholder="e.g., Summer Music Festival"
                      className="w-full p-6 bg-gray-50 border-none rounded-3xl text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                      value={formData.basicInfo.title}
                      onChange={(e) => handleChange("basicInfo", "title", e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Category</label>
                    <div className="relative">
                      <select
                        className="w-full p-6 bg-gray-50 border-none rounded-3xl text-sm font-bold appearance-none outline-none focus:ring-4 focus:ring-primary/5"
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
                      className="w-full p-6 bg-gray-50 border-none rounded-3xl text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                      value={formData.basicInfo.tags}
                      onChange={(e) => handleChange("basicInfo", "tags", e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      className="w-full p-6 bg-gray-50 border-none rounded-3xl text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                      value={formData.basicInfo.startDate}
                      onChange={(e) => handleChange("basicInfo", "startDate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">End Date & Time</label>
                    <input
                      type="datetime-local"
                      className="w-full p-6 bg-gray-50 border-none rounded-3xl text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                      value={formData.basicInfo.endDate}
                      onChange={(e) => handleChange("basicInfo", "endDate", e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-10 border-t border-gray-50 space-y-8">
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
                          className="w-full pl-14 pr-6 py-6 bg-gray-50 border-none rounded-3xl text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all outline-none"
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
                        className="w-full pl-14 pr-6 py-6 bg-gray-50 border-none rounded-3xl text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all outline-none"
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
                          className="w-full p-5 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-primary"
                          value={speaker.name}
                          onChange={(e) => updateSpeaker(idx, "name", e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Job Title / Organization"
                          className="w-full p-5 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-primary"
                          value={speaker.title}
                          onChange={(e) => updateSpeaker(idx, "title", e.target.value)}
                        />
                        <textarea
                          placeholder="Short bio..."
                          rows={3}
                          className="w-full p-5 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-primary resize-none"
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
                    className="w-full p-8 bg-gray-50 border-none rounded-[2.5rem] text-sm font-bold focus:ring-4 focus:ring-secondary/5 transition-all outline-none min-h-[300px]"
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
          <div className="bg-gray-50 px-8 py-10 md:px-16 flex items-center justify-between border-t border-gray-100">
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
      </div>
    </div>
  );
};

export default HostEventPage;
